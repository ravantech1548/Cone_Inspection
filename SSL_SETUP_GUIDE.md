# SSL/HTTPS Setup Guide

Complete guide for enabling HTTPS with self-signed certificates.

---

## Overview

This application now supports HTTPS for all services:
- ✅ Backend API (Node.js/Express)
- ✅ Frontend (Vite/React)
- ✅ Inference Service (Python/Flask)

---

## Quick Setup

### Step 1: Generate SSL Certificates

#### Linux/macOS
```bash
chmod +x generate-ssl-certs.sh
./generate-ssl-certs.sh
```

#### Windows
```powershell
.\generate-ssl-certs.ps1
```

This will create:
```
certs/
├── backend-cert.pem
├── backend-key.pem
├── inference-cert.pem
└── inference-key.pem
```

### Step 2: Update Environment Variables

#### Backend (.env)
```env
USE_HTTPS=true
TLS_CERT_PATH=./certs/backend-cert.pem
TLS_KEY_PATH=./certs/backend-key.pem
FRONTEND_URL=https://localhost:5173
INFERENCE_SERVICE_URL=https://localhost:5000
```

#### Inference Service (inference-service/.env)
```env
USE_HTTPS=true
TLS_CERT_PATH=../certs/inference-cert.pem
TLS_KEY_PATH=../certs/inference-key.pem
PORT=5000
```

### Step 3: Start Services

```bash
# Terminal 1: Backend
cd app/backend
npm start
# Output: ✓ HTTPS server running on https://localhost:3001

# Terminal 2: Frontend
cd app/frontend
npm run dev
# Output: VITE ready at https://localhost:5173

# Terminal 3: Inference Service
cd inference-service
source venv/bin/activate  # or venv\Scripts\activate on Windows
python http_server.py
# Output: ✓ HTTPS server running on https://localhost:5000
```

### Step 4: Access Application

Open browser: **https://localhost:5173**

⚠️ You'll see a security warning (expected for self-signed certificates)

**Chrome/Edge:**
1. Click "Advanced"
2. Click "Proceed to localhost (unsafe)"

**Firefox:**
1. Click "Advanced"
2. Click "Accept the Risk and Continue"

---

## Certificate Details

### Self-Signed Certificates

The generated certificates are:
- **Valid for**: 365 days
- **Algorithm**: RSA 4096-bit
- **Subject**: CN=localhost
- **Usage**: Development and testing only

### Certificate Files

| File | Purpose | Used By |
|------|---------|---------|
| `backend-cert.pem` | Backend SSL certificate | Node.js backend, Vite frontend |
| `backend-key.pem` | Backend private key | Node.js backend, Vite frontend |
| `inference-cert.pem` | Inference SSL certificate | Python inference service |
| `inference-key.pem` | Inference private key | Python inference service |

---

## Manual Certificate Generation

If you prefer to generate certificates manually:

### Using OpenSSL

```bash
# Create certs directory
mkdir -p certs

# Generate backend certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout certs/backend-key.pem \
  -out certs/backend-cert.pem \
  -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate inference service certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout certs/inference-key.pem \
  -out certs/inference-cert.pem \
  -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Set permissions (Linux/macOS)
chmod 600 certs/*.pem
```

### Using mkcert (Recommended for Development)

