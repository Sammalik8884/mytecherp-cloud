using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class QuotationItemsAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuotationItem_Products_ProductId",
                table: "QuotationItem");

            migrationBuilder.DropForeignKey(
                name: "FK_QuotationItem_Quotations_QuotationId",
                table: "QuotationItem");

            migrationBuilder.DropPrimaryKey(
                name: "PK_QuotationItem",
                table: "QuotationItem");

            migrationBuilder.RenameTable(
                name: "QuotationItem",
                newName: "QuotationsItem");

            migrationBuilder.RenameIndex(
                name: "IX_QuotationItem_QuotationId",
                table: "QuotationsItem",
                newName: "IX_QuotationsItem_QuotationId");

            migrationBuilder.RenameIndex(
                name: "IX_QuotationItem_ProductId",
                table: "QuotationsItem",
                newName: "IX_QuotationsItem_ProductId");

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "Quotations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApprovedByUserId",
                table: "Quotations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReviewerComments",
                table: "Quotations",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Quotations",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_QuotationsItem",
                table: "QuotationsItem",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_QuotationsItem_Products_ProductId",
                table: "QuotationsItem",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_QuotationsItem_Quotations_QuotationId",
                table: "QuotationsItem",
                column: "QuotationId",
                principalTable: "Quotations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuotationsItem_Products_ProductId",
                table: "QuotationsItem");

            migrationBuilder.DropForeignKey(
                name: "FK_QuotationsItem_Quotations_QuotationId",
                table: "QuotationsItem");

            migrationBuilder.DropPrimaryKey(
                name: "PK_QuotationsItem",
                table: "QuotationsItem");

            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "ReviewerComments",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Quotations");

            migrationBuilder.RenameTable(
                name: "QuotationsItem",
                newName: "QuotationItem");

            migrationBuilder.RenameIndex(
                name: "IX_QuotationsItem_QuotationId",
                table: "QuotationItem",
                newName: "IX_QuotationItem_QuotationId");

            migrationBuilder.RenameIndex(
                name: "IX_QuotationsItem_ProductId",
                table: "QuotationItem",
                newName: "IX_QuotationItem_ProductId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_QuotationItem",
                table: "QuotationItem",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_QuotationItem_Products_ProductId",
                table: "QuotationItem",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_QuotationItem_Quotations_QuotationId",
                table: "QuotationItem",
                column: "QuotationId",
                principalTable: "Quotations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
