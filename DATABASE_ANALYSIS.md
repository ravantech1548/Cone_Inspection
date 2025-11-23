# Database Analysis Report

## Database Credentials
- **Database**: textile_inspector
- **User**: textile_user
- **Password**: textile_pass_123
- **Host**: localhost
- **Port**: 5432

## Current State

### Active Tables (Used by Application)

#### 1. **users** ✓
- **Purpose**: Authentication and user management
- **Records**: 2
- **Used by**: 
  - Authentication middleware
  - All routes (via authenticate middleware)
  - Admin routes
- **Status**: KEEP - Essential

#### 2. **batches** ✓
- **Purpose**: Inspection batch tracking
- **Records**: 26
- **Used by**:
  - `/api/inspection/*` routes
  - `/api/reports/*` routes
  - `/api/images/*` routes
  - Frontend: InspectionPage, GalleryPage, AuditPage
- **Status**: KEEP - Essential

#### 3. **images** ✓
- **Purpose**: Uploaded cone images with classification results
- **Records**: 6
- **Used by**:
  - `/api/inspection/classify-and-save` (main classification endpoint)
  - `/api/images/*` routes
  - All frontend pages displaying images
- **Status**: KEEP - Essential

#### 4. **predictions** ✓
- **Purpose**: YOLO model prediction results
- **Records**: 24
- **Used by**:
  - `inference.service.js` - stores YOLO results
  - `/api/inspection/classify-and-save` - saves predictions
  - `/api/reports/*` - includes prediction data
- **Status**: KEEP - Essential

#### 5. **models** ✓
- **Purpose**: YOLO model registry and versioning
- **Records**: 1
- **Used by**:
  - `inference.service.js` - tracks active model
  - `/api/admin/models` routes
  - Predictions table (foreign key)
- **Status**: KEEP - Essential

#### 6. **batch_metadata** ✓
- **Purpose**: Stores batch configuration (selected_good_class)
- **Records**: 0
- **Used by**:
  - `/api/inspection/save-batch` - stores selected_good_class
- **Status**: KEEP - Used in code

### Unused Tables (Not Used by Current Code)

#### 7. **color_taxonomy** ✗
- **Purpose**: Color definitions (replaced by YOLO classes)
- **Records**: 4
- **Why unused**: Original design used color-based classification, now using YOLO class-based
- **Referenced in**: 
  - `admin.routes.js` (endpoints exist but not used by frontend)
  - `classification.service.js` (old color-based logic)
- **Status**: SAFE TO REMOVE

#### 8. **prompts** ✗
- **Purpose**: Prompt registry (for LLM-based classification)
- **Records**: 1
- **Why unused**: Using YOLO model instead of LLM prompts
- **Referenced in**: 
  - `admin.routes.js` (endpoints exist but not used)
  - `inference.service.js` (legacy field in predictions)
- **Status**: SAFE TO REMOVE

#### 9. **overrides** ✗
- **Purpose**: Manual classification overrides
- **Records**: 0
- **Why unused**: Feature not implemented in UI
- **Referenced in**:
  - `classification.service.js` (createOverride function exists)
  - `classify.routes.js` (endpoint exists)
  - `reports.routes.js` (queries for overrides)
- **Status**: OPTIONAL - Keep if you want manual override feature

## Code Analysis

### Tables Referenced in Code

| Table | Routes | Services | Frontend |
|-------|--------|----------|----------|
| users | auth, admin | - | Login, all pages |
| batches | inspection, reports, images | classification | InspectionPage, GalleryPage, AuditPage |
| images | inspection, images, reports | upload, inference | All pages with images |
| predictions | inspection, reports | inference | DetailPage, reports |
| models | admin, inspection | inference | AdminPage |
| batch_metadata | inspection | - | - |
| color_taxonomy | admin, reports | classification | - |
| prompts | admin | inference | - |
| overrides | classify, reports | classification | - |

### Unused Columns in Active Tables

#### batches table
- `acceptable_color_id` - references color_taxonomy (unused)
- `delta_e_tolerance` - used for color-based classification (unused)

These columns are in the schema but not used by the YOLO-based workflow.

## Recommendations

### Immediate Actions

1. **Run cleanup script** to remove unused tables:
   ```bash
   node cleanup-database.js --cleanup
   ```

2. **Apply migration 004** to clean schema:
   ```bash
   node app/backend/src/db/migrate.js
   ```

### Tables to Remove
- ✓ `color_taxonomy` - Not used with YOLO classification
- ✓ `prompts` - Not used with YOLO model
- ? `overrides` - Keep only if you plan to implement manual override UI

### Columns to Remove from batches
- `acceptable_color_id` - No longer needed
- `delta_e_tolerance` - No longer needed

### Schema Cleanup Benefits
- Reduced database complexity
- Clearer data model
- Easier maintenance
- No orphaned data
- Better performance (fewer indexes)

## Migration Path

### Option 1: Clean Migration (Recommended)
```bash
# 1. Backup current database
pg_dump -U textile_user textile_inspector > backup.sql

# 2. Run cleanup
node cleanup-database.js --cleanup

# 3. Verify
node analyze-database.js
```

### Option 2: Fresh Start
```bash
# 1. Drop and recreate database
psql -U postgres -c "DROP DATABASE textile_inspector;"
psql -U postgres -c "CREATE DATABASE textile_inspector OWNER textile_user;"

# 2. Apply clean schema
psql -U textile_user -d textile_inspector -f app/db/schema_clean.sql

# 3. Run migrations
node app/backend/src/db/migrate.js
```

## Final Schema Summary

After cleanup, the database will have **6 core tables**:

1. **users** - Authentication
2. **batches** - Inspection batches
3. **images** - Cone images
4. **predictions** - YOLO results
5. **models** - Model registry
6. **batch_metadata** - Batch settings

Plus **migrations** table for tracking.

This is a clean, focused schema that matches your YOLO-based inspection workflow.
