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
        // 1) Clubs from DB (so AI can learn newly added clubs immediately)
        var clubs = await _db.Clubs
            .AsNoTracking()
            .Select(c => new
            {
                clubId = c.Id,
                name = c.Name,
                description = c.Description
            })
            .ToListAsync();

        // Optional: if there is no club in DB, return empty
        if (clubs.Count == 0)
        {
            return Ok(new AiRecommendedClubsResponse
            {
                RecommendedClubs = new List<AiRecommendedClubDto>()
            });
        }

        // 2) AI Service
        var client = _httpClientFactory.CreateClient("AiService");

        // IMPORTANT: send clubs too
        var aiPayload = new
        {
            interests = req.Interests,
            clubs = clubs
        };

        var resp = await client.PostAsJsonAsync("/recommend-clubs", aiPayload);

        if (!resp.IsSuccessStatusCode)
        {
            var err = await resp.Content.ReadAsStringAsync();
            return StatusCode((int)resp.StatusCode, $"AI service error: {err}");
        }

        var ai = await resp.Content.ReadFromJsonAsync<AiRecommendResponse>();
        if (ai == null || ai.Scores == null)
            return StatusCode(500, "AI response parse error");

        // 3) AI scores match (clubId -> score)
        var scoreMap = ai.Scores.ToDictionary(x => x.ClubId, x => x.Score);

        // 4) Order by score, include all clubs that AI scored
        var recommended = clubs
            .Where(c => scoreMap.ContainsKey(c.clubId))
            .Select(c => new AiRecommendedClubDto
            {
                Id = c.clubId,
                Name = c.name,
                Description = c.description,
                Score = scoreMap[c.clubId]
            })
            .OrderByDescending(x => x.Score)
            .ToList();

        return Ok(new AiRecommendedClubsResponse
        {
            RecommendedClubs = recommended
        });
    }
}
