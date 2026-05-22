using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunityReportsAndMutes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunityAnswersReports",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CommunityId = table.Column<string>(type: "text", nullable: false),
                    ReporterId = table.Column<string>(type: "text", nullable: false),
                    ReportedProfileId = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ResolvedById = table.Column<string>(type: "text", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ResolutionAction = table.Column<int>(type: "integer", nullable: false),
                    AnswerId = table.Column<string>(type: "text", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityAnswersReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityAnswersReports_Answers_AnswerId",
                        column: x => x.AnswerId,
                        principalTable: "Answers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityAnswersReports_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityAnswersReports_Profiles_ReportedProfileId",
                        column: x => x.ReportedProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityAnswersReports_Profiles_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityAnswersReports_Profiles_ResolvedById",
                        column: x => x.ResolvedById,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CommunityCommentsReports",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CommunityId = table.Column<string>(type: "text", nullable: false),
                    ReporterId = table.Column<string>(type: "text", nullable: false),
                    ReportedProfileId = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ResolvedById = table.Column<string>(type: "text", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ResolutionAction = table.Column<int>(type: "integer", nullable: false),
                    CommentId = table.Column<string>(type: "text", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityCommentsReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityCommentsReports_Comments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "Comments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityCommentsReports_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityCommentsReports_Profiles_ReportedProfileId",
                        column: x => x.ReportedProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityCommentsReports_Profiles_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityCommentsReports_Profiles_ResolvedById",
                        column: x => x.ResolvedById,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CommunityMutedMembers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CommunityId = table.Column<string>(type: "text", nullable: false),
                    MutedProfileId = table.Column<string>(type: "text", nullable: false),
                    MutedById = table.Column<string>(type: "text", nullable: false),
                    MuteReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    MutedUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityMutedMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityMutedMembers_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityMutedMembers_Profiles_MutedById",
                        column: x => x.MutedById,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityMutedMembers_Profiles_MutedProfileId",
                        column: x => x.MutedProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CommunityPostsReports",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CommunityId = table.Column<string>(type: "text", nullable: false),
                    ReporterId = table.Column<string>(type: "text", nullable: false),
                    ReportedProfileId = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ResolvedById = table.Column<string>(type: "text", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ResolutionAction = table.Column<int>(type: "integer", nullable: false),
                    PostId = table.Column<string>(type: "text", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityPostsReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityPostsReports_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityPostsReports_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityPostsReports_Profiles_ReportedProfileId",
                        column: x => x.ReportedProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityPostsReports_Profiles_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityPostsReports_Profiles_ResolvedById",
                        column: x => x.ResolvedById,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CommunityQAPostReports",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CommunityId = table.Column<string>(type: "text", nullable: false),
                    ReporterId = table.Column<string>(type: "text", nullable: false),
                    ReportedProfileId = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ResolvedById = table.Column<string>(type: "text", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ResolutionAction = table.Column<int>(type: "integer", nullable: false),
                    QAPostId = table.Column<string>(type: "text", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityQAPostReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityQAPostReports_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityQAPostReports_Posts_QAPostId",
                        column: x => x.QAPostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityQAPostReports_Profiles_ReportedProfileId",
                        column: x => x.ReportedProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityQAPostReports_Profiles_ReporterId",
                        column: x => x.ReporterId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CommunityQAPostReports_Profiles_ResolvedById",
                        column: x => x.ResolvedById,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityAnswersReports_AnswerId_ReporterId",
                table: "CommunityAnswersReports",
                columns: new[] { "AnswerId", "ReporterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityAnswersReports_CommunityId",
                table: "CommunityAnswersReports",
                column: "CommunityId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityAnswersReports_Deleted",
                table: "CommunityAnswersReports",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityAnswersReports_ReportedProfileId",
                table: "CommunityAnswersReports",
                column: "ReportedProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityAnswersReports_ReporterId_Status",
                table: "CommunityAnswersReports",
                columns: new[] { "ReporterId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityAnswersReports_ResolvedById",
                table: "CommunityAnswersReports",
                column: "ResolvedById");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityCommentsReports_CommentId_ReporterId",
                table: "CommunityCommentsReports",
                columns: new[] { "CommentId", "ReporterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityCommentsReports_CommunityId",
                table: "CommunityCommentsReports",
                column: "CommunityId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityCommentsReports_Deleted",
                table: "CommunityCommentsReports",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityCommentsReports_ReportedProfileId",
                table: "CommunityCommentsReports",
                column: "ReportedProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityCommentsReports_ReporterId_Status",
                table: "CommunityCommentsReports",
                columns: new[] { "ReporterId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityCommentsReports_ResolvedById",
                table: "CommunityCommentsReports",
                column: "ResolvedById");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityMutedMembers_CommunityId_MutedProfileId",
                table: "CommunityMutedMembers",
                columns: new[] { "CommunityId", "MutedProfileId" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityMutedMembers_Deleted",
                table: "CommunityMutedMembers",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityMutedMembers_MutedById",
                table: "CommunityMutedMembers",
                column: "MutedById");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityMutedMembers_MutedProfileId",
                table: "CommunityMutedMembers",
                column: "MutedProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityPostsReports_CommunityId",
                table: "CommunityPostsReports",
                column: "CommunityId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityPostsReports_Deleted",
                table: "CommunityPostsReports",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityPostsReports_PostId_ReporterId",
                table: "CommunityPostsReports",
                columns: new[] { "PostId", "ReporterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityPostsReports_ReportedProfileId",
                table: "CommunityPostsReports",
                column: "ReportedProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityPostsReports_ReporterId_Status",
                table: "CommunityPostsReports",
                columns: new[] { "ReporterId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityPostsReports_ResolvedById",
                table: "CommunityPostsReports",
                column: "ResolvedById");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityQAPostReports_CommunityId",
                table: "CommunityQAPostReports",
                column: "CommunityId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityQAPostReports_Deleted",
                table: "CommunityQAPostReports",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityQAPostReports_QAPostId_ReporterId",
                table: "CommunityQAPostReports",
                columns: new[] { "QAPostId", "ReporterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityQAPostReports_ReportedProfileId",
                table: "CommunityQAPostReports",
                column: "ReportedProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityQAPostReports_ReporterId_Status",
                table: "CommunityQAPostReports",
                columns: new[] { "ReporterId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityQAPostReports_ResolvedById",
                table: "CommunityQAPostReports",
                column: "ResolvedById");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityAnswersReports");

            migrationBuilder.DropTable(
                name: "CommunityCommentsReports");

            migrationBuilder.DropTable(
                name: "CommunityMutedMembers");

            migrationBuilder.DropTable(
                name: "CommunityPostsReports");

            migrationBuilder.DropTable(
                name: "CommunityQAPostReports");
        }
    }
}
