using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyTechERP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStoreEntitiesSyncable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "StoreTools",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "StoreTools",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "StoreTools",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "StoreDailyLogs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "StoreDailyLogs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "StoreDailyLogs",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "StoreDailyLogItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "StoreDailyLogItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "StoreDailyLogItems",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "StoreTools");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "StoreTools");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "StoreTools");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "StoreDailyLogs");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "StoreDailyLogs");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "StoreDailyLogs");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "StoreDailyLogItems");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "StoreDailyLogItems");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "StoreDailyLogItems");
        }
    }
}
