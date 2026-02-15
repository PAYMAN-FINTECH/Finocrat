using Finocrat.Api.Data;
using Finocrat.Api.Models.DTOs.MainDtos;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FUserLookupController : ControllerBase
    {
        private readonly FinocratDbContext _db;

        public FUserLookupController(FinocratDbContext db)
        {
            _db = db;
        }

        // =========================================
        // GET USER SETTINGS
        // GET: api/FUserLookup/{userId}
        // =========================================
        [HttpGet("{userPhone}")]
        public async Task<IActionResult> GetUserLookup(string userPhone)
        {
            var data = await _db.fUserLookups
                .FirstOrDefaultAsync(x => x.UserPhone == userPhone);

            if (data == null)
            {
                // Default structure
                return Ok(new Dictionary<string, object>
                {
                    { "razorpay", false },
                    { "payinAmount", 0 },
                    { "moreMargin", 0 },
                    { "hdfcMargin", 0 },
                    { "corporateMargin", 0 }
                });
            }

            var settings = JsonSerializer.Deserialize<Dictionary<string, object>>(data.LookupJson);

            return Ok(settings);
        }

        // =========================================
        // INSERT OR UPDATE
        // POST: api/FUserLookup
        // =========================================
        [HttpPost]
        public async Task<IActionResult> SaveUserLookup([FromBody] FUserLookupDto dto)
        {
            if (dto == null || dto.Settings == null)
                return BadRequest("Invalid Data");

            var existing = await _db.fUserLookups
                .FirstOrDefaultAsync(x => x.UserPhone == dto.userPhone);

            var userdetails = await _db.fUsers
                .FirstOrDefaultAsync(x => x.UserPhone == dto.userPhone);

            string jsonData = JsonSerializer.Serialize(dto.Settings);

            if (existing == null)
            {
                var entity = new FUserLookup
                {
                    Id = Guid.NewGuid(),
                    UserId = userdetails != null ? userdetails.Id : Guid.Empty,
                    UserPhone = dto.userPhone,
                    LookupJson = jsonData,
                    CreatedOn = DateTime.Now
                };

                _db.fUserLookups.Add(entity);
            }
            else
            {
                existing.LookupJson = jsonData;
                existing.UpdatedOn = DateTime.Now;
            }

            await _db.SaveChangesAsync();

            return Ok(new { message = "Saved Successfully" });
        }

        // =========================================
        // DELETE
        // DELETE: api/FUserLookup/{userId}
        // =========================================
        [HttpDelete("{userId}")]
        public async Task<IActionResult> Delete(Guid userId)
        {
            var data = await _db.fUserLookups
                .FirstOrDefaultAsync(x => x.UserId == userId);

            if (data == null)
                return NotFound();

            _db.fUserLookups.Remove(data);
            await _db.SaveChangesAsync();

            return Ok("Deleted Successfully");
        }
    }
}