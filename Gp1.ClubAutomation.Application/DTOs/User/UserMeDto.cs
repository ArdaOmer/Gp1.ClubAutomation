namespace Gp1.ClubAutomation.Application.DTOs.User;

public class UserMeDto
{
    public int Id { get; set; }
    public string? Name { get; set; } // FullName
    public string Email { get; set; } = default!;

    public string? Department { get; set; }
    public int? Grade { get; set; }
    public DateOnly? BirthDate { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public string? AvatarDataUrl { get; set; }

    public List<object> Memberships { get; set; } = new(); // Empty for now / You can convert it to DTO later.
}