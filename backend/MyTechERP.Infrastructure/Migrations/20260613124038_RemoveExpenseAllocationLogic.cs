using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveExpenseAllocationLogic : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_Sites_SiteId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "IsAllocatedExcess",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "SourceArfNumber",
                table: "Expenses");

            migrationBuilder.AlterColumn<int>(
                name: "SiteId",
                table: "Expenses",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "OfficeId",
                table: "Expenses",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsExcessItem",
                table: "ExpenseItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "OfficeId",
                table: "AmountRequestForms",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Offices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    OfficeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Offices", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Expenses_OfficeId",
                table: "Expenses",
                column: "OfficeId");

            migrationBuilder.CreateIndex(
                name: "IX_AmountRequestForms_OfficeId",
                table: "AmountRequestForms",
                column: "OfficeId");

            migrationBuilder.AddForeignKey(
                name: "FK_AmountRequestForms_Offices_OfficeId",
                table: "AmountRequestForms",
                column: "OfficeId",
                principalTable: "Offices",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_Offices_OfficeId",
                table: "Expenses",
                column: "OfficeId",
                principalTable: "Offices",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_Sites_SiteId",
                table: "Expenses",
                column: "SiteId",
                principalTable: "Sites",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AmountRequestForms_Offices_OfficeId",
                table: "AmountRequestForms");

            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_Offices_OfficeId",
                table: "Expenses");

            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_Sites_SiteId",
                table: "Expenses");

            migrationBuilder.DropTable(
                name: "Offices");

            migrationBuilder.DropIndex(
                name: "IX_Expenses_OfficeId",
                table: "Expenses");

            migrationBuilder.DropIndex(
                name: "IX_AmountRequestForms_OfficeId",
                table: "AmountRequestForms");

            migrationBuilder.DropColumn(
                name: "OfficeId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "IsExcessItem",
                table: "ExpenseItems");

            migrationBuilder.DropColumn(
                name: "OfficeId",
                table: "AmountRequestForms");

            migrationBuilder.AlterColumn<int>(
                name: "SiteId",
                table: "Expenses",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsAllocatedExcess",
                table: "Expenses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SourceArfNumber",
                table: "Expenses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_Sites_SiteId",
                table: "Expenses",
                column: "SiteId",
                principalTable: "Sites",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
