using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finocrat.Api.Migrations
{
    /// <inheritdoc />
    public partial class addedcolumnsinpayin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PatentTypeId",
                table: "fPayIns",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserTypeId",
                table: "fPayIns",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UserTypeId",
                table: "fPassbookHistories",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_fUsers_UserTypeId",
                table: "fUsers",
                column: "UserTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_fUsers_fUserTypes_UserTypeId",
                table: "fUsers",
                column: "UserTypeId",
                principalTable: "fUserTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_fUsers_fUserTypes_UserTypeId",
                table: "fUsers");

            migrationBuilder.DropIndex(
                name: "IX_fUsers_UserTypeId",
                table: "fUsers");

            migrationBuilder.DropColumn(
                name: "PatentTypeId",
                table: "fPayIns");

            migrationBuilder.DropColumn(
                name: "UserTypeId",
                table: "fPayIns");

            migrationBuilder.DropColumn(
                name: "UserTypeId",
                table: "fPassbookHistories");
        }
    }
}
