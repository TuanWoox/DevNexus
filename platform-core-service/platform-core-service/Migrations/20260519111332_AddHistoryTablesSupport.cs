using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddHistoryTablesSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AnswerHistories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AnswerId = table.Column<string>(type: "text", nullable: false),
                    ContentSnapshot = table.Column<string>(type: "jsonb", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnswerHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnswerHistories_Answers_AnswerId",
                        column: x => x.AnswerId,
                        principalTable: "Answers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommentHistories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    CommentId = table.Column<string>(type: "text", nullable: false),
                    ContentSnapshot = table.Column<string>(type: "jsonb", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommentHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommentHistories_Comments_CommentId",
                        column: x => x.CommentId,
                        principalTable: "Comments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PostHistories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    PostId = table.Column<string>(type: "text", nullable: false),
                    ContentSnapshot = table.Column<string>(type: "jsonb", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PostHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PostHistories_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QAPostHistories",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    QAPostId = table.Column<string>(type: "text", nullable: false),
                    ContentSnapshot = table.Column<string>(type: "jsonb", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QAPostHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QAPostHistories_Posts_QAPostId",
                        column: x => x.QAPostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnswerHistories_AnswerId_DateCreated",
                table: "AnswerHistories",
                columns: new[] { "AnswerId", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_AnswerHistories_Deleted",
                table: "AnswerHistories",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_CommentHistories_CommentId_DateCreated",
                table: "CommentHistories",
                columns: new[] { "CommentId", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_CommentHistories_Deleted",
                table: "CommentHistories",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_PostHistories_Deleted",
                table: "PostHistories",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_PostHistories_PostId_DateCreated",
                table: "PostHistories",
                columns: new[] { "PostId", "DateCreated" });

            migrationBuilder.CreateIndex(
                name: "IX_QAPostHistories_Deleted",
                table: "QAPostHistories",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_QAPostHistories_QAPostId_DateCreated",
                table: "QAPostHistories",
                columns: new[] { "QAPostId", "DateCreated" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnswerHistories");

            migrationBuilder.DropTable(
                name: "CommentHistories");

            migrationBuilder.DropTable(
                name: "PostHistories");

            migrationBuilder.DropTable(
                name: "QAPostHistories");
        }
    }
}
