namespace Finocrat.Api.Models.Entities.Main
{
    public class FPayout
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string UserPhone { get; set; }
        public string ExternalRef { get; set; }
        public string? TxnReferenceId { get; set; }
        public string? OrderId { get; set; }

        public string? CustomerName {  get; set; }
        public decimal Amount { get; set; }
        public decimal PaoutCommission { get; set; }
        public string? Type { get; set; }

        public string? CardNumber { get; set; }
        public string? AccountNumber { get; set; }
        public bool Status { get; set; }
        public string? Result { get; set; }
        public DateTime? Created { get; set; }

    }

}
