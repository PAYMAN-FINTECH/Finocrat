using Finocrat.Api.Data;
using Finocrat.Api.Helpers;
using Finocrat.Api.Models.DTOs.MainDtos;
using Finocrat.Api.Models.Entities.Main;
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
                .FirstOrDefault(x => x.UserName == request.UserId && x.IsActive);

            if (user == null || user.Password != request.Password)
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var expiry = request.RememberMe
                ? DateTime.UtcNow.AddDays(7)
                : DateTime.UtcNow.AddHours(2);

            var token = _jwt.GenerateJwtMain(user, expiry);

            // ✅ Send only required user details to frontend
            var userDto = new
            {
                userId = "PM",
                name = user.UserName,
                userPhone = user.UserPhone
            };

            return Ok(new
            {
                token,
                user = userDto
            });
        }

        // GET ALL USERS
        // GET ALL USERS
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _db.fUsers
                .Select(u => new
                {
                    u.Id,
                    u.UserName,
                    u.UserPhone,
                    u.Email,
                    u.IsActive,
                    u.Gender
                })
                .ToListAsync();

            return Ok(users);
        }

        // ADD USER
        [HttpPost("add")]
        public async Task<IActionResult> AddUser(UserDto model)
        {
            var exists = await _db.fUsers
                .AnyAsync(x => x.UserPhone == model.UserPhone);

            if (exists)
                return BadRequest("User already exists");

            var user = new FUser
            {
                Id = Guid.NewGuid(),
                UserName = model.UserName,
                Password = model.Password,
                UserPhone = model.UserPhone,
                Email = model.Email,
                IsActive = model.IsActive,
                Gender = model.Gender,
                Created = DateTime.UtcNow
            };

            _db.fUsers.Add(user);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "User Created",
                data = user.Id
            });
        }

        // UPDATE USER
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, UserDto model)
        {
            var user = await _db.fUsers.FindAsync(id);
            if (user == null) return NotFound();

            user.UserName = model.UserName;
            user.Email = model.Email;
            user.UserPhone = model.UserPhone;
            user.Gender = model.Gender;
            user.IsActive = model.IsActive;

            if (!string.IsNullOrEmpty(model.Password))
                user.Password = model.Password;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "User Updated",
                data = user.Id
            });
        }

        [HttpGet("margin")]
        public async Task<IActionResult> GetMargins()
        {
            var data = await _db.fMargins.Where(t=>t.IsActive == true).ToListAsync();
            return Ok(data);
        }


    }
}
