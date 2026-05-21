using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddModerationReports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ModerationReports",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ReporterId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TargetType = table.Column<int>(type: "integer", nullable: false),
                    TargetId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TargetOwnerId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false),
                    TargetHistoryId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    TargetSnapshotJson = table.Column<string>(type: "jsonb", nullable: true),
                    Reason = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AssignedModeratorId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    ModeratorNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Resolution = table.Column<int>(type: "integer", nullable: true),
                    ResolutionNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ResolvedById = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: true),
                    ResolvedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ModerationReports", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationReports_AssignedModeratorId_Status_DateCreated",
                table: "ModerationReports",
                columns: new[] { "AssignedModeratorId", "Status", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationReports_Deleted",
                table: "ModerationReports",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_ModerationReports_ReporterId_TargetType_TargetId_Status",
                table: "ModerationReports",
                columns: new[] { "ReporterId", "TargetType", "TargetId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationReports_Status_DateCreated",
                table: "ModerationReports",
                columns: new[] { "Status", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationReports_TargetOwnerId_Status_DateCreated",
                table: "ModerationReports",
                columns: new[] { "TargetOwnerId", "Status", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_ModerationReports_TargetType_TargetId_Status",
                table: "ModerationReports",
                columns: new[] { "TargetType", "TargetId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ModerationReports");
        }
    }
}
