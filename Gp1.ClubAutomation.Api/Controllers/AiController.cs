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
        // We are using the HttpClient named "AiService" that we defined in Program.cs
        _aiClient = httpClientFactory.CreateClient("AiService");
    }

    [HttpPost("recommend-clubs")]
    public async Task<IActionResult> RecommendClubs([FromBody] SurveyAnswersRequest request)
    {
        // .NET → POST request to Python AI service
        var response = await _aiClient.PostAsJsonAsync("/recommend-clubs", request);

        if (!response.IsSuccessStatusCode)
        {
            var errorText = await response.Content.ReadAsStringAsync();
            return StatusCode((int)response.StatusCode, new
            {
                message = "The AI service returned an error.",
                details = errorText
            });
        }

        // We receive the returned JSON as a string and forward it to FE as is.
        var json = await response.Content.ReadAsStringAsync();
        return Content(json, "application/json");
    }
}