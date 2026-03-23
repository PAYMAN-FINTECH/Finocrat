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

        [HttpGet("{userPhone}")]
        public async Task<IActionResult> GetUserLookup(string userPhone)
        {
            var data = await _db.fUserLookups
                .FirstOrDefaultAsync(x => x.UserPhone == userPhone);

            var userDetails = await _db.fUsers
                .FirstOrDefaultAsync(x => x.UserPhone == userPhone);

            if (userDetails == null)
                return BadRequest("User not found");

            // =========================================
            // DEFAULT SETTINGS
            // =========================================
            Dictionary<string, object> defaultSettings = new();

            // ✅ ADMIN CONFIG
            if (userDetails.IsAdmin == true && userDetails.UserName == "Admin")
            {
                defaultSettings.Add("System PayIn", false);
                defaultSettings.Add("System PayOut", false);
                defaultSettings.Add("System CC", false);

                defaultSettings.Add("System PayIn Limit", 10000);
                defaultSettings.Add("System PayOut Limit", 10000);
                defaultSettings.Add("System CC Limit", 10000);
            }

            // ✅ COMMON USER CONFIG
            defaultSettings.Add("REduction Enabled", false);
            defaultSettings.Add("CEducation Enabled", false);

            defaultSettings.Add("PayIn Margin", 0);
            defaultSettings.Add("PayOut Margin", 0);
            defaultSettings.Add("CC Margin", 0);

            defaultSettings.Add("PayIn Enabled", false);
            defaultSettings.Add("PayOut Enabled", false);
            defaultSettings.Add("CC Enabled", false);

            // =========================================
            // IF NO DB DATA → RETURN DEFAULT
            // =========================================
            if (data == null)
                return Ok(defaultSettings);

            var userSettings = JsonSerializer.Deserialize<Dictionary<string, object>>(data.LookupJson)
                              ?? new Dictionary<string, object>();

            // =========================================
            // MERGE DEFAULT + USER SETTINGS
            // =========================================
            foreach (var key in defaultSettings.Keys)
            {
                if (!userSettings.ContainsKey(key))
                {
                    userSettings[key] = defaultSettings[key];
                }
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
