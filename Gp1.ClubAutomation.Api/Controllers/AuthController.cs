using Gp1.ClubAutomation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gp1.ClubAutomation.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var response = await _authService.LoginAsync(request.Email, request.Password);

            if (response == null)
                return Unauthorized(new { message = "Invalid e-mail or password." });

            return Ok(response);
        }
    }

    public record LoginRequest(string Email, string Password);
}