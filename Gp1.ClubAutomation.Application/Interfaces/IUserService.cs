using Gp1.ClubAutomation.Application.DTOs.Membership;
using Gp1.ClubAutomation.Application.DTOs.User;

namespace Gp1.ClubAutomation.Application.Interfaces
{
    public interface IUserService
    {
        Task<UserMeDto?> UpdateMeAsync(int userId, UpdateMeRequest req, CancellationToken ct);
        
        // Optional method to FE's a page.
        Task<List<MembershipDto>> GetMembershipsAsync(int userId);
    }
}