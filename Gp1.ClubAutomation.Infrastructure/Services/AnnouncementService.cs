using Gp1.ClubAutomation.Application.DTOs.Announcement;
using Gp1.ClubAutomation.Application.Interfaces;
using Gp1.ClubAutomation.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Gp1.ClubAutomation.Infrastructure.Services
{
    public class AnnouncementService : IAnnouncementService
    {
        private readonly AppDbContext _db;
        public AnnouncementService(AppDbContext db) => _db = db;

        public async Task<List<AnnouncementDto>> GetByClubIdsAsync(List<int> clubIds)
        {
            if (clubIds is null || clubIds.Count == 0)
                return new List<AnnouncementDto>();

            return await _db.Announcements
                .AsNoTracking()
                .Where(a => !a.IsDeleted)
                .Where(a => clubIds.Contains(a.ClubId))
                .OrderByDescending(a => a.Pinned)
                .ThenByDescending(a => a.CreatedDate)
                .Select(a => new AnnouncementDto
                {
                    Id = a.Id,
                    ClubId = a.ClubId,
                    Title = a.Title,
                    Content = a.Content,
                    Pinned = a.Pinned,
                    CreatedAt = a.CreatedDate
                })
                .ToListAsync();
        }

        public async Task<AnnouncementDto> CreateForClubAsync(int clubId, CreateAnnouncementRequest req)
        {
            if (clubId <= 0) throw new ArgumentException("clubId is invalid.");
            if (string.IsNullOrWhiteSpace(req.Title)) throw new ArgumentException("Title is required.");

            var clubExists = await _db.Clubs
                .AsNoTracking()
                .AnyAsync(c => c.Id == clubId && !c.IsDeleted);

            if (!clubExists) throw new InvalidOperationException("Club not found.");

            var entity = new Domain.Entities.Club.Announcement
            {
                ClubId = clubId,
                Title = req.Title.Trim(),
                Content = req.Content,
                Pinned = req.Pinned
            };

            _db.Announcements.Add(entity);
            await _db.SaveChangesAsync();

            return new AnnouncementDto
            {
                Id = entity.Id,
                ClubId = entity.ClubId,
                Title = entity.Title,
                Content = entity.Content,
                Pinned = entity.Pinned,
                CreatedAt = entity.CreatedDate
            };
        }

        public async Task<AnnouncementDto> UpdateAsync(int id, UpdateAnnouncementRequest req)
        {
            if (id <= 0) throw new ArgumentException("id is invalid.");

            var entity = await _db.Announcements
                .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

            if (entity is null) throw new InvalidOperationException("Announcement not found.");

            // PATCH logic: fields with null values are left untouched.
            if (req.Title is not null) entity.Title = req.Title.Trim();
            if (req.Content is not null) entity.Content = req.Content;
            if (req.Pinned.HasValue) entity.Pinned = req.Pinned.Value;

            await _db.SaveChangesAsync();

            return new AnnouncementDto
            {
                Id = entity.Id,
                ClubId = entity.ClubId,
                Title = entity.Title,
                Content = entity.Content,
                Pinned = entity.Pinned,
                CreatedAt = entity.CreatedDate
            };
        }

        public async Task DeleteAsync(int id)
        {
            if (id <= 0) throw new ArgumentException("id is invalid.");

            // Soft delete already works with DbContextApplyAuditInfo (EntityState.Deleted -> IsDeleted=true)
            var entity = await _db.Announcements
                .FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);

            if (entity is null) return;

            _db.Announcements.Remove(entity);
            await _db.SaveChangesAsync();
        }
    }
}