using Finocrat.Api.Models.Entities.Main;

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

    }
}
