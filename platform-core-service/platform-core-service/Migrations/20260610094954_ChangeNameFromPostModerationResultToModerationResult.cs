using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class ChangeNameFromPostModerationResultToModerationResult : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PostModerationResults");

            migrationBuilder.CreateTable(
                name: "ModerationResults",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    TargetType = table.Column<int>(type: "integer", nullable: false),
                    TargetId = table.Column<string>(type: "text", nullable: false),
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
                    table.PrimaryKey("PK_ModerationResults", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationResults_Deleted",
                table: "ModerationResults",
                column: "Deleted");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ModerationResults");

            migrationBuilder.CreateTable(
                name: "PostModerationResults",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CombinedScore = table.Column<float>(type: "real", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Decision = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    ImageScore = table.Column<float>(type: "real", nullable: true),
                    Reasoning = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    TargetId = table.Column<string>(type: "text", nullable: false),
                    TargetType = table.Column<int>(type: "integer", nullable: false),
                    TextScore = table.Column<float>(type: "real", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostModerationResults", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PostModerationResults_Deleted",
                table: "PostModerationResults",
                column: "Deleted");
        }
    }
}
