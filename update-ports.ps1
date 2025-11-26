# Update All Ports Script
# Changes: 3001->3002, 5173->5174, 5000->5001

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Updating All Port Numbers" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nPort Changes:" -ForegroundColor Yellow
Write-Host "  Backend:   3001 -> 3002" -ForegroundColor Gray
Write-Host "  Frontend:  5173 -> 5174" -ForegroundColor Gray
Write-Host "  Inference: 5000 -> 5001" -ForegroundColor Gray

Write-Host "`nFiles already updated:" -ForegroundColor Green
Write-Host "  ✓ .env" -ForegroundColor Gray
Write-Host "  ✓ app/frontend/vite.config.js" -ForegroundColor Gray
Write-Host "  ✓ app/backend/src/config.js" -ForegroundColor Gray
Write-Host "  ✓ inference-service/http_server.py" -ForegroundColor Gray

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "New Port Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nService Ports:" -ForegroundColor Yellow
Write-Host "  Backend API:        3002 (HTTPS)" -ForegroundColor Cyan
Write-Host "  Frontend:           5174 (HTTPS)" -ForegroundColor Cyan
Write-Host "  Inference Service:  5001 (HTTPS)" -ForegroundColor Cyan

$currentIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    ($_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*") -and
    ($_.IPAddress -notlike "127.*") -and ($_.IPAddress -notlike "169.*")
} | Select-Object -First 1).IPAddress

if ($currentIP) {
    Write-Host "`nAccess URLs:" -ForegroundColor Yellow
    Write-Host "  Frontend:  https://${currentIP}:5174" -ForegroundColor Cyan
    Write-Host "  Backend:   https://${currentIP}:3002" -ForegroundColor Cyan
    Write-Host "  Inference: https://${currentIP}:5001" -ForegroundColor Cyan
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`n1. Restart all services:" -ForegroundColor Yellow
Write-Host "   .\restart-services.ps1" -ForegroundColor Cyan

Write-Host "`n2. Or use the monitor script:" -ForegroundColor Yellow
Write-Host "   .\start-and-monitor.ps1" -ForegroundColor Cyan

Write-Host "`n3. Access the application:" -ForegroundColor Yellow
if ($currentIP) {
    Write-Host "   https://${currentIP}:5174" -ForegroundColor Cyan
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Port Update Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
