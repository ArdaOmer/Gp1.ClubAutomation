using Gp1.ClubAutomation.Domain.Common;

namespace Gp1.ClubAutomation.Domain.Entities.Club
{
    public class Announcement : BaseEntity
    {
        public int ClubId { get; set; }
        public string Title { get; set; } = default!;
        public string? Content { get; set; }
        public bool Pinned { get; set; } = false;

        public Club Club { get; set; } = default!;
    }
}