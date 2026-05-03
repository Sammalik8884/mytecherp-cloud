using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAllocatedExcessToExpense : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_AmountRequestForms_AmountRequestFormId",
                table: "Expenses");

            migrationBuilder.AlterColumn<int>(
                name: "AmountRequestFormId",
                table: "Expenses",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<bool>(
                name: "IsAllocatedExcess",
                table: "Expenses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SourceArfNumber",
                table: "Expenses",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_AmountRequestForms_AmountRequestFormId",
                table: "Expenses",
                column: "AmountRequestFormId",
                principalTable: "AmountRequestForms",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_AmountRequestForms_AmountRequestFormId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "IsAllocatedExcess",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "SourceArfNumber",
                table: "Expenses");

            migrationBuilder.AlterColumn<int>(
                name: "AmountRequestFormId",
                table: "Expenses",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_AmountRequestForms_AmountRequestFormId",
                table: "Expenses",
                column: "AmountRequestFormId",
                principalTable: "AmountRequestForms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
