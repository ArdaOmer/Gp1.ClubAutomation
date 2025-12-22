using Gp1.ClubAutomation.Domain.Entities.Club;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Gp1.ClubAutomation.Infrastructure.Persistence.Configurations.Club
{
    public class EventConfiguration : IEntityTypeConfiguration<Event>
    {
        public void Configure(EntityTypeBuilder<Event> builder)
        {
            builder.ToTable("Events");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Title)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(x => x.Location)
                .HasMaxLength(200);

            builder.HasOne(x => x.Club)
                .WithMany(x => x.Events)
                .HasForeignKey(x => x.ClubId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}