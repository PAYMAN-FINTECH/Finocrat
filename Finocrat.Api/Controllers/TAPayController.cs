using Finocrat.Api.Data;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using Razorpay.Api.Errors;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TAPayController : ControllerBase
    {

        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly DataUtils _dataUtils;
        private readonly FinocratDbContext _context;


        public TAPayController(
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory, FinocratDbContext db, DataUtils dataUtils)
        {
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _dataUtils = dataUtils;
            _context = db;

        }

        [HttpGet]
        public async Task<IActionResult> TApayInit(decimal amount, string userPhone, string CName, string CMobile, string CCard, string Cemail, string gateway, string divice)
        {
            var orderId = $"PAYMAN{DateTime.UtcNow:yyyyMMddHHmmssfff}{Random.Shared.Next(1000, 9999)}";

            // IST time
            var istTime = TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.UtcNow,
                TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"));

            var user = await _context.fUsers.FirstOrDefaultAsync(u => u.UserPhone == userPhone);

            var existing = await _context.fPayIns
                   .FirstOrDefaultAsync(x => x.TaxNumber == orderId);

            if (existing == null)
            {
                var payIn = new FPayIn
                {
                    UserId = user.Id,
                    UserPhone = userPhone,
                    TaxNumber = orderId,              // 🔑 orderId
                    Amount = amount,
                    Gateway = gateway,
                    Created = istTime,
                    CardHolderEmail = Cemail,
                    Status = false,
                    Result = "PENDING",
                    //Device = divice,
                    CardHolderCardNumber = CCard,
                    CardHolderName = CName,
                    CardHolderPhone = CMobile
                };

                _context.fPayIns.Add(payIn);
                await _context.SaveChangesAsync();
            }

            var model = new TaPaySessionModel
            {
                Amount = amount,
                CMobile = CMobile,
                Cemail = Cemail,
                CName = CName,
                userPhone = userPhone,
                CCard = CCard,
                gateway = gateway,
                orderId = orderId
            };

            return Ok(model);
        }

        [HttpPost("CreatePayment")]
        public async Task<IActionResult> CreatePayment(
            [FromBody] PaymentRequest request)
        {
            try
            {
                var apiKey =
                    _configuration["TAPaymentGateway:ApiKey"];

                var salt =
                    _configuration["TAPaymentGateway:Salt"];

                var apiUrl =
                    _configuration["TAPaymentGateway:ApiUrl"];

                if (string.IsNullOrWhiteSpace(apiKey) ||
                    string.IsNullOrWhiteSpace(salt) ||
                    string.IsNullOrWhiteSpace(apiUrl))
                {
                    return Ok(new
                    {
                        success = false,
                        message = "Payment gateway configuration missing"
                    });
                }

                var orderId = $"FINOCART{DateTime.UtcNow:yyyyMMddHHmmssfff}{Random.Shared.Next(1000, 9999)}";

                // IST time
                var istTime = TimeZoneInfo.ConvertTimeFromUtc(
                    DateTime.UtcNow,
                    TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"));

                var user = await _context.fUsers.FirstOrDefaultAsync(t => t.UserPhone == request.LoggedInUserPhone);

                var payIn = new FPayIn
                {
                    UserId = user.Id,
                    UserPhone = request.LoggedInUserPhone,
                    UserEmail = user.Email,
                    CardHolderName = request.Name,
                    CardHolderPhone = request.Phone,
                    CardHolderEmail = request.Email,
                    CardHolderCardNumber = request.cardnum,
                    Result = "",
                    Status = false,
                    CardBrand = "",
                    BankName = "",
                    CardType = "",
                    CardNo = "",
                    PaymentId = "",
                    TaxNumber = orderId,
                    Amount = request.Amount,
                    PayInCommission = 0,
                    FCommission = 0,
                    Gateway = request.SelectedGateway,
                    Created = istTime
                };

                await _context.fPayIns.AddAsync(payIn);
                await _context.SaveChangesAsync();

                // Generate unique order ID


                var returnUrl = "https://localhost:7081/api/TAPay/Success";

                var failureUrl = "https://localhost:7081/api/TAPay/Failure";

                var cancelUrl = "https://localhost:7081/api/TAPay/Cancel";

                var parameters =
                    new Dictionary<string, string>
                    {
                        ["amount"] = request.Amount.ToString("0.00"),
                        ["api_key"] = apiKey,
                        ["currency"] = "INR",
                        ["description"] = "Education fee payments",
                        ["email"] = request.Email ?? "",
                        ["mode"] = "PROD",
                        ["name"] = request.Name ?? "",
                        ["order_id"] = orderId ?? "FINOCART" + DateTime.Now.ToString("yyyyMMddHHmmssfff"),
                        ["phone"] = request.Phone ?? "",
                        ["city"] = "hyd",
                        ["country"] = "ind",
                        ["zip_code"] = "500050",
                        ["return_url"] = returnUrl,
                        ["return_url_cancel"] = cancelUrl,
                        ["return_url_failure"] = failureUrl
                    };

                // Gateway hash
                var hash = GenerateHash(
                    parameters,
                    salt);

                parameters["hash"] = hash;

                var client =
                    _httpClientFactory.CreateClient();

                using var content =
                    new FormUrlEncodedContent(parameters);

                var response =
                    await client.PostAsync(
                        $"{apiUrl}/v2/getpaymentrequesturl",
                        content);

                var responseText =
                    await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return Ok(new
                    {
                        success = false,
                        message = "Gateway request failed",
                        response = responseText
                    });
                }

                using var json =
                    JsonDocument.Parse(responseText);

                var root = json.RootElement;

                string? paymentUrl = null;

                if (root.TryGetProperty("data", out var data))
                {
                    if (data.TryGetProperty(
                        "url",
                        out var urlProperty))
                    {
                        paymentUrl =
                            urlProperty.GetString();
                    }
                }

                if (string.IsNullOrWhiteSpace(paymentUrl))
                {
                    return Ok(new
                    {
                        success = false,
                        message = "Payment URL not received",
                        response = responseText
                    });
                }

                return Ok(new
                {
                    success = true,
                    paymentUrl = paymentUrl,
                    orderId = request.orderId
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        private static string GenerateHash(
          Dictionary<string, string> parameters,
          string salt)
        {
            var hashData = new StringBuilder();

            hashData.Append(salt);

            foreach (var item in parameters
                .Where(x => !string.IsNullOrWhiteSpace(x.Value))
                .OrderBy(x => x.Key))
            {
                hashData.Append("|");
                hashData.Append(item.Value.Trim());
            }

            using var sha512 =
                SHA512.Create();

            var bytes =
                Encoding.UTF8.GetBytes(
                    hashData.ToString());

            var hash =
                sha512.ComputeHash(bytes);

            return Convert
                .ToHexString(hash)
                .ToUpperInvariant();
        }

        private async Task<PaymentStatusResult?> CheckPaymentStatusAsync(
    string orderId,
    string? transactionId = null)
        {
            var apiKey =
                   _configuration["TAPaymentGateway:ApiKey"];

            var salt =
                _configuration["TAPaymentGateway:Salt"];

            var apiUrl =
                _configuration["TAPaymentGateway:ApiUrl"];

            var parameters = new Dictionary<string, string>
    {
        { "api_key", apiKey! },
        { "order_id", orderId }
    };

            // If gateway returned transaction_id, send it too
            if (!string.IsNullOrWhiteSpace(transactionId))
            {
                parameters.Add("transaction_id", transactionId);
            }

            // Generate gateway hash
            parameters["hash"] = GenerateHash(parameters, salt!);

            using var client = _httpClientFactory.CreateClient();

            var content = new FormUrlEncodedContent(parameters);

            var response = await client.PostAsync(
                $"{apiUrl}/v2/paymentstatus",
                content);

            var responseJson = await response.Content.ReadAsStringAsync();

            // Log actual gateway response
            //var responseLog = new ErrorModel
            //{
            //    payload = "TA Pay Status response",
            //    agId = "",
            //    reqTime = "",
            //    respTime = responseJson,
            //    requestId = "",
            //    uid = "",
            //    statuscode = true,
            //    jsonBody = ""
            //};

            //_context.errorModels.Add(responseLog);
            //await _context.SaveChangesAsync();

            if (!response.IsSuccessStatusCode)
            {
                return new PaymentStatusResult
                {
                };

            }

            try
            {
                var result = JsonSerializer.Deserialize<PaymentStatusResult>(
                    responseJson,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });

                if (result == null)
                {
                    return new PaymentStatusResult
                    {
                    };

                }

                //result.RawResponse = responseJson;

                return result;
            }
            catch
            {
                return new PaymentStatusResult
                {
                };
            }
        }

        [HttpPost("Success")]
        public async Task<IActionResult> Success()
        {
            


            // Read gateway POST data
            var form = Request.HasFormContentType
                ? Request.Form
                : null;

            var response = form?.ToDictionary(
                x => x.Key,
                x => x.Value.ToString()
            ) ?? new Dictionary<string, string>();


            // Convert to JSON
            var responseJson = JsonSerializer.Serialize(response);

            // Log actual gateway response
           

            var model = JsonSerializer.Deserialize<TAPayResponse>(
    responseJson,
    new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    });

            // FIRST: Check actual status from gateway
            var status = await CheckPaymentStatusAsync(
                model.order_id,
                model.transaction_id);

            model.bank_code = status?.Data[0].BankCode ?? string.Empty;


          //  var res = await _dataUtils.TAPayInDbCall(model);

            if (true)
            {
                return Redirect(
                        "https://thefinocrat.com/app/finhome"
                        + "?payment=success"
                        + $"&order_id={Uri.EscapeDataString(model.order_id)}"
                    );
            }
            else
            {

                return Redirect(
                    "https://thefinocrat.com/app/finhome"
                    + "?payment=failed"
                );
            }
        }



        [HttpPost("Failure")]
        public async Task<IActionResult> Failure()
        {
            // Read gateway POST data
            var form = Request.HasFormContentType
                ? Request.Form
                : null;

            var response = form?.ToDictionary(
                x => x.Key,
                x => x.Value.ToString()
            ) ?? new Dictionary<string, string>();


            // Convert to JSON
            var responseJson = JsonSerializer.Serialize(response);



            return Redirect(
                "https://thefinocrat.com/app/finhome"
                + "?payment=failed"
            );
        }

        [HttpPost("Cancel")]
        public IActionResult Cancel()
        {

            return Redirect(
                "https://thefinocrat.com/app/finhome"
                + "?payment=failed"
            );
        }



    }

    public class PaymentRequest
    {
        public decimal Amount { get; set; }

        public string? Name { get; set; }

        public string? Email { get; set; }

        public string? Phone { get; set; }
        public string? orderId { get; set; }


        public string? SelectedGateway { get; set; }

        public string? LoggedInUserPhone { get; set; }

        public string? cardnum { get; set; }
    }

    public class PaymentStatusResult
    {
        [JsonPropertyName("data")]
        public List<PaymentStatusData>? Data { get; set; }

        [JsonPropertyName("hash")]
        public string? Hash { get; set; }
    }

    public class PaymentStatusData
    {
        [JsonPropertyName("transaction_id")]
        public string? TransactionId { get; set; }

        [JsonPropertyName("bank_code")]
        public string? BankCode { get; set; }

        [JsonPropertyName("payment_mode")]
        public string? PaymentMode { get; set; }

        [JsonPropertyName("payment_channel")]
        public string? PaymentChannel { get; set; }

        [JsonPropertyName("payment_datetime")]
        public string? PaymentDatetime { get; set; }

        [JsonPropertyName("response_code")]
        public int ResponseCode { get; set; }

        [JsonPropertyName("response_message")]
        public string? ResponseMessage { get; set; }

        [JsonPropertyName("authorization_staus")]
        public string? AuthorizationStatus { get; set; }

        [JsonPropertyName("order_id")]
        public string? OrderId { get; set; }

        [JsonPropertyName("amount")]
        public string? Amount { get; set; }

        [JsonPropertyName("amount_orig")]
        public string? AmountOrig { get; set; }

        [JsonPropertyName("tdr_amount")]
        public decimal TdrAmount { get; set; }

        [JsonPropertyName("tax_on_tdr_amount")]
        public decimal TaxOnTdrAmount { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("error_desc")]
        public string? ErrorDesc { get; set; }

        [JsonPropertyName("customer_phone")]
        public string? CustomerPhone { get; set; }

        [JsonPropertyName("customer_name")]
        public string? CustomerName { get; set; }

        [JsonPropertyName("customer_email")]
        public string? CustomerEmail { get; set; }

        [JsonPropertyName("currency")]
        public string? Currency { get; set; }

        [JsonPropertyName("cardmasked")]
        public string? CardMasked { get; set; }

        [JsonPropertyName("udf1")]
        public string? Udf1 { get; set; }

        [JsonPropertyName("udf2")]
        public string? Udf2 { get; set; }

        [JsonPropertyName("udf3")]
        public string? Udf3 { get; set; }

        [JsonPropertyName("udf4")]
        public string? Udf4 { get; set; }

        [JsonPropertyName("udf5")]
        public string? Udf5 { get; set; }

        [JsonPropertyName("bank_ref_id")]
        public string? BankRefId { get; set; }
    }

    public class PaymentStatusError
    {
        public string? Code { get; set; }

        public string? Message { get; set; }
    }

    public class TaPaySessionModel
    {
        public decimal Amount { get; set; }

        public string userPhone { get; set; }

        public string Cemail { get; set; }

        public string CName { get; set; }

        // Mask or last 4 digits only (PCI safe)
        public string CCard { get; set; }

        public string CMobile { get; set; }
        public string divice { get; set; }
        public string gateway { get; set; }
        public string orderId { get; set; }
    }

    public class CardBinRequest
    {
        public string Bin { get; set; } = "";
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
    }

    public class TAPayResponse
    {
        public string? order_id { get; set; }
        public string? amount { get; set; }
        public string? currency { get; set; }
        public string? description { get; set; }
        public string? name { get; set; }
        public string? email { get; set; }
        public string? phone { get; set; }

        public string? address_line_1 { get; set; }
        public string? address_line_2 { get; set; }

        public string? city { get; set; }
        public string? state { get; set; }
        public string? country { get; set; }
        public string? zip_code { get; set; }

        public string? udf1 { get; set; }
        public string? udf2 { get; set; }
        public string? udf3 { get; set; }
        public string? udf4 { get; set; }
        public string? udf5 { get; set; }

        public string? transaction_id { get; set; }
        public string? bank_code { get; set; }
        public string? payment_mode { get; set; }
        public string? payment_channel { get; set; }
        public string? payment_datetime { get; set; }

        public string? response_code { get; set; }
        public string? response_message { get; set; }
        public string? error_desc { get; set; }

        public string? cardmasked { get; set; }

        public string? hash { get; set; }
    }
}
