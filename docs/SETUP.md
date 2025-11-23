# Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Installation

### 1. Clone and Install Dependencies

```bash
npm run install:all
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb textile_inspector
```

Configure database connection in `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/textile_inspector
```

Run migrations:

```bash
npm run migrate
```

This will create all tables and seed default data including:
- Admin user (username: `admin`, password: `admin123`)
- Inspector user (username: `inspector1`, password: `admin123`)
- Default color taxonomy
- Default model and prompt

**IMPORTANT**: Change default passwords in production!

### 3. Configure Environment

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Key configurations:
- `JWT_SECRET`: Change to a secure random string
- `UPLOAD_DIR`: Directory for uploaded images
- `INFERENCE_SERVICE_URL`: Local inference service endpoint

### 4. Create Upload Directory

```bash
mkdir uploads
```

## Running the Application

### Development Mode

Start backend (Terminal 1):
```bash
npm run dev:backend
```

Start frontend (Terminal 2):
```bash
npm run dev:frontend
```

Access the application at `http://localhost:3000`

### Production Mode

Build frontend:
```bash
npm run build:frontend
```

Start backend:
```bash
npm start:backend
```

## TLS/HTTPS Setup (Production)

1. Generate or obtain SSL certificates
2. Update `.env`:
   ```
   USE_HTTPS=true
   TLS_CERT_PATH=/path/to/cert.pem
   TLS_KEY_PATH=/path/to/key.pem
   ```

## Inference Service

The application expects a local inference service at `INFERENCE_SERVICE_URL`.

Currently, the system uses a classical color extraction approach as a fallback. To integrate an LLM-based inference service:

1. Deploy your local inference runtime (e.g., ONNX, TensorFlow)
2. Ensure it accepts image inputs and returns JSON with LAB color values
3. Update `INFERENCE_SERVICE_URL` in `.env`

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running: `pg_isready`
- Check connection string in `.env`
- Ensure database exists: `psql -l`

### Upload Issues

- Verify `UPLOAD_DIR` exists and is writable
- Check `MAX_FILE_SIZE` setting
- Ensure sufficient disk space

### Port Conflicts

- Backend default: 3001
- Frontend default: 3000
- Change in `.env` (backend) or `vite.config.js` (frontend)

## Default Users

After running migrations, these users are available:

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| inspector1 | admin123 | inspector |

**Change these passwords immediately in production!**
