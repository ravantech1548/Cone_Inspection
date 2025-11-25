# Textile Cone Inspector - Auto Start and Monitor Script
# This script:
# - Detects current network IP address
# - Checks for existing services on ports 3001, 5173, 5000
# - Starts all services (Backend, Frontend, Inference)
# - Monitors service health via port checking
# - Auto-restarts services if they fail
# - Handles IP address changes automatically

param(
    [switch]$NoMonitor,
    [int]$CheckInterval = 300
)

$ErrorActionPreference = "Continue"

# Configuration
$SCRIPT_DIR = $PSScriptRoot
$BACKEND_DIR = Join-Path $SCRIPT_DIR "app\backend"
$FRONTEND_DIR = Join-Path $SCRIPT_DIR "app\frontend"
$INFERENCE_DIR = Join-Path $SCRIPT_DIR "inference-service"
$ENV_FILE = Join-Path $SCRIPT_DIR ".env"
$VITE_CONFIG = Join-Path $FRONTEND_DIR "vite.config.js"
$BACKEND_CONFIG = Join-Path $SCRIPT_DIR "app\backend\src\config.js"
$BACKEND_INDEX = Join-Path $SCRIPT_DIR "app\backend\src\index.js"

# Service tracking
$global:BackendProcess = $null
$global:FrontendProcess = $null
$global:InferenceProcess = $null
$global:CurrentIP = $null
$global:RestartCount = 0
$global:MaxRestarts = 3

# Colors
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Get current IP address from Wi-Fi or Ethernet
function Get-CurrentIP {
    try {
        # Try to get Wi-Fi or Ethernet adapter IP
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
            $ip = $adapters | Select-Object -First 1 -ExpandProperty IPAddress
            Write-ColorOutput "[INFO] Detected IP from $($adapters[0].InterfaceAlias): $ip" "Gray"
            return $ip
        }
        
        # Fallback: try to get any non-localhost IP
        $fallbackIP = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop | 
                      Where-Object {
                          ($_.IPAddress -notlike "127.*") -and 
                          ($_.IPAddress -notlike "169.*") -and
                          ($_.IPAddress -match "^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$")
                      } | 
                      Select-Object -First 1 -ExpandProperty IPAddress
        
        if ($fallbackIP) {
            Write-ColorOutput "[!] Using fallback IP: $fallbackIP" "Yellow"
            return $fallbackIP
        }
        
        Write-ColorOutput "[!] Could not detect IP address" "Red"
        return $null
    } catch {
        Write-ColorOutput "[!] Error detecting IP address: $_" "Red"
        return $null
    }
}

# Sync current IP to all configuration files
function Sync-IPConfiguration {
    param([string]$CurrentIP)
    
    Write-ColorOutput "`nSyncing IP configuration..." "Yellow"
    
    try {
        # Update .env file - replace any IP pattern
        $envContent = Get-Content $ENV_FILE -Raw
        $envContent = $envContent -replace "FRONTEND_URL=https://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", "FRONTEND_URL=https://$CurrentIP"
        $envContent = $envContent -replace "INFERENCE_SERVICE_URL=https://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", "INFERENCE_SERVICE_URL=https://$CurrentIP"
        Set-Content $ENV_FILE -Value $envContent -NoNewline
        Write-ColorOutput "  [OK] .env synced" "Green"
        
        # Update inference service .env file
        $inferenceEnvFile = Join-Path $INFERENCE_DIR ".env"
        if (Test-Path $inferenceEnvFile) {
            $inferenceEnvContent = Get-Content $inferenceEnvFile -Raw
            $inferenceEnvContent = $inferenceEnvContent -replace "BACKEND_URL=https://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", "BACKEND_URL=https://$CurrentIP"
            Set-Content $inferenceEnvFile -Value $inferenceEnvContent -NoNewline
            Write-ColorOutput "  [OK] inference-service/.env synced" "Green"
        }
        
        # Update vite.config.js - replace any IP pattern
        $viteContent = Get-Content $VITE_CONFIG -Raw
        $viteContent = $viteContent -replace "https://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:3001", "https://${CurrentIP}:3001"
        $viteContent = $viteContent -replace "http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:3001", "http://${CurrentIP}:3001"
        Set-Content $VITE_CONFIG -Value $viteContent -NoNewline
        Write-ColorOutput "  [OK] vite.config.js synced" "Green"
        
        # Update backend config.js - replace any IP pattern
        $configContent = Get-Content $BACKEND_CONFIG -Raw
        $configContent = $configContent -replace "http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", "http://$CurrentIP"
        $configContent = $configContent -replace "https://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", "https://$CurrentIP"
        Set-Content $BACKEND_CONFIG -Value $configContent -NoNewline
        Write-ColorOutput "  [OK] backend config.js synced" "Green"
        
        # Update backend index.js - replace any IP pattern
        $indexContent = Get-Content $BACKEND_INDEX -Raw
        $indexContent = $indexContent -replace "https://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", "https://$CurrentIP"
        $indexContent = $indexContent -replace "http://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}", "http://$CurrentIP"
        Set-Content $BACKEND_INDEX -Value $indexContent -NoNewline
        Write-ColorOutput "  [OK] backend index.js synced" "Green"
        
        Write-ColorOutput "[OK] IP configuration synced to $CurrentIP" "Green"
        return $true
    } catch {
        Write-ColorOutput "[ERROR] Error syncing IP configuration: $_" "Red"
        return $false
    }
}

