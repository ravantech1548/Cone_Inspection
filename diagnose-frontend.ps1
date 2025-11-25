# Frontend Diagnostics Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend Diagnostics" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check current IP
Write-Host "`nChecking network IP..." -ForegroundColor Yellow
$adapters = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop | 
            Where-Object {
                ($_.InterfaceAlias -like "*Wi-Fi*" -or 
                 $_.InterfaceAlias -like "*Ethernet*" -or
                 $_.InterfaceAlias -like "*LAN*") -and
                ($_.IPAddress -notlike "127.*") -and 
                ($_.IPAddress -notlike "169.*")
            }

if ($adapters) {
    $currentIP = $adapters | Select-Object -First 1 -ExpandProperty IPAddress
    Write-Host "[OK] Current IP: $currentIP" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Could not detect IP" -ForegroundColor Red
    $currentIP = "UNKNOWN"
}

# Check service ports
Write-Host "`nChecking service ports..." -ForegroundColor Yellow

$backendPort = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
$frontendPort = Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue
$inferencePort = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue

if ($backendPort) {
    Write-Host "[OK] Backend:   Port 3001 is listening" -ForegroundColor Green
} else {
    Write-Host "[X]  Backend:   Port 3001 NOT listening" -ForegroundColor Red
}

if ($frontendPort) {
    Write-Host "[OK] Frontend:  Port 5173 is listening" -ForegroundColor Green
} else {
    Write-Host "[X]  Frontend:  Port 5173 NOT listening" -ForegroundColor Red
}

if ($inferencePort) {
    Write-Host "[OK] Inference: Port 5000 is listening" -ForegroundColor Green
} else {
    Write-Host "[X]  Inference: Port 5000 NOT listening" -ForegroundColor Red
}

# Check vite.config.js
Write-Host "`nChecking vite.config.js..." -ForegroundColor Yellow
$viteConfig = Get-Content "app\frontend\vite.config.js" -Raw
if ($viteConfig -match "target: useHttps \? 'https://(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):3001'") {
    $configIP = $matches[1]
    if ($configIP -eq $currentIP) {
        Write-Host "[OK] vite.config.js IP matches current IP: $configIP" -ForegroundColor Green
    } else {
        Write-Host "[WARN] vite.config.js IP ($configIP) differs from current IP ($currentIP)" -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] Could not parse vite.config.js" -ForegroundColor Red
}

# Check .env file
Write-Host "`nChecking .env file..." -ForegroundColor Yellow
$envContent = Get-Content ".env" -Raw
if ($envContent -match "FRONTEND_URL=https://(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})") {
    $envIP = $matches[1]
    if ($envIP -eq $currentIP) {
        Write-Host "[OK] .env FRONTEND_URL matches current IP: $envIP" -ForegroundColor Green
    } else {
        Write-Host "[WARN] .env FRONTEND_URL ($envIP) differs from current IP ($currentIP)" -ForegroundColor Yellow
    }
}

# Check Node.js processes
Write-Host "`nChecking Node.js processes..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "[OK] Found $($nodeProcesses.Count) Node.js process(es)" -ForegroundColor Green
    $nodeProcesses | ForEach-Object {
        Write-Host "    PID: $($_.Id), Started: $($_.StartTime)" -ForegroundColor Gray
    }
} else {
    Write-Host "[X]  No Node.js processes found" -ForegroundColor Red
}

# Check Python processes
Write-Host "`nChecking Python processes..." -ForegroundColor Yellow
$pythonProcesses = Get-Process -Name python -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    Write-Host "[OK] Found $($pythonProcesses.Count) Python process(es)" -ForegroundColor Green
} else {
    Write-Host "[X]  No Python processes found" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$issues = @()
if (!$backendPort) { $issues += "Backend not running" }
if (!$frontendPort) { $issues += "Frontend not running" }
if (!$inferencePort) { $issues += "Inference not running" }

if ($issues.Count -eq 0) {
    Write-Host "[OK] All services appear to be running" -ForegroundColor Green
    Write-Host "`nAccess URLs:" -ForegroundColor Yellow
    Write-Host "  Frontend:  https://${currentIP}:5173" -ForegroundColor Cyan
    Write-Host "  Backend:   https://${currentIP}:3001" -ForegroundColor Cyan
    Write-Host "  Inference: https://${currentIP}:5000" -ForegroundColor Cyan
} else {
    Write-Host "[!] Issues detected:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host "`nRecommended action:" -ForegroundColor Yellow
    Write-Host "  Run: .\start-and-monitor.ps1" -ForegroundColor Cyan
}

Write-Host "========================================" -ForegroundColor Cyan
