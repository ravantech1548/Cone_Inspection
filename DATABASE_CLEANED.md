# ✅ Database Cleaned - Fresh Start

## Cleanup Summary

All inspection data has been removed from the database for a clean start.

---

## What Was Deleted

### Database Records:
- ✅ **5 Batches** - All inspection batches removed
- ✅ **4 Images** - All uploaded images removed
- ✅ **4 Predictions** - All YOLO predictions removed
- ✅ **5 Batch Metadata** - All batch settings removed

### ID Sequences Reset:
- ✅ `batches_id_seq` → Reset to 1
- ✅ `images_id_seq` → Reset to 1
- ✅ `predictions_id_seq` → Reset to 1
- ✅ `batch_metadata_id_seq` → Reset to 1

### Upload Directories:
- ✅ Batch directories cleaned
- ✅ Loose files removed

---

## What Was Preserved

### ✅ Users
All user accounts remain intact:
- **admin** (admin role)
- **inspector** (inspector role)
- **inspector1** (inspector role)

### ✅ Models
YOLO model registration preserved:
- **cone-tip-classifier** (v1.0.0)

### ✅ Reference Images
Reference images directory preserved:
- `uploads/references/` and all subdirectories
- All uploaded reference images intact

---

## Current Database State

```
Batches: 0
Images: 0
Predictions: 0
Batch Metadata: 0

Users: 3 (preserved)
Models: 1 (preserved)
Reference Images: Preserved
```

---

## Next Inspection

The next inspection batch will start fresh:
- **Batch ID**: 1
- **Image ID**: 1
- **Prediction ID**: 1

---

## How to Use

### Run Cleanup Script

```bash
# Clean all inspection data
node clean-all-inspections.js
```

**Expected Output**:
```
========================================
Cleaning All Inspection Data
========================================

Current Data:
  Batches: 5
  Images: 4
  Predictions: 4
  Batch Metadata: 5

Starting cleanup...

1. Deleting predictions...
   ✓ Deleted 4 predictions
2. Deleting batch metadata...
   ✓ Deleted 5 metadata records
3. Deleting images...
   ✓ Deleted 4 images
4. Deleting batches...
   ✓ Deleted 5 batches

5. Resetting ID sequences...
   ✓ All sequences reset to 1

6. Cleaning upload directories...
   ✓ Deleted 0 batch directories
   ✓ Deleted 0 loose files

7. Verifying cleanup...
   Batches: 0
   Images: 0
   Predictions: 0
   Batch Metadata: 0

========================================
✅ Cleanup Complete!
========================================

Database is now clean and ready for fresh inspections.
Users and models are preserved.
Reference images are preserved.

Next batch will start with ID: 1
Next image will start with ID: 1
```

---

## Cleanup Process

### 1. Delete Predictions
Removes all YOLO classification results from the `predictions` table.

### 2. Delete Batch Metadata
Removes all batch settings (selected good class, etc.) from `batch_metadata` table.

### 3. Delete Images
Removes all image records from the `images` table.

### 4. Delete Batches
Removes all batch records from the `batches` table.

### 5. Reset Sequences
Resets all auto-increment sequences to start from 1.

### 6. Clean Upload Directories
Removes batch directories and loose files from `uploads/` folder (preserves `references/`).

### 7. Verify
Confirms all data has been removed and counts are zero.

---

## Safety Features

### Transaction-Based
- All database operations wrapped in a transaction
- If any step fails, entire cleanup is rolled back
- Database remains consistent

### Preserves Critical Data
- ✅ Users are NOT deleted
- ✅ Models are NOT deleted
- ✅ Reference images are NOT deleted
- ✅ Database schema is NOT modified

### Foreign Key Handling
- Deletes in correct order to respect foreign key constraints
- Predictions → Metadata → Images → Batches

---

## When to Use

### Fresh Start
- Starting a new production run
- After testing/demo
- Beginning a new shift
- Resetting for training

### Clean Development
- After development testing
- Before production deployment
- Clearing test data

### Troubleshooting
- Resolving data inconsistencies
- Starting fresh after errors
- Cleaning corrupted data

---

## Alternative: Selective Cleanup

If you want to keep some data:

