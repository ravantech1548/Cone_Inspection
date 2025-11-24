# Check Services Status

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Checking Services Status" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check Backend
Write-Host "1. Backend (Port 3001):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✓ Backend is running (HTTP)" -ForegroundColor Green
} catch {
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:3001/health" -UseBasicParsing -TimeoutSec 2 -SkipCertificateCheck -ErrorAction Stop
        Write-Host "   ✓ Backend is running (HTTPS)" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ Backend is NOT running" -ForegroundColor Red
    }
}

Write-Host ""

# Check Frontend
Write-Host "2. Frontend (Port 5173):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✓ Frontend is running (HTTP)" -ForegroundColor Green
} catch {
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:5173" -UseBasicParsing -TimeoutSec 2 -SkipCertificateCheck -ErrorAction Stop
        Write-Host "   ✓ Frontend is running (HTTPS)" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ Frontend is NOT running" -ForegroundColor Red
    }
}

Write-Host ""

# Check Inference Service
Write-Host "3. Inference Service (Port 5000):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    Write-Host "   ✓ Inference service is running (HTTP)" -ForegroundColor Green
    $health = $response.Content | ConvertFrom-Json
    Write-Host "   - Model loaded: $($health.model_loaded)" -ForegroundColor White
} catch {
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:5000/health" -UseBasicParsing -TimeoutSec 2 -SkipCertificateCheck -ErrorAction Stop
        Write-Host "   ✓ Inference service is running (HTTPS)" -ForegroundColor Green
        $health = $response.Content | ConvertFrom-Json
        Write-Host "   - Model loaded: $($health.model_loaded)" -ForegroundColor White
    } catch {
        Write-Host "   ✗ Inference service is NOT running" -ForegroundColor Red
        Write-Host "   Start it with:" -ForegroundColor Yellow
        Write-Host "     cd inference-service" -ForegroundColor White
        Write-Host "     venv\Scripts\activate" -ForegroundColor White
        Write-Host "     python http_server.py" -ForegroundColor White
    }
}

Write-Host ""

# Check Model Info
Write-Host "4. Model Info:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/model-info" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
    $modelInfo = $response.Content | ConvertFrom-Json
    Write-Host "   ✓ Model info available (HTTP)" -ForegroundColor Green
    Write-Host "   - Classes: $($modelInfo.classes -join ', ')" -ForegroundColor White
    Write-Host "   - Num classes: $($modelInfo.num_classes)" -ForegroundColor White
} catch {
    try {
        $response = Invoke-WebRequest -Uri "https://localhost:5000/api/model-info" -UseBasicParsing -TimeoutSec 2 -SkipCertificateCheck -ErrorAction Stop
        $modelInfo = $response.Content | ConvertFrom-Json
        Write-Host "   ✓ Model info available (HTTPS)" -ForegroundColor Green
        Write-Host "   - Classes: $($modelInfo.classes -join ', ')" -ForegroundColor White
        Write-Host "   - Num classes: $($modelInfo.num_classes)" -ForegroundColor White
    } catch {
        Write-Host "   ✗ Cannot get model info" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If inference service is not running:" -ForegroundColor White
Write-Host "1. Open a new terminal" -ForegroundColor White
Write-Host "2. cd inference-service" -ForegroundColor White
Write-Host "3. venv\Scripts\activate" -ForegroundColor White
Write-Host "4. python http_server.py" -ForegroundColor White
Write-Host ""
