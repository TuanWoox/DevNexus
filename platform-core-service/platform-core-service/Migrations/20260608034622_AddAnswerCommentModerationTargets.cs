using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class AddAnswerCommentModerationTargets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ModerationQueueEntries_Posts_PostId",
                table: "ModerationQueueEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_PostModerationResults_Posts_PostId",
                table: "PostModerationResults");

            migrationBuilder.DropIndex(
                name: "IX_PostModerationResults_PostId",
                table: "PostModerationResults");

            migrationBuilder.DropIndex(
                name: "IX_ModerationQueueEntries_PostId",
                table: "ModerationQueueEntries");

            migrationBuilder.RenameColumn(
                name: "PostId",
                table: "PostModerationResults",
                newName: "TargetId");

            migrationBuilder.RenameColumn(
                name: "PostId",
                table: "ModerationQueueEntries",
                newName: "TargetId");

            migrationBuilder.AddColumn<int>(
                name: "TargetType",
                table: "PostModerationResults",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TargetType",
                table: "ModerationQueueEntries",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ModerationContentHash",
                table: "Comments",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationReason",
                table: "Comments",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ModerationStatus",
                table: "Comments",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "ModerationVersion",
                table: "Comments",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "ModerationContentHash",
                table: "Answers",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ModerationReason",
                table: "Answers",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ModerationStatus",
                table: "Answers",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "ModerationVersion",
                table: "Answers",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TargetType",
                table: "PostModerationResults");

            migrationBuilder.DropColumn(
                name: "TargetType",
                table: "ModerationQueueEntries");

            migrationBuilder.DropColumn(
                name: "ModerationContentHash",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "ModerationReason",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "ModerationVersion",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "ModerationContentHash",
                table: "Answers");

            migrationBuilder.DropColumn(
                name: "ModerationReason",
                table: "Answers");

            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "Answers");

            migrationBuilder.DropColumn(
                name: "ModerationVersion",
                table: "Answers");

            migrationBuilder.RenameColumn(
                name: "TargetId",
                table: "PostModerationResults",
                newName: "PostId");

            migrationBuilder.RenameColumn(
                name: "TargetId",
                table: "ModerationQueueEntries",
                newName: "PostId");

            migrationBuilder.CreateIndex(
                name: "IX_PostModerationResults_PostId",
                table: "PostModerationResults",
                column: "PostId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ModerationQueueEntries_PostId",
                table: "ModerationQueueEntries",
                column: "PostId");

            migrationBuilder.AddForeignKey(
                name: "FK_ModerationQueueEntries_Posts_PostId",
                table: "ModerationQueueEntries",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PostModerationResults_Posts_PostId",
                table: "PostModerationResults",
                column: "PostId",
                principalTable: "Posts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