### Delete Specific Batch
```sql
-- Delete a specific batch and its data
DELETE FROM batch_metadata WHERE batch_id = 1;
DELETE FROM predictions WHERE image_id IN (SELECT id FROM images WHERE batch_id = 1);
DELETE FROM images WHERE batch_id = 1;
DELETE FROM batches WHERE id = 1;
```

### Delete Old Batches
```sql
-- Delete batches older than 30 days
DELETE FROM batch_metadata WHERE batch_id IN (
  SELECT id FROM batches WHERE created_at < NOW() - INTERVAL '30 days'
);
DELETE FROM predictions WHERE image_id IN (
  SELECT id FROM images WHERE batch_id IN (
    SELECT id FROM batches WHERE created_at < NOW() - INTERVAL '30 days'
  )
);
DELETE FROM images WHERE batch_id IN (
  SELECT id FROM batches WHERE created_at < NOW() - INTERVAL '30 days'
);
DELETE FROM batches WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## Verification

### Check Database
```bash
# Run verification script
node verify-database.js
```

### Check Counts
```sql
-- Connect to database
psql -U textile_user -d textile_inspector -h 127.0.0.1

-- Check counts
SELECT 'Batches' as table_name, COUNT(*) FROM batches
UNION ALL
SELECT 'Images', COUNT(*) FROM images
UNION ALL
SELECT 'Predictions', COUNT(*) FROM predictions
UNION ALL
SELECT 'Batch Metadata', COUNT(*) FROM batch_metadata
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Models', COUNT(*) FROM models;
```

**Expected Output**:
```
   table_name    | count
-----------------+-------
 Batches         |     0
 Images          |     0
 Predictions     |     0
 Batch Metadata  |     0
 Users           |     3
 Models          |     1
```

### Check Sequences
```sql
-- Check next IDs
SELECT 'batches_id_seq' as sequence, last_value FROM batches_id_seq
UNION ALL
SELECT 'images_id_seq', last_value FROM images_id_seq
UNION ALL
SELECT 'predictions_id_seq', last_value FROM predictions_id_seq;
```

**Expected Output**:
```
     sequence      | last_value
-------------------+------------
 batches_id_seq    |          1
 images_id_seq     |          1
 predictions_id_seq|          1
```

---

## Testing After Cleanup

### 1. Login
- Username: `inspector`
- Password: `inspector123`

### 2. Create New Batch
- Go to Inspection page
- Select good class
- Should create Batch ID: 1

### 3. Upload Image
- Upload or capture image
- Should create Image ID: 1
- Should create Prediction ID: 1

### 4. View Reports
- Go to Reports page
- Should see 1 batch
- Batch ID should be 1

### 5. Verify Clean Start
- All IDs start from 1
- No old data visible
- Fresh inspection history

---

## Backup Before Cleanup

If you want to backup data before cleaning:

```bash
# Backup database
pg_dump -U textile_user -d textile_inspector -h 127.0.0.1 > backup_before_cleanup_$(date +%Y%m%d).sql

# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# Then run cleanup
node clean-all-inspections.js
```

### Restore from Backup
```bash
# Restore database
psql -U textile_user -d textile_inspector -h 127.0.0.1 < backup_before_cleanup_20251124.sql

# Restore uploads
tar -xzf uploads_backup_20251124.tar.gz
```

---

## Files Created

- ✅ `clean-all-inspections.js` - Cleanup script
- ✅ `DATABASE_CLEANED.md` - This documentation

---

## Summary

✅ **Deleted**: 5 batches, 4 images, 4 predictions, 5 metadata records  
✅ **Reset**: All ID sequences to 1  
✅ **Cleaned**: Upload directories  
✅ **Preserved**: Users, models, reference images  
✅ **Status**: Database ready for fresh start  
✅ **Next Batch ID**: 1  

Database is clean and ready for new inspections! 🎉

---

## Quick Commands

```bash
# Clean all inspection data
node clean-all-inspections.js

# Verify cleanup
node verify-database.js

# Check database counts
psql -U textile_user -d textile_inspector -h 127.0.0.1 -c "SELECT COUNT(*) FROM batches;"

# Start fresh inspection
# Login → Inspection → Select Good Class → Upload Images
```
