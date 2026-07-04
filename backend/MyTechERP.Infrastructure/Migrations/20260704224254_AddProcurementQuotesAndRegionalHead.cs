using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProcurementQuotesAndRegionalHead : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RegionalHeadApprovalDate",
                table: "ProcurementRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegionalHeadEmail",
                table: "ProcurementRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegionalHeadRemarks",
                table: "ProcurementRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ProcurementQuotes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProcurementRequestId = table.Column<int>(type: "int", nullable: false),
                    VendorName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CityName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ContactPerson = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ContactNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BankAccountName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AccountNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    IsSelected = table.Column<bool>(type: "bit", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcurementQuotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcurementQuotes_ProcurementRequests_ProcurementRequestId",
                        column: x => x.ProcurementRequestId,
                        principalTable: "ProcurementRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProcurementQuoteItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuoteId = table.Column<int>(type: "int", nullable: false),
                    ProcurementRequestItemId = table.Column<int>(type: "int", nullable: false),
                    UnitRate = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    LineTotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcurementQuoteItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcurementQuoteItems_ProcurementQuotes_QuoteId",
                        column: x => x.QuoteId,
                        principalTable: "ProcurementQuotes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId",
                        column: x => x.ProcurementRequestItemId,
                        principalTable: "ProcurementRequestItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProcurementQuoteItems_ProcurementRequestItemId",
                table: "ProcurementQuoteItems",
                column: "ProcurementRequestItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcurementQuoteItems_QuoteId",
                table: "ProcurementQuoteItems",
                column: "QuoteId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcurementQuotes_ProcurementRequestId",
                table: "ProcurementQuotes",
                column: "ProcurementRequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcurementQuoteItems");

            migrationBuilder.DropTable(
                name: "ProcurementQuotes");

            migrationBuilder.DropColumn(
                name: "RegionalHeadApprovalDate",
                table: "ProcurementRequests");

            migrationBuilder.DropColumn(
                name: "RegionalHeadEmail",
                table: "ProcurementRequests");

            migrationBuilder.DropColumn(
                name: "RegionalHeadRemarks",
                table: "ProcurementRequests");
        }
    }
}
