# Start and Monitor Script Guide

## Overview

The `start-and-monitor.ps1` script is an all-in-one solution that:
- ✅ Detects your current network IP address
- ✅ Checks if services are already running (port-based)
- ✅ Starts all three services (Backend, Frontend, Inference)
- ✅ Verifies ports are listening
- ✅ Monitors service health continuously
- ✅ Auto-restarts failed services
- ✅ Handles IP address changes automatically

## Usage

### Start with Monitoring (Recommended)
```powershell
.\start-and-monitor.ps1
```

This will:
1. Detect your IP address
2. Check for existing services
3. Stop any existing services
4. Start all services
5. Verify ports are listening
6. Display access URLs
7. Monitor services every 30 seconds

### Start without Monitoring
```powershell
.\start-and-monitor.ps1 -NoMonitor
```

Starts services but doesn't monitor them. Services will run until you press Ctrl+C.

### Custom Check Interval
```powershell
.\start-and-monitor.ps1 -CheckInterval 60
```

Monitor services every 60 seconds instead of default 300 seconds (5 minutes).

## What It Checks

### IP Detection
- Looks for Wi-Fi, Ethernet, or LAN adapters
- Filters out localhost (127.x.x.x) and link-local (169.x.x.x) addresses
- Shows which adapter the IP was detected from

### Port Checking
The script uses **port-based health checks** instead of HTTP requests:

| Service   | Port | Check Method |
|-----------|------|--------------|
| Backend   | 3001 | Port listening check |
| Frontend  | 5173 | Port listening check |
| Inference | 5000 | Port listening check |

This is more reliable and doesn't interfere with running services.

### Service Status Messages

| Message | Meaning |
|---------|---------|
| `[OK] Backend: Running on port 3001` | Service is healthy |
| `[WARN] Backend: Process alive but port not ready` | Service starting up |
| `[WARN] Backend: Port in use but process lost` | Orphaned process detected |
| `[X] Backend: Not running` | Service is down |

## Example Output

### Startup
```
========================================
Textile Cone Inspector
Auto Start and Monitor
========================================

Detecting network IP address...
[INFO] Detected IP from Wi-Fi: 192.168.0.6

[OK] Current IP Address: 192.168.0.6

Checking for existing services...

Existing services detected:
  - Backend on port 3001
  - Frontend on port 5173

Stopping existing services...
Stopping all services...
Cleaning up ports...
[OK] All services stopped

========================================
Starting All Services
========================================

Starting Backend...
[OK] Backend started (PID: 12345)
    Waiting for port 3001 to be ready...

Starting Frontend...
[OK] Frontend started (PID: 12346)
    Waiting for port 5173 to be ready...

Starting Inference Service...
[OK] Inference service started (PID: 12347)
    Waiting for port 5000 to be ready...

Verifying service ports...

========================================
[OK] All Services Running!
========================================

Service Status:
  [OK] Backend:   Port 3001 listening
  [OK] Frontend:  Port 5173 listening
  [OK] Inference: Port 5000 listening

Access URLs:
  Frontend:  https://192.168.0.6:5173
  Backend:   https://192.168.0.6:3001
  Inference: https://192.168.0.6:5000

Note: Accept the SSL certificate warnings in your browser

========================================
Monitoring Services
========================================
Check interval: 300 seconds (5.0 minutes)
Press Ctrl+C to stop monitoring
```

### Monitoring
```
[2024-11-24 14:30:00] Check #1
[OK] Backend:   Running on port 3001
[OK] Frontend:  Running on port 5173
[OK] Inference: Running on port 5000

[2024-11-24 14:35:00] Check #2
[OK] Backend:   Running on port 3001
[OK] Frontend:  Running on port 5173
[OK] Inference: Running on port 5000
```

### IP Change Detection
```
[2024-11-24 14:40:00] Check #3
[!] IP address changed!

========================================
IP Address Changed!
========================================
Old IP: 192.168.0.6
New IP: 192.168.0.10

Updating .env file...
[OK] .env updated
Updating vite.config.js...
[OK] vite.config.js updated
Updating backend config.js...
[OK] backend config.js updated
Updating backend index.js...
[OK] backend index.js updated

Regenerating SSL certificates...
[OK] SSL certificates regenerated

[OK] All configuration files updated!
Services will be restarted with new IP...
Restarting services with new IP...
```

### Service Failure and Auto-Restart
```
[2024-11-24 14:45:00] Check #4
[OK] Backend:   Running on port 3001
[X]  Frontend:  Not running
[OK] Inference: Running on port 5000

[!] Service failure detected! Restarting all services... (Attempt 1/3)
```

## Features

### 1. Non-Intrusive Port Checking
- Uses `Get-NetTCPConnection` to check if ports are listening
- Doesn't make HTTP requests during monitoring
- Won't interfere with running services

### 2. Smart Service Detection
- Checks both process status and port status
- Distinguishes between "starting up" and "failed"
- Detects orphaned processes

### 3. Automatic IP Change Handling
- Monitors IP address every check interval
- Updates all configuration files automatically
- Regenerates SSL certificates with new IP
- Restarts services with new configuration

### 4. Auto-Restart with Limits
- Automatically restarts failed services
- Maximum 3 restart attempts to prevent infinite loops
- Resets counter when all services are healthy

### 5. Clean Shutdown
- Ctrl+C gracefully stops all services
- Cleans up ports before exiting
- Shows goodbye message

## Troubleshooting

### Services Won't Start
1. Check if ports are already in use: `.\check-service-status.ps1`
2. Manually stop services: Stop the script with Ctrl+C
3. Check logs in service directories

### IP Not Detected
- Ensure you're connected to Wi-Fi or Ethernet
- Check network adapter names in Device Manager
- Script will show error and exit if no IP found

### Services Keep Restarting
- Check service logs for errors
- Verify database is running (PostgreSQL)
- Ensure Python virtual environment exists for inference service
- After 3 failed restarts, script will stop and ask you to check logs

## Related Scripts

- `.\check-service-status.ps1` - Quick status check without starting/stopping
- `.\start-all.ps1` - Start services without monitoring
- `.\check-services.ps1` - Legacy service checker

## Tips

1. **Run in a dedicated terminal** - Keep the monitoring window open
2. **Check the output** - Watch for warnings or errors during startup
3. **Wait for ports** - Services may take 5-10 seconds to be fully ready
4. **Accept SSL warnings** - Browser will show certificate warnings (normal for self-signed certs)
5. **Use check-service-status.ps1** - For quick checks without disrupting services
