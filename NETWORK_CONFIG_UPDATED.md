# ✅ Network Configuration Updated

## Wi-Fi IP Address: **192.168.1.106**

All configuration files have been updated to use your Wi-Fi adapter's IP address instead of the previous IP.

---

## Network Adapter Information

**Active Connection**: Wireless LAN adapter Wi-Fi  
**IP Address**: 192.168.1.106  
**Status**: ✅ Connected and Active

**Inactive Connection**: Ethernet adapter Ethernet  
**IP Address**: 169.254.136.220 (APIPA - not connected)  
**Status**: ❌ Not Connected

---

## Updated Configuration Files

### 1. Main Environment File (`.env`)
```env
FRONTEND_URL=https://192.168.1.106:5173
INFERENCE_SERVICE_URL=https://192.168.1.106:5000
```

### 2. Backend Config (`app/backend/src/config.js`)
```javascript
frontendUrl: process.env.FRONTEND_URL || 'http://192.168.1.106:5173'
serviceUrl: process.env.INFERENCE_SERVICE_URL || 'http://192.168.1.106:5000'
```

### 3. Frontend Config (`app/frontend/vite.config.js`)
```javascript
target: useHttps ? 'https://192.168.1.106:3001' : 'http://192.168.1.106:3001'
```

### 4. Backend Server (`app/backend/src/index.js`)
```javascript
console.log(`✓ HTTPS server running on https://192.168.1.106:${config.port}`)
```

### 5. Service Check Script (`check-services.ps1`)
```powershell
Invoke-WebRequest -Uri "https://192.168.1.106:3001/health"
Invoke-WebRequest -Uri "https://192.168.1.106:5173"
Invoke-WebRequest -Uri "https://192.168.1.106:5000/health"
```

### 6. SSL Certificates
✅ Regenerated with IP: 192.168.1.106  
✅ Subject Alternative Name includes: IP:192.168.1.106, DNS:localhost

---

## New Access URLs

### From Any Device on Your Network:
- **Frontend**: https://192.168.1.106:5173
- **Backend API**: https://192.168.1.106:3001
- **Inference Service**: https://192.168.1.106:5000

### From Local Machine (Still Works):
- **Frontend**: https://localhost:5173
- **Backend API**: https://localhost:3001
- **Inference Service**: https://localhost:5000

---

## What Changed

| Component | Old IP | New IP | Status |
|-----------|--------|--------|--------|
| Frontend URL | 100.86.98.82 | 192.168.1.106 | ✅ Updated |
| Backend URL | 100.86.98.82 | 192.168.1.106 | ✅ Updated |
| Inference URL | 100.86.98.82 | 192.168.1.106 | ✅ Updated |
| SSL Certificates | 100.86.98.82 | 192.168.1.106 | ✅ Regenerated |
| Check Scripts | 100.86.98.82 | 192.168.1.106 | ✅ Updated |

---

## Next Steps

### 1. Restart All Services

**Stop all running services** (Ctrl+C in each terminal), then:

#### Terminal 1: Backend
```bash
cd app/backend
npm start
```
**Expected Output:**
```
✓ HTTPS server running on https://192.168.1.106:3001
  Accessible from intranet at: https://192.168.1.106:3001
```

#### Terminal 2: Frontend
```bash
cd app/frontend
npm run dev
```
**Expected Output:**
```
VITE ready in 500 ms
➜  Local:   https://192.168.1.106:5173/
➜  Network: https://192.168.1.106:5173/
```

#### Terminal 3: Inference Service
```bash
cd inference-service
venv\Scripts\activate
python http_server.py
```
**Expected Output:**
```
✓ HTTPS server running on https://0.0.0.0:5000
* Running on https://192.168.1.106:5000
```

### 2. Configure Windows Firewall (If Not Done)

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Textile Inspector" -Direction Inbound -Protocol TCP -LocalPort 3001,5000,5173 -Action Allow
```

### 3. Verify Services

```powershell
.\check-services.ps1
```

**Expected Output:**
```
1. Backend (Port 3001):
   ✓ Backend is running (HTTPS)

2. Frontend (Port 5173):
   ✓ Frontend is running (HTTPS)

3. Inference Service (Port 5000):
   ✓ Inference service is running (HTTPS)
   - Model loaded: True

4. Model Info:
   ✓ Model info available (HTTPS)
```

### 4. Test from Another Device

From any device on your network:

1. **Open browser**
2. **Navigate to**: https://192.168.1.106:5173
3. **Accept security warning** (self-signed certificate)
4. **Login**: admin / admin123
5. **Test features**: Upload, classify, view reports

---

## Network Architecture

