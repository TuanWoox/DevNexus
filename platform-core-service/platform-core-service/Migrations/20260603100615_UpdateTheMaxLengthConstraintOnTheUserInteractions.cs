using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTheMaxLengthConstraintOnTheUserInteractions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "QAPostId",
                table: "UserRecommendationFeedbacks",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(26)",
                oldMaxLength: 26,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ProfileId",
                table: "UserRecommendationFeedbacks",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(26)",
                oldMaxLength: 26);

            migrationBuilder.AlterColumn<string>(
                name: "PostId",
                table: "UserRecommendationFeedbacks",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(26)",
                oldMaxLength: 26,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CommunityId",
                table: "UserRecommendationFeedbacks",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(26)",
                oldMaxLength: 26,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "QAPostId",
                table: "UserContentInteractions",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(26)",
                oldMaxLength: 26,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ProfileId",
                table: "UserContentInteractions",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(26)",
                oldMaxLength: 26);

            migrationBuilder.AlterColumn<string>(
                name: "PostId",
                table: "UserContentInteractions",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(26)",
                oldMaxLength: 26,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "QAPostId",
                table: "UserRecommendationFeedbacks",
                type: "character varying(26)",
                maxLength: 26,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ProfileId",
                table: "UserRecommendationFeedbacks",
                type: "character varying(26)",
                maxLength: 26,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "PostId",
                table: "UserRecommendationFeedbacks",
                type: "character varying(26)",
                maxLength: 26,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "CommunityId",
                table: "UserRecommendationFeedbacks",
                type: "character varying(26)",
                maxLength: 26,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "QAPostId",
                table: "UserContentInteractions",
                type: "character varying(26)",
                maxLength: 26,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "ProfileId",
                table: "UserContentInteractions",
                type: "character varying(26)",
                maxLength: 26,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "PostId",
                table: "UserContentInteractions",
                type: "character varying(26)",
                maxLength: 26,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
