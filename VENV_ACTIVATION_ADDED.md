# Virtual Environment Activation Added

## What Changed

The `start-and-monitor.ps1` script now properly activates the Python virtual environment before starting the inference service.

## Previous Behavior

**Before:**
```powershell
# Directly called Python executable
.\inference-service\venv\Scripts\python.exe http_server.py
```

**Issue:** This bypassed virtual environment activation, potentially missing environment variables and path configurations.

## New Behavior

**After:**
```powershell
# Activates virtual environment first, then runs Python
cd inference-service
.\venv\Scripts\Activate.ps1
python http_server.py
```

**Benefits:**
- ✅ Proper virtual environment activation
- ✅ All environment variables set correctly
- ✅ Python path configured properly
- ✅ Matches manual startup process

## How It Works

### In start-and-monitor.ps1

```powershell
function Start-Inference {
    # Check if virtual environment exists
    if (!(Test-Path $venvPython)) {
        # Show helpful error message with setup instructions
        return $false
    }
    
    # Create command that activates venv and runs server
    $command = "cd '$INFERENCE_DIR'; & '.\venv\Scripts\Activate.ps1'; python http_server.py"
    
    # Run in PowerShell with virtual environment activated
    $psi.FileName = "powershell.exe"
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -Command `"$command`""
    
    # Start the process
    $global:InferenceProcess = [System.Diagnostics.Process]::Start($psi)
}
```

### Command Breakdown

1. **Change Directory:** `cd inference-service`
2. **Activate Virtual Environment:** `.\venv\Scripts\Activate.ps1`
3. **Run Server:** `python http_server.py`

This is exactly what you would do manually!

## New Scripts Created

### 1. start-inference-manual.ps1

A standalone script to manually start the inference service with proper virtual environment activation.

**Usage:**
```powershell
.\start-inference-manual.ps1
```

**Features:**
- Checks if virtual environment exists
- Shows helpful error messages
- Activates virtual environment
- Runs inference service
- Interactive output (see logs in real-time)

### 2. INFERENCE_SERVICE_GUIDE.md

Comprehensive documentation covering:
- Virtual environment setup
- Service startup options
- Troubleshooting guide
- Dependencies reference
- Best practices

## Error Messages Improved

### Virtual Environment Not Found

**Old:**
```
[ERROR] Virtual environment not found at: inference-service\venv\Scripts\python.exe
```

**New:**
```
[ERROR] Virtual environment not found at: inference-service\venv\Scripts\python.exe
Please create virtual environment first:
  cd inference-service
  python -m venv venv
  .\venv\Scripts\activate
  pip install -r requirements.txt
```

### Service Failed to Start

**New:**
```
[ERROR] Inference service failed to start
Check if Python dependencies are installed:
  cd inference-service
  .\venv\Scripts\activate
  pip install -r requirements.txt
```

## Startup Process

### Automatic (via start-and-monitor.ps1)

```
Starting Inference Service...
    Using virtual environment: venv\Scripts\python.exe
    Running: python http_server.py
[OK] Inference service started (PID: 12345)
    Waiting for port 5000 to be ready...
```

### Manual (via start-inference-manual.ps1)

```
========================================
Starting Inference Service
========================================

[OK] Virtual environment found
[OK] http_server.py found

Starting inference service...
  Directory: C:\path\to\inference-service
  Virtual Env: venv\Scripts\python.exe
  Script: http_server.py

Activating virtual environment and starting server...
(Press Ctrl+C to stop)

✓ Classes: ['Green_brown_shade', 'Brown_purple_ring', 'Brown_plain']
✓ HTTPS server running on https://0.0.0.0:5000
 * Running on https://192.168.0.6:5000
```

## Virtual Environment Commands

### Setup (One-Time)
```powershell
cd inference-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Verify
```powershell
# Check if venv exists
Test-Path inference-service\venv\Scripts\python.exe

# Check Python version
.\inference-service\venv\Scripts\python.exe --version

# List packages
.\inference-service\venv\Scripts\pip.exe list
```

### Manual Activation
```powershell
cd inference-service
.\venv\Scripts\activate
# Prompt changes to: (venv) PS C:\...\inference-service>
python http_server.py
```

## Integration Points

### 1. Start-and-Monitor Script
- Automatically activates venv
- Runs inference service
- Monitors health
- Auto-restarts on failure

### 2. Manual Start Script
- Interactive startup
- Shows real-time logs
- Helpful error messages
- Easy to debug

### 3. Status Checker
- Checks port 5000
- Shows if service is running
- Non-intrusive

## Benefits

### 1. Consistency
- Same activation method everywhere
- Matches manual process
- Predictable behavior

### 2. Reliability
- Proper environment setup
- All dependencies available
- Correct Python path

### 3. Debugging
- Clear error messages
- Setup instructions included
- Easy to troubleshoot

### 4. Best Practices
- Uses virtual environment correctly
- Isolates dependencies
- Professional Python workflow

## Files Modified

### Updated
- ✅ `start-and-monitor.ps1` - Enhanced inference service startup

### Created
- ✅ `start-inference-manual.ps1` - Manual inference service starter
- ✅ `INFERENCE_SERVICE_GUIDE.md` - Comprehensive guide
- ✅ `VENV_ACTIVATION_ADDED.md` - This document

## Testing

### Test Virtual Environment
```powershell
# Check if venv exists
Test-Path inference-service\venv\Scripts\python.exe
# Output: True

# Check activation script
Test-Path inference-service\venv\Scripts\Activate.ps1
# Output: True
```

### Test Manual Start
```powershell
.\start-inference-manual.ps1
# Should activate venv and start service
```

### Test Automatic Start
```powershell
.\start-and-monitor.ps1
# Should start all services including inference with venv activated
```

## Troubleshooting

### If Virtual Environment Missing

1. Create it:
```powershell
cd inference-service
python -m venv venv
```

2. Activate it:
```powershell
.\venv\Scripts\activate
```

3. Install dependencies:
```powershell
pip install -r requirements.txt
```

### If Activation Fails

```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### If Dependencies Missing

```powershell
cd inference-service
.\venv\Scripts\activate
pip install -r requirements.txt
```

## Summary

The inference service now uses proper Python virtual environment activation:

**Command Flow:**
```
start-and-monitor.ps1
    ↓
Start-Inference function
    ↓
cd inference-service
    ↓
.\venv\Scripts\Activate.ps1
    ↓
python http_server.py
    ↓
Service running on port 5000
```

This ensures the inference service runs with the correct Python environment, all dependencies available, and proper path configuration - just like running it manually!
