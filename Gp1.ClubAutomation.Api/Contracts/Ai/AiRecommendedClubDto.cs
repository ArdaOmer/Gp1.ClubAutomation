namespace Gp1.ClubAutomation.Api.Contracts.Ai;

public class AiRecommendedClubDto
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string? Description { get; set; }
    public double Score { get; set; }
}