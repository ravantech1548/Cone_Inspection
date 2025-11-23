# Batch Status Fix

## Problem

Batches were stuck in "uploading" status even after images were classified:

```
ID  Name                              Status      Total  Good  Reject
29  Inspection 11/23/2025, 7:59:26 PM uploading  2      0     2
26  Inspection 11/23/2025, 5:53:09 PM uploading  2      0     2
25  Inspection 11/23/2025, 5:23:30 PM uploading  1      0     1
24  Inspection 11/23/2025, 5:22:48 PM uploading  1      1     0
```

## Root Cause

The batch status was only updated when the `/save-batch` endpoint was called, but that endpoint was never called by the frontend. The InspectionPage directly calls `/classify-and-save` for each image, but that endpoint didn't update the batch status.

## Solution

### 1. Updated Backend ✅

Modified `app/backend/src/routes/inspection.routes.js`:

**Added automatic status update:**
```javascript
// Update batch counts and status
await query(
  `UPDATE batches SET 
    total_images = (SELECT COUNT(*) FROM images WHERE batch_id = $1),
    good_count = (SELECT COUNT(*) FROM images WHERE batch_id = $1 AND classification = 'good'),
    reject_count = (SELECT COUNT(*) FROM images WHERE batch_id = $1 AND classification = 'reject'),
    status = CASE 
      WHEN status = 'uploading' AND (SELECT COUNT(*) FROM images WHERE batch_id = $1) > 0 
      THEN 'classified'
      ELSE status
    END
  WHERE id = $1`,
  [batchId]
);
```

**Added automatic metadata storage:**
```javascript
// Store selected good class in batch_metadata
await query(
  `INSERT INTO batch_metadata (batch_id, key, value)
   VALUES ($1, 'selected_good_class', $2)
   ON CONFLICT (batch_id, key) DO UPDATE SET value = EXCLUDED.value`,
  [batchId, selectedGoodClass]
);
```

### 2. Fixed Existing Batches ✅

Ran `fix-batch-status.js` to update all stuck batches:

```
✓ Fixed 4 batches:
  - Batch 24: uploading → classified (1 image, 1 good)
  - Batch 25: uploading → classified (1 image, 1 reject)
  - Batch 26: uploading → classified (2 images, 2 reject)
  - Batch 29: uploading → classified (2 images, 2 reject)
```

## How It Works Now

### Automatic Status Updates

1. **User creates batch** → Status: `uploading`
2. **User selects good class** → Stored in `batch_metadata`
3. **User scans/uploads first image** → Status: `uploading` → `classified`
4. **User scans more images** → Status stays `classified`
5. **User finalizes batch** → Status: `classified` → `finalized`

### Status Flow

```
uploading → classified → finalized
    ↓           ↓            ↓
  Created   Has images   Locked
```

## Benefits

✅ Status updates automatically when images are classified  
✅ No manual "save batch" step needed  
✅ Reports show correct status  
✅ Batch list shows accurate information  
✅ Selected good class stored automatically  

## Testing

### Verify Fix

1. Refresh your browser
2. Go to "Inspection Reports" page
3. All batches with images should show status: `classified`

### Test New Batches

1. Create new batch
2. Select good class
3. Scan/upload image
4. Status should automatically change to `classified`

## Files Modified

- `app/backend/src/routes/inspection.routes.js` - Added automatic status update
- `fix-batch-status.js` - Script to fix existing batches (one-time use)

## Database Changes

No schema changes needed. The fix uses existing columns:
- `batches.status` - Updated automatically
- `batch_metadata` - Stores selected_good_class automatically

## Result

All batches now show correct status:

```
ID  Name                              Status      Total  Good  Reject
29  Inspection 11/23/2025, 7:59:26 PM classified  2      0     2     ✓
26  Inspection 11/23/2025, 5:53:09 PM classified  2      0     2     ✓
25  Inspection 11/23/2025, 5:23:30 PM classified  1      0     1     ✓
24  Inspection 11/23/2025, 5:22:48 PM classified  1      1     0     ✓
```

Perfect! 🎉
