using Gp1.ClubAutomation.Application.DTOs.Membership;
using Gp1.ClubAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gp1.ClubAutomation.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MembershipsController : ControllerBase
    {
        private readonly IMembershipService _membershipService;

        public MembershipsController(IMembershipService membershipService)
        {
            _membershipService = membershipService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyMemberships([FromQuery] int userId)
        {
            if (userId <= 0)
                return BadRequest(new { message = "userId is invalid." });

            var result = await _membershipService.GetByUserIdAsync(userId);
            return Ok(result);
        }

        [HttpPost("leave")]
        public async Task<IActionResult> Leave([FromBody] LeaveMembershipRequestDto req, CancellationToken ct)
        {
            // 404 handling is "not a priority" for now.
            // But to avoid an endpoint 404: let's not break the UI by returning a 204 even if there's no membership.
            await _membershipService.LeaveAsync(req.UserId, req.ClubId, ct);
            return NoContent();
        }

        [HttpPost("join")]
        public async Task<IActionResult> Join([FromBody] JoinMembershipRequestDto dto, CancellationToken ct)
        {
            await _membershipService.JoinAsync(dto.UserId, dto.ClubId, ct);
            return NoContent();
        }
    }
}