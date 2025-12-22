using Gp1.ClubAutomation.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace Gp1.ClubAutomation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly HttpClient _aiClient;

    public AiController(IHttpClientFactory httpClientFactory)
    {
        // Program.cs içinde tanımladığımız "AiService" isimli HttpClient'ı kullanıyoruz
        _aiClient = httpClientFactory.CreateClient("AiService");
    }

    [HttpPost("recommend-clubs")]
    public async Task<IActionResult> RecommendClubs([FromBody] SurveyAnswersRequest request)
    {
        // .NET → Python AI servisine POST isteği
        var response = await _aiClient.PostAsJsonAsync("/recommend-clubs", request);

        if (!response.IsSuccessStatusCode)
        {
            var errorText = await response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, new
            {
                message = "AI servisi bir hata döndürdü.",
                details = errorText
            });
        }

        // Dönen JSON'u string olarak alıp FE'ye aynen forward ediyoruz
        var json = await response.Content.ReadAsStringAsync();
        return Content(json, "application/json");
    }
}