namespace Finocrat.Api.Models.Entities.Main
{
    public class FPayIn
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string UserPhone { get; set; }
        public string UserEmail { get; set; }
        public string PaymentId { get; set; }
        public string TaxNumber { get; set; }
        public string CardNo { get; set; }
        public decimal Amount { get; set; }
        public string Gateway {  get; set; }
        public decimal PayInCommission { get; set; }
        public decimal FCommission { get; set; }
        public string CardBrand { get; set; }
        public string BankName { get; set; }
        public string CardType { get; set; }
        public string Result { get; set; }
        public bool Status {  get; set; }
        public DateTime? Created { get; set; }
        public string CardHolderName { get; set; }
        public string CardHolderPhone { get; set; }
        public string CardHolderEmail { get; set; }
        public string CardHolderCardNumber { get; set; }

    }
}
