namespace Gp1.ClubAutomation.Application.DTOs.Event;

public class UpdateEventRequestDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }


    // FE isn't sending it right now, but it might be needed later.
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }

    public bool? IsPublished { get; set; }
}