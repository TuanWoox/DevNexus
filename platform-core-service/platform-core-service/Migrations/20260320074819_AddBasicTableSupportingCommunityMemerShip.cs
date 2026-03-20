using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddBasicTableSupportingCommunityMemerShip : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CommunityBans",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CommunityId = table.Column<string>(type: "text", nullable: false),
                    BannedProfileId = table.Column<string>(type: "text", nullable: false),
                    BannedById = table.Column<string>(type: "text", nullable: false),
                    BanReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityBans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityBans_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityBans_Profiles_BannedById",
                        column: x => x.BannedById,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityBans_Profiles_BannedProfileId",
                        column: x => x.BannedProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommunityMembers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CommunityId = table.Column<string>(type: "text", nullable: false),
                    ProfileId = table.Column<string>(type: "text", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityMembers_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityMembers_Profiles_ProfileId",
                        column: x => x.ProfileId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommunityMembershipRequests",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CommunityId = table.Column<string>(type: "text", nullable: false),
                    RequesterId = table.Column<string>(type: "text", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommunityMembershipRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommunityMembershipRequests_Communities_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Communities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CommunityMembershipRequests_Profiles_RequesterId",
                        column: x => x.RequesterId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CommunityBans_BannedById",
                table: "CommunityBans",
                column: "BannedById");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityBans_BannedProfileId",
                table: "CommunityBans",
                column: "BannedProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityBans_CommunityId_BannedProfileId",
                table: "CommunityBans",
                columns: new[] { "CommunityId", "BannedProfileId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityMembers_CommunityId_ProfileId",
                table: "CommunityMembers",
                columns: new[] { "CommunityId", "ProfileId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityMembers_ProfileId",
                table: "CommunityMembers",
                column: "ProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_CommunityMembershipRequests_CommunityId_RequesterId",
                table: "CommunityMembershipRequests",
                columns: new[] { "CommunityId", "RequesterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommunityMembershipRequests_RequesterId",
                table: "CommunityMembershipRequests",
                column: "RequesterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommunityBans");

            migrationBuilder.DropTable(
                name: "CommunityMembers");

            migrationBuilder.DropTable(
                name: "CommunityMembershipRequests");
        }
    }
}
