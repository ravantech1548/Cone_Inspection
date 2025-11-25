# Startup Sequence Optimized

## Changes Made

The `start-and-monitor.ps1` script has been optimized with:
1. ✅ Proper startup sequence: Backend → Inference → Frontend
2. ✅ Longer delays between services
3. ✅ Progressive port verification with retries
4. ✅ Fixed stdout/stderr blocking issue

## New Startup Sequence

### 1. Backend (Port 3001)
- **Starts first** - Must be ready for other services
- **Initial wait**: 5 seconds
- **Additional delay**: 10 seconds before next service
- **Total**: ~15 seconds

### 2. Inference Service (Port 5000)
- **Starts second** - Needs backend to be available
- **Initial wait**: 8 seconds (model loading time)
- **Additional delay**: 15 seconds before next service
- **Total**: ~23 seconds

### 3. Frontend (Port 5173)
- **Starts last** - Needs backend and inference ready
- **Initial wait**: 5 seconds (Vite compilation)
- **Additional delay**: 10 seconds for final verification
- **Total**: ~15 seconds

### 4. Final Verification
- **Progressive checks**: Up to 6 retries
- **Retry interval**: 5 seconds
- **Maximum wait**: 30 seconds
- **Checks all ports**: 3001, 5173, 5000

## Total Startup Time

**Minimum**: ~50 seconds
**Maximum**: ~80 seconds (with retries)

This ensures all services are fully initialized before the system is considered ready.

## Startup Timeline

```
00:00 - Start Backend
00:05 - Backend process confirmed
00:15 - Start Inference Service
00:23 - Inference process confirmed
00:38 - Start Frontend
00:43 - Frontend process confirmed
00:53 - Begin port verification
00:53 - Check 1/6
00:58 - Check 2/6
01:03 - Check 3/6
01:08 - Check 4/6
01:13 - Check 5/6
01:18 - Check 6/6
01:18 - All services ready!
```

## Why This Sequence?

### Backend First
- Other services depend on backend API
- Must be ready to accept connections
- Database connections need to be established

### Inference Second
- Needs to load YOLO model (takes time)
- Backend may call inference service
- Heavy initialization process

### Frontend Last
- Depends on backend API being available
- Vite dev server compiles on startup
- Can start quickly once backend is ready

## Delays Explained

### Initial Process Delays
```powershell
Backend:    5 seconds  - Process startup
Inference:  8 seconds  - Model loading
Frontend:   5 seconds  - Vite compilation
```

### Inter-Service Delays
```powershell
After Backend:    10 seconds - Ensure API is ready
After Inference:  15 seconds - Ensure model is loaded
After Frontend:   10 seconds - Ensure compilation done
```

### Verification Delays
```powershell
Progressive checks: 6 retries × 5 seconds = 30 seconds max
```

## Output Example

```
========================================
Starting All Services
========================================

Starting services in sequence...
Order: Backend → Inference → Frontend

Starting Backend...
    Process started, waiting for initialization...
[OK] Backend started (PID: 12345)
Waiting for backend to initialize...

Starting Inference Service...
    Using virtual environment: venv\Scripts\python.exe
    Running: python http_server.py
    Process started, waiting for model loading...
[OK] Inference service started (PID: 12346)
Waiting for inference service to load model...

Starting Frontend...
    Process started, waiting for Vite compilation...
[OK] Frontend started (PID: 12347)
Waiting for frontend to compile...

Final verification - waiting for all services to be ready...
This may take up to 30 seconds...
  Check 1/6...
  Check 2/6...
  Check 3/6...
  All ports are ready!

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
```

## Benefits

### 1. Reliable Startup
- Services start in correct order
- Each service has time to initialize
- No race conditions

### 2. Better Error Detection
- Progressive verification catches issues
- Retries handle slow startups
- Clear status messages

### 3. Production Ready
- Handles slow systems
- Accounts for model loading time
- Ensures all services are truly ready

### 4. No Blocking Issues
- Services run in separate windows
- No stdout/stderr buffer overflow
- Processes can output freely

## Troubleshooting

### Services Not Ready After 80 Seconds

**Check:**
1. Look at the minimized service windows for errors
2. Verify Node.js and Python are installed
3. Check if ports are already in use
4. Ensure virtual environment exists for inference

**Solutions:**
```powershell
# Check service status
.\check-service-status.ps1

# View service windows
# Click on minimized windows in taskbar

# Restart services
.\restart-services.ps1
```

### One Service Fails to Start

The script will continue with other services but mark overall startup as failed. Check the specific service window for error messages.

### Ports Not Listening

If verification shows ports not ready:
1. Services may need more time (increase delays)
2. Check for errors in service windows
3. Verify dependencies are installed
4. Check firewall settings

## Configuration

### Adjust Delays

If your system is slower, you can increase delays in the script:

```powershell
# In Start-AllServices function
Start-Sleep -Seconds 10  # Increase from 10 to 15
Start-Sleep -Seconds 15  # Increase from 15 to 20
Start-Sleep -Seconds 10  # Increase from 10 to 15

# In verification section
$maxRetries = 6          # Increase to 10
$retryDelay = 5          # Increase to 10
```

### Change Startup Order

The current order (Backend → Inference → Frontend) is optimal, but you can change it if needed by reordering the service start calls in the `Start-AllServices` function.

## Service Windows

When services start, you'll see 4 PowerShell windows:

1. **Main Monitor Window** (visible)
   - Shows startup progress
   - Displays monitoring status
   - Control point for stopping services

2. **Backend Window** (minimized)
   - Express server logs
   - API request logs
   - Database connection status

3. **Inference Window** (minimized)
   - Python/YOLO logs
   - Model loading messages
   - Prediction results

4. **Frontend Window** (minimized)
   - Vite dev server logs
   - Compilation messages
   - Hot reload notifications

## Monitoring

After startup, the script monitors services every 5 minutes:
- Checks if ports are listening
- Detects IP address changes
- Auto-restarts failed services
- Maximum 3 restart attempts

## Files Modified

- ✅ `start-and-monitor.ps1` - Optimized startup sequence
- ✅ `STARTUP_SEQUENCE_OPTIMIZED.md` - This document

## Summary

The startup sequence is now:
1. **Backend** starts first (15s)
2. **Inference** starts second (23s)
3. **Frontend** starts last (15s)
4. **Verification** ensures all ready (up to 30s)

**Total time**: 50-80 seconds for complete, verified startup.

This ensures reliable, production-ready service initialization with no blocking issues!
