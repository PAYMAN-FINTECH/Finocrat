using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finocrat.Api.Migrations
{
    /// <inheritdoc />
    public partial class asssdedecolumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "OtpExpiry",
                table: "fUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResetOtp",
                table: "fUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OtpExpiry",
                table: "fUsers");

            migrationBuilder.DropColumn(
                name: "ResetOtp",
                table: "fUsers");
        }
    }
}
