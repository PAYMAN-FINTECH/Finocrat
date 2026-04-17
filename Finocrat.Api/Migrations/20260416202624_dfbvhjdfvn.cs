using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Finocrat.Api.Migrations
{
    /// <inheritdoc />
    public partial class dfbvhjdfvn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "phone",
                table: "eduUsers",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "phone",
                table: "eduUsers");
        }
    }
}
