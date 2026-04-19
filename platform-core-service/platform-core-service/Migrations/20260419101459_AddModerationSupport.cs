using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ModerationStatus",
                table: "Posts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ModerationQueueEntries",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    PostId = table.Column<string>(type: "text", nullable: false),
                    Reason = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Tier1Score = table.Column<float>(type: "real", nullable: false),
                    Tier2Reasoning = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    AssignedModeratorId = table.Column<string>(type: "text", nullable: true),
                    ResolvedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Resolution = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModerationQueueEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ModerationQueueEntries_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PostModerationResults",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    PostId = table.Column<string>(type: "text", nullable: false),
                    TextScore = table.Column<float>(type: "real", nullable: true),
                    ImageScore = table.Column<float>(type: "real", nullable: true),
                    CombinedScore = table.Column<float>(type: "real", nullable: true),
                    Decision = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Reasoning = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostModerationResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostModerationResults_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationQueueEntries_Deleted",
                table: "ModerationQueueEntries",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_ModerationQueueEntries_PostId",
                table: "ModerationQueueEntries",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_PostModerationResults_Deleted",
                table: "PostModerationResults",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_PostModerationResults_PostId",
                table: "PostModerationResults",
                column: "PostId",
                unique: true);
            migrationBuilder.Sql("UPDATE \"Posts\" SET \"ModerationStatus\" = 1;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ModerationQueueEntries");

            migrationBuilder.DropTable(
                name: "PostModerationResults");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "Posts");
        }
    }
}
