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



        [HttpPost("forgot-pin/send-otp")]
        public async Task<IActionResult> ForgotSendOtp([FromBody] ForgotPasswordRequest req)
        {
            var user = await _db.fUsers
                .FirstOrDefaultAsync(x => x.UserPhone == req.UserId || x.Email == req.UserId);

            if (user == null)
                return BadRequest("User not found");

            // 🔢 Generate OTP
            var otp = new Random().Next(100000, 999999).ToString();

            // Save OTP (you can creae table or store temp)
            user.PinResetOtp = otp;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(5);

            await _db.SaveChangesAsync();

            // 📧 Send Email
            // 📧 Send Email with Professional Template
            string subject = "Reset Your PIN - Finocrat Security Alert";

            string body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1.0'>
    <title>PIN Reset OTP</title>
</head>
<body style='margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f4f7fb;'>
    <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #f4f7fb; padding: 40px 0;'>
        <tr>
            <td align='center'>
                <table width='100%' max-width='550px' cellpadding='0' cellspacing='0' style='max-width: 550px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); overflow: hidden;'>
                    
                    <!-- Header with Gradient -->
                    <tr>
                        <td style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;'>
                            <div style='font-size: 48px; margin-bottom: 10px;'>🔐</div>
                            <h1 style='color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;'>Finocrat</h1>
                            <p style='color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;'>Secure Digital Payments</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style='padding: 40px 30px;'>
                            <h2 style='color: #1f2937; margin: 0 0 12px; font-size: 24px; font-weight: 600;'>PIN Reset Request</h2>
                            <p style='color: #4b5563; margin: 0 0 8px; font-size: 16px; line-height: 1.5;'>Hello,</p>
                            <p style='color: #4b5563; margin: 0 0 24px; font-size: 16px; line-height: 1.5;'>
                                We received a request to reset your PIN for your Finocrat account. 
                                Use the verification code below to complete the process.
                            </p>
                            
                            <!-- OTP Box -->
                            <div style='background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;'>
                                <p style='color: #64748b; margin: 0 0 12px; font-size: 14px; letter-spacing: 1px;'>YOUR VERIFICATION CODE</p>
                                <div style='font-size: 48px; font-weight: 800; color: #667eea; letter-spacing: 12px; font-family: monospace; background: white; padding: 20px; border-radius: 10px; display: inline-block; border: 1px solid #e2e8f0;'>
                                    {otp}
                                </div>
                                <p style='color: #ef4444; margin: 16px 0 0; font-size: 13px;'>
                                    ⏰ This code will expire in <strong>5 minutes</strong>
                                </p>
                            </div>
                            
                            <!-- Important Notes -->
                            <div style='background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 8px;'>
                                <p style='margin: 0; font-size: 13px; color: #92400e; display: flex; align-items: center; gap: 8px;'>
                                    <span style='font-size: 18px;'>⚠️</span> 
                                    <strong>Security Tip:</strong> Never share this OTP with anyone, including Finocrat support.
                                </p>
                            </div>
                            
                            <!-- Instructions -->
                            <div style='margin: 24px 0;'>
                                <p style='color: #1f2937; font-weight: 600; margin: 0 0 12px; font-size: 14px;'>What to do next:</p>
                                <ol style='color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.6;'>
                                    <li>Enter this 6-digit code on the verification screen</li>
                                    <li>Create your new 4-digit PIN</li>
                                    <li>Use your new PIN for future logins</li>
                                </ol>
                            </div>
                            
                            <!-- Did not request -->
                            <div style='border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 24px; text-align: center;'>
                                <p style='color: #9ca3af; margin: 0; font-size: 13px;'>
                                    If you didn't request this PIN reset, please ignore this email or 
                                    <a href='#' style='color: #667eea; text-decoration: none;'>contact support</a>.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style='background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;'>
                            <div style='margin-bottom: 12px;'>
                                <a href='#' style='color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;'>Privacy Policy</a>
                                <span style='color: #cbd5e1;'>|</span>
                                <a href='#' style='color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;'>Terms of Service</a>
                                <span style='color: #cbd5e1;'>|</span>
                                <a href='#' style='color: #667eea; text-decoration: none; margin: 0 10px; font-size: 12px;'>Contact Support</a>
                            </div>
                            <p style='color: #94a3b8; margin: 0; font-size: 11px;'>
                                &copy; {DateTime.Now.Year} Finocrat. All rights reserved.<br>
                                Secure Digital Payment Platform
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Footer note -->
                <p style='color: #94a3b8; margin: 20px 0 0; font-size: 12px; text-align: center;'>
                                    This is an automated message, please do not reply.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>";

            await _dataUtils.SendEmailAsync(user.Email, subject, body);

            return Ok(new { success = true, message = "OTP sent to email" });
        }


        [HttpPost("forgot-pin/verify-otp")]
        public async Task<IActionResult> ForgotVerifyOtp([FromBody] VerifyOtpRequest req)
        {
            var user = await _db.fUsers
                .FirstOrDefaultAsync(x => x.UserPhone == req.UserId || x.Email == req.UserId);

            if (user == null)
                return BadRequest("User not found");

            if (user.PinResetOtp != req.Otp)
                return BadRequest("Invalid OTP");

            if (user.OtpExpiry < DateTime.UtcNow)
                return BadRequest("OTP expired");

            return Ok(new { success = true });
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
