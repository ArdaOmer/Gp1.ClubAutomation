using Gp1.ClubAutomation.Domain.Common;

namespace Gp1.ClubAutomation.Domain.Entities.Club
{
    public class Club : BaseEntity
    {
        public string Name { get; set; } = default!;
        public string? Description { get; set; }

        public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
        public ICollection<Event> Events { get; set; } = new List<Event>();
        public ICollection<Announcement> Announcements { get; set; } = new List<Announcement>();
    }
}