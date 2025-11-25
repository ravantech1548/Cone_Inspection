# Textile Cone Inspector - Complete Deployment Guide

**Version**: 2.0  
**Last Updated**: November 2025  
**System**: Windows/Linux/macOS  

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [System Requirements](#system-requirements)
4. [Installation Steps](#installation-steps)
5. [Database Setup](#database-setup)
6. [Application Configuration](#application-configuration)
7. [Network Configuration](#network-configuration)
8. [SSL Certificate Setup](#ssl-certificate-setup)
9. [Running the Application](#running-the-application)
10. [Verification](#verification)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Textile Cone Inspector is a web-based application for automated inspection of textile cone tips using YOLO classification. This guide covers complete deployment from scratch.

### Key Features
- 📷 Camera or upload-based inspection
- 🤖 YOLO model integration (best.pt)
- ✅ Auto-classification (Good/Reject)
- 📊 Real-time results and reporting
- 🗄️ PostgreSQL database with audit trail
- 🔒 Local/Intranet deployment

### Architecture
- **Frontend**: React + Vite (Port 5173)
- **Backend**: Node.js + Express (Port 3001)
- **Inference**: Python + Flask + YOLO (Port 5000)
- **Database**: PostgreSQL (Port 5432)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 18.x or higher | Backend & Frontend |
| Python | 3.8 or higher | Inference Service |
| PostgreSQL | 14.x or higher | Database |
| Git | Latest | Version Control |
| OpenSSL | Latest | SSL Certificates |

### Operating System Support
- ✅ Windows 10/11
- ✅ Linux (Ubuntu 20.04+)
- ✅ macOS 10.15+

---

## System Requirements

### Minimum Requirements
- **CPU**: 4 cores
- **RAM**: 8 GB
- **Storage**: 20 GB free space
- **Network**: 100 Mbps

### Recommended Requirements
- **CPU**: 8 cores
- **RAM**: 16 GB
- **Storage**: 50 GB SSD
- **Network**: 1 Gbps
- **GPU**: NVIDIA GPU with CUDA (optional, for faster inference)

---

## Installation Steps

### Step 1: Install Node.js

#### Windows
```powershell
# Download from https://nodejs.org/
# Install LTS version (v18.x or higher)
# Run installer and follow prompts

# Verify installation
node --version
npm --version
```

**Expected Output**:
```
v18.17.0
9.6.7
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
# ⚠️ IMPORTANT: Check "Add Python to PATH" during installation

# Verify installation
python --version
pip --version
```

**Expected Output**:
```
Python 3.11.5
pip 23.2.1
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
# During installation:
#   - Set password for postgres user (remember this!)
#   - Port: 5432 (default)
#   - Locale: Default

# Verify installation
psql --version
```

**Expected Output**:
```
psql (PostgreSQL) 14.9
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

### Step 4: Install OpenSSL (for SSL Certificates)

#### Windows
```powershell
# Download from https://slproweb.com/products/Win32OpenSSL.html
# Install "Win64 OpenSSL v3.x.x Light"
# Default installation path: C:\Program Files\OpenSSL-Win64

# Verify installation
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" version
```

#### Linux
```bash
# Usually pre-installed
openssl version

# If not installed:
sudo apt-get install openssl
```

#### macOS
```bash
# Pre-installed with macOS
openssl version

# Or install latest via Homebrew:
brew install openssl
```

---

## Database Setup

### Step 1: Create Database and User

#### Windows (PowerShell)
```powershell
# Open PowerShell as Administrator
# Set password environment variable
$env:PGPASSWORD='your_postgres_password'

# Connect to PostgreSQL
psql -U postgres -h localhost
```

#### Linux/macOS
```bash
# Switch to postgres user
sudo -u postgres psql
```

### Step 2: Run SQL Commands

```sql
-- Create database user
CREATE USER textile_user WITH PASSWORD 'textile_pass_123';

-- Create database
CREATE DATABASE textile_inspector OWNER textile_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE textile_inspector TO textile_user;

-- Verify
\l textile_inspector
\du textile_user

-- Exit
\q
```

**Expected Output**:
```
CREATE ROLE
CREATE DATABASE
GRANT
```

### Step 3: Test Database Connection

```bash
# Test connection
psql -U textile_user -d textile_inspector -h 127.0.0.1

# If successful, you'll see:
# Password for user textile_user:
# textile_inspector=>

# Exit
\q
```

### Step 4: Set Database Timezone

```bash
# Navigate to project directory
cd /path/to/textile-cone-inspector

# Run timezone configuration
node set-database-timezone.js
```

**Expected Output**:
```
Current database timezone: UTC
✓ Database default timezone set to Asia/Singapore
New database timezone: Asia/Singapore
✓ Database timezone configured successfully!
```

---

## Application Configuration

### Step 1: Clone or Extract Project

```bash
# If using Git
git clone <repository-url>
cd textile-cone-inspector

# Or if using ZIP file
unzip textile-cone-inspector.zip
cd textile-cone-inspector
```

### Step 2: Install Backend Dependencies

```bash
# Navigate to backend
cd app/backend

# Install dependencies
npm install
```

**Expected Packages**:
- express
- pg (PostgreSQL client)
- bcrypt
- jsonwebtoken
- busboy
- sharp
- dotenv
- cors

**Expected Output**:
```
added 150 packages in 30s
```

### Step 3: Install Frontend Dependencies

```bash
# Navigate to frontend
cd app/frontend

# Install dependencies
npm install
```

**Expected Packages**:
- react
- react-dom
- react-router-dom
- vite
- axios

**Expected Output**:
```
added 200 packages in 25s
```

### Step 4: Install Inference Service Dependencies

```bash
# Navigate to inference service
cd inference-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# Linux/macOS:
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

**Expected Packages**:
- ultralytics (YOLO)
- opencv-python
- numpy
- flask
- flask-cors
- pillow
- torch
- python-dotenv

**Expected Output**:
```
Successfully installed ultralytics-8.0.0 torch-2.0.0 ...
```

---

## Step 5: Run Database Migrations

```bash
# Navigate to project root
cd /path/to/textile-cone-inspector

# Run migrations
node app/backend/src/db/migrate.js
```

**Expected Output**:
```
Running migrations...
✓ Migration 001_initial_schema.sql completed
✓ Migration 002_add_batch_metadata.sql completed
✓ Migration 003_add_thumbnail.sql completed
✓ Migration 004_cleanup_unused_tables.sql completed
✓ Migration 005_fix_duplicate_predictions.sql completed
All migrations completed successfully!
```

### Step 6: Create Admin User

```bash
# Connect to database
psql -U textile_user -d textile_inspector -h 127.0.0.1
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

-- Verify users created
SELECT id, username, role, created_at FROM users;

-- Exit
\q
```

**Expected Output**:
```
INSERT 0 1
INSERT 0 1
 id | username  |   role    |         created_at
----+-----------+-----------+----------------------------
  1 | admin     | admin     | 2025-11-24 18:00:00
  2 | inspector | inspector | 2025-11-24 18:00:01
```

### Step 7: Register YOLO Model

```bash
# Connect to database
psql -U textile_user -d textile_inspector -h 127.0.0.1
```

```sql
-- Register YOLO model
INSERT INTO models (name, version, checksum, config, is_active)
VALUES (
  'cone-tip-classifier',
  'v1.0.0',
  'model-checksum-here',
  '{"input_size": 640, "classes": ["Green_brown_shade", "Brown_purple_ring", "Brown_plain"]}',
  true
);

-- Verify model registered
SELECT id, name, version, is_active FROM models;

-- Exit
\q
```

---


## Network Configuration

### Step 1: Get Your Machine's IP Address

#### Windows
```powershell
# Get IP address from Wi-Fi or Ethernet adapter
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*"}
```

**Example Output**:
```
IPAddress       InterfaceAlias
---------       --------------
192.168.1.106   Wi-Fi
```

#### Linux
```bash
# Get IP address
ip addr show | grep "inet " | grep -v 127.0.0.1
```

#### macOS
```bash
# Get IP address
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Note your IP address** - you'll need it for configuration (e.g., 192.168.1.106)

### Step 2: Configure Environment Files

#### Main .env File

Create/edit `.env` in project root:

```env
# Database (localhost for security - backend runs on same machine)
DATABASE_URL=postgresql://textile_user:textile_pass_123@127.0.0.1:5432/textile_inspector
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_TIMEZONE=Asia/Singapore

# Server
NODE_ENV=development
PORT=3001
FRONTEND_URL=https://192.168.1.106:5173

# Security
JWT_SECRET=your-secret-key-change-in-production
SESSION_SECRET=your-session-secret-change-in-production

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
MAX_BATCH_SIZE=100

# Inference
INFERENCE_TIMEOUT=30000
INFERENCE_SERVICE_URL=https://192.168.1.106:5000
MODEL_VERSION=v1.0.0
DEFAULT_CONFIDENCE_THRESHOLD=0.3

# Color tolerance
DEFAULT_DELTA_E_TOLERANCE=10

# Network Configuration
BACKEND_HOST=0.0.0.0
BACKEND_PORT=3001
FRONTEND_HOST=0.0.0.0
FRONTEND_PORT=5173
INFERENCE_HOST=0.0.0.0
INFERENCE_PORT=5000

# TLS/HTTPS
USE_HTTPS=true
TLS_CERT_PATH=../../certs/backend-cert.pem
TLS_KEY_PATH=../../certs/backend-key.pem
```

**⚠️ Important**: Replace `192.168.1.106` with YOUR actual IP address!

#### Inference Service .env File

Create/edit `inference-service/.env`:

```env
MODEL_PATH=./models/best.pt
REFERENCE_IMAGES_DIR=./reference_images

# Server
PORT=5000
HOST=0.0.0.0

# Inference Settings
DEFAULT_CONFIDENCE_THRESHOLD=0.3
MIN_CONFIDENCE_THRESHOLD=0.1
MAX_CONFIDENCE_THRESHOLD=1.0

# HTTPS/TLS
USE_HTTPS=true
TLS_CERT_PATH=../certs/inference-cert.pem
TLS_KEY_PATH=../certs/inference-key.pem
```

### Step 3: Update Configuration Files

The following files need to use your IP address. They should already be configured if you used the .env file correctly, but verify:

#### Files to Check:
- ✅ `.env` - Main configuration
- ✅ `app/backend/src/config.js` - Backend defaults
- ✅ `app/frontend/vite.config.js` - Frontend proxy
- ✅ `inference-service/.env` - Inference service

**Verification**:
```bash
# Check .env file
cat .env | grep "192.168.1.106"

# Should show:
# FRONTEND_URL=https://192.168.1.106:5173
# INFERENCE_SERVICE_URL=https://192.168.1.106:5000
```

---

## SSL Certificate Setup

### Step 1: Create Certificates Directory

```bash
# Create certs directory
mkdir certs
```

### Step 2: Generate SSL Certificates

#### Windows
```powershell
# Run certificate generation script
.\generate-ssl-certs.ps1
```

Or manually:
```powershell
# Generate backend certificate
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" req -x509 -newkey rsa:4096 -keyout certs\backend-key.pem -out certs\backend-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=192.168.1.106" -addext "subjectAltName=IP:192.168.1.106,DNS:localhost"

# Generate inference certificate
& "C:\Program Files\OpenSSL-Win64\bin\openssl.exe" req -x509 -newkey rsa:4096 -keyout certs\inference-key.pem -out certs\inference-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=192.168.1.106" -addext "subjectAltName=IP:192.168.1.106,DNS:localhost"
```

#### Linux/macOS
```bash
# Run certificate generation script
chmod +x generate-ssl-certs.sh
./generate-ssl-certs.sh
```

Or manually:
```bash
# Generate backend certificate
openssl req -x509 -newkey rsa:4096 -keyout certs/backend-key.pem -out certs/backend-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=192.168.1.106" -addext "subjectAltName=IP:192.168.1.106,DNS:localhost"

# Generate inference certificate
openssl req -x509 -newkey rsa:4096 -keyout certs/inference-key.pem -out certs/inference-cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/OU=Department/CN=192.168.1.106" -addext "subjectAltName=IP:192.168.1.106,DNS:localhost"
```

**⚠️ Important**: Replace `192.168.1.106` with YOUR actual IP address!

### Step 3: Verify Certificates

```bash
# List certificate files
ls -la certs/

# Should show:
# backend-cert.pem
# backend-key.pem
# inference-cert.pem
# inference-key.pem
```

### Step 4: Configure Windows Firewall (Windows Only)

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Textile Inspector - Frontend" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
New-NetFirewallRule -DisplayName "Textile Inspector - Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
New-NetFirewallRule -DisplayName "Textile Inspector - Inference" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

**Or use Windows Defender Firewall GUI**:
1. Open Windows Security → Firewall & network protection
2. Advanced settings → Inbound Rules → New Rule
3. Port → TCP → Specific ports: `3001,5000,5173`
4. Allow the connection → Apply to all profiles
5. Name: "Textile Inspector Services"

---

## YOLO Model Setup

### Step 1: Place YOLO Model

```bash
# Create models directory
mkdir -p inference-service/models

# Copy your trained YOLO model
# Place best.pt in inference-service/models/
cp /path/to/your/best.pt inference-service/models/best.pt

# Verify model exists
ls -la inference-service/models/best.pt
```

### Step 2: Verify Model

```bash
# Navigate to inference service
cd inference-service

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Inspect model
python inspect_model.py
```

**Expected Output**:
```
Model: best.pt
Type: YOLOv8 Classification
Classes: ['Green_brown_shade', 'Brown_purple_ring', 'Brown_plain']
Number of classes: 3
Input size: 640x640
Parameters: 3.2M
```

### Step 3: Create Reference Images Directories (Optional)

```bash
# Create reference image directories
mkdir -p inference-service/reference_images/Green_brown_shade
mkdir -p inference-service/reference_images/Brown_purple_ring
mkdir -p inference-service/reference_images/Brown_plain

# Copy reference images (optional)
# These are for visual reference only, not used in classification
```

---

## Running the Application

### Option 1: Using Start Script (Windows)

```powershell
# Start all services at once
.\start-all.ps1
```

This will open 3 terminal windows for:
- Backend (Port 3001)
- Frontend (Port 5173)
- Inference Service (Port 5000)

### Option 2: Manual Start (All Platforms)

Open 3 separate terminal windows:

#### Terminal 1: Backend

```bash
# Navigate to backend
cd app/backend

# Start backend
npm start
```

**Expected Output**:
```
✓ HTTPS server running on https://192.168.1.106:3001
  Environment: development
  Certificate: ../../certs/backend-cert.pem
  Accessible from intranet at: https://192.168.1.106:3001
```

#### Terminal 2: Frontend

```bash
# Navigate to frontend
cd app/frontend

# Start frontend
npm run dev
```

**Expected Output**:
```
VITE v4.5.0 ready in 500 ms

➜  Local:   https://192.168.1.106:5173/
➜  Network: https://192.168.1.106:5173/
➜  press h to show help
```

#### Terminal 3: Inference Service

```bash
# Navigate to inference service
cd inference-service

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Start inference service
python http_server.py
```

**Expected Output**:
```
Loading YOLO model from ./models/best.pt
✓ Model loaded from ./models/best.pt
✓ Classes: ['Green_brown_shade', 'Brown_purple_ring', 'Brown_plain']
✓ HTTPS server running on https://0.0.0.0:5000
 * Running on https://192.168.1.106:5000
```

---

## Verification

### Step 1: Check Services Status

```bash
# Run service check script
.\check-services.ps1
```

**Expected Output**:
```
==================================
Checking Services Status
==================================

1. Backend (Port 3001):
   ✓ Backend is running (HTTPS)

2. Frontend (Port 5173):
   ✓ Frontend is running (HTTPS)

3. Inference Service (Port 5000):
   ✓ Inference service is running (HTTPS)
   - Model loaded: True

4. Model Info:
   ✓ Model info available (HTTPS)
   - Classes: Green_brown_shade, Brown_purple_ring, Brown_plain
   - Num classes: 3
```

### Step 2: Test Database

```bash
# Run database verification
node verify-database.js
```

**Expected Output**:
```
✓ Database connection successful
  Database: textile_inspector
  User: textile_user

✓ All required tables present:
  - users
  - batches
  - images
  - predictions
  - models
  - batch_metadata

✓ Foreign key relationships intact
✓ Indexes created
✓ Basic queries working

Database is ready for use! 🎉
```

### Step 3: Test Application Access

#### From Local Machine:
1. Open browser
2. Navigate to: **https://192.168.1.106:5173**
3. Accept security warning (self-signed certificate)
4. Login with: **admin** / **admin123**
5. Should see dashboard

#### From Another Device on Network:
1. Connect device to same network
2. Open browser
3. Navigate to: **https://192.168.1.106:5173**
4. Accept security warning
5. Login with: **admin** / **admin123**
6. Test all features

### Step 4: Test Classification

1. **Create New Batch**:
   - Click "Inspection" in navigation
   - Select good class (e.g., "Green_brown_shade")
   - Click "Start Inspection"

2. **Upload/Capture Image**:
   - Use camera or upload file
   - System should classify automatically
   - Result should show GOOD or REJECT

3. **View Results**:
   - Click "View Full Results"
   - Should see gallery of inspected images
   - Each image should have classification

4. **Generate Report**:
   - Go to "Reports"
   - Select batch
   - Click "View Report"
   - Export as CSV or JSON
   - Verify timestamps appear correctly

---

