using System.ComponentModel.DataAnnotations;

namespace Finocrat.Api.Models.Entities.Main
{
    public class FUserDocuments
    {
        [Key]
        public Guid Id { get; set; }

        public Guid? UserId { get; set; }

        public string Phone { get; set; }

        public string PanCardNumber { get; set; }

        // 🔹 Files stored as BYTE[]
        public byte[]? AadharFront { get; set; }

        public byte[]? AadharBack { get; set; }

        public byte[]? PanCard { get; set; }

        public DateTime? UploadedAt { get; set; }

        public bool? IsVerified { get; set; } = false;

        public string? RejectionReason { get; set; }
    }
}
