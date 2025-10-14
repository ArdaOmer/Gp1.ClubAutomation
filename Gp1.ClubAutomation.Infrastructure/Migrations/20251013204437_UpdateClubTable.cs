using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gp1.ClubAutomation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateClubTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                name: "Faculty",
                schema: "club",
                table: "Clubs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                schema: "club",
                table: "Clubs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedDate",
                schema: "club",
                table: "Clubs",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedDate",
                schema: "club",
                table: "Clubs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                schema: "club",
                table: "Clubs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedBy",
                schema: "club",
                table: "Clubs",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedDate",
                schema: "club",
                table: "Clubs",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                schema: "club",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "CreatedDate",
                schema: "club",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "DeletedDate",
                schema: "club",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                schema: "club",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "UpdatedBy",
                schema: "club",
                table: "Clubs");

            migrationBuilder.DropColumn(
                name: "UpdatedDate",
                schema: "club",
                table: "Clubs");

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
                name: "Faculty",
                schema: "club",
                table: "Clubs",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);
        }
    }
}
