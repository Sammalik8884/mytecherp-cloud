# Database Schema

The database uses SQL Server and Entity Framework Core for migrations.

## Key Tables
- **Users**: Admin, Managers, Technicians
- **Assets / Equipment**: Serial numbers, categories, location mapping
- **Jobs / Tickets**: Assigned task lists, statuses

Migrations are managed inside the `Infrastructure` layer.
