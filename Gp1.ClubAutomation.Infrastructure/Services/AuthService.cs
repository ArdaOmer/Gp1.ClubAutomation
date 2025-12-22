using Gp1.ClubAutomation.Application.Interfaces;
using Gp1.ClubAutomation.Infrastructure.Context;
using Gp1.ClubAutomation.Infrastructure.Security;
using Microsoft.EntityFrameworkCore;

namespace Gp1.ClubAutomation.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly JwtTokenGenerator _jwt;

        public AuthService(AppDbContext context, JwtTokenGenerator jwt)
        {
            _context = context;
            _jwt = jwt;
        }

        public async Task<object?> LoginAsync(string email, string password)
        {
            // Get the user
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email == email && !u.IsDeleted);

            if (user is null)
                return null;

            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return null;

            // Token
            var token = _jwt.GenerateToken(user);

            // Memberships (projection with a single database call)
            // Note: the user is already in memory, retrieving memberships with a separate query would also work.
            // but you want "single stream" for FE; here we get it with a single ToListAsync.
            var memberships = await _context.Memberships
                .AsNoTracking()
                .Where(m => m.UserId == user.Id && !m.IsDeleted)
                .Select(m => new
                {
                    clubId = m.ClubId,
                    role = m.Role == Domain.Entities.Club.Role.President ? "President" : "Member"
                })
                .ToListAsync();

            // FE-compliant response
            return new
            {
                token,
                user = new
                {
                    id = user.Id,
                    name = string.IsNullOrWhiteSpace(user.FullName) ? user.Username : user.FullName,
                    email = user.Email,
                    memberships = memberships
                }
            };
        }
    }
}