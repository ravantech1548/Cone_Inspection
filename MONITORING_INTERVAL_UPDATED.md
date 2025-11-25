# Monitoring Interval Updated to 5 Minutes

## Change Summary

The default monitoring interval for `start-and-monitor.ps1` has been changed from **30 seconds** to **5 minutes (300 seconds)**.

## Reason for Change

### Previous: 30 seconds
- Too frequent for production use
- Unnecessary resource usage
- Excessive log output
- Services are generally stable once running

### New: 5 minutes (300 seconds)
- ✅ More appropriate for production monitoring
- ✅ Reduces resource usage
- ✅ Cleaner log output
- ✅ Still catches issues quickly
- ✅ Balances responsiveness with efficiency

## Usage

### Default (5 minutes)
```powershell
.\start-and-monitor.ps1
```

Output:
```
========================================
Monitoring Services
========================================
Check interval: 300 seconds (5.0 minutes)
Press Ctrl+C to stop monitoring
```

### Custom Interval

You can still customize the interval:

**Every 1 minute:**
```powershell
.\start-and-monitor.ps1 -CheckInterval 60
```

**Every 10 minutes:**
```powershell
.\start-and-monitor.ps1 -CheckInterval 600
```

**Every 30 seconds (old default):**
```powershell
.\start-and-monitor.ps1 -CheckInterval 30
```

## Monitoring Timeline

### With 5-minute interval:
```
14:00:00 - Check #1 - All services OK
14:05:00 - Check #2 - All services OK
14:10:00 - Check #3 - All services OK
14:15:00 - Check #4 - All services OK
14:20:00 - Check #5 - All services OK
```

### With 30-second interval (old):
```
14:00:00 - Check #1 - All services OK
14:00:30 - Check #2 - All services OK
14:01:00 - Check #3 - All services OK
14:01:30 - Check #4 - All services OK
14:02:00 - Check #5 - All services OK
... (10 checks per 5 minutes)
```

## Impact on Features

### IP Change Detection
- **Before:** Detected within 30 seconds
- **After:** Detected within 5 minutes
- **Impact:** Minimal - IP changes are rare

### Service Failure Detection
- **Before:** Detected within 30 seconds
- **After:** Detected within 5 minutes
- **Impact:** Acceptable - services rarely crash unexpectedly

### Auto-Restart
- **Before:** Restart triggered within 30 seconds
- **After:** Restart triggered within 5 minutes
- **Impact:** Minimal - most failures are immediate and caught on first check

## Benefits

### 1. Reduced Resource Usage
- Less CPU usage from monitoring checks
- Fewer network requests
- Lower system overhead

### 2. Cleaner Logs
- Less log spam
- Easier to read monitoring output
- Important events stand out

### 3. Production-Ready
- Industry standard monitoring interval
- Appropriate for stable services
- Professional monitoring practice

### 4. Still Responsive
- 5 minutes is quick enough for issue detection
- Services are monitored continuously
- Auto-restart still works effectively

## When to Use Different Intervals

### Use 30-60 seconds when:
- Testing new deployments
- Debugging service issues
- Development environment
- Expecting instability

```powershell
.\start-and-monitor.ps1 -CheckInterval 30
```

### Use 5 minutes (default) when:
- Production environment
- Services are stable
- Normal operations
- Long-term monitoring

```powershell
.\start-and-monitor.ps1
```

### Use 10-15 minutes when:
- Very stable services
- Minimal resource usage needed
- Low-priority monitoring
- Background monitoring

```powershell
.\start-and-monitor.ps1 -CheckInterval 600
```

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

Syncing IP configuration...
  [OK] .env synced
  [OK] inference-service/.env synced
  [OK] vite.config.js synced
  [OK] backend config.js synced
  [OK] backend index.js synced
[OK] IP configuration synced to 192.168.0.6

... (services start) ...

========================================
Monitoring Services
========================================
Check interval: 300 seconds (5.0 minutes)
Press Ctrl+C to stop monitoring

[2024-11-24 14:00:00] Check #1
[OK] Backend:   Running on port 3001
[OK] Frontend:  Running on port 5173
[OK] Inference: Running on port 5000

[2024-11-24 14:05:00] Check #2
[OK] Backend:   Running on port 3001
[OK] Frontend:  Running on port 5173
[OK] Inference: Running on port 5000
```

## Display Format

The monitoring output now shows both seconds and minutes:

```
Check interval: 300 seconds (5.0 minutes)
```

This makes it clear how long between checks without mental math.

### Examples:
- `30 seconds (0.5 minutes)`
- `60 seconds (1.0 minutes)`
- `300 seconds (5.0 minutes)`
- `600 seconds (10.0 minutes)`

## Configuration

### Script Parameter
```powershell
param(
    [switch]$NoMonitor,
    [int]$CheckInterval = 300  # Changed from 30 to 300
)
```

### Default Value
- **Old:** 30 seconds
- **New:** 300 seconds (5 minutes)

## Backward Compatibility

✅ **Fully backward compatible**

If you were using custom intervals, they still work:
```powershell
# This still works exactly the same
.\start-and-monitor.ps1 -CheckInterval 30
```

Only the default value changed.

## Quick Reference

| Interval | Seconds | Use Case |
|----------|---------|----------|
| 30s | 30 | Development, debugging |
| 1min | 60 | Testing, unstable services |
| 5min | 300 | **Production (default)** |
| 10min | 600 | Very stable services |
| 15min | 900 | Background monitoring |

## Files Modified

- ✅ `start-and-monitor.ps1` - Changed default from 30 to 300 seconds
- ✅ `START_MONITOR_GUIDE.md` - Updated documentation
- ✅ `MONITORING_INTERVAL_UPDATED.md` - This document

## Summary

The monitoring interval has been updated to 5 minutes (300 seconds) by default, providing a better balance between responsiveness and resource efficiency for production use. You can still customize the interval using the `-CheckInterval` parameter if needed.

**Default command:**
```powershell
.\start-and-monitor.ps1
```

**Now monitors every 5 minutes instead of every 30 seconds.**
