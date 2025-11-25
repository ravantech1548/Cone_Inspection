# IP Sync Feature Added to Start-and-Monitor Script

## What's New

The `start-and-monitor.ps1` script now includes automatic IP synchronization that ensures all configuration files are updated with your current network IP address.

## Features Added

### 1. Initial IP Sync on Startup
When you run the script, it now:
- Detects your current IP address
- **Automatically syncs the IP to ALL configuration files**
- Ensures consistency across the entire application
- Updates happen before services start

### 2. Enhanced Configuration Files Coverage

The script now updates **6 configuration files**:

| File | What Gets Updated |
|------|-------------------|
| `.env` | FRONTEND_URL, INFERENCE_SERVICE_URL |
| `inference-service/.env` | BACKEND_URL |
| `app/frontend/vite.config.js` | Proxy target for API calls |
| `app/backend/src/config.js` | Frontend and inference URLs |
| `app/backend/src/index.js` | Server console messages |
| SSL Certificates | Regenerated with new IP |

### 3. Smart IP Pattern Matching

The sync function uses regex patterns to find and replace ANY IP address:
```powershell
# Before: https://192.168.1.106:3001
# After:  https://192.168.0.6:3001

# Pattern: \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}
```

This means it will work regardless of what IP was previously configured.

## How It Works

### On Script Startup
```
1. Detect current IP address (e.g., 192.168.0.6)
2. Sync IP to all configuration files
3. Check for existing services
4. Stop existing services
5. Start all services with correct IP
6. Verify ports are listening
7. Display access URLs
```

### During Monitoring
```
1. Check IP address every 30 seconds
2. If IP changed:
   - Update all configuration files
   - Regenerate SSL certificates
   - Restart all services
   - Continue monitoring
```

## Configuration Files Updated

### Main .env File
```env
FRONTEND_URL=https://192.168.0.6:5173
INFERENCE_SERVICE_URL=https://192.168.0.6:5000
```

### Inference Service .env
```env
BACKEND_URL=https://192.168.0.6:3001
```

### Frontend vite.config.js
```javascript
proxy: {
  '/api': {
    target: useHttps ? 'https://192.168.0.6:3001' : 'http://192.168.0.6:3001',
    changeOrigin: true,
    secure: false,
  }
}
```

### Backend config.js
```javascript
frontendUrl: process.env.FRONTEND_URL || 'http://192.168.0.6:5173'
serviceUrl: process.env.INFERENCE_SERVICE_URL || 'http://192.168.0.6:5000'
```

### Backend index.js
```javascript
console.log(`✓ HTTPS server running on https://192.168.0.6:${config.port}`)
```

## Example Output

### Startup with IP Sync
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

Checking for existing services...
...
```

### IP Change Detection
```
[2024-11-24 15:00:00] Check #10
[!] IP address changed!

========================================
IP Address Changed!
========================================
Old IP: 192.168.0.6
New IP: 192.168.0.10

Updating .env file...
[OK] .env updated
Updating inference-service/.env...
[OK] inference-service/.env updated
Updating vite.config.js...
[OK] vite.config.js updated
Updating backend config.js...
[OK] backend config.js updated
Updating backend index.js...
[OK] backend index.js updated

Regenerating SSL certificates...
[OK] SSL certificates regenerated

[OK] All configuration files updated!
Services will be restarted with new IP...
```

## Benefits

### 1. Zero Manual Configuration
- No need to manually edit config files
- No need to remember which files to update
- Script handles everything automatically

### 2. Always Up-to-Date
- IP is synced on every startup
- Changes are detected during monitoring
- Services always use the correct IP

### 3. Network Flexibility
- Switch between Wi-Fi networks
- Change from Wi-Fi to Ethernet
- DHCP IP changes handled automatically

### 4. Consistent Configuration
- All files use the same IP
- No mismatches between services
- Reduces configuration errors

## Usage

### Start with IP Sync (Automatic)
```powershell
.\start-and-monitor.ps1
```

The script will automatically:
1. Detect your IP
2. Sync all config files
3. Start services
4. Monitor for changes

### Check Current Configuration
```powershell
# Check vite.config.js
Get-Content app/frontend/vite.config.js | Select-String "target:"

# Check .env
Get-Content .env | Select-String "URL"

# Check inference .env
Get-Content inference-service/.env | Select-String "BACKEND_URL"
```

## Technical Details

### Sync Function
```powershell
function Sync-IPConfiguration {
    param([string]$CurrentIP)
    
    # Uses regex to find and replace any IP address pattern
    # Pattern: \d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}
    
    # Updates:
    # - .env (main)
    # - inference-service/.env
    # - vite.config.js
    # - backend config.js
    # - backend index.js
}
```

### Update Function (for IP changes)
```powershell
function Update-IPConfiguration {
    param([string]$NewIP, [string]$OldIP)
    
    # Same as Sync but also:
    # - Regenerates SSL certificates
    # - Shows detailed change information
    # - Triggers service restart
}
```

## Files Modified

### Script Files
- ✅ `start-and-monitor.ps1` - Added IP sync functionality

### Configuration Files (Auto-Updated)
- ✅ `.env` - Main environment variables
- ✅ `inference-service/.env` - Inference service config
- ✅ `app/frontend/vite.config.js` - Frontend proxy config
- ✅ `app/backend/src/config.js` - Backend configuration
- ✅ `app/backend/src/index.js` - Backend server startup

### Documentation
- ✅ `IP_SYNC_FEATURE_ADDED.md` - This document
- ✅ `START_MONITOR_GUIDE.md` - Updated with IP sync info

## Current Status

✅ **All configuration files are now synced to: 192.168.0.6**

The script is ready to use and will maintain IP consistency automatically.

## Next Steps

1. Run the script: `.\start-and-monitor.ps1`
2. Access the application at: `https://192.168.0.6:5173`
3. The script will handle any IP changes automatically

## Troubleshooting

### IP Sync Failed
If you see `[WARN] Failed to sync IP configuration`, check:
- File permissions (can the script write to config files?)
- Files exist (all config files present?)
- Syntax errors in config files

### Wrong IP Detected
If the script detects the wrong IP:
- Check your network adapters
- Ensure Wi-Fi/Ethernet is connected
- Script prioritizes Wi-Fi, then Ethernet, then LAN

### Services Won't Start After Sync
- Check if ports are already in use
- Verify SSL certificates were generated
- Check service logs for errors

## Summary

The start-and-monitor script now provides complete IP management:
- ✅ Automatic IP detection
- ✅ Initial IP sync on startup
- ✅ Continuous IP monitoring
- ✅ Automatic updates on IP change
- ✅ SSL certificate regeneration
- ✅ Service restart with new IP

No manual configuration needed - just run the script and it handles everything!
