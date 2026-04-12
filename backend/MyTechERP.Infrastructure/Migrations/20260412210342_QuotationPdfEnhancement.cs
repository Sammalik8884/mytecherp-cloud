using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class QuotationPdfEnhancement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProjectCode",
                table: "Quotations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "QuoteHeadline",
                table: "Quotations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RevisionNumber",
                table: "Quotations",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProjectCode",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "QuoteHeadline",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "RevisionNumber",
                table: "Quotations");
        }
    }
}
