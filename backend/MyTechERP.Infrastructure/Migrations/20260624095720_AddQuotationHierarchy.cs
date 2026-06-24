using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddQuotationHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentQuoteId",
                table: "Quotations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SiteId",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SiteToolStocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SiteId = table.Column<int>(type: "int", nullable: false),
                    StoreToolId = table.Column<int>(type: "int", nullable: false),
                    AvailableQuantity = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteToolStocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteToolStocks_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SiteToolStocks_StoreTools_StoreToolId",
                        column: x => x.StoreToolId,
                        principalTable: "StoreTools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_ParentQuoteId",
                table: "Quotations",
                column: "ParentQuoteId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_SiteId",
                table: "AspNetUsers",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteToolStocks_SiteId_StoreToolId",
                table: "SiteToolStocks",
                columns: new[] { "SiteId", "StoreToolId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SiteToolStocks_StoreToolId",
                table: "SiteToolStocks",
                column: "StoreToolId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Sites_SiteId",
                table: "AspNetUsers",
                column: "SiteId",
                principalTable: "Sites",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Quotations_Quotations_ParentQuoteId",
                table: "Quotations",
                column: "ParentQuoteId",
                principalTable: "Quotations",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Sites_SiteId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_Quotations_Quotations_ParentQuoteId",
                table: "Quotations");

            migrationBuilder.DropTable(
                name: "SiteToolStocks");

            migrationBuilder.DropIndex(
                name: "IX_Quotations_ParentQuoteId",
                table: "Quotations");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_SiteId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ParentQuoteId",
                table: "Quotations");

            migrationBuilder.DropColumn(
                name: "SiteId",
                table: "AspNetUsers");
        }
    }
}
