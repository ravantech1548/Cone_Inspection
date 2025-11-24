# Configuration Guide

## Overview

All configuration values for the Textile Cone Inspector application are stored in environment files (`.env`). **No hardcoded values** exist in the source code - everything is configurable through environment variables.

---

## Configuration Files

### 1. Root `.env` File
**Location**: `/.env`  
**Purpose**: Backend and general application configuration

**Key Settings**:
- Database connection
- Server ports and hosts
- Security secrets
- Upload settings
- Inference service URL
- Color tolerance
- TLS/HTTPS settings

### 2. Inference Service `.env` File
**Location**: `/inference-service/.env`  
**Purpose**: Python inference service configuration

**Key Settings**:
- Model path
- Server port and host
- Confidence thresholds
- TLS/HTTPS settings

---

## Configuration Categories

### Database Configuration

```env
# Connection string
DATABASE_URL=postgresql://username:password@host:port/database

# Connection pool
DB_POOL_MIN=2
DB_POOL_MAX=10
```

**Important**: Keep database on `localhost` or `127.0.0.1` for security.

### Network Configuration

```env
# Backend
BACKEND_HOST=0.0.0.0        # 0.0.0.0 = accessible from network
BACKEND_PORT=3001

# Frontend
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5173
FRONTEND_URL=https://100.86.98.82:5173

# Inference Service
INFERENCE_HOST=0.0.0.0
INFERENCE_PORT=5000
INFERENCE_SERVICE_URL=https://100.86.98.82:5000
```

**For Intranet Access**:
- Set `HOST` to `0.0.0.0` (all interfaces)
- Use your machine's IP address in URLs
- Configure firewall to allow ports

**For Localhost Only**:
- Set `HOST` to `127.0.0.1`
- Use `localhost` in URLs

### Security Configuration

```env
# Authentication
JWT_SECRET=your-secret-key-change-in-production
SESSION_SECRET=your-session-secret-change-in-production

# HTTPS
USE_HTTPS=true
TLS_CERT_PATH=../../certs/backend-cert.pem
TLS_KEY_PATH=../../certs/backend-key.pem
```

**Important**: Change secrets in production!

### Inference Configuration

```env
# Service
INFERENCE_SERVICE_URL=https://100.86.98.82:5000
INFERENCE_TIMEOUT=30000

# Model
MODEL_VERSION=v1.0.0
MODEL_PATH=./models/best.pt

# Confidence threshold (0.0 to 1.0)
DEFAULT_CONFIDENCE_THRESHOLD=0.3
```

**Confidence Threshold Guide**:
- `0.1-0.3`: More detections, less confident (good for testing)
- `0.3-0.5`: Balanced (recommended for production)
- `0.5-0.7`: Fewer detections, more confident
- `0.7-1.0`: Very strict, highest confidence only

### Upload Configuration

```env
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760      # 10MB in bytes
MAX_BATCH_SIZE=100           # Max images per batch
```

### Color Analysis Configuration

```env
DEFAULT_DELTA_E_TOLERANCE=10
```

**Delta E Tolerance Guide**:
- `0-5`: Very strict color matching
- `5-10`: Moderate matching (recommended)
- `10-15`: Lenient matching
- `15+`: Very lenient

---

## Environment-Specific Configuration

### Development

```env
NODE_ENV=development
USE_HTTPS=true
FRONTEND_URL=https://localhost:5173
INFERENCE_SERVICE_URL=https://localhost:5000
```

### Production

```env
NODE_ENV=production
USE_HTTPS=true
FRONTEND_URL=https://your-domain.com
INFERENCE_SERVICE_URL=https://your-domain.com:5000

# Use strong secrets!
JWT_SECRET=<generate-strong-random-secret>
SESSION_SECRET=<generate-strong-random-secret>
```

### Intranet Deployment

```env
NODE_ENV=development
USE_HTTPS=true

# Use your machine's IP address
FRONTEND_URL=https://192.168.1.100:5173
INFERENCE_SERVICE_URL=https://192.168.1.100:5000

# Network access
BACKEND_HOST=0.0.0.0
FRONTEND_HOST=0.0.0.0
INFERENCE_HOST=0.0.0.0

# Database stays on localhost
DATABASE_URL=postgresql://user:pass@127.0.0.1:5432/db
```

---

## How Configuration is Used

### Backend (Node.js)

**File**: `app/backend/src/config.js`

```javascript
export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  database: {
    url: process.env.DATABASE_URL || 'postgresql://...',
  },
  inference: {
    serviceUrl: process.env.INFERENCE_SERVICE_URL || 'http://localhost:5000',
    timeout: parseInt(process.env.INFERENCE_TIMEOUT || '30000', 10),
  }
};
```

