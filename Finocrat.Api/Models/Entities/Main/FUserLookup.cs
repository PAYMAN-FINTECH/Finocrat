namespace Finocrat.Api.Models.Entities.Main
{
    public class FUserLookup
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string UserPhone { get; set; }
        public string LookupJson { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? UpdatedOn { get; set; }
    }
}
