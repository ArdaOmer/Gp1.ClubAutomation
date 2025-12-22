using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Gp1.ClubAutomation.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class MembershipFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Faculty",
                schema: "club",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "Date",
                schema: "club",
                table: "Announcements");

            migrationBuilder.RenameColumn(
                name: "StartDate",
                schema: "club",
                table: "Events",
                newName: "StartAt");

            migrationBuilder.RenameColumn(
                name: "EndDate",
                schema: "club",
                table: "Events",
                newName: "EndAt");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                schema: "club",
                table: "Events",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<string>(
                name: "Location",
                schema: "club",
                table: "Events",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<bool>(
                name: "IsDeleted",
                schema: "club",
                table: "Events",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                schema: "club",
                table: "Events",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                schema: "club",
                table: "Events",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                schema: "club",
                table: "Events",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                schema: "club",
                table: "Clubs",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<bool>(
                name: "IsDeleted",
                schema: "club",
                table: "Clubs",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                schema: "club",
                table: "Clubs",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                schema: "club",
                table: "Clubs",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(500)",
                oldMaxLength: 500);

            migrationBuilder.AlterColumn<string>(
                name: "Content",
                schema: "club",
                table: "Announcements",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<bool>(
                name: "Pinned",
                schema: "club",
                table: "Announcements",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Memberships",
                schema: "club",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ClubId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedBy = table.Column<int>(type: "integer", nullable: true),
                    UpdatedBy = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    DeletedDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Memberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Memberships_Clubs_ClubId",
                        column: x => x.ClubId,
                        principalSchema: "club",
                        principalTable: "Clubs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Announcements_ClubId",
                schema: "club",
                table: "Announcements",
                column: "ClubId");

            migrationBuilder.CreateIndex(
                name: "IX_Memberships_ClubId",
                schema: "club",
                table: "Memberships",
                column: "ClubId");

            migrationBuilder.AddForeignKey(
                name: "FK_Announcements_Clubs_ClubId",
                schema: "club",
                table: "Announcements",
                column: "ClubId",
                principalSchema: "club",
                principalTable: "Clubs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Announcements_Clubs_ClubId",
                schema: "club",
                table: "Announcements");

            migrationBuilder.DropTable(
                name: "Memberships",
                schema: "club");

            migrationBuilder.DropIndex(
                name: "IX_Announcements_ClubId",
                schema: "club",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "IsPublished",
                schema: "club",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "Pinned",
                schema: "club",
                table: "Announcements");

            migrationBuilder.RenameColumn(
                name: "StartAt",
                schema: "club",
                table: "Events",
                newName: "StartDate");

            migrationBuilder.RenameColumn(
                name: "EndAt",
                schema: "club",
                table: "Events",
                newName: "EndDate");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                schema: "club",
                table: "Events",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Location",
                schema: "club",
                table: "Events",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsDeleted",
                schema: "club",
                table: "Events",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                schema: "club",
                table: "Events",
                type: "boolean",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                schema: "club",
                table: "Events",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                schema: "club",
                table: "Clubs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<bool>(
                name: "IsDeleted",
                schema: "club",
                table: "Clubs",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<bool>(
                name: "IsActive",
                schema: "club",
                table: "Clubs",
                type: "boolean",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                schema: "club",
                table: "Clubs",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Faculty",
                schema: "club",
                table: "Clubs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "Content",
                schema: "club",
                table: "Announcements",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "Date",
                schema: "club",
                table: "Announcements",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
