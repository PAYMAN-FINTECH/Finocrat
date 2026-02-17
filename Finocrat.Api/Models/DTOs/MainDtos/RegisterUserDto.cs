namespace Finocrat.Api.Models.DTOs.MainDtos
{
    public class RegisterUserDto
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Phone { get; set; }
        public string Gender { get; set; }
        public bool IsActive { get; set; }
        public Guid MarginId { get; set; }
        public bool IsRazorpayEnabled { get; set; }
    }
}
