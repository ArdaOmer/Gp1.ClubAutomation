using Gp1.ClubAutomation.Application.DTOs.Event;

namespace Gp1.ClubAutomation.Application.Interfaces;

public interface IAttendanceService
{
    Task<int> GetCountAsync(int eventId);
    Task<bool> IsAttendingAsync(int eventId, int userId);
    Task<int> AttendAsync(int eventId, int userId, CancellationToken ct);
    Task<int> UnattendAsync(int eventId, int userId, CancellationToken ct);
    Task<List<EventDto>> GetAttendedEventsAsync(int userId, CancellationToken ct);
}