# Update configuration files with new IP
function Update-IPConfiguration {
    param([string]$NewIP, [string]$OldIP)
    
    Write-ColorOutput "`n========================================" "Cyan"
    Write-ColorOutput "IP Address Changed!" "Yellow"
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "Old IP: $OldIP" "Red"
    Write-ColorOutput "New IP: $NewIP" "Green"
    
    try {
        # Update .env file
        Write-ColorOutput "`nUpdating .env file..." "Yellow"
        $envContent = Get-Content $ENV_FILE -Raw
        $envContent = $envContent -replace "FRONTEND_URL=https://$OldIP", "FRONTEND_URL=https://$NewIP"
        $envContent = $envContent -replace "INFERENCE_SERVICE_URL=https://$OldIP", "INFERENCE_SERVICE_URL=https://$NewIP"
        Set-Content $ENV_FILE -Value $envContent -NoNewline
        Write-ColorOutput "[OK] .env updated" "Green"
        
        # Update inference service .env file
        $inferenceEnvFile = Join-Path $INFERENCE_DIR ".env"
        if (Test-Path $inferenceEnvFile) {
            Write-ColorOutput "Updating inference-service/.env..." "Yellow"
            $inferenceEnvContent = Get-Content $inferenceEnvFile -Raw
            $inferenceEnvContent = $inferenceEnvContent -replace "BACKEND_URL=https://$OldIP", "BACKEND_URL=https://$NewIP"
            Set-Content $inferenceEnvFile -Value $inferenceEnvContent -NoNewline
            Write-ColorOutput "[OK] inference-service/.env updated" "Green"
        }
        
        # Update vite.config.js
        Write-ColorOutput "Updating vite.config.js..." "Yellow"
        $viteContent = Get-Content $VITE_CONFIG -Raw
        $viteContent = $viteContent -replace "https://$OldIP:3001", "https://$NewIP:3001"
        $viteContent = $viteContent -replace "http://$OldIP:3001", "http://$NewIP:3001"
        Set-Content $VITE_CONFIG -Value $viteContent -NoNewline
        Write-ColorOutput "[OK] vite.config.js updated" "Green"
        
        # Update backend config.js
        Write-ColorOutput "Updating backend config.js..." "Yellow"
        $configContent = Get-Content $BACKEND_CONFIG -Raw
        $configContent = $configContent -replace "http://$OldIP", "http://$NewIP"
        $configContent = $configContent -replace "https://$OldIP", "https://$NewIP"
        Set-Content $BACKEND_CONFIG -Value $configContent -NoNewline
        Write-ColorOutput "[OK] backend config.js updated" "Green"
        
        # Update backend index.js
        Write-ColorOutput "Updating backend index.js..." "Yellow"
        $indexContent = Get-Content $BACKEND_INDEX -Raw
        $indexContent = $indexContent -replace "https://$OldIP", "https://$NewIP"
        $indexContent = $indexContent -replace "http://$OldIP", "http://$NewIP"
        Set-Content $BACKEND_INDEX -Value $indexContent -NoNewline
        Write-ColorOutput "[OK] backend index.js updated" "Green"
        
        # Regenerate SSL certificates
        Write-ColorOutput "`nRegenerating SSL certificates..." "Yellow"
        & "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" req -x509 -newkey rsa:4096 -keyout certs\backend-key.pem -out certs\backend-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=$NewIP" -addext "subjectAltName=IP:$NewIP,DNS:localhost" 2>$null
        & "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" req -x509 -newkey rsa:4096 -keyout certs\inference-key.pem -out certs\inference-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=$NewIP" -addext "subjectAltName=IP:$NewIP,DNS:localhost" 2>$null
        Write-ColorOutput "[OK] SSL certificates regenerated" "Green"
        
        Write-ColorOutput "`n[OK] All configuration files updated!" "Green"
        Write-ColorOutput "Services will be restarted with new IP..." "Yellow"
        
        return $true
    } catch {
        Write-ColorOutput "[ERROR] Error updating configuration: $_" "Red"
        return $false
    }
}

