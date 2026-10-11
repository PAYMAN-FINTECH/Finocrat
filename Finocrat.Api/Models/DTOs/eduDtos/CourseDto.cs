namespace Finocrat.Api.Models.DTOs.eduDtos
{
    public class CourseDto
    {
        public int Id { get; set; }
        public string? Image { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? Description { get; set; }
        public string Author { get; set; } = string.Empty;
        public double Rating { get; set; }
        public decimal Price { get; set; }
        public string? Duration { get; set; }
    }

    public class CourseUpsertDto
    {
        public string? Image { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Subtitle { get; set; }
        public string? Description { get; set; }
        public string Author { get; set; } = string.Empty;
        public double Rating { get; set; }
        public decimal Price { get; set; }
        public string? Duration { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
