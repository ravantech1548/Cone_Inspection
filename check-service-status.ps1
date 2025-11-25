# Simple Service Status Checker - Non-intrusive port check
# This script only checks if services are running, does not stop or start anything

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Get-CurrentIP {
    try {
        $adapters = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop | 
                    Where-Object {
                        ($_.InterfaceAlias -like "*Wi-Fi*" -or 
                         $_.InterfaceAlias -like "*Ethernet*" -or
                         $_.InterfaceAlias -like "*LAN*") -and
                        ($_.IPAddress -notlike "127.*") -and 
                        ($_.IPAddress -notlike "169.*") -and
                        ($_.PrefixOrigin -eq "Dhcp" -or $_.PrefixOrigin -eq "Manual")
                    }
        
        if ($adapters) {
            return $adapters | Select-Object -First 1 -ExpandProperty IPAddress
        }
        return $null
    } catch {
        return $null
    }
}

function Test-PortInUse {
    param([int]$Port)
    
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return $connection -ne $null
    } catch {
        return $false
    }
}

# Main
Write-ColorOutput "`n========================================" "Cyan"
Write-ColorOutput "Service Status Check" "Cyan"
Write-ColorOutput "========================================" "Cyan"

$currentIP = Get-CurrentIP
if ($currentIP) {
    Write-ColorOutput "Current IP: $currentIP" "Gray"
} else {
    Write-ColorOutput "Current IP: Not detected" "Yellow"
}

Write-ColorOutput "`nChecking service ports..." "Yellow"

# Check Backend (port 3001)
$backendRunning = Test-PortInUse -Port 3001
if ($backendRunning) {
    Write-ColorOutput "[OK] Backend:   Running on port 3001" "Green"
} else {
    Write-ColorOutput "[X]  Backend:   Not running (port 3001 not in use)" "Red"
}

# Check Frontend (port 5173)
$frontendRunning = Test-PortInUse -Port 5173
if ($frontendRunning) {
    Write-ColorOutput "[OK] Frontend:  Running on port 5173" "Green"
} else {
    Write-ColorOutput "[X]  Frontend:  Not running (port 5173 not in use)" "Red"
}

# Check Inference (port 5000)
$inferenceRunning = Test-PortInUse -Port 5000
if ($inferenceRunning) {
    Write-ColorOutput "[OK] Inference: Running on port 5000" "Green"
} else {
    Write-ColorOutput "[X]  Inference: Not running (port 5000 not in use)" "Red"
}

# Summary
Write-ColorOutput "`n========================================" "Cyan"
$runningCount = @($backendRunning, $frontendRunning, $inferenceRunning) | Where-Object { $_ } | Measure-Object | Select-Object -ExpandProperty Count

if ($runningCount -eq 3) {
    Write-ColorOutput "[OK] All services are running!" "Green"
    
    if ($currentIP) {
        Write-ColorOutput "`nAccess URLs:" "Yellow"
        Write-ColorOutput "  Frontend:  https://${currentIP}:5173" "Cyan"
        Write-ColorOutput "  Backend:   https://${currentIP}:3001" "Cyan"
        Write-ColorOutput "  Inference: https://${currentIP}:5000" "Cyan"
    }
} elseif ($runningCount -eq 0) {
    Write-ColorOutput "[!] No services are running" "Red"
    Write-ColorOutput "Run .\start-all.ps1 to start services" "Yellow"
} else {
    Write-ColorOutput "[!] $runningCount of 3 services are running" "Yellow"
    Write-ColorOutput "Some services may need to be started" "Yellow"
}

Write-ColorOutput "========================================" "Cyan"
