# Force Restart Backend - Kill all Node processes and restart

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Force Restart Backend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Kill ALL Node.js processes
Write-Host "`nKilling all Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Gray
    $nodeProcesses | ForEach-Object {
        Write-Host "  Killing PID: $($_.Id)" -ForegroundColor Gray
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 3
    Write-Host "[OK] All Node.js processes stopped" -ForegroundColor Green
} else {
    Write-Host "[INFO] No Node.js processes found" -ForegroundColor Gray
}

# Clean up port 3001
Write-Host "`nCleaning up port 3001..." -ForegroundColor Yellow
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | 
    ForEach-Object { 
        Write-Host "  Killing process on port 3001 (PID: $($_.OwningProcess))" -ForegroundColor Gray
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue 
    }

Start-Sleep -Seconds 2

# Verify port is free
$portCheck = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($portCheck) {
    Write-Host "[WARN] Port 3001 still in use!" -ForegroundColor Red
} else {
    Write-Host "[OK] Port 3001 is free" -ForegroundColor Green
}

# Start backend
Write-Host "`nStarting backend with updated code..." -ForegroundColor Yellow
$BACKEND_DIR = Join-Path $PSScriptRoot "app\backend"

Write-Host "  Backend directory: $BACKEND_DIR" -ForegroundColor Gray
Write-Host "  Command: npm start" -ForegroundColor Gray

$process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND_DIR'; Write-Host 'Starting backend...' -ForegroundColor Cyan; npm start" -PassThru -WindowStyle Normal

Start-Sleep -Seconds 2

if ($process -and !$process.HasExited) {
    Write-Host "[OK] Backend process started (PID: $($process.Id))" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Backend failed to start" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan

# Wait and check port
for ($i = 1; $i -le 10; $i++) {
    Write-Host "  Check $i/10..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
    
    $portReady = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
    if ($portReady) {
        Write-Host "`n[OK] Backend is ready on port 3001!" -ForegroundColor Green
        break
    }
}

$finalCheck = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if ($finalCheck) {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "Backend Successfully Restarted!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "`nBackend URL: https://192.168.0.6:3001" -ForegroundColor Cyan
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Go to your browser" -ForegroundColor Gray
    Write-Host "  2. Press Ctrl + Shift + R (hard refresh)" -ForegroundColor Gray
    Write-Host "  3. Go to Audit page" -ForegroundColor Gray
    Write-Host "  4. Click 'View Report' on a batch" -ForegroundColor Gray
    Write-Host "  5. Click '🔄 Refresh Report' button" -ForegroundColor Gray
    Write-Host "  6. Check if timestamps now match" -ForegroundColor Gray
} else {
    Write-Host "`n[WARN] Backend may still be starting..." -ForegroundColor Yellow
    Write-Host "Check the backend window for any errors" -ForegroundColor Gray
}

Write-Host ""
