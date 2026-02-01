using Finocrat.Api.Data;
using Finocrat.Api.Helpers;
using Finocrat.Api.Models.DTOs.MainDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {

        private readonly FinocratDbContext _db;
        private readonly JwtHelper _jwt;

        public AuthController(FinocratDbContext db, JwtHelper jwt)
        {
            _db = db;
            _jwt = jwt;
        }


        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequestDTO request)
        {
            var user = _db.fUsers
                .FirstOrDefault(x => x.UserName == request.UserId && x.IsActive == true);

            if (user == null || user.Password != request.Password)
                return Unauthorized(new { message = "Invalid credentials" });

            var expiry = request.RememberMe
                ? DateTime.UtcNow.AddDays(7)
                : DateTime.UtcNow.AddHours(2);

            var token = _jwt.GenerateJwtMain(user, expiry);

            return Ok(new { token });
        }

    }
}
