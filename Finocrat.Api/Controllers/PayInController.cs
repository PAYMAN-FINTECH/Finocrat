using Finocrat.Api.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PayInController : ControllerBase
    {
        private readonly FinocratDbContext _db;
        private readonly DataUtils _dataUtils;
        public PayInController(FinocratDbContext db, DataUtils dataUtils)
        {
            _db = db;
            _dataUtils = dataUtils;
        }


        [HttpGet("history")]
        public IActionResult GetPayInHistory(DateTime? fromDate, DateTime? toDate, string userPhone)
        {

            var query = _db.fPayIns
                .Where(x => x.UserPhone == userPhone);

            // Default: Today
            if (!fromDate.HasValue && !toDate.HasValue)
            {
                var today = DateTime.UtcNow.Date;
                query = query.Where(x => x.Created >= today);
            }
            else
            {
                if (fromDate.HasValue)
                    query = query.Where(x => x.Created >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(x => x.Created <= toDate.Value.AddDays(1));
            }

            var data = query
                .OrderByDescending(x => x.Created)
                .Select(x => new
                {
                    x.Id,
                    x.Amount,
                    x.Status,
                    x.PaymentId,
                    x.Created
                })
                .ToList();

            return Ok(data);
        }
    }
}
