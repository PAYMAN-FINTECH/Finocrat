using Finocrat.Api.Models.Entities.Main;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;

namespace Finocrat.Api.Data
{
    public class DataUtils
    {
        private readonly FinocratDbContext _context;
        private readonly IConfiguration _configuration;
        public DataUtils(FinocratDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<FPayIn> InsertAsync(FPayIn model)
        {
            await _context.fPayIns.AddAsync(model);
            await _context.SaveChangesAsync();

            return model;
        }

        public async Task<decimal> GetWalletAmount(string userPhone)
        {
            if (string.IsNullOrEmpty(userPhone))
                return 0;

            var transactions = await _context.fPayIns
                .Where(x => x.UserPhone == userPhone && x.Status).ToListAsync();

            var payOthers = await _context.fPayouts
                .Where(x => x.UserPhone == userPhone && x.Status).ToListAsync();
            // Combine PayIns and PayOuts

            if (!transactions.Any())
                return 0;

            // Total Amount
            decimal totalAmount = transactions.Sum(x => x.Amount);
            decimal totalPayOut = payOthers.Sum(x => x.Amount);

            // Total Commission
            decimal totalCommission = transactions.Sum(x => x.PayInCommission);
            decimal totalPayOutCommission = payOthers.Sum(x => x.PaoutCommission);

            decimal totalPayIn = totalPayOut + totalCommission + totalPayOutCommission;

            // Final Wallet Balance
            decimal walletBalance = totalAmount - totalPayIn;

            return walletBalance;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var fromEmail = _configuration["EmailSettings:Email"];
            var password = _configuration["EmailSettings:Password"];

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

        public async Task<string> Body(FUser fUser)
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


    }
}
