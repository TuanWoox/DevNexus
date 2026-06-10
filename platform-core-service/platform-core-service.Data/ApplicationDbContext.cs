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
        public DbSet<ProfileCommunityBlock> ProfileCommunityBlocks { get; set; }
        public DbSet<UserFollow> UserFollows { get; set; }
        public DbSet<FollowRequest> FollowRequests { get; set; }
        public DbSet<BookMark> BookMarks { get; set; }
        public DbSet<BookMarkedItem> BookMarkedItems { get; set; }
        public DbSet<ProfileMedia> ProfileMedias { get; set; }
        public DbSet<CommunityMedia> CommunityMedias { get;set; }
        public DbSet<PostMedia> PostMedias { get; set; }
        public DbSet<QAMedia> QAMedias { get; set; }
        public DbSet<AnswerMedia> AnswerMedias { get; set; }
        public DbSet<CommentMedia> CommentMedias { get; set; }
        public DbSet<ModerationResult> ModerationResults { get; set; }
        public DbSet<ModerationQueueEntry> ModerationQueueEntries { get; set; }
        public DbSet<ModerationReport> ModerationReports { get; set; }
        public DbSet<AdminAuditLog> AdminAuditLogs { get; set; }
        public DbSet<PostHistory> PostHistories { get; set; }
        public DbSet<QAPostHistory> QAPostHistories { get; set; }
        public DbSet<CommentHistory> CommentHistories { get; set; }
        public DbSet<AnswerHistory> AnswerHistories { get; set; }
        public DbSet<CommunityCommentsReport> CommunityCommentsReports { get; set; }
        public DbSet<CommunityPostsReport> CommunityPostsReports { get; set; }
        public DbSet<CommunityQAPostReports> CommunityQAPostReports { get; set; }
        public DbSet<CommunityAnswersReport> CommunityAnswersReports { get; set; }
        public DbSet<CommunityMuteMember> CommunityMutedMembers { get; set; }
        public DbSet<UserContentInteraction> UserContentInteractions { get; set; }
        public DbSet<UserRecommendationFeedback> UserRecommendationFeedbacks { get; set; }

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {


        }
        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<BaseCommunityReport>()
                .UseTpcMappingStrategy();

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

            builder.Entity<AnswerMedia>()
                .HasOne(m => m.Answer)
                .WithMany()
                .HasForeignKey(m => m.AnswerId);

            builder.Entity<CommentMedia>()
                .HasOne(m => m.Comment)
                .WithMany()
                .HasForeignKey(m => m.CommentId);
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
            builder.Entity<Post>(entity =>
            {
                entity.Property(p => p.ModerationStatus).HasConversion<int>();
                entity.Property(p => p.CommunityApprovalStatus).HasConversion<int>();
                entity.HasOne(p => p.SharedPost)
                    .WithMany()
                    .HasForeignKey(p => p.SharedPostId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(p => new { p.ModerationStatus, p.DateCreated });
                entity.HasIndex(p => new { p.CommunityId, p.CommunityApprovalStatus, p.DateCreated });
                entity.HasIndex(p => new { p.AuthorId, p.ModerationStatus, p.DateCreated });
                entity.HasIndex(p => p.SharedPostId);
                entity.HasIndex(p => p.Slug);
            });

            builder.Entity<AdminAuditLog>(entity =>
            {
                entity.Property(e => e.TargetType).HasConversion<int>();
                entity.Property(e => e.ActionType).HasConversion<int>();
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => new { e.ActorId, e.CreatedAt });
                entity.HasIndex(e => new { e.TargetType, e.TargetId, e.CreatedAt });
                entity.HasIndex(e => new { e.ActionType, e.CreatedAt });
            });

            builder.Entity<ModerationReport>(entity =>
            {
                entity.Property(e => e.TargetType).HasConversion<int>();
                entity.Property(e => e.Reason).HasConversion<int>();
                entity.Property(e => e.Status).HasConversion<int>();
                entity.Property(e => e.Resolution).HasConversion<int>();
                entity.Property(e => e.TargetSnapshotJson).HasColumnType("jsonb");

                entity.HasIndex(e => new { e.Status, e.DateCreated });
                entity.HasIndex(e => new { e.TargetType, e.TargetId, e.Status });
                entity.HasIndex(e => new { e.ReporterId, e.TargetType, e.TargetId, e.Status });
                entity.HasIndex(e => new { e.ReporterId, e.TargetType, e.TargetId })
                    .IsUnique()
                    .HasDatabaseName("IX_ModerationReports_OpenDuplicateGuard")
                    .HasFilter("\"Deleted\" = false AND \"Status\" IN (0, 1, 4)");
                entity.HasIndex(e => new { e.AssignedModeratorId, e.Status, e.DateCreated });
                entity.HasIndex(e => new { e.TargetOwnerId, e.Status, e.DateCreated });
            });

            builder.Entity<PostHistory>(entity =>
            {
                entity.HasIndex(e => new { e.PostId, e.DateCreated });
                entity.HasOne(e => e.Post)
                    .WithMany()
                    .HasForeignKey(e => e.PostId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<QAPostHistory>(entity =>
            {
                entity.HasIndex(e => new { e.QAPostId, e.DateCreated });
                entity.HasOne(e => e.QAPost)
                    .WithMany()
                    .HasForeignKey(e => e.QAPostId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<CommentHistory>(entity =>
            {
                entity.HasIndex(e => new { e.CommentId, e.DateCreated });
                entity.HasOne(e => e.Comment)
                    .WithMany()
                    .HasForeignKey(e => e.CommentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<AnswerHistory>(entity =>
            {
                entity.HasIndex(e => new { e.AnswerId, e.DateCreated });
                entity.HasOne(e => e.Answer)
                    .WithMany()
                    .HasForeignKey(e => e.AnswerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<CommunityCommentsReport>(entity =>
            {
                entity.ToTable("CommunityCommentsReports");
                entity.HasIndex(r => new { r.CommentId, r.ReporterId }).IsUnique();
                entity.HasIndex(r => new { r.ReporterId, r.Status });

                ConfigureCommunityReportRelationships(entity);
            });

            builder.Entity<CommunityPostsReport>(entity =>
            {
                entity.ToTable("CommunityPostsReports");
                entity.HasIndex(r => new { r.PostId, r.ReporterId }).IsUnique();
                entity.HasIndex(r => new { r.ReporterId, r.Status });

                ConfigureCommunityReportRelationships(entity);
            });

            builder.Entity<CommunityQAPostReports>(entity =>
            {
                entity.ToTable("CommunityQAPostReports");
                entity.HasIndex(r => new { r.QAPostId, r.ReporterId }).IsUnique();
                entity.HasIndex(r => new { r.ReporterId, r.Status });

                ConfigureCommunityReportRelationships(entity);
            });

            builder.Entity<CommunityAnswersReport>(entity =>
            {
                entity.ToTable("CommunityAnswersReports");
                entity.HasIndex(r => new { r.AnswerId, r.ReporterId }).IsUnique();
                entity.HasIndex(r => new { r.ReporterId, r.Status });

                ConfigureCommunityReportRelationships(entity);
            });

            builder.Entity<CommunityMuteMember>(entity =>
            {
                entity.HasIndex(m => new { m.CommunityId, m.MutedProfileId });

                entity.HasOne(m => m.MutedProfile)
                    .WithMany()
                    .HasForeignKey(m => m.MutedProfileId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.MutedBy)
                    .WithMany()
                    .HasForeignKey(m => m.MutedById)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<ProfileCommunityBlock>(entity =>
            {
                entity.HasIndex(e => new { e.ProfileId, e.CommunityId }).IsUnique();

                entity.HasOne(e => e.Profile)
                    .WithMany(p => p.BlockedCommunities)
                    .HasForeignKey(e => e.ProfileId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Community)
                    .WithMany()
                    .HasForeignKey(e => e.CommunityId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // UserContentInteraction indexes
            builder.Entity<UserContentInteraction>(entity =>
            {
                entity.HasIndex(e => new { e.ProfileId, e.DateCreated });
                entity.HasIndex(e => new { e.ProfileId, e.PostId });
                entity.HasIndex(e => new { e.ProfileId, e.QAPostId });
                entity.HasIndex(e => e.InteractionType);
            });

            // UserRecommendationFeedback indexes
            builder.Entity<UserRecommendationFeedback>(entity =>
            {
                entity.HasIndex(e => new { e.ProfileId, e.PostId });
                entity.HasIndex(e => new { e.ProfileId, e.QAPostId });
                entity.HasIndex(e => new { e.ProfileId, e.CommunityId });
            });
        }

        private static void ConfigureCommunityReportRelationships<TEntity>(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<TEntity> entity)
            where TEntity : BaseCommunityReport
        {
            entity.Property(r => r.Status).HasConversion<int>();
            entity.Property(r => r.ResolutionAction).HasConversion<int>();

            entity.HasOne(r => r.Reporter)
                .WithMany()
                .HasForeignKey(r => r.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.ReportedProfile)
                .WithMany()
                .HasForeignKey(r => r.ReportedProfileId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.ResolvedBy)
                .WithMany()
                .HasForeignKey(r => r.ResolvedById)
                .OnDelete(DeleteBehavior.Restrict);
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
