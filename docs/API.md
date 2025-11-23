# API Documentation

Base URL: `http://localhost:3001/api`

All authenticated endpoints require `Authorization: Bearer <token>` header.

## Authentication

### POST /auth/login
Login and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### POST /auth/logout
Logout and clear session.

## Batches

### POST /batches
Create a new batch.

**Request:**
```json
{
  "name": "Morning Batch 2024-01-15"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Morning Batch 2024-01-15",
  "status": "uploading",
  "user_id": 1,
  "created_at": "2024-01-15T08:00:00Z"
}
```

### GET /batches
List all batches.

### GET /batches/:id
Get batch details.

### POST /batches/:id/select-color
Select acceptable color for batch.

**Request:**
```json
{
  "colorId": 1,
  "deltaETolerance": 10.0
}
```

### POST /batches/:id/finalize
Finalize batch (lock from further changes).

## Images

### POST /images/upload?batchId=:id
Upload images to batch (multipart/form-data).

**Response:**
```json
{
  "results": [
    {
      "filename": "cone1.jpg",
      "status": "uploaded",
      "imageId": 123
    },
    {
      "filename": "cone2.jpg",
      "status": "duplicate",
      "existingId": 45
    }
  ]
}
```

### GET /images?batchId=:id&classification=:status&page=1&limit=50
List images with filters.

### GET /images/:id
Get image details with prediction metadata.

## Classification

### POST /classify/apply
Run classification on batch after color selection.

**Request:**
```json
{
  "batchId": 1
}
```

**Response:**
```json
{
  "goodCount": 85,
  "rejectCount": 15
}
```

### POST /classify/override
Manually override image classification.

**Request:**
```json
{
  "imageId": 123,
  "newClassification": "good",
  "reason": "Visual inspection shows acceptable color despite ΔE"
}
```

## Reports

### GET /reports/batch/:id
Get detailed batch report with images and overrides.

### GET /reports/batch/:id/export?format=csv
Export batch report (formats: json, csv).

## Admin (Requires admin/supervisor role)

### GET /admin/taxonomy
List color taxonomy.

### POST /admin/taxonomy
Add color to taxonomy.

**Request:**
```json
{
  "colorName": "navy",
  "labRange": {
    "L": [20, 40],
    "A": [-10, 10],
    "B": [-30, -10]
  },
  "hexExamples": ["#000080", "#001f3f"],
  "description": "Navy blue cone tips"
}
```

### GET /admin/models
List registered models.

### POST /admin/models
Register new model.

### PATCH /admin/models/:id/activate
Activate model (deactivates others).

### GET /admin/prompts
List prompt versions.

### POST /admin/prompts
Register new prompt version.

## Error Responses

All errors return:
```json
{
  "error": "Error message",
  "correlationId": "1234567890-abc"
}
```

Common status codes:
- 400: Bad request / validation error
- 401: Unauthorized
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 500: Internal server error
