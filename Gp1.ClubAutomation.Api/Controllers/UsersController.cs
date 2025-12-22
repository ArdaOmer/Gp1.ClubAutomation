using System.Security.Claims;
using Gp1.ClubAutomation.Application.DTOs.Event;
using Gp1.ClubAutomation.Application.DTOs.User;
using Gp1.ClubAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Gp1.ClubAutomation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IAttendanceService _attendanceService;

    public UsersController(IUserService userService, IAttendanceService attendanceService)
    {
        _userService = userService;
        _attendanceService = attendanceService;
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMeRequest req, CancellationToken ct)
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(idStr) || !int.TryParse(idStr, out var userId))
            return Unauthorized();

        var updated = await _userService.UpdateMeAsync(userId, req, ct);
        if (updated is null) return NotFound();

        return Ok(updated);
    }
    
    [HttpGet("{userId:int}/attendances")]
    public async Task<ActionResult<List<EventDto>>> GetAttendances(int userId, CancellationToken ct)
    {
        var events = await _attendanceService.GetAttendedEventsAsync(userId, ct);
        return Ok(events);
    }
}