```
┌─────────────────────────────────────────────────────┐
│  Local Network (192.168.1.0/24)                    │
│                                                     │
│  ┌──────────────┐      ┌──────────────┐           │
│  │ Client PC 1  │      │ Client PC 2  │           │
│  │ Browser      │      │ Browser      │           │
│  └──────┬───────┘      └──────┬───────┘           │
│         │                     │                     │
│         └─────────┬───────────┘                     │
│                   │ HTTPS                           │
│                   ▼                                 │
│  ┌─────────────────────────────────────────────┐   │
│  │ Server (192.168.1.106) - Wi-Fi             │   │
│  │                                             │   │
│  │  ┌──────────────┐  ┌──────────────┐       │   │
│  │  │  Frontend    │  │  Backend     │       │   │
│  │  │  Port 5173   │  │  Port 3001   │       │   │
│  │  └──────────────┘  └──────┬───────┘       │   │
│  │                            │               │   │
│  │  ┌──────────────┐  ┌──────▼───────┐       │   │
│  │  │  Inference   │  │  PostgreSQL  │       │   │
│  │  │  Port 5000   │  │  Port 5432   │       │   │
│  │  └──────────────┘  │  (localhost) │       │   │
│  │                    └──────────────┘       │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘

Legend:
  ━━━  Accessible from network (Wi-Fi)
  ─ ─  Localhost only (secure)
```

---

## Important Notes

### Wi-Fi Connection Required

⚠️ **Your application is now configured for Wi-Fi (192.168.1.106)**

- If you disconnect from Wi-Fi, the IP may change
- If you switch to Ethernet, you'll need to update the IP again
- To check current IP: `Get-NetIPAddress -AddressFamily IPv4`

### IP Address Stability

**Dynamic IP (DHCP)**:
- Your router assigns IP addresses automatically
- IP may change after router restart or lease expiration
- Check IP regularly if connection issues occur

**Static IP (Recommended for Production)**:
1. Configure static IP in Windows network settings
2. Or configure DHCP reservation in your router
3. This ensures IP address doesn't change

### Database Security

✅ **Database remains on localhost (127.0.0.1)**
- Not exposed to network
- More secure configuration
- Backend connects locally

---

## Troubleshooting

### Can't Access from Other Devices

**Check Network Connectivity:**
```powershell
# From another device, ping the server
ping 192.168.1.106
```

**Check Firewall:**
```powershell
# List firewall rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Textile*"}

# Add firewall rules if missing
New-NetFirewallRule -DisplayName "Textile Inspector" -Direction Inbound -Protocol TCP -LocalPort 3001,5000,5173 -Action Allow
```

**Check Services are Running:**
```powershell
# Check what's listening on ports
netstat -an | findstr ":5173"
netstat -an | findstr ":3001"
netstat -an | findstr ":5000"
```

### IP Address Changed

If your Wi-Fi IP address changes:

1. **Check new IP**:
   ```powershell
   Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*"}
   ```

2. **Update configuration files** with new IP
3. **Regenerate SSL certificates** with new IP
4. **Restart all services**

### Certificate Warnings

**Expected Behavior:**
- Browser shows "Your connection is not private"
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to 192.168.1.106"

---

## Configuration Summary

### ✅ All Updated

| Setting | Value | Location |
|---------|-------|----------|
| Wi-Fi IP | 192.168.1.106 | Network Adapter |
| Frontend URL | https://192.168.1.106:5173 | .env |
| Backend URL | https://192.168.1.106:3001 | .env |
| Inference URL | https://192.168.1.106:5000 | .env |
| Database | 127.0.0.1:5432 | .env (localhost) |
| SSL Certs | 192.168.1.106 | certs/*.pem |

### ✅ Configuration Files

- `.env` - Main configuration
- `app/backend/src/config.js` - Backend defaults
- `app/backend/src/index.js` - Server binding
- `app/frontend/vite.config.js` - Frontend proxy
- `check-services.ps1` - Service verification
- `certs/*.pem` - SSL certificates

---

## Quick Reference

### Access URLs
```
Frontend:  https://192.168.1.106:5173
Backend:   https://192.168.1.106:3001
Inference: https://192.168.1.106:5000
```

### Firewall Command
```powershell
New-NetFirewallRule -DisplayName "Textile Inspector" -Direction Inbound -Protocol TCP -LocalPort 3001,5000,5173 -Action Allow
```

### Check Services
```powershell
.\check-services.ps1
```

### Check Current IP
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*"}
```

---

## Summary

✅ **IP Address**: 192.168.1.106 (Wi-Fi)  
✅ **All Configuration Files**: Updated  
✅ **SSL Certificates**: Regenerated  
✅ **Service Scripts**: Updated  
✅ **Database**: Secure on localhost  
✅ **Ready for Intranet Access**: Yes  

Your application is now configured to use your Wi-Fi IP address! 🌐
