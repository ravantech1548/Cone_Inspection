# 🚀 Quick Start - Intranet Access

## Your Machine IP: **100.86.98.82**

---

## 1️⃣ Configure Firewall (One-Time Setup)

Run PowerShell as Administrator:

```powershell
New-NetFirewallRule -DisplayName "Textile Inspector" -Direction Inbound -Protocol TCP -LocalPort 3001,5000,5173 -Action Allow
```

---

## 2️⃣ Start Services

### Terminal 1: Backend
```bash
cd app/backend
npm start
```

### Terminal 2: Frontend
```bash
cd app/frontend
npm run dev
```

### Terminal 3: Inference
```bash
cd inference-service
venv\Scripts\activate
python http_server.py
```

---

## 3️⃣ Access Application

### From This Machine:
- https://100.86.98.82:5173
- https://localhost:5173

### From Other Devices on Network:
- https://100.86.98.82:5173

**Login**: admin / admin123

---

## 4️⃣ Verify Services

```powershell
.\check-services.ps1
```

---

## ✅ What's Configured

- ✅ Frontend: Accessible from network (port 5173)
- ✅ Backend: Accessible from network (port 3001)
- ✅ Inference: Accessible from network (port 5000)
- ✅ Database: Secure on localhost only (port 5432)
- ✅ SSL Certificates: Updated with IP address

---

## 🔧 Troubleshooting

**Can't access from other devices?**
1. Check firewall: `Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Textile*"}`
2. Test connectivity: `Test-NetConnection -ComputerName 100.86.98.82 -Port 5173`
3. Verify services: `.\check-services.ps1`

**Certificate warning in browser?**
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to 100.86.98.82"

---

## 📚 More Info

- Full details: `INTRANET_CONFIG_COMPLETE.md`
- PostgreSQL setup: `POSTGRESQL_NETWORK_CONFIG.md`
- Troubleshooting: `TROUBLESHOOTING.md`
