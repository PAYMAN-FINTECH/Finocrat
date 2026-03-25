using Finocrat.Api.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
}
