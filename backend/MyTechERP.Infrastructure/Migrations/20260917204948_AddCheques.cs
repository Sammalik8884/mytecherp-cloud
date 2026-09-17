using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCheques : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ChequeId",
                table: "AmountRequestPayments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Cheques",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    ChequeNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    InitialAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PictureUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cheques", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AmountRequestPayments_ChequeId",
                table: "AmountRequestPayments",
                column: "ChequeId");

            migrationBuilder.AddForeignKey(
                name: "FK_AmountRequestPayments_Cheques_ChequeId",
                table: "AmountRequestPayments",
                column: "ChequeId",
                principalTable: "Cheques",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AmountRequestPayments_Cheques_ChequeId",
                table: "AmountRequestPayments");

            migrationBuilder.DropTable(
                name: "Cheques");

            migrationBuilder.DropIndex(
                name: "IX_AmountRequestPayments_ChequeId",
                table: "AmountRequestPayments");

            migrationBuilder.DropColumn(
                name: "ChequeId",
                table: "AmountRequestPayments");
        }
    }
}
