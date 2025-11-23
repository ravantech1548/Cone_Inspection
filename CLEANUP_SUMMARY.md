# Database Cleanup Summary

## Analysis Complete ✓

I've analyzed your entire textile cone inspection application and identified exactly which database tables are actively used.

## Current Database State

**Database**: textile_inspector  
**User**: textile_user  
**Password**: textile_pass_123

### Tables Currently in Database (10 total)

| Table | Status | Records | Action |
|-------|--------|---------|--------|
| users | ✓ ACTIVE | 2 | KEEP |
| batches | ✓ ACTIVE | 26 | KEEP |
| images | ✓ ACTIVE | 6 | KEEP |
| predictions | ✓ ACTIVE | 24 | KEEP |
| models | ✓ ACTIVE | 1 | KEEP |
| batch_metadata | ✓ ACTIVE | 0 | KEEP |
| migrations | ✓ ACTIVE | - | KEEP |
| color_taxonomy | ✗ UNUSED | 4 | REMOVE |
| prompts | ✗ UNUSED | 1 | REMOVE |
| overrides | ✗ UNUSED | 0 | REMOVE |

## What's Actually Used

### Core Tables (6 + migrations)

1. **users** - Authentication and authorization
   - Used by: All routes via authenticate middleware
   - Essential for login/security

2. **batches** - Inspection batch tracking
   - Used by: InspectionPage, GalleryPage, AuditPage
   - Stores batch metadata and counts

3. **images** - Uploaded cone images
   - Used by: Main classification workflow
   - Stores image files, checksums, classifications

4. **predictions** - YOLO model results
   - Used by: Inference service
   - Stores predicted_class, confidence, all_classes

5. **models** - YOLO model registry
   - Used by: Admin panel, inference service
   - Tracks which YOLO model is active

6. **batch_metadata** - Batch settings
   - Used by: Inspection workflow
   - Stores selected_good_class per batch

7. **migrations** - Migration tracking
   - Used by: Migration system
   - Tracks which migrations have run

## What's NOT Used

### Unused Tables (3)

1. **color_taxonomy** ✗
   - Original purpose: Color-based classification
   - Why unused: You're using YOLO class-based classification now
   - Routes exist but frontend never calls them
   - Contains 4 records (old test data)

2. **prompts** ✗
   - Original purpose: LLM prompt registry
   - Why unused: Using YOLO model, not LLM
   - Admin routes exist but not used
   - Contains 1 record (legacy data)

3. **overrides** ✗
   - Original purpose: Manual classification overrides
   - Why unused: Feature never implemented in UI
   - Backend code exists but no frontend calls it
   - Empty table (0 records)

### Unused Code Files

These files reference unused tables and can be removed:

- `app/backend/src/routes/classify.routes.js` - Not called by frontend
- `app/backend/src/services/classification.service.js` - Uses color_taxonomy

## Cleanup Steps

### Step 1: Analyze (Already Done)
```bash
node cleanup-database.js
```

### Step 2: Remove Unused Tables
```bash
node cleanup-database.js --cleanup
```

This will:
- Drop color_taxonomy table
- Drop prompts table  
- Drop overrides table
- Keep all active tables intact

### Step 3: Apply Clean Migration (Optional)
```bash
# Apply migration 004 to update schema
node app/backend/src/db/migrate.js
```

This will also remove unused columns from batches:
- `acceptable_color_id` (referenced color_taxonomy)
- `delta_e_tolerance` (used for color matching)

### Step 4: Remove Unused Code (Optional)
```bash
# Delete unused route files
rm app/backend/src/routes/classify.routes.js
rm app/backend/src/services/classification.service.js
```

Then remove from `app/backend/src/index.js`:
```javascript
// Remove this line:
app.use('/api/classify', classifyRoutes);
```

## Benefits of Cleanup

✓ Simpler database schema  
✓ Clearer data model  
✓ No orphaned/unused data  
✓ Easier to understand and maintain  
✓ Better performance (fewer indexes)  
✓ Reduced confusion for future development  

## Safety

- ✓ Unused tables have been identified through code analysis
- ✓ No frontend code calls the unused endpoints
- ✓ Backup recommended before cleanup
- ✓ Can rollback if needed

## Final Schema

After cleanup, you'll have a clean 6-table schema:

```
users (authentication)
  ↓
batches (inspection batches)
  ↓
batch_metadata (settings: selected_good_class)
  ↓
images (cone photos + classification)
  ↓
predictions (YOLO results)
  ↑
models (YOLO model registry)
```

This perfectly matches your YOLO-based cone inspection workflow!

## Run Cleanup Now

```bash
# 1. Backup first (optional but recommended)
pg_dump -U textile_user textile_inspector > backup_$(date +%Y%m%d).sql

# 2. Run cleanup
node cleanup-database.js --cleanup

# 3. Verify
node analyze-database.js
```

## Questions?

- **Will this break anything?** No - only unused tables are removed
- **Can I undo it?** Yes - restore from backup or recreate tables
- **Should I remove overrides?** Yes, unless you plan to add manual override UI
- **What about the data?** Only 5 records total in unused tables (not important)
