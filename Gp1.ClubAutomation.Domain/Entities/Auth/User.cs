using Gp1.ClubAutomation.Domain.Common;
using Gp1.ClubAutomation.Domain.Entities.Club;

namespace Gp1.ClubAutomation.Domain.Entities.Auth
{
    public class User : BaseEntity
    {
        public string Username { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string? FullName { get; set; }
        
        public string? Department { get; set; }        
        public int? Grade { get; set; }                
        public DateOnly? BirthDate { get; set; }       
        public string? Phone { get; set; }             
        public string? Bio { get; set; }               
        public string? AvatarDataUrl { get; set; }     
        
        public bool IsAdmin { get; set; } = false;

        // Navigation
        public ICollection<Membership> Memberships { get; set; } = new List<Membership>();
    }
}