**Pattern**: Always uses `process.env.VARIABLE || 'default'`

### Inference Service (Python)

**File**: `inference-service/http_server.py`

```python
from dotenv import load_dotenv
import os

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "./models/best.pt")
port = int(os.getenv('PORT', 5000))
host = os.getenv('HOST', '0.0.0.0')
default_confidence = float(os.getenv('DEFAULT_CONFIDENCE_THRESHOLD', '0.3'))
```

**Pattern**: Always uses `os.getenv('VARIABLE', 'default')`

### Frontend (Vite)

**File**: `app/frontend/vite.config.js`

```javascript
export default defineConfig({
  server: {
    host: process.env.FRONTEND_HOST || '0.0.0.0',
    port: parseInt(process.env.FRONTEND_PORT || '5173'),
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'https://localhost:3001',
      }
    }
  }
});
```

---

## Configuration Validation

### Check Current Configuration

```bash
# View current .env settings
cat .env

# View inference service settings
cat inference-service/.env
```

### Verify Configuration

```powershell
# Run verification script
.\verify-intranet-config.ps1

# Check services
.\check-services.ps1
```

### Test Configuration

```bash
# Test backend config
cd app/backend
node -e "import('./src/config.js').then(m => console.log(m.config))"

# Test database connection
node verify-database.js

# Test inference service
curl https://localhost:5000/health
```

---

## Changing Configuration

### Step 1: Update .env File

```bash
# Edit the file
nano .env

# Or on Windows
notepad .env
```

### Step 2: Restart Services

```bash
# Stop all services (Ctrl+C in each terminal)

# Restart backend
cd app/backend
npm start

# Restart frontend
cd app/frontend
npm run dev

# Restart inference service
cd inference-service
venv\Scripts\activate
python http_server.py
```

### Step 3: Verify Changes

```bash
# Check if services picked up new config
.\check-services.ps1
```

---

## Configuration Best Practices

### Security

1. ✅ **Never commit `.env` files** to version control
2. ✅ **Use strong secrets** in production
3. ✅ **Keep database on localhost** unless necessary
4. ✅ **Use HTTPS** in production
5. ✅ **Rotate secrets** regularly

### Performance

1. ✅ **Adjust confidence threshold** based on model performance
2. ✅ **Set appropriate timeouts** for inference
3. ✅ **Configure connection pools** for database
4. ✅ **Limit file sizes** and batch sizes

### Deployment

1. ✅ **Use `.env.example`** as template
2. ✅ **Document custom settings** in comments
3. ✅ **Test configuration** before deployment
4. ✅ **Backup `.env` files** securely
5. ✅ **Use environment-specific** `.env` files

---

## Troubleshooting Configuration Issues

### Services Won't Start

**Check**:
1. `.env` file exists
2. All required variables are set
3. Paths are correct (relative to service directory)
4. Ports are not in use

**Solution**:
```bash
# Verify .env exists
ls -la .env

# Check for syntax errors
cat .env | grep -v "^#" | grep "="

# Check port availability
netstat -an | findstr ":3001"
```

### Database Connection Fails

**Check**:
1. `DATABASE_URL` is correct
2. PostgreSQL is running
3. User has correct permissions
4. Database exists

**Solution**:
```bash
# Test connection
psql -h 127.0.0.1 -U textile_user -d textile_inspector

# Verify DATABASE_URL format
echo $DATABASE_URL
```

### Inference Service Not Accessible

**Check**:
1. `INFERENCE_SERVICE_URL` matches actual service
2. Firewall allows the port
3. Service is running
4. SSL certificates exist

**Solution**:
```bash
# Test inference service
curl https://localhost:5000/health

# Check firewall
Get-NetFirewallRule | Where-Object {$_.LocalPort -eq 5000}
```

### Configuration Not Applied

**Cause**: Services cache configuration on startup

**Solution**: Restart all services after changing `.env`

---

## Configuration Reference

### All Available Variables

See `.env.example` and `inference-service/.env.example` for complete list with descriptions.

### Required Variables

**Minimum required for basic operation**:
```env
DATABASE_URL=postgresql://user:pass@host:port/db
PORT=3001
FRONTEND_URL=https://localhost:5173
INFERENCE_SERVICE_URL=https://localhost:5000
JWT_SECRET=your-secret
```

### Optional Variables

All other variables have sensible defaults and are optional.

---

## Summary

✅ **All configuration is in `.env` files**  
✅ **No hardcoded values in source code**  
✅ **Environment variables with fallback defaults**  
✅ **Separate configuration for each service**  
✅ **Template files provided (`.env.example`)**  
✅ **Comprehensive documentation**  

Your application is fully configurable through environment variables! 🎉
