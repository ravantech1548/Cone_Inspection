# Quick Start Guide - Textile Cone Inspector

## 🎯 Overview

This system allows you to:
1. Upload 3 reference cone tip images (Green_brown, brown_purple_ring, brown_plain)
2. Select ONE as the "GOOD" type
3. Use camera or upload to scan cones - automatically classifies as GOOD or REJECT
4. Full audit trail and reporting

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Python 3.8+ (for YOLO inference)
- Your `best.pt` YOLO model

## 🚀 Setup (5 minutes)

### 1. Install Dependencies

```powershell
# Install Node.js dependencies
npm run install:all

# Install Python dependencies
cd inference-service
pip install -r requirements.txt
cd ..
```

### 2. Setup Database

```powershell
# Create PostgreSQL database (if not done)
# In pgAdmin4 or psql, run:
# CREATE DATABASE textile_inspector;
# CREATE USER textile_user WITH PASSWORD 'textile_pass_123';
# GRANT ALL PRIVILEGES ON DATABASE textile_inspector TO textile_user;

# Run migrations
npm run migrate
```

### 3. Setup Inference Service

```powershell
cd inference-service

# Create directories
mkdir models
mkdir -p reference_images/green_brown
mkdir -p reference_images/brown_purple_ring
mkdir -p reference_images/brown_plain

# Copy your best.pt model
# Copy best.pt to inference-service/models/best.pt

# Copy .env
cp .env.example .env
```

### 4. Configure Environment

Update `.env` in root directory:
```env
DATABASE_URL=postgresql://textile_user:textile_pass_123@127.0.0.1:5432/textile_inspector
INFERENCE_SERVICE_URL=http://localhost:8000
```

## 🎬 Running the Application

### Terminal 1: Start Inference Service
```powershell
cd inference-service
python http_server.py
```

### Terminal 2: Start Backend
```powershell
npm run dev:backend
```

### Terminal 3: Start Frontend
```powershell
npm run dev:frontend
```

## 📱 Using the Application

### Step 1: Login
- Open http://localhost:3000
- Login: `admin` / `admin123`

### Step 2: Upload Reference Images (Optional - Admin Only)
1. Click "References" in navigation
2. Classes are auto-loaded from your YOLO model
3. Upload sample images for each class (optional, for visual reference)

### Step 3: Start Inspection
1. Click "Inspection" in navigation
2. Select which cone tip type is "GOOD" (classes from your model)
3. Choose mode:
   - **📷 Camera**: Use webcam to capture images
   - **📁 Upload**: Upload images from file

### Step 4: Scan Cones
- **Camera Mode**: Point camera at cone tip → Click "Capture"
- **Upload Mode**: Click to upload image
- System automatically classifies using YOLO model
- Compares with selected GOOD class
- Results auto-saved to database

### Step 5: View Results
- Click "View Full Results" to see gallery
- Or go to "Reports" to view all batches
- Export reports as CSV/JSON

## 🔧 Troubleshooting

### Camera not working?
- Grant browser camera permissions
- Use Upload mode as alternative

### Inference service not responding?
- Check if Python server is running on port 8000
- System falls back to classical color extraction

### Database connection error?
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure textile_user has permissions

## 📊 Features

✅ **YOLO Model Integration**: Uses your custom best.pt model
✅ **Auto Class Detection**: Classes loaded from model automatically
✅ **Select Good Type**: Choose which class is acceptable
✅ **Camera Scanning**: Real-time capture and classification
✅ **Upload Mode**: Upload from files
✅ **Auto Save**: Results saved immediately to database
✅ **Thumbnails**: 200x200 previews stored in database
✅ **Audit Trail**: Full traceability of all decisions
✅ **Reports**: Export results as CSV/JSON

## 🎯 Workflow

```
1. YOLO model loaded → Classes extracted
   ↓
2. Inspector selects "GOOD" class
   ↓
3. Scan cones (camera or upload)
   ↓
4. YOLO classifies → Compare with GOOD class
   ↓
5. Auto-save to database with thumbnail
   ↓
6. View results → Export reports
```

## 📞 Support

For issues, check:
- Browser console (F12) for frontend errors
- Terminal output for backend errors
- PostgreSQL logs for database issues
- Python terminal for inference errors
