namespace Gp1.ClubAutomation.Application.DTOs.Event
{
    public class EventDto
    {
        public int Id { get; set; }
        public int ClubId { get; set; }

        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public string? Location { get; set; }

        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }

        public bool IsPublished { get; set; }
    }
}