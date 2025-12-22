namespace Gp1.ClubAutomation.Application.Interfaces
{
    public interface IMembershipService
    {
        Task<List<object>> GetByUserIdAsync(int userId);
        Task<bool> LeaveAsync(int userId, int clubId, CancellationToken ct = default);
        Task JoinAsync(int userId, int clubId, CancellationToken ct);
    }
}