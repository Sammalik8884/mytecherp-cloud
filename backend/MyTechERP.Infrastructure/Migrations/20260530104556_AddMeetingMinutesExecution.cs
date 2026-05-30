using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMeetingMinutesExecution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MeetingMinutesExecutions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SiteId = table.Column<int>(type: "int", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    MeetingTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MeetingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TimeFrom = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TimeTo = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Organizer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MeetingType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Agenda = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DiscussionPoints = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DecisionsMade = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ActionItems = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ClosingNotes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedByUserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeetingMinutesExecutions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MeetingMinutesExecutions_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MeetingMinutesExecutions_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MeetingMinutesExecutions_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MeetingMinutesExecutionAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MeetingMinutesExecutionId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeetingMinutesExecutionAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MeetingMinutesExecutionAttachments_MeetingMinutesExecutions_MeetingMinutesExecutionId",
                        column: x => x.MeetingMinutesExecutionId,
                        principalTable: "MeetingMinutesExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MeetingMinutesExecutionAttendees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MeetingMinutesExecutionId = table.Column<int>(type: "int", nullable: false),
                    EmployeeIdStr = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmployeeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmployeeStatus = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeetingMinutesExecutionAttendees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MeetingMinutesExecutionAttendees_MeetingMinutesExecutions_MeetingMinutesExecutionId",
                        column: x => x.MeetingMinutesExecutionId,
                        principalTable: "MeetingMinutesExecutions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MeetingMinutesExecutionAttachments_MeetingMinutesExecutionId",
                table: "MeetingMinutesExecutionAttachments",
                column: "MeetingMinutesExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_MeetingMinutesExecutionAttendees_MeetingMinutesExecutionId",
                table: "MeetingMinutesExecutionAttendees",
                column: "MeetingMinutesExecutionId");

            migrationBuilder.CreateIndex(
                name: "IX_MeetingMinutesExecutions_CreatedByUserId",
                table: "MeetingMinutesExecutions",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MeetingMinutesExecutions_SiteId",
                table: "MeetingMinutesExecutions",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_MeetingMinutesExecutions_TenantId",
                table: "MeetingMinutesExecutions",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MeetingMinutesExecutionAttachments");

            migrationBuilder.DropTable(
                name: "MeetingMinutesExecutionAttendees");

            migrationBuilder.DropTable(
                name: "MeetingMinutesExecutions");
        }
    }
}
