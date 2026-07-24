using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesMeetingReminders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SalesMeetingReminders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SalesmanUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SiteName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    MeetingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsTimeIncluded = table.Column<bool>(type: "bit", nullable: false),
                    IsNotified = table.Column<bool>(type: "bit", nullable: false),
                    IsPopupAcknowledged = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalesMeetingReminders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SalesMeetingReminders_AspNetUsers_SalesmanUserId",
                        column: x => x.SalesmanUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SalesMeetingReminders_SalesmanUserId",
                table: "SalesMeetingReminders",
                column: "SalesmanUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SalesMeetingReminders");
        }
    }
}
