using Gp1.ClubAutomation.Domain.Common;
using Gp1.ClubAutomation.Domain.Entities.Auth;

namespace Gp1.ClubAutomation.Domain.Entities.Club
{
    public enum Role
    {
        Member = 0,
        President = 1
    }

    public class Membership : BaseEntity
    {
        public int UserId { get; set; }
        public int ClubId { get; set; }
        public Role Role { get; set; } = Role.Member;

        // Navigation
        public Club Club { get; set; } = default!;
        public User User { get; set; } = default!;
    }
}