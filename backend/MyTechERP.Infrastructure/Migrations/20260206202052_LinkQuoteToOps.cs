using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LinkQuoteToOps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkOrders_Contracts_ContractId",
                table: "WorkOrders");

            migrationBuilder.AlterColumn<int>(
                name: "ContractId",
                table: "WorkOrders",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<int>(
                name: "AssetId",
                table: "WorkOrders",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "CustomerId",
                table: "WorkOrders",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ReferenceQuotationId",
                table: "WorkOrders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SiteId",
                table: "WorkOrders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReferenceQuotationId",
                table: "Contracts",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkOrders_ReferenceQuotationId",
                table: "WorkOrders",
                column: "ReferenceQuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_Contracts_ReferenceQuotationId",
                table: "Contracts",
                column: "ReferenceQuotationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Contracts_Quotations_ReferenceQuotationId",
                table: "Contracts",
                column: "ReferenceQuotationId",
                principalTable: "Quotations",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkOrders_Contracts_ContractId",
                table: "WorkOrders",
                column: "ContractId",
                principalTable: "Contracts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkOrders_Quotations_ReferenceQuotationId",
                table: "WorkOrders",
                column: "ReferenceQuotationId",
                principalTable: "Quotations",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Contracts_Quotations_ReferenceQuotationId",
                table: "Contracts");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkOrders_Contracts_ContractId",
                table: "WorkOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkOrders_Quotations_ReferenceQuotationId",
                table: "WorkOrders");

            migrationBuilder.DropIndex(
                name: "IX_WorkOrders_ReferenceQuotationId",
                table: "WorkOrders");

            migrationBuilder.DropIndex(
                name: "IX_Contracts_ReferenceQuotationId",
                table: "Contracts");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "ReferenceQuotationId",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "SiteId",
                table: "WorkOrders");

            migrationBuilder.DropColumn(
                name: "ReferenceQuotationId",
                table: "Contracts");

            migrationBuilder.AlterColumn<int>(
                name: "ContractId",
                table: "WorkOrders",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "AssetId",
                table: "WorkOrders",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkOrders_Contracts_ContractId",
                table: "WorkOrders",
                column: "ContractId",
                principalTable: "Contracts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
