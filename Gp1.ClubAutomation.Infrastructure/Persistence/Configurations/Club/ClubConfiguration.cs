using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Gp1.ClubAutomation.Infrastructure.Persistence.Configurations.Club
{
    public class ClubConfiguration : IEntityTypeConfiguration<Domain.Entities.Club.Club>
    {
        public void Configure(EntityTypeBuilder<Domain.Entities.Club.Club> builder)
        {
            builder.ToTable("Clubs");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Name)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(x => x.Description)
                .HasMaxLength(1000);

            builder.HasMany(x => x.Memberships)
                .WithOne(x => x.Club)
                .HasForeignKey(x => x.ClubId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}