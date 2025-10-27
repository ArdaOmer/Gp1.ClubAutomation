using BCrypt.Net;
using Gp1.ClubAutomation.Domain.Entities.Auth;
using Gp1.ClubAutomation.Infrastructure.Persistence;
using Gp1.ClubAutomation.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace Gp1.ClubAutomation.Application.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly JwtTokenGenerator _jwt;

        public AuthService(AppDbContext context, JwtTokenGenerator jwt)
        {
            _context = context;
            _jwt = jwt;
        }

        public async Task<string?> RegisterAsync(string username, string email, string password, string? fullName)
        {
            if (await _context.Users.AnyAsync(u => u.Email == email))
                return null; // Email zaten kayıtlı

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
            var user = new User
            {
                Username = username,
                Email = email,
                PasswordHash = hashedPassword,
                FullName = fullName
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return _jwt.GenerateToken(user);
        }

        public async Task<string?> LoginAsync(string email, string password)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return null;

            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return null;

            return _jwt.GenerateToken(user);
        }
    }
}