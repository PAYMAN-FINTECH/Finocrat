namespace Finocrat.Api.Models.Entities.Main
{
    public class FUser
    {
        public Guid Id { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public string UserPhone { get; set; }
        public string Email { get; set; }
        public bool IsActive { get; set; }
        public string? Gender { get; set; }
        public bool? IsAdmin { get; set; } = false;
        public DateTime Created { get; set; }
        public string? ResetOtp { get; set; }
        public DateTime? OtpExpiry { get; set; }
        public string? Pin { get; set; }
        public string? PinResetOtp { get; set; }
        // NEW
        public int UserTypeId { get; set; }
        public Guid? ParentUserId { get; set; }

        public FUserTypes UserType { get; set; }   // navigation
    }

    public class FUserTypes
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool Active { get; set; }
        public DateTime Created { get; set; }
    }
}
