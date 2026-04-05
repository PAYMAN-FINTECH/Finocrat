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
            DateTime start = from ?? DateTime.Today;
            DateTime end = to ?? DateTime.Today.AddDays(1);

            // =========================
            // ✅ PAYIN TOTAL (SUM)
            // =========================
            var payInTotal = await _db.fPayIns
                .Where(x => x.Created >= start && x.Created < end && x.Status)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            // =========================
            // ✅ PAYOUT TOTAL (SUM)
            // =========================
            var payOutTotal = await _db.fPayouts
                .Where(x => x.Created >= start && x.Created < end && x.Status)
                .SumAsync(x => (decimal?)x.Amount) ?? 0;

            // =========================
            // ✅ USER LIST
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
            // ✅ USER BALANCE (SEQUENTIAL → FIXES DB ERROR)
            // =========================
            var userWithBalance = new List<object>();
            decimal totalUserBalance = 0;

            foreach (var user in users)
            {
                var balance = await _dataUtils.GetWalletAmount(user.UserPhone);

                totalUserBalance += balance;

                userWithBalance.Add(new
                {
                    user.UserName,
                    user.UserPhone,
                    Balance = balance
                });
            }

            // =========================
            // ✅ PAYIN LIST
            // =========================
            var payIns = await _db.fPayIns
                .Where(x => x.Created >= start && x.Created < end)
                .OrderByDescending(x => x.Created)
                .Select(x => new
                {
                    x.Id,
                    x.UserPhone,
                    x.Amount,
                    x.Status,
                    x.Created
                })
                .ToListAsync();

            // =========================
            // ✅ PAYOUT LIST
            // =========================
            var payOuts = await _db.fPayouts
                .Where(x => x.Created >= start && x.Created < end)
                .OrderByDescending(x => x.Created)
                .Select(x => new
                {
                    x.Id,
                    x.UserPhone,
                    x.Amount,
                    x.Status,
                    x.Created
                })
                .ToListAsync();

            // =========================
            // ✅ FINAL RESPONSE
            // =========================
            return Ok(new
            {
                summary = new
                {
                    payInTotal,
                    payOutTotal,
                    totalUserBalance
                },
                users = userWithBalance,
                payIns,
                payOuts
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
        public IActionResult AddFailedAmount([FromBody] FailedAmountRequest request)
        {
            try
            {
                if (request == null)
                    return BadRequest("Invalid request");

                if (string.IsNullOrEmpty(request.UserId) || request.Amount <= 0)
                    return BadRequest("Required fields missing");

                var user = _db.fUsers.FirstOrDefault(x => x.Id.ToString() == request.UserId);
                if (user == null)
                    return NotFound("User not found");

                var data = _db.fUserLookups
            .FirstOrDefault(x => x.UserPhone == user.UserPhone);
                var dbSettings = JsonSerializer.Deserialize<Dictionary<string, object>>(data.LookupJson);


                if (request.Mode == "PayIn")
                {
                    decimal payInLimit = 0;

                    if (dbSettings.ContainsKey("PayIn Margin"))
                    {
                        var value = dbSettings["PayIn Margin"];

                        if (value is JsonElement element)
                        {
                            if (element.ValueKind == JsonValueKind.String)
                                payInLimit = decimal.Parse(element.GetString());
                            else if (element.ValueKind == JsonValueKind.Number)
                                payInLimit = element.GetDecimal();
                        }
                    }

                    var istZone = TimeZoneInfo.FindSystemTimeZoneById("India Standard Time");
                    var istNow = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, istZone);


                    var payIns = new FPayIn
                    {
                        UserId = user.Id,
                        UserPhone = user.UserPhone,
                        UserEmail = user.Email,
                        CardHolderName = "",
                        CardHolderPhone = "",
                        CardHolderEmail = "",
                        CardHolderCardNumber = "",
                        Result = "captured",
                        CardBrand =  "",
                        BankName =  "",// razorPayCard["sub_type"]
                        CardType =  "",
                        Status = true,
                        CardNo =  "",
                        PaymentId = request.RefId,
                        TaxNumber = request.OrderId,
                        Amount = request.Amount,
                        PayInCommission = request.Amount * payInLimit / 100,
                        FCommission = request.Amount / 100,
                        Gateway = "REduction",
                        Created = istNow
                    };

                    var res = _dataUtils.InsertAsync(payIns);

                }




                // 🔥 BUSINESS LOGIC
                // You can store in DB OR update wallet

                // Example:
                var transactionId = Guid.NewGuid().ToString();

                // TODO:
                // 1. Insert into FailedTransactions table
                // 2. Credit/Debit wallet based on Mode
                // 3. Maintain audit log

                var response = new
                {
                    success = true,
                    message = "Amount adjusted successfully",
                    transactionId = transactionId
                };

                return Ok(response);
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
