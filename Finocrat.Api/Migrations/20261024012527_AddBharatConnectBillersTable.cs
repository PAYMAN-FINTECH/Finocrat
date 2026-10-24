using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finocrat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBharatConnectBillersTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BharatConnectBillers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BlrId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BlrName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BlrAliasName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BlrCategoryName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BlrCoverage = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BharatConnectBillers", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BharatConnectBillers");
        }
    }
}
