using System.ComponentModel.DataAnnotations;

namespace Finocrat.Api.Models.Entities.Main
{
    public class FAadharDetails
    {
        [Key]
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string Phone { get; set; }

        public string AadharNo { get; set; }

        public string AadharRefId { get; set; }

        public string Otp { get; set; }

        public string Name { get; set; }

        public string Address { get; set; }

        public bool Status { get; set; } = false;

        public DateTime Created { get; set; }

        public DateTime? Updated { get; set; }

        public bool? IsKycCompleted { get; set; }
    }
}