[mkcert](https://github.com/FiloSottile/mkcert) creates locally-trusted certificates:

```bash
# Install mkcert
# macOS:
brew install mkcert
# Windows:
choco install mkcert
# Linux:
# See https://github.com/FiloSottile/mkcert#installation

# Install local CA
mkcert -install

# Generate certificates
mkdir -p certs
cd certs
mkcert localhost 127.0.0.1 ::1

# Rename files
mv localhost+2.pem backend-cert.pem
mv localhost+2-key.pem backend-key.pem
cp backend-cert.pem inference-cert.pem
cp backend-key.pem inference-key.pem
```

---

## Configuration

### Backend (Node.js)

The backend automatically detects SSL certificates:

```javascript
// app/backend/src/index.js
if (config.tls.enabled && config.tls.certPath && config.tls.keyPath) {
  const options = {
    cert: fs.readFileSync(config.tls.certPath),
    key: fs.readFileSync(config.tls.keyPath)
  };
  server = https.createServer(options, app);
  server.listen(config.port);
}
```

### Frontend (Vite)

Vite automatically uses HTTPS if certificates exist:

```javascript
// app/frontend/vite.config.js
server: {
  https: useHttps ? {
    key: fs.readFileSync(keyFile),
    cert: fs.readFileSync(certFile),
  } : undefined,
  proxy: {
    '/api': {
      target: 'https://localhost:3001',
      secure: false, // Allow self-signed certificates
    }
  }
}
```

### Inference Service (Python/Flask)

Flask uses SSL context:

```python
# inference-service/http_server.py
if use_https:
    app.run(
        host=host, 
        port=port, 
        ssl_context=(cert_file, key_file)
    )
```

---

## Troubleshooting

### Certificate Not Found

**Error**: `Certificate files not found, falling back to HTTP`

**Solution**:
```bash
# Generate certificates
./generate-ssl-certs.sh  # or .ps1 on Windows

# Verify files exist
ls -la certs/
```

### Permission Denied

**Error**: `EACCES: permission denied, open 'certs/backend-key.pem'`

**Solution**:
```bash
# Fix permissions (Linux/macOS)
chmod 600 certs/*.pem

# Windows: Right-click file → Properties → Security → Edit permissions
```

### Browser Security Warning

**Issue**: Browser shows "Your connection is not private"

**Solution**: This is expected for self-signed certificates.
- Click "Advanced" → "Proceed to localhost"
- Or use mkcert for locally-trusted certificates

### Mixed Content Errors

**Error**: `Mixed Content: The page was loaded over HTTPS, but requested an insecure resource`

**Solution**: Ensure all URLs use HTTPS:
```env
# .env
FRONTEND_URL=https://localhost:5173
INFERENCE_SERVICE_URL=https://localhost:5000
```

### Certificate Expired

**Error**: `certificate has expired`

**Solution**: Regenerate certificates:
```bash
rm -rf certs/
./generate-ssl-certs.sh
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3001`

**Solution**:
```bash
# Find and kill process
# Linux/macOS:
lsof -i :3001
kill -9 <PID>

# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## Production Deployment

### Using Let's Encrypt (Recommended)

For production, use real SSL certificates from Let's Encrypt:

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Update .env
USE_HTTPS=true
TLS_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
TLS_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Using Nginx Reverse Proxy

For production, use Nginx to handle SSL:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
    }
}
```

---

## Security Best Practices

### Development
- ✅ Use self-signed certificates
- ✅ Accept browser warnings
- ✅ Don't commit certificates to git
- ✅ Regenerate certificates regularly

### Production
- ✅ Use Let's Encrypt or commercial CA
- ✅ Enable HSTS (HTTP Strict Transport Security)
- ✅ Use strong cipher suites
- ✅ Enable OCSP stapling
- ✅ Set up certificate auto-renewal
- ✅ Use Nginx/Apache as reverse proxy
- ✅ Enable HTTP/2
- ✅ Configure proper CORS headers

---

## Testing HTTPS

### Test Backend
```bash
curl -k https://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Test Inference Service
```bash
curl -k https://localhost:5000/health
# Expected: {"status":"healthy","model_loaded":true}
```

### Test Frontend
```bash
curl -k https://localhost:5173
# Expected: HTML content
```

**Note**: `-k` flag allows insecure connections (self-signed certificates)

---

## Disabling HTTPS

To disable HTTPS and use HTTP:

### Option 1: Environment Variables
```env
# .env
USE_HTTPS=false
FRONTEND_URL=http://localhost:5173
INFERENCE_SERVICE_URL=http://localhost:5000
```

### Option 2: Remove Certificates
```bash
rm -rf certs/
```

Services will automatically fall back to HTTP if certificates are not found.

---

## Certificate Renewal

Self-signed certificates expire after 365 days.

### Check Expiration
```bash
openssl x509 -in certs/backend-cert.pem -noout -dates
```

### Renew Certificates
```bash
# Remove old certificates
rm -rf certs/

# Generate new ones
./generate-ssl-certs.sh

# Restart services
```

---

## Summary

✅ **HTTPS enabled** for all services  
✅ **Self-signed certificates** for development  
✅ **Automatic fallback** to HTTP if certificates missing  
✅ **Production ready** with Let's Encrypt support  
✅ **Secure communication** between all components  

Your application now uses HTTPS for secure communication! 🔒
