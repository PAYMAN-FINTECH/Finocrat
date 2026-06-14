using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Security.Cryptography;
using System.Text;
using System.Xml;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BillPaymentsController : ControllerBase
    {

        // ============================================
        // GET CATEGORIES
        // ============================================
        [HttpGet("GetCategories")]
        public IActionResult GetCategories()
        {
            var categories = new List<object>
            {
                new { categoryName = "Agent Collection" },
                new { categoryName = "Broadband Postpaid" },
                new { categoryName = "Cable TV" },
                new { categoryName = "Clubs and Associations" },
                new { categoryName = "Credit Card" },
                new { categoryName = "DTH" },
                new { categoryName = "eChallan" },
                new { categoryName = "Education Fees" },
                new { categoryName = "Electricity" },
                new { categoryName = "EV Recharge" },
                new { categoryName = "Fastag" },
                new { categoryName = "Fleet Card Recharge" },
                new { categoryName = "Gas" },
                new { categoryName = "Housing Society" },
                new { categoryName = "Insurance" },
                new { categoryName = "Landline Postpaid" },
                new { categoryName = "Loan Repayment" },
                new { categoryName = "LPG Gas" },
                new { categoryName = "Mobile Postpaid" },
                new { categoryName = "Mobile Prepaid" },
                new { categoryName = "Municipal Services" },
                new { categoryName = "Municipal Taxes" },
                new { categoryName = "National Pension System" },
                new { categoryName = "NCMC Recharge" },
                new { categoryName = "Prepaid Meter" },
                new { categoryName = "Rental" },
                new { categoryName = "Subscription" },
                new { categoryName = "Water" }
            };

            return Ok(categories);
        }

        [HttpGet("GetBillers")]
        public async Task<IActionResult> GetBillers(string? billerId)
        {
            try
            {
               
                    billerId = "OTME00005XXZ43";
               

                string accessCode = "AVQK82BX18JK12TPIW";
                string workingKey = "DCA8F2B4D6F9BF470504ECE835AEE0D1";
                string instituteId = "FS77";
                string ver = "1.0";
                string requestId = GenerateRequestId();

                // XML Request
                string merchantData = $@"<?xml version=""1.0"" encoding=""UTF-8""?>
<billerInfoRequest>
    <billerId>{billerId}</billerId>
</billerInfoRequest>";

                // Encrypt request
                string encryptedRequest = Encrypt(merchantData, workingKey);

                // Build URL
                string url =
                    $"https://stgapi.billavenue.com/billpay/extMdmCntrl/mdmRequestNew/xml" +
                    $"?accessCode={Uri.EscapeDataString(accessCode)}" +
                    $"&requestId={Uri.EscapeDataString(requestId)}" +
                    $"&ver={Uri.EscapeDataString(ver)}" +
                    $"&instituteId={Uri.EscapeDataString(instituteId)}";

                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(2);

                    var content = new StringContent(
                        encryptedRequest,
                        Encoding.UTF8,
                        "text/plain");

                    HttpResponseMessage response = await client.PostAsync(url, content);

                    string encryptedResponse = await response.Content.ReadAsStringAsync();

                    string decryptedResponse = string.Empty;

                    try
                    {
                        if (!string.IsNullOrWhiteSpace(encryptedResponse))
                        {
                            decryptedResponse = Decrypt(encryptedResponse, workingKey);

                            XmlDocument doc = new XmlDocument();
                            doc.LoadXml(decryptedResponse);

                            string json = JsonConvert.SerializeXmlNode(doc);

                            return Content(json, "application/json");
                        }
                    }
                    catch
                    {
                        decryptedResponse = "Unable to decrypt response.";
                    }

                    return Ok(new
                    {
                        StatusCode = (int)response.StatusCode,
                        IsSuccess = response.IsSuccessStatusCode,

                        RequestUrl = url,
                        RequestId = requestId,

                        XmlRequest = merchantData,
                        EncryptedRequest = encryptedRequest,

                        EncryptedResponse = encryptedResponse,
                        DecryptedResponse = decryptedResponse
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Success = false,
                    Message = ex.Message,
                    StackTrace = ex.StackTrace
                });
            }
        }

        // ============================================
        // FETCH BILL (SAMPLE DATA)
        // ============================================
        [HttpPost("FetchBill")]
        public IActionResult FetchBill([FromBody] FetchBillRequest request)
        {
            try
            {
                var response = new
                {
                    success = true,
                    customerName = "Ramesh Kumar",
                    billNumber = "CC0119951234567899876541",
                    billDate = "2026-06-11",
                    dueDate = "2026-06-11",
                    billAmount = 1250.75,
                    billStatus = "UNPAID",
                    billerId = request.BillerId,
                    cardNumber = request.CardNumber,
                    registeredMobile = request.RegisteredMobile,
                    message = "Bill fetched successfully."
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPost("QueryTransaction")]
        public IActionResult QueryTransaction([FromBody] QueryTransactionRequest request)
        {
            // Simulate a successful response with dummy data
            var dummyResponse = new
            {
                transactionId = "CC0119951234567899876541",
                billerName = "Credit Card Bill",
                amount = 1250.75,
                status = "SUCCESS",
                transactionDate = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss")
            };

            // Optional: return error if input is empty
            if (string.IsNullOrEmpty(request.mobileNumber) && string.IsNullOrEmpty(request.transactionRefId))
            {
                return BadRequest(new { error = "Mobile number or Transaction Reference is required" });
            }

            return Ok(dummyResponse);
        }

        [HttpPost("RaiseComplaint")]
        public IActionResult RaiseComplaint([FromBody] RaiseComplaintRequest request)
        {
            // Validate required fields (optional)
            if (string.IsNullOrEmpty(request.mobileNumber) ||
                string.IsNullOrEmpty(request.complaintType) ||
                string.IsNullOrEmpty(request.description))
            {
                return BadRequest(new { error = "Mobile number, complaint type and description are required" });
            }

            var dummyResponse = new
            {
                complaintId = "CMP" + DateTime.Now.Ticks.ToString().Substring(8),
                status = "Registered",
                message = "Your complaint has been registered successfully. We will update you within 48 hours."
            };

            return Ok(dummyResponse);
        }


        [HttpPost("GetComplaintStatus")]
        public IActionResult GetComplaintStatus([FromBody] ComplaintStatusRequest request)
        {
            if (string.IsNullOrEmpty(request.complaintId))
            {
                return BadRequest(new { error = "Complaint ID is required" });
            }

            // Simulate different statuses based on complaint ID (optional demo logic)
            string status = "In Progress";
            string message = "Your complaint is being reviewed by the biller.";
            if (request.complaintId.Contains("RESOLVED"))
            {
                status = "Resolved";
                message = "Issue fixed. Amount has been refunded.";
            }

            var dummyResponse = new
            {
                complaintId = request.complaintId,
                complaintType = request.complaintType,
                status = status,
                message = message,
                updatedOn = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss")
            };

            return Ok(dummyResponse);
        }


        private string GenerateRequestId()
        {
            // Generates exactly 35 characters
            return Guid.NewGuid().ToString("N") +
                   Guid.NewGuid().ToString("N").Substring(0, 3);
        }

        // ============================================
        // MD5 HASH
        // ============================================
        private string MD5Hash(string input)
        {
            using MD5 md5 = MD5.Create();

            byte[] inputBytes = Encoding.UTF8.GetBytes(input);

            byte[] hashBytes = md5.ComputeHash(inputBytes);

            StringBuilder sb = new StringBuilder();

            foreach (byte b in hashBytes)
            {
                sb.Append(b.ToString("x2"));
            }

            return sb.ToString();
        }

        // ============================================
        // ENCRYPT
        // ============================================
        private string Encrypt(string plainText, string key)
        {
            byte[] keyBytes = HexToBytes(MD5Hash(key));

            byte[] iv =
            {
                0x00, 0x01, 0x02, 0x03,
                0x04, 0x05, 0x06, 0x07,
                0x08, 0x09, 0x0a, 0x0b,
                0x0c, 0x0d, 0x0e, 0x0f
            };

            using Aes aes = Aes.Create();

            aes.Key = keyBytes;
            aes.IV = iv;
            aes.Mode = CipherMode.CBC;
            aes.Padding = PaddingMode.PKCS7;

            ICryptoTransform encryptor = aes.CreateEncryptor();

            byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);

            byte[] encryptedBytes = encryptor.TransformFinalBlock(
                plainBytes,
                0,
                plainBytes.Length
            );

            return BitConverter
                .ToString(encryptedBytes)
                .Replace("-", "")
                .ToLower();
        }

        // ============================================
        // HEX TO BYTES
        // ============================================
        private byte[] HexToBytes(string hex)
        {
            int length = hex.Length;

            byte[] bytes = new byte[length / 2];

            for (int i = 0; i < length; i += 2)
            {
                bytes[i / 2] =
                    Convert.ToByte(hex.Substring(i, 2), 16);
            }

            return bytes;
        }

        private string Decrypt(string encryptedHex, string key)
        {
            byte[] keyBytes = HexToBytes(MD5Hash(key));
            byte[] iv = new byte[16] {
                0x00, 0x01, 0x02, 0x03,
                0x04, 0x05, 0x06, 0x07,
                0x08, 0x09, 0x0a, 0x0b,
                0x0c, 0x0d, 0x0e, 0x0f
            };

            byte[] encryptedBytes = HexToBytes(encryptedHex);

            using (Aes aes = Aes.Create())
            {
                aes.Key = keyBytes;
                aes.IV = iv;
                aes.Mode = CipherMode.CBC;
                aes.Padding = PaddingMode.PKCS7;

                ICryptoTransform decryptor = aes.CreateDecryptor();
                byte[] decrypted = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);
                return Encoding.UTF8.GetString(decrypted);
            }
        }

        
    }

    public class FetchBillRequest
    {
        public string BillerId { get; set; } = string.Empty;

        public string CardNumber { get; set; } = string.Empty;

        public string RegisteredMobile { get; set; } = string.Empty;
    }

    public class QueryTransactionRequest
    {
        public string mobileNumber { get; set; }
        public string fromDate { get; set; }
        public string toDate { get; set; }
        public string transactionRefId { get; set; }
    }

    public class RaiseComplaintRequest
    {
        public string mobileNumber { get; set; }
        public string complaintType { get; set; }
        public string participationType { get; set; }
        public string serviceReason { get; set; }
        public string description { get; set; }
    }

    public class ComplaintStatusRequest
    {
        public string complaintId { get; set; }
        public string complaintType { get; set; }
    }
}