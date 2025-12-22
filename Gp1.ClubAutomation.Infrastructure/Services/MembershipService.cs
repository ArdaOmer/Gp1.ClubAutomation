using Gp1.ClubAutomation.Application.Interfaces;
using Gp1.ClubAutomation.Domain.Entities.Club;
using Gp1.ClubAutomation.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Gp1.ClubAutomation.Infrastructure.Services
{
    public class MembershipService : IMembershipService
    {
        private readonly AppDbContext _context;

        public MembershipService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<object>> GetByUserIdAsync(int userId)
        {
            // If the Membership entity's property names are different, correct it here:
            // Make sure the UserId / ClubId / Role fields are correct.
            var memberships = await _context.Memberships
                .AsNoTracking()
                .Where(m => m.UserId == userId)
                .Select(m => (object)new
                {
                    clubId = m.ClubId,
                    role = m.Role // Must return the string "Member" / "President"
                })
                .ToListAsync();

            return memberships;
        }

        public async Task<bool> LeaveAsync(int userId, int clubId, CancellationToken ct = default)
        {
            var membership = await _context.Memberships
                .FirstOrDefaultAsync(m => m.UserId == userId && m.ClubId == clubId, ct);

            if (membership is null)
                return false;

            _context.Memberships.Remove(membership);
            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task JoinAsync(int userId, int clubId, CancellationToken ct)
        {
            // If there's a soft delete global filter, it won't see it.
            // That's why IgnoreQueryFilters is necessary.
            var existing = await _context.Memberships
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.UserId == userId && x.ClubId == clubId, ct);

            if (existing is null)
            {
                _context.Memberships.Add(new Membership
                {
                    UserId = userId,
                    ClubId = clubId,
                    Role = Role.Member,
                    IsDeleted = false,
                    IsActive = true,
                    CreatedDate = DateTime.UtcNow
                });
            }
            else
            {
                // It already existed (active or soft delete)
                if (existing.IsDeleted)
                {
                    existing.IsDeleted = false; // reactivate
                    existing.IsActive = true;
                    // Update the audit fields if you wish:
                    existing.UpdatedDate = DateTime.UtcNow; // If exist
                }
                else
                {
                    // already active membership → idempotent
                    return;
                }
            }

            await _context.SaveChangesAsync(ct);
        }
    }
}