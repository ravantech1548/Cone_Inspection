# PowerShell script to start all services
# Run this in PowerShell: .\start-all.ps1

Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host "  Textile Cone Inspector - Startup Script" -ForegroundColor Cyan
Write-Host "=" -ForegroundColor Cyan -NoNewline
Write-Host ("=" * 59) -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
Write-Host "Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check if Node is installed
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start YOLO inference service
Write-Host "[1/3] Starting YOLO Inference Service..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd inference-service; python http_server.py"
Start-Sleep -Seconds 2

# Start Backend
Write-Host "[2/3] Starting Backend API..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:backend"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[3/3] Starting Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:frontend"
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=" -ForegroundColor Green -NoNewline
Write-Host ("=" * 59) -ForegroundColor Green
Write-Host "  All services started!" -ForegroundColor Green
Write-Host "=" -ForegroundColor Green -NoNewline
Write-Host ("=" * 59) -ForegroundColor Green
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  • YOLO Service:  http://localhost:8000" -ForegroundColor White
Write-Host "  • Backend API:   http://localhost:3001" -ForegroundColor White
Write-Host "  • Frontend:      http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor Yellow
Write-Host "  Username: admin" -ForegroundColor White
Write-Host "  Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "Opening browser..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Press any key to stop all services..." -ForegroundColor Red
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
