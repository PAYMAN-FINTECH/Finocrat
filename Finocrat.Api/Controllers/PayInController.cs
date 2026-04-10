using Finocrat.Api.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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



        [HttpGet("payouthistory")]
        public IActionResult GetPayOutInHistory(DateTime? fromDate, DateTime? toDate, string userPhone)
        {

            var query = _db.fPayouts
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
                    x.TxnReferenceId,
                    x.Created
                })
                .ToList();

            return Ok(data);
        }

        [HttpGet("GetPassbook")]
        public async Task<IActionResult> GetPassbook(string mobile, DateTime? fromDate, DateTime? toDate)
        {
            var query = _db.fPassbookHistories
                .Where(x => x.UserPhone == mobile);

            if (fromDate.HasValue)
                query = query.Where(x => x.CreatedAt >= fromDate.Value);

            if (toDate.HasValue)
                query = query.Where(x => x.CreatedAt <= toDate.Value);

            var data = await query
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new
                {
                    x.TxnId,
                    x.Name,
                    x.AccountNumber,
                    x.TransactionType,
                    x.Amount,
                    x.Balance,
                    x.Status,
                    x.StatusMessage,
                    x.CreatedAt
                })
                .ToListAsync();

            return Ok(data);
        }

    }
}
