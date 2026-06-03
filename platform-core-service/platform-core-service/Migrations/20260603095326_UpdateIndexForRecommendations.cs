using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace platform_core_service.Migrations
{
    /// <inheritdoc />
    public partial class UpdateIndexForRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserContentInteractions_AspNetUsers_UserId",
                table: "UserContentInteractions");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRecommendationFeedbacks_AspNetUsers_UserId",
                table: "UserRecommendationFeedbacks");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "UserRecommendationFeedbacks",
                newName: "ProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_UserRecommendationFeedbacks_UserId_QAPostId",
                table: "UserRecommendationFeedbacks",
                newName: "IX_UserRecommendationFeedbacks_ProfileId_QAPostId");

            migrationBuilder.RenameIndex(
                name: "IX_UserRecommendationFeedbacks_UserId_PostId",
                table: "UserRecommendationFeedbacks",
                newName: "IX_UserRecommendationFeedbacks_ProfileId_PostId");

            migrationBuilder.RenameIndex(
                name: "IX_UserRecommendationFeedbacks_UserId_CommunityId",
                table: "UserRecommendationFeedbacks",
                newName: "IX_UserRecommendationFeedbacks_ProfileId_CommunityId");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "UserContentInteractions",
                newName: "ProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_UserContentInteractions_UserId_QAPostId",
                table: "UserContentInteractions",
                newName: "IX_UserContentInteractions_ProfileId_QAPostId");

            migrationBuilder.RenameIndex(
                name: "IX_UserContentInteractions_UserId_PostId",
                table: "UserContentInteractions",
                newName: "IX_UserContentInteractions_ProfileId_PostId");

            migrationBuilder.RenameIndex(
                name: "IX_UserContentInteractions_UserId_DateCreated",
                table: "UserContentInteractions",
                newName: "IX_UserContentInteractions_ProfileId_DateCreated");

            migrationBuilder.AddForeignKey(
                name: "FK_UserContentInteractions_Profiles_ProfileId",
                table: "UserContentInteractions",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserRecommendationFeedbacks_Profiles_ProfileId",
                table: "UserRecommendationFeedbacks",
                column: "ProfileId",
                principalTable: "Profiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserContentInteractions_Profiles_ProfileId",
                table: "UserContentInteractions");

            migrationBuilder.DropForeignKey(
                name: "FK_UserRecommendationFeedbacks_Profiles_ProfileId",
                table: "UserRecommendationFeedbacks");

            migrationBuilder.RenameColumn(
                name: "ProfileId",
                table: "UserRecommendationFeedbacks",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_UserRecommendationFeedbacks_ProfileId_QAPostId",
                table: "UserRecommendationFeedbacks",
                newName: "IX_UserRecommendationFeedbacks_UserId_QAPostId");

            migrationBuilder.RenameIndex(
                name: "IX_UserRecommendationFeedbacks_ProfileId_PostId",
                table: "UserRecommendationFeedbacks",
                newName: "IX_UserRecommendationFeedbacks_UserId_PostId");

            migrationBuilder.RenameIndex(
                name: "IX_UserRecommendationFeedbacks_ProfileId_CommunityId",
                table: "UserRecommendationFeedbacks",
                newName: "IX_UserRecommendationFeedbacks_UserId_CommunityId");

            migrationBuilder.RenameColumn(
                name: "ProfileId",
                table: "UserContentInteractions",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_UserContentInteractions_ProfileId_QAPostId",
                table: "UserContentInteractions",
                newName: "IX_UserContentInteractions_UserId_QAPostId");

            migrationBuilder.RenameIndex(
                name: "IX_UserContentInteractions_ProfileId_PostId",
                table: "UserContentInteractions",
                newName: "IX_UserContentInteractions_UserId_PostId");

            migrationBuilder.RenameIndex(
                name: "IX_UserContentInteractions_ProfileId_DateCreated",
                table: "UserContentInteractions",
                newName: "IX_UserContentInteractions_UserId_DateCreated");

            migrationBuilder.AddForeignKey(
                name: "FK_UserContentInteractions_AspNetUsers_UserId",
                table: "UserContentInteractions",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserRecommendationFeedbacks_AspNetUsers_UserId",
                table: "UserRecommendationFeedbacks",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
