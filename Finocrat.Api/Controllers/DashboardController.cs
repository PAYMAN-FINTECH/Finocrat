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



    }
    public class DashboardFilter
    {
        public string Filter { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public string UserPhone { get; set; }
    }
}
