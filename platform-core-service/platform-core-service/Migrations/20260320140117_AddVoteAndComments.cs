using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddVoteAndComments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comment_Answers_AnswerId",
                table: "Comment");

            migrationBuilder.DropForeignKey(
                name: "FK_Comment_Comment_ReplyToCommentId",
                table: "Comment");

            migrationBuilder.DropForeignKey(
                name: "FK_Comment_Posts_PostId",
                table: "Comment");

            migrationBuilder.DropForeignKey(
                name: "FK_Comment_Profiles_AuthorId",
                table: "Comment");

            migrationBuilder.DropForeignKey(
                name: "FK_Vote_Answers_AnswerId",
                table: "Vote");

            migrationBuilder.DropForeignKey(
                name: "FK_Vote_Comment_CommentId",
                table: "Vote");

            migrationBuilder.DropForeignKey(
                name: "FK_Vote_Posts_PostId",
                table: "Vote");

            migrationBuilder.DropForeignKey(
                name: "FK_Vote_Profiles_AuthorId",
                table: "Vote");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Vote",
                table: "Vote");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Comment",
                table: "Comment");

            migrationBuilder.RenameTable(
                name: "Vote",
                newName: "Votes");

            migrationBuilder.RenameTable(
                name: "Comment",
                newName: "Comments");

            migrationBuilder.RenameIndex(
                name: "IX_Vote_PostId",
                table: "Votes",
                newName: "IX_Votes_PostId");

            migrationBuilder.RenameIndex(
                name: "IX_Vote_CommentId",
                table: "Votes",
                newName: "IX_Votes_CommentId");

            migrationBuilder.RenameIndex(
                name: "IX_Vote_AuthorId_PostId",
                table: "Votes",
                newName: "IX_Votes_AuthorId_PostId");

            migrationBuilder.RenameIndex(
                name: "IX_Vote_AuthorId_CommentId",
                table: "Votes",
                newName: "IX_Votes_AuthorId_CommentId");

            migrationBuilder.RenameIndex(
                name: "IX_Vote_AuthorId_AnswerId",
                table: "Votes",
                newName: "IX_Votes_AuthorId_AnswerId");

            migrationBuilder.RenameIndex(
                name: "IX_Vote_AnswerId",
                table: "Votes",
                newName: "IX_Votes_AnswerId");

            migrationBuilder.RenameIndex(
                name: "IX_Comment_ReplyToCommentId",
                table: "Comments",
                newName: "IX_Comments_ReplyToCommentId");

            migrationBuilder.RenameIndex(
                name: "IX_Comment_PostId",
                table: "Comments",
                newName: "IX_Comments_PostId");

            migrationBuilder.RenameIndex(
                name: "IX_Comment_AuthorId",
                table: "Comments",
                newName: "IX_Comments_AuthorId");

            migrationBuilder.RenameIndex(
                name: "IX_Comment_AnswerId",
                table: "Comments",
                newName: "IX_Comments_AnswerId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Votes",
                table: "Votes",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Comments",
                table: "Comments",
                column: "Id");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_Deleted",
                table: "Comments",
                column: "Deleted");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Answers_AnswerId",
                table: "Comments",
                column: "AnswerId",
                principalTable: "Answers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Comments_ReplyToCommentId",
                table: "Comments",
                column: "ReplyToCommentId",
                principalTable: "Comments",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Posts_PostId",
                table: "Comments",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Profiles_AuthorId",
                table: "Comments",
                column: "AuthorId",
                principalTable: "Profiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Votes_Answers_AnswerId",
                table: "Votes",
                column: "AnswerId",
                principalTable: "Answers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Votes_Comments_CommentId",
                table: "Votes",
                column: "CommentId",
                principalTable: "Comments",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Votes_Posts_PostId",
                table: "Votes",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Votes_Profiles_AuthorId",
                table: "Votes",
                column: "AuthorId",
                principalTable: "Profiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Answers_AnswerId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Comments_ReplyToCommentId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Posts_PostId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Profiles_AuthorId",
                table: "Comments");

            migrationBuilder.DropForeignKey(
                name: "FK_Votes_Answers_AnswerId",
                table: "Votes");

            migrationBuilder.DropForeignKey(
                name: "FK_Votes_Comments_CommentId",
                table: "Votes");

            migrationBuilder.DropForeignKey(
                name: "FK_Votes_Posts_PostId",
                table: "Votes");

            migrationBuilder.DropForeignKey(
                name: "FK_Votes_Profiles_AuthorId",
                table: "Votes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Votes",
                table: "Votes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Comments",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_Deleted",
                table: "Comments");

            migrationBuilder.RenameTable(
                name: "Votes",
                newName: "Vote");

            migrationBuilder.RenameTable(
                name: "Comments",
                newName: "Comment");

            migrationBuilder.RenameIndex(
                name: "IX_Votes_PostId",
                table: "Vote",
                newName: "IX_Vote_PostId");

            migrationBuilder.RenameIndex(
                name: "IX_Votes_CommentId",
                table: "Vote",
                newName: "IX_Vote_CommentId");

            migrationBuilder.RenameIndex(
                name: "IX_Votes_AuthorId_PostId",
                table: "Vote",
                newName: "IX_Vote_AuthorId_PostId");

            migrationBuilder.RenameIndex(
                name: "IX_Votes_AuthorId_CommentId",
                table: "Vote",
                newName: "IX_Vote_AuthorId_CommentId");

            migrationBuilder.RenameIndex(
                name: "IX_Votes_AuthorId_AnswerId",
                table: "Vote",
                newName: "IX_Vote_AuthorId_AnswerId");

            migrationBuilder.RenameIndex(
                name: "IX_Votes_AnswerId",
                table: "Vote",
                newName: "IX_Vote_AnswerId");

            migrationBuilder.RenameIndex(
                name: "IX_Comments_ReplyToCommentId",
                table: "Comment",
                newName: "IX_Comment_ReplyToCommentId");

            migrationBuilder.RenameIndex(
                name: "IX_Comments_PostId",
                table: "Comment",
                newName: "IX_Comment_PostId");

            migrationBuilder.RenameIndex(
                name: "IX_Comments_AuthorId",
                table: "Comment",
                newName: "IX_Comment_AuthorId");

            migrationBuilder.RenameIndex(
                name: "IX_Comments_AnswerId",
                table: "Comment",
                newName: "IX_Comment_AnswerId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Vote",
                table: "Vote",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Comment",
                table: "Comment",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Comment_Answers_AnswerId",
                table: "Comment",
                column: "AnswerId",
                principalTable: "Answers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Comment_Comment_ReplyToCommentId",
                table: "Comment",
                column: "ReplyToCommentId",
                principalTable: "Comment",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Comment_Posts_PostId",
                table: "Comment",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Comment_Profiles_AuthorId",
                table: "Comment",
                column: "AuthorId",
                principalTable: "Profiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Vote_Answers_AnswerId",
                table: "Vote",
                column: "AnswerId",
                principalTable: "Answers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Vote_Comment_CommentId",
                table: "Vote",
                column: "CommentId",
                principalTable: "Comment",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Vote_Posts_PostId",
                table: "Vote",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Vote_Profiles_AuthorId",
                table: "Vote",
                column: "AuthorId",
                principalTable: "Profiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
