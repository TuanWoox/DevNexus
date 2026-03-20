using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddBasicCommunityModeratorTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunityModerators",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    ModeratorId = table.Column<string>(type: "text", nullable: false),
                    CommunityId = table.Column<string>(type: "text", nullable: false),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityModerators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityModerators_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityModerators_Profiles_ModeratorId",
                        column: x => x.ModeratorId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityModerators_CommunityId",
                table: "CommunityModerators",
                column: "CommunityId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityModerators_ModeratorId_CommunityId",
                table: "CommunityModerators",
                columns: new[] { "ModeratorId", "CommunityId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityModerators");
        }
    }
}
