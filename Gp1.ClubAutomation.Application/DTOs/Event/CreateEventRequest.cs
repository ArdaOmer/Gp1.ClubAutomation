namespace Gp1.ClubAutomation.Application.DTOs.Event;

public class CreateEventRequest
{
    public string Title { get; set; } = default!;
    public string? Description { get; set; }
    public string? Location { get; set; }

    public DateTime StartAt { get; set; }
    public DateTime EndAt { get; set; }
}