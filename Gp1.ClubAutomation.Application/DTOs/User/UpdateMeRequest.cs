namespace Gp1.ClubAutomation.Application.DTOs.User;

public class UpdateMeRequest
{
    public string? Name { get; set; }
    public string? Department { get; set; }
    public int? Grade { get; set; }
    public DateOnly? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public string? AvatarDataUrl { get; set; }
}