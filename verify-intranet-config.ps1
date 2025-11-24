# Verify Intranet Configuration
# This script checks if all configuration files are properly set up for intranet access

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Intranet Configuration Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current IP address
Write-Host "1. Checking Machine IP Address..." -ForegroundColor Yellow
$ipAddress = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*"}).IPAddress
if ($ipAddress) {
    Write-Host "   ✓ Machine IP: $ipAddress" -ForegroundColor Green
} else {
    Write-Host "   ✗ Could not determine IP address" -ForegroundColor Red
}
Write-Host ""

# Check .env file
Write-Host "2. Checking .env Configuration..." -ForegroundColor Yellow
if (Test-Path .env) {
    $envContent = Get-Content .env -Raw
    
    # Check FRONTEND_URL
    if ($envContent -match "FRONTEND_URL=https://100\.86\.98\.82:5173") {
        Write-Host "   ✓ FRONTEND_URL configured correctly" -ForegroundColor Green
    } else {
        Write-Host "   ✗ FRONTEND_URL not configured for IP address" -ForegroundColor Red
    }
    
    # Check INFERENCE_SERVICE_URL
    if ($envContent -match "INFERENCE_SERVICE_URL=https://100\.86\.98\.82:5000") {
        Write-Host "   ✓ INFERENCE_SERVICE_URL configured correctly" -ForegroundColor Green
    } else {
        Write-Host "   ✗ INFERENCE_SERVICE_URL not configured for IP address" -ForegroundColor Red
    }
    
    # Check DATABASE_URL (should be localhost)
    if ($envContent -match "DATABASE_URL=.*@(localhost|127\.0\.0\.1):5432") {
        Write-Host "   ✓ DATABASE_URL on localhost (secure)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ DATABASE_URL not on localhost" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ .env file not found" -ForegroundColor Red
}
Write-Host ""

# Check backend config
Write-Host "3. Checking Backend Configuration..." -ForegroundColor Yellow
if (Test-Path app\backend\src\config.js) {
    $configContent = Get-Content app\backend\src\config.js -Raw
    
    if ($configContent -match "100\.86\.98\.82") {
        Write-Host "   ✓ Backend config has IP address" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Backend config missing IP address" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ Backend config.js not found" -ForegroundColor Red
}
Write-Host ""

# Check frontend config
Write-Host "4. Checking Frontend Configuration..." -ForegroundColor Yellow
if (Test-Path app\frontend\vite.config.js) {
    $viteContent = Get-Content app\frontend\vite.config.js -Raw
    
    if ($viteContent -match "host: '0\.0\.0\.0'") {
        Write-Host "   ✓ Frontend configured to accept network connections" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Frontend not configured for network access" -ForegroundColor Red
    }
    
    if ($viteContent -match "100\.86\.98\.82") {
        Write-Host "   ✓ Frontend proxy configured with IP address" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Frontend proxy not configured for IP address" -ForegroundColor Red
    }
} else {
    Write-Host "   ✗ Frontend vite.config.js not found" -ForegroundColor Red
}
Write-Host ""

# Check SSL certificates
Write-Host "5. Checking SSL Certificates..." -ForegroundColor Yellow
if (Test-Path certs\backend-cert.pem) {
    Write-Host "   ✓ Backend certificate exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Backend certificate missing" -ForegroundColor Red
}

if (Test-Path certs\backend-key.pem) {
    Write-Host "   ✓ Backend key exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Backend key missing" -ForegroundColor Red
}

if (Test-Path certs\inference-cert.pem) {
    Write-Host "   ✓ Inference certificate exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Inference certificate missing" -ForegroundColor Red
}

if (Test-Path certs\inference-key.pem) {
    Write-Host "   ✓ Inference key exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Inference key missing" -ForegroundColor Red
}
Write-Host ""

# Check firewall rules
Write-Host "6. Checking Windows Firewall..." -ForegroundColor Yellow
$firewallRules = Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Textile*"}

if ($firewallRules) {
    Write-Host "   ✓ Firewall rules found:" -ForegroundColor Green
    $firewallRules | ForEach-Object {
        Write-Host "     - $($_.DisplayName)" -ForegroundColor White
    }
} else {
    Write-Host "   ⚠ No firewall rules found" -ForegroundColor Yellow
    Write-Host "   Run this command as Administrator:" -ForegroundColor Yellow
    Write-Host "   New-NetFirewallRule -DisplayName 'Textile Inspector' -Direction Inbound -Protocol TCP -LocalPort 3001,5000,5173 -Action Allow" -ForegroundColor White
}
Write-Host ""

# Check if ports are in use
Write-Host "7. Checking Port Status..." -ForegroundColor Yellow
$ports = @(3001, 5000, 5173)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "   ✓ Port $port is in use (service running)" -ForegroundColor Green
    } else {
        Write-Host "   ○ Port $port is available (service not running)" -ForegroundColor Gray
    }
}
Write-Host ""

# Check PostgreSQL
Write-Host "8. Checking PostgreSQL..." -ForegroundColor Yellow
$pgService = Get-Service postgresql* -ErrorAction SilentlyContinue
if ($pgService) {
    if ($pgService.Status -eq "Running") {
        Write-Host "   ✓ PostgreSQL service is running" -ForegroundColor Green
    } else {
        Write-Host "   ✗ PostgreSQL service is stopped" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ PostgreSQL service not found" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration Status:" -ForegroundColor White
Write-Host "  Machine IP: $ipAddress" -ForegroundColor White
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor White
Write-Host "  Frontend:  https://$ipAddress:5173" -ForegroundColor Cyan
Write-Host "  Backend:   https://$ipAddress:3001" -ForegroundColor Cyan
Write-Host "  Inference: https://$ipAddress:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Configure firewall (if not done)" -ForegroundColor White
Write-Host "  2. Start all services" -ForegroundColor White
Write-Host "  3. Test access from another device" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see:" -ForegroundColor White
Write-Host "  - QUICK_START_INTRANET.md" -ForegroundColor Cyan
Write-Host "  - INTRANET_CONFIG_COMPLETE.md" -ForegroundColor Cyan
Write-Host ""
