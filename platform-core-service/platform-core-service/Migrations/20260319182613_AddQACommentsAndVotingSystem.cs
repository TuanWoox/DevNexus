using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddQACommentsAndVotingSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Discriminator",
                table: "Posts",
                type: "character varying(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "DownvoteCount",
                table: "Posts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UpvoteCount",
                table: "Posts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Answers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "character varying(50000)", maxLength: 50000, nullable: false),
                    IsAccepted = table.Column<bool>(type: "boolean", nullable: false),
                    UpvoteCount = table.Column<int>(type: "integer", nullable: false),
                    DownvoteCount = table.Column<int>(type: "integer", nullable: false),
                    QAPostId = table.Column<string>(type: "text", nullable: false),
                    AuthorId = table.Column<string>(type: "text", nullable: false),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Answers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Answers_Posts_QAPostId",
                        column: x => x.QAPostId,
                        principalTable: "Posts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Answers_Profiles_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Comment",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    Content = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: false),
                    AuthorId = table.Column<string>(type: "text", nullable: false),
                    UpvoteCount = table.Column<int>(type: "integer", nullable: false),
                    DownvoteCount = table.Column<int>(type: "integer", nullable: false),
                    PostId = table.Column<string>(type: "text", nullable: true),
                    AnswerId = table.Column<string>(type: "text", nullable: true),
                    ReplyToCommentId = table.Column<string>(type: "text", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    DateModified = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Deleted = table.Column<bool>(type: "boolean", nullable: false),
                    DateDeleted = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comment_Answers_AnswerId",
                        column: x => x.AnswerId,
                        principalTable: "Answers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Comment_Comment_ReplyToCommentId",
                        column: x => x.ReplyToCommentId,
                        principalTable: "Comment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Comment_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Comment_Profiles_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Vote",
                columns: table => new
                {
                    Id = table.Column<string>(type: "text", nullable: false),
                    AuthorId = table.Column<string>(type: "text", nullable: false),
                    IsUpvote = table.Column<bool>(type: "boolean", nullable: false),
                    PostId = table.Column<string>(type: "text", nullable: true),
                    AnswerId = table.Column<string>(type: "text", nullable: true),
                    CommentId = table.Column<string>(type: "text", nullable: true),
                    DateCreated = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Vote", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Vote_Answers_AnswerId",
                        column: x => x.AnswerId,
                        principalTable: "Answers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Vote_Comment_CommentId",
                        column: x => x.CommentId,
                        principalTable: "Comment",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Vote_Posts_PostId",
                        column: x => x.PostId,
                        principalTable: "Posts",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Vote_Profiles_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "Profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Answers_AuthorId",
                table: "Answers",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Answers_Deleted",
                table: "Answers",
                column: "Deleted");

            migrationBuilder.CreateIndex(
                name: "IX_Answers_QAPostId",
                table: "Answers",
                column: "QAPostId");

            migrationBuilder.CreateIndex(
                name: "IX_Comment_AnswerId",
                table: "Comment",
                column: "AnswerId");

            migrationBuilder.CreateIndex(
                name: "IX_Comment_AuthorId",
                table: "Comment",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Comment_PostId",
                table: "Comment",
                column: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_Comment_ReplyToCommentId",
                table: "Comment",
                column: "ReplyToCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_Vote_AnswerId",
                table: "Vote",
                column: "AnswerId");

            migrationBuilder.CreateIndex(
                name: "IX_Vote_AuthorId_AnswerId",
                table: "Vote",
                columns: new[] { "AuthorId", "AnswerId" },
                unique: true,
                filter: "\"AnswerId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Vote_AuthorId_CommentId",
                table: "Vote",
                columns: new[] { "AuthorId", "CommentId" },
                unique: true,
                filter: "\"CommentId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Vote_AuthorId_PostId",
                table: "Vote",
                columns: new[] { "AuthorId", "PostId" },
                unique: true,
                filter: "\"PostId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Vote_CommentId",
                table: "Vote",
                column: "CommentId");

            migrationBuilder.CreateIndex(
                name: "IX_Vote_PostId",
                table: "Vote",
                column: "PostId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Vote");

            migrationBuilder.DropTable(
                name: "Comment");

            migrationBuilder.DropTable(
                name: "Answers");

            migrationBuilder.DropColumn(
                name: "Discriminator",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "DownvoteCount",
                table: "Posts");

            migrationBuilder.DropColumn(
                name: "UpvoteCount",
                table: "Posts");
        }
    }
}
