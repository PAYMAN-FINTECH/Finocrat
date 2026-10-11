using System.ComponentModel.DataAnnotations;

namespace Finocrat.Api.Models.Entities.Edu
{
    public class EduCourse
    {
        public int Id { get; set; }

        public string? Image { get; set; }

        [Required, MaxLength(100)]
        public string Category { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Level { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Subtitle { get; set; }

        public string? Description { get; set; }

        [Required, MaxLength(150)]
        public string Author { get; set; } = string.Empty;

        public double Rating { get; set; }

        public decimal Price { get; set; }

        public string? Duration { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}
