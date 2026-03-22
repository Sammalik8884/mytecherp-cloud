using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAssetToQuotation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssetId",
                table: "Quotations",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_AssetId",
                table: "Quotations",
                column: "AssetId");

            migrationBuilder.AddForeignKey(
                name: "FK_Quotations_Assets_AssetId",
                table: "Quotations",
                column: "AssetId",
                principalTable: "Assets",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_Assets_AssetId",
                table: "Quotations");

            migrationBuilder.DropIndex(
                name: "IX_Quotations_AssetId",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "AssetId",
                table: "Quotations");
        }
    }
}
