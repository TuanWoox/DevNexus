using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class UpdateModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Settings_Deleted",
                table: "Settings",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_Deleted",
                table: "AspNetUsers",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_Deleted",
                table: "AspNetUserRoles",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoles_Deleted",
                table: "AspNetRoles",
                column: "Deleted");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Settings_Deleted",
                table: "Settings");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_Deleted",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUserRoles_Deleted",
                table: "AspNetUserRoles");

            migrationBuilder.DropIndex(
                name: "IX_AspNetRoles_Deleted",
                table: "AspNetRoles");
        }
    }
}
