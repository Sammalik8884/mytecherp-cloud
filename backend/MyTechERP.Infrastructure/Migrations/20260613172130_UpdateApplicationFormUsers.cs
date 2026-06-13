using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateApplicationFormUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "ApplicationForms",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_ApplicationForms_CreatedByUserId",
                table: "ApplicationForms",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ApplicationForms_AspNetUsers_CreatedByUserId",
                table: "ApplicationForms",
                column: "CreatedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ApplicationForms_AspNetUsers_CreatedByUserId",
                table: "ApplicationForms");

            migrationBuilder.DropIndex(
                name: "IX_ApplicationForms_CreatedByUserId",
                table: "ApplicationForms");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ApplicationForms");
        }
    }
}
