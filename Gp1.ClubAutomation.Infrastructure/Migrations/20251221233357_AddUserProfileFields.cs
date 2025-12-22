using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gp1.ClubAutomation.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AvatarDataUrl",
                schema: "auth",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Bio",
                schema: "auth",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "BirthDate",
                schema: "auth",
                table: "Users",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Department",
                schema: "auth",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Grade",
                schema: "auth",
                table: "Users",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                schema: "auth",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvatarDataUrl",
                schema: "auth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Bio",
                schema: "auth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BirthDate",
                schema: "auth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Department",
                schema: "auth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Grade",
                schema: "auth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Phone",
                schema: "auth",
                table: "Users");
        }
    }
}
