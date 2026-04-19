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
        public DbSet<Setting> Settings { get; set; }
        public DbSet<Profile> Profiles { get; set; }
        public DbSet<Post> Posts { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<PostTag> PostTags { get; set; }
        public DbSet<Answer> Answers { get; set; }
        public DbSet<Vote> Votes { get; set; }
        public DbSet<Comment> Comments { get; set; }
        public DbSet<Community> Communities { get; set; }
        public DbSet<CommunityModerator> CommunityModerators { get; set; }
        public DbSet<CommunityMember> CommunityMembers { get; set; }
        public DbSet<CommunityMembershipRequest> CommunityMembershipRequests { get; set; }
        public DbSet<CommunityBan> CommunityBans { get; set; }
        public DbSet<ProfileBlock> ProfileBlocks { get; set; }
        public DbSet<UserFollow> UserFollows { get; set; }
        public DbSet<FollowRequest> FollowRequests { get; set; }
        public DbSet<BookMark> BookMarks { get; set; }
        public DbSet<BookMarkedItem> BookMarkedItems { get; set; }
        public DbSet<PostModerationResult> PostModerationResults { get; set; }
        public DbSet<ModerationQueueEntry> ModerationQueueEntries { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {


        }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                if (typeof(IDeleted).IsAssignableFrom(entityType.ClrType) && entityType.BaseType == null)
                {
                    entityType.AddSoftDeleteQueryFilter();
                }
            }

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

                //Add partial unique index on Key where Deleted is falses
                entity.HasIndex(e => e.Key)
                  .IsUnique()
                  .HasFilter("\"Deleted\" = false");
            });

            builder.Entity<Answer>()
                .HasOne(a => a.QAPost)
                .WithMany(q => q.Answers)
                .HasForeignKey(a => a.QAPostId);
            builder.Entity<Vote>(entity =>
            {
                entity.HasIndex(v => new { v.AuthorId, v.PostId })
                    .IsUnique()
                    .HasFilter("\"PostId\" IS NOT NULL");

                entity.HasIndex(v => new { v.AuthorId, v.AnswerId })
                    .IsUnique()
                    .HasFilter("\"AnswerId\" IS NOT NULL");

                entity.HasIndex(v => new { v.AuthorId, v.CommentId })
                    .IsUnique()
                    .HasFilter("\"CommentId\" IS NOT NULL");
            });
            builder.Entity<Comment>()
                .HasOne(c => c.ReplyToComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ReplyToCommentId)
                .OnDelete(DeleteBehavior.Restrict);
            builder.Entity<Post>()
                .HasOne(p => p.ModerationResult)
                .WithOne(m => m.Post)
                .HasForeignKey<PostModerationResult>(m => m.PostId)
                .OnDelete(DeleteBehavior.Cascade);
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
