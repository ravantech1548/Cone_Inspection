# Process Hanging Issue Fixed

## Problem

When using `start-and-monitor.ps1`, services would hang and not respond properly, especially during classification. However, starting services individually worked fine.

## Root Cause

The script was using `RedirectStandardOutput` and `RedirectStandardError` but **never reading from these streams**. This caused:

1. **Buffer Overflow**: Output buffers filled up
2. **Process Blocking**: Processes blocked waiting to write output
3. **Hanging Behavior**: Services appeared to run but didn't respond to requests

### The Problematic Code

```powershell
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
$psi.RedirectStandardOutput = $true  # ❌ Redirected but never read
$psi.RedirectStandardError = $true   # ❌ Redirected but never read
```

When Node.js or Python tries to write output (console.log, print statements), the buffer fills up and the process blocks.

## Solution

Changed to use `Start-Process` with separate windows:

```powershell
# Start in a new window so output doesn't block
$process = Start-Process powershell `
    -ArgumentList "-NoExit", "-Command", "cd '$DIR'; npm start" `
    -PassThru `
    -WindowStyle Minimized
```

### Benefits

1. ✅ **No Buffer Blocking**: Output goes to separate window
2. ✅ **Processes Run Freely**: No blocking on stdout/stderr
3. ✅ **Easy Debugging**: Can see logs in minimized windows
4. ✅ **Proper Process Management**: Still get process object for monitoring

## Changes Made

### Backend Service
- **Before**: Redirected output, process blocked
- **After**: Runs in minimized window, output visible

### Frontend Service
- **Before**: Redirected output, process blocked
- **After**: Runs in minimized window, output visible

### Inference Service
- **Before**: Redirected output, process blocked
- **After**: Runs in minimized window, output visible

## How It Works Now

### Service Windows

When you run `.\start-and-monitor.ps1`, it will:

1. **Open 3 minimized PowerShell windows**:
   - Backend (port 3001)
   - Frontend (port 5173)
   - Inference (port 5000)

2. **Keep the main monitoring window** showing status checks

3. **You can view logs** by clicking on the minimized windows in taskbar

### Window Management

- **Minimized by default**: `-WindowStyle Minimized`
- **Stay open**: `-NoExit` keeps windows open
- **Can be maximized**: Click taskbar to see logs
- **Closed on script exit**: Windows close when you stop the monitor script

## Testing

### Before Fix
```
Frontend: Stuck at "Classifying..."
Backend: Port listening but not responding
Inference: Process alive but requests timeout
```

### After Fix
```
Frontend: Classification completes successfully
Backend: Responds to all API requests
Inference: Processes images correctly
```

## Usage

### Start Services
```powershell
.\start-and-monitor.ps1
```

**What happens:**
1. Main window shows startup progress
2. 3 minimized windows open (Backend, Frontend, Inference)
3. Services start and become responsive
4. Main window shows monitoring status

### View Service Logs

To see what's happening in each service:

1. **Look at taskbar** - you'll see 4 PowerShell windows
2. **Click on a minimized window** to see its logs
3. **Backend window**: Shows Express server logs
4. **Frontend window**: Shows Vite dev server logs
5. **Inference window**: Shows Python/YOLO logs

### Stop Services

Press `Ctrl+C` in the main monitoring window:
- All service windows will close
- Ports will be cleaned up
- Processes will be terminated

## Technical Details

### Process Creation

**Old Method (Blocked):**
```powershell
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.UseShellExecute = $false
$psi.RedirectStandardOutput = $true  # Causes blocking
$psi.RedirectStandardError = $true   # Causes blocking
$process = [System.Diagnostics.Process]::Start($psi)
```

**New Method (Works):**
```powershell
$process = Start-Process powershell `
    -ArgumentList "-NoExit", "-Command", $command `
    -PassThru `
    -WindowStyle Minimized
```

### Why This Works

1. **No Redirection**: Output goes to window, not buffer
2. **Separate Process**: Each service runs independently
3. **Non-Blocking**: Services can write unlimited output
4. **Visible Logs**: Can see what's happening in real-time

## Monitoring Still Works

The monitoring functionality is unchanged:

- ✅ Port checking every 5 minutes
- ✅ IP change detection
- ✅ Auto-restart on failure
- ✅ Service health monitoring

The only difference is services now run in separate windows instead of hidden with redirected output.

## Troubleshooting

### Can't See Service Windows

Check your taskbar - they're minimized by default. You should see:
- 1 main monitoring window (visible)
- 3 service windows (minimized)

### Want to See Logs Immediately

Change `-WindowStyle Minimized` to `-WindowStyle Normal` in the script if you want windows to open normally.

### Services Still Hanging

If services still hang:
1. Check if ports are already in use
2. Verify Node.js and Python are installed
3. Check for errors in the service windows
4. Try running services individually to isolate the issue

## Files Modified

- ✅ `start-and-monitor.ps1` - Fixed all three Start-* functions
- ✅ `PROCESS_HANGING_FIXED.md` - This document

## Summary

The hanging issue was caused by redirecting process output without consuming it. The fix uses separate windows for each service, allowing them to write output freely without blocking. This matches how services work when started individually, which is why that method worked fine.

**Result**: Services now work correctly when started with the monitor script! 🎉
