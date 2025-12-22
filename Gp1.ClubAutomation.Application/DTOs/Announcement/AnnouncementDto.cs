namespace Gp1.ClubAutomation.Application.DTOs.Announcement
{
    public class AnnouncementDto
    {
        public int Id { get; set; }
        public int ClubId { get; set; }

        public string Title { get; set; } = default!;
        public string? Content { get; set; }

        public bool Pinned { get; set; }
        public DateTime CreatedAt { get; set; } // Entity has CreatedDate, we will return CreatedAt for FE in DTO.
    }
}