# API Overview

The backend uses a standard RESTful approach combined with CQRS using MediatR. 
Base URL: `/api/v1`

## Key Modules
- **Auth**: Login, JWT issuing, user context
- **Assets**: Management of equipment, dry-run CSV imports
- **Sync**: Offline operation synchronization logic
