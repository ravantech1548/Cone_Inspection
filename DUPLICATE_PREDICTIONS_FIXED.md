# ✅ Duplicate Predictions Issue Fixed

## Problem

Reports were showing triple entries for each inspection image. Each image appeared 3 times in the detailed report instead of once.

### Example of the Issue:
```
Summary: Total Images: 2, Good: 1, Reject: 1

Detailed Report:
- Image 1 (appears 3 times)
- Image 1 (duplicate)
- Image 1 (duplicate)
- Image 2 (appears 3 times)
- Image 2 (duplicate)
- Image 2 (duplicate)
```

---

## Root Cause

The `predictions` table had no unique constraint on `image_id`, allowing multiple predictions to be inserted for the same image. This happened when:

1. An image was classified initially
2. The same image was re-scanned or re-processed
3. Each scan created a new prediction entry

The database query in reports used `LEFT JOIN predictions` which returned all predictions for each image, causing duplicates in the report.

---

## Solution

### 1. Database Migration

**File**: `app/db/migrations/005_fix_duplicate_predictions.sql`

Added a unique constraint to prevent duplicate predictions:

```sql
-- Remove existing duplicates (keep most recent)
WITH duplicates AS (
  SELECT 
    image_id,
    id,
    ROW_NUMBER() OVER (PARTITION BY image_id ORDER BY created_at DESC) as rn
  FROM predictions
)
DELETE FROM predictions
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint
ALTER TABLE predictions
ADD CONSTRAINT predictions_image_id_unique UNIQUE (image_id);
```

### 2. Code Updates

**Updated Files**:
- `app/backend/src/routes/inspection.routes.js`
- `app/backend/src/services/inference.service.js`

**Changed prediction insertion** to use `ON CONFLICT`:

```javascript
// Before: Would fail or create duplicates
INSERT INTO predictions (image_id, model_id, payload, ...)
VALUES ($1, $2, $3, ...)

// After: Updates existing prediction if image already has one
INSERT INTO predictions (image_id, model_id, payload, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (image_id) DO UPDATE SET
  model_id = EXCLUDED.model_id,
  payload = EXCLUDED.payload,
  tip_mask = EXCLUDED.tip_mask,
  inference_time_ms = EXCLUDED.inference_time_ms,
  created_at = CURRENT_TIMESTAMP
```

---

## Results

### Before Fix:
```
Total Images: 3
Total Predictions: 7
Avg Predictions per Image: 2.33

Images with duplicate predictions: 2
- Image 1: 3 predictions
- Image 2: 3 predictions
```

### After Fix:
```
Total Images: 3
Total Predictions: 3
Avg Predictions per Image: 1.00

Images with duplicate predictions: 0
✓ All duplicates removed!
```

---

## What Changed

### Database Schema

**Added Constraint**:
```sql
ALTER TABLE predictions
ADD CONSTRAINT predictions_image_id_unique UNIQUE (image_id);
```

This ensures:
- ✅ Each image can only have ONE prediction
- ✅ Attempting to insert a duplicate will trigger the ON CONFLICT clause
- ✅ Existing prediction will be updated instead of creating a new one

### Application Code

**Inspection Route** (`app/backend/src/routes/inspection.routes.js`):
- Added `ON CONFLICT (image_id) DO UPDATE` to prediction insertion
- Updates existing prediction if image is re-scanned

**Inference Service** (`app/backend/src/services/inference.service.js`):
- Added same `ON CONFLICT` handling
- Ensures consistency across all prediction insertions

---

## Testing

### Verification Script

**File**: `check-duplicate-predictions.js`

Run to verify no duplicates exist:
```bash
node check-duplicate-predictions.js
```

**Expected Output**:
```
✓ No duplicate predictions found!

Database Statistics:
  Total Images: 3
  Total Predictions: 3
  Avg Predictions per Image: 1.00
```

### Manual Testing

1. **Create a new batch**
2. **Upload and classify images**
3. **Generate report**
4. **Verify**: Each image appears only once in detailed report

