using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ForceRegionalHeadColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RegionalHeadApprovalDate",
                table: "ProcurementRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegionalHeadEmail",
                table: "ProcurementRequests",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegionalHeadRemarks",
                table: "ProcurementRequests",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RegionalHeadApprovalDate",
                table: "ProcurementRequests");

            migrationBuilder.DropColumn(
                name: "RegionalHeadEmail",
                table: "ProcurementRequests");

            migrationBuilder.DropColumn(
                name: "RegionalHeadRemarks",
                table: "ProcurementRequests");
        }
    }
}
