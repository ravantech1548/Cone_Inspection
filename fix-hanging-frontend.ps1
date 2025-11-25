# Fix Hanging Frontend Script
# Use this when frontend is stuck at "Classifying..."

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Fix Hanging Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nDiagnosing issue..." -ForegroundColor Yellow

# Check if services are running
$backendPort = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
$inferencePort = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue

if (!$backendPort -or !$frontendPort -or !$inferencePort) {
    Write-Host "[!] Services are not running" -ForegroundColor Red
    Write-Host "`nStarting services..." -ForegroundColor Yellow
    Write-Host "Run: .\start-and-monitor.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host "[OK] All services are running" -ForegroundColor Green

# Get current IP
$adapters = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop | 
            Where-Object {
                ($_.InterfaceAlias -like "*Wi-Fi*" -or 
                 $_.InterfaceAlias -like "*Ethernet*" -or
                 $_.InterfaceAlias -like "*LAN*") -and
                ($_.IPAddress -notlike "127.*") -and 
                ($_.IPAddress -notlike "169.*")
            }

$currentIP = $adapters | Select-Object -First 1 -ExpandProperty IPAddress

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Issue: Frontend Stuck at 'Classifying...'" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nThis happens when:" -ForegroundColor Yellow
Write-Host "  1. The page is cached from before services restarted" -ForegroundColor Gray
Write-Host "  2. The frontend lost connection to backend" -ForegroundColor Gray
Write-Host "  3. An old API request is still pending" -ForegroundColor Gray

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "SOLUTION" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nOption 1: Hard Refresh (Recommended)" -ForegroundColor Yellow
Write-Host "  In your browser, press:" -ForegroundColor White
Write-Host "    • Ctrl + Shift + R  (Windows)" -ForegroundColor Cyan
Write-Host "    • Ctrl + F5         (Alternative)" -ForegroundColor Cyan
Write-Host "    • Cmd + Shift + R   (Mac)" -ForegroundColor Cyan

Write-Host "`nOption 2: Close and Reopen Tab" -ForegroundColor Yellow
Write-Host "  1. Close the current browser tab" -ForegroundColor White
Write-Host "  2. Open new tab and navigate to:" -ForegroundColor White
Write-Host "     https://$currentIP:5173" -ForegroundColor Cyan

Write-Host "`nOption 3: Clear Browser Cache" -ForegroundColor Yellow
Write-Host "  1. Press Ctrl + Shift + Delete" -ForegroundColor White
Write-Host "  2. Select 'Cached images and files'" -ForegroundColor White
Write-Host "  3. Click 'Clear data'" -ForegroundColor White
Write-Host "  4. Reload the page" -ForegroundColor White

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Access URLs" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Frontend:  https://${currentIP}:5173" -ForegroundColor Cyan
Write-Host "  Backend:   https://${currentIP}:3001" -ForegroundColor Cyan
Write-Host "  Inference: https://${currentIP}:5000" -ForegroundColor Cyan

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "After refreshing, you should see:" -ForegroundColor Yellow
Write-Host "  • Login page (if not logged in)" -ForegroundColor Gray
Write-Host "  • Dashboard (if logged in)" -ForegroundColor Gray
Write-Host "  • Upload interface working normally" -ForegroundColor Gray

Write-Host "`nIf issue persists after refresh:" -ForegroundColor Yellow
Write-Host "  1. Check browser console (F12) for errors" -ForegroundColor Gray
Write-Host "  2. Restart services: .\start-and-monitor.ps1" -ForegroundColor Gray
Write-Host "  3. Check backend logs in the monitor window" -ForegroundColor Gray

Write-Host "========================================" -ForegroundColor Cyan
