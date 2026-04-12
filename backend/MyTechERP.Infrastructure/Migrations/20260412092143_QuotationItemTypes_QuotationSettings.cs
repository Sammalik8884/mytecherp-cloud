using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class QuotationItemTypes_QuotationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CalculationBreakdown",
                table: "QuotationsItem",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ItemType",
                table: "QuotationsItem",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "OriginalPrice",
                table: "QuotationsItem",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ServiceName",
                table: "QuotationsItem",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QuoteMode",
                table: "Quotations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SupplyColumnMode",
                table: "Quotations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "QuotationSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DefaultExchangeRate = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    CostFactorPct = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ImportationPct = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    TransportationPct = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    ProfitPct = table.Column<decimal>(type: "decimal(18,4)", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuotationSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuotationSettings");

            migrationBuilder.DropColumn(
                name: "CalculationBreakdown",
                table: "QuotationsItem");

            migrationBuilder.DropColumn(
                name: "ItemType",
                table: "QuotationsItem");

            migrationBuilder.DropColumn(
                name: "OriginalPrice",
                table: "QuotationsItem");

            migrationBuilder.DropColumn(
                name: "ServiceName",
                table: "QuotationsItem");

            migrationBuilder.DropColumn(
                name: "QuoteMode",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "SupplyColumnMode",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Products");
        }
    }
}
