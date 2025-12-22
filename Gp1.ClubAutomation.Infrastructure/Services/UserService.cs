using Gp1.ClubAutomation.Application.DTOs.Membership;
using Gp1.ClubAutomation.Application.DTOs.User;
using Gp1.ClubAutomation.Application.Interfaces;
using Gp1.ClubAutomation.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Gp1.ClubAutomation.Infrastructure.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _db;
        public UserService(AppDbContext db) => _db = db;
        
        public async Task<List<MembershipDto>> GetMembershipsAsync(int userId)
        {
            return await _db.Memberships
                .Where(m => m.UserId == userId && m.IsActive && !m.IsDeleted)
                .Select(m => new MembershipDto
                {
                    ClubId = m.ClubId,
                    Role = m.Role.ToString()
                })
                .ToListAsync();
        }

        public async Task<UserMeDto?> UpdateMeAsync(int userId, UpdateMeRequest req, CancellationToken ct)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId, ct);
            if (user is null) return null;

            // Patch: Update if incoming data is full.
            if (req.Name != null) user.FullName = req.Name;
            if (req.Department != null) user.Department = req.Department;
            if (req.Grade.HasValue) user.Grade = req.Grade;
            if (req.BirthDate.HasValue) user.BirthDate = req.BirthDate.Value;
            if (req.Phone != null) user.Phone = req.Phone;
            if (req.Bio != null) user.Bio = req.Bio;
            if (req.AvatarDataUrl != null) user.AvatarDataUrl = req.AvatarDataUrl;

            user.UpdatedDate = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);

            return new UserMeDto
            {
                Id = user.Id,
                Name = user.FullName,
                Email = user.Email,

                Department = user.Department,
                Grade = user.Grade,
                BirthDate = user.BirthDate,
                Phone = user.Phone,
                Bio = user.Bio,
                AvatarDataUrl = user.AvatarDataUrl,

                Memberships = new List<object>() // for now.
            };
        }
    }
}