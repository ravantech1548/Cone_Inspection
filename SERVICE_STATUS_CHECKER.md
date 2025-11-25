# Service Status Checker

## Quick Status Check

Use this script to check if services are running **without stopping or interfering** with them:

```powershell
.\check-service-status.ps1
```

## What It Does

- ✅ Checks if ports 3001, 5173, and 5000 are in use
- ✅ Shows which services are running
- ✅ Displays access URLs if services are running
- ✅ **Does NOT stop or restart any services**
- ✅ Safe to run anytime

## Example Output

### All Services Running
```
========================================
Service Status Check
========================================
Current IP: 192.168.0.6

Checking service ports...
[OK] Backend:   Running on port 3001
[OK] Frontend:  Running on port 5173
[OK] Inference: Running on port 5000

========================================
[OK] All services are running!

Access URLs:
  Frontend:  https://192.168.0.6:5173
  Backend:   https://192.168.0.6:3001
  Inference: https://192.168.0.6:5000
========================================
```

### No Services Running
```
========================================
Service Status Check
========================================
Current IP: 192.168.0.6

Checking service ports...
[X]  Backend:   Not running (port 3001 not in use)
[X]  Frontend:  Not running (port 5173 not in use)
[X]  Inference: Not running (port 5000 not in use)

========================================
[!] No services are running
Run .\start-all.ps1 to start services
========================================
```

### Partial Services Running
```
========================================
Service Status Check
========================================
Current IP: 192.168.0.6

Checking service ports...
[OK] Backend:   Running on port 3001
[X]  Frontend:  Not running (port 5173 not in use)
[OK] Inference: Running on port 5000

========================================
[!] 2 of 3 services are running
Some services may need to be started
========================================
```

## Port Information

| Service   | Port | Protocol |
|-----------|------|----------|
| Backend   | 3001 | HTTPS    |
| Frontend  | 5173 | HTTPS    |
| Inference | 5000 | HTTPS    |

## Related Scripts

- `.\start-all.ps1` - Start all services
- `.\start-and-monitor.ps1` - Start and monitor services with auto-restart
- `.\check-service-status.ps1` - Check status (this script)
