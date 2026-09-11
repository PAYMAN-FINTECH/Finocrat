
using Finocrat.Api.Data;
using Finocrat.Api.Models.Entities.Edu;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using Razorpay.Api;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Finocrat.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CashfreePaymentController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly FinocratDbContext _db;
        private readonly DataUtils _dataUtils;

        public CashfreePaymentController(
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory, FinocratDbContext db, DataUtils dataUtils)
        {
            _configuration = configuration;
            _httpClientFactory = httpClientFactory;
            _db = db;
            _dataUtils = dataUtils;
        }


        // ============================================================
        // CREATE ORDER
        // POST: api/Cashfree/CreateOrder
        // ============================================================

        [HttpPost("CreateOrder")]
        public async Task<IActionResult> CreateOrder(
    [FromBody] CashfreeCreateOrderRequest request)
        {
            try
            {
                var clientId = _configuration["CashfreePG:ClientId"];
                var clientSecret = _configuration["CashfreePG:ClientSecret"];
                var environment = _configuration["CashfreePG:Environment"];
                var apiVersion = _configuration["CashfreePG:ApiVersion"];

                var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);

                var baseUrl =
                    environment?.Equals(
                        "SANDBOX",
                        StringComparison.OrdinalIgnoreCase)
                    == true
                        ? "https://sandbox.cashfree.com/pg"
                        : "https://api.cashfree.com/pg";

                // Unique order ID
                var orderId =
                    "FINOCRAT_" +
                    DateTime.UtcNow.ToString("yyyyMMddHHmmssfff");

                var cashfreeRequest = new
                {
                    order_id = orderId,

                    order_amount = request.Amount,

                    order_currency = "INR",

                    customer_details = new
                    {
                        customer_id =
                            request.LoggedInUserPhone,

                        customer_name =
                            request.Name,

                        customer_email =
                            request.Email,

                        customer_phone =
                            request.Mobile
                    },

                    order_meta = new
                    {
                        //return_url =
                        //    "https://edu.thefinocrat.com/app/finhome"
                    },

                    order_note =
                        "Finocrat Edu"
                };
                var user = await _db.fUsers.FirstOrDefaultAsync(t => t.UserPhone == request.LoggedInUserPhone);

                var payIn = new FPayIn
                {
                    UserId = user.Id,
                    UserPhone = request.LoggedInUserPhone,
                    UserEmail = user.Email,
                    CardHolderName = request.Name,
                    CardHolderPhone = request.Mobile,
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
                    FCommission =  0,
                    Gateway = request.SelectedGateway,
                    Created = istNow
                };

                await _db.fPayIns.AddAsync(payIn);
                await _db.SaveChangesAsync();

                var json =
                    JsonSerializer.Serialize(
                        cashfreeRequest);

                var client =
                    _httpClientFactory.CreateClient();

                client.DefaultRequestHeaders.Clear();

                client.DefaultRequestHeaders.Add(
                    "x-client-id",
                    clientId);

                client.DefaultRequestHeaders.Add(
                    "x-client-secret",
                    clientSecret);

                client.DefaultRequestHeaders.Add(
                    "x-api-version",
                    apiVersion ?? "2025-01-01");

                client.DefaultRequestHeaders.Accept.Add(
                    new MediaTypeWithQualityHeaderValue(
                        "application/json"));

                var content =
                    new StringContent(
                        json,
                        Encoding.UTF8,
                        "application/json");

                var response =
                    await client.PostAsync(
                        $"{baseUrl}/orders",
                        content);

                var responseBody =
                    await response.Content.ReadAsStringAsync();

                Console.WriteLine(
                    $"Cashfree Response: {responseBody}");

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode(
                        (int)response.StatusCode,
                        new
                        {
                            success = false,
                            message =
                                "Cashfree order creation failed",
                            response = responseBody
                        });
                }

                using var document =
                    JsonDocument.Parse(responseBody);

                var root =
                    document.RootElement;

                var paymentSessionId =
                    root.GetProperty(
                        "payment_session_id")
                        .GetString();

                return Ok(new
                {
                    success = true,

                    orderId = orderId,

                    paymentSessionId =
                        paymentSessionId,

                    amount =
                        request.Amount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(
                    500,
                    new
                    {
                        success = false,
                        message = ex.Message
                    });
            }
        }
        // ============================================================
        // RETURN URL
        // Cashfree redirects customer here
        //
        // GET:
        // api/Cashfree/Return?order_id=XXXX
        // ============================================================

        [HttpGet("Return")]
        public async Task<IActionResult> Return(
            [FromQuery] string order_id)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(
                    order_id))
                {
                    return Redirect(
                        "https://thefinocrat.com/app/finhome"
                    );
                }


                Console.WriteLine(
                    $"Cashfree Return Order: {order_id}");


                // ----------------------------------------------------
                // VERIFY CASHFREE ORDER
                // ----------------------------------------------------

                var verification =
                    await VerifyCashfreeOrder(
                        order_id);


                // ----------------------------------------------------
                // PAYMENT SUCCESS
                // ----------------------------------------------------

                if (verification.IsSuccess)
                {
                    Console.WriteLine(
                        $"Cashfree Payment SUCCESS: {order_id}");


                    // =================================================
                    // UPDATE WALLET HERE
                    // =================================================

                    /*
                     *
                     * VERY IMPORTANT:
                     *
                     * Do not add money blindly.
                     *
                     * First check database:
                     *
                     * 1. Find OrderId
                     * 2. Check current status
                     * 3. If already SUCCESS:
                     *       DO NOT CREDIT AGAIN
                     *
                     * 4. Otherwise:
                     *       Credit wallet
                     *
                     * 5. Create PayIn/History
                     *
                     * 6. Mark order SUCCESS
                     *
                     */


                    /*
                     *
                     * Example:
                     *
                     * var payment =
                     *     await _context.PayManPayIns
                     *         .FirstOrDefaultAsync(
                     *             x => x.OrderId == order_id);
                     *
                     * if (payment != null &&
                     *     payment.Status != "SUCCESS")
                     * {
                     *
                     *     // CREDIT WALLET
                     *
                     *     payment.Status =
                     *         "SUCCESS";
                     *
                     *     payment.Updated =
                     *         DateTime.UtcNow;
                     *
                     *     await _context.SaveChangesAsync();
                     * }
                     *
                     */


                    return Redirect(
                        "https://thefinocrat.com/app/finhome"
                        + "?payment=success"
                        + $"&order_id={Uri.EscapeDataString(order_id)}"
                    );
                }


                // ----------------------------------------------------
                // PAYMENT FAILED
                // ----------------------------------------------------

                Console.WriteLine(
                    $"Cashfree Payment Status: "
                    + $"{verification.Status}");


                return Redirect(
                    "https://thefinocrat.com/app/finhome"
                    + "?payment=failed"
                    + $"&order_id={Uri.EscapeDataString(order_id)}"
                );
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Cashfree Return Error:");

                Console.WriteLine(
                    ex.ToString());


                return Redirect(
                    "https://thefinocrat.com/app/finhome"
                    + "?payment=failed"
                );
            }
        }


        // ============================================================
        // VERIFY PAYMENT
        //
        // POST:
        // api/Cashfree/VerifyPayment
        // ============================================================

        [HttpGet("verify/{orderId}")]
        public async Task<IActionResult> VerifyCashfreePayment(string orderId)
        {
            var jhgd = new eduUser
            {
                Name = orderId,
                Email = "",
                PasswordHash = " ",
                CreatedAt = DateTime.Now,
                phone = ""
            };

            _db.eduUsers.Add(jhgd);
            _db.SaveChanges();

            try
            {
                if (string.IsNullOrWhiteSpace(orderId))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Order ID is required"
                    });
                }

                var clientId = _configuration["CashfreePG:ClientId"];
                var clientSecret = _configuration["CashfreePG:ClientSecret"];

                if (string.IsNullOrWhiteSpace(clientId) ||
                    string.IsNullOrWhiteSpace(clientSecret))
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "Cashfree credentials are not configured"
                    });
                }

                using var client = new HttpClient();

                client.BaseAddress = new Uri("https://api.cashfree.com/pg/");

                client.DefaultRequestHeaders.Add(
                    "x-client-id",
                    clientId
                );

                client.DefaultRequestHeaders.Add(
                    "x-client-secret",
                    clientSecret
                );

                client.DefaultRequestHeaders.Add(
                    "x-api-version",
                    "2025-01-01"
                );

                client.DefaultRequestHeaders.Add(
                    "Accept",
                    "application/json"
                );

                var response = await client.GetAsync(
                    $"orders/{Uri.EscapeDataString(orderId)}"
                );

                var responseBody =
                    await response.Content.ReadAsStringAsync();

                Console.WriteLine(
                    $"Cashfree Verify Response: {responseBody}"
                );

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode(
                        (int)response.StatusCode,
                        new
                        {
                            success = false,
                            message = "Unable to verify Cashfree order",
                            cashfreeResponse = responseBody
                        }
                    );
                }

                var order = JsonSerializer.Deserialize<CashfreeOrderResponse>(
    responseBody,
    new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    }
);
                decimal payInLimit = 0;
                var payiis = await _db.fPayIns
    .FirstOrDefaultAsync(t => t.TaxNumber == orderId);

                if (payiis == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "PayIn transaction not found"
                    });
                }

                var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);

                var user = await _db.fUsers
                    .FirstOrDefaultAsync(t => t.UserPhone == payiis.UserPhone);

                if (user == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "User not found"
                    });
                }
                var ss = order.OrderStatus == "PAID";

                if (order.OrderStatus == "PAID")
                {

                    var lookup = await _db.fUserLookups.FirstOrDefaultAsync(x => x.UserPhone == payiis.UserPhone);
                    payInLimit = ExtractPayInMargin(lookup, "visa");
                }
                // Update PayIn
                payiis.Result = order.OrderStatus;
                payiis.Status = order.OrderStatus == "PAID";
                payiis.PaymentId = order.CfOrderId;
                payiis.Amount = order.OrderAmount;
                payiis.PayInCommission = ss ? (order.OrderAmount * payInLimit / 100) : 0;
              

                _db.fPayIns.Update(payiis);

                await _db.SaveChangesAsync();


                // =====================================================
                // PAYMENT SUCCESS
                // =====================================================

                if (order.OrderStatus == "PAID")
                {
                    // IMPORTANT:
                    // Check whether passbook entry already exists
                    // for this transaction.
                    var existingHistory = await _db.fPassbookHistories
                        .FirstOrDefaultAsync(t =>
                            t.TxnId == payiis.TaxNumber);

                    if (existingHistory == null)
                    {
                        decimal balance = await _dataUtils.GetWalletAmount(
                            payiis.UserPhone
                        );

                        var history = new FPassbookHistory
                        {
                            UserId = user.Id,
                            UserPhone = user.UserPhone,
                            Name = payiis.CardHolderName,

                            TxnId = payiis.TaxNumber,

                            AccountNumber = payiis.CardHolderCardNumber,

                            Amount = payiis.Amount,

                            TransactionType = "PayIn",

                            Status = true,

                            StatusMessage = payiis.Result,

                            ParentId = payiis.Id,

                            Balance = balance,

                            CreatedAt = istNow
                        };

                        await _db.fPassbookHistories.AddAsync(history);

                        await _db.SaveChangesAsync();
                    }
                }

                if (order == null)
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "Invalid response from Cashfree"
                    });
                }

                if (order.OrderStatus == "PAID")
                {
                    return Ok(new
                    {
                        success = true,
                        status = "SUCCESS",
                        orderStatus = order.OrderStatus,
                        orderId = order.OrderId,
                        amount = order.OrderAmount,
                        paymentSessionId = order.PaymentSessionId,
                        message = "Payment successful"
                    });
                }

                return Ok(new
                {
                    success = false,
                    status = "FAILED",
                    orderStatus = order.OrderStatus,
                    orderId = order.OrderId,
                    amount = order.OrderAmount,
                    message = $"Payment status is {order.OrderStatus}"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Cashfree Verify Error: {ex}"
                );

                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error while verifying payment",
                    error = ex.Message
                });
            }
        }

        private static decimal ExtractPayInMargin(FUserLookup? lookup, string cardType)
        {
            decimal margin = 0;
            if (lookup != null && !string.IsNullOrEmpty(lookup.LookupJson))
            {
                var settings = JsonSerializer.Deserialize<Dictionary<string, object>>(lookup.LookupJson);
                if (settings != null && settings.TryGetValue("PayIn Margin", out var value))
                {
                    if (value is JsonElement element)
                    {
                        if (element.ValueKind == JsonValueKind.String)
                            decimal.TryParse(element.GetString(), out margin);
                        else if (element.ValueKind == JsonValueKind.Number)
                            margin = element.GetDecimal();
                    }
                }
            }

            if (string.Equals(cardType, "business", StringComparison.OrdinalIgnoreCase))
            {
                margin = 3.6m;
            }

            return margin;
        }
        // ============================================================
        // PRIVATE CASHFREE VERIFY
        // ============================================================

        private async Task<CashfreeVerificationResult>
            VerifyCashfreeOrder(
                string orderId)
        {
            var clientId =
                _configuration[
                    "CashfreePG:ClientId"];

            var clientSecret =
                _configuration[
                    "CashfreePG:ClientSecret"];

            var environment =
                _configuration[
                    "CashfreePG:Environment"];

            var apiVersion =
                _configuration[
                    "CashfreePG:ApiVersion"];


            string baseUrl;

            if (
                environment?
                    .Equals(
                        "SANDBOX",
                        StringComparison.OrdinalIgnoreCase)
                == true)
            {
                baseUrl =
                    "https://sandbox.cashfree.com/pg";
            }
            else
            {
                baseUrl =
                    "https://api.cashfree.com/pg";
            }


            var client =
                _httpClientFactory
                    .CreateClient();


            client.DefaultRequestHeaders.Clear();


            client.DefaultRequestHeaders.Add(
                "x-client-id",
                clientId);


            client.DefaultRequestHeaders.Add(
                "x-client-secret",
                clientSecret);


            client.DefaultRequestHeaders.Add(
                "x-api-version",
                string.IsNullOrWhiteSpace(
                    apiVersion)
                    ? "2025-01-01"
                    : apiVersion);


            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue(
                    "application/json"));


            // --------------------------------------------------------
            // GET ORDER
            // --------------------------------------------------------

            var response =
                await client.GetAsync(
                    $"{baseUrl}/orders/{Uri.EscapeDataString(orderId)}");


            var responseBody =
                await response.Content
                    .ReadAsStringAsync();


            Console.WriteLine(
                "Cashfree Verify Response:");

            Console.WriteLine(
                responseBody);


            if (!response.IsSuccessStatusCode)
            {
                return new CashfreeVerificationResult
                {
                    IsSuccess = false,

                    Status = "ERROR",

                    Amount = 0,

                    OrderId = orderId
                };
            }


            using var document =
                JsonDocument.Parse(
                    responseBody);

            var root =
                document.RootElement;


            string status = "";


            decimal amount = 0;


            if (root.TryGetProperty(
                "order_status",
                out var statusProperty))
            {
                status =
                    statusProperty.GetString()
                    ?? "";
            }


            if (root.TryGetProperty(
                "order_amount",
                out var amountProperty))
            {
                amount =
                    amountProperty.GetDecimal();
            }


            return new CashfreeVerificationResult
            {
                IsSuccess =
                    status.Equals(
                        "PAID",
                        StringComparison.OrdinalIgnoreCase),

                Status =
                    status,

                Amount =
                    amount,

                OrderId =
                    orderId
            };
        }
    }

    public class CashfreeOrderResponse
    {
        [JsonPropertyName("cf_order_id")]
        public string? CfOrderId { get; set; }

        [JsonPropertyName("order_id")]
        public string? OrderId { get; set; }

        [JsonPropertyName("order_amount")]
        public decimal OrderAmount { get; set; }

        [JsonPropertyName("order_currency")]
        public string? OrderCurrency { get; set; }

        [JsonPropertyName("order_status")]
        public string? OrderStatus { get; set; }

        [JsonPropertyName("payment_session_id")]
        public string? PaymentSessionId { get; set; }

        [JsonPropertyName("created_at")]
        public string? CreatedAt { get; set; }
    }
    public class CashfreeCreateOrderRequest
    {
        public decimal Amount { get; set; }

        public string? Mobile { get; set; }

        public string? Name { get; set; }

        public string? Email { get; set; }

        public string? SelectedGateway { get; set; }

        public string? LoggedInUserPhone { get; set; }

        public string? cardnum { get; set; }
    }


    public class CashfreeVerifyRequest
    {
        public string? OrderId { get; set; }
    }
    public class CashfreeCreateOrderResponse
    {
        public bool Success { get; set; }

        public string? OrderId { get; set; }

        public string? PaymentSessionId { get; set; }

        public decimal Amount { get; set; }

        public string? Message { get; set; }
    }


    public class CashfreeVerificationResult
    {
        public bool IsSuccess { get; set; }

        public string? Status { get; set; }

        public decimal Amount { get; set; }

        public string? OrderId { get; set; }
    }
}