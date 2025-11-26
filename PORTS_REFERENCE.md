# Application Ports Reference

## Overview

The Textile Cone Inspector application uses 4 ports for its services.

## Port Summary

| Port | Service | Protocol | Purpose | Access |
|------|---------|----------|---------|--------|
| **3001** | Backend API | HTTPS | Express.js REST API | Network |
| **5173** | Frontend | HTTPS | Vite React Dev Server | Network |
| **5000** | Inference Service | HTTPS | Python YOLO Model | Network |
| **5432** | PostgreSQL | TCP | Database | Localhost only |

## Detailed Port Information

### Port 3001 - Backend API
- **Service**: Express.js Backend
- **Protocol**: HTTPS (self-signed certificate)
- **Technology**: Node.js + Express
- **Purpose**: REST API for application logic
- **Endpoints**:
  - `/api/auth` - Authentication
  - `/api/batches` - Batch management
  - `/api/images` - Image operations
  - `/api/inspection` - Classification
  - `/api/reports` - Report generation
  - `/api/references` - Reference images
  - `/api/admin` - Admin functions
  - `/health` - Health check
- **Access**: 
  - Local: `https://localhost:3001`
  - Network: `https://192.168.0.6:3001`
- **Certificate**: `certs/backend-cert.pem`
- **Key**: `certs/backend-key.pem`
- **Started by**: `npm start` in `app/backend`

### Port 5173 - Frontend
- **Service**: Vite Development Server
- **Protocol**: HTTPS (self-signed certificate)
- **Technology**: React + Vite
- **Purpose**: Web application UI
- **Features**:
  - Hot Module Replacement (HMR)
  - React Fast Refresh
  - Proxy to backend API
- **Access**:
  - Local: `https://localhost:5173`
  - Network: `https://192.168.0.6:5173`
- **Certificate**: Uses backend certificate
- **Proxy**: Forwards `/api/*` to `https://192.168.0.6:3001`
- **Started by**: `npm run dev` in `app/frontend`

### Port 5000 - Inference Service
- **Service**: Python YOLO Inference
- **Protocol**: HTTPS (self-signed certificate)
- **Technology**: Python + Flask + PyTorch + Ultralytics YOLO
- **Purpose**: AI model inference for cone tip classification
- **Endpoints**:
  - `/health` - Health check
  - `/predict` - Image classification
- **Model**: `models/best.pt` (YOLOv8)
- **Classes**: 
  - `Green_brown_shade`
  - `Brown_purple_ring`
  - `Brown_plain`
- **Access**:
  - Local: `https://localhost:5000`
  - Network: `https://192.168.0.6:5000`
- **Certificate**: `certs/inference-cert.pem`
- **Key**: `certs/inference-key.pem`
- **Started by**: `python http_server.py` in `inference-service` (with venv activated)

### Port 5432 - PostgreSQL Database
- **Service**: PostgreSQL Database
- **Protocol**: TCP (PostgreSQL protocol)
- **Technology**: PostgreSQL 14+
- **Purpose**: Data persistence
- **Database**: `textile_inspector`
- **Tables**:
  - `users` - User accounts
  - `batches` - Inspection batches
  - `images` - Scanned images
  - `predictions` - AI predictions
  - `models` - Model versions
  - `batch_metadata` - Batch settings
- **Access**: 
  - **Localhost only**: `localhost:5432`
  - **NOT accessible from network** (security)
- **Connection String**: `postgresql://postgres:postgres@localhost:5432/textile_inspector`
- **Started by**: PostgreSQL service (Windows Service or manual)

## Network Configuration

### Current IP Address
- **IP**: `192.168.0.6`
- **Network**: Wi-Fi / Ethernet
- **Subnet**: `192.168.0.x`

### Access URLs

#### From Local Machine
```
Frontend:  https://localhost:5173
Backend:   https://localhost:3001
Inference: https://localhost:5000
Database:  localhost:5432
```

#### From Network (Other Devices)
```
Frontend:  https://192.168.0.6:5173
Backend:   https://192.168.0.6:3001
Inference: https://192.168.0.6:5000
Database:  NOT ACCESSIBLE (localhost only)
```

## Port Checking Commands

### Check All Application Ports
```powershell
Get-NetTCPConnection -LocalPort 3001,5173,5000,5432 -State Listen | 
  Select-Object LocalPort, State, OwningProcess | 
  Format-Table
```

### Check Individual Ports
```powershell
# Backend
Get-NetTCPConnection -LocalPort 3001 -State Listen

# Frontend
Get-NetTCPConnection -LocalPort 5173 -State Listen

# Inference
Get-NetTCPConnection -LocalPort 5000 -State Listen

# Database
Get-NetTCPConnection -LocalPort 5432 -State Listen
```

### Using Status Checker Script
```powershell
.\check-service-status.ps1
```

## Firewall Configuration

### Windows Firewall Rules Needed

For network access, ensure these ports are allowed:

```powershell
# Allow Backend (3001)
New-NetFirewallRule -DisplayName "Textile Inspector Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Allow Frontend (5173)
New-NetFirewallRule -DisplayName "Textile Inspector Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Allow Inference (5000)
New-NetFirewallRule -DisplayName "Textile Inspector Inference" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow

# Database (5432) - Should NOT be allowed from network
# Keep database localhost-only for security
```

## SSL Certificates

All HTTPS services use self-signed certificates:

