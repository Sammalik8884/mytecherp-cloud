using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExpenseReviewAndVehicleStatusFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId",
                table: "ProcurementQuoteItems");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedByMunawarAt",
                table: "VehicleTravelForms",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedByShahbazAt",
                table: "VehicleTravelForms",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "VehicleTravelForms",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsAcceptedBySupervisor",
                table: "ProcurementRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "SupervisorAcceptanceDate",
                table: "ProcurementRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SupervisorAcceptanceRemarks",
                table: "ProcurementRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "Expenses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewedByEmail",
                table: "Expenses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReviewerComments",
                table: "Expenses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Expenses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AttachmentsJson",
                table: "EmployeeInfos",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "EmployeeInfos",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ProcurementVendors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    VendorName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    CityName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ContactPerson = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ContactNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    BankAccountName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    BankName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AccountNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcurementVendors", x => x.Id);
                });

            migrationBuilder.AddForeignKey(
                name: "FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId",
                table: "ProcurementQuoteItems",
                column: "ProcurementRequestItemId",
                principalTable: "ProcurementRequestItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId",
                table: "ProcurementQuoteItems");

            migrationBuilder.DropTable(
                name: "ProcurementVendors");

            migrationBuilder.DropColumn(
                name: "ApprovedByMunawarAt",
                table: "VehicleTravelForms");

            migrationBuilder.DropColumn(
                name: "ApprovedByShahbazAt",
                table: "VehicleTravelForms");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "VehicleTravelForms");

            migrationBuilder.DropColumn(
                name: "IsAcceptedBySupervisor",
                table: "ProcurementRequests");

            migrationBuilder.DropColumn(
                name: "SupervisorAcceptanceDate",
                table: "ProcurementRequests");

            migrationBuilder.DropColumn(
                name: "SupervisorAcceptanceRemarks",
                table: "ProcurementRequests");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "ReviewedByEmail",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "ReviewerComments",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "AttachmentsJson",
                table: "EmployeeInfos");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "EmployeeInfos");

            migrationBuilder.AddForeignKey(
                name: "FK_ProcurementQuoteItems_ProcurementRequestItems_ProcurementRequestItemId",
                table: "ProcurementQuoteItems",
                column: "ProcurementRequestItemId",
                principalTable: "ProcurementRequestItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
