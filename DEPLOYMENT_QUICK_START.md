# Deployment Quick Start

Fast deployment guide for experienced users.

---

## Prerequisites

- Node.js 18+
- Python 3.8+
- PostgreSQL 14+

---

## Quick Setup

### 1. Automated Setup

#### Linux/macOS
```bash
chmod +x setup.sh
./setup.sh
```

#### Windows
```powershell
.\setup.ps1
```

### 2. Manual Setup

```bash
# Install dependencies
cd app/backend && npm install
cd ../frontend && npm install
cd ../../inference-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# Configure
cp .env.example .env
cp inference-service/.env.example inference-service/.env

# Setup database
psql -U postgres << EOF
CREATE USER textile_user WITH PASSWORD 'textile_pass_123';
CREATE DATABASE textile_inspector OWNER textile_user;
GRANT ALL PRIVILEGES ON DATABASE textile_inspector TO textile_user;
EOF

# Run migrations
node app/backend/src/db/migrate.js

# Create admin user
psql -U textile_user -d textile_inspector << EOF
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '\$2b\$10\$rZ5YhJKvXqKqYqKqYqKqYuO5YhJKvXqKqYqKqYqKqYqKqYqKqYqKq', 'admin');
EOF

# Place YOLO model
cp /path/to/best.pt inference-service/models/best.pt

# Start services
# Terminal 1: cd app/backend && npm start
# Terminal 2: cd app/frontend && npm run dev
# Terminal 3: cd inference-service && source venv/bin/activate && python http_server.py
```

---

## Configuration Files

### .env
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=textile_inspector
DB_USER=textile_user
DB_PASSWORD=textile_pass_123
PORT=3001
JWT_SECRET=change-this-secret
FRONTEND_URL=http://localhost:5173
INFERENCE_SERVICE_URL=http://localhost:5000
```

### inference-service/.env
```env
PORT=5000
MODEL_PATH=./models/best.pt
CONFIDENCE_THRESHOLD=0.3
```

---

## Database Schema

```sql
-- Core tables
users               -- Authentication
batches             -- Inspection batches
images              -- Cone images
predictions         -- YOLO results
models              -- Model registry
batch_metadata      -- Batch settings
```

---

## Default Credentials

- **Username**: admin
- **Password**: admin123

⚠️ Change in production!

---

## Ports

- Frontend: 5173
- Backend: 3001
- Inference: 5000
- PostgreSQL: 5432

---

## Verification

```bash
# Check services
curl http://localhost:3001/health
curl http://localhost:5000/health

# Check database
psql -U textile_user -d textile_inspector -c "SELECT COUNT(*) FROM users;"

# Run verification
node verify-database.js
```

---

## Troubleshooting

### Port in use
```bash
# Linux/Mac
lsof -i :3001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Database connection
```bash
# Test connection
psql -U textile_user -d textile_inspector -h localhost

# Reset password
psql -U postgres
ALTER USER textile_user WITH PASSWORD 'textile_pass_123';
```

### Model not loading
```bash
# Check model
ls -la inference-service/models/best.pt
python inference-service/inspect_model.py
```

---

## Production Checklist

- [ ] Change default passwords
- [ ] Generate strong JWT secret
- [ ] Configure HTTPS
- [ ] Set up firewall
- [ ] Enable database backups
- [ ] Configure monitoring
- [ ] Set up logging
- [ ] Optimize YOLO model
- [ ] Configure reverse proxy
- [ ] Set up rate limiting

---

## Backup & Restore

```bash
# Backup database
pg_dump -U textile_user textile_inspector > backup.sql

# Restore database
psql -U textile_user -d textile_inspector < backup.sql

# Backup uploads
tar -czf uploads_backup.tar.gz uploads/
```

---

## Useful Commands

```bash
# Clear all data
node clear-all-data.js --confirm

# Reset ID sequences
node reset-batch-id.js --confirm

# Fix batch statuses
node fix-batch-status.js

# Verify database
node verify-database.js

# Test reports API
node test-reports-api.js
```

---

## Directory Structure

```
textile-cone-inspector/
├── app/
│   ├── backend/          # Node.js API
│   ├── frontend/         # React UI
│   └── db/
│       └── migrations/   # SQL migrations
├── inference-service/    # Python YOLO service
│   ├── models/          # YOLO model files
│   └── venv/            # Python virtual env
├── uploads/             # Uploaded images
├── .env                 # Backend config
└── start-all.ps1        # Start script
```

---

## Support Files

- `DEPLOYMENT_GUIDE.md` - Full deployment guide
- `TROUBLESHOOTING.md` - Common issues
- `SYSTEM_VERIFICATION.md` - System checks
- `DATABASE_FINAL_REPORT.md` - Database documentation
- `FINAL_SUMMARY.md` - Complete feature list

---

## Quick Links

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health
- Inference Health: http://localhost:5000/health

---

**Ready in 5 minutes! 🚀**
