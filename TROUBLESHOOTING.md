# Troubleshooting Guide

## Frontend Shows Blank Screen / Redirects to /upload

### Quick Fix

1. **Clear browser cache and local storage**:
   - Open browser DevTools (F12)
   - Go to Application tab → Storage → Clear site data
   - Or use Incognito/Private mode

2. **Restart frontend dev server**:
   ```powershell
   # Stop the frontend (Ctrl+C)
   # Then restart
   npm run dev:frontend
   ```

3. **Check browser console** (F12 → Console tab):
   - Look for any error messages
   - Common errors and solutions below

### Common Issues

#### Issue 1: "Failed to load model classes"

**Cause**: YOLO inference service not running

**Solution**:
```powershell
cd inference-service
python http_server.py
```

Expected output:
```
✓ Model loaded from ./models/best.pt
✓ Classes: ['green_brown', 'brown_purple_ring', 'brown_plain']
 * Running on http://0.0.0.0:8000
```

#### Issue 2: "Cannot GET /api/..."

**Cause**: Backend not running

**Solution**:
```powershell
npm run dev:backend
```

Expected output:
```
Server running on http://localhost:3001
Environment: development
```

#### Issue 3: Menu not appearing

**Cause**: Not logged in or authentication issue

**Solution**:
1. Go to http://localhost:3000/login
2. Login with: `admin` / `admin123`
3. Should redirect to /inspection

#### Issue 4: Stuck on old routes (/upload, /admin)

**Cause**: Browser cached old routes

**Solution**:
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Or clear browser cache
3. Routes now redirect to /inspection automatically

### Verification Steps

1. **Check all services are running**:
   ```powershell
   # Terminal 1: YOLO service
   cd inference-service
   python http_server.py
   # Should show: Running on http://0.0.0.0:8000
   
   # Terminal 2: Backend
   npm run dev:backend
   # Should show: Server running on http://localhost:3001
   
   # Terminal 3: Frontend
   npm run dev:frontend
   # Should show: Local: http://localhost:3000
   ```

2. **Test endpoints manually**:
   ```powershell
   # Test backend
   curl http://localhost:3001/health
   # Should return: {"status":"ok"}
   
   # Test YOLO service
   curl http://localhost:8000/health
   # Should return: {"status":"ok"}
   
   # Test model classes
   curl http://localhost:8000/api/model-info
   # Should return model classes
   ```

3. **Check browser console** (F12):
   - Should see no red errors
   - Network tab should show successful API calls

### Still Not Working?

1. **Check ports are not in use**:
   ```powershell
   # Check if ports are available
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   netstat -ano | findstr :8000
   ```

2. **Restart everything**:
   ```powershell
   # Stop all terminals (Ctrl+C)
   # Then start in order:
   
   # 1. YOLO service
   cd inference-service
   python http_server.py
   
   # 2. Backend (new terminal)
   npm run dev:backend
   
   # 3. Frontend (new terminal)
   npm run dev:frontend
   ```

3. **Check database connection**:
   ```powershell
   # Test database
   node test-auth.js
   ```

4. **Reinstall dependencies**:
   ```powershell
   npm run install:all
   ```

### Debug Mode

Enable detailed logging:

1. **Frontend**: Open browser DevTools (F12) → Console
2. **Backend**: Check terminal output for errors
3. **YOLO**: Check Python terminal for errors

### Getting Help

If still having issues, provide:
1. Browser console errors (F12 → Console)
2. Backend terminal output
3. YOLO service terminal output
4. Steps you've tried
