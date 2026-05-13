using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePostModerationStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Posts_AuthorId",
                table: "Posts");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_AuthorId_ModerationStatus_DateCreated",
                table: "Posts",
                columns: new[] { "AuthorId", "ModerationStatus", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_Posts_ModerationStatus_DateCreated",
                table: "Posts",
                columns: new[] { "ModerationStatus", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_Posts_Slug",
                table: "Posts",
                column: "Slug");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Posts_AuthorId_ModerationStatus_DateCreated",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_ModerationStatus_DateCreated",
                table: "Posts");

            migrationBuilder.DropIndex(
                name: "IX_Posts_Slug",
                table: "Posts");

            migrationBuilder.CreateIndex(
                name: "IX_Posts_AuthorId",
                table: "Posts",
                column: "AuthorId");
        }
    }
}
