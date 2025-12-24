using Gp1.ClubAutomation.Api.Contracts.Ai;
using Gp1.ClubAutomation.Infrastructure.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Gp1.ClubAutomation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AppDbContext _db;

    public AiController(IHttpClientFactory httpClientFactory, AppDbContext db)
    {
        _httpClientFactory = httpClientFactory;
        _db = db;
    }

    [HttpPost("recommend")]
    public async Task<IActionResult> Recommend([FromBody] AiRecommendRequest req)
    {
        // 1) AI Service
        var client = _httpClientFactory.CreateClient("AiService");

        var aiPayload = new { interests = req.Interests };
        var resp = await client.PostAsJsonAsync("/recommend-clubs", aiPayload);

        if (!resp.IsSuccessStatusCode)
            return StatusCode((int)resp.StatusCode, "AI service error");

        var ai = await resp.Content.ReadFromJsonAsync<AiRecommendResponse>();
        if (ai == null) return StatusCode(500, "AI response parse error");
        
        var clubs = await _db.Clubs
            .AsNoTracking()
            .Select(c => new { c.Id, c.Name, c.Description })
            .ToListAsync();

        // 3) AI scores match (clubId -> score)
        var scoreMap = ai.Scores.ToDictionary(x => x.ClubId, x => x.Score);

        // 4) Only AI's clubs pull, order by score.
        var recommended = clubs
            .Where(c => scoreMap.ContainsKey(c.Id))
            .Select(c => new AiRecommendedClubDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Score = scoreMap[c.Id]
            })
            .OrderByDescending(x => x.Score)
            .ToList();

        return Ok(new AiRecommendedClubsResponse
        {
            RecommendedClubs = recommended
        });
    }
}
