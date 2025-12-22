using Gp1.ClubAutomation.Application.DTOs.Event;

namespace Gp1.ClubAutomation.Application.Interfaces
{
    public interface IEventService
    {
        Task<List<EventDto>> GetAllAsync();
        Task<List<EventDto>> GetByClubAsync(int clubId);
        Task<List<EventDto>> GetUpcomingForUserAsync(int userId, int days);

        Task<EventDto> CreateAsync(int clubId, CreateEventRequest req);
        Task<bool> PatchAsync(int clubId, int eventId, UpdateEventRequestDto dto, CancellationToken ct = default);
        Task<bool> DeleteAsync(int clubId, int eventId, CancellationToken ct = default);

    }
}