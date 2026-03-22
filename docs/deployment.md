# Deployment Guide

The deployment strategy is fully containerized using Docker.

## Local Deployment
Run `docker-compose up -d` at the root, which orchestrates:
- SQL Server
- Azurite (for blob storage emulation)
- The Backend Web API
- The Frontend Service

## Production Deployment
- **Database**: Azure SQL or equivalent managed database
- **Storage**: Azure Blob Storage
- **Backend App**: Azure App Service / AKS
- **Frontend App**: Vercel / Azure Static Web Apps
