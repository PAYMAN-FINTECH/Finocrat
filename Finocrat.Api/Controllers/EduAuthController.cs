using Finocrat.Api.Data;
using Finocrat.Api.Helpers;
using Finocrat.Api.Models.DTOs.eduDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EduAuthController : ControllerBase
    {
        private readonly FinocratDbContext _db;
        private readonly JwtHelper _jwt;

        public EduAuthController(FinocratDbContext db, JwtHelper jwt)
        {
            _db = db;
            _jwt = jwt;
        }

        // 🔹 SIGNUP
        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] SignupRequestDto request)
        {
            var exists = await _db.eduUsers.AnyAsync(x => x.Email == request.Email);
            if (exists)
                return BadRequest(new { message = "Email already registered" });

            var user = new Models.Entities.Edu.eduUser
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = request.Password
            };

            await _db.eduUsers.AddAsync(user);  // ✅ Properly await the async operation
            await _db.SaveChangesAsync();

            return Ok(new { message = "Signup successful" });
        }

        // 🔹 LOGIN
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var user = await _db.eduUsers.FirstOrDefaultAsync(x => x.Email == request.Email && x.PasswordHash == request.Password);
            if (user == null)
                return Unauthorized(new { message = "Invalid email or password" });

            //var valid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            //if (!valid)
            //    return Unauthorized(new { message = "Invalid email or password" });

            var token = _jwt.GenerateToken(user);

            return Ok(new
            {
                token,
                user = new
                {
                    user.Id,
                    user.Name,
                    user.Email
                }
            });
        }
    }
}
