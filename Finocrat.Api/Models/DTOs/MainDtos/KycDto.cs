namespace Finocrat.Api.Models.DTOs.MainDtos
{
    public class KycDto
    {
        public string UserPhone { get; set; }
        public string AadhaarNumber { get; set; }
        public string PanNumber { get; set; }
        public string Otp { get; set; }

        public IFormFile AadhaarFront { get; set; }
        public IFormFile AadhaarBack { get; set; }
        public IFormFile PanFile { get; set; }
    }
}
