# Database Schema Diagram

## Current Active Schema (After Cleanup)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TEXTILE CONE INSPECTOR                        │
│                         Database Schema                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│     USERS        │
│──────────────────│
│ id (PK)          │
│ username         │
│ password_hash    │
│ role             │◄────────────────┐
│ created_at       │                 │
│ updated_at       │                 │
└──────────────────┘                 │
         │                           │
         │ user_id                   │
         ▼                           │
┌──────────────────┐                 │
│    BATCHES       │                 │
│──────────────────│                 │
│ id (PK)          │◄────────┐       │
│ user_id (FK)     │         │       │
│ name             │         │       │
│ status           │         │       │
│ total_images     │         │       │
│ good_count       │         │       │
│ reject_count     │         │       │
│ created_at       │         │       │
│ finalized_at     │         │       │
└──────────────────┘         │       │
         │                   │       │
         │ batch_id          │       │
         ├───────────────────┘       │
         │                           │
         ▼                           │
┌──────────────────┐                 │
│ BATCH_METADATA   │                 │
│──────────────────│                 │
│ id (PK)          │                 │
│ batch_id (FK)    │                 │
│ key              │  Stores:        │
│ value            │  - selected_    │
│ created_at       │    good_class   │
└──────────────────┘                 │
                                     │
         ┌───────────────────────────┘
         │ batch_id
         ▼
┌──────────────────┐
│     IMAGES       │
│──────────────────│
│ id (PK)          │◄────────┐
│ batch_id (FK)    │         │
│ filename         │         │
│ original_filename│         │
│ checksum         │         │
│ file_path        │         │
│ file_size        │         │
│ mime_type        │         │
│ width            │         │
│ height           │         │
│ lab_color        │         │
│ hex_color        │         │
│ classification   │  GOOD/  │
│ confidence       │  REJECT │
│ thumbnail        │         │
│ created_at       │         │
└──────────────────┘         │
         │                   │
         │ image_id          │
         ▼                   │
┌──────────────────┐         │
│   PREDICTIONS    │         │
│──────────────────│         │
│ id (PK)          │         │
│ image_id (FK)    │─────────┘
│ model_id (FK)    │─────────┐
│ payload (JSONB)  │         │
│   - predicted_   │         │
│     class        │         │
│   - all_classes  │         │
│   - method       │         │
│ tip_mask (JSONB) │         │
│ inference_time_ms│         │
│ created_at       │         │
└──────────────────┘         │
                             │
                             │ model_id
                             ▼
                    ┌──────────────────┐
                    │     MODELS       │
                    │──────────────────│
                    │ id (PK)          │
                    │ name             │
                    │ version          │
                    │ checksum         │
                    │ config (JSONB)   │
                    │ is_active        │
                    │ created_at       │
                    └──────────────────┘
                         YOLO Model
                         Registry
```

## Data Flow

```
1. USER LOGIN
   └─> users table

2. CREATE BATCH
   └─> batches table (status: 'uploading')

3. SELECT GOOD CLASS
   └─> batch_metadata table (key: 'selected_good_class')

4. UPLOAD IMAGE
   └─> images table (classification: 'pending')
   └─> Call YOLO inference service

5. YOLO CLASSIFICATION
   └─> predictions table (payload with all classes)
   └─> Update images table (classification: 'good' or 'reject')
   └─> Update batches table (good_count, reject_count)

6. VIEW RESULTS
   └─> Query images + predictions + batches
```

## Key Relationships

- **users** → **batches**: One user can create many batches
- **batches** → **images**: One batch contains many images
- **batches** → **batch_metadata**: One batch has multiple metadata key-value pairs
- **images** → **predictions**: One image has one prediction
- **models** → **predictions**: One model generates many predictions

## Classification Logic

```
┌─────────────────────────────────────────────────────────────┐
│                    YOLO Classification                       │
└─────────────────────────────────────────────────────────────┘

1. Image uploaded
   ↓
2. YOLO model predicts class
   ↓
3. Compare predicted_class with selected_good_class
   ↓
4. IF predicted_class == selected_good_class
   THEN classification = 'good'
   ELSE classification = 'reject'
   ↓
5. Store in images table
   ↓
6. Update batch counts
```

## Table Sizes (Current)

| Table | Records | Purpose |
|-------|---------|---------|
| users | 2 | Admin + Inspector accounts |
| batches | 26 | Inspection sessions |
| images | 6 | Cone photos |
| predictions | 24 | YOLO results |
| models | 1 | Active YOLO model |
| batch_metadata | 0 | Batch settings |

## Indexes

### Performance Indexes
- `idx_images_batch_id` - Fast batch image lookup
- `idx_images_checksum` - Duplicate detection
- `idx_images_classification` - Filter by good/reject
- `idx_predictions_image_id` - Join images with predictions
- `idx_batches_user_id` - User's batches
- `idx_batches_status` - Filter by status

### JSONB Indexes (GIN)
- `idx_images_lab_color` - Color search
- `idx_predictions_payload` - Search prediction data

## Removed Tables (Unused)

These were in the original schema but not used:

- ❌ **color_taxonomy** - Color-based classification (replaced by YOLO)
- ❌ **prompts** - LLM prompts (not using LLM)
- ❌ **overrides** - Manual overrides (feature not implemented)

## Clean Schema Benefits

✓ Simple and focused  
✓ Matches YOLO workflow  
✓ No unused tables  
✓ Clear relationships  
✓ Easy to understand  
✓ Optimized indexes  
