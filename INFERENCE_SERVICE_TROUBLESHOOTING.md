# Inference Service Troubleshooting

## Problem

Frontend shows: **"0 classes detected ⚠️ Make sure YOLO inference service is running"**

---

## Solution: Start the Inference Service

The inference service **must be running** for the application to work.

### Step-by-Step

1. **Open a NEW terminal/PowerShell window** (don't close existing ones)

2. **Navigate to the inference service directory:**
   ```powershell
   cd C:\Users\User\Downloads\coneinspectv1\inference-service
   ```

3. **Activate the Python virtual environment:**
   ```powershell
   .\venv\Scripts\activate
   ```
   
   You should see `(venv)` appear in your prompt.

4. **Start the inference service:**
   ```powershell
   python http_server.py
   ```

5. **Wait for the model to load** (this may take 10-30 seconds)

### Expected Output

```
Loading YOLO model from ./models/best.pt
✓ Model loaded from ./models/best.pt
✓ Classes: ['Brown_purple_ring', 'green_brown', 'brown_plain']

 * Serving Flask app 'http_server'
 * Debug mode: off
✓ HTTPS server running on https://0.0.0.0:5000
  Certificate: ../certs/inference-cert.pem
```

Or if using HTTP:
```
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://100.86.98.82:5000
```

---

## After Starting

1. **Keep the terminal window open** - The service needs to stay running
2. **Go back to your browser**
3. **Refresh the page** (F5)
4. **Model classes should now appear** in the dropdown

---

## Verify It's Working

### Test 1: Check if service is running

Open a new PowerShell window and run:

```powershell
# For HTTP
curl http://localhost:5000/health

# For HTTPS
curl -k https://localhost:5000/health
```

**Expected Response:**
```json
{"status":"healthy","model_loaded":true}
```

### Test 2: Check model classes

```powershell
curl -k https://localhost:5000/api/model-info
```

**Expected Response:**
```json
{
  "classes": ["Brown_purple_ring", "green_brown", "brown_plain"],
  "num_classes": 3,
  "model_type": "YOLO"
}
```

---

## Common Issues

### Issue 1: Model Not Found

**Error:**
```
FileNotFoundError: Model not found at ./models/best.pt
```

**Solution:**
Place your trained YOLO model at:
```
inference-service/models/best.pt
```

### Issue 2: python-dotenv Not Installed

**Error:**
```
ModuleNotFoundError: No module named 'dotenv'
```

**Solution:**
```powershell
cd inference-service
.\venv\Scripts\activate
pip install python-dotenv
```

### Issue 3: Port Already in Use

**Error:**
```
OSError: [WinError 10048] Only one usage of each socket address
```

**Solution:**
Another process is using port 5000. Either:

**Option A: Kill the process**
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Option B: Change the port**
Edit `inference-service/.env`:
```env
PORT=5001
```

Then update `.env` (root):
```env
INFERENCE_SERVICE_URL=https://localhost:5001
```

### Issue 4: Certificate Errors (HTTPS)

**Error:**
```
Certificate files not found, falling back to HTTP
```

**Solution:**
The service will automatically use HTTP. This is fine for development.

To use HTTPS:
```powershell
# Generate certificates
node generate-certs.js
```

---

## All Services Must Run

For the application to work, you need **3 services running simultaneously**:

| Service | Terminal | Command | Port |
|---------|----------|---------|------|
| Backend | Terminal 1 | `cd app/backend && npm start` | 3001 |
| Frontend | Terminal 2 | `cd app/frontend && npm run dev` | 5173 |
| **Inference** | **Terminal 3** | `cd inference-service && venv\Scripts\activate && python http_server.py` | **5000** |

---

## Quick Check: Are All Services Running?

Run this in PowerShell:

```powershell
# Check Backend
curl -k https://localhost:3001/health

# Check Frontend
curl -k https://localhost:5173

# Check Inference
curl -k https://localhost:5000/health
```

All three should respond without errors.

---

## Alternative: Use Start Script

Instead of starting services manually, use:

```powershell
.\start-all.ps1
```

This will start all three services automatically.

---

## Summary

**Current Problem:** Inference service is NOT running

**Solution:**
1. Open new terminal
2. `cd inference-service`
3. `.\venv\Scripts\activate`
4. `python http_server.py`
5. Keep terminal open
6. Refresh browser

**Result:** Model classes will appear and you can start inspecting! 🎉

---

## Still Not Working?

If you've started the service but still see "0 classes detected":

1. **Check backend logs** - Look for connection errors
2. **Restart backend** - Stop (Ctrl+C) and start again
3. **Check .env** - Verify `INFERENCE_SERVICE_URL=https://localhost:5000`
4. **Try HTTP** - Change to `http://localhost:5000` if HTTPS has issues

Need more help? Check the backend terminal for error messages.
