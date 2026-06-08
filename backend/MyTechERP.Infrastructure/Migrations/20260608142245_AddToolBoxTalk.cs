using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddToolBoxTalk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ToolBoxTalks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    DocumentNo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FormNo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Time = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SiteId = table.Column<int>(type: "int", nullable: false),
                    TbtPerformedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Subject = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    JobSupervisorName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QehsName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProjectManagerName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SelectedTopics = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ToolBoxTalks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ToolBoxTalks_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ToolBoxTalkAttendees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    ToolBoxTalkId = table.Column<int>(type: "int", nullable: false),
                    EmployeeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ToolBoxTalkAttendees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ToolBoxTalkAttendees_ToolBoxTalks_ToolBoxTalkId",
                        column: x => x.ToolBoxTalkId,
                        principalTable: "ToolBoxTalks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ToolBoxTalkAttendees_ToolBoxTalkId",
                table: "ToolBoxTalkAttendees",
                column: "ToolBoxTalkId");

            migrationBuilder.CreateIndex(
                name: "IX_ToolBoxTalks_SiteId",
                table: "ToolBoxTalks",
                column: "SiteId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ToolBoxTalkAttendees");

            migrationBuilder.DropTable(
                name: "ToolBoxTalks");
        }
    }
}
