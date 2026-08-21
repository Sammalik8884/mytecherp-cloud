using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTaxAndApprovalFieldsToSupplyQuotation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TaxPercentage",
                table: "SupplyQuotations",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TaxAmount",
                table: "SupplyQuotations",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "NetTotal",
                table: "SupplyQuotations",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "GrandTotal",
                table: "SupplyQuotations",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ApprovedBy",
                table: "SupplyQuotations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IssuedBy",
                table: "SupplyQuotations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "TaxPercentage", table: "SupplyQuotations");
            migrationBuilder.DropColumn(name: "TaxAmount", table: "SupplyQuotations");
            migrationBuilder.DropColumn(name: "NetTotal", table: "SupplyQuotations");
            migrationBuilder.DropColumn(name: "GrandTotal", table: "SupplyQuotations");
            migrationBuilder.DropColumn(name: "ApprovedBy", table: "SupplyQuotations");
            migrationBuilder.DropColumn(name: "IssuedBy", table: "SupplyQuotations");
        }
    }
}
