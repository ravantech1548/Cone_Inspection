# Restart Backend Only

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restarting Backend Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Find and stop backend process
Write-Host "`nStopping backend..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | 
    ForEach-Object { 
        Write-Host "Stopping process on port 3001 (PID: $($_.OwningProcess))" -ForegroundColor Gray
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }

Start-Sleep -Seconds 3

# Start backend
Write-Host "`nStarting backend..." -ForegroundColor Yellow
$BACKEND_DIR = Join-Path $PSScriptRoot "app\backend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND_DIR'; npm start" -WindowStyle Minimized

Write-Host "[OK] Backend restarting..." -ForegroundColor Green
Write-Host "`nWait 10-15 seconds for backend to be ready" -ForegroundColor Yellow
Write-Host "Then refresh your browser (Ctrl + Shift + R)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend URL: https://192.168.0.6:3001" -ForegroundColor Cyan
