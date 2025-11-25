# Manual Inference Service Starter
# This script activates the virtual environment and starts the inference service

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Inference Service" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$INFERENCE_DIR = Join-Path $PSScriptRoot "inference-service"
$venvActivate = Join-Path $INFERENCE_DIR "venv\Scripts\Activate.ps1"
$venvPython = Join-Path $INFERENCE_DIR "venv\Scripts\python.exe"
$httpServer = Join-Path $INFERENCE_DIR "http_server.py"

# Check if virtual environment exists
if (!(Test-Path $venvPython)) {
    Write-Host "`n[ERROR] Virtual environment not found!" -ForegroundColor Red
    Write-Host "`nPlease create the virtual environment first:" -ForegroundColor Yellow
    Write-Host "  cd inference-service" -ForegroundColor Gray
    Write-Host "  python -m venv venv" -ForegroundColor Gray
    Write-Host "  .\venv\Scripts\activate" -ForegroundColor Gray
    Write-Host "  pip install -r requirements.txt" -ForegroundColor Gray
    exit 1
}

# Check if http_server.py exists
if (!(Test-Path $httpServer)) {
    Write-Host "`n[ERROR] http_server.py not found at: $httpServer" -ForegroundColor Red
    exit 1
}

Write-Host "`n[OK] Virtual environment found" -ForegroundColor Green
Write-Host "[OK] http_server.py found" -ForegroundColor Green

Write-Host "`nStarting inference service..." -ForegroundColor Yellow
Write-Host "  Directory: $INFERENCE_DIR" -ForegroundColor Gray
Write-Host "  Virtual Env: venv\Scripts\python.exe" -ForegroundColor Gray
Write-Host "  Script: http_server.py" -ForegroundColor Gray

Write-Host "`nActivating virtual environment and starting server..." -ForegroundColor Yellow
Write-Host "(Press Ctrl+C to stop)" -ForegroundColor Gray
Write-Host ""

# Change to inference directory and run
Set-Location $INFERENCE_DIR

# Activate virtual environment and run server
& ".\venv\Scripts\Activate.ps1"
python http_server.py
