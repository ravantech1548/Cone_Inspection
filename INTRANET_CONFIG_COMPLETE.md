# ✅ Intranet Configuration Complete

## Machine IP Address: **100.86.98.82**

All configuration files have been updated to enable intranet access while maintaining security.

---

## 🌐 Access URLs

### From Any Device on Your Network:
- **Frontend**: https://100.86.98.82:5173
- **Backend API**: https://100.86.98.82:3001
- **Inference Service**: https://100.86.98.82:5000

### From Local Machine (Still Works):
- **Frontend**: https://localhost:5173
- **Backend API**: https://localhost:3001
- **Inference Service**: https://localhost:5000

---

## 📝 Configuration Changes Summary

### 1. Root .env File ✅
```env
# Database - Localhost (secure, not exposed to network)
DATABASE_URL=postgresql://textile_user:textile_pass_123@127.0.0.1:5432/textile_inspector

# Web Services - IP Address (accessible from intranet)
FRONTEND_URL=https://100.86.98.82:5173
INFERENCE_SERVICE_URL=https://100.86.98.82:5000
```

### 2. Backend Configuration ✅
**File**: `app/backend/src/config.js`
- Default frontend URL: `http://100.86.98.82:5173`
- Default database URL: `postgresql://...@127.0.0.1:5432/...`
- Default inference URL: `http://100.86.98.82:5000`

**File**: `app/backend/src/index.js`
- Server binds to: `0.0.0.0` (all network interfaces)
- Console shows: `https://100.86.98.82:3001`

### 3. Frontend Configuration ✅
**File**: `app/frontend/vite.config.js`
- Host: `0.0.0.0` (accessible from network)
- Proxy target: `https://100.86.98.82:3001`

### 4. Inference Service ✅
**File**: `inference-service/.env`
- Already configured with `HOST=0.0.0.0`
- No changes needed

### 5. Service Check Script ✅
**File**: `check-services.ps1`
- Updated to check `100.86.98.82` instead of `localhost`

---

## 🔒 Security Architecture

### Exposed to Network:
- ✅ Frontend (Port 5173) - Web interface
- ✅ Backend API (Port 3001) - Application logic
- ✅ Inference Service (Port 5000) - AI model

### NOT Exposed (Secure):
- 🔒 PostgreSQL (Port 5432) - Database on localhost only
- 🔒 Uploads folder - Served through backend API only

**Why This is Secure:**
- Database is not accessible from network
- Only application services are exposed
- All services use HTTPS with SSL certificates
- Backend validates all requests

---

## 🚀 Next Steps

### 1. Restart All Services

**Stop all running services** (Ctrl+C in each terminal), then:

#### Terminal 1: Backend
```bash
cd app/backend
npm start
```
**Expected Output:**
```
✓ HTTPS server running on https://100.86.98.82:3001
  Accessible from intranet at: https://100.86.98.82:3001
```

#### Terminal 2: Frontend
```bash
cd app/frontend
npm run dev
```
**Expected Output:**
```
VITE ready in 500 ms
➜  Local:   https://100.86.98.82:5173/
➜  Network: https://100.86.98.82:5173/
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
* Running on https://100.86.98.82:5000
```

### 2. Configure Windows Firewall

Allow inbound connections on required ports:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Textile Inspector - Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
New-NetFirewallRule -DisplayName "Textile Inspector - Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "Textile Inspector - Inference" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

**Or use Windows Defender Firewall GUI:**
1. Windows Security → Firewall & network protection
2. Advanced settings → Inbound Rules → New Rule
3. Port → TCP → Specific ports: `3001,5000,5173`
4. Allow the connection → Apply to all profiles
5. Name: "Textile Inspector Services"

### 3. Verify Services

Run the check script:
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
2. **Navigate to**: https://100.86.98.82:5173
3. **Accept security warning** (self-signed certificate)
4. **Login**: admin / admin123
5. **Test features**: Upload, classify, view reports

---

## 🔧 Troubleshooting

### Can't Access from Other Devices

**Check Network Connectivity:**
```powershell
# From another device, ping the server
ping 100.86.98.82
```

