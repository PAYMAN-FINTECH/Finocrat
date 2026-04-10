namespace Finocrat.Api.Models.Entities.Main
{
    public class FPassbookHistory
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string UserPhone { get; set; }
        public string TxnId { get; set; }
        public string? Name { get; set; }
        public string? AccountNumber { get; set; }  
        public string? TransactionType { get; set; }
        public decimal Amount { get; set; }
        public decimal Balance { get; set; }
        public bool Status { get; set; }
        public string? StatusMessage { get; set; }
        public Guid ParentId { get; set; }
        public DateTime CreatedAt { get; set; }

    }
}
