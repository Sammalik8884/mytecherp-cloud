using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectSpotCheckSite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectSpotCheckItems");

            migrationBuilder.DropTable(
                name: "ProjectSpotChecks");

            migrationBuilder.CreateTable(
                name: "ProjectSpotCheckSites",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SiteId = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UploadedFiles = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectSpotCheckSites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectSpotCheckSites_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectSpotCheckSiteItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectSpotCheckSiteId = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ItemText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsYes = table.Column<bool>(type: "bit", nullable: false),
                    IsNA = table.Column<bool>(type: "bit", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectSpotCheckSiteItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectSpotCheckSiteItems_ProjectSpotCheckSites_ProjectSpotCheckSiteId",
                        column: x => x.ProjectSpotCheckSiteId,
                        principalTable: "ProjectSpotCheckSites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectSpotCheckSiteItems_ProjectSpotCheckSiteId",
                table: "ProjectSpotCheckSiteItems",
                column: "ProjectSpotCheckSiteId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectSpotCheckSites_SiteId",
                table: "ProjectSpotCheckSites",
                column: "SiteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectSpotCheckSiteItems");

            migrationBuilder.DropTable(
                name: "ProjectSpotCheckSites");

            migrationBuilder.CreateTable(
                name: "ProjectSpotChecks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    SiteId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UploadedFiles = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectSpotChecks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectSpotChecks_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectSpotChecks_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectSpotCheckItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectSpotCheckId = table.Column<int>(type: "int", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsNA = table.Column<bool>(type: "bit", nullable: false),
                    IsNo = table.Column<bool>(type: "bit", nullable: false),
                    IsYes = table.Column<bool>(type: "bit", nullable: false),
                    ItemText = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectSpotCheckItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectSpotCheckItems_ProjectSpotChecks_ProjectSpotCheckId",
                        column: x => x.ProjectSpotCheckId,
                        principalTable: "ProjectSpotChecks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectSpotCheckItems_ProjectSpotCheckId",
                table: "ProjectSpotCheckItems",
                column: "ProjectSpotCheckId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectSpotChecks_CreatedByUserId",
                table: "ProjectSpotChecks",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectSpotChecks_SiteId",
                table: "ProjectSpotChecks",
                column: "SiteId");
        }
    }
}
