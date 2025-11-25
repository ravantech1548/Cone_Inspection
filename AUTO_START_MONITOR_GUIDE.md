# Auto Start and Monitor Script Guide

## Overview

The `start-and-monitor.ps1` script automatically starts all services, monitors their health, handles failures, and detects IP address changes.

---

## Features

### ✅ Auto Start
- Starts backend (Node.js)
- Starts frontend (Vite)
- Starts inference service (Python with venv)

### ✅ Health Monitoring
- Checks service health every 30 seconds (configurable)
- Tests HTTP endpoints for responsiveness
- Detects process crashes

### ✅ Auto Restart
- Restarts all services if any one fails
- Maximum 3 restart attempts
- Graceful shutdown and restart

### ✅ IP Change Detection
- Monitors Wi-Fi/Ethernet IP address
- Detects DHCP IP changes
- Auto-updates configuration files
- Regenerates SSL certificates
- Restarts services with new IP

### ✅ Configuration Updates
When IP changes, automatically updates:
- `.env` file
- `vite.config.js`
- `app/backend/src/config.js`
- `app/backend/src/index.js`
- SSL certificates

---

## Usage

### Basic Usage

```powershell
# Start and monitor all services
.\start-and-monitor.ps1
```

### With Options

```powershell
# Start without monitoring (manual mode)
.\start-and-monitor.ps1 -NoMonitor

# Custom check interval (60 seconds)
.\start-and-monitor.ps1 -CheckInterval 60
```

---

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `-NoMonitor` | Switch | False | Start services without monitoring |
| `-CheckInterval` | Int | 30 | Health check interval in seconds |

---

## What It Does

### 1. Startup Sequence

```
1. Detect current IP address
2. Stop any existing services
3. Start backend (wait 5s)
4. Start frontend (wait 5s)
5. Start inference service (wait 8s)
6. Verify all services started
7. Begin monitoring (if enabled)
```

### 2. Monitoring Loop

```
Every 30 seconds (default):
1. Check IP address for changes
2. Test backend health (https://IP:3001/health)
3. Test frontend health (https://IP:5173)
4. Test inference health (https://IP:5000)
5. If any service fails → Restart all
6. If all healthy → Continue monitoring
```

### 3. IP Change Handling

```
When IP changes:
1. Detect new IP address
2. Update .env file
3. Update vite.config.js
4. Update backend config files
5. Regenerate SSL certificates
6. Stop all services
7. Restart all services with new IP
```

### 4. Failure Handling

```
When service fails:
1. Log failure
2. Stop all services (clean shutdown)
3. Wait 5 seconds
4. Restart all services
5. Increment restart counter
6. If max restarts reached → Exit with error
```

---

## Output Example

### Startup

```
========================================
Textile Cone Inspector
Auto Start and Monitor
========================================

Current IP: 192.168.1.106

Stopping all services...
✓ All services stopped

========================================
Starting All Services
========================================

Starting Backend...
✓ Backend started (PID: 12345)

Starting Frontend...
✓ Frontend started (PID: 12346)

Starting Inference Service...
✓ Inference service started (PID: 12347)

========================================
✓ All Services Started Successfully!
========================================

Access URLs:
  Frontend:  https://192.168.1.106:5173
  Backend:   https://192.168.1.106:3001
  Inference: https://192.168.1.106:5000

========================================
Monitoring Services
========================================
Check interval: 30 seconds
Press Ctrl+C to stop monitoring

[2025-11-24 22:00:00] Check #1
✓ Backend: Running
✓ Frontend: Running
✓ Inference: Running
```

### IP Change Detected

```
[2025-11-24 22:05:00] Check #11
⚠ IP address changed!

========================================
IP Address Changed!
========================================
Old IP: 192.168.1.106
New IP: 192.168.1.107

Updating .env file...
✓ .env updated
Updating vite.config.js...
✓ vite.config.js updated
Updating backend config.js...
✓ backend config.js updated
Updating backend index.js...
✓ backend index.js updated

Regenerating SSL certificates...
✓ SSL certificates regenerated

✓ All configuration files updated!
Services will be restarted with new IP...

Stopping all services...
✓ All services stopped

Starting all services...
✓ All services started

Access URLs:
  Frontend:  https://192.168.1.107:5173
  Backend:   https://192.168.1.107:3001
  Inference: https://192.168.1.107:5000
```

### Service Failure

```
[2025-11-24 22:10:00] Check #21
✓ Backend: Running
✗ Frontend: Not responding
✓ Inference: Running

⚠ Service failure detected! Restarting all services... (Attempt 1/3)

Stopping all services...
✓ All services stopped

Starting all services...
✓ All services started
```

---

## Requirements

### Software
- PowerShell 5.1 or higher
- Node.js 18+ (installed)
- Python 3.8+ (installed)
- OpenSSL (for certificate generation)

### Project Structure
```
textile-cone-inspector/
├── app/
│   ├── backend/
│   │   └── package.json
│   └── frontend/
│       └── package.json
├── inference-service/
│   ├── venv/
│   │   └── Scripts/
│   │       └── python.exe
│   └── http_server.py
├── certs/
├── .env
└── start-and-monitor.ps1
```

### Dependencies Installed
- Backend: `npm install` completed
- Frontend: `npm install` completed
- Inference: `pip install -r requirements.txt` completed

