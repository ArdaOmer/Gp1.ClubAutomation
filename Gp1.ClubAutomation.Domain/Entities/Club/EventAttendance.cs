using Gp1.ClubAutomation.Domain.Common;
using Gp1.ClubAutomation.Domain.Entities.Auth;

namespace Gp1.ClubAutomation.Domain.Entities.Club;

public class EventAttendance : BaseEntity
{
    public int UserId { get; set; }
    public int EventId { get; set; }

    // Nav props (optional but good)
    public User User { get; set; } = null!;
    public Event Event { get; set; } = null!;
}