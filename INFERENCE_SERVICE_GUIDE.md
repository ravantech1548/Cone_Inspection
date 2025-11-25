# Inference Service Guide

## Overview

The inference service is a Python-based HTTPS server that runs YOLO model predictions for textile cone inspection. It uses a virtual environment to manage Python dependencies.

## Virtual Environment Setup

### Initial Setup (One-Time)

```powershell
# Navigate to inference service directory
cd inference-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import torch; print('PyTorch:', torch.__version__)"
python -c "from ultralytics import YOLO; print('YOLO: OK')"
```

### Verify Virtual Environment

```powershell
# Check if venv exists
Test-Path inference-service\venv\Scripts\python.exe

# Check Python version in venv
.\inference-service\venv\Scripts\python.exe --version

# List installed packages
.\inference-service\venv\Scripts\pip.exe list
```

## Starting the Service

### Option 1: Using Start-and-Monitor Script (Recommended)

The `start-and-monitor.ps1` script automatically:
- Activates the virtual environment
- Runs `python http_server.py`
- Monitors the service

```powershell
.\start-and-monitor.ps1
```

**How it works:**
```powershell
# The script runs this command internally:
cd inference-service
.\venv\Scripts\Activate.ps1
python http_server.py
```

### Option 2: Manual Start

Use the dedicated manual start script:

```powershell
.\start-inference-manual.ps1
```

This script:
- Checks if virtual environment exists
- Activates the virtual environment
- Runs the inference service
- Shows helpful error messages

### Option 3: Direct Command

```powershell
# Navigate to inference service directory
cd inference-service

# Activate virtual environment
.\venv\Scripts\activate

# Run the server
python http_server.py
```

## Service Details

### Port and Protocol
- **Port:** 5000
- **Protocol:** HTTPS
- **Certificate:** `certs/inference-cert.pem`
- **Key:** `certs/inference-key.pem`

### Endpoints
- `GET /health` - Health check
- `POST /predict` - Run YOLO prediction on image

### Configuration
The service reads from `inference-service/.env`:
```env
BACKEND_URL=https://192.168.0.6:3001
MODEL_PATH=models/best.pt
CONFIDENCE_THRESHOLD=0.3
```

## Troubleshooting

### Virtual Environment Not Found

**Error:**
```
[ERROR] Virtual environment not found at: inference-service\venv\Scripts\python.exe
```

**Solution:**
```powershell
cd inference-service
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Module Not Found Errors

**Error:**
```
ModuleNotFoundError: No module named 'torch'
ModuleNotFoundError: No module named 'ultralytics'
```

**Solution:**
```powershell
cd inference-service
.\venv\Scripts\activate
pip install -r requirements.txt
```

### Port 5000 Already in Use

**Error:**
```
OSError: [Errno 98] Address already in use
```

**Solution:**
```powershell
# Find process using port 5000
Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess

# Stop the process (replace PID with actual process ID)
Stop-Process -Id <PID> -Force

# Or use the monitor script which handles this automatically
.\start-and-monitor.ps1
```

### SSL Certificate Errors

**Error:**
```
FileNotFoundError: [Errno 2] No such file or directory: 'certs/inference-cert.pem'
```

**Solution:**
```powershell
# Regenerate SSL certificates
.\generate-ssl-certs.ps1

# Or let the monitor script handle it
.\start-and-monitor.ps1
```

### Python Not Found

**Error:**
```
python : The term 'python' is not recognized
```

**Solution:**
1. Install Python 3.8 or higher from python.org
2. Add Python to PATH
3. Verify: `python --version`

### Virtual Environment Activation Failed

**Error:**
```
Activate.ps1 cannot be loaded because running scripts is disabled
```

**Solution:**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Then try again
.\venv\Scripts\activate
```

## Checking Service Status

### Using Status Checker
```powershell
.\check-service-status.ps1
```

Output:
```
[OK] Inference: Running on port 5000
```

### Manual Port Check
```powershell
# Check if port 5000 is listening
Get-NetTCPConnection -LocalPort 5000 -State Listen
```

### Test Health Endpoint
```powershell
# Test the health endpoint
Invoke-WebRequest -Uri "https://192.168.0.6:5000/health" -SkipCertificateCheck
```

## Dependencies

### Required Python Packages
From `requirements.txt`:
```
torch>=2.0.0
torchvision>=0.15.0
ultralytics>=8.0.0
opencv-python>=4.8.0
pillow>=10.0.0
flask>=2.3.0
python-dotenv>=1.0.0
```

### System Requirements
- Python 3.8 or higher
- 4GB RAM minimum (8GB recommended)
- GPU optional (CUDA support for faster inference)

## Virtual Environment Commands Reference

### Activation
```powershell
# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows CMD
.\venv\Scripts\activate.bat

# Check if activated (prompt shows (venv))
# (venv) PS C:\path\to\inference-service>
```

### Deactivation
```powershell
deactivate
```

### Package Management
```powershell
# Install package
pip install package-name

# Install from requirements
pip install -r requirements.txt

# List installed packages
pip list

# Show package info
pip show package-name

# Update package
pip install --upgrade package-name

# Freeze current packages
pip freeze > requirements.txt
```

### Recreate Virtual Environment
```powershell
# Remove old venv
Remove-Item -Recurse -Force venv

# Create new venv
python -m venv venv

# Activate
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Integration with Start-and-Monitor Script

The `start-and-monitor.ps1` script handles the inference service automatically:

### What It Does
1. **Checks Virtual Environment**
   - Verifies `venv\Scripts\python.exe` exists
   - Shows error with setup instructions if missing

2. **Activates Virtual Environment**
   - Runs `.\venv\Scripts\Activate.ps1`
   - Sets up Python path and environment variables

3. **Starts Service**
   - Executes `python http_server.py`
   - Runs in background process

4. **Monitors Health**
   - Checks port 5000 every 30 seconds
   - Auto-restarts if service fails

5. **Handles IP Changes**
   - Updates `inference-service/.env` with new IP
   - Restarts service with new configuration

### Script Command
```powershell
# Internal command used by start-and-monitor.ps1
cd inference-service
.\venv\Scripts\Activate.ps1
python http_server.py
```

## Best Practices

### 1. Always Use Virtual Environment
- ✅ Isolates dependencies
- ✅ Prevents conflicts with system Python
- ✅ Easy to recreate if corrupted

### 2. Keep Dependencies Updated
```powershell
cd inference-service
.\venv\Scripts\activate
pip list --outdated
pip install --upgrade package-name
```

### 3. Use the Monitor Script
- ✅ Automatic virtual environment activation
- ✅ Service health monitoring
- ✅ Auto-restart on failure
- ✅ IP change handling

### 4. Check Logs
```powershell
# The monitor script captures output
# Check console for inference service logs
```

## Quick Reference

| Task | Command |
|------|---------|
| Create venv | `python -m venv venv` |
| Activate venv | `.\venv\Scripts\activate` |
| Install deps | `pip install -r requirements.txt` |
| Start service | `python http_server.py` |
| Start with monitor | `.\start-and-monitor.ps1` |
| Manual start | `.\start-inference-manual.ps1` |
| Check status | `.\check-service-status.ps1` |
| Test health | `Invoke-WebRequest https://IP:5000/health` |
| Deactivate venv | `deactivate` |

## Summary

The inference service requires a Python virtual environment to run. The `start-and-monitor.ps1` script automatically handles:
- ✅ Virtual environment activation
- ✅ Service startup with `python http_server.py`
- ✅ Health monitoring
- ✅ Auto-restart on failure

For manual control, use `.\start-inference-manual.ps1` which provides the same virtual environment activation with interactive output.
