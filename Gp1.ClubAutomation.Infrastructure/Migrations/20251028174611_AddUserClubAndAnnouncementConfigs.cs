using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gp1.ClubAutomation.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserClubAndAnnouncementConfigs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Role",
                schema: "club",
                table: "UserClubs",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                schema: "club",
                table: "UserClubs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                schema: "club",
                table: "UserClubs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                schema: "club",
                table: "UserClubs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                schema: "club",
                table: "UserClubs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                schema: "club",
                table: "UserClubs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDate",
                schema: "club",
                table: "UserClubs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                schema: "club",
                table: "Announcements",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                schema: "club",
                table: "Announcements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                schema: "club",
                table: "Announcements",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                schema: "club",
                table: "Announcements",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                schema: "club",
                table: "Announcements",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                schema: "club",
                table: "Announcements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDate",
                schema: "club",
                table: "Announcements",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                schema: "club",
                table: "UserClubs");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                schema: "club",
                table: "UserClubs");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                schema: "club",
                table: "UserClubs");

            migrationBuilder.DropColumn(
                name: "IsActive",
                schema: "club",
                table: "UserClubs");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                schema: "club",
                table: "UserClubs");

            migrationBuilder.DropColumn(
                name: "UpdatedDate",
                schema: "club",
                table: "UserClubs");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                schema: "club",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                schema: "club",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                schema: "club",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                schema: "club",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                schema: "club",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "UpdatedDate",
                schema: "club",
                table: "Announcements");

            migrationBuilder.AlterColumn<string>(
                name: "Role",
                schema: "club",
                table: "UserClubs",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                schema: "club",
                table: "Announcements",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200);
        }
    }
}
