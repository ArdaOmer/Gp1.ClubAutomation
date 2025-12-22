using Gp1.ClubAutomation.Domain.Common;
using Gp1.ClubAutomation.Domain.Entities.Auth;
using Gp1.ClubAutomation.Domain.Entities.Club;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace Gp1.ClubAutomation.Infrastructure.Context
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // DbSet definitions
        public DbSet<Club> Clubs => Set<Club>();
        public DbSet<Event> Events => Set<Event>();
        public DbSet<User> Users => Set<User>();
        public DbSet<Announcement> Announcements => Set<Announcement>();
        public DbSet<Membership> Memberships => Set<Membership>();
        public DbSet<EventAttendance> EventAttendances => Set<EventAttendance>();

        // Audit operations
        public override int SaveChanges()
        {
            ApplyAuditInfo();
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            ApplyAuditInfo();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void ApplyAuditInfo()
        {
            var entries = ChangeTracker.Entries<BaseEntity>();

            foreach (EntityEntry<BaseEntity> entry in entries)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedDate = DateTime.UtcNow;
                        entry.Entity.IsActive = true;
                        entry.Entity.IsDeleted = false;
                        break;

                    case EntityState.Modified:
                        entry.Entity.UpdatedDate = DateTime.UtcNow;
                        break;

                    case EntityState.Deleted:
                        // Soft delete
                        entry.State = EntityState.Modified;
                        entry.Entity.IsDeleted = true;
                        entry.Entity.DeletedDate = DateTime.UtcNow;
                        break;
                }
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Default schema
            modelBuilder.HasDefaultSchema("club");
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            // User table from auth schema
            modelBuilder.Entity<User>().ToTable("Users", "auth");

            // Membership relations + index
            modelBuilder.Entity<Membership>(entity =>
            {
                entity.ToTable("Memberships", "club");

                entity.HasOne(m => m.User)
                    .WithMany(u => u.Memberships)
                    .HasForeignKey(m => m.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.Club)
                    .WithMany(c => c.Memberships)
                    .HasForeignKey(m => m.ClubId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(m => new { m.UserId, m.ClubId }).IsUnique();

                // If CreatedDate NOT NULL, DB default
                entity.Property(m => m.CreatedDate)
                    .HasDefaultValueSql("NOW()")
                    .ValueGeneratedOnAdd();
            });

            modelBuilder.Entity<EventAttendance>(entity =>
            {
                entity.ToTable("EventAttendances", "club");

                entity.HasKey(x => x.Id);

                entity.HasIndex(x => new { x.UserId, x.EventId })
                    .IsUnique(); // The same user cannot participate in the same event twice.

                entity.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Event)
                    .WithMany()
                    .HasForeignKey(x => x.EventId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            // (Recommended) Soft delete global filter
            // Apply to all entities derived from BaseEntity.
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
                {
                    // e => !e.IsDeleted
                    var parameter = System.Linq.Expressions.Expression.Parameter(entityType.ClrType, "e");
                    var prop = System.Linq.Expressions.Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
                    var body = System.Linq.Expressions.Expression.Equal(prop, System.Linq.Expressions.Expression.Constant(false));
                    var lambda = System.Linq.Expressions.Expression.Lambda(body, parameter);

                    modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
                }
            }
        }
    }
}
