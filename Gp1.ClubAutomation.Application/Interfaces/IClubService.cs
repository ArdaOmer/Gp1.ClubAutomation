using Gp1.ClubAutomation.Application.DTOs.Club;

namespace Gp1.ClubAutomation.Application.Interfaces
{
    public interface IClubService
    {
        Task<List<ClubDto>> GetAllAsync();
        Task<ClubDto?> GetByIdAsync(int id);

        Task<ClubDto> CreateAsync(CreateClubRequest req);

        // FE sometimes calls "clubId -> events"
        // This can also be done with EventService on the Controller side, but let's leave it here.
        Task<bool> ExistsAsync(int clubId);
    }
}