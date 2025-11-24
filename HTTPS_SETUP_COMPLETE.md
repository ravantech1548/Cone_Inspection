# HTTPS Setup Complete! 🔒

## ✅ SSL Certificates Generated

All SSL certificates have been successfully generated and HTTPS is now enabled.

---

## Generated Certificates

```
certs/
├── backend-cert.pem      ✓ Backend SSL certificate
├── backend-key.pem       ✓ Backend private key
├── inference-cert.pem    ✓ Inference SSL certificate
└── inference-key.pem     ✓ Inference private key
```

---

## Configuration Updated

### .env (Backend)
```env
USE_HTTPS=true
TLS_CERT_PATH=./certs/backend-cert.pem
TLS_KEY_PATH=./certs/backend-key.pem
FRONTEND_URL=https://localhost:5173
INFERENCE_SERVICE_URL=https://localhost:5000
```

### inference-service/.env
```env
USE_HTTPS=true
TLS_CERT_PATH=../certs/inference-cert.pem
TLS_KEY_PATH=../certs/inference-key.pem
```

---

## Start Services with HTTPS

### Terminal 1: Backend
```bash
cd app/backend
npm start
```
**Expected Output:**
```
✓ HTTPS server running on https://localhost:3001
  Environment: development
  Certificate: ./certs/backend-cert.pem
```

### Terminal 2: Frontend
```bash
cd app/frontend
npm run dev
```
**Expected Output:**
```
VITE v4.x.x ready in 500 ms
➜  Local:   https://localhost:5173/
➜  Network: use --host to expose
```

### Terminal 3: Inference Service
```bash
cd inference-service
venv\Scripts\activate
python http_server.py
```
**Expected Output:**
```
Loading YOLO model from ./models/best.pt
Model loaded successfully
✓ HTTPS server running on https://localhost:5000
  Certificate: ../certs/inference-cert.pem
```

---

## Access Application

Open your browser: **https://localhost:5173**

### ⚠️ Security Warning (Expected)

You'll see: **"Your connection is not private"**

This is normal for self-signed certificates.

**To proceed:**
1. Click **"Advanced"**
2. Click **"Proceed to localhost (unsafe)"**

**Why?** Self-signed certificates aren't trusted by browsers. This is safe for development on localhost.

---

## Verify HTTPS is Working

### Test Backend
```bash
curl -k https://localhost:3001/health
```
**Expected:** `{"status":"ok","timestamp":"..."}`

### Test Inference Service
```bash
curl -k https://localhost:5000/health
```
**Expected:** `{"status":"healthy","model_loaded":true}`

### Test Frontend
```bash
curl -k https://localhost:5173
```
**Expected:** HTML content

**Note:** `-k` flag allows insecure connections (self-signed certificates)

---

## All Services Now Use HTTPS

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://localhost:5173 | ✅ HTTPS |
| Backend API | https://localhost:3001 | ✅ HTTPS |
| Inference Service | https://localhost:5000 | ✅ HTTPS |

---

## Certificate Details

- **Type:** Self-signed
- **Algorithm:** RSA 4096-bit
- **Valid for:** 365 days
- **Subject:** CN=localhost
- **Usage:** Development and testing

---

## Browser Trust (Optional)

To avoid security warnings, you can trust the certificates:

### Windows
1. Double-click `certs\backend-cert.pem`
2. Click "Install Certificate"
3. Select "Current User"
4. Select "Place all certificates in the following store"
5. Browse → "Trusted Root Certification Authorities"
6. Click "Next" → "Finish"

### Chrome/Edge
1. Go to `chrome://settings/certificates`
2. Click "Authorities" tab
3. Click "Import"
4. Select `certs\backend-cert.pem`
5. Check "Trust this certificate for identifying websites"

### Firefox
1. Go to `about:preferences#privacy`
2. Scroll to "Certificates"
3. Click "View Certificates"
4. Click "Import"
5. Select `certs\backend-cert.pem`
6. Check "Trust this CA to identify websites"

---

## Troubleshooting

### Services Still Using HTTP

**Check:**
1. `.env` files have `USE_HTTPS=true`
2. Certificate files exist in `certs/` directory
3. Services were restarted after updating .env

**Solution:**
```bash
# Verify certificates exist
dir certs\*.pem

# Restart all services (Ctrl+C to stop, then restart)
```

### Certificate Not Found Error

**Error:** `ENOENT: no such file or directory, open './certs/backend-cert.pem'`

**Solution:**
```bash
# Regenerate certificates
node generate-certs.js

# Or manually with OpenSSL
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" req -x509 -newkey rsa:4096 -keyout certs\backend-key.pem -out certs\backend-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### Browser Shows "NET::ERR_CERT_AUTHORITY_INVALID"

**This is expected for self-signed certificates.**

**Solution:**
- Click "Advanced" → "Proceed to localhost"
- Or trust the certificate (see Browser Trust section above)

### Mixed Content Errors

**Error:** `Mixed Content: The page was loaded over HTTPS, but requested an insecure resource`

**Solution:** Ensure all URLs in `.env` use `https://`

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

### Or use Nginx Reverse Proxy
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5173;
    }
}
```

---

## Certificate Renewal

Self-signed certificates expire after 365 days.

### Check Expiration
```bash
openssl x509 -in certs\backend-cert.pem -noout -dates
```

### Renew Certificates
```bash
# Remove old certificates
Remove-Item certs\*.pem

# Generate new ones
node generate-certs.js

# Restart services
```

---

## Disable HTTPS (If Needed)

To switch back to HTTP:

```env
# .env
USE_HTTPS=false
FRONTEND_URL=http://localhost:5173
INFERENCE_SERVICE_URL=http://localhost:5000

# inference-service/.env
USE_HTTPS=false
```

Then restart all services.

---

## Summary

✅ **OpenSSL installed** - Version 3.6.0  
✅ **Certificates generated** - 4 files created  
✅ **HTTPS enabled** - All services configured  
✅ **Ready to use** - Start services and access https://localhost:5173  

**Next Steps:**
1. Start all services
2. Open https://localhost:5173
3. Accept security warning
4. Start using the application with HTTPS! 🎉

---

## Quick Commands

```bash
# Start backend
cd app/backend && npm start

# Start frontend
cd app/frontend && npm run dev

# Start inference service
cd inference-service && venv\Scripts\activate && python http_server.py

# Access application
# https://localhost:5173
```

Your textile cone inspector now uses secure HTTPS connections! 🔒
