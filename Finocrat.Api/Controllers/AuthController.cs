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

        public AuthController(FinocratDbContext db, JwtHelper jwt, IConfiguration configuration)
        {
            _db = db;
            _jwt = jwt;
            _config = configuration;
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
                userPhone = user.UserPhone,
                isAdmin = user.IsAdmin
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
            string body = Body(user);
            await SendEmailAsync(user.Email, subject, body);

            return Ok(new
            {
                success = true,
                message = "User Created",
                data = user.Id
            });
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var fromEmail = _config["EmailSettings:Email"];
            var password = _config["EmailSettings:Password"];

            var smtp = new SmtpClient("smtp.gmail.com", 587)
            {
                Credentials = new NetworkCredential(fromEmail, password),
                EnableSsl = true
            };

            var mail = new MailMessage(fromEmail, toEmail, subject, body)
            {
                IsBodyHtml = true
            };

            await smtp.SendMailAsync(mail);
        }

        public string Body(FUser fUser)
        {
            string body = $@"
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
</head>
<body style='margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;'>

  <table width='100%' cellpadding='0' cellspacing='0'>
    <tr>
      <td align='center'>

        <table width='600' style='background:#ffffff;border-radius:10px;overflow:hidden;margin-top:20px;'>

          <!-- HEADER -->
          <tr>
            <td style='background:#2563eb;color:white;padding:20px;text-align:center;'>
              <h2 style='margin:0;'>Finocrat</h2>
              <p style='margin:0;font-size:12px;'>Secure Payment Solutions</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style='padding:25px;'>

              <h3 style='margin-top:0;'>Welcome {fUser.UserName} 👋</h3>

              <p>Your account has been successfully created.</p>

              <div style='background:#f1f5f9;padding:15px;border-radius:8px;margin:15px 0;'>
                <p style='margin:5px 0;'><b>📱 Phone:</b> {fUser.UserPhone}</p>
                <p style='margin:5px 0;'><b>🔑 Password:</b> {fUser.Password}</p>
              </div>

              <p style='color:#dc2626;'><b>⚠️ Important:</b> Please change your password after login.</p>

              <!-- BUTTON -->
              <div style='text-align:center;margin-top:25px;'>
                <a href='https://thefinocrat.com/'
                   style='background:#2563eb;color:white;padding:12px 25px;
                          text-decoration:none;border-radius:6px;font-weight:bold;'>
                   Login Now
                </a>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style='background:#f9fafb;padding:15px;text-align:center;font-size:12px;color:#666;'>
              <p style='margin:0;'>© 2026 Finocrat. All rights reserved.</p>
              <p style='margin:5px 0;'>Support: support@finocrat.com</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
";
            return body;

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


    }
}
