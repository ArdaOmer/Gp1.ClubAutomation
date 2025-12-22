using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gp1.ClubAutomation.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserClubRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_UserClubs_ClubId",
                schema: "club",
                table: "UserClubs",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_UserClubs_UserId",
                schema: "club",
                table: "UserClubs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserClubs_Clubs_ClubId",
                schema: "club",
                table: "UserClubs",
                column: "ClubId",
                principalSchema: "club",
                principalTable: "Clubs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_UserClubs_Users_UserId",
                schema: "club",
                table: "UserClubs",
                column: "UserId",
                principalSchema: "auth",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserClubs_Clubs_ClubId",
                schema: "club",
                table: "UserClubs");

            migrationBuilder.DropForeignKey(
                name: "FK_UserClubs_Users_UserId",
                schema: "club",
                table: "UserClubs");

            migrationBuilder.DropIndex(
                name: "IX_UserClubs_ClubId",
                schema: "club",
                table: "UserClubs");

            migrationBuilder.DropIndex(
                name: "IX_UserClubs_UserId",
                schema: "club",
                table: "UserClubs");
        }
    }
}
