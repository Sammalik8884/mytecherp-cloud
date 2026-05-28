using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMomMeeting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaterialReceivingForms_AspNetUsers_CreatedByUserId",
                table: "MaterialReceivingForms");

            migrationBuilder.CreateTable(
                name: "MomMeetings",
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
                    table.PrimaryKey("PK_MomMeetings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MomMeetings_AspNetUsers_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MomMeetings_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MomMeetings_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MomAttachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MomMeetingId = table.Column<int>(type: "int", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FileUrl = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MomAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MomAttachments_MomMeetings_MomMeetingId",
                        column: x => x.MomMeetingId,
                        principalTable: "MomMeetings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MomAttendees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MomMeetingId = table.Column<int>(type: "int", nullable: false),
                    EmployeeIdStr = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmployeeName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EmployeeStatus = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MomAttendees", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MomAttendees_MomMeetings_MomMeetingId",
                        column: x => x.MomMeetingId,
                        principalTable: "MomMeetings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MomAttachments_MomMeetingId",
                table: "MomAttachments",
                column: "MomMeetingId");

            migrationBuilder.CreateIndex(
                name: "IX_MomAttendees_MomMeetingId",
                table: "MomAttendees",
                column: "MomMeetingId");

            migrationBuilder.CreateIndex(
                name: "IX_MomMeetings_CreatedByUserId",
                table: "MomMeetings",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MomMeetings_SiteId",
                table: "MomMeetings",
                column: "SiteId");

            migrationBuilder.CreateIndex(
                name: "IX_MomMeetings_TenantId",
                table: "MomMeetings",
                column: "TenantId");

            migrationBuilder.AddForeignKey(
                name: "FK_MaterialReceivingForms_AspNetUsers_CreatedByUserId",
                table: "MaterialReceivingForms",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MaterialReceivingForms_AspNetUsers_CreatedByUserId",
                table: "MaterialReceivingForms");

            migrationBuilder.DropTable(
                name: "MomAttachments");

            migrationBuilder.DropTable(
                name: "MomAttendees");

            migrationBuilder.DropTable(
                name: "MomMeetings");

            migrationBuilder.AddForeignKey(
                name: "FK_MaterialReceivingForms_AspNetUsers_CreatedByUserId",
                table: "MaterialReceivingForms",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
