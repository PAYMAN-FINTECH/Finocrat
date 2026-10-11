using Finocrat.Api.Data;
using Finocrat.Api.Models.DTOs.eduDtos;
using Finocrat.Api.Models.Entities.Edu;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Finocrat.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EduCoursesController : ControllerBase
    {
        private readonly FinocratDbContext _db;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;

        public EduCoursesController(FinocratDbContext db, IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _db = db;
            _httpClientFactory = httpClientFactory;
            _config = config;
        }

        // 🔹 GET ALL (active courses, with optional topic/level/search filters)
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? topic, [FromQuery] string? level, [FromQuery] string? search)
        {
            var query = _db.eduCourses.Where(c => c.IsActive).AsQueryable();

            if (!string.IsNullOrWhiteSpace(topic) && topic != "All")
                query = query.Where(c => c.Category == topic);

            if (!string.IsNullOrWhiteSpace(level) && level != "All Levels")
                query = query.Where(c => c.Level == level);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(c =>
                    c.Title.ToLower().Contains(term) ||
                    c.Author.ToLower().Contains(term) ||
                    c.Category.ToLower().Contains(term));
            }

            var courses = await query
                .OrderBy(c => c.Id)
                .Select(c => ToDto(c))
                .ToListAsync();

            return Ok(courses);
        }

        // 🔹 GET BY ID
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var course = await _db.eduCourses.FirstOrDefaultAsync(c => c.Id == id);
            if (course == null)
                return NotFound(new { message = "Course not found" });

            return Ok(ToDto(course));
        }

        // 🔹 GET TOPICS (distinct categories with counts)
        [HttpGet("topics")]
        public async Task<IActionResult> GetTopics()
        {
            var topics = await _db.eduCourses
                .Where(c => c.IsActive)
                .GroupBy(c => c.Category)
                .Select(g => new { name = g.Key, count = g.Count() })
                .ToListAsync();

            return Ok(topics);
        }

        // 🔹 GET LEVELS (distinct levels with counts)
        [HttpGet("levels")]
        public async Task<IActionResult> GetLevels()
        {
            var levels = await _db.eduCourses
                .Where(c => c.IsActive)
                .GroupBy(c => c.Level)
                .Select(g => new { name = g.Key, count = g.Count() })
                .ToListAsync();

            return Ok(levels);
        }

        // 🔹 CREATE
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CourseUpsertDto request)
        {
            var course = new EduCourse
            {
                Image = request.Image,
                Category = request.Category,
                Level = request.Level,
                Title = request.Title,
                Subtitle = request.Subtitle,
                Description = request.Description,
                Author = request.Author,
                Rating = request.Rating,
                Price = request.Price,
                Duration = request.Duration,
                IsActive = request.IsActive
            };

            await _db.eduCourses.AddAsync(course);
            await _db.SaveChangesAsync();

            return Ok(ToDto(course));
        }

        // 🔹 UPDATE
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CourseUpsertDto request)
        {
            var course = await _db.eduCourses.FirstOrDefaultAsync(c => c.Id == id);
            if (course == null)
                return NotFound(new { message = "Course not found" });

            course.Image = request.Image;
            course.Category = request.Category;
            course.Level = request.Level;
            course.Title = request.Title;
            course.Subtitle = request.Subtitle;
            course.Description = request.Description;
            course.Author = request.Author;
            course.Rating = request.Rating;
            course.Price = request.Price;
            course.Duration = request.Duration;
            course.IsActive = request.IsActive;
            course.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            return Ok(ToDto(course));
        }

        // 🔹 DELETE (soft delete)
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var course = await _db.eduCourses.FirstOrDefaultAsync(c => c.Id == id);
            if (course == null)
                return NotFound(new { message = "Course not found" });

            course.IsActive = false;
            course.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return Ok(new { message = "Course deleted" });
        }

        // 🔹 SYNC IMAGES — assigns a unique, real, topic-relevant photo per course via the Unsplash API
        [HttpPost("sync-images")]
        public async Task<IActionResult> SyncImages()
        {
            var accessKey = _config["Unsplash:AccessKey"];
            if (string.IsNullOrWhiteSpace(accessKey))
                return BadRequest(new { message = "Unsplash:AccessKey is not configured in appsettings.json" });

            var categoryKeywords = new Dictionary<string, string>
            {
                ["Web Development"] = "web development coding",
                ["TypeScript"] = "typescript programming",
                ["Programming"] = "programming code",
                ["AI & Machine Learning"] = "artificial intelligence machine learning",
                ["AI"] = "artificial intelligence robot",
                ["Python"] = "python programming",
                ["React"] = "react javascript frontend",
                ["Next.js"] = "nextjs web development",
                ["Mobile Development"] = "mobile app development",
                ["Marketing"] = "digital marketing",
                ["Design"] = "ui ux design",
                ["Development"] = "software development",
                ["Blockchain"] = "blockchain cryptocurrency",
                ["Creative Arts"] = "photography camera",
                ["Game Development"] = "game development",
                ["Cloud Computing"] = "cloud computing server"
            };

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("Authorization", $"Client-ID {accessKey}");

            var usedUrls = new HashSet<string>();
            var updatedCount = 0;

            var categories = await _db.eduCourses
                .Where(c => c.IsActive)
                .Select(c => c.Category)
                .Distinct()
                .ToListAsync();

            foreach (var category in categories)
            {
                var courses = await _db.eduCourses
                    .Where(c => c.IsActive && c.Category == category)
                    .OrderBy(c => c.Id)
                    .ToListAsync();

                var keyword = categoryKeywords.TryGetValue(category, out var kw) ? kw : category;
                var photoUrls = new List<string>();
                var page = 1;

                // Unsplash search returns up to 30 results per page; paginate until we have enough unique photos
                while (photoUrls.Count < courses.Count && page <= 10)
                {
                    var url = $"https://api.unsplash.com/search/photos?query={Uri.EscapeDataString(keyword)}&per_page=30&page={page}&orientation=landscape";
                    var response = await client.GetAsync(url);
                    if (!response.IsSuccessStatusCode)
                        break;

                    using var stream = await response.Content.ReadAsStreamAsync();
                    using var doc = await JsonDocument.ParseAsync(stream);

                    if (!doc.RootElement.TryGetProperty("results", out var results) || results.GetArrayLength() == 0)
                        break;

                    foreach (var result in results.EnumerateArray())
                    {
                        var imageUrl = result.GetProperty("urls").GetProperty("regular").GetString();
                        if (!string.IsNullOrEmpty(imageUrl) && usedUrls.Add(imageUrl))
                            photoUrls.Add(imageUrl);
                    }

                    page++;
                }

                for (var i = 0; i < courses.Count && i < photoUrls.Count; i++)
                {
                    courses[i].Image = photoUrls[i];
                    courses[i].UpdatedAt = DateTime.UtcNow;
                    updatedCount++;
                }
            }

            await _db.SaveChangesAsync();

            return Ok(new { message = "Image sync complete", updatedCount });
        }

        private static CourseDto ToDto(EduCourse c) => new()
        {
            Id = c.Id,
            Image = c.Image,
            Category = c.Category,
            Level = c.Level,
            Title = c.Title,
            Subtitle = c.Subtitle,
            Description = c.Description,
            Author = c.Author,
            Rating = c.Rating,
            Price = c.Price,
            Duration = c.Duration
        };
    }
}
