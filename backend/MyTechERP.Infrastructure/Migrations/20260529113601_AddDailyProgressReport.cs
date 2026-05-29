using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDailyProgressReport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DailyProgressReports",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    SiteId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SiteInCharge = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SiteOpeningTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SiteClosingTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalWorkers = table.Column<int>(type: "int", nullable: false),
                    NextDayActivityPlan = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyProgressReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DailyProgressReports_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DailyProgressReports_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DprActivities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    DailyProgressReportId = table.Column<int>(type: "int", nullable: false),
                    ActivityDone = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DprActivities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DprActivities_DailyProgressReports_DailyProgressReportId",
                        column: x => x.DailyProgressReportId,
                        principalTable: "DailyProgressReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DprAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    DailyProgressReportId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BlobName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DprAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DprAttachments_DailyProgressReports_DailyProgressReportId",
                        column: x => x.DailyProgressReportId,
                        principalTable: "DailyProgressReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DprEmployees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    DailyProgressReportId = table.Column<int>(type: "int", nullable: false),
                    EmployeeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    InTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OutTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OverTime = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DprEmployees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DprEmployees_DailyProgressReports_DailyProgressReportId",
                        column: x => x.DailyProgressReportId,
                        principalTable: "DailyProgressReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DprMaterials",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    DailyProgressReportId = table.Column<int>(type: "int", nullable: false),
                    Item = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Quantity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DprMaterials", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DprMaterials_DailyProgressReports_DailyProgressReportId",
                        column: x => x.DailyProgressReportId,
                        principalTable: "DailyProgressReports",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DailyProgressReports_CreatedByUserId",
                table: "DailyProgressReports",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyProgressReports_SiteId",
                table: "DailyProgressReports",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_DprActivities_DailyProgressReportId",
                table: "DprActivities",
                column: "DailyProgressReportId");

            migrationBuilder.CreateIndex(
                name: "IX_DprAttachments_DailyProgressReportId",
                table: "DprAttachments",
                column: "DailyProgressReportId");

            migrationBuilder.CreateIndex(
                name: "IX_DprEmployees_DailyProgressReportId",
                table: "DprEmployees",
                column: "DailyProgressReportId");

            migrationBuilder.CreateIndex(
                name: "IX_DprMaterials_DailyProgressReportId",
                table: "DprMaterials",
                column: "DailyProgressReportId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DprActivities");

            migrationBuilder.DropTable(
                name: "DprAttachments");

            migrationBuilder.DropTable(
                name: "DprEmployees");

            migrationBuilder.DropTable(
                name: "DprMaterials");

            migrationBuilder.DropTable(
                name: "DailyProgressReports");
        }
    }
}
