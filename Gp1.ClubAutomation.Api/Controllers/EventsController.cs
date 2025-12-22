using Gp1.ClubAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gp1.ClubAutomation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _eventService.GetAllAsync());

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming([FromQuery] int userId, [FromQuery] int days = 14)
    {
        if (userId <= 0) return BadRequest("userId is invalid.");
        return Ok(await _eventService.GetUpcomingForUserAsync(userId, days));
    }
}