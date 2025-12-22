using Gp1.ClubAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gp1.ClubAutomation.Api.Controllers;

[ApiController]
[Route("api/events/{eventId:int}/attendance")]
[Authorize]
public class AttendancesController : ControllerBase
{
    private readonly IAttendanceService _service;

    public AttendancesController(IAttendanceService service)
    {
        _service = service;
    }

    [HttpGet("count")]
    public async Task<IActionResult> GetCount(int eventId)
        => Ok(await _service.GetCountAsync(eventId));

    [HttpGet("is-attending")]
    public async Task<IActionResult> IsAttending(
        int eventId,
        [FromQuery] int userId)
        => Ok(await _service.IsAttendingAsync(eventId, userId));

    [HttpPost("attend")]
    public async Task<IActionResult> Attend(
        int eventId,
        [FromQuery] int userId,
        CancellationToken ct)
        => Ok(await _service.AttendAsync(eventId, userId, ct));

    [HttpPost("unattend")]
    public async Task<IActionResult> Unattend(
        int eventId,
        [FromQuery] int userId,
        CancellationToken ct)
        => Ok(await _service.UnattendAsync(eventId, userId, ct));
}