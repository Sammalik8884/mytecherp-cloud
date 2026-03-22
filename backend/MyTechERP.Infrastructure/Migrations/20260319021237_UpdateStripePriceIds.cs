using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStripePriceIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Removed InsertData to prevent Primary Key collision when seeding SubscriptionPlans.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Removed DeleteData
        }
    }
}
