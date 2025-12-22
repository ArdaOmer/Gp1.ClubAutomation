namespace Gp1.ClubAutomation.Application.DTOs.Announcement;

public class UpdateAnnouncementRequest
{
    public string? Title { get; set; }
    public string? Content { get; set; }
    public bool? Pinned { get; set; }
}