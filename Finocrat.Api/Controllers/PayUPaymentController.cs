using Finocrat.Api.Data;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

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

                await _db.fPayIns.AddAsync(new FPayIn
                {
                    UserId = user.Id,
                    UserPhone = request.LoggedInUserPhone,
                    UserEmail = user.Email,
                    CardHolderName = request.Name,
                    CardHolderPhone = request.Phone,
                    CardHolderEmail = request.Email,
                    CardHolderCardNumber = request.cardnum,
                    Result = "PENDING",
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
                    Created = istNow
                });
                await _db.SaveChangesAsync();

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
                var date = DateTime.UtcNow.ToString("r", CultureInfo.InvariantCulture);

                using var message = new HttpRequestMessage(HttpMethod.Post, PaymentsUrl)
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

                using var message = new HttpRequestMessage(HttpMethod.Post, VerifyUrl)
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

                if (!response.IsSuccessStatusCode)
                    return false;

                using var json = JsonDocument.Parse(responseText);
                var root = json.RootElement;

                if (!root.TryGetProperty("result", out var result) ||
                    result.ValueKind != JsonValueKind.Array)
                    return false;

                JsonElement? txn = null;
                foreach (var item in result.EnumerateArray())
                {
                    if (item.TryGetProperty("txnId", out var id) &&
                        id.ToString() == orderId)
                    {
                        txn = item;
                        break;
                    }
                }

                if (txn == null)
                    return false;

                var t = txn.Value;

                var status = GetString(t, "status");
                var isSuccess = string.Equals(status, "success",
                    StringComparison.OrdinalIgnoreCase);

                var paidAmount = t.TryGetProperty("amount", out var amt) &&
                    amt.TryGetDecimal(out var parsed) ? parsed : 0m;

                // Guard against a paid amount that differs from the order.
                if (isSuccess && paidAmount != payIn.Amount)
                    isSuccess = false;

                var bankName = GetString(t, "bankcode");
                var cardNo = GetString(t, "cardNo");
                var mode = GetString(t, "mode");

                payIn.Result = GetString(t, "field9") is { Length: > 0 } f9 ? f9 : status;
                payIn.Status = isSuccess;
                payIn.PaymentId = GetString(t, "mihpayId");
                payIn.CardBrand = mode;
                payIn.BankName = bankName;
                payIn.CardNo = cardNo;
                payIn.CardType = $"{cardNo}_{mode}";

                if (isSuccess)
                {
                    var lookup = await _db.fUserLookups
                        .FirstOrDefaultAsync(x => x.UserPhone == payIn.UserPhone);

                    var margin = Math.Max(0m, ExtractPayInMargin(lookup));

                    payIn.PayInCommission = Math.Round(
                        payIn.Amount * margin / 100m, 2,
                        MidpointRounding.AwayFromZero);
                }

                await _db.SaveChangesAsync();

                if (!isSuccess)
                    return false;

                var existingHistory = await _db.fPassbookHistories
                    .FirstOrDefaultAsync(h => h.TxnId == payIn.TaxNumber);

                if (existingHistory == null)
                {
                    var user = await _db.fUsers
                        .FirstOrDefaultAsync(u => u.UserPhone == payIn.UserPhone);

                    if (user == null)
                        return false;

                    var istNow = TimeZoneInfo.ConvertTimeFromUtc(
                        DateTime.UtcNow,
                        TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"));

                    var balance = await _dataUtils.GetWalletAmount(payIn.UserPhone);

                    await _db.fPassbookHistories.AddAsync(new FPassbookHistory
                    {
                        UserId = user.Id,
                        UserPhone = user.UserPhone,
                        Name = payIn.CardHolderName,
                        TxnId = payIn.TaxNumber,
                        AccountNumber = payIn.CardHolderCardNumber,
                        Amount = payIn.Amount,
                        TransactionType = "PayIn",
                        Status = true,
                        StatusMessage = payIn.Result,
                        ParentId = payIn.Id,
                        Balance = balance,
                        CreatedAt = istNow
                    });

                    await _db.SaveChangesAsync();
                }

                return true;
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
    }
}
