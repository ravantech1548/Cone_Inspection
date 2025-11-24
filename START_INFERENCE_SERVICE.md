# Start Inference Service

## Quick Start

The inference service is **NOT running**. You need to start it in a separate terminal.

### Steps

1. **Open a new terminal/PowerShell window**

2. **Navigate to inference service directory:**
   ```bash
   cd C:\Users\User\Downloads\coneinspectv1\inference-service
   ```

3. **Activate virtual environment:**
   ```bash
   venv\Scripts\activate
   ```

4. **Start the service:**
   ```bash
   python http_server.py
   ```

### Expected Output

```
Loading YOLO model from ./models/best.pt
✓ Model loaded from ./models/best.pt
✓ Classes: ['Brown_purple_ring', 'green_brown', 'brown_plain']
✓ HTTPS server running on https://0.0.0.0:5000
  Certificate: ../certs/inference-cert.pem
```

Or if HTTPS is disabled:
```
* Running on http://127.0.0.1:5000
* Running on http://100.86.98.82:5000
```

---

## Troubleshooting

### Model Not Found

**Error:** `Model not found at ./models/best.pt`

**Solution:** Place your YOLO model at:
```
inference-service/models/best.pt
```

### python-dotenv Not Found

**Error:** `ModuleNotFoundError: No module named 'dotenv'`

**Solution:**
```bash
cd inference-service
venv\Scripts\activate
pip install python-dotenv
```

### Certificate Not Found (HTTPS)

**Error:** `Certificate files not found`

**Solution:** The service will automatically fall back to HTTP. To use HTTPS:
```bash
# Generate certificates
node generate-certs.js

# Or disable HTTPS
# Edit inference-service/.env
USE_HTTPS=false
```

---

## Verify Service is Running

### Test Health Endpoint

**HTTP:**
```bash
curl http://localhost:5000/health
```

**HTTPS:**
```bash
curl -k https://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### Test Model Info

```bash
curl -k https://localhost:5000/api/model-info
```

**Expected Response:**
```json
{
  "classes": ["Brown_purple_ring", "green_brown", "brown_plain"],
  "num_classes": 3,
  "model_type": "YOLO",
  "class_mapping": {
    "0": "Brown_purple_ring",
    "1": "green_brown",
    "2": "brown_plain"
  }
}
```

---

## After Starting

Once the inference service is running:

1. **Refresh the frontend** (F5)
2. **Model classes should appear** in the dropdown
3. **You can start inspecting** cone images

---

## Keep It Running

The inference service needs to stay running while you use the application. Keep the terminal window open.

To stop: Press **Ctrl+C**

---

## Alternative: Use start-all.ps1

Instead of starting services manually, use the start script:

```powershell
.\start-all.ps1
```

This will start all three services (backend, frontend, inference) in separate windows.

---

## Summary

**Current Status:** Inference service is NOT running

**To Fix:**
1. Open new terminal
2. `cd inference-service`
3. `venv\Scripts\activate`
4. `python http_server.py`

**Then:** Refresh frontend and model classes will appear! 🎉
