using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAmountRequestForm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AmountRequestForms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    EmployeeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AdvanceRequested = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AccountDetail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateOfFundRequired = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SiteId = table.Column<int>(type: "int", nullable: true),
                    CustomSiteName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClientName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PurposeOfAdvance = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DirectorName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DirectorApprovalDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DirectorComment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CeoName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CeoApprovalDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CeoComment = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccountsDateOfEntry = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AccountsDateOfFundReleased = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AccountsReleasedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AccountsRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AmountRequestForms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AmountRequestForms_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "AmountRequestPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AmountRequestFormId = table.Column<int>(type: "int", nullable: false),
                    ReleasedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReleasedAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ReceivedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModeOfPayment = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AmountRequestPayments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AmountRequestPayments_AmountRequestForms_AmountRequestFormId",
                        column: x => x.AmountRequestFormId,
                        principalTable: "AmountRequestForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AmountRequestForms_SiteId",
                table: "AmountRequestForms",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_AmountRequestPayments_AmountRequestFormId",
                table: "AmountRequestPayments",
                column: "AmountRequestFormId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AmountRequestPayments");

            migrationBuilder.DropTable(
                name: "AmountRequestForms");
        }
    }
}
