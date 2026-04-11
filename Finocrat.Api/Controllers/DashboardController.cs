using Finocrat.Api.Data;
using Finocrat.Api.Models.DTOs.MainDtos;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Threading.Tasks;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly FinocratDbContext _db;
        private readonly DataUtils _dataUtils;
        public DashboardController(FinocratDbContext db, DataUtils dataUtils)
        {
            _db = db;
            _dataUtils = dataUtils;
        }

        [HttpPost]
        public async Task<IActionResult> GetStats([FromBody] DashboardFilter model)
        {
            if (model == null)
                return BadRequest("Invalid request");

            // 🔹 Get IST Time
            var indiaTimeZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
            var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, indiaTimeZone);

            DateTime startDate;
            DateTime endDate = istNow;

            switch (model.Filter?.ToLower())
            {
                case "today":
                    startDate = istNow.Date;
                    endDate = istNow.Date.AddDays(1).AddSeconds(-1);
                    break;

                case "yesterday":
                    startDate = istNow.Date.AddDays(-1);
                    endDate = istNow.Date.AddSeconds(-1);
                    break;

                case "week":
                    startDate = istNow.Date.AddDays(-7);
                    break;

                case "month":
                    startDate = new DateTime(istNow.Year, istNow.Month, 1);
                    break;

                case "custom":
                    if (model.FromDate == null || model.ToDate == null)
                        return BadRequest("Invalid date range");

                    startDate = model.FromDate.Value.Date;
                    endDate = model.ToDate.Value.Date.AddDays(1).AddSeconds(-1);
                    break;

                default:
                    startDate = istNow.Date.AddDays(-7);
                    break;
            }

            var query = _db.fPayIns
                .Where(x => x.Created >= startDate &&
                            x.Created <= endDate && x.UserPhone == model.UserPhone);

            var totalCount = await query.CountAsync();
            var successCount = await query.CountAsync(x => x.Status);
            var failedCount = await query.CountAsync(x => !x.Status);
            var totalAmount = await query
                .Where(x => x.Status)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            return Ok(new
            {
                totalCount,
                totalAmount,
                successCount,
                failedCount
            });
        }

        [HttpGet("wallet-balance")]
        public async Task<IActionResult> GetWalletBalance([FromQuery] string userPhone)
        {
            if (string.IsNullOrEmpty(userPhone))
            {
                return BadRequest(new { message = "User phone is required" });
            }

            var wallet = await _dataUtils.GetWalletAmount(userPhone);

            return Ok(new
            {
                userPhone,
                balance = wallet
            });
        }

        // =========================================
        // ✅ ADMIN DASHBOARD API (SAFE VERSION)
        // =========================================
        [HttpGet("admin-dash")]
        public async Task<IActionResult> GetDashboard(DateTime? from, DateTime? to)
        {
            // =========================
            // ✅ DATE RANGE (IMPORTANT FIX)
            // =========================
            DateTime startDate = (from ?? DateTime.Today).Date;
            DateTime endDate = (to ?? DateTime.Today).Date.AddDays(1);

            // =========================
            // ✅ PAYIN TOTAL
            // =========================
            var payInTotal = await _db.fPayIns
                .Where(x => x.Created >= startDate && x.Created < endDate && x.Status)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            // =========================
            // ✅ PAYOUT TOTAL
            // =========================
            var payOutTotal = await _db.fPayouts
                .Where(x => x.Created >= startDate && x.Created < endDate && x.Status)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            // =========================
            // ✅ USERS
            // =========================
            var users = await _db.fUsers
                .Where(x => x.IsActive)
                .Select(x => new
                {
                    x.UserName,
                    x.UserPhone
                })
                .ToListAsync();

            // =========================
            // ✅ USER-WISE PAYIN
            // =========================
            var payInGrouped = await _db.fPayIns
                .Where(x => x.Created >= startDate && x.Created < endDate)
                .GroupBy(x => x.UserPhone)
                .Select(g => new
                {
                    userPhone = g.Key,
                    total = g.Where(x => x.Status).Sum(x => x.Amount),
                    transactions = g
                        .OrderByDescending(x => x.Created)
                        .Select(x => new
                        {
                            amount = x.Amount,
                            status = x.Status,
                            created = x.Created,
                            paymentid = x.PaymentId,
                            cardno = x.CardNo,
                            cardholdername = x.CardHolderName,
                            cardholderphone = x.CardHolderPhone,
                            payincommission = x.PayInCommission,
                            fpayincommition = x.FCommission,

                        })
                        .ToList()
                })
                .ToListAsync();

            // =========================
            // ✅ USER-WISE PAYOUT
            // =========================
            var payOutGrouped = await _db.fPayouts
                .Where(x => x.Created >= startDate && x.Created < endDate)
                .GroupBy(x => x.UserPhone)
                .Select(g => new
                {
                    userPhone = g.Key,
                    total = g.Where(x => x.Status).Sum(x => x.Amount),
                    transactions = g
                        .OrderByDescending(x => x.Created)
                        .Select(x => new
                        {
                            amount = x.Amount,
                            status = x.Status,
                            created = x.Created,
                            txnId = x.TxnReferenceId,
                            paoutcommition = x.PaoutCommission,
                            customername = x.CustomerName,
                            cardnumber = x.CardNumber,
                            customerNumber = x.AccountNumber

                        })
                        .ToList()
                })
                .ToListAsync();

            // =========================
            // ✅ USER SUMMARY (PayIn + PayOut + Balance)
            // =========================
            var userSummary = new List<object>();
            decimal totalBalance = 0;

            foreach (var user in users)
            {
                var payIn = await _db.fPayIns
                    .Where(x => x.UserPhone == user.UserPhone && x.Status && x.Created >= startDate && x.Created < endDate)
                    .SumAsync(x => (decimal?)x.Amount) ?? 0;

                var payOut = await _db.fPayouts
                    .Where(x => x.UserPhone == user.UserPhone && x.Status && x.Created >= startDate && x.Created < endDate)
                    .SumAsync(x => (decimal?)x.Amount) ?? 0;

                var balance = _dataUtils.GetWalletAmount(user.UserPhone).Result;
                totalBalance += balance;

                userSummary.Add(new
                {
                    userName = user.UserName,
                    userPhone = user.UserPhone,
                    payIn,
                    payOut,
                    balance
                });
            }

            // =========================
            // ✅ FINAL RESPONSE
            // =========================
            return Ok(new
            {
                summary = new
                {
                    payInTotal,
                    payOutTotal,
                    totalBalance
                },
                users = userSummary,
                payIns = payInGrouped,
                payOuts = payOutGrouped
            });
        }
        
        // ✅ GET USERS (DROPDOWN)
        
        
        [HttpGet("GetUsers")]
        public IActionResult GetUsers()
        {

            var users = _db.fUsers
                .Where(x => x.IsActive)
                .Select(x => new AddFailedUserDto
                {
                    UserId = x.Id.ToString(),
                    Name = x.UserName ,
                    Mobile = x.UserPhone
                })
                .ToList();
            

            return Ok(users);
        }

        // ✅ ADD FAILED AMOUNT
        [HttpPost("AddFailedAmount")]
        public async Task<IActionResult> AddFailedAmount([FromBody] FailedAmountRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest("Invalid request");

                if (string.IsNullOrEmpty(request.UserId) || request.Amount <= 0)
                    return BadRequest("Required fields missing");

                var user = await _db.fUsers.FirstOrDefaultAsync(x => x.Id.ToString() == request.UserId);
                if (user == null)
                    return NotFound("User not found");

                var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);

                // ✅ DUPLICATE CHECK
                var existsPayIn = await _db.fPayIns.FirstOrDefaultAsync(x => x.PaymentId == request.RefId);
                var existsPayOut = await _db.fPayouts.FirstOrDefaultAsync(x => x.ExternalRef == request.RefId);

                if (existsPayIn != null || existsPayOut != null)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Already processed"
                    });
                }

                // =========================
                // ✅ PAYIN
                // =========================
                if (request.Mode == "PayIn")
                {
                    decimal payInLimit = 0;

                    var lookup = await _db.fUserLookups.FirstOrDefaultAsync(x => x.UserPhone == user.UserPhone);
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

                    var payIn = new FPayIn
                    {
                        UserId = user.Id,
                        UserPhone = user.UserPhone,
                        UserEmail = user.Email,
                        Result = "MANUAL_ADJUSTMENT",
                        Status = true,
                        PaymentId = request.OrderId,
                        TaxNumber = request.OrderId,
                        Amount = request.Amount,
                        PayInCommission = request.Amount * payInLimit / 100,
                        FCommission = request.Amount / 100,
                        Gateway = "REducation",
                        Created = istNow,
                        CardHolderName = "",
                        CardHolderPhone = request.customerMobile,
                        CardHolderEmail = "",
                        CardHolderCardNumber = request.RefId,
                        CardBrand = "",
                        BankName = "",
                        CardType = "",
                        CardNo =  request.RefId,
                    };

                    await _db.fPayIns.AddAsync(payIn);
                    await _db.SaveChangesAsync();

                    var balance = await _dataUtils.GetWalletAmount(user.UserPhone);

                    var history = new FPassbookHistory
                    {
                        UserId = user.Id,
                        UserPhone = user.UserPhone,
                        Name = "Manual PayIn",
                        TxnId = request.OrderId,
                        AccountNumber = request.RefId,
                        Amount = request.Amount,
                        TransactionType = "PayIn",
                        Status = true,
                        StatusMessage = "Manual Credit",
                        ParentId = payIn.Id,
                        Balance = balance,
                        CreatedAt = istNow
                    };

                    await _db.fPassbookHistories.AddAsync(history);
                }

                // =========================
                // ✅ PAYOUT / CC
                // =========================
                else if (request.Mode == "PayOut" || request.Mode == "CC")
                {
                    var payout = new FPayout
                    {
                        UserId = user.Id,
                        UserPhone = user.UserPhone,
                        ExternalRef = request.OrderId,
                        OrderId = request.OrderId,
                        CustomerName = "Manual",
                        Amount = request.Amount,
                        PaoutCommission = 15,
                        Status = true,
                        Result = "MANUAL_ADJUSTMENT",
                        Created = istNow,
                        TxnReferenceId = request.OrderId,
                        CardNumber = request.customerMobile,
                        AccountNumber = request.RefId,
                    };

                    await _db.fPayouts.AddAsync(payout);
                    await _db.SaveChangesAsync();

                    var balance = await _dataUtils.GetWalletAmount(user.UserPhone);

                    var history = new FPassbookHistory
                    {
                        UserId = user.Id,
                        UserPhone = user.UserPhone,
                        Name = "Manual" + request.Mode,
                        TxnId = request.OrderId,
                        AccountNumber = request.RefId,
                        Amount = request.Amount,
                        TransactionType = request.Mode,
                        Status = true,
                        StatusMessage = "Manual Adjustment",
                        ParentId = payout.Id,
                        Balance = balance,
                        CreatedAt = istNow
                    };

                    await _db.fPassbookHistories.AddAsync(history);
                }
                else
                {
                    return BadRequest("Invalid Mode");
                }

                // ✅ SINGLE SAVE
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Amount adjusted successfully"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }


        // ✅ SET PIN

        [HttpPost("SetPin")]
        public IActionResult SetPin([FromBody] SetPinRequest request)
        {
            var user = _db.fUsers.FirstOrDefault(x => x.UserPhone == request.UserPhone);

            if (user == null)
                return BadRequest(new { success = false, message = "User not found" });

            if (!string.IsNullOrEmpty(user.Pin))
                return BadRequest(new { success = false, message = "PIN already set" });

            user.Pin = request.Pin;

            _db.SaveChanges();

            return Ok(new { success = true, message = "PIN set successfully" });
        }


        // ✅ VERIFY PIN
        [HttpPost("VerifyPin")]
        public IActionResult VerifyPin([FromBody] SetPinRequest request)
        {
            var user = _db.fUsers.FirstOrDefault(x => x.UserPhone == request.UserPhone);

            if (user == null)
                return BadRequest(new { success = false, message = "User not found" });

            if (user.Pin != request.Pin)
                return BadRequest(new { success = false, message = "Invalid PIN" });

            return Ok(new { success = true, message = "PIN verified" });
        }


        // ✅ CHANGE PIN
        [HttpPost("ChangePin")]
        public IActionResult ChangePin([FromBody] ChangePinRequest request)
        {
            var user = _db.fUsers.FirstOrDefault(x => x.UserPhone == request.UserPhone);

            if (user == null)
                return BadRequest(new { success = false, message = "User not found" });

            if (user.Pin != request.OldPin)
                return BadRequest(new { success = false, message = "Old PIN incorrect" });

            if (request.OldPin == request.NewPin)
                return BadRequest(new { success = false, message = "New PIN must be different" });

            user.Pin = request.NewPin;

            _db.SaveChanges();

            return Ok(new { success = true, message = "PIN changed successfully" });
        }


    }
    public class DashboardFilter
    {
        public string Filter { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string UserPhone { get; set; }
    }

    public class UserBalanceDto
    {
        public string Name { get; set; }
        public string Phone { get; set; }
        public decimal Balance { get; set; }
    }

    public class FailedAmountRequest
    {
        public string UserId { get; set; }
        public string Mode { get; set; }   // PayIn / PayOut / CC
        public decimal Amount { get; set; }
        public string OrderId { get; set; }
        public string RefId { get; set; }
        public string customerMobile { get; set; }
    }
    public class AddFailedUserDto
    {
        public string UserId { get; set; }
        public string Name { get; set; }
        public string Mobile { get; set; }
    }

    public class SetPinRequest
    {
        public string UserPhone { get; set; }
        public string Pin { get; set; }
    }

    public class PinRequest
    {
        public string UserPhone { get; set; }
        public string Pin { get; set; }
    }

    public class ChangePinRequest
    {
        public string UserPhone { get; set; }
        public string OldPin { get; set; }
        public string NewPin { get; set; }
    }
}
