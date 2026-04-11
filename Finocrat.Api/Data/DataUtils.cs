using Finocrat.Api.Models.DTOs.MainDtos;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;
using System.Text;

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

            return model;
        }

        public async Task<FPassbookHistory> InsertFHistoryAsync(FPassbookHistory model)
        {
            await _context.fPassbookHistories.AddAsync(model);
            return model;
        }


        public async Task<bool> SavePayInWithHistory(FPayIn payIn, FPassbookHistory history)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Insert PayIn
                await _context.fPayIns.AddAsync(payIn);
                await _context.SaveChangesAsync();

                // Set ParentId after PayIn insert
                history.ParentId = payIn.Id;

                // Insert History
                await _context.fPassbookHistories.AddAsync(history);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                // TODO: Add logging here
                return false;
            }
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

        public async Task<decimal> BalanceCheck()
        {
            try
            {
                using var client = new HttpClient
                {
                    Timeout = TimeSpan.FromSeconds(30) // ✅ timeout
                };

                client.DefaultRequestHeaders.Add("Accept", "application/json");
                client.DefaultRequestHeaders.Add("X-Ipay-Auth-Code", "1");
                client.DefaultRequestHeaders.Add("X-Ipay-Client-Id", _configuration["InstantPay:X-Ipay-Client-Id"]);
                client.DefaultRequestHeaders.Add("X-Ipay-Client-Secret", _configuration["InstantPay:X-Ipay-Client-Secret"]);
                client.DefaultRequestHeaders.Add("X-Ipay-Endpoint-Ip", _configuration["InstantPay:X-Ipay-Endpoint-Ip"]);

                var requestData = new
                {
                    bankProfileId = "0",
                    accountNumber = "9014559309", // 🔁 make dynamic later
                    externalRef = "BAL_" + DateTime.Now.ToString("yyyyMMddHHmmss"),
                    latitude = "20.126",
                    longitude = "78.3228"
                };

                var jsonData = System.Text.Json.JsonSerializer.Serialize(requestData);
                var content = new StringContent(jsonData, Encoding.UTF8, "application/json");

                var response = await client.PostAsync(
                    "https://api.instantpay.in/accounts/balance",
                    content
                );

                if (!response.IsSuccessStatusCode)
                {
                    return 0;
                }

                var responseContent = await response.Content.ReadAsStringAsync();

                var balanceResponse = Newtonsoft.Json.JsonConvert
                    .DeserializeObject<BalanceResponse>(responseContent);

                var balanceStr = balanceResponse?.Data?.Balance?.Available;

                // ✅ SAFE PARSE
                if (decimal.TryParse(balanceStr, out decimal balance))
                {
                    return balance;
                }

                return 0;
            }
            catch (Exception ex)
            {
                // ✅ LOG THIS (VERY IMPORTANT)
                Console.WriteLine("BalanceCheck Error: " + ex.Message);
                return 0;
            }
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