**Check Firewall:**
```powershell
# List firewall rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Textile*"}

# Test if port is open
Test-NetConnection -ComputerName 100.86.98.82 -Port 5173
```

**Check Services are Listening:**
```powershell
# Check what's listening on ports
netstat -an | findstr ":5173"
netstat -an | findstr ":3001"
netstat -an | findstr ":5000"
```

### Certificate Warnings

**Expected Behavior:**
- Browser shows "Your connection is not private"
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to 100.86.98.82"

**To Avoid Warnings:**
- Install certificate on client devices
- Or use mkcert for locally-trusted certificates
- Or use real SSL certificates in production

### Database Connection Issues

**If you see database errors:**

The database should work fine on localhost. If you need network access:
- See `POSTGRESQL_NETWORK_CONFIG.md` for detailed instructions
- **Recommended**: Keep database on localhost for security

### Services Not Starting

**Backend won't start:**
```bash
# Check if port is already in use
netstat -ano | findstr :3001

# Check logs
cd app/backend
npm start
```

**Frontend won't start:**
```bash
# Check if port is already in use
netstat -ano | findstr :5173

# Clear cache and restart
cd app/frontend
rm -rf node_modules/.vite
npm run dev
```

**Inference service won't start:**
```bash
# Check Python environment
cd inference-service
venv\Scripts\activate
python --version
pip list

# Check model file exists
ls models/best.pt
```

---

## 📊 Network Architecture

```
┌─────────────────────────────────────────────────────┐
│  Intranet (100.86.98.0/24)                         │
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
│  │ Server (100.86.98.82)                       │   │
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
  ━━━  Accessible from network
  ─ ─  Localhost only (secure)
```

---

## 📋 Configuration Files Reference

### Modified Files:
1. `.env` - Main environment configuration
2. `app/backend/src/config.js` - Backend defaults
3. `app/backend/src/index.js` - Server binding
4. `app/frontend/vite.config.js` - Frontend server config
5. `check-services.ps1` - Service verification script

### Unchanged Files:
- `inference-service/.env` - Already configured correctly
- Database schema files
- Application source code

---

## 🎯 Testing Checklist

### From Local Machine (100.86.98.82):
- [ ] https://100.86.98.82:5173 loads
- [ ] https://localhost:5173 still works
- [ ] Can login with admin/admin123
- [ ] Can upload images
- [ ] Can classify images
- [ ] Can view reports
- [ ] Can export data

### From Another Device on Network:
- [ ] Can ping 100.86.98.82
- [ ] https://100.86.98.82:5173 loads
- [ ] Can accept certificate warning
- [ ] Can login successfully
- [ ] All features work normally
- [ ] Images upload correctly
- [ ] Classification works
- [ ] Reports display properly

---

## 📚 Additional Documentation

- **PostgreSQL Network Setup**: See `POSTGRESQL_NETWORK_CONFIG.md`
- **SSL Certificate Setup**: See `SSL_SETUP_GUIDE.md`
- **General Troubleshooting**: See `TROUBLESHOOTING.md`
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`

---

## 🎉 Summary

Your textile cone inspector application is now configured for intranet access:

✅ **IP Address**: 100.86.98.82  
✅ **All Services**: Configured for network access  
✅ **Database**: Secure on localhost  
✅ **SSL Certificates**: Updated with IP address  
✅ **Firewall**: Instructions provided  
✅ **Testing**: Scripts updated  

**Next**: Restart services and configure firewall, then test from another device!

---

## 🆘 Quick Help

**Services won't start?**
```powershell
.\check-services.ps1
```

**Can't access from network?**
```powershell
# Check firewall
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Textile*"}

# Add firewall rules
New-NetFirewallRule -DisplayName "Textile Inspector" -Direction Inbound -Protocol TCP -LocalPort 3001,5000,5173 -Action Allow
```

**Need to change IP address?**
1. Get new IP: `Get-NetIPAddress -AddressFamily IPv4`
2. Update all config files with new IP
3. Regenerate SSL certificates
4. Restart all services
