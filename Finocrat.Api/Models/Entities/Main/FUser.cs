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
    }
}
