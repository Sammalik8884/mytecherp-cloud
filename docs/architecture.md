# System Architecture

## Overview
Firetech ERP is built using a modern decoupled architecture:
- **Backend**: .NET 8 Web API utilizing Clean Architecture patterns
- **Frontend**: React-based SPA (Antigravity framework)

## Project Layers (Backend)
1. **API**: Controllers, Web Configurations
2. **Application**: CQRS Handlers, Services, Interfaces, DTOs
3. **Domain**: Core Entities, Enums, Domain Exceptions
4. **Infrastructure**: EF Core DbContext, Repositories, Third-Party Integrations
