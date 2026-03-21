using Finocrat.Api.Models.Entities.Edu;
using Finocrat.Api.Models.Entities.Main;
using Microsoft.EntityFrameworkCore;

namespace Finocrat.Api.Data
{
    public class FinocratDbContext : DbContext
    {
        public FinocratDbContext(DbContextOptions<FinocratDbContext> options)
            : base(options)
        {
        }


        public DbSet<eduUser>  eduUsers { get; set; }
        public DbSet<FUser> fUsers { get; set; }
        public DbSet<FPayIn> fPayIns { get; set; }
        public DbSet<FUserLookup> fUserLookups { get; set; }
        public DbSet<FMargin> fMargins { get; set; }
        public DbSet<FPayout> fPayouts { get; set; }
    }
}
