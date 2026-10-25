using Finocrat.Api.Models.DTOs.MainDtos;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Razorpay.Api;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Json;

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

        /// <summary>
        /// Single entry point for all gateways: inserts or updates the PayIn
        /// (matched by TaxNumber) and, when the payment is successful, writes
        /// the passbook entry once per transaction.
        /// </summary>
        public async Task<FPayIn> SavePayInAsync(FPayIn payIn)
        {
            var user = await _context.fUsers
                .FirstOrDefaultAsync(u => u.UserPhone == payIn.UserPhone)
                ?? throw new InvalidOperationException(
                    $"User not found for phone {payIn.UserPhone}.");

            payIn.UserId = user.Id;

            // One order can produce several rows (customer, distributor, super distributor),
            // so the row is identified by both the order and the beneficiary phone.
            var saved = await _context.fPayIns
                .FirstOrDefaultAsync(x => x.TaxNumber == payIn.TaxNumber && x.UserPhone == payIn.UserPhone);

            if (saved == null)
            {
                _context.fPayIns.Add(payIn);
                saved = payIn;
            }
            else if (!ReferenceEquals(saved, payIn))
            {
                CopyPayInValues(payIn, saved);
            }       

            await _context.SaveChangesAsync();

            if (saved.Status)
            {
                await SavePassbookForPayInAsync(saved, user.Id, user.UserPhone);
            }

            return saved;
        }

        /// <summary>
        /// Saves the PayIn and, for user types 2 and 3, the distributor and
        /// super-distributor commission rows (with their passbook entries).
        /// <paramref name="payInLimit"/> is the payer's margin and
        /// <paramref name="getMargin"/> returns a gateway-specific margin from a user's lookup.
        /// </summary>
        public async Task<FPayIn> SavePayInWithCommissionsAsync(
            FPayIn payIn,
            decimal payInLimit,
            Func<FUserLookup?, Task<decimal>> getMargin)
        {
            var saved = await SavePayInAsync(payIn);

            // A successful payment whose card digits don't match gets the default commission on the base row.
            if (saved.Status && !CardLast4Matches(saved.CardHolderCardNumber, saved.CardNo))
            {
                saved.PayInCommission = Math.Round(
                        saved.Amount * DefaultMismatchedPayInCommission / 100m,
                        2,
                        MidpointRounding.AwayFromZero);  
                await _context.SaveChangesAsync();
            }

            var user = await _context.fUsers
                .FirstOrDefaultAsync(u => u.UserPhone == saved.UserPhone);

            if (user?.ParentUserId != null)
            {
                await SaveCommissionRowsAsync(user, saved, payInLimit, getMargin);
            }

            return saved;
        }

        private const decimal DefaultMismatchedPayInCommission = 3.0m;

        private static bool CardLast4Matches(string? cardHolderCardNumber, string? cardNo)
        {
            var a = Last4Digits(cardHolderCardNumber);
            var b = Last4Digits(cardNo);
            return a != null && b != null && a == b;
        }

        private static string? Last4Digits(string? value)
        {
            var digits = new string((value ?? "").Where(char.IsDigit).ToArray());
            return digits.Length >= 4 ? digits[^4..] : null;
        }

        private async Task SaveCommissionRowsAsync(
            FUser user,
            FPayIn basePayIn,
            decimal payInLimit,
            Func<FUserLookup?, Task<decimal>> getMargin)
        {
            var distributor = await _context.fUsers
                .FirstOrDefaultAsync(t => t.Id == user.ParentUserId);

            if (distributor == null)
                return;

            if (user.UserTypeId == 2)
            {
                var distMargin = await GetMarginForUserAsync(distributor, getMargin);
                var amount = basePayIn.Amount * (payInLimit - distMargin) / 100;

                if (amount > 0)
                    await SaveCommissionRowAsync(basePayIn, distributor, amount, user.UserTypeId, user.Id);
            }
            else if (user.UserTypeId == 3)
            {
                var superDistributor = distributor.ParentUserId == null
                    ? null
                    : await _context.fUsers.FirstOrDefaultAsync(t => t.Id == distributor.ParentUserId);

                if (superDistributor == null)
                    return;

                var distMargin = await GetMarginForUserAsync(distributor, getMargin);
                var superMargin = await GetMarginForUserAsync(superDistributor, getMargin);

                var distAmount = basePayIn.Amount * (payInLimit - distMargin) / 100;
                if (distAmount > 0)
                    await SaveCommissionRowAsync(basePayIn, distributor, distAmount, user.UserTypeId, user.Id);

                var superAmount = basePayIn.Amount * (distMargin - superMargin) / 100;
                if (superAmount > 0)
                    await SaveCommissionRowAsync(basePayIn, superDistributor, superAmount, distributor.UserTypeId, distributor.Id);
            }
        }

        private async Task<decimal> GetMarginForUserAsync(FUser user, Func<FUserLookup?, Task<decimal>> getMargin)
        {
            var lookup = await _context.fUserLookups
                .FirstOrDefaultAsync(x => x.UserPhone == user.UserPhone);

            return await getMargin(lookup);
        }

        private async Task SaveCommissionRowAsync(
            FPayIn basePayIn,
            FUser beneficiary,
            decimal amount,
            int userTypeId,
            Guid patentTypeId)
        {
            var istNow = TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.UtcNow,
                TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"));

            await SavePayInAsync(new FPayIn
            {
                UserPhone = beneficiary.UserPhone,
                UserEmail = beneficiary.Email,
                CardHolderName = basePayIn.CardHolderName,
                CardHolderPhone = basePayIn.CardHolderPhone,
                CardHolderEmail = basePayIn.CardHolderEmail,
                CardHolderCardNumber = basePayIn.CardHolderCardNumber,
                Result = basePayIn.Result,
                Status = basePayIn.Status,
                CardBrand = basePayIn.CardBrand,
                BankName = basePayIn.BankName,
                CardType = basePayIn.CardType,
                CardNo = basePayIn.CardNo,
                PaymentId = basePayIn.PaymentId,
                TaxNumber = basePayIn.TaxNumber,
                Amount = amount,
                PayInCommission = 0,
                FCommission = basePayIn.Status ? (basePayIn.Amount / 100) : 0,
                Gateway = basePayIn.Gateway,
                Created = basePayIn.Created ?? istNow,
                UserTypeId = userTypeId,
                PatentTypeId = patentTypeId
            });
        }

        /// <summary>
        /// Admin review of a QR receipt. Approve marks the receipt and its commission rows
        /// as success and writes passbook entries; reject marks them as rejected.
        /// Returns false when the row is not a pending QR receipt.
        /// </summary>
        public async Task<bool> ReviewQrReceiptAsync(Guid payInId, bool approve)
        {
            var baseRow = await _context.fPayIns.FirstOrDefaultAsync(p => p.Id == payInId);
            if (baseRow == null || baseRow.Gateway != "QR Code" || baseRow.Result != "PENDING")
                return false;

            var rows = await _context.fPayIns
                .Where(p => p.Gateway == "QR Code" && p.TaxNumber == baseRow.TaxNumber)
                .ToListAsync();

            foreach (var row in rows)
            {
                row.Status = approve;
                row.Result = approve ? "SUCCESS" : "REJECTED";
            }

            await _context.SaveChangesAsync();

            if (approve)
            {
                foreach (var row in rows)
                {
                    await SavePassbookForPayInAsync(row, row.UserId, row.UserPhone);
                }
            }

            return true;
        }

        private void CopyPayInValues(FPayIn source, FPayIn target)
        {
            var entry = _context.Entry(target);

            foreach (var property in entry.Metadata.GetProperties()
                         .Where(p => !p.IsPrimaryKey()))
            {
                entry.Property(property.Name).CurrentValue =
                    typeof(FPayIn).GetProperty(property.Name)?.GetValue(source);
            }
        }

        private async Task SavePassbookForPayInAsync(FPayIn payIn, Guid userId, string userPhone)
        {
            if (await _context.fPassbookHistories.AnyAsync(h => h.TxnId == payIn.TaxNumber && h.UserPhone == userPhone))
                return;

            var istNow = TimeZoneInfo.ConvertTimeFromUtc(
                DateTime.UtcNow,
                TimeZoneInfo.FindSystemTimeZoneById("India Standard Time"));

            var balance = await GetWalletAmount(payIn.UserPhone);

            _context.fPassbookHistories.Add(new FPassbookHistory
            {
                UserId = userId,
                UserPhone = userPhone,
                Name = payIn.CardHolderName,
                TxnId = payIn.TaxNumber,
                AccountNumber = payIn.CardHolderCardNumber,
                Amount = payIn.Amount,
                TransactionType = "PayIn",
                Status = true,
                StatusMessage = payIn.Result,
                ParentId = payIn.Id,
                Balance = balance,
                CreatedAt = istNow,
                UserTypeId = payIn.UserTypeId
            });

            await _context.SaveChangesAsync();
        }


        public async Task<decimal> ExtractPayInMargin(FUserLookup? lookup, string gateway)
        {
            decimal margin = 0;
            if (lookup != null && !string.IsNullOrEmpty(lookup.LookupJson))
            {
                var settings = JsonSerializer.Deserialize<Dictionary<string, object>>(lookup.LookupJson);
                if (settings != null && settings.TryGetValue(gateway, out var value))
                {
                    if (value is JsonElement element)
                    {
                        if (element.ValueKind == JsonValueKind.String)
                            decimal.TryParse(element.GetString(), out margin);
                        else if (element.ValueKind == JsonValueKind.Number)
                            margin = element.GetDecimal();
                    }
                }
            }

            return margin;
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
