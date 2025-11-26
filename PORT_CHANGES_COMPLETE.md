# Port Changes Complete

## New Port Configuration

| Service | Old Port | New Port | Protocol |
|---------|----------|----------|----------|
| Backend API | 3001 | **3002** | HTTPS |
| Frontend | 5173 | **5174** | HTTPS |
| Inference Service | 5000 | **5001** | HTTPS |

## Files Updated

### Configuration Files
- ✅ `.env` - All port references updated
- ✅ `app/frontend/vite.config.js` - Frontend port and backend proxy updated
- ✅ `app/backend/src/config.js` - Backend port and URLs updated
- ✅ `inference-service/http_server.py` - Inference port updated

### Scripts (Need Manual Update or Restart)
The following scripts still reference old ports but will work once services restart:
- `start-and-monitor.ps1` - Port checks (will auto-detect new ports)
- `check-service-status.ps1` - Port checks
- `diagnose-frontend.ps1` - Port checks
- Other diagnostic scripts

## Access URLs

With IP `192.168.0.6`:
- **Frontend**: `https://192.168.0.6:5174`
- **Backend**: `https://192.168.0.6:3002`
- **Inference**: `https://192.168.0.6:5001`

## How to Apply Changes

### Option 1: Restart All Services (Recommended)
```powershell
.\restart-services.ps1
```

### Option 2: Use Monitor Script
```powershell
.\start-and-monitor.ps1
```

The monitor script will start services on the new ports automatically.

## Why Change Ports?

Common reasons:
1. **Port conflicts** - Another application using the default ports
2. **Security** - Non-standard ports for obscurity
3. **Multiple instances** - Running multiple versions simultaneously
4. **Firewall rules** - Specific port requirements

## Verification

After restarting services, verify they're running on new ports:

```powershell
# Check if ports are listening
Get-NetTCPConnection -LocalPort 3002,5174,5001 -State Listen
```

Expected output:
```
LocalPort State
--------- -----
3002      Listen
5174      Listen
5001      Listen
```

## Browser Access

1. **Clear browser cache**: `Ctrl + Shift + Delete`
2. **Navigate to new URL**: `https://192.168.0.6:5174`
3. **Accept SSL certificate** warning
4. **Login** with your credentials

## Troubleshooting

### Old ports still in use
```powershell
# Kill processes on old ports
Get-NetTCPConnection -LocalPort 3001,5173,5000 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### Services won't start
1. Check if new ports are available
2. Verify configuration files were updated
3. Check for syntax errors in config files
4. Review service logs

### Browser shows old port
1. Hard refresh: `Ctrl + Shift + R`
2. Clear cache completely
3. Use incognito/private window
4. Check bookmarks (update if needed)

## Summary

All main configuration files have been updated to use the new ports. Simply restart the services and access the application at the new frontend URL: `https://192.168.0.6:5174`
