# Start-App.ps1
# Script to launch Firetech ERP Backend and Frontend simultaneously

$BackendPath = ".\backend\MytechERP.API"
$FrontendPath = ".\frontend"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Starting Firetech ERP Services " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Backend Exists
if (-Not (Test-Path $BackendPath)) {
    Write-Host "[ERROR] Backend path not found: $BackendPath" -ForegroundColor Red
    exit
}

# Check if Frontend Exists
if (-Not (Test-Path $FrontendPath)) {
    Write-Host "[ERROR] Frontend path not found: $FrontendPath" -ForegroundColor Red
    exit
}

Write-Host "[INFO] Starting Backend API..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command cd '$BackendPath'; dotnet run" -WindowStyle Normal

Write-Host "[INFO] Starting Frontend Dev Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command cd '$FrontendPath'; npm run dev" -WindowStyle Normal

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host " Services are spinning up in new windows." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
