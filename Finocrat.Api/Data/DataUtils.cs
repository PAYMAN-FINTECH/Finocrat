using Finocrat.Api.Models.Entities.Main;
using Microsoft.EntityFrameworkCore;

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

    }
}
