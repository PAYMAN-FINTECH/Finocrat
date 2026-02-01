using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        [HttpPost]
        public IActionResult GetStats([FromBody] DashboardFilter model)
        {

            //DateTime startDate;
            //DateTime endDate = DateTime.Today;

            //switch (filter)
            //{
            //    case "today":
            //        startDate = DateTime.Today;
            //        break;

            //    case "yesterday":
            //        startDate = DateTime.Today.AddDays(-1);
            //        endDate = DateTime.Today.AddDays(-1);
            //        break;

            //    case "week":
            //        startDate = DateTime.Today.AddDays(-7);
            //        break;

            //    case "month":
            //        startDate = new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1);
            //        break;

            //    case "custom":
            //        if (from == null || to == null)
            //            return BadRequest("Invalid date range");
            //        startDate = from.Value;
            //        endDate = to.Value;
            //        break;

            //    default:
            //        startDate = DateTime.Today.AddDays(-7);
            //        break;
            //}

            return Ok(new
            {
                totalCount = 12,
                totalAmount = 48500,
                successCount = 10,
                failedCount = 2
            });
        }


       
    }
    public class DashboardFilter
    {
        public string Filter { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
    }
}
