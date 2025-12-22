using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Gp1.ClubAutomation.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUserClub_UseMembership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserClubs",
                schema: "club");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_UserId_ClubId",
                schema: "club",
                table: "Memberships",
                columns: new[] { "UserId", "ClubId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Memberships_Users_UserId",
                schema: "club",
                table: "Memberships",
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
                name: "FK_Memberships_Users_UserId",
                schema: "club",
                table: "Memberships");

            migrationBuilder.DropIndex(
                name: "IX_Memberships_UserId_ClubId",
                schema: "club",
                table: "Memberships");

            migrationBuilder.CreateTable(
                name: "UserClubs",
                schema: "club",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedBy = table.Column<int>(type: "integer", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    JoinedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserClubs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserClubs_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalSchema: "club",
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserClubs_Users_UserId",
                        column: x => x.UserId,
                        principalSchema: "auth",
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
        }
    }
}
