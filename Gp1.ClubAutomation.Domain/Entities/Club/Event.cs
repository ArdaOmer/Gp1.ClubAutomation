using Gp1.ClubAutomation.Domain.Common;

namespace Gp1.ClubAutomation.Domain.Entities.Club
{
    public class Event : BaseEntity
    {
        public int ClubId { get; set; }
        public string Title { get; set; } = default!;
        public string? Description { get; set; }
        public string? Location { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime EndAt { get; set; }
        public bool IsPublished { get; set; } = true;

        public Club Club { get; set; } = default!;
    }
}