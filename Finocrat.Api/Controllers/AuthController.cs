using Finocrat.Api.Data;
using Finocrat.Api.Helpers;
using Finocrat.Api.Models.DTOs.MainDtos;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {

        private readonly FinocratDbContext _db;
        private readonly JwtHelper _jwt;
        private readonly IConfiguration _config;
        private readonly DataUtils _dataUtils;

        public AuthController(FinocratDbContext db, JwtHelper jwt, IConfiguration configuration, DataUtils dataUtils)
        {
            _db = db;
            _jwt = jwt;
            _config = configuration;
            _dataUtils = dataUtils;
        }

       
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequestDTO request)
        {
            var user = _db.fUsers
                .FirstOrDefault(x => (x.UserName == request.UserId || x.UserPhone == request.UserId)  && x.IsActive);

            if (user == null || user.Password != request.Password)
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var expiry = request.RememberMe
                ? DateTime.UtcNow.AddDays(7)
                : DateTime.UtcNow.AddHours(2);

            var token = _jwt.GenerateJwtMain(user, expiry);

            var iskyc = _db.fAadharDetails.FirstOrDefault(k => k.Phone == user.UserPhone);

            // ✅ Send only required user details to frontend
            var userDto = new
            {
                userId = "PM",
                name = user.UserName,
                userPhone = user.UserPhone,
                isAdmin = user.IsAdmin,
                iskyc = iskyc?.IsKycCompleted,
                email = user.Email,
                pin = user.Pin
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
                    u.Gender,
                    u.IsAdmin
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
                Created = DateTime.UtcNow,
                IsAdmin = model.IsAdmin
            };

            _db.fUsers.Add(user);
            await _db.SaveChangesAsync();

            string subject = "Welcome to Finocrat 🎉";
            string body = await _dataUtils.Body(user);
            await _dataUtils.SendEmailAsync(user.Email, subject, body);

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
            user.Gender = model.Gender;
            user.IsAdmin = model.IsAdmin;

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

        [HttpPost("forgot-password/send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] ForgotPasswordRequest req)
        {
            var user = await _db.fUsers
                .FirstOrDefaultAsync(x => x.UserPhone == req.UserId || x.Email == req.UserId);

            if (user == null)
                return BadRequest("User not found");

            // 🔢 Generate OTP
            var otp = new Random().Next(100000, 999999).ToString();

            // Save OTP (you can creae table or store temp)
            user.ResetOtp = otp;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(5);

            await _db.SaveChangesAsync();

            // 📧 Send Email
            string subject = "Reset Password OTP - Finocrat";

            string body = $@"
    <div style='font-family:Arial'>
        <h3>Password Reset Request</h3>
        <p>Your OTP is:</p>
        <h2 style='color:#2563eb'>{otp}</h2>
        <p>This OTP will expire in 5 minutes.</p>
    </div>";

            await _dataUtils.SendEmailAsync(user.Email, subject, body);

            return Ok(new { success = true, message = "OTP sent to email" });
        }


        [HttpPost("forgot-password/verify-otp")]
        public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest req)
        {
            var user = await _db.fUsers
                .FirstOrDefaultAsync(x => x.UserPhone == req.UserId || x.Email == req.UserId);

            if (user == null)
                return BadRequest("User not found");

            if (user.ResetOtp != req.Otp)
                return BadRequest("Invalid OTP");

            if (user.OtpExpiry < DateTime.UtcNow)
                return BadRequest("OTP expired");

            return Ok(new { success = true });
        }

        [HttpPost("forgot-password/reset")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
        {
            var user = await _db.fUsers
                .FirstOrDefaultAsync(x => x.UserPhone == req.UserId || x.Email == req.UserId);

            if (user == null)
                return BadRequest("User not found");

            user.Password = req.NewPassword; // ⚠️ hash in production
            user.ResetOtp = null;

            await _db.SaveChangesAsync();

            return Ok(new { success = true, message = "Password updated" });
        }




    }

    public class ForgotPasswordRequest
    {
        public string UserId { get; set; }
    }

    public class VerifyOtpRequest
    {
        public string UserId { get; set; }
        public string Otp { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string UserId { get; set; }
        public string NewPassword { get; set; }
    }

}
