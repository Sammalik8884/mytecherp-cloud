using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddArfReturnsAndDebt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPaidByDebt",
                table: "Expenses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "ArfReturns",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AmountRequestFormId = table.Column<int>(type: "int", nullable: false),
                    ReturnAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ReturnDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReturnedByEmail = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArfReturns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ArfReturns_AmountRequestForms_AmountRequestFormId",
                        column: x => x.AmountRequestFormId,
                        principalTable: "AmountRequestForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ArfReturns_AmountRequestFormId",
                table: "ArfReturns",
                column: "AmountRequestFormId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ArfReturns");

            migrationBuilder.DropColumn(
                name: "IsPaidByDebt",
                table: "Expenses");
        }
    }
}
