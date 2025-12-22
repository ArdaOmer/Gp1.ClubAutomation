namespace Gp1.ClubAutomation.Application.DTOs.Club
{
    public class ClubDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }
}