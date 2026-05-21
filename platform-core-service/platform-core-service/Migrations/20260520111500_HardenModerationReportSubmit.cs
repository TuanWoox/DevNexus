using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class HardenModerationReportSubmit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ModerationReports_OpenDuplicateGuard",
                table: "ModerationReports",
                columns: new[] { "ReporterId", "TargetType", "TargetId" },
                unique: true,
                filter: "\"Deleted\" = false AND \"Status\" IN (0, 1, 4)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ModerationReports_OpenDuplicateGuard",
                table: "ModerationReports");
        }
    }
}
