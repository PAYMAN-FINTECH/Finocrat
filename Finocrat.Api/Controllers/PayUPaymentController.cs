using Finocrat.Api.Data;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using System.Globalization;
using System.Net.NetworkInformation;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Finocrat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PayUPaymentController : ControllerBase
    {
        private const string FrontendHome = "https://thefinocrat.com/app/finhome";

        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly FinocratDbContext _db;
        private readonly DataUtils _dataUtils;

        public PayUPaymentController(
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory,
            FinocratDbContext db,
            DataUtils dataUtils)
        {
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _db = db;
            _dataUtils = dataUtils;
        }

        private bool IsProduction =>
            string.Equals(_configuration["PayU:Environment"], "PRODUCTION",
                StringComparison.OrdinalIgnoreCase);

        private string PaymentsUrl => IsProduction
            ? "https://api.payu.in/v2/payments"
            : "https://apitest.payu.in/v2/payments";

        private string VerifyUrl => IsProduction
            ? "https://info.payu.in/v3/transaction"
            : "https://test.payu.in/v3/transaction";

        private string CallbackBaseUrl =>
            (_configuration["PayU:CallbackBaseUrl"]
                ?? "https://edu.thefinocrat.com/api/PayUPayment").TrimEnd('/');

        // sha512(body|date|secret)
        private string BuildAuthorization(string body, string date)
        {
            var key = _configuration["PayU:Key"];
            var salt = _configuration["PayU:Salt"];

            var bytes = SHA512.HashData(
                Encoding.UTF8.GetBytes($"{body}|{date}|{salt}"));

            var signature = Convert.ToHexString(bytes).ToLowerInvariant();

            return $"hmac username=\"{key}\", algorithm=\"sha512\", headers=\"date\", signature=\"{signature}\"";
        }

        // ============================================================
        // CREATE PAYMENT
        // POST: api/PayUPayment/CreatePayment
        // ============================================================
        [HttpPost("CreatePayment")]
        public async Task<IActionResult> CreatePayment(
            [FromBody] PayUCreatePaymentRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(_configuration["PayU:Key"]) ||
                    string.IsNullOrWhiteSpace(_configuration["PayU:Salt"]))
                {
                    return Ok(new
                    {
                        success = false,
                        message = "PayU configuration missing"
                    });
                }

                if (request.Amount < 1)
                {
                    return Ok(new
                    {
                        success = false,
                        message = "Invalid amount"
                    });
                }

                var user = await _db.fUsers
                    .FirstOrDefaultAsync(t => t.UserPhone == request.LoggedInUserPhone);

                if (user == null)
                {
                    return Ok(new
                    {
                        success = false,
                        message = "User not found"
                    });
                }

                var orderId =
                    $"FINOPU{DateTime.UtcNow:yyyyMMddHHmmssfff}{Random.Shared.Next(1000, 9999)}";

                var istNow = TimeZoneInfo.ConvertTimeFromUtc(
                    DateTime.UtcNow,
                    TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"));

               

                var encodedOrder = Uri.EscapeDataString(orderId);

                var payload = new
                {
                    accountId = _configuration["PayU:Key"],
                    txnId = orderId,
                    currency = "INR",
                    order = new
                    {
                        productInfo = "Education fee payments",
                        paymentChargeSpecification = new
                        {
                            price = request.Amount
                        }
                    },
                    additionalInfo = new
                    {
                        txnFlow = "nonseamless",
                        createOrder = true,
                        orderId = orderId
                    },
                    callBackActions = new
                    {
                        successAction = $"{CallbackBaseUrl}/Success?orderId={encodedOrder}",
                        failureAction = $"{CallbackBaseUrl}/Failure?orderId={encodedOrder}",
                        cancelAction = $"{CallbackBaseUrl}/Cancel?orderId={encodedOrder}"
                    },
                    billingDetails = new
                    {
                        firstName = string.IsNullOrWhiteSpace(request.Name) ? "Customer" : request.Name,
                        phone = request.Phone ?? "",
                        email = request.Email ?? user.Email ?? "",
                        address1 = "NA",
                        city = "NA",
                        state = "NA",
                        country = "India",
                        zipCode = "500050"
                    }
                };

                // The exact string that is hashed must be the string that is sent.
                var body = JsonSerializer.Serialize(payload);

                await _dataUtils.SavePayInAsync(new FPayIn
                {
                    UserPhone = request.LoggedInUserPhone,
                    UserEmail = user.Email,
                    CardHolderName = request.Name,
                    CardHolderPhone = request.Phone,
                    CardHolderEmail = request.Email,
                    CardHolderCardNumber = request.cardnum,
                    Result = "PENDING",
                    Status = false,
                    CardBrand = "",
                    BankName = request.binBankName,
                    CardType = "",
                    CardNo = "",
                    PaymentId = "",
                    TaxNumber = orderId,
                    Amount = request.Amount,
                    PayInCommission = 0,
                    FCommission = 0,
                    Gateway = request.SelectedGateway,
                    Created = istNow,
                    Request = body
                });

                var date = DateTime.UtcNow.ToString("r", CultureInfo.InvariantCulture);

                using var message = new HttpRequestMessage(System.Net.Http.HttpMethod.Post, PaymentsUrl)
                {
                    Content = new StringContent(body, Encoding.UTF8, "application/json")
                };
                message.Headers.TryAddWithoutValidation("date", date);
                message.Headers.TryAddWithoutValidation(
                    "authorization", BuildAuthorization(body, date));

                var client = _httpClientFactory.CreateClient();
                var response = await client.SendAsync(message);
                var responseText = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return Ok(new
                    {
                        success = false,
                        message = "PayU request failed",
                        response = responseText
                    });
                }

                using var json = JsonDocument.Parse(responseText);

                string? checkoutUrl = null;

                if (json.RootElement.TryGetProperty("result", out var result) &&
                    result.ValueKind == JsonValueKind.Object &&
                    result.TryGetProperty("checkoutUrl", out var url))
                {
                    checkoutUrl = url.GetString();
                }

                if (string.IsNullOrWhiteSpace(checkoutUrl))
                {
                    return Ok(new
                    {
                        success = false,
                        message = "PayU checkout URL was not returned",
                        response = responseText
                    });
                }

                return Ok(new
                {
                    success = true,
                    orderId,
                    paymentUrl = checkoutUrl
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

        // ============================================================
        // PAYU CALLBACKS (PayU may redirect with GET or POST)
        // ============================================================
        [AcceptVerbs("GET", "POST")]
        [Route("Success")]
        public Task<IActionResult> Success([FromQuery] string? orderId) =>
            HandleCallback(orderId);

        [AcceptVerbs("GET", "POST")]
        [Route("Failure")]
        public Task<IActionResult> Failure([FromQuery] string? orderId) =>
            HandleCallback(orderId);

        [AcceptVerbs("GET", "POST")]
        [Route("Cancel")]
        public Task<IActionResult> Cancel([FromQuery] string? orderId) =>
            HandleCallback(orderId);

        // The redirect itself is never trusted: the status is always
        // confirmed with PayU's verify API before the wallet is credited.
        private async Task<IActionResult> HandleCallback(string? orderId)
        {
            if (string.IsNullOrWhiteSpace(orderId))
                return Redirect($"{FrontendHome}?payment=failed");

            var success = await VerifyAndCreditAsync(orderId);

            return Redirect(success
                ? $"{FrontendHome}?payment=success&order_id={Uri.EscapeDataString(orderId)}"
                : $"{FrontendHome}?payment=failed");
        }

        // GET: api/PayUPayment/verify/{orderId}
        [HttpGet("verify/{orderId}")]
        public async Task<IActionResult> Verify(string orderId)
        {
            var success = await VerifyAndCreditAsync(orderId);

            return Ok(new
            {
                success,
                status = success ? "SUCCESS" : "FAILED",
                orderId
            });
        }

        private async Task<bool> VerifyAndCreditAsync(string orderId)
        {
            try
            {
                var payIn = await _db.fPayIns
                    .FirstOrDefaultAsync(x => x.TaxNumber == orderId);

                if (payIn == null)
                    return false;

                // Already credited: never credit twice.
                if (payIn.Status)
                    return true;

                var body = JsonSerializer.Serialize(new { txnId = new[] { orderId } });
                var date = DateTime.UtcNow.ToString("r", CultureInfo.InvariantCulture);

                using var message = new HttpRequestMessage(System.Net.Http.HttpMethod.Post, VerifyUrl)
                {
                    Content = new StringContent(body, Encoding.UTF8, "application/json")
                };
                message.Headers.TryAddWithoutValidation("date", date);
                message.Headers.TryAddWithoutValidation(
                    "authorization", BuildAuthorization(body, date));
                message.Headers.TryAddWithoutValidation("Info-Command", "verify_payment");

                var client = _httpClientFactory.CreateClient();
                var response = await client.SendAsync(message);
                var responseText = await response.Content.ReadAsStringAsync();

                var payUResponse = JsonSerializer.Deserialize<PayUResponse>(
    responseText,
    new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    });

                decimal commission = 0m;
                decimal payInLimit = 0m;
                bool isSuccess = false;

                if (payUResponse?.Status == 1 &&
                    payUResponse.Result?.Count > 0)
                {
                    var payment = payUResponse.Result[0];

                    string? transactionId = payment.TxnId;
                    long mihpayId = payment.MihpayId;
                    string? bankReference = payment.BankReferenceNumber;
                    decimal amount = payment.Amount;
                    string? cardNumber = payment.CardNo;
                    string? cardType = payment.CardType;
                    string? paymentStatus = payment.Status;
                    string? unmappedStatus = payment.UnmappedStatus;

                     isSuccess = string.Equals(
                        paymentStatus,
                        "success",
                        StringComparison.OrdinalIgnoreCase);

                    if (isSuccess)
                    {
                        var lookup = await _db.fUserLookups
                       .FirstOrDefaultAsync(x => x.UserPhone == payIn.UserPhone);
                        var gatew = payIn.Gateway+ " PayIn Margin";

                        payInLimit = Math.Max(0m, await _dataUtils.ExtractPayInMargin(lookup, gatew));
                        commission = Math.Round(
                            payIn.Amount * payInLimit / 100m, 2,
                            MidpointRounding.AwayFromZero);

                        var lookupAdmin =
                  await _db.fUserLookups
                      .FirstOrDefaultAsync(
                          x => x.UserPhone == "9014559309"
                      );

                        if (lookupAdmin != null)
                        {
                            if (payIn.BankName.Contains("sbi") || payIn.BankName.Contains("SBI"))
                            {
                                commission =
                                 await _dataUtils.ExtractPayInMargin(
                                    lookupAdmin,
                                    "SBI Margin"
                                );
                            }

                            if (payIn.BankName.Contains("icici") || payIn.BankName.Contains("ICICI"))
                            {
                                commission =
                                 await _dataUtils.ExtractPayInMargin(
                                    lookupAdmin,
                                    "ICICI Margin"
                                );
                            }

                        }
                    }

                    payIn.Result = paymentStatus ?? "";
                    payIn.Status = isSuccess;
                    payIn.PaymentId = transactionId ?? "";
                    payIn.CardBrand = payment.CardType ?? "";
                    payIn.BankName = payment.Field2 ?? "";
                    payIn.CardNo = payment.CardNo ?? "";
                    payIn.CardType = payment.BankCode ?? "";
                    payIn.Response = responseText;

                    if (isSuccess)
                        payIn.PayInCommission = commission;

                    await _dataUtils.SavePayInWithCommissionsAsync(
                        payIn,
                        payInLimit,
                        l => _dataUtils.ExtractPayInMargin(l, payIn.Gateway + " PayIn Margin"),
                        payIn.Gateway + " Enabled");

                }

                return isSuccess;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"PayU verify error: {ex.Message}");
                return false;
            }
        }

        private static string GetString(JsonElement element, string name) =>
            element.TryGetProperty(name, out var value) &&
            value.ValueKind != JsonValueKind.Null
                ? value.ToString()
                : string.Empty;

        private static decimal ExtractPayInMargin(FUserLookup? lookup)
        {
            decimal margin = 0;

            if (lookup != null && !string.IsNullOrEmpty(lookup.LookupJson))
            {
                var settings = JsonSerializer
                    .Deserialize<Dictionary<string, JsonElement>>(lookup.LookupJson);

                if (settings != null &&
                    settings.TryGetValue("PayUEducation PayIn Margin", out var value))
                {
                    if (value.ValueKind == JsonValueKind.String)
                        decimal.TryParse(value.GetString(), NumberStyles.Number,
                            CultureInfo.InvariantCulture, out margin);
                    else if (value.ValueKind == JsonValueKind.Number)
                        margin = value.GetDecimal();
                }
            }

            return margin;
        }
    }

    public class PayUCreatePaymentRequest
    {
        public decimal Amount { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? SelectedGateway { get; set; }
        public string? LoggedInUserPhone { get; set; }
        public string? cardnum { get; set; }
        public string? binBankName {  get; set; }
    }

    public class PayUResponse
    {
        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("status")]
        public int Status { get; set; }

        [JsonPropertyName("result")]
        public List<PayUResult>? Result { get; set; }
    }

    public class PayUResult
    {
        [JsonPropertyName("mihpayId")]
        public long MihpayId { get; set; }

        [JsonPropertyName("bankReferenceNumber")]
        public string? BankReferenceNumber { get; set; }

        [JsonPropertyName("amount")]
        public decimal Amount { get; set; }

        [JsonPropertyName("mode")]
        public string? Mode { get; set; }

        [JsonPropertyName("requestId")]
        public string? RequestId { get; set; }

        [JsonPropertyName("originalAmount")]
        public decimal OriginalAmount { get; set; }

        [JsonPropertyName("additionalCharges")]
        public decimal AdditionalCharges { get; set; }

        [JsonPropertyName("discount")]
        public decimal Discount { get; set; }

        [JsonPropertyName("netDebitAmount")]
        public decimal NetDebitAmount { get; set; }

        [JsonPropertyName("productInfo")]
        public string? ProductInfo { get; set; }

        [JsonPropertyName("firstName")]
        public string? FirstName { get; set; }

        [JsonPropertyName("bankcode")]
        public string? BankCode { get; set; }

        [JsonPropertyName("nameOnCard")]
        public string? NameOnCard { get; set; }

        [JsonPropertyName("cardNo")]
        public string? CardNo { get; set; }

        [JsonPropertyName("cardType")]
        public string? CardType { get; set; }

        [JsonPropertyName("cardToken")]
        public string? CardToken { get; set; }

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

        [JsonPropertyName("field2")]
        public string? Field2 { get; set; }

        [JsonPropertyName("field9")]
        public string? Field9 { get; set; }

        [JsonPropertyName("errorCode")]
        public string? ErrorCode { get; set; }

        [JsonPropertyName("errorMessage")]
        public string? ErrorMessage { get; set; }

        [JsonPropertyName("addedOn")]
        public string? AddedOn { get; set; }

        [JsonPropertyName("settledAt")]
        public string? SettledAt { get; set; }

        [JsonPropertyName("paymentSource")]
        public string? PaymentSource { get; set; }

        [JsonPropertyName("meCode")]
        public PayUMeCode? MeCode { get; set; }

        [JsonPropertyName("pgType")]
        public string? PgType { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("unmappedStatus")]
        public string? UnmappedStatus { get; set; }

        [JsonPropertyName("merchantUTR")]
        public string? MerchantUTR { get; set; }

        [JsonPropertyName("mcpLookupId")]
        public string? McpLookupId { get; set; }

        [JsonPropertyName("mcpAmount")]
        public decimal McpAmount { get; set; }

        [JsonPropertyName("mcpCurrency")]
        public string? McpCurrency { get; set; }

        [JsonPropertyName("mcpExchangeRate")]
        public decimal McpExchangeRate { get; set; }

        [JsonPropertyName("originalCurrency")]
        public string? OriginalCurrency { get; set; }

        [JsonPropertyName("merNetAmount")]
        public decimal? MerNetAmount { get; set; }

        [JsonPropertyName("offerAvailed")]
        public string? OfferAvailed { get; set; }

        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("txnId")]
        public string? TxnId { get; set; }
    }

    public class PayUMeCode
    {
        [JsonPropertyName("MID")]
        public string? MID { get; set; }

        [JsonPropertyName("TID")]
        public string? TID { get; set; }
    }
}
