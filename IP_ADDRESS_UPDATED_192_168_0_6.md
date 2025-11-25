# IP Address Updated to 192.168.0.6

## Network Change Detected

Your machine's IP address has changed from **192.168.1.106** to **192.168.0.6**.

All configuration files have been updated automatically.

---

## New IP Address

**Current IP**: 192.168.0.6  
**Network**: Wi-Fi or Ethernet  
**Previous IP**: 192.168.1.106  

---

## Updated Configuration Files

1. **`.env`**
   - `FRONTEND_URL=https://192.168.0.6:5173`
   - `INFERENCE_SERVICE_URL=https://192.168.0.6:5000`

2. **`app/frontend/vite.config.js`**
   - Proxy target: `https://192.168.0.6:3001`

3. **`app/backend/src/config.js`**
   - Default URLs updated to 192.168.0.6

4. **`app/backend/src/index.js`**
   - Console messages updated to 192.168.0.6

5. **`check-services.ps1`**
   - Health check URLs updated to 192.168.0.6

6. **SSL Certificates**
   - Regenerated with IP: 192.168.0.6
   - Subject Alternative Name includes: IP:192.168.0.6, DNS:localhost

---

## New Access URLs

### From Any Device on Your Network:
- **Frontend**: https://192.168.0.6:5173
- **Backend**: https://192.168.0.6:3001
- **Inference**: https://192.168.0.6:5000

### From Local Machine (Still Works):
- **Frontend**: https://localhost:5173
- **Backend**: https://localhost:3001
- **Inference**: https://localhost:5000

---

## Next Steps

### 1. Restart All Services

The configuration has been updated, now restart services:

```powershell
# Use the auto-start script
.\start-and-monitor.ps1
```

Or manually:

```powershell
# Terminal 1: Backend
cd app\backend
npm start

# Terminal 2: Frontend
cd app\frontend
npm run dev

# Terminal 3: Inference
cd inference-service
venv\Scripts\activate
python http_server.py
```

### 2. Verify Services

```powershell
.\check-services.ps1
```

### 3. Test Access

Open browser and navigate to:
- **https://192.168.0.6:5173**

---

## Auto Start and Monitor Script

The `start-and-monitor.ps1` script has been fixed and will now:

✅ Detect current IP automatically  
✅ Start all services  
✅ Monitor service health  
✅ Auto-restart on failures  
✅ Detect future IP changes  
✅ Update configuration automatically  

### Usage:

```powershell
# Start with monitoring
.\start-and-monitor.ps1

# Start without monitoring
.\start-and-monitor.ps1 -NoMonitor

# Custom check interval (60 seconds)
.\start-and-monitor.ps1 -CheckInterval 60
```

---

## Why Did IP Change?

Your IP address changed from 192.168.1.106 to 192.168.0.6, which could be due to:

1. **Router DHCP**: Router assigned a new IP
2. **Network Change**: Switched to different network
3. **Router Restart**: Router was restarted
4. **DHCP Lease Expired**: Old lease expired, new IP assigned

---

## Prevent Future IP Changes

### Option 1: Configure Static IP (Recommended)

**Windows Network Settings**:
1. Open Settings → Network & Internet
2. Click on your Wi-Fi/Ethernet connection
3. Click "Edit" next to IP assignment
4. Change from "Automatic (DHCP)" to "Manual"
5. Enable IPv4
6. Set IP address: 192.168.0.6
7. Set Subnet mask: 255.255.255.0
8. Set Gateway: 192.168.0.1 (your router)
9. Set DNS: 8.8.8.8 (or your preferred DNS)
10. Save

### Option 2: DHCP Reservation (Router)

Configure your router to always assign the same IP to your machine:
1. Login to router admin panel
2. Find DHCP settings
3. Add reservation for your MAC address
4. Assign IP: 192.168.0.6
5. Save and reboot router

---

## Summary

✅ **New IP**: 192.168.0.6  
✅ **Configuration**: All files updated  
✅ **SSL Certificates**: Regenerated  
✅ **Script**: Fixed and ready to use  
✅ **Next**: Run `.\start-and-monitor.ps1`  

Your application is now configured for the new IP address! 🌐
