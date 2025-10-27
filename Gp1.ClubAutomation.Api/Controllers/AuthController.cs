using Gp1.ClubAutomation.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Gp1.ClubAutomation.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            var token = await _authService.RegisterAsync(request.Username, request.Email, request.Password, request.FullName);
            if (token == null)
                return BadRequest("Bu e-posta adresiyle kayıtlı kullanıcı zaten var.");
            return Ok(new { Token = token });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var token = await _authService.LoginAsync(request.Email, request.Password);
            if (token == null)
                return Unauthorized("Geçersiz e-posta veya şifre.");
            return Ok(new { Token = token });
        }
    }

    public record RegisterRequest(string Username, string Email, string Password, string? FullName);
    public record LoginRequest(string Email, string Password);
}