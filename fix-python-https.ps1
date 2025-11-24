# Fix Python HTTPS - Install python-dotenv and restart service

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Fixing Python HTTPS Configuration" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to inference service
Set-Location inference-service

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install python-dotenv
Write-Host "Installing python-dotenv..." -ForegroundColor Yellow
pip install python-dotenv==1.0.0

Write-Host ""
Write-Host "✓ python-dotenv installed" -ForegroundColor Green
Write-Host ""

# Verify .env file
Write-Host "Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "USE_HTTPS=true") {
        Write-Host "✓ USE_HTTPS=true" -ForegroundColor Green
    } else {
        Write-Host "⚠️  USE_HTTPS not set to true" -ForegroundColor Yellow
    }
    
    if ($envContent -match "TLS_CERT_PATH") {
        Write-Host "✓ TLS_CERT_PATH configured" -ForegroundColor Green
    }
    
    if ($envContent -match "TLS_KEY_PATH") {
        Write-Host "✓ TLS_KEY_PATH configured" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  .env file not found" -ForegroundColor Yellow
}

Write-Host ""

# Check certificates
Write-Host "Checking SSL certificates..." -ForegroundColor Yellow
if (Test-Path "../certs/inference-cert.pem") {
    Write-Host "✓ inference-cert.pem found" -ForegroundColor Green
} else {
    Write-Host "✗ inference-cert.pem not found" -ForegroundColor Red
}

if (Test-Path "../certs/inference-key.pem") {
    Write-Host "✓ inference-key.pem found" -ForegroundColor Green
} else {
    Write-Host "✗ inference-key.pem not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Stop the current Python service (Ctrl+C)" -ForegroundColor White
Write-Host "2. Restart it: python http_server.py" -ForegroundColor White
Write-Host "3. You should see: HTTPS server running on https://0.0.0.0:5000" -ForegroundColor White
Write-Host ""

# Return to root directory
Set-Location ..
