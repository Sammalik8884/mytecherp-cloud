Write-Host "Creating Resource Group..."
az group create --name MyTechERP-prod-gwc --location germanywestcentral
Write-Host "Creating App Service Plan..."
az appservice plan create --name MyTechERPSvPlan --resource-group MyTechERP-prod-gwc --sku B1 --is-linux
Write-Host "Creating Web App..."
az webapp create --resource-group MyTechERP-prod-gwc --plan MyTechERPSvPlan --name mytecherp-api-backend-8884 --runtime "DOTNETCORE|8.0"
Write-Host "Creating Storage Account..."
az storage account create --name mytecherpst8884gwc --resource-group MyTechERP-prod-gwc --location germanywestcentral --sku Standard_LRS
Write-Host "Creating SQL Server..."
az sql server create --name mytecherpsqlprod8884 --resource-group MyTechERP-prod-gwc --location germanywestcentral --admin-user mytechadmin --admin-password "MyTechErp@2026!Secure"
Write-Host "Configuring SQL Firewall..."
az sql server firewall-rule create --resource-group MyTechERP-prod-gwc --server mytecherpsqlprod8884 --name AllowAllAzureIPs --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0
Write-Host "Creating SQL Database..."
az sql db create --resource-group MyTechERP-prod-gwc --server mytecherpsqlprod8884 --name MyTechERP_DB --service-objective Basic
Write-Host "Azure Provisioning Complete!"
