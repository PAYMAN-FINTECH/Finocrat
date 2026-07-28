namespace Finocrat.Api.Models.DTOs.MainDtos
{
    public class UserDto
    {

        public string UserName { get; set; }
        public string Password { get; set; }
        public string UserPhone { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; }
        public Guid MarginId { get; set; }
        public string? Gender { get; set; }
        public bool? IsRazorpayEnabled { get; set; }
        public bool? IsAdmin { get; set; } = false;
        public int UserTypeId { get; set; }          // required
        public Guid? ParentUserId { get; set; }      // will be set server‑side
        public string CurrentLoginPhone {  get; set; } 
    }
}
