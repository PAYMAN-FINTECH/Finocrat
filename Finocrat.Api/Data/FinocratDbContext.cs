using Finocrat.Api.Models.Entities.Edu;
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
    }
}
