namespace Gp1.ClubAutomation.Application.DTOs.Announcement;

public class CreateAnnouncementRequest
{
    public string Title { get; set; } = default!;
    public string? Content { get; set; }
    public bool Pinned { get; set; }
}