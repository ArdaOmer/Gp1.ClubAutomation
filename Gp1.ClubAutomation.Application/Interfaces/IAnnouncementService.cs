using Gp1.ClubAutomation.Application.DTOs.Announcement;

namespace Gp1.ClubAutomation.Application.Interfaces
{
    public interface IAnnouncementService
    {
        Task<List<AnnouncementDto>> GetByClubIdsAsync(List<int> clubIds);
        Task<AnnouncementDto> CreateForClubAsync(int clubId, CreateAnnouncementRequest req);
        Task<AnnouncementDto> UpdateAsync(int id, UpdateAnnouncementRequest req);
        Task DeleteAsync(int id);
    }
}