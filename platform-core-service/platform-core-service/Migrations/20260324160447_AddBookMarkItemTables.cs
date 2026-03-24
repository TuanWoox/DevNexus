using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddBookMarkItemTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookMarkedItems",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    BookMarkId = table.Column<string>(type: "text", nullable: false),
                    PostId = table.Column<string>(type: "text", nullable: true),
                    QAPostId = table.Column<string>(type: "text", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookMarkedItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookMarkedItems_BookMarks_BookMarkId",
                        column: x => x.BookMarkId,
                        principalTable: "BookMarks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookMarkedItems_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_BookMarkedItems_Posts_QAPostId",
                        column: x => x.QAPostId,
                        principalTable: "Posts",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookMarkedItem_BookMark_Post",
                table: "BookMarkedItems",
                columns: new[] { "BookMarkId", "PostId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookMarkedItem_BookMark_QAPost",
                table: "BookMarkedItems",
                columns: new[] { "BookMarkId", "QAPostId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookMarkedItems_PostId",
                table: "BookMarkedItems",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_BookMarkedItems_QAPostId",
                table: "BookMarkedItems",
                column: "QAPostId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookMarkedItems");
        }
    }
}
