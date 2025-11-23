# Textile Cone-Tip Inspector

Local-inference web application for automated textile cone-tip color inspection with user-in-the-loop verification.

## Features

- Bulk image upload with deduplication
- Interactive gallery with color selection
- Automated color-based classification (ΔE tolerance)
- Manual override with audit trail
- Local inference only (on-premises)
- PostgreSQL storage for full traceability

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
├── frontend/     React JSX application
├── backend/      Node.js API server
├── shared/       Shared validators and constants
└── db/           Database migrations and seeds
```

## Documentation

See `docs/` for detailed architecture, API contracts, and admin guides.
