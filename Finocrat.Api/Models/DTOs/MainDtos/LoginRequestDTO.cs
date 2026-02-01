namespace Finocrat.Api.Models.DTOs.MainDtos
{
    public class LoginRequestDTO
    {
        public string UserId { get; set; }
        public string Password { get; set; }
        public bool RememberMe { get; set; }
    }
}
