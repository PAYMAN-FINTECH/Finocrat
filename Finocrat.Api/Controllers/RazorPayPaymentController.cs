using Finocrat.Api.Data;
using Finocrat.Api.Helpers;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Razorpay.Api;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RazorPayPaymentController : ControllerBase
    {
        //private const string RAZORPAY_KEY = "rzp_test_SAyyJpAwngeELw";
        //private const string RAZORPAY_SECRET = "8Au83rntX9vQslAlgM4Z9NiB";

        private const string RAZORPAY_KEY = "rzp_live_SAywFmrElCuSJH";
        private const string RAZORPAY_SECRET = "oQmy8qIa09hGxop7d05f3Pex";

        private readonly FinocratDbContext _db;
        private readonly DataUtils _dataUtils;
        public RazorPayPaymentController(FinocratDbContext db, DataUtils dataUtils)
        {
            _db = db;
            _dataUtils = dataUtils;
        }


        // =========================================
        // ✅ GET GATEWAYS + LIMIT
        // =========================================
        [HttpGet("gateways")]
        public async Task<IActionResult> GetGateways(string userPhone)
        {
            if (string.IsNullOrEmpty(userPhone))
                return BadRequest("userPhone is required");

            var data = await _db.fUserLookups
                .FirstOrDefaultAsync(x => x.UserPhone == userPhone);

            if(data == null)
            {
                return Ok(new
                {
                    payInEnabled = false,
                    payInLimit = 0,
                    gateways = new List<object>()
                });

            }

            // ✅ DEFAULT SETTINGS
            Dictionary<string, object> settings = new()
            {
                { "PayIn Enabled", false },
                { "System PayIn Limit", 10000 },

                { "REduction Enabled", false },
                { "CEducation Enabled", false },
               // { "CC Enabled", false }
            };

            // ✅ FIXED DESERIALIZATION
            if (data != null && !string.IsNullOrEmpty(data.LookupJson))
            {
                var dbSettings = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(data.LookupJson);

                foreach (var key in dbSettings.Keys)
                {
                    settings[key] = ConvertJsonElement(dbSettings[key]);
                }
            }

            // ✅ CHECK PAYIN ENABLE
            bool payInEnabled = settings.ContainsKey("PayIn Enabled") &&
                                (bool)settings["PayIn Enabled"];

            if (!payInEnabled)
            {
                return Ok(new
                {
                    payInEnabled = false,
                    payInLimit = 0,
                    gateways = new List<object>()
                });
            }

            // ✅ LIMIT
            decimal payInLimit = 0;

            var adminData = await _db.fUserLookups
                .FirstOrDefaultAsync(x => x.UserPhone == "Admin");

            if (adminData != null && !string.IsNullOrEmpty(adminData.LookupJson))
            {
                var adminSettings = JsonSerializer.Deserialize<Dictionary<string, object>>(adminData.LookupJson);

                if (adminSettings.ContainsKey("System PayIn Limit"))
                {
                    payInLimit = ConvertToDecimal(adminSettings["System PayIn Limit"]);
                }
            }
            else
            {
                // fallback
                payInLimit = ConvertToDecimal(settings["System PayIn Limit"]);
            }

            // ✅ GATEWAYS
            var gateways = new List<object>();
            int id = 1;

            if (settings.ContainsKey("REduction Enabled") && (bool)settings["REduction Enabled"])
                gateways.Add(new { id = id++, name = "REduction" });

            if (settings.ContainsKey("CEducation Enabled") && (bool)settings["CEducation Enabled"])
                gateways.Add(new { id = id++, name = "CEducation" });

            //if (settings.ContainsKey("CC Enabled") && (bool)settings["CC Enabled"])
            //    gateways.Add(new { id = id++, name = "Credit Card" });

            return Ok(new
            {
                payInEnabled = true,
                payInLimit = payInLimit,
                gateways = gateways
            });
        }

        // =========================================
        // ✅ HELPER: FIX JSON VALUE TYPES
        // =========================================
        private object ConvertJsonElement(JsonElement je)
        {
            switch (je.ValueKind)
            {
                case JsonValueKind.String:
                    return je.GetString();

                case JsonValueKind.Number:
                    if (je.TryGetInt32(out int i)) return i;
                    if (je.TryGetDecimal(out decimal d)) return d;
                    return je.GetDouble();

                case JsonValueKind.True:
                    return true;

                case JsonValueKind.False:
                    return false;

                default:
                    return null;
            }
        }
        // =========================================
        // ✅ HELPERS (IMPORTANT)
        // =========================================

        private bool ConvertToBool(object value)
        {
            if (value == null) return false;

            if (value is bool b)
                return b;

            if (value is JsonElement je)
            {
                if (je.ValueKind == JsonValueKind.True) return true;
                if (je.ValueKind == JsonValueKind.False) return false;

                if (je.ValueKind == JsonValueKind.String)
                    return je.GetString()?.ToLower() == "true";
            }

            return value.ToString().ToLower() == "true";
        }

        private decimal ConvertToDecimal(object value)
        {
            if (value == null) return 0;

            if (value is decimal d)
                return d;

            if (value is JsonElement je)
            {
                if (je.ValueKind == JsonValueKind.Number)
                    return je.GetDecimal();

                if (je.ValueKind == JsonValueKind.String)
                    return decimal.Parse(je.GetString());
            }

            return Convert.ToDecimal(value);
        }


        // CREATE ORDER
        [HttpPost("create-order")]
        public IActionResult CreateOrder([FromBody] OrderRequest model)
        {
            var client = new RazorpayClient(RAZORPAY_KEY, RAZORPAY_SECRET);

            var options = new Dictionary<string, object>
        {
            { "amount", model.Amount * 100 },
            { "currency", "INR" },
            { "receipt", Guid.NewGuid().ToString() },
            { "payment_capture", 1 }
        };

            var order = client.Order.Create(options);

            return Ok(new
            {
                orderId = order["id"].ToString(),
                amount = model.Amount,
                key = RAZORPAY_KEY
            });
        }

        [HttpPost("verify")]
        public async Task<IActionResult> VerifyPayment([FromBody] VerifyPaymentRequest model)
        {
            try
            {
                var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);

                string payload = model.OrderId + "|" + model.PaymentId;
                string generatedSignature = GenerateSignature(payload, RAZORPAY_SECRET);

                // ❌ Signature mismatch
                if (generatedSignature != model.Signature)
                    return BadRequest(new { status = "FAILED" });

                var client = new RazorpayClient(RAZORPAY_KEY, RAZORPAY_SECRET);

                var payment = client.Payment.Fetch(model.PaymentId);
                var razorPayCard = client.Card.FetchCardDetails(model.PaymentId);

                // ❌ Payment not captured
                if (payment["status"].ToString() != "captured")
                    return BadRequest(new { status = "FAILED" });

                // ✅ Duplicate check
                var existing = _db.fPayIns.FirstOrDefault(x => x.PaymentId == model.PaymentId);
                if (existing != null)
                    return Ok(new { status = "SUCCESS" });

                var user = _db.fUsers.FirstOrDefault(t => t.UserPhone == model.LoggedInUserPhone);
                if (user == null)
                    return BadRequest(new { status = "FAILED" });

                // ✅ PayIn Margin
                decimal payInLimit = 0;
                var lookup = _db.fUserLookups.FirstOrDefault(x => x.UserPhone == model.LoggedInUserPhone);

                if (lookup != null)
                {
                    var settings = JsonSerializer.Deserialize<Dictionary<string, object>>(lookup.LookupJson);

                    if (settings.ContainsKey("PayIn Margin"))
                    {
                        var value = settings["PayIn Margin"];

                        if (value is JsonElement element)
                        {
                            if (element.ValueKind == JsonValueKind.String)
                                payInLimit = decimal.Parse(element.GetString());
                            else if (element.ValueKind == JsonValueKind.Number)
                                payInLimit = element.GetDecimal();
                        }
                    }
                }

                // =========================
                // ✅ STEP 1: INSERT PAYIN
                // =========================
                var payIn = new FPayIn
                {
                    UserId = user.Id,
                    UserPhone = model.LoggedInUserPhone,
                    UserEmail = user.Email,
                    CardHolderName = model.CardHolderName,
                    CardHolderPhone = model.Mobile,
                    CardHolderEmail = model.CardHolderMail,
                    CardHolderCardNumber = model.CardHolderCard,
                    Result = payment["status"],
                    CardBrand = razorPayCard["issuer"] ?? "",
                    BankName = razorPayCard["network"] ?? "",
                    CardType = razorPayCard["sub_type"] ?? "",
                    Status = true,
                    CardNo = razorPayCard["last4"] ?? "",
                    PaymentId = model.PaymentId,
                    TaxNumber = model.OrderId,
                    Amount = model.Amount,
                    PayInCommission = model.Amount * payInLimit / 100,
                    FCommission = model.Amount / 100,
                    Gateway = model.SelectedGateway,
                    Created = istNow
                };

                await _db.fPayIns.AddAsync(payIn);
                await _db.SaveChangesAsync(); // ✅ FIRST SAVE

                // =========================
                // ✅ STEP 2: GET LATEST BALANCE
                // =========================
                var balance = await _dataUtils.GetWalletAmount(model.LoggedInUserPhone);

                // =========================
                // ✅ STEP 3: INSERT PASSBOOK
                // =========================
                var history = new FPassbookHistory
                {
                    UserId = user.Id,
                    UserPhone = model.LoggedInUserPhone,
                    Name = model.CardHolderName,
                    TxnId = model.PaymentId,
                    AccountNumber = model.CardHolderCard,
                    Amount = model.Amount,
                    TransactionType = "PayIn",
                    Status = true,
                    StatusMessage = payment["status"],
                    ParentId = payIn.Id, // ✅ now available
                    Balance = balance,
                    CreatedAt = istNow
                };

                await _db.fPassbookHistories.AddAsync(history);
                await _db.SaveChangesAsync(); // ✅ SECOND SAVE

                return Ok(new { status = "SUCCESS" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { status = "FAILED" });
            }
        }

        private static string GenerateSignature(string payload, string secret)
        {
            byte[] secretBytes = Encoding.UTF8.GetBytes(secret);
            using var hmac = new HMACSHA256(secretBytes);
            byte[] payloadBytes = Encoding.UTF8.GetBytes(payload);
            byte[] hash = hmac.ComputeHash(payloadBytes);
            return BitConverter.ToString(hash).Replace("-", "").ToLower();
        }
    
    }

    public class OrderRequest
    {
        public decimal Amount { get; set; }
    }

    public class VerifyPaymentRequest
    {
        public string OrderId { get; set; }
        public string PaymentId { get; set; }
        public string Signature { get; set; }

        public decimal Amount { get; set; }
        public string Mobile { get; set; }
        public string SelectedGateway { get; set; }
        public string LoggedInUserPhone { get; set; }
        public string CardHolderName { get; set; }
        public string CardHolderMail { get; set; }
        public string CardHolderCard { get; set; }
    }
}
