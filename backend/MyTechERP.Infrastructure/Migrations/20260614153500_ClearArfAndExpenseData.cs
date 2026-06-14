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
            // Data has already been cleared. This script has been emptied to ensure no future data is accidentally deleted.
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Empty down migration as data cannot be easily restored
        }
    }
}
