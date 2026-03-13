using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.BaseEntity;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Entities.Identities;


namespace platform_core_service.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string, IdentityUserClaim<string>,
    ApplicationUserRole, IdentityUserLogin<string>, IdentityRoleClaim<string>, IdentityUserToken<string>>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {


        }
        public DbSet<Setting> Settings { get; set; }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<ApplicationUserRole>(userRole =>
            {
                userRole.HasKey(ur => new { ur.UserId, ur.RoleId });

                userRole.HasOne(ur => ur.User)
                    .WithMany(u => u.UserRoles)
                    .HasForeignKey(ur => ur.UserId)
                    .IsRequired();

                userRole.HasOne(ur => ur.Role)
                    .WithMany(r => r.UserRoles)
                    .HasForeignKey(ur => ur.RoleId)
                    .IsRequired();
            });

            builder.Entity<Setting>(entity =>
            {
                entity.Property(e => e.DataType).HasConversion<string>();

                entity.HasIndex(e => e.Key).IsUnique();

                entity.HasQueryFilter(e => !e.Deleted);
            });
        }

        public async Task<int> SaveChangesAsync(bool populatedICreated = true, bool populatedIModified = true, CancellationToken cancellationToken = default)
        => await SaveChangesInternalAsync(populatedICreated, populatedIModified, cancellationToken);

        private async Task<int> SaveChangesInternalAsync(bool populatedICreated, bool populatedIModified, CancellationToken cancellationToken)
        {
            var now = DateTimeOffset.UtcNow;

            var tracked = ChangeTracker.Entries().Where(e => e.State != EntityState.Unchanged).ToList();
            foreach (var change in tracked)
            {
                switch (change.State)
                {
                    case EntityState.Added:
                        if (change.Entity is ICreated c && populatedICreated)
                        {
                            c.DateCreated = now;
                            c.DateModified = now;
                        }
                        break;

                    case EntityState.Modified:
                        if (change.Entity is IModified m && populatedIModified)
                        {
                            m.DateModified = now;
                        }
                        break;

                    case EntityState.Deleted:
                        if (change.Entity is IDeleted d)
                        {
                            change.State = EntityState.Modified;
                            d.Deleted = true;
                            d.DateDeleted = now;
                        }
                        break;
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }

    }
}
