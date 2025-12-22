namespace Gp1.ClubAutomation.Application.DTOs.Club;

public class CreateClubRequest
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }
}