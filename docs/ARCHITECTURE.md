# Architecture Overview

## System Components

```
┌─────────────┐      ┌─────────────┐      ┌──────────────┐
│   Browser   │─────▶│   Backend   │─────▶│  PostgreSQL  │
│  (React)    │◀─────│  (Node.js)  │◀─────│   Database   │
└─────────────┘      └─────────────┘      └──────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Inference  │
                     │   Service   │
                     └─────────────┘
```

## Frontend (React + JSX)

**Technology Stack:**
- React 18 with JSX
- React Router for navigation
- Context API for state management
- Vite for build tooling

**Key Features:**
- Drag-and-drop file upload
- Real-time progress via SSE
- Responsive image gallery
- Color selection interface
- Manual override workflow
- Audit and reporting views

**Directory Structure:**
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route pages
│   ├── context/        # React Context providers
│   ├── utils/          # API client, helpers
│   └── styles/         # CSS files
```

## Backend (Node.js)

**Technology Stack:**
- Express.js for REST API
- PostgreSQL with pg driver
- JWT for authentication
- Busboy for streaming uploads
- Sharp for image processing

**Key Features:**
- Streaming file uploads with backpressure
- SHA-256 checksum deduplication
- Transactional classification
- Graceful shutdown (SIGTERM/SIGINT)
- Structured logging with correlation IDs

**Directory Structure:**
```
backend/
├── src/
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic
│   ├── middleware/     # Auth, error handling
│   ├── db/             # Database connection
│   └── config.js       # Configuration
```

## Database (PostgreSQL)

**Schema Design:**
- Normalized tables with foreign keys
- JSONB for flexible metadata (LAB colors, predictions)
- GIN indexes for JSONB queries
- B-tree indexes for common filters
- Unique constraint on image checksums

**Key Tables:**
- `users`: Authentication and RBAC
- `batches`: Upload batches with status
- `images`: Image metadata and classification
- `predictions`: Inference results with lineage
- `overrides`: Manual classification changes
- `models`: Model registry with versions
- `prompts`: Prompt registry with schemas
- `color_taxonomy`: Acceptable color definitions

## Inference Service

**Current Implementation:**
Classical color extraction using Sharp:
1. Extract center region (assumed tip location)
2. Calculate average RGB
3. Convert to LAB color space
4. Store with confidence score

**Future LLM Integration:**
- Local runtime (ONNX, TensorFlow, etc.)
- JSON-schema constrained responses
- Timeout enforcement (3s SLO)
- Model version tracking

## Data Flow

### Upload Flow
1. User drags images to browser
2. Frontend streams to backend via multipart
3. Backend computes SHA-256 checksum
4. Check for duplicates in database
5. Save file to disk, metadata to database
6. Trigger async inference
7. Return upload status to frontend

### Classification Flow
1. User selects acceptable color from taxonomy
2. Frontend sends color ID and ΔE tolerance
3. Backend retrieves reference LAB from taxonomy
4. For each image, calculate ΔE distance
5. Classify as Good (≤ tolerance) or Reject (> tolerance)
6. Update batch counts transactionally
7. Return results to frontend

### Override Flow
1. User reviews image in detail view
2. Provides reason and new classification
3. Backend creates override record
4. Updates image classification
5. Recalculates batch counts
6. Maintains audit trail

## Security

**Authentication:**
- JWT tokens with 24h expiration
- HttpOnly, Secure, SameSite cookies
- Bcrypt password hashing (10 rounds)

**Authorization:**
- Role-based access control (inspector, supervisor, admin)
- Route-level middleware enforcement
- Admin-only endpoints for taxonomy/models

**Input Validation:**
- Zod schemas for request validation
- File type checking (JPEG/PNG only)
- Size limits (10MB per file, 100 files per batch)
- Path sanitization for uploads

**Data Protection:**
- Parameterized SQL queries (no injection)
- Correlation IDs for request tracing
- Error message sanitization
- TLS in production

## Performance

**SLOs:**
- Single image inference: ≤3s p95
- Gallery load: ≤2s p95
- Upload throughput: streaming with backpressure

**Optimizations:**
- Database indexes on query fields
- JSONB GIN indexes for metadata
- Pagination for large result sets
- Async inference (non-blocking uploads)
- Connection pooling (2-10 connections)

## Observability

**Logging:**
- Structured JSON logs
- Correlation IDs for request tracing
- Query timing and row counts
- Error stack traces (sanitized in responses)

**Metrics (Future):**
- Upload success/failure rates
- Inference latency distribution
- Classification accuracy
- Override frequency

## Deployment

**Development:**
- Separate frontend/backend processes
- Hot reload with Vite and Node --watch
- Local PostgreSQL instance

**Production:**
- Built frontend served by backend
- HTTPS with TLS certificates
- PostgreSQL with connection pooling
- Process manager (PM2, systemd)
- Reverse proxy (nginx) for static assets
