using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixDuplicateQuoteNumbersAndAddUniqueIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Explicit fix requested by user
            migrationBuilder.Sql(@"
                WITH CTE AS (
                    SELECT Id, QuoteNumber, 
                           ROW_NUMBER() OVER(PARTITION BY TenantId, QuoteNumber ORDER BY Id) as rn
                    FROM Quotations
                    WHERE QuoteNumber = 'MTQ-AA00021-FPS-R0'
                )
                UPDATE Quotations
                SET QuoteNumber = 'MTQ-AA00022-FPS-R0'
                WHERE Id IN (SELECT Id FROM CTE WHERE rn > 1);
            ");

            // Catch-all for any other unforeseen duplicates to ensure the index creation succeeds
            migrationBuilder.Sql(@"
                WITH CTE AS (
                    SELECT Id, QuoteNumber, 
                           ROW_NUMBER() OVER(PARTITION BY TenantId, QuoteNumber ORDER BY Id) as rn
                    FROM Quotations
                )
                UPDATE Quotations
                SET QuoteNumber = QuoteNumber + '-DUP-' + CAST(Id AS VARCHAR)
                WHERE Id IN (SELECT Id FROM CTE WHERE rn > 1);
            ");

            migrationBuilder.AlterColumn<string>(
                name: "QuoteNumber",
                table: "Quotations",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_TenantId_QuoteNumber",
                table: "Quotations",
                columns: new[] { "TenantId", "QuoteNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Quotations_TenantId_QuoteNumber",
                table: "Quotations");

            migrationBuilder.AlterColumn<string>(
                name: "QuoteNumber",
                table: "Quotations",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
