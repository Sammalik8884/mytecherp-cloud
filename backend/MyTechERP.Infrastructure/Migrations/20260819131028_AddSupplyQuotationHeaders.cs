using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplyQuotationHeaders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HeaderCompany",
                table: "SupplyQuotations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HeaderDesignation",
                table: "SupplyQuotations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HeaderLocation",
                table: "SupplyQuotations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "HeaderToName",
                table: "SupplyQuotations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeaderCompany",
                table: "SupplyQuotations");

            migrationBuilder.DropColumn(
                name: "HeaderDesignation",
                table: "SupplyQuotations");

            migrationBuilder.DropColumn(
                name: "HeaderLocation",
                table: "SupplyQuotations");

            migrationBuilder.DropColumn(
                name: "HeaderToName",
                table: "SupplyQuotations");
        }
    }
}
