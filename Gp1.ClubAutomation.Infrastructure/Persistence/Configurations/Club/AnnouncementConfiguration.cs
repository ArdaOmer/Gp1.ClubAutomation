using Gp1.ClubAutomation.Domain.Entities.Club;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Gp1.ClubAutomation.Infrastructure.Persistence.Configurations.Club
{
    public class AnnouncementConfiguration : IEntityTypeConfiguration<Announcement>
    {
        public void Configure(EntityTypeBuilder<Announcement> builder)
        {
            builder.ToTable("Announcements");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Title)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(x => x.Content)
                .HasMaxLength(2000);

            builder.HasOne(x => x.Club)
                .WithMany(x => x.Announcements)
                .HasForeignKey(x => x.ClubId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}