# Stop all services
function Stop-AllServices {
    Write-ColorOutput "`nStopping all services..." "Yellow"
    
    # Stop backend
    if ($global:BackendProcess -and !$global:BackendProcess.HasExited) {
        Write-ColorOutput "Stopping backend..." "Yellow"
        Stop-Process -Id $global:BackendProcess.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Stop frontend
    if ($global:FrontendProcess -and !$global:FrontendProcess.HasExited) {
        Write-ColorOutput "Stopping frontend..." "Yellow"
        Stop-Process -Id $global:FrontendProcess.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Stop inference
    if ($global:InferenceProcess -and !$global:InferenceProcess.HasExited) {
        Write-ColorOutput "Stopping inference service..." "Yellow"
        Stop-Process -Id $global:InferenceProcess.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Kill any remaining node/python processes on our ports
    Write-ColorOutput "Cleaning up ports..." "Yellow"
    Get-NetTCPConnection -LocalPort 3001,5173,5000 -ErrorAction SilentlyContinue | 
        ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    
    Start-Sleep -Seconds 3
    Write-ColorOutput "[OK] All services stopped" "Green"
}

# Start backend service
function Start-Backend {
    Write-ColorOutput "`nStarting Backend..." "Yellow"
    
    try {
        # Start in a new window so output doesn't block
        $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND_DIR'; npm start" -PassThru -WindowStyle Minimized
        $global:BackendProcess = $process
        
        Write-ColorOutput "    Process started, waiting for initialization..." "Gray"
        Start-Sleep -Seconds 5
        
        if (!$global:BackendProcess.HasExited) {
            Write-ColorOutput "[OK] Backend started (PID: $($global:BackendProcess.Id))" "Green"
            return $true
        } else {
            Write-ColorOutput "[ERROR] Backend failed to start" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "[ERROR] Error starting backend: $_" "Red"
        return $false
    }
}

# Start frontend service
function Start-Frontend {
    Write-ColorOutput "`nStarting Frontend..." "Yellow"
    
    try {
        # Start in a new window so output doesn't block
        $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$FRONTEND_DIR'; npm run dev" -PassThru -WindowStyle Minimized
        $global:FrontendProcess = $process
        
        Write-ColorOutput "    Process started, waiting for Vite compilation..." "Gray"
        Start-Sleep -Seconds 5
        
        if (!$global:FrontendProcess.HasExited) {
            Write-ColorOutput "[OK] Frontend started (PID: $($global:FrontendProcess.Id))" "Green"
            return $true
        } else {
            Write-ColorOutput "[ERROR] Frontend failed to start" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "[ERROR] Error starting frontend: $_" "Red"
        return $false
    }
}

# Start inference service
function Start-Inference {
    Write-ColorOutput "`nStarting Inference Service..." "Yellow"
    
    try {
        $venvActivate = Join-Path $INFERENCE_DIR "venv\Scripts\Activate.ps1"
        $venvPython = Join-Path $INFERENCE_DIR "venv\Scripts\python.exe"
        $httpServer = Join-Path $INFERENCE_DIR "http_server.py"
        
        # Check if virtual environment exists
        if (!(Test-Path $venvPython)) {
            Write-ColorOutput "[ERROR] Virtual environment not found at: $venvPython" "Red"
            Write-ColorOutput "Please create virtual environment first:" "Yellow"
            Write-ColorOutput "  cd inference-service" "Gray"
            Write-ColorOutput "  python -m venv venv" "Gray"
            Write-ColorOutput "  .\venv\Scripts\activate" "Gray"
            Write-ColorOutput "  pip install -r requirements.txt" "Gray"
            return $false
        }
        
        if (!(Test-Path $httpServer)) {
            Write-ColorOutput "[ERROR] http_server.py not found at: $httpServer" "Red"
            return $false
        }
        
        Write-ColorOutput "    Using virtual environment: venv\Scripts\python.exe" "Gray"
        Write-ColorOutput "    Running: python http_server.py" "Gray"
        
        # Create a PowerShell command that activates venv and runs the server
        $command = "cd '$INFERENCE_DIR'; & '.\venv\Scripts\Activate.ps1'; python http_server.py"
        
        # Start in a new window so output doesn't block
        $process = Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $command -PassThru -WindowStyle Minimized
        $global:InferenceProcess = $process
        
        Write-ColorOutput "    Process started, waiting for model loading..." "Gray"
        Start-Sleep -Seconds 8
        
        if (!$global:InferenceProcess.HasExited) {
            Write-ColorOutput "[OK] Inference service started (PID: $($global:InferenceProcess.Id))" "Green"
            return $true
        } else {
            Write-ColorOutput "[ERROR] Inference service failed to start" "Red"
            Write-ColorOutput "Check if Python dependencies are installed:" "Yellow"
            Write-ColorOutput "  cd inference-service" "Gray"
            Write-ColorOutput "  .\venv\Scripts\activate" "Gray"
            Write-ColorOutput "  pip install -r requirements.txt" "Gray"
            return $false
        }
    } catch {
        Write-ColorOutput "[ERROR] Error starting inference service: $_" "Red"
        return $false
    }
}

# Check if port is in use (listening)
function Test-PortInUse {
    param([int]$Port)
    
    try {
        $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return $connection -ne $null
    } catch {
        return $false
    }
}

# Monitor services
function Monitor-Services {
    Write-ColorOutput "`n========================================" "Cyan"
    Write-ColorOutput "Monitoring Services" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    $intervalMinutes = [math]::Round($CheckInterval / 60, 1)
    Write-ColorOutput "Check interval: $CheckInterval seconds ($intervalMinutes minutes)" "White"
    Write-ColorOutput "Press Ctrl+C to stop monitoring`n" "Yellow"
    
    $checkCount = 0
    
    while ($true) {
        Start-Sleep -Seconds $CheckInterval
        $checkCount++
        
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-ColorOutput "`n[$timestamp] Check #$checkCount" "Cyan"
        
        # Check IP address
        $currentIP = Get-CurrentIP
        if ($currentIP -and $currentIP -ne $global:CurrentIP) {
            Write-ColorOutput "[!] IP address changed!" "Yellow"
            
            if (Update-IPConfiguration -NewIP $currentIP -OldIP $global:CurrentIP) {
                $global:CurrentIP = $currentIP
                Write-ColorOutput "Restarting services with new IP..." "Yellow"
                Stop-AllServices
                Start-Sleep -Seconds 5
                Start-AllServices
                continue
            }
        }
        
        # Check backend (port 3001)
        $backendOk = $false
        $backendPort = Test-PortInUse -Port 3001
        if ($global:BackendProcess -and !$global:BackendProcess.HasExited) {
            if ($backendPort) {
                Write-ColorOutput "[OK] Backend:   Running on port 3001" "Green"
                $backendOk = $true
            } else {
                Write-ColorOutput "[WARN] Backend: Process alive but port 3001 not ready" "Yellow"
                $backendOk = $true  # Give it time, process is still alive
            }
        } else {
            if ($backendPort) {
                Write-ColorOutput "[WARN] Backend: Port 3001 in use but process lost" "Yellow"
                $backendOk = $false
            } else {
                Write-ColorOutput "[X]  Backend:   Not running" "Red"
                $backendOk = $false
            }
        }
        
        # Check frontend (port 5173)
        $frontendOk = $false
        $frontendPort = Test-PortInUse -Port 5173
        if ($global:FrontendProcess -and !$global:FrontendProcess.HasExited) {
            if ($frontendPort) {
                Write-ColorOutput "[OK] Frontend:  Running on port 5173" "Green"
                $frontendOk = $true
            } else {
                Write-ColorOutput "[WARN] Frontend: Process alive but port 5173 not ready" "Yellow"
                $frontendOk = $true  # Give it time, process is still alive
            }
        } else {
            if ($frontendPort) {
                Write-ColorOutput "[WARN] Frontend: Port 5173 in use but process lost" "Yellow"
                $frontendOk = $false
            } else {
                Write-ColorOutput "[X]  Frontend:  Not running" "Red"
                $frontendOk = $false
            }
        }
        
        # Check inference (port 5000)
        $inferenceOk = $false
        $inferencePort = Test-PortInUse -Port 5000
        if ($global:InferenceProcess -and !$global:InferenceProcess.HasExited) {
            if ($inferencePort) {
                Write-ColorOutput "[OK] Inference: Running on port 5000" "Green"
                $inferenceOk = $true
            } else {
                Write-ColorOutput "[WARN] Inference: Process alive but port 5000 not ready" "Yellow"
                $inferenceOk = $true  # Give it time, process is still alive
            }
        } else {
            if ($inferencePort) {
                Write-ColorOutput "[WARN] Inference: Port 5000 in use but process lost" "Yellow"
                $inferenceOk = $false
            } else {
                Write-ColorOutput "[X]  Inference: Not running" "Red"
                $inferenceOk = $false
            }
        }
        
        # If any service is down, restart all
        if (!$backendOk -or !$frontendOk -or !$inferenceOk) {
            $global:RestartCount++
            
            if ($global:RestartCount -gt $global:MaxRestarts) {
                Write-ColorOutput "`n[!] Maximum restart attempts ($global:MaxRestarts) reached!" "Red"
                Write-ColorOutput "Please check logs and restart manually." "Yellow"
                break
            }
            
            Write-ColorOutput "`n[!] Service failure detected! Restarting all services... (Attempt $global:RestartCount/$global:MaxRestarts)" "Yellow"
            Stop-AllServices
            Start-Sleep -Seconds 5
            Start-AllServices
        } else {
            # Reset restart count if all services are healthy
            $global:RestartCount = 0
        }
    }
}

# Start all services
function Start-AllServices {
    Write-ColorOutput "`n========================================" "Cyan"
    Write-ColorOutput "Starting All Services" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    
    $success = $true
    
    # Start services in order: Backend → Inference → Frontend
    Write-ColorOutput "`nStarting services in sequence..." "Cyan"
    Write-ColorOutput "Order: Backend → Inference → Frontend" "Gray"
    
    # 1. Start Backend first (needs to be ready for inference service)
    if (!(Start-Backend)) { 
        $success = $false 
    } else {
        Write-ColorOutput "Waiting for backend to initialize..." "Gray"
        Start-Sleep -Seconds 10
    }
    
    # 2. Start Inference service (needs backend to be ready)
    if (!(Start-Inference)) { 
        $success = $false 
    } else {
        Write-ColorOutput "Waiting for inference service to load model..." "Gray"
        Start-Sleep -Seconds 15
    }
    
    # 3. Start Frontend last (needs backend and inference to be ready)
    if (!(Start-Frontend)) { 
        $success = $false 
    } else {
        Write-ColorOutput "Waiting for frontend to compile..." "Gray"
        Start-Sleep -Seconds 10
    }
    
    if ($success) {
        # Wait for all services to fully initialize
        Write-ColorOutput "`nFinal verification - waiting for all services to be ready..." "Yellow"
        Write-ColorOutput "This may take up to 30 seconds..." "Gray"
        
        # Progressive check with retries
        $maxRetries = 6
        $retryDelay = 5
        
        for ($i = 1; $i -le $maxRetries; $i++) {
            Write-ColorOutput "  Check $i/$maxRetries..." "Gray"
            Start-Sleep -Seconds $retryDelay
            
            $backendReady = Test-PortInUse -Port 3001
            $frontendReady = Test-PortInUse -Port 5173
            $inferenceReady = Test-PortInUse -Port 5000
            
            if ($backendReady -and $frontendReady -and $inferenceReady) {
                Write-ColorOutput "  All ports are ready!" "Green"
                break
            }
        }
        
        # Final check
        $backendReady = Test-PortInUse -Port 3001
        $frontendReady = Test-PortInUse -Port 5173
        $inferenceReady = Test-PortInUse -Port 5000
        
        Write-ColorOutput "`n========================================" "Cyan"
        if ($backendReady -and $frontendReady -and $inferenceReady) {
            Write-ColorOutput "[OK] All Services Running!" "Green"
        } else {
            Write-ColorOutput "[WARN] Services Starting..." "Yellow"
        }
        Write-ColorOutput "========================================" "Cyan"
        
        Write-ColorOutput "`nService Status:" "Yellow"
        if ($backendReady) {
            Write-ColorOutput "  [OK] Backend:   Port 3001 listening" "Green"
        } else {
            Write-ColorOutput "  [WAIT] Backend: Port 3001 starting..." "Yellow"
        }
        
        if ($frontendReady) {
            Write-ColorOutput "  [OK] Frontend:  Port 5173 listening" "Green"
        } else {
            Write-ColorOutput "  [WAIT] Frontend: Port 5173 starting..." "Yellow"
        }
        
        if ($inferenceReady) {
            Write-ColorOutput "  [OK] Inference: Port 5000 listening" "Green"
        } else {
            Write-ColorOutput "  [WAIT] Inference: Port 5000 starting..." "Yellow"
        }
        
        # Get fresh IP in case it changed
        $displayIP = Get-CurrentIP
        if (!$displayIP) { $displayIP = $global:CurrentIP }
        if (!$displayIP) { $displayIP = "IP-NOT-DETECTED" }
        
        Write-ColorOutput "`nAccess URLs:" "Yellow"
        Write-ColorOutput "  Frontend:  https://${displayIP}:5173" "Cyan"
        Write-ColorOutput "  Backend:   https://${displayIP}:3001" "Cyan"
        Write-ColorOutput "  Inference: https://${displayIP}:5000" "Cyan"
        Write-ColorOutput "`nNote: Accept the SSL certificate warnings in your browser" "Gray"
    } else {
        Write-ColorOutput "`n[!] Some services failed to start!" "Red"
    }
    
    return $success
}

# Main execution
try {
    Write-ColorOutput "========================================" "Cyan"
    Write-ColorOutput "Textile Cone Inspector" "Cyan"
    Write-ColorOutput "Auto Start and Monitor" "Cyan"
    Write-ColorOutput "========================================" "Cyan"
    
    # Get current IP
    Write-ColorOutput "`nDetecting network IP address..." "Yellow"
    $global:CurrentIP = Get-CurrentIP
    
    if (!$global:CurrentIP) {
        Write-ColorOutput "[ERROR] Could not detect IP address. Exiting." "Red"
        Write-ColorOutput "Please check your network connection and try again." "Yellow"
        exit 1
    }
    
    Write-ColorOutput "`n[OK] Current IP Address: $global:CurrentIP" "Green"
    
    # Sync IP to all configuration files
    if (!(Sync-IPConfiguration -CurrentIP $global:CurrentIP)) {
        Write-ColorOutput "[WARN] Failed to sync IP configuration, but continuing..." "Yellow"
    }
    
    # Check if services are already running
    Write-ColorOutput "`nChecking for existing services..." "Yellow"
    $backendExists = Test-PortInUse -Port 3001
    $frontendExists = Test-PortInUse -Port 5173
    $inferenceExists = Test-PortInUse -Port 5000
    
    if ($backendExists -or $frontendExists -or $inferenceExists) {
        Write-ColorOutput "`nExisting services detected:" "Yellow"
        if ($backendExists) { Write-ColorOutput "  - Backend on port 3001" "Cyan" }
        if ($frontendExists) { Write-ColorOutput "  - Frontend on port 5173" "Cyan" }
        if ($inferenceExists) { Write-ColorOutput "  - Inference on port 5000" "Cyan" }
        Write-ColorOutput "`nStopping existing services..." "Yellow"
    }
    
    # Stop any existing services
    Stop-AllServices
    
    # Start all services
    if (!(Start-AllServices)) {
        Write-ColorOutput "`n[ERROR] Failed to start services. Check logs and try again." "Red"
        exit 1
    }
    
    # Monitor services if not disabled
    if (!$NoMonitor) {
        Monitor-Services
    } else {
        Write-ColorOutput "`nMonitoring disabled. Services are running." "Yellow"
        Write-ColorOutput "Press Ctrl+C to stop all services." "Yellow"
        
        # Wait for Ctrl+C
        while ($true) {
            Start-Sleep -Seconds 1
        }
    }
    
} catch {
    Write-ColorOutput "`n[ERROR] Fatal error: $_" "Red"
} finally {
    Write-ColorOutput "`n`nShutting down..." "Yellow"
    Stop-AllServices
    Write-ColorOutput "All services stopped. Goodbye!" "Green"
}
