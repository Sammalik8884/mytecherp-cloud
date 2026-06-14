using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using MytechERP.Infrastructure.Persistance;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260614153500_ClearArfAndExpenseData")]
    public partial class ClearArfAndExpenseData : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Delete dependent records first to avoid foreign key constraint violations
            migrationBuilder.Sql("DELETE FROM ExpenseItems;");
            migrationBuilder.Sql("DELETE FROM AmountRequestPayments;");
            
            // Expenses depends on AmountRequestForms
            migrationBuilder.Sql("DELETE FROM Expenses;");
            
            // Finally delete AmountRequestForms
            migrationBuilder.Sql("DELETE FROM AmountRequestForms;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Empty down migration as data cannot be easily restored
        }
    }
}
