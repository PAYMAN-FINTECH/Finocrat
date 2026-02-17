using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finocrat.Api.Migrations
{
    /// <inheritdoc />
    public partial class addedFMargintable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "fUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsRazorpayEnabled",
                table: "fUsers",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "MarginId",
                table: "fUsers",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "fMargins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MarginName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Percentage = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_fMargins", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_fUsers_MarginId",
                table: "fUsers",
                column: "MarginId");

            migrationBuilder.AddForeignKey(
                name: "FK_fUsers_fMargins_MarginId",
                table: "fUsers",
                column: "MarginId",
                principalTable: "fMargins",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_fUsers_fMargins_MarginId",
                table: "fUsers");

            migrationBuilder.DropTable(
                name: "fMargins");

            migrationBuilder.DropIndex(
                name: "IX_fUsers_MarginId",
                table: "fUsers");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "fUsers");

            migrationBuilder.DropColumn(
                name: "IsRazorpayEnabled",
                table: "fUsers");

            migrationBuilder.DropColumn(
                name: "MarginId",
                table: "fUsers");
        }
    }
}
