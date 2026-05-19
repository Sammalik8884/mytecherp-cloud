using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAssignedEstimatorToSalesLead : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignedEstimatorId",
                table: "SalesLeads",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SalesLeads_AssignedEstimatorId",
                table: "SalesLeads",
                column: "AssignedEstimatorId");

            migrationBuilder.AddForeignKey(
                name: "FK_SalesLeads_AspNetUsers_AssignedEstimatorId",
                table: "SalesLeads",
                column: "AssignedEstimatorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SalesLeads_AspNetUsers_AssignedEstimatorId",
                table: "SalesLeads");

            migrationBuilder.DropIndex(
                name: "IX_SalesLeads_AssignedEstimatorId",
                table: "SalesLeads");

            migrationBuilder.DropColumn(
                name: "AssignedEstimatorId",
                table: "SalesLeads");
        }
    }
}
