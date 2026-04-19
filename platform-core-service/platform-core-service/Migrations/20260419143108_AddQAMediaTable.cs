using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddQAMediaTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QAMedias",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    QAPostId = table.Column<string>(type: "text", nullable: true),
                    QAMediaType = table.Column<int>(type: "integer", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    StoreDestination = table.Column<string>(type: "text", nullable: false),
                    SHA256Hash = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QAMedias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QAMedias_Posts_QAPostId",
                        column: x => x.QAPostId,
                        principalTable: "Posts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_QAMedias_Deleted",
                table: "QAMedias",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_QAMedias_QAPostId",
                table: "QAMedias",
                column: "QAPostId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QAMedias");
        }
    }
}
