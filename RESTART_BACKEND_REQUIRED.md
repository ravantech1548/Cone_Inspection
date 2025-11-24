# Restart Backend Required

## Problem

Inference service is running, but frontend still shows "0 classes detected".

## Root Cause

The backend code was updated to allow self-signed SSL certificates, but the **backend server was not restarted** to apply the changes.

---

## Solution: Restart the Backend

### Step 1: Stop the Backend

Go to the terminal where the backend is running and press:
```
Ctrl+C
```

### Step 2: Start the Backend Again

```bash
cd app/backend
npm start
```

### Expected Output

```
✓ HTTPS server running on https://localhost:3001
  Environment: development
  Certificate: ../../certs/backend-cert.pem
```

Or if using HTTP:
```
Server running on http://localhost:3001
Environment: development
```

### Step 3: Refresh Frontend

Go back to your browser and refresh the page (F5).

Model classes should now appear!

---

## Verify It's Working

### Check Backend Logs

After restarting, when you refresh the frontend, you should see in the backend logs:

```
[Model] Fetching classes from https://localhost:5000/api/model-info
[Model] Classes loaded: Brown_plain, Brown_purple_ring, Green_brown_shade
```

### Check Frontend

The dropdown should now show:
- Brown_plain
- Brown_purple_ring
- Green_brown_shade

---

## Why Restart is Needed

When you make code changes to the backend:
1. The running Node.js process doesn't automatically reload
2. You must stop (Ctrl+C) and restart (npm start)
3. This applies the new code changes

The changes we made:
- Added SSL certificate handling
- Added `rejectUnauthorized: false` for self-signed certificates
- These changes only take effect after restart

---

## All Three Services

Make sure all three services are running:

| Service | Status | Command |
|---------|--------|---------|
| Backend | ✅ Restart Required | `cd app/backend && npm start` |
| Frontend | ✅ Keep Running | `cd app/frontend && npm run dev` |
| Inference | ✅ Running | `cd inference-service && python http_server.py` |

---

## Still Not Working?

If after restarting the backend you still see "0 classes":

### Option 1: Try HTTP Instead of HTTPS

Edit `.env`:
```env
# Change from:
INFERENCE_SERVICE_URL=https://localhost:5000

# To:
INFERENCE_SERVICE_URL=http://localhost:5000
```

Then restart backend again.

### Option 2: Check Backend Logs

Look for error messages like:
- `fetch failed`
- `ECONNREFUSED`
- `certificate`
- `SSL`

### Option 3: Verify Inference Service

Test the inference service directly:
```bash
curl http://localhost:5000/api/model-info
```

Should return:
```json
{
  "classes": ["Brown_plain", "Brown_purple_ring", "Green_brown_shade"],
  "num_classes": 3
}
```

---

## Summary

**Problem:** Backend not connecting to inference service  
**Cause:** Backend not restarted after code changes  
**Solution:** 
1. Stop backend (Ctrl+C)
2. Start backend (`npm start`)
3. Refresh browser (F5)

**Result:** Model classes will appear! 🎉
