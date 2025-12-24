namespace Gp1.ClubAutomation.Api.Contracts.Ai;

public class AiRecommendResponse
{
    public List<AiScoreItem> Scores { get; set; } = new();
}

public class AiScoreItem
{
    public int ClubId { get; set; }
    public double Score { get; set; }
}