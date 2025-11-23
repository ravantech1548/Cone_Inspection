# Textile Cone-Tip Inspector

Local-inference web application for automated textile cone-tip inspection using YOLO classification.

## Features

- 📷 Camera or upload-based inspection
- 🤖 YOLO best.pt model integration
- ✅ Auto-classification (Good/Reject)
- 📊 Real-time inspection results
- 🗄️ PostgreSQL storage with thumbnails
- 📈 Inspection reports and audit trail
- 🔒 Local inference only (on-premises)

## Architecture

- **Frontend**: React (JSX) with SSE for real-time updates
- **Backend**: Node.js REST API with streaming uploads
- **Inference**: Local runtime with JSON-schema prompts
- **Database**: PostgreSQL with JSONB for metadata

## Setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Configure environment (see `.env.example`)

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. Start development servers:
   ```bash
   npm run dev:backend  # Terminal 1
   npm run dev:frontend # Terminal 2
   ```

## Project Structure

```
app/
├── frontend/          React JSX application
├── backend/           Node.js API server
├── shared/            Shared validators and constants
└── db/                Database migrations and seeds
inference-service/     Python YOLO inference service
```

## Main Pages

- **Inspection**: Camera/upload scanning with real-time classification
- **Reports**: View and export inspection batch results
- **References**: Upload reference images (admin only)

## Documentation

See `docs/` for detailed architecture, API contracts, and admin guides.