---

## Migration Applied

**Script**: `fix-duplicate-predictions.js`

This script:
1. ✅ Removed 4 duplicate predictions
2. ✅ Added unique constraint
3. ✅ Verified no duplicates remain

**Results**:
```
Starting duplicate predictions fix...

Total predictions before cleanup: 7
Images with duplicate predictions: 2

Removing duplicate predictions (keeping most recent)...
✓ Removed 4 duplicate predictions

Adding unique constraint to prevent future duplicates...
✓ Unique constraint added successfully

Total predictions after cleanup: 3
Images with duplicate predictions: 0

✓ All duplicates removed successfully!
✓ Migration completed successfully!
```

---

## Impact on Reports

### Before Fix:
```
Summary:
  Total Images: 2
  Good: 1
  Reject: 1

Detailed Report:
  1. image1.jpg - REJECT - Brown_purple_ring - 100.0% - 249ms
  2. image1.jpg - REJECT - Brown_purple_ring - 100.0% - 253ms  ← Duplicate
  3. image1.jpg - REJECT - Brown_purple_ring - 100.0% - 43ms   ← Duplicate
  4. image2.jpg - GOOD - Green_brown_shade - 100.0% - 67ms
  5. image2.jpg - GOOD - Green_brown_shade - 100.0% - 70ms     ← Duplicate
  6. image2.jpg - GOOD - Green_brown_shade - 100.0% - 71ms     ← Duplicate
```

### After Fix:
```
Summary:
  Total Images: 2
  Good: 1
  Reject: 1

Detailed Report:
  1. image1.jpg - REJECT - Brown_purple_ring - 100.0% - 43ms
  2. image2.jpg - GOOD - Green_brown_shade - 100.0% - 71ms
```

---

## Future Prevention

### Database Level:
- ✅ Unique constraint prevents duplicate predictions
- ✅ Constraint is enforced at database level (cannot be bypassed)

### Application Level:
- ✅ `ON CONFLICT` clause handles re-scans gracefully
- ✅ Updates existing prediction instead of failing
- ✅ Maintains audit trail with updated `created_at` timestamp

### Best Practices:
1. Always use `ON CONFLICT` when inserting predictions
2. Run verification script after major changes
3. Monitor prediction counts in reports
4. Keep most recent prediction when duplicates occur

---

## Files Created/Modified

### Created:
- ✅ `app/db/migrations/005_fix_duplicate_predictions.sql` - Migration script
- ✅ `check-duplicate-predictions.js` - Verification script
- ✅ `fix-duplicate-predictions.js` - Fix script (already run)
- ✅ `DUPLICATE_PREDICTIONS_FIXED.md` - This documentation

### Modified:
- ✅ `app/backend/src/routes/inspection.routes.js` - Added ON CONFLICT
- ✅ `app/backend/src/services/inference.service.js` - Added ON CONFLICT

---

## Verification Steps

### 1. Check Database
```bash
node check-duplicate-predictions.js
```

### 2. Test New Inspection
1. Create a new batch
2. Upload images
3. Classify images
4. Generate report
5. Verify each image appears once

### 3. Test Re-scan
1. Re-scan an existing image
2. Check that prediction is updated (not duplicated)
3. Verify report still shows single entry

---

## Summary

✅ **Issue**: Reports showing triple entries for each image  
✅ **Cause**: No unique constraint on predictions.image_id  
✅ **Fix**: Added unique constraint + ON CONFLICT handling  
✅ **Result**: Each image now has exactly one prediction  
✅ **Duplicates Removed**: 4 duplicate predictions cleaned up  
✅ **Prevention**: Database constraint + application logic  

Reports now display correctly with one entry per image! 🎉

---

## Rollback (If Needed)

If you need to rollback this change:

```sql
-- Remove the unique constraint
ALTER TABLE predictions
DROP CONSTRAINT predictions_image_id_unique;
```

**Note**: This is NOT recommended as it will allow duplicates to occur again.
