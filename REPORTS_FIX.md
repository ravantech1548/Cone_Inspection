# Reports & Export Fix

## Issues Fixed

### 1. View Report Not Working ✅
**Problem**: AuditPage was trying to display fields that no longer exist in the database
- `acceptable_color_name` (from deleted color_taxonomy table)
- `delta_e_tolerance` (removed column)

**Solution**: Updated AuditPage.jsx to display:
- `selected_good_class` (from batch_metadata)
- Removed references to color_taxonomy
- Added images table with predicted classes
- Removed overrides section (feature not implemented)

### 2. CSV/Excel Export Not Working ✅
**Problem**: `window.open()` doesn't send authentication token

**Solution**: Changed export function to:
- Use `fetch()` with Authorization header
- Download blob as file
- Properly handle authentication

### 3. Backend Reports Route ✅
**Problem**: Was querying deleted tables

**Solution**: Already fixed in previous update:
- Removed `LEFT JOIN color_taxonomy`
- Removed `LEFT JOIN overrides`
- Added query to `batch_metadata` for selected_good_class
- Updated CSV export to include predicted_class from payload

## Files Modified

### Frontend
- `app/frontend/src/pages/AuditPage.jsx`
  - Updated report display to show new fields
  - Fixed export function to use fetch with auth
  - Added images table with YOLO predictions
  - Removed overrides section

### Backend (Already Fixed)
- `app/backend/src/routes/reports.routes.js`
  - Removed joins to deleted tables
  - Added batch_metadata query
  - Updated CSV export format

## New Report Structure

### Report Response
```json
{
  "batch": {
    "id": 29,
    "name": "Inspection 11/23/2025",
    "status": "uploading",
    "total_images": 2,
    "good_count": 0,
    "reject_count": 2,
    "username": "admin",
    "selected_good_class": "green_brown",
    "created_at": "2025-11-23T19:59:26.000Z",
    "finalized_at": null
  },
  "images": [
    {
      "id": 123,
      "filename": "cone_001.jpg",
      "classification": "good",
      "hex_color": "#8B7355",
      "confidence": 0.85,
      "inference_time_ms": 245,
      "payload": {
        "predicted_class": "green_brown",
        "all_classes": {
          "green_brown": 0.85,
          "brown_plain": 0.10,
          "brown_purple_ring": 0.05
        },
        "method": "yolo"
      },
      "model_name": "yolo",
      "model_version": "v1"
    }
  ],
  "overrides": []
}
```

### CSV Export Format
```csv
filename,classification,hex_color,confidence,predicted_class,model,inference_time_ms
cone_001.jpg,good,#8B7355,0.85,green_brown,yolo:v1,245
cone_002.jpg,reject,#654321,0.92,brown_plain,yolo:v1,198
```

## Testing

### Manual Test
1. Start backend: `cd app/backend && npm start`
2. Start frontend: `cd app/frontend && npm run dev`
3. Login to application
4. Go to "Inspection Reports" page
5. Click "View Report" on any batch
6. Click "Export CSV" or "Export JSON"

### Automated Test
```bash
node test-reports-api.js
```

Should show:
```
✓ Login works
✓ Batches list works
✓ Report view works
✓ CSV export works
✓ JSON export works
```

## What's Displayed Now

### Report Summary
- Inspector name
- Selected good class (from batch_metadata)
- Batch status
- Total images, good count, reject count
- Created and finalized dates

### Images Table
- Filename
- Classification (good/reject)
- Predicted class (from YOLO)
- Confidence score
- Model name and version
- Inference time

### Removed Sections
- ❌ Acceptable color (color_taxonomy)
- ❌ ΔE tolerance (not used with YOLO)
- ❌ Manual overrides (feature not implemented)

## Benefits

✅ Reports now show YOLO-specific data  
✅ Export includes predicted classes  
✅ Authentication works correctly  
✅ No references to deleted tables  
✅ Cleaner, more relevant information  

## Notes

- The export now downloads files directly instead of opening in new tab
- All authentication is handled properly
- Report data matches the YOLO classification workflow
- CSV format includes predicted_class for analysis
