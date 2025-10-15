using Gp1.ClubAutomation.Domain.Common;

namespace Gp1.ClubAutomation.Domain.Entities
{
    public class Event : BaseEntity
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Location { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        // İlişki: Her etkinlik bir kulübe ait
        public int ClubId { get; set; }
        public Club Club { get; set; } = null!;
    }
}