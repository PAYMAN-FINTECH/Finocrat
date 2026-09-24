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

            if (settings.ContainsKey("HEducation Enabled") && (bool)settings["HEducation Enabled"])
            {
                gateways.Add(new { id = id++, name = "HEducation" });
            }
                

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
            var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);

            string txnStatus = "FAILED";
            string remarks = "Transaction Failed";
            bool isSuccess = false;

            string cardBrand = "";
            string bankName = "";
            string cardType = "";
            string cardNo = "";
            decimal payInLimit = 0;

            // 1. Fetch User & Validate
            var user = await _db.fUsers.FirstOrDefaultAsync(t => t.UserPhone == model.LoggedInUserPhone);
            if (user == null)
            {
                return BadRequest(new { status = "FAILED", message = "User not found." });
            }

            // 2. Duplicate Check
            var existing = await _db.fPayIns.FirstOrDefaultAsync(x => x.PaymentId == model.PaymentId);
            if (existing != null)
            {
                return Ok(new { status = "SUCCESS" });
            }

            try
            {
                string payload = model.OrderId + "|" + model.PaymentId;
                string generatedSignature = GenerateSignature(payload, RAZORPAY_SECRET);

                var client = new RazorpayClient(RAZORPAY_KEY, RAZORPAY_SECRET);
                var payment = client.Payment.Fetch(model.PaymentId);
                var razorPayCard = client.Card.FetchCardDetails(model.PaymentId);

                if (!string.Equals(generatedSignature, model.Signature, StringComparison.Ordinal))
                {
                    remarks = "Signature Mismatch";
                }
                else
                {
                    cardBrand = razorPayCard["issuer"]?.ToString() ?? "";
                    bankName = razorPayCard["network"]?.ToString() ?? "";
                    cardType = razorPayCard["sub_type"]?.ToString() ?? "";
                    cardNo = razorPayCard["last4"]?.ToString() ?? "";

                    if (payment["status"]?.ToString() == "captured")
                    {
                        txnStatus = "SUCCESS";
                        remarks = "Payment Captured";
                        isSuccess = true;

                        var lookup = await _db.fUserLookups.FirstOrDefaultAsync(x => x.UserPhone == model.LoggedInUserPhone);
                        payInLimit = ExtractPayInMargin(lookup, cardType);
                    }
                    else
                    {
                        remarks = payment["status"]?.ToString() ?? "Payment Failed";
                    }
                }
            }
            catch (Exception ex)
            {
                remarks = ex.Message;
            }

            // 3. Database Updates inside Transaction
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                if (cardBrand != "ICIC")
                {
                    var payIn = new FPayIn
                    {
                        UserId = user.Id,
                        UserPhone = model.LoggedInUserPhone,
                        UserEmail = user.Email,
                        CardHolderName = model.CardHolderName,
                        CardHolderPhone = model.Mobile,
                        CardHolderEmail = model.CardHolderMail,
                        CardHolderCardNumber = model.CardHolderCard,
                        Result = txnStatus,
                        Status = isSuccess,
                        CardBrand = cardBrand,
                        BankName = bankName,
                        CardType = cardType,
                        CardNo = cardNo,
                        PaymentId = model.PaymentId,
                        TaxNumber = model.OrderId,
                        Amount = model.Amount,
                        PayInCommission = isSuccess ? (model.Amount * payInLimit / 100) : 0,
                        FCommission = isSuccess ? (model.Amount / 100) : 0,
                        Gateway = model.SelectedGateway,
                        Created = istNow
                    };

                    await _db.fPayIns.AddAsync(payIn);
                    await _db.SaveChangesAsync();

                    if (isSuccess)
                    {
                        decimal balance = await _dataUtils.GetWalletAmount(model.LoggedInUserPhone);
                        var history = new FPassbookHistory
                        {
                            UserId = user.Id,
                            UserPhone = model.LoggedInUserPhone,
                            Name = model.CardHolderName,
                            TxnId = model.PaymentId,
                            AccountNumber = model.CardHolderCard,
                            Amount = model.Amount,
                            TransactionType = "PayIn",
                            Status = isSuccess,
                            StatusMessage = remarks,
                            ParentId = payIn.Id,
                            Balance = balance,
                            CreatedAt = istNow
                        };

                        await _db.fPassbookHistories.AddAsync(history);
                        await _db.SaveChangesAsync();
                    }
                }

                if (user.ParentUserId != null)
                {
                    if (user.UserTypeId == 2)
                    {
                        var distribussionUser = await _db.fUsers.FirstOrDefaultAsync(t => t.Id == user.ParentUserId);
                        if (distribussionUser != null)
                        {
                            var lookup = await _db.fUserLookups.FirstOrDefaultAsync(x => x.UserPhone == distribussionUser.UserPhone);
                            decimal distributtercommission = ExtractPayInMargin(lookup, cardType);

                            decimal distcomm = payInLimit - distributtercommission;
                            decimal amount = model.Amount * distcomm / 100;

                            if (amount > 0)
                            {

                                var distpayIn = new FPayIn
                                {
                                    UserId = distribussionUser.Id,
                                    UserPhone = distribussionUser.UserPhone,
                                    UserEmail = distribussionUser.Email,
                                    CardHolderName = model.CardHolderName,
                                    CardHolderPhone = model.Mobile,
                                    CardHolderEmail = model.CardHolderMail,
                                    CardHolderCardNumber = model.CardHolderCard,
                                    Result = txnStatus,
                                    Status = isSuccess,
                                    CardBrand = cardBrand,
                                    BankName = bankName,
                                    CardType = cardType,
                                    CardNo = cardNo,
                                    PaymentId = model.PaymentId,
                                    TaxNumber = model.OrderId,
                                    Amount = amount,
                                    PayInCommission = 0,
                                    FCommission = isSuccess ? (model.Amount / 100) : 0,
                                    Gateway = model.SelectedGateway,
                                    Created = istNow,
                                    UserTypeId = user.UserTypeId,
                                    PatentTypeId = user.Id
                                };

                                await _db.fPayIns.AddAsync(distpayIn);
                                await _db.SaveChangesAsync();

                                if (isSuccess)
                                {
                                    decimal distibalance = await _dataUtils.GetWalletAmount(distribussionUser.UserPhone);
                                    var history = new FPassbookHistory
                                    {
                                        UserId = distribussionUser.Id,
                                        UserPhone = distribussionUser.UserPhone,
                                        Name = model.CardHolderName,
                                        TxnId = model.PaymentId,
                                        AccountNumber = model.CardHolderCard,
                                        Amount = amount,
                                        TransactionType = "PayIn",
                                        Status = isSuccess,
                                        StatusMessage = remarks,
                                        ParentId = distpayIn.Id,
                                        Balance = distibalance,
                                        CreatedAt = istNow,
                                        UserTypeId = user.UserTypeId
                                    };

                                    await _db.fPassbookHistories.AddAsync(history);
                                    await _db.SaveChangesAsync();
                                }
                            }
                        }
                    }

                    if (user.UserTypeId == 3)
                    {
                        var distibussionCommissssionUser = await _db.fUsers.FirstOrDefaultAsync(t => t.Id == user.ParentUserId);
                        var superdistribussionUser = distibussionCommissssionUser != null
                            ? await _db.fUsers.FirstOrDefaultAsync(t => t.Id == distibussionCommissssionUser.ParentUserId)
                            : null;

                        if (distibussionCommissssionUser != null && superdistribussionUser != null)
                        {
                            var lookup = await _db.fUserLookups.FirstOrDefaultAsync(x => x.UserPhone == distibussionCommissssionUser.UserPhone);
                            decimal distributtercommission = ExtractPayInMargin(lookup, cardType);

                            var distlookup = await _db.fUserLookups.FirstOrDefaultAsync(x => x.UserPhone == superdistribussionUser.UserPhone);
                            decimal superDistibutioncommission = ExtractPayInMargin(distlookup, cardType);

                            decimal distcomm = payInLimit - distributtercommission;
                            decimal distamount = model.Amount * distcomm / 100;

                            if (distamount > 0)
                            {
                            

                            var distpayIn = new FPayIn
                            {
                                UserId = distibussionCommissssionUser.Id,
                                UserPhone = distibussionCommissssionUser.UserPhone,
                                UserEmail = distibussionCommissssionUser.Email,
                                CardHolderName = model.CardHolderName,
                                CardHolderPhone = model.Mobile,
                                CardHolderEmail = model.CardHolderMail,
                                CardHolderCardNumber = model.CardHolderCard,
                                Result = txnStatus,
                                Status = isSuccess,
                                CardBrand = cardBrand,
                                BankName = bankName,
                                CardType = cardType,
                                CardNo = cardNo,
                                PaymentId = model.PaymentId,
                                TaxNumber = model.OrderId,
                                Amount = distamount,
                                PayInCommission = 0,
                                FCommission = isSuccess ? (model.Amount / 100) : 0,
                                Gateway = model.SelectedGateway,
                                Created = istNow,
                                UserTypeId = user.UserTypeId,
                                PatentTypeId = user.Id
                            };

                            await _db.fPayIns.AddAsync(distpayIn);
                            await _db.SaveChangesAsync();

                            if (isSuccess)
                            {
                                decimal distibalance = await _dataUtils.GetWalletAmount(distibussionCommissssionUser.UserPhone);
                                var history = new FPassbookHistory
                                {
                                    UserId = distibussionCommissssionUser.Id,
                                    UserPhone = distibussionCommissssionUser.UserPhone,
                                    Name = model.CardHolderName,
                                    TxnId = model.PaymentId,
                                    AccountNumber = model.CardHolderCard,
                                    Amount = distamount,
                                    TransactionType = "PayIn",
                                    Status = isSuccess,
                                    StatusMessage = remarks,
                                    ParentId = distpayIn.Id,
                                    Balance = distibalance,
                                    CreatedAt = istNow,
                                    UserTypeId = user.UserTypeId
                                };

                                await _db.fPassbookHistories.AddAsync(history);
                                await _db.SaveChangesAsync();
                            }
                        }

                            decimal superdistcomm = distributtercommission - superDistibutioncommission;
                            decimal superamount = model.Amount * superdistcomm / 100;
                            if (superamount > 0)
                            {
                                var superdistpayIn = new FPayIn
                                {
                                    UserId = superdistribussionUser.Id,
                                    UserPhone = superdistribussionUser.UserPhone,
                                    UserEmail = superdistribussionUser.Email,
                                    CardHolderName = model.CardHolderName,
                                    CardHolderPhone = model.Mobile,
                                    CardHolderEmail = model.CardHolderMail,
                                    CardHolderCardNumber = model.CardHolderCard,
                                    Result = txnStatus,
                                    Status = isSuccess,
                                    CardBrand = cardBrand,
                                    BankName = bankName,
                                    CardType = cardType,
                                    CardNo = cardNo,
                                    PaymentId = model.PaymentId,
                                    TaxNumber = model.OrderId,
                                    Amount = superamount,
                                    PayInCommission = 0,
                                    FCommission = isSuccess ? (model.Amount / 100) : 0,
                                    Gateway = model.SelectedGateway,
                                    Created = istNow,
                                    UserTypeId = distibussionCommissssionUser.UserTypeId,
                                    PatentTypeId = distibussionCommissssionUser.Id
                                };

                                await _db.fPayIns.AddAsync(superdistpayIn);
                                await _db.SaveChangesAsync();

                                if (isSuccess)
                                {
                                    decimal superdistibalance = await _dataUtils.GetWalletAmount(superdistribussionUser.UserPhone);
                                    var history = new FPassbookHistory
                                    {
                                        UserId = superdistribussionUser.Id,
                                        UserPhone = superdistribussionUser.UserPhone,
                                        Name = model.CardHolderName,
                                        TxnId = model.PaymentId,
                                        AccountNumber = model.CardHolderCard,
                                        Amount = superamount,
                                        TransactionType = "PayIn",
                                        Status = isSuccess,
                                        StatusMessage = remarks,
                                        ParentId = superdistpayIn.Id,
                                        Balance = superdistibalance,
                                        CreatedAt = istNow,
                                        UserTypeId = distibussionCommissssionUser.UserTypeId
                                    };

                                    await _db.fPassbookHistories.AddAsync(history);
                                    await _db.SaveChangesAsync();
                                }
                            }
                        }
                    }
                }

                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { status = "FAILED", message = ex.Message });
            }

            if (isSuccess)
            {
                return Ok(new { status = "SUCCESS" });
            }

            return BadRequest(new
            {
                status = "FAILED",
                message = remarks
            });
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
