Write-Host "Creating App Service Plan..."
az appservice plan create --name mytech-plan-gwc --resource-group TestSQL-GWC --sku B1 --is-linux
Write-Host "Creating Web App..."
az webapp create --resource-group TestSQL-GWC --plan mytech-plan-gwc --name mytecherp-cloud-api --runtime "DOTNETCORE|8.0"
Write-Host "Creating Storage Account..."
az storage account create --name mytecherpstggwc8884 --resource-group TestSQL-GWC --location germanywestcentral --sku Standard_LRS
Write-Host "Configuring SQL Firewall..."
az sql server firewall-rule create --resource-group TestSQL-GWC --server mytechsqlsrv-gwc-8884 --name AllowAllAzureIPs --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0
Write-Host "Creating SQL Database..."
az sql db create --resource-group TestSQL-GWC --server mytechsqlsrv-gwc-8884 --name MyTechERP_DB --service-objective Basic
Write-Host "Done!"
