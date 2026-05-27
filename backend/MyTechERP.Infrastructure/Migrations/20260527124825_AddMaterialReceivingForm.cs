using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialReceivingForm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MaterialReceivingForms",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SiteId = table.Column<int>(type: "int", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialReceivingForms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaterialReceivingForms_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MaterialReceivingForms_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MaterialReceivingForms_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MaterialReceivingItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaterialReceivingFormId = table.Column<int>(type: "int", nullable: false),
                    ItemName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LocationValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Received = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaterialReceivingItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MaterialReceivingItems_MaterialReceivingForms_MaterialReceivingFormId",
                        column: x => x.MaterialReceivingFormId,
                        principalTable: "MaterialReceivingForms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MaterialReceivingForms_CreatedByUserId",
                table: "MaterialReceivingForms",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialReceivingForms_SiteId",
                table: "MaterialReceivingForms",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialReceivingForms_TenantId",
                table: "MaterialReceivingForms",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_MaterialReceivingItems_MaterialReceivingFormId",
                table: "MaterialReceivingItems",
                column: "MaterialReceivingFormId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MaterialReceivingItems");

            migrationBuilder.DropTable(
                name: "MaterialReceivingForms");
        }
    }
}
