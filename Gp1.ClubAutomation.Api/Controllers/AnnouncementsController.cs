using Gp1.ClubAutomation.Application.DTOs.Announcement;
using Gp1.ClubAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gp1.ClubAutomation.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnnouncementsController : ControllerBase
    {
        private readonly IAnnouncementService _announcementService;

        public AnnouncementsController(IAnnouncementService announcementService)
        {
            _announcementService = announcementService;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string? clubIds)
        {
            if (string.IsNullOrWhiteSpace(clubIds))
                return Ok(Array.Empty<object>());

            var ids = clubIds
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => int.TryParse(s, out var x) ? x : 0)
                .Where(x => x > 0)
                .ToList();

            if (ids.Count == 0) return Ok(Array.Empty<object>());

            var list = await _announcementService.GetByClubIdsAsync(ids);
            return Ok(list);
        }

        [HttpPatch("{id:int}")]
        public async Task<IActionResult> Patch([FromRoute] int id, [FromBody] UpdateAnnouncementRequest req)
        {
            var updated = await _announcementService.UpdateAsync(id, req);
            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            await _announcementService.DeleteAsync(id);
            return NoContent();
        }
    }
}