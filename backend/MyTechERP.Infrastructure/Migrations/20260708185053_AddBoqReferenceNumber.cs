using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBoqReferenceNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BoqReferenceNumber",
                table: "Quotations",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BoqReferenceNumber",
                table: "Quotations");
        }
    }
}
