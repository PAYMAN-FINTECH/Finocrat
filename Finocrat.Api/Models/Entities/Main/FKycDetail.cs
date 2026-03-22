using System.ComponentModel.DataAnnotations;

namespace Finocrat.Api.Models.Entities.Main
{
    public class FKycDetail
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }

        public string Phone { get; set; }

        public bool IsAadharVerified { get; set; }

        public bool IsPanVerified { get; set; }

        public bool IsDocumentsUploaded { get; set; }

        public bool IsKycCompleted { get; set; }

        public string Status { get; set; } // Pending / Approved / Rejected

        public DateTime Created { get; set; }

        public DateTime? Updated { get; set; }
    }
}
