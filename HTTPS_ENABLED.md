# HTTPS Enabled - Summary

## ✅ SSL/HTTPS Support Added

All services now support HTTPS with self-signed certificates.

---

## What Changed

### 1. Certificate Generation Scripts
- `generate-ssl-certs.sh` (Linux/macOS)
- `generate-ssl-certs.ps1` (Windows)
- Generates self-signed certificates for all services

### 2. Backend (Node.js)
- **File**: `app/backend/src/index.js`
- Added HTTPS server support
- Automatic fallback to HTTP if certificates missing
- Reads certificates from `./certs/` directory

### 3. Frontend (Vite)
- **File**: `app/frontend/vite.config.js`
- Added HTTPS support
- Proxy configured for HTTPS backend
- Allows self-signed certificates

### 4. Inference Service (Python)
- **File**: `inference-service/http_server.py`
- Added Flask SSL context
- HTTPS support with certificate validation
- Fallback to HTTP if certificates missing

### 5. Configuration
- **File**: `.env.example`
- Added HTTPS settings
- Updated URLs to use HTTPS
- Certificate paths configured

- **File**: `inference-service/.env.example`
- Added HTTPS settings
- Certificate paths configured

### 6. Documentation
- **File**: `SSL_SETUP_GUIDE.md`
- Complete SSL setup guide
- Troubleshooting section
- Production deployment guide

---

## Quick Start

### Generate Certificates

```bash
# Linux/macOS
chmod +x generate-ssl-certs.sh
./generate-ssl-certs.sh

# Windows
.\generate-ssl-certs.ps1
```

### Update .env Files

```env
# .env
USE_HTTPS=true
TLS_CERT_PATH=./certs/backend-cert.pem
TLS_KEY_PATH=./certs/backend-key.pem
FRONTEND_URL=https://localhost:5173
INFERENCE_SERVICE_URL=https://localhost:5000
```

```env
# inference-service/.env
USE_HTTPS=true
TLS_CERT_PATH=../certs/inference-cert.pem
TLS_KEY_PATH=../certs/inference-key.pem
```

### Start Services

```bash
# Backend
cd app/backend && npm start
# Output: ✓ HTTPS server running on https://localhost:3001

# Frontend
cd app/frontend && npm run dev
# Output: VITE ready at https://localhost:5173

# Inference Service
cd inference-service && source venv/bin/activate && python http_server.py
# Output: ✓ HTTPS server running on https://localhost:5000
```

### Access Application

Open: **https://localhost:5173**

⚠️ Accept browser security warning (expected for self-signed certificates)

---

## URLs Changed

| Service | Old URL | New URL |
|---------|---------|---------|
| Frontend | http://localhost:5173 | **https://localhost:5173** |
| Backend | http://localhost:3001 | **https://localhost:3001** |
| Inference | http://localhost:5000 | **https://localhost:5000** |

---

## Certificate Files

```
certs/
├── backend-cert.pem      # Backend SSL certificate
├── backend-key.pem       # Backend private key
├── inference-cert.pem    # Inference SSL certificate
└── inference-key.pem     # Inference private key
```

**Note**: These files are in `.gitignore` and won't be committed.

---

## Features

✅ **End-to-end encryption** - All HTTP traffic encrypted  
✅ **Self-signed certificates** - Easy development setup  
✅ **Automatic fallback** - Falls back to HTTP if no certificates  
✅ **Production ready** - Supports Let's Encrypt certificates  
✅ **Cross-platform** - Works on Windows, Linux, macOS  

---

## Browser Security Warning

When accessing https://localhost:5173, you'll see:

**"Your connection is not private"**

This is expected for self-signed certificates.

**To proceed:**
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"

**Why?** Self-signed certificates aren't trusted by browsers. For production, use Let's Encrypt or a commercial CA.

---

## Testing

```bash
# Test backend
curl -k https://localhost:3001/health

# Test inference service
curl -k https://localhost:5000/health

# Test frontend
curl -k https://localhost:5173
```

**Note**: `-k` flag allows insecure connections (self-signed certificates)

---

## Disabling HTTPS

To use HTTP instead:

### Option 1: Set environment variable
```env
USE_HTTPS=false
```

### Option 2: Remove certificates
```bash
rm -rf certs/
```

Services will automatically use HTTP.

---

## Production Deployment

For production, use real SSL certificates:

### Let's Encrypt (Free)
```bash
sudo certbot certonly --standalone -d yourdomain.com

# Update .env
TLS_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
TLS_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
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

## Security

### Development
- ✅ Self-signed certificates OK
- ✅ Accept browser warnings
- ✅ Don't commit certificates

### Production
- ✅ Use Let's Encrypt or commercial CA
- ✅ Enable HSTS
- ✅ Use strong ciphers
- ✅ Set up auto-renewal
- ✅ Use reverse proxy

---

## Troubleshooting

### Certificates not found
```bash
./generate-ssl-certs.sh
```

### Permission denied
```bash
chmod 600 certs/*.pem
```

### Port in use
```bash
# Kill process on port
lsof -i :3001
kill -9 <PID>
```

### Mixed content errors
Ensure all URLs in `.env` use `https://`

---

## Documentation

- **SSL_SETUP_GUIDE.md** - Complete SSL setup guide
- **DEPLOYMENT_GUIDE.md** - Updated with HTTPS instructions
- **.env.example** - HTTPS configuration template

---

## Summary

✅ HTTPS enabled for all services  
✅ Self-signed certificates generated  
✅ Automatic HTTPS/HTTP detection  
✅ Production-ready configuration  
✅ Complete documentation  

Your application now uses secure HTTPS connections! 🔒
