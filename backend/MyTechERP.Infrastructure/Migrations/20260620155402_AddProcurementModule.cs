using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProcurementModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProcurementRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProcurementNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SupervisorName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SupervisorEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SiteId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PdEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PdRemarks = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PdApprovalDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ProcurementHeadEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AmountRequestFormId = table.Column<int>(type: "int", nullable: true),
                    AssignedExecutiveEmail = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssignedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DeliveryNoteText = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeliveryNoteDocumentsJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcurementRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcurementRequests_AmountRequestForms_AmountRequestFormId",
                        column: x => x.AmountRequestFormId,
                        principalTable: "AmountRequestForms",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProcurementRequests_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProcurementRequestItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProcurementRequestId = table.Column<int>(type: "int", nullable: false),
                    ItemName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcurementRequestItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProcurementRequestItems_ProcurementRequests_ProcurementRequestId",
                        column: x => x.ProcurementRequestId,
                        principalTable: "ProcurementRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProcurementRequestItems_ProcurementRequestId",
                table: "ProcurementRequestItems",
                column: "ProcurementRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcurementRequests_AmountRequestFormId",
                table: "ProcurementRequests",
                column: "AmountRequestFormId");

            migrationBuilder.CreateIndex(
                name: "IX_ProcurementRequests_SiteId",
                table: "ProcurementRequests",
                column: "SiteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcurementRequestItems");

            migrationBuilder.DropTable(
                name: "ProcurementRequests");
        }
    }
}
