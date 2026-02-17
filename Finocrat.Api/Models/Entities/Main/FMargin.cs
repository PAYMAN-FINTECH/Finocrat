namespace Finocrat.Api.Models.Entities.Main
{
    public class FMargin
    {
        public Guid Id { get; set; }
        public string MarginName { get; set; }
        public decimal Percentage { get; set; }
        public bool IsActive { get; set; }

        public ICollection<FUser> Users { get; set; }
        
    }
}
