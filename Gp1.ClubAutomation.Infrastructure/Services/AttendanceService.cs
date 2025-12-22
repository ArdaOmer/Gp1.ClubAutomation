using Gp1.ClubAutomation.Application.DTOs.Event;
using Gp1.ClubAutomation.Application.Interfaces;
using Gp1.ClubAutomation.Domain.Entities.Club;
using Gp1.ClubAutomation.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace Gp1.ClubAutomation.Infrastructure.Services;

public class AttendanceService : IAttendanceService
{
    private readonly AppDbContext _context;

    public AttendanceService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int> GetCountAsync(int eventId)
    {
        return await _context.EventAttendances
            .CountAsync(x => x.EventId == eventId);
    }

    public async Task<bool> IsAttendingAsync(int eventId, int userId)
    {
        return await _context.EventAttendances
            .AnyAsync(x => x.EventId == eventId && x.UserId == userId);
    }

    public async Task<int> AttendAsync(int eventId, int userId, CancellationToken ct)
    {
        // Bypass soft delete filters and capture the actual recording
        var existing = await _context.EventAttendances
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(x => x.EventId == eventId && x.UserId == userId, ct);

        if (existing is null)
        {
            _context.EventAttendances.Add(new EventAttendance
            {
                EventId = eventId,
                UserId = userId,

                // Set required fields on the BaseEntity side if any
                // CreatedDate = DateTime.UtcNow, (if required)
                // IsActive = true, (if required)
                // IsDeleted = false
            });

            await _context.SaveChangesAsync(ct);
        }
        else
        {
            // idempotent + undelete
            if (existing.IsDeleted)
            {
                existing.IsDeleted = false;

                // If the table design includes IsActive / UpdatedDate etc.:
                // existing.IsActive = true;
                // existing.UpdatedDate = DateTime.UtcNow;

                await _context.SaveChangesAsync(ct);
            }
            // else: active participation already exists → do nothing
        }

        return await GetCountAsync(eventId);
    }

    public async Task<int> UnattendAsync(int eventId, int userId, CancellationToken ct)
    {
        var existing = await _context.EventAttendances
            .FirstOrDefaultAsync(x => x.EventId == eventId && x.UserId == userId, ct);

        if (existing is null)
            return await GetCountAsync(eventId);

        existing.IsDeleted = true;

        // if exist:
        // existing.IsActive = false;
        // existing.UpdatedDate = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        return await GetCountAsync(eventId);
    }

    public async Task<List<EventDto>> GetAttendedEventsAsync(int userId, CancellationToken ct)
    {
        return await _context.EventAttendances
            .AsNoTracking()
            .Where(a =>
                a.UserId == userId &&
                !a.IsDeleted
            )
            .Join(
                _context.Events.AsNoTracking().Where(e => !e.IsDeleted),
                a => a.EventId,
                e => e.Id,
                (a, e) => new EventDto
                {
                    Id = e.Id,
                    ClubId = e.ClubId,
                    Title = e.Title,
                    Description = e.Description,
                    Location = e.Location,
                    StartAt = e.StartAt,
                    EndAt = e.EndAt,
                    IsPublished = e.IsPublished
                }
            )
            .OrderByDescending(e => e.StartAt)
            .ToListAsync(ct);
    }
}