### Backend Certificate
- **Location**: `certs/backend-cert.pem`
- **Key**: `certs/backend-key.pem`
- **Subject**: CN=192.168.0.6
- **SAN**: IP:192.168.0.6, DNS:localhost
- **Used by**: Backend (3001), Frontend (5173)

### Inference Certificate
- **Location**: `certs/inference-cert.pem`
- **Key**: `certs/inference-key.pem`
- **Subject**: CN=192.168.0.6
- **SAN**: IP:192.168.0.6, DNS:localhost
- **Used by**: Inference (5000)

### Regenerate Certificates
```powershell
.\generate-ssl-certs.ps1
```

## Service Dependencies

### Startup Order
1. **PostgreSQL** (5432) - Must start first
2. **Backend** (3001) - Depends on database
3. **Inference** (5000) - Independent, but backend calls it
4. **Frontend** (5173) - Depends on backend

### Service Communication

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└──────┬──────┘
       │ HTTPS :5173
       ▼
┌─────────────┐
│  Frontend   │
│  Port 5173  │
└──────┬──────┘
       │ HTTPS :3001 (Proxy /api/*)
       ▼
┌─────────────┐      HTTPS :5000      ┌─────────────┐
│   Backend   │◄────────────────────►│  Inference  │
│  Port 3001  │                       │  Port 5000  │
└──────┬──────┘                       └─────────────┘
       │ TCP :5432
       ▼
┌─────────────┐
│ PostgreSQL  │
│  Port 5432  │
└─────────────┘
```

## Port Conflicts

### Common Conflicts

| Port | Common Conflicts |
|------|------------------|
| 3001 | Other Node.js apps, React apps |
| 5173 | Other Vite dev servers |
| 5000 | Flask apps, Python servers, Windows services |
| 5432 | Other PostgreSQL instances |

### Resolving Conflicts

#### Find Process Using Port
```powershell
Get-NetTCPConnection -LocalPort 3001 | Select-Object OwningProcess
Get-Process -Id <PID>
```

#### Kill Process on Port
```powershell
Get-NetTCPConnection -LocalPort 3001 | 
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

#### Change Port (if needed)

**Backend** - Edit `app/backend/src/config.js`:
```javascript
port: process.env.PORT || 3001
```

**Frontend** - Edit `app/frontend/vite.config.js`:
```javascript
server: {
  port: 5173
}
```

**Inference** - Edit `inference-service/http_server.py`:
```python
app.run(host='0.0.0.0', port=5000, ssl_context=context)
```

**Database** - Edit PostgreSQL configuration (not recommended)

## Monitoring

### Continuous Monitoring
```powershell
.\start-and-monitor.ps1
```

Checks ports every 5 minutes:
- Port 3001 (Backend)
- Port 5173 (Frontend)
- Port 5000 (Inference)

### Manual Check
```powershell
.\check-service-status.ps1
```

Shows current status of all ports.

## Troubleshooting

### Port Not Listening

**Symptom**: Service started but port not listening

**Check**:
```powershell
Get-NetTCPConnection -LocalPort <PORT> -State Listen
```

**Solutions**:
1. Wait 10-15 seconds for service to initialize
2. Check service logs for errors
3. Verify no port conflicts
4. Restart the service

### Port Already in Use

**Symptom**: Error "Address already in use"

**Solution**:
```powershell
# Find and kill process
Get-NetTCPConnection -LocalPort <PORT> | 
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Restart service
.\restart-services.ps1
```

### Cannot Access from Network

**Symptom**: Works on localhost but not from other devices

**Check**:
1. Firewall rules
2. IP address is correct
3. Services bound to `0.0.0.0` not `127.0.0.1`
4. SSL certificate includes correct IP

**Solution**:
```powershell
# Check firewall
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*Textile*" }

# Verify IP
Get-NetIPAddress -AddressFamily IPv4 | 
  Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" }

# Regenerate certificates with correct IP
.\generate-ssl-certs.ps1
```

## Security Notes

### Database Security
- ✅ PostgreSQL only listens on localhost (127.0.0.1)
- ✅ NOT accessible from network
- ✅ Prevents unauthorized database access

### HTTPS Security
- ⚠️ Self-signed certificates (browser warnings expected)
- ✅ Encrypted communication
- ✅ Suitable for intranet use
- ❌ Not suitable for public internet

### Network Security
- ✅ Services only accessible on local network
- ✅ No public internet exposure
- ✅ Firewall rules control access

## Quick Reference

### Start All Services
```powershell
.\start-and-monitor.ps1
```

### Check Status
```powershell
.\check-service-status.ps1
```

### Restart Services
```powershell
.\restart-services.ps1
```

### Stop All Services
Press `Ctrl+C` in monitor window

### Access Application
```
https://192.168.0.6:5173
```

## Summary

| Component | Port | Protocol | Network Access | Security |
|-----------|------|----------|----------------|----------|
| Frontend | 5173 | HTTPS | ✅ Yes | Self-signed cert |
| Backend | 3001 | HTTPS | ✅ Yes | Self-signed cert |
| Inference | 5000 | HTTPS | ✅ Yes | Self-signed cert |
| Database | 5432 | TCP | ❌ No (localhost only) | Password protected |

**Total Ports Used**: 4
**Network Accessible**: 3 (Frontend, Backend, Inference)
**Localhost Only**: 1 (Database)
