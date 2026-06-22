using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "ProcurementRequestItems",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.CreateTable(
                name: "StoreDailyLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SiteId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TimeOut = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TimeIn = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreDailyLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoreDailyLogs_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StoreTools",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalQuantity = table.Column<int>(type: "int", nullable: false),
                    CurrentQuantity = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreTools", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StoreDailyLogItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StoreDailyLogId = table.Column<int>(type: "int", nullable: false),
                    StoreToolId = table.Column<int>(type: "int", nullable: false),
                    CustomDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    QuantityOut = table.Column<int>(type: "int", nullable: false),
                    QuantityIn = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreDailyLogItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StoreDailyLogItems_StoreDailyLogs_StoreDailyLogId",
                        column: x => x.StoreDailyLogId,
                        principalTable: "StoreDailyLogs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StoreDailyLogItems_StoreTools_StoreToolId",
                        column: x => x.StoreToolId,
                        principalTable: "StoreTools",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StoreDailyLogItems_StoreDailyLogId",
                table: "StoreDailyLogItems",
                column: "StoreDailyLogId");

            migrationBuilder.CreateIndex(
                name: "IX_StoreDailyLogItems_StoreToolId",
                table: "StoreDailyLogItems",
                column: "StoreToolId");

            migrationBuilder.CreateIndex(
                name: "IX_StoreDailyLogs_SiteId",
                table: "StoreDailyLogs",
                column: "SiteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StoreDailyLogItems");

            migrationBuilder.DropTable(
                name: "StoreDailyLogs");

            migrationBuilder.DropTable(
                name: "StoreTools");

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "ProcurementRequestItems",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,4)",
                oldPrecision: 18,
                oldScale: 4);
        }
    }
}