---

## Configuration

### Check Interval

Adjust monitoring frequency:

```powershell
# Check every 60 seconds
.\start-and-monitor.ps1 -CheckInterval 60

# Check every 10 seconds (more responsive)
.\start-and-monitor.ps1 -CheckInterval 10
```

### Max Restart Attempts

Edit script to change max restarts:

```powershell
# In start-and-monitor.ps1
$global:MaxRestarts = 5  # Default is 3
```

### Service Startup Delays

Edit script to adjust wait times:

```powershell
# After starting backend
Start-Sleep -Seconds 5  # Increase if backend needs more time

# After starting frontend
Start-Sleep -Seconds 5  # Increase if frontend needs more time

# After starting inference
Start-Sleep -Seconds 8  # Increase if inference needs more time
```

---

## Stopping Services

### Graceful Stop

Press `Ctrl+C` in the PowerShell window:

```
^C
Shutting down...
Stopping all services...
✓ All services stopped. Goodbye!
```

### Force Stop

If script is unresponsive:

```powershell
# Kill all Node.js processes
Get-Process node | Stop-Process -Force

# Kill all Python processes
Get-Process python | Stop-Process -Force

# Or kill specific ports
Get-NetTCPConnection -LocalPort 3001,5173,5000 | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

---

## Troubleshooting

### Services Won't Start

**Check logs**:
```powershell
# Backend logs
cd app/backend
npm start

# Frontend logs
cd app/frontend
npm run dev

# Inference logs
cd inference-service
venv\Scripts\activate
python http_server.py
```

**Check ports**:
```powershell
# See what's using the ports
netstat -ano | findstr ":3001"
netstat -ano | findstr ":5173"
netstat -ano | findstr ":5000"
```

### IP Detection Fails

**Manual IP check**:
```powershell
Get-NetIPAddress -AddressFamily IPv4 | 
    Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*"}
```

**Set static IP** in Windows network settings to avoid DHCP changes.

### Virtual Environment Not Found

**Check venv path**:
```powershell
Test-Path "inference-service\venv\Scripts\python.exe"
```

**Recreate if missing**:
```powershell
cd inference-service
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### SSL Certificate Errors

**Check OpenSSL**:
```powershell
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" version
```

**Regenerate manually**:
```powershell
.\generate-ssl-certs.ps1
```

### Max Restarts Reached

**Causes**:
- Service configuration error
- Missing dependencies
- Port conflicts
- Database connection issues

**Solution**:
1. Check service logs
2. Fix underlying issue
3. Restart script

---

## Advanced Usage

### Run as Background Job

```powershell
# Start as background job
Start-Job -FilePath .\start-and-monitor.ps1

# Check job status
Get-Job

# View job output
Receive-Job -Id 1

# Stop job
Stop-Job -Id 1
Remove-Job -Id 1
```

### Run on System Startup

Create a scheduled task:

```powershell
# Create scheduled task
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\path\to\start-and-monitor.ps1"
$trigger = New-ScheduledTaskTrigger -AtStartup
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive
Register-ScheduledTask -TaskName "TextileInspector" -Action $action -Trigger $trigger -Principal $principal
```

### Log to File

Redirect output to log file:

```powershell
.\start-and-monitor.ps1 | Tee-Object -FilePath "monitor.log"
```

---

## Best Practices

### Production Deployment

1. **Use Static IP**: Configure static IP to avoid DHCP changes
2. **Increase Check Interval**: Use 60-120 seconds for production
3. **Enable Logging**: Redirect output to log files
4. **Monitor Logs**: Regularly check for errors
5. **Set Max Restarts**: Increase to 5-10 for production

### Development

1. **Use Default Settings**: 30-second check interval is fine
2. **Monitor Console**: Watch for errors in real-time
3. **Quick Restarts**: Lower check interval (10-15 seconds)

### Network Changes

1. **Static IP Preferred**: Avoids frequent restarts
2. **DHCP Reservation**: Configure router to always assign same IP
3. **Monitor IP Changes**: Script handles automatically

---

## Files Modified by Script

When IP changes, these files are automatically updated:

1. **`.env`**
   - `FRONTEND_URL`
   - `INFERENCE_SERVICE_URL`

2. **`app/frontend/vite.config.js`**
   - Proxy target URL

3. **`app/backend/src/config.js`**
   - Default frontend URL
   - Default inference URL

4. **`app/backend/src/index.js`**
   - Console log messages

5. **`certs/*.pem`**
   - SSL certificates regenerated

---

## Summary

✅ **Auto Start**: All services start automatically  
✅ **Health Monitoring**: Continuous health checks  
✅ **Auto Restart**: Handles service failures  
✅ **IP Detection**: Monitors for IP changes  
✅ **Auto Update**: Updates config files automatically  
✅ **SSL Regen**: Regenerates certificates on IP change  
✅ **Graceful Shutdown**: Clean stop on Ctrl+C  

One script to rule them all! 🚀

---

## Quick Commands

```powershell
# Start with monitoring (default)
.\start-and-monitor.ps1

# Start without monitoring
.\start-and-monitor.ps1 -NoMonitor

# Custom check interval
.\start-and-monitor.ps1 -CheckInterval 60

# Stop services
# Press Ctrl+C

# Force stop
Get-Process node,python | Stop-Process -Force
```
