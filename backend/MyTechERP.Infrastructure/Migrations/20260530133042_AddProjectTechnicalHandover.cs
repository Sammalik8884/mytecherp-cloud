using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectTechnicalHandover : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProjectTechnicalHandovers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    SiteId = table.Column<int>(type: "int", nullable: false),
                    CustomerId = table.Column<int>(type: "int", nullable: true),
                    SecondaryCustomerId = table.Column<int>(type: "int", nullable: true),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectTechnicalHandovers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectTechnicalHandovers_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectTechnicalHandovers_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProjectTechnicalHandovers_Customers_SecondaryCustomerId",
                        column: x => x.SecondaryCustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProjectTechnicalHandovers_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectTechnicalHandoverAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectTechnicalHandoverId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectTechnicalHandoverAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectTechnicalHandoverAttachments_ProjectTechnicalHandovers_ProjectTechnicalHandoverId",
                        column: x => x.ProjectTechnicalHandoverId,
                        principalTable: "ProjectTechnicalHandovers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTechnicalHandoverAttachments_ProjectTechnicalHandoverId",
                table: "ProjectTechnicalHandoverAttachments",
                column: "ProjectTechnicalHandoverId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTechnicalHandovers_CreatedByUserId",
                table: "ProjectTechnicalHandovers",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTechnicalHandovers_CustomerId",
                table: "ProjectTechnicalHandovers",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTechnicalHandovers_SecondaryCustomerId",
                table: "ProjectTechnicalHandovers",
                column: "SecondaryCustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTechnicalHandovers_SiteId",
                table: "ProjectTechnicalHandovers",
                column: "SiteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectTechnicalHandoverAttachments");

            migrationBuilder.DropTable(
                name: "ProjectTechnicalHandovers");
        }
    }
}
