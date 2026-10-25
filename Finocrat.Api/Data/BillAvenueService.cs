using System.Security.Cryptography;
using System.Text;
using System.Xml;

namespace Finocrat.Api.Data
{
    public class BillAvenueService
    {
        private static readonly byte[] Iv =
        {
            0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
            0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f
        };

        private readonly HttpClient _http;
        private readonly IConfiguration _config;

        public BillAvenueService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _http.Timeout = TimeSpan.FromMinutes(2);
            _config = config;
        }

        /// <summary>
        /// Calls the BillAvenue Biller MDM API and returns the decrypted XML response.
        /// </summary>
        public async Task<string> GetBillerInfoXmlAsync(string billerId)
        {
            var xml = $"<?xml version=\"1.0\" encoding=\"UTF-8\"?><billerInfoRequest><billerId>{Esc(billerId)}</billerId></billerInfoRequest>";
            return await PostEncryptedAsync(Require("BillAvenue:MdmUrl"), xml);
        }

        /// <summary>
        /// Calls the BillAvenue Bill Fetch API and returns the decrypted XML response.
        /// </summary>
        public async Task<string> FetchBillXmlAsync(string billerId, IReadOnlyList<string> allowedChannels, string customerMobile, string? customerEmail,
            IEnumerable<KeyValuePair<string, string>> inputs, string? clientIp)
        {
            var agentId = Require("BillAvenue:AgentId");
            const string channel = "INT";
            if (!allowedChannels.Contains(channel, StringComparer.OrdinalIgnoreCase))
                throw new InvalidOperationException("This biller does not support the INT channel");
            var ip = _config["DeviceInfo:Ip"] ?? "127.0.0.1";
            var mac = _config["DeviceInfo:Mac"] ?? "00-00-00-00-00-00";

            var sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><billFetchRequest>");
            sb.Append($"<agentId>{Esc(agentId)}</agentId>");
            sb.Append("<agentDeviceInfo>");
            sb.Append($"<initChannel>{channel}</initChannel>");
            sb.Append($"<ip>{Esc(ip)}</ip>");
            sb.Append($"<mac>{Esc(mac)}</mac>");
            sb.Append("</agentDeviceInfo>");
            sb.Append($"<billerId>{Esc(billerId)}</billerId>");
            sb.Append("<customerInfo>");
            sb.Append($"<customerMobile>{Esc(customerMobile)}</customerMobile>");
            if (!string.IsNullOrWhiteSpace(customerEmail))
                sb.Append($"<customerEmail>{Esc(customerEmail)}</customerEmail>");
            sb.Append("</customerInfo>");
            sb.Append("<inputParams>");
            foreach (var kv in inputs)
                sb.Append($"<input><paramName>{Esc(kv.Key)}</paramName><paramValue>{Esc(kv.Value)}</paramValue></input>");
            sb.Append("</inputParams></billFetchRequest>");

            return await PostEncryptedAsync(Require("BillAvenue:FetchUrl"), sb.ToString());
        }

