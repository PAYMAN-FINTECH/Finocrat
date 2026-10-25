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
            // Check if table already exists before creating
            migrationBuilder.Sql(
                @"IF OBJECT_ID('BharatConnectBillers', 'U') IS NULL
                  BEGIN
                    CREATE TABLE [BharatConnectBillers] (
                        [Id] int NOT NULL IDENTITY,
                        [BlrId] nvarchar(max) NOT NULL,
                        [BlrName] nvarchar(max) NOT NULL,
                        [BlrAliasName] nvarchar(max) NOT NULL,
                        [BlrCategoryName] nvarchar(max) NOT NULL,
                        [BlrCoverage] nvarchar(max) NOT NULL,
                        [CreatedAt] datetime2 NOT NULL,
                        [IsActive] bit NOT NULL,
                        CONSTRAINT [PK_BharatConnectBillers] PRIMARY KEY ([Id])
                    )
                  END");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BharatConnectBillers");
        }
    }
}
