using Gp1.ClubAutomation.Application.DTOs.Announcement;
using Gp1.ClubAutomation.Application.DTOs.Club;
using Gp1.ClubAutomation.Application.DTOs.Event;
using Gp1.ClubAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gp1.ClubAutomation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClubsController : ControllerBase
{
    private readonly IClubService _clubService;
    private readonly IEventService _eventService;
    private readonly IAnnouncementService _announcementService;

    public ClubsController(
        IClubService clubService,
        IEventService eventService,
        IAnnouncementService announcementService)
    {
        _clubService = clubService;
        _eventService = eventService;
        _announcementService = announcementService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _clubService.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById([FromRoute] int id)
    {
        var club = await _clubService.GetByIdAsync(id);
        if (club is null) return NotFound();
        return Ok(club);
    }

    [HttpGet("{clubId:int}/events")]
    public async Task<IActionResult> GetEventsByClub([FromRoute] int clubId)
        => Ok(await _eventService.GetByClubAsync(clubId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClubRequest req)
    {
        var created = await _clubService.CreateAsync(req);
        return Ok(created);
    }

    [HttpPost("{clubId:int}/events")]
    public async Task<IActionResult> CreateEvent([FromRoute] int clubId, [FromBody] CreateEventRequest req)
    {
        var created = await _eventService.CreateAsync(clubId, req);
        return Ok(created);
    }

    [HttpPost("{clubId:int}/announcements")]
    public async Task<IActionResult> CreateAnnouncement([FromRoute] int clubId,
        [FromBody] CreateAnnouncementRequest req)
    {
        var created = await _announcementService.CreateForClubAsync(clubId, req);
        return Ok(created);
    }

    [HttpPatch("{clubId:int}/events/{eventId:int}")]
    public async Task<IActionResult> PatchEvent(int clubId, int eventId, [FromBody] UpdateEventRequestDto dto,
        CancellationToken ct)
    {
        var ok = await _eventService.PatchAsync(clubId, eventId, dto, ct);
        if (!ok) return NotFound();

        return NoContent();
    }

    [HttpDelete("{clubId:int}/events/{eventId:int}")]
    public async Task<IActionResult> DeleteEvent(int clubId, int eventId, CancellationToken ct)
    {
        var ok = await _eventService.DeleteAsync(clubId, eventId, ct);
        if (!ok) return NotFound();

        return NoContent();
    }
}