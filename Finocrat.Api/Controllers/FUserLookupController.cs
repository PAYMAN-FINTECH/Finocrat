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
        // ✅ GET USER SETTINGS (MERGED ADMIN DEFAULT)
        // =========================================
        [HttpGet("{userPhone}")]
        public async Task<IActionResult> GetUserLookup(string userPhone)
        {
            var data = await _db.fUserLookups
                .FirstOrDefaultAsync(x => x.UserPhone == userPhone);

            Dictionary<string, object> defaultSettings = new()
            {
                // 🔥 ADMIN DEFAULT CONFIG
                { "PayIn Enabled", true },
                { "PayOut Enabled", true },
                { "CC Enabled", true },

                { "PayIn Limit", 10000 },
                { "PayOut Limit", 5000 },
                { "CC Limit", 2000 },

                // 🔥 USER LEVEL CONFIG
                { "Razorpay Enabled", false },
                { "Cashfree Enabled", false },

                { "PayIn Margin", 0 },
                { "PayOut Margin", 0 },
                { "CC Margin", 0 }
            };

            if (data == null)
                return Ok(defaultSettings);

            var userSettings = JsonSerializer.Deserialize<Dictionary<string, object>>(data.LookupJson);

            // 🔥 MERGE DEFAULT + USER SETTINGS
            foreach (var key in defaultSettings.Keys)
            {
                if (!userSettings.ContainsKey(key))
                    userSettings[key] = defaultSettings[key];
            }

            return Ok(userSettings);
        }

        // =========================================
        // SAVE SETTINGS
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
                    UserId = userdetails?.Id ?? Guid.Empty,
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
        // USERS DROPDOWN
        // =========================================
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _db.fUsers
                .Select(x => new
                {
                    name = x.UserName,
                    userPhone = x.UserPhone
                }).ToListAsync();

            return Ok(users);
        }
    }
}
