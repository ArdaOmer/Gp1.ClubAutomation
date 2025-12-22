using Gp1.ClubAutomation.Domain.Entities.Club;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Gp1.ClubAutomation.Infrastructure.Persistence.Configurations.Club
{
    public class MembershipConfiguration : IEntityTypeConfiguration<Membership>
    {
        public void Configure(EntityTypeBuilder<Membership> builder)
        {
            builder.ToTable("Memberships");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Role)
                .IsRequired();
        }
    }
}