        /// <summary>
        /// Builds and sends a bill payment request on the configured channel. Amounts are in paise.
        /// billerResponseFields and additionalInfo are echoed from the bill fetch response.
        /// </summary>
        public async Task<string> PayBillXmlAsync(string billerId, long amountPaise, string customerMobile, string? customerEmail,
            IEnumerable<KeyValuePair<string, string>> inputs, IEnumerable<KeyValuePair<string, string>> billerResponseFields,
            IEnumerable<KeyValuePair<string, string>> additionalInfo)
        {
            var agentId = Require("BillAvenue:AgentId");
            var channel = Require("BillAvenue:InitChannel");
            var paymentMode = Require("BillAvenue:PaymentMode");
            var ip = _config["DeviceInfo:Ip"] ?? "127.0.0.1";
            var mac = _config["DeviceInfo:Mac"] ?? "00-00-00-00-00-00";

            var pymentrefId = "FINOCART" + DateTime.Now.ToString("yyyyMMddHHmmss");

            var sb = new StringBuilder();
            sb.Append("<?xml version=\"1.0\" encoding=\"UTF-8\"?><billPaymentRequest>");
            sb.Append($"<agentId>{Esc(agentId)}</agentId>");
            sb.Append("<agentDeviceInfo>");
            sb.Append($"<ip>{Esc(ip)}</ip>");
            sb.Append($"<initChannel>{Esc(channel)}</initChannel>");
            sb.Append($"<mac>{Esc(mac)}</mac>");
            sb.Append("</agentDeviceInfo>");
            sb.Append("<customerInfo>");
            sb.Append($"<customerMobile>{Esc(customerMobile)}</customerMobile>");
            if (!string.IsNullOrWhiteSpace(customerEmail))
                sb.Append($"<customerEmail>{Esc(customerEmail)}</customerEmail>");
            sb.Append("</customerInfo>");
            sb.Append($"<billerId>{Esc(billerId)}</billerId>");
            sb.Append("<inputParams>");
            foreach (var kv in inputs)
                sb.Append($"<input><paramName>{Esc(kv.Key)}</paramName><paramValue>{Esc(kv.Value)}</paramValue></input>");
            sb.Append("</inputParams>");
            sb.Append("<billerResponse>");
            foreach (var kv in billerResponseFields)
                sb.Append($"<{kv.Key}>{Esc(kv.Value)}</{kv.Key}>");
            sb.Append("</billerResponse>");
            foreach (var kv in additionalInfo)
                sb.Append($"<additionalInfo><info><infoName>{Esc(kv.Key)}</infoName><infoValue>{Esc(kv.Value)}</infoValue></info></additionalInfo>");
            sb.Append($"<paymentRefId>{Esc(pymentrefId)}</paymentRefId>");
            sb.Append("<amountInfo>");
            sb.Append($"<amount>{amountPaise}</amount>");
            sb.Append("<currency>356</currency>");
            sb.Append("<custConvFee>0</custConvFee>");
            sb.Append("</amountInfo>");
            sb.Append("<paymentMethod>");
            sb.Append($"<paymentMode>{Esc(paymentMode)}</paymentMode>");
            sb.Append("<quickPay>N</quickPay>");
            sb.Append("<splitPay>N</splitPay>");
            sb.Append("</paymentMethod>");
            // Cash payments require the Remarks info
            if (string.Equals(paymentMode, "Cash", StringComparison.OrdinalIgnoreCase))
                sb.Append("<paymentInfo><info><infoName>Remarks</infoName><infoValue>CashPayment</infoValue></info></paymentInfo>");
            sb.Append("</billPaymentRequest>");

            return await PostEncryptedAsync(Require("BillAvenue:PayUrl"), sb.ToString());
        }

        private async Task<string> PostEncryptedAsync(string baseUrl, string xml)
        {
            var accessCode = Require("BillAvenue:AccessCode");
            var workingKey = Require("BillAvenue:WorkingKey");
            var instituteId = Require("BillAvenue:InstituteId");
            var ver = _config["BillAvenue:Version"] ?? "1.0";

            var requestId = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N").Substring(0, 3);
            var encrypted = Encrypt(xml, workingKey);

         
            

            var url = $"{baseUrl}?accessCode={Uri.EscapeDataString(accessCode)}" +
                      $"&requestId={Uri.EscapeDataString(requestId)}" +
                      $"&ver={Uri.EscapeDataString(ver)}" +
                      $"&instituteId={Uri.EscapeDataString(instituteId)}" +
                      $"&encRequest={encrypted}";

            //using var client = new HttpClient();
            //var apiResponse = await client.PostAsync(url, null);

            using var content = new StringContent(encrypted, Encoding.UTF8, "text/plain");
            using var response = await _http.PostAsync(url, content);
            var body = (await response.Content.ReadAsStringAsync()).Trim();

            if (string.IsNullOrEmpty(body))
                throw new InvalidOperationException($"Empty response from BillAvenue (HTTP {(int)response.StatusCode})");

            // Errors may come back as plain XML instead of an encrypted hex string
            if (body.StartsWith("<"))
                return body;

            return Decrypt(body, workingKey);
        }

        private static string Esc(string s) => System.Security.SecurityElement.Escape(s) ?? string.Empty;

        public static bool IsValidBillerInfo(string xml)
        {
            try
            {
                var doc = new XmlDocument();
                doc.LoadXml(xml);
                return doc.SelectSingleNode("//biller") != null && doc.SelectSingleNode("//errorInfo") == null;
            }
            catch
            {
                return false;
            }
        }

        private string Require(string key) =>
            !string.IsNullOrWhiteSpace(_config[key]) ? _config[key]! : throw new InvalidOperationException($"Missing configuration '{key}'");

        private static byte[] DeriveKey(string workingKey) =>
            MD5.HashData(Encoding.UTF8.GetBytes(workingKey));

        private static string Encrypt(string plainText, string workingKey)
        {
            using var aes = Aes.Create();
            aes.Key = DeriveKey(workingKey);
            aes.IV = Iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            var plain = Encoding.UTF8.GetBytes(plainText);
            var enc = aes.CreateEncryptor().TransformFinalBlock(plain, 0, plain.Length);
            return Convert.ToHexString(enc).ToLowerInvariant();
        }

        private static string Decrypt(string hex, string workingKey)
        {
            using var aes = Aes.Create();
            aes.Key = DeriveKey(workingKey);
            aes.IV = Iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            var bytes = Convert.FromHexString(hex);
            var dec = aes.CreateDecryptor().TransformFinalBlock(bytes, 0, bytes.Length);
            return Encoding.UTF8.GetString(dec);
        }
    }
}
