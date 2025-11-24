# Enable HTTPS - Quick Guide

## Current Status

HTTPS is currently **disabled** because OpenSSL is not installed on your system.

The application is running on HTTP:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Inference: http://localhost:5000

---

## To Enable HTTPS

### Step 1: Install OpenSSL

#### Windows

**Option 1: Download Installer (Recommended)**
1. Download from: https://slproweb.com/products/Win32OpenSSL.html
2. Install "Win64 OpenSSL v3.x.x Light"
3. Add to PATH during installation

**Option 2: Use Chocolatey**
```powershell
choco install openssl
```

**Option 3: Use WSL (Windows Subsystem for Linux)**
```powershell
wsl --install
wsl
sudo apt-get update
sudo apt-get install openssl
```

#### macOS
```bash
brew install openssl
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install openssl
```

### Step 2: Generate Certificates

After installing OpenSSL:

```bash
# Using Node.js script (cross-platform)
node generate-certs.js

# Or using shell script
# Linux/macOS:
./generate-ssl-certs.sh

# Windows (WSL):
wsl bash generate-ssl-certs.sh
```

This will create:
```
certs/
├── backend-cert.pem
├── backend-key.pem
├── inference-cert.pem
└── inference-key.pem
```

### Step 3: Update .env Files

#### .env (root directory)
```env
USE_HTTPS=true
FRONTEND_URL=https://localhost:5173
INFERENCE_SERVICE_URL=https://localhost:5000
```

#### inference-service/.env
```env
USE_HTTPS=true
```

### Step 4: Restart Services

```bash
# Stop all services (Ctrl+C)

# Restart backend
cd app/backend
npm start
# Should show: ✓ HTTPS server running on https://localhost:3001

# Restart frontend
cd app/frontend
npm run dev
# Should show: VITE ready at https://localhost:5173

# Restart inference service
cd inference-service
source venv/bin/activate  # or venv\Scripts\activate on Windows
python http_server.py
# Should show: ✓ HTTPS server running on https://localhost:5000
```

### Step 5: Access Application

Open: **https://localhost:5173**

⚠️ You'll see a security warning (expected for self-signed certificates)
- Click "Advanced"
- Click "Proceed to localhost (unsafe)"

---

## Why HTTPS is Disabled

OpenSSL is required to generate SSL certificates. Without it:
- Cannot create certificate files
- Services fall back to HTTP
- Application still works, but without encryption

---

## Alternative: Use HTTP (Current Setup)

If you don't need HTTPS for development, you can continue using HTTP:

**Advantages:**
- ✅ No OpenSSL installation needed
- ✅ No certificate warnings in browser
- ✅ Simpler setup

**Disadvantages:**
- ❌ No encryption
- ❌ Not suitable for production
- ❌ Some browser features may not work (camera, geolocation)

---

## Verify OpenSSL Installation

```bash
# Check if OpenSSL is installed
openssl version

# Expected output:
# OpenSSL 3.x.x ...
```

If this command works, you can proceed with certificate generation.

---

## Quick Commands

```bash
# 1. Install OpenSSL (Windows)
# Download from: https://slproweb.com/products/Win32OpenSSL.html

# 2. Generate certificates
node generate-certs.js

# 3. Enable HTTPS in .env
USE_HTTPS=true

# 4. Restart services
# Ctrl+C to stop, then restart each service

# 5. Access application
# https://localhost:5173
```

---

## Troubleshooting

### "OpenSSL not found"
- Install OpenSSL using instructions above
- Restart terminal/PowerShell after installation
- Verify with: `openssl version`

### "Certificate files not found"
- Run: `node generate-certs.js`
- Check that `certs/` directory exists
- Verify files: `ls certs/` or `dir certs\`

### Services still using HTTP
- Check `.env` files have `USE_HTTPS=true`
- Verify certificate files exist
- Restart all services

### Browser security warning
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to localhost"
- Or use mkcert for trusted certificates

---

## For Production

For production deployment, use real SSL certificates:

### Let's Encrypt (Free)
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

### Or use Nginx reverse proxy
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5173;
    }
}
```

---

## Summary

**Current Status:** HTTP (no encryption)  
**To Enable HTTPS:** Install OpenSSL → Generate certificates → Update .env → Restart  
**For Production:** Use Let's Encrypt or commercial CA  

See `SSL_SETUP_GUIDE.md` for complete documentation.
