using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunityContentApprovalSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Posts_CommunityId",
                table: "Posts");

            migrationBuilder.AddColumn<string>(
                name: "CommunityApprovalReason",
                table: "Posts",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CommunityApprovalStatus",
                table: "Posts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "RequireContentApproval",
                table: "Communities",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(
                "UPDATE \"Posts\" SET \"CommunityApprovalStatus\" = 1 WHERE \"CommunityId\" IS NOT NULL AND \"CommunityApprovalStatus\" IS NULL;");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_CommunityId_CommunityApprovalStatus_DateCreated",
                table: "Posts",
                columns: new[] { "CommunityId", "CommunityApprovalStatus", "DateCreated" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Posts_CommunityId_CommunityApprovalStatus_DateCreated",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "CommunityApprovalReason",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "CommunityApprovalStatus",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "RequireContentApproval",
                table: "Communities");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_CommunityId",
                table: "Posts",
                column: "CommunityId");
        }
    }
}
