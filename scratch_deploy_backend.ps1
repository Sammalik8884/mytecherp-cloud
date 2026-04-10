Write-Host "Updating Prod Database Migrations..."
dotnet ef database update --project backend/MyTechERP.Infrastructure/MyTechERP.Infrastructure.csproj --startup-project backend/MytechERP.API/MytechERP.API.csproj --connection "Server=tcp:mytechsqlsrv-gwc-8884.database.windows.net,1433;Initial Catalog=MyTechERP_DB;User ID=mytechadmin;Password=P@ssw0rd!2026S;MultipleActiveResultSets=True;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

Write-Host "Publishing the API..."
dotnet publish backend/MytechERP.API/MytechERP.API.csproj -c Release -o ./publish_output
Set-Location ./publish_output
Compress-Archive -Path * -DestinationPath ../deploy.zip -Force
Set-Location ..
Write-Host "Deploying to Azure App Service..."
az webapp deploy --resource-group TestSQL-GWC --name mytecherp-cloud-api --src-path deploy.zip
Write-Host "Deployment Completed!"
