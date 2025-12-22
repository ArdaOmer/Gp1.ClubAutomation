namespace Gp1.ClubAutomation.Application.DTOs.Membership;

public sealed class LeaveMembershipRequestDto
{
    public int UserId { get; set; }
    public int ClubId { get; set; }
}