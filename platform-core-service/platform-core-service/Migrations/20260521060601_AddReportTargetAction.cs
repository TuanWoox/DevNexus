using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddReportTargetAction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TargetAction",
                table: "ModerationReports",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetAction",
                table: "ModerationReports");
        }
    }
}
