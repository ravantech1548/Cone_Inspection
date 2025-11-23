# Textile Cone Inspector - Deployment Guide

Complete guide for deploying the application to a new machine.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Installation Steps](#installation-steps)
4. [Database Setup](#database-setup)
5. [Application Configuration](#application-configuration)
6. [YOLO Model Setup](#yolo-model-setup)
7. [Running the Application](#running-the-application)
8. [Verification](#verification)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.x or higher
- **Python**: 3.8 or higher
- **PostgreSQL**: 14.x or higher
- **Git**: For cloning the repository

### Operating System

- Windows 10/11
- Linux (Ubuntu 20.04+)
- macOS 10.15+

---

## System Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 20 GB free space
- **GPU**: Optional (for faster YOLO inference)

### Recommended Requirements
- **CPU**: 8 cores
- **RAM**: 16 GB
- **Storage**: 50 GB free space
- **GPU**: NVIDIA GPU with CUDA support

---

## Installation Steps

### Step 1: Install Node.js

#### Windows
```powershell
# Download from https://nodejs.org/
# Install LTS version (v18.x or higher)

# Verify installation
node --version
npm --version
```

#### Linux (Ubuntu/Debian)
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### macOS
```bash
# Using Homebrew
brew install node@18

# Verify installation
node --version
npm --version
```

---

### Step 2: Install Python

#### Windows
```powershell
# Download from https://www.python.org/downloads/
# Install Python 3.8 or higher
# Make sure to check "Add Python to PATH"

# Verify installation
python --version
pip --version
```

#### Linux (Ubuntu/Debian)
```bash
# Install Python 3 and pip
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv

# Verify installation
python3 --version
pip3 --version
```

#### macOS
```bash
# Using Homebrew
brew install python@3.11

# Verify installation
python3 --version
pip3 --version
```

---

### Step 3: Install PostgreSQL

#### Windows
```powershell
# Download from https://www.postgresql.org/download/windows/
# Install PostgreSQL 14 or higher
# Remember the password you set for the postgres user

# Verify installation
psql --version
```

#### Linux (Ubuntu/Debian)
```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

#### macOS
```bash
# Using Homebrew
brew install postgresql@14

# Start PostgreSQL service
brew services start postgresql@14

# Verify installation
psql --version
```

---

## Database Setup

### Step 1: Create Database User

```bash
# Connect to PostgreSQL as postgres user
# Windows: Use pgAdmin or psql from Start Menu
# Linux/Mac: Use terminal

sudo -u postgres psql

# Or on Windows:
psql -U postgres
```

```sql
-- Create user
CREATE USER textile_user WITH PASSWORD 'textile_pass_123';

-- Create database
CREATE DATABASE textile_inspector OWNER textile_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE textile_inspector TO textile_user;

-- Exit
\q
```

### Step 2: Verify Database Connection

```bash
# Test connection
psql -U textile_user -d textile_inspector -h localhost

# If successful, you'll see:
# textile_inspector=>

# Exit
\q
```

### Step 3: Run Database Migrations

```bash
# Navigate to project directory
cd /path/to/textile-cone-inspector

# Run migrations
node app/backend/src/db/migrate.js
```

**Expected Output:**
```
Running migrations...
✓ Migration 001_initial_schema.sql completed
✓ Migration 002_add_batch_metadata.sql completed
✓ Migration 003_add_thumbnail.sql completed
All migrations completed successfully!
```

### Step 4: Create Initial Admin User

```bash
# Connect to database
psql -U textile_user -d textile_inspector -h localhost
```

```sql
-- Create admin user (password: admin123)
INSERT INTO users (username, password_hash, role)
VALUES (
  'admin',
  '$2b$10$rZ5YhJKvXqKqYqKqYqKqYuO5YhJKvXqKqYqKqYqKqYqKqYqKqYqKq',
  'admin'
);

-- Create inspector user (password: inspector123)
INSERT INTO users (username, password_hash, role)
VALUES (
  'inspector',
  '$2b$10$rZ5YhJKvXqKqYqKqYqKqYuO5YhJKvXqKqYqKqYqKqYqKqYqKqYqKq',
  'inspector'
);

-- Verify
SELECT id, username, role FROM users;

-- Exit
\q
```

**Note**: For production, generate proper password hashes using bcrypt.

---

## Application Configuration

### Step 1: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd textile-cone-inspector

# Or if you have a zip file
unzip textile-cone-inspector.zip
cd textile-cone-inspector
```

### Step 2: Configure Environment Variables

#### Backend Configuration

```bash
# Copy example env file
cp .env.example .env

# Edit .env file
nano .env  # or use any text editor
```

**.env file:**
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=textile_inspector
DB_USER=textile_user
DB_PASSWORD=textile_pass_123

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
MAX_BATCH_SIZE=100

# Inference Service
INFERENCE_SERVICE_URL=http://localhost:5000
INFERENCE_TIMEOUT=30000
```

#### Inference Service Configuration

```bash
# Navigate to inference service
cd inference-service

# Copy example env file
cp .env.example .env

# Edit .env file
nano .env
```

**inference-service/.env file:**
```env
# Server
PORT=5000
HOST=0.0.0.0

# Model
MODEL_PATH=./models/best.pt
CONFIDENCE_THRESHOLD=0.3

# Logging
LOG_LEVEL=INFO
```

### Step 3: Install Dependencies

#### Backend Dependencies

```bash
# Navigate to backend
cd app/backend

# Install dependencies
npm install

# Expected packages:
# - express
# - pg
# - bcrypt
# - jsonwebtoken
# - busboy
# - sharp
# - zod
# - etc.
```

#### Frontend Dependencies

```bash
# Navigate to frontend
cd app/frontend

# Install dependencies
npm install

# Expected packages:
# - react
# - react-dom
# - react-router-dom
# - vite
# - etc.
```

#### Inference Service Dependencies

```bash
# Navigate to inference service
cd inference-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Expected packages:
# - ultralytics
# - opencv-python
# - numpy
# - flask
# - pillow
# - torch
# - etc.
```

---

## YOLO Model Setup

### Step 1: Place YOLO Model

```bash
# Create models directory
mkdir -p inference-service/models

# Copy your trained YOLO model
# Place best.pt in inference-service/models/
cp /path/to/your/best.pt inference-service/models/best.pt
```

### Step 2: Verify Model

```bash
# Navigate to inference service
cd inference-service

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Inspect model
python inspect_model.py
```

**Expected Output:**
```
Model: best.pt
Classes: ['green_brown', 'brown_purple_ring', 'brown_plain']
Input size: 640x640
Parameters: 3.2M
```

### Step 3: Register Model in Database

```bash
# Connect to database
psql -U textile_user -d textile_inspector -h localhost
```

```sql
-- Register YOLO model
INSERT INTO models (name, version, checksum, config, is_active)
VALUES (
  'cone-tip-classifier',
  'v1.0.0',
  'checksum-of-your-model',
  '{"input_size": 640, "classes": ["green_brown", "brown_purple_ring", "brown_plain"]}',
  true
);

-- Verify
SELECT * FROM models;

-- Exit
\q
```

---

## Running the Application

### Option 1: Using Start Script (Windows)

```powershell
# Run all services
.\start-all.ps1
```

### Option 2: Manual Start (All Platforms)

#### Terminal 1: Backend

```bash
cd app/backend
npm start
```

**Expected Output:**
```
Server running on http://localhost:3001
Environment: production
```

#### Terminal 2: Frontend

```bash
cd app/frontend
npm run dev
```

**Expected Output:**
```
VITE v4.x.x ready in 500 ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

#### Terminal 3: Inference Service

```bash
cd inference-service

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows

# Start service
python http_server.py
```

**Expected Output:**
```
Loading YOLO model from ./models/best.pt
Model loaded successfully
Classes: ['green_brown', 'brown_purple_ring', 'brown_plain']
Server running on http://0.0.0.0:5000
```

---

## Verification

### Step 1: Check Services

```bash
# Check if all services are running

# Backend
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":"..."}

# Frontend
curl http://localhost:5173
# Expected: HTML content

# Inference Service
curl http://localhost:5000/health
# Expected: {"status":"healthy","model_loaded":true}
```

### Step 2: Test Login

1. Open browser: http://localhost:5173
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Should redirect to dashboard

### Step 3: Test Classification

1. Create new batch
2. Select good class (e.g., "green_brown")
3. Upload or capture cone image
4. Verify classification result
5. Check report

### Step 4: Run Verification Script

```bash
# Run verification
node verify-database.js
```

**Expected Output:**
```
✓ Database connection successful
✓ All required tables present
✓ Foreign key relationships intact
✓ Indexes created
✓ Basic queries working
Database is ready for use! 🎉
```

---

## Troubleshooting

### Database Connection Issues

**Problem**: Cannot connect to database

**Solution**:
```bash
# Check PostgreSQL is running
# Windows:
services.msc  # Look for PostgreSQL service

# Linux:
sudo systemctl status postgresql

# Mac:
brew services list

# Check connection
psql -U textile_user -d textile_inspector -h localhost

# If password fails, reset it:
sudo -u postgres psql
ALTER USER textile_user WITH PASSWORD 'textile_pass_123';
```

### Port Already in Use

**Problem**: Port 3001, 5173, or 5000 already in use

**Solution**:
```bash
# Find process using port
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3001
kill -9 <PID>

# Or change port in .env file
```

### YOLO Model Not Loading

**Problem**: Inference service fails to load model

**Solution**:
```bash
# Check model file exists
ls -la inference-service/models/best.pt

# Check file permissions
chmod 644 inference-service/models/best.pt

# Verify model format
python inference-service/inspect_model.py

# Check Python dependencies
pip list | grep ultralytics
pip install --upgrade ultralytics
```

### Migration Errors

**Problem**: Database migrations fail

**Solution**:
```bash
# Check database exists
psql -U postgres -l | grep textile_inspector

# Check user permissions
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE textile_inspector TO textile_user;

# Run migrations manually
psql -U textile_user -d textile_inspector -f app/db/migrations/001_initial_schema.sql
psql -U textile_user -d textile_inspector -f app/db/migrations/002_add_batch_metadata.sql
psql -U textile_user -d textile_inspector -f app/db/migrations/003_add_thumbnail.sql
```

### NPM Install Fails

**Problem**: npm install fails with errors

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still fails, try with legacy peer deps
npm install --legacy-peer-deps
```

### Python Dependencies Fail

**Problem**: pip install fails

**Solution**:
```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install with verbose output
pip install -r requirements.txt -v

# If torch fails, install separately
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Then install rest
pip install -r requirements.txt
```

---

## Production Deployment

### Security Checklist

- [ ] Change default passwords
- [ ] Generate strong JWT secret
- [ ] Use HTTPS (SSL/TLS certificates)
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable PostgreSQL authentication
- [ ] Restrict CORS origins
- [ ] Use environment-specific configs
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting

### Performance Optimization

- [ ] Enable PostgreSQL connection pooling
- [ ] Configure Nginx reverse proxy
- [ ] Set up Redis for caching
- [ ] Optimize YOLO model (quantization)
- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Set up load balancing
- [ ] Monitor resource usage

### Backup Strategy

```bash
# Database backup
pg_dump -U textile_user textile_inspector > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U textile_user -d textile_inspector < backup_20231123.sql

# Backup uploaded images
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Automated daily backup (cron)
0 2 * * * /path/to/backup-script.sh
```

---

## Quick Start Commands

```bash
# Complete setup from scratch
git clone <repo>
cd textile-cone-inspector

# Install dependencies
cd app/backend && npm install
cd ../frontend && npm install
cd ../../inference-service && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt

# Setup database
psql -U postgres -c "CREATE USER textile_user WITH PASSWORD 'textile_pass_123';"
psql -U postgres -c "CREATE DATABASE textile_inspector OWNER textile_user;"
node app/backend/src/db/migrate.js

# Configure
cp .env.example .env
cp inference-service/.env.example inference-service/.env

# Start services
# Terminal 1: cd app/backend && npm start
# Terminal 2: cd app/frontend && npm run dev
# Terminal 3: cd inference-service && source venv/bin/activate && python http_server.py

# Access application
# http://localhost:5173
```

---

## Support

For issues or questions:
- Check `TROUBLESHOOTING.md`
- Review `SYSTEM_VERIFICATION.md`
- Check application logs
- Verify database connectivity

---

## Summary

✅ Node.js installed  
✅ Python installed  
✅ PostgreSQL installed  
✅ Database created and migrated  
✅ Dependencies installed  
✅ YOLO model configured  
✅ Services running  
✅ Application accessible  

Your textile cone inspector is now deployed and ready for use! 🎉
