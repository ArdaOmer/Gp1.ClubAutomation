using Gp1.ClubAutomation.Domain.Common;

namespace Gp1.ClubAutomation.Domain.Entities
{
    public class Club : BaseEntity
    {
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Faculty { get; set; } = null!;
        
        // İlişki: 1 Club -> N Event
        public ICollection<Event> Events { get; set; } = new List<Event>();
    }
}