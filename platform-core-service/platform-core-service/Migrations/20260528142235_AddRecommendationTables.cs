using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddRecommendationTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserContentInteractions",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "character varying(26)", maxLength: 26, nullable: false),
                    PostId = table.Column<string>(type: "character varying(26)", maxLength: 26, nullable: true),
                    QAPostId = table.Column<string>(type: "character varying(26)", maxLength: 26, nullable: true),
                    InteractionType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DwellTimeSeconds = table.Column<int>(type: "integer", nullable: true),
                    Source = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserContentInteractions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserContentInteractions_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserContentInteractions_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserContentInteractions_Posts_QAPostId",
                        column: x => x.QAPostId,
                        principalTable: "Posts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UserRecommendationFeedbacks",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<string>(type: "character varying(26)", maxLength: 26, nullable: false),
                    PostId = table.Column<string>(type: "character varying(26)", maxLength: 26, nullable: true),
                    QAPostId = table.Column<string>(type: "character varying(26)", maxLength: 26, nullable: true),
                    CommunityId = table.Column<string>(type: "character varying(26)", maxLength: 26, nullable: true),
                    FeedbackType = table.Column<int>(type: "integer", maxLength: 30, nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRecommendationFeedbacks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserRecommendationFeedbacks_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRecommendationFeedbacks_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserRecommendationFeedbacks_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserRecommendationFeedbacks_Posts_QAPostId",
                        column: x => x.QAPostId,
                        principalTable: "Posts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserContentInteractions_Deleted",
                table: "UserContentInteractions",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_UserContentInteractions_InteractionType",
                table: "UserContentInteractions",
                column: "InteractionType");

            migrationBuilder.CreateIndex(
                name: "IX_UserContentInteractions_PostId",
                table: "UserContentInteractions",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_UserContentInteractions_QAPostId",
                table: "UserContentInteractions",
                column: "QAPostId");

            migrationBuilder.CreateIndex(
                name: "IX_UserContentInteractions_UserId_DateCreated",
                table: "UserContentInteractions",
                columns: new[] { "UserId", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_UserContentInteractions_UserId_PostId",
                table: "UserContentInteractions",
                columns: new[] { "UserId", "PostId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserContentInteractions_UserId_QAPostId",
                table: "UserContentInteractions",
                columns: new[] { "UserId", "QAPostId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserRecommendationFeedbacks_CommunityId",
                table: "UserRecommendationFeedbacks",
                column: "CommunityId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRecommendationFeedbacks_Deleted",
                table: "UserRecommendationFeedbacks",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_UserRecommendationFeedbacks_PostId",
                table: "UserRecommendationFeedbacks",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRecommendationFeedbacks_QAPostId",
                table: "UserRecommendationFeedbacks",
                column: "QAPostId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRecommendationFeedbacks_UserId_CommunityId",
                table: "UserRecommendationFeedbacks",
                columns: new[] { "UserId", "CommunityId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserRecommendationFeedbacks_UserId_PostId",
                table: "UserRecommendationFeedbacks",
                columns: new[] { "UserId", "PostId" });

            migrationBuilder.CreateIndex(
                name: "IX_UserRecommendationFeedbacks_UserId_QAPostId",
                table: "UserRecommendationFeedbacks",
                columns: new[] { "UserId", "QAPostId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserContentInteractions");

            migrationBuilder.DropTable(
                name: "UserRecommendationFeedbacks");
        }
    }
}
