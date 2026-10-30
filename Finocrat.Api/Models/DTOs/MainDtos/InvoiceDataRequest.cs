namespace Finocrat.Api.Models.DTOs.MainDtos
{
    public class InvoiceDataRequest
    {
        public string UserPhone { get; set; }
        public DateTime FromDate { get; set; }
        public DateTime ToDate { get; set; }
    }
}
