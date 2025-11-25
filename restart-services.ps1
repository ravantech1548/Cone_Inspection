# Restart All Services Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restarting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Stop all services
Write-Host "`nStopping all services..." -ForegroundColor Yellow

# Kill Node.js processes
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping $($nodeProcesses.Count) Node.js process(es)..." -ForegroundColor Gray
    $nodeProcesses | ForEach-Object { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 2
}

# Kill processes on our ports
Write-Host "Cleaning up ports 3001, 5173, 5000..." -ForegroundColor Gray
Get-NetTCPConnection -LocalPort 3001,5173,5000 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 3

Write-Host "[OK] All services stopped" -ForegroundColor Green

# Start services using the monitor script
Write-Host "`nStarting services with monitor..." -ForegroundColor Yellow
Write-Host "A new window will open with the monitoring script" -ForegroundColor Gray
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; .\start-and-monitor.ps1"

Write-Host "[OK] Services are starting in new window" -ForegroundColor Green
Write-Host ""
Write-Host "Wait 30-60 seconds for all services to start" -ForegroundColor Yellow
Write-Host "Then refresh your browser page (Ctrl + Shift + R)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access URL: https://192.168.0.6:5173" -ForegroundColor Cyan
