using Gp1.ClubAutomation.Application.DTOs.Event;
using Gp1.ClubAutomation.Application.Interfaces;
using Gp1.ClubAutomation.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Gp1.ClubAutomation.Infrastructure.Services
{
    public class EventService : IEventService
    {
        private readonly AppDbContext _db;
        public EventService(AppDbContext db) => _db = db;

        public async Task<List<EventDto>> GetAllAsync()
        {
            return await _db.Events
                .AsNoTracking()
                .OrderByDescending(e => e.StartAt)
                .Select(e => new EventDto
                {
                    Id = e.Id,
                    ClubId = e.ClubId,
                    Title = e.Title,
                    Description = e.Description,
                    Location = e.Location,
                    StartAt = e.StartAt,
                    EndAt = e.EndAt,
                    IsPublished = e.IsPublished
                })
                .ToListAsync();
        }

        public async Task<List<EventDto>> GetByClubAsync(int clubId)
        {
            return await _db.Events
                .AsNoTracking()
                .Where(e => e.ClubId == clubId)
                .OrderBy(e => e.StartAt)
                .Select(e => new EventDto
                {
                    Id = e.Id,
                    ClubId = e.ClubId,
                    Title = e.Title,
                    Description = e.Description,
                    Location = e.Location,
                    StartAt = e.StartAt,
                    EndAt = e.EndAt,
                    IsPublished = e.IsPublished
                })
                .ToListAsync();
        }

        public async Task<List<EventDto>> GetUpcomingForUserAsync(int userId, int days)
        {
            var now = DateTime.UtcNow;
            var until = now.AddDays(days);

            var myClubIdsQuery =
                _db.Memberships
                    .AsNoTracking()
                    .Where(m => m.UserId == userId)
                    .Select(m => m.ClubId);

            var test = await _db.Events
                .AsNoTracking()
                .Where(e => myClubIdsQuery.Contains(e.ClubId))
                .Where(e => e.StartAt >= now && e.StartAt <= until)
                .OrderBy(e => e.StartAt)
                .Select(e => new EventDto
                {
                    Id = e.Id,
                    ClubId = e.ClubId,
                    Title = e.Title,
                    Description = e.Description,
                    Location = e.Location,
                    StartAt = e.StartAt,
                    EndAt = e.EndAt,
                    IsPublished = e.IsPublished
                })
                .ToListAsync();
            return test;
        }

        public async Task<EventDto> CreateAsync(int clubId, CreateEventRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Title))
                throw new ArgumentException("Title is required.");
            if (req.EndAt <= req.StartAt)
                throw new ArgumentException("EndAt should come after StartAt.");

            // Check if there's a club (optional but good for reliability)
            var clubExists = await _db.Clubs
                .AsNoTracking()
                .AnyAsync(c => c.Id == clubId);

            if (!clubExists)
                throw new InvalidOperationException("Club not found.");

            var entity = new Domain.Entities.Club.Event
            {
                ClubId = clubId,
                Title = req.Title,
                Description = req.Description,
                Location = req.Location,
                StartAt = req.StartAt.ToUniversalTime(),
                EndAt = req.EndAt.ToUniversalTime(),
                IsPublished = true
            };

            _db.Events.Add(entity);
            await _db.SaveChangesAsync();

            return new EventDto
            {
                Id = entity.Id,
                ClubId = entity.ClubId,
                Title = entity.Title,
                Description = entity.Description,
                Location = entity.Location,
                StartAt = entity.StartAt,
                EndAt = entity.EndAt,
                IsPublished = entity.IsPublished
            };
        }

        public async Task<bool> PatchAsync(int clubId, int eventId, UpdateEventRequestDto dto,
            CancellationToken ct = default)
        {
            // If the soft delete filter is active, you won't see results where IsDeleted=true.
            var ev = await _db.Events
                .FirstOrDefaultAsync(e => e.Id == eventId && e.ClubId == clubId, ct);

            if (ev is null) return false;

            // PATCH: Apply only incoming fields
            if (dto.Title is not null)
                ev.Title = dto.Title.Trim();

            if (dto.Description is not null)
                ev.Description = dto.Description.Trim();

            if (dto.Location is not null)
                ev.Location = dto.Location.Trim();

            if (dto.StartAt.HasValue)
                ev.StartAt = dto.StartAt.Value;

            if (dto.EndAt.HasValue)
                ev.EndAt = dto.EndAt.Value;

            if (dto.IsPublished.HasValue)
                ev.IsPublished = dto.IsPublished.Value;

            ev.UpdatedDate = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            return true;
        }

        public async Task<bool> DeleteAsync(int clubId, int eventId, CancellationToken ct = default)
        {
            // If the soft delete filter is active, results with IsDeleted=true will not be displayed.
            var ev = await _db.Events
                .FirstOrDefaultAsync(e => e.Id == eventId && e.ClubId == clubId, ct);

            if (ev is null) return false;

            // Soft delete
            ev.IsDeleted = true;

            // If exist audit:
            // ev.UpdatedDate = DateTime.UtcNow;

            await _db.SaveChangesAsync(ct);
            return true;
        }
    }
}