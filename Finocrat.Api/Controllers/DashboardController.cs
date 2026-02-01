using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetStats()
        {
            return Ok(new
            {
                totalCount = 1,
                totalAmount = 8000,
                successCount = 1
            });
        }
    }
}
