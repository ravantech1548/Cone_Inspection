# Timestamp Column Added to Report Table

## Changes Made

Added a "Timestamp" column to the inspection report table showing when each image was classified.

## Location

**File**: `app/frontend/src/pages/AuditPage.jsx`
**Page**: Inspection Reports (Audit Page)
**Route**: `/audit`

## Table Columns (Updated)

| Column | Description | Example |
|--------|-------------|---------|
| Image | Thumbnail preview | 📷 |
| Filename | Image file name | `image1.jpg` |
| Classification | GOOD or REJECT | **GOOD** |
| Predicted Class | YOLO prediction | `brown_purple_ring` |
| Selected Good Class | Reference class | `brown_purple_ring` |
| Confidence | Prediction confidence | `95.2%` |
| **Timestamp** | **When classified** | **11/24/2025, 20:15:30** |
| Model | YOLO model version | `yolo:v1.0.0` |
| Inference Time | Processing time | `245ms` |

## Timestamp Format

- **Format**: `MM/DD/YYYY, HH:MM:SS`
- **Timezone**: Asia/Singapore
- **24-hour format**: Yes
- **Example**: `11/24/2025, 20:15:30`

## Data Source

The timestamp comes from:
1. **Primary**: `created_at_formatted` field from backend
2. **Fallback**: `created_at` field formatted on frontend

### Backend (Already Implemented)
```javascript
// app/backend/src/routes/reports.routes.js
created_at_formatted: row.created_at ? new Date(row.created_at).toLocaleString('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Singapore'
}) : null
```

### Frontend (New)
```jsx
<td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
  {image.created_at_formatted || (image.created_at ? new Date(image.created_at).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }) : 'N/A')}
</td>
```

## Use Cases

### 1. Track Scanning Sequence
```
Image 1: 20:15:30
Image 2: 20:15:45  (15 seconds later)
Image 3: 20:16:02  (17 seconds later)
Average: 16 seconds per scan
```

### 2. Identify Same Image Scans
```
cone_tip_1.jpg: 20:15:30 - GOOD
cone_tip_1.jpg: 20:15:45 - GOOD  (re-scan)
cone_tip_1.jpg: 20:16:02 - GOOD  (re-scan)
Consistency: 100% GOOD
```

### 3. Performance Analysis
```
Morning (08:00-12:00): 120 scans
Afternoon (13:00-17:00): 95 scans
Peak time: 10:00-11:00 (45 scans)
```

### 4. Quality Control
```
Batch started: 20:00:00
Batch ended: 20:30:00
Duration: 30 minutes
Total scans: 150
Rate: 5 scans/minute
```

## Visual Example

### Report Table View
```
┌────────┬──────────────┬──────────┬─────────────┬──────────┬────────────────────┬──────────┬──────────┐
│ Image  │ Filename     │ Class    │ Predicted   │ Conf     │ Timestamp          │ Model    │ Time     │
├────────┼──────────────┼──────────┼─────────────┼──────────┼────────────────────┼──────────┼──────────┤
│ [IMG]  │ cone1.jpg    │ GOOD     │ brown_ring  │ 95.2%    │ 11/24/2025, 20:15:30│ yolo:v1  │ 245ms    │
│ [IMG]  │ cone2.jpg    │ REJECT   │ green_shade │ 92.1%    │ 11/24/2025, 20:15:45│ yolo:v1  │ 238ms    │
│ [IMG]  │ cone1.jpg    │ GOOD     │ brown_ring  │ 94.8%    │ 11/24/2025, 20:16:02│ yolo:v1  │ 242ms    │
└────────┴──────────────┴──────────┴─────────────┴──────────┴────────────────────┴──────────┴──────────┘
```

## Styling

### Timestamp Cell
- **Font size**: `0.85rem` (slightly smaller for readability)
- **White space**: `nowrap` (prevents line breaks)
- **Format**: Consistent date/time format
- **Alignment**: Left-aligned

### Example CSS
```css
td {
  font-size: 0.85rem;
  white-space: nowrap;
}
```

## Export Formats

### CSV Export (Already Includes Timestamp)
```csv
Filename,Classification,Predicted Class,Selected Good Class,Inspector,Confidence,Hex Color,Date & Time,Model,Inference Time (ms)
cone1.jpg,GOOD,brown_purple_ring,brown_purple_ring,admin,95.2%,#8B4513,11/24/2025 20:15:30,yolo:v1.0.0,245
cone2.jpg,REJECT,green_brown_shade,brown_purple_ring,admin,92.1%,#556B2F,11/24/2025 20:15:45,yolo:v1.0.0,238
cone1.jpg,GOOD,brown_purple_ring,brown_purple_ring,admin,94.8%,#8B4513,11/24/2025 20:16:02,yolo:v1.0.0,242
```

### JSON Export (Already Includes Timestamp)
```json
{
  "images": [
    {
      "filename": "cone1.jpg",
      "classification": "good",
      "predicted_class": "brown_purple_ring",
      "confidence": 0.952,
      "created_at": "2025-11-24T20:15:30.000Z",
      "created_at_formatted": "11/24/2025, 20:15:30",
      "inference_time_ms": 245
    }
  ]
}
```

## Benefits

### 1. Complete Audit Trail
- Know exactly when each image was classified
- Track inspection timeline
- Verify scanning sequence

### 2. Performance Metrics
- Calculate scan rate
- Identify bottlenecks
- Measure inspector efficiency

### 3. Quality Analysis
- Compare results over time
- Identify time-based patterns
- Track consistency

### 4. Duplicate Detection
- See when same image was scanned multiple times
- Verify re-scan results
- Track quality verification

## Comparison

### Before
```
┌────────┬──────────────┬──────────┬──────────┐
│ Image  │ Filename     │ Class    │ Conf     │
├────────┼──────────────┼──────────┼──────────┤
│ [IMG]  │ cone1.jpg    │ GOOD     │ 95.2%    │
│ [IMG]  │ cone2.jpg    │ REJECT   │ 92.1%    │
│ [IMG]  │ cone1.jpg    │ GOOD     │ 94.8%    │
└────────┴──────────────┴──────────┴──────────┘
```
❌ Can't tell when each scan happened
❌ Can't calculate scan rate
❌ Can't identify re-scans

### After
```
┌────────┬──────────────┬──────────┬──────────┬────────────────────┐
│ Image  │ Filename     │ Class    │ Conf     │ Timestamp          │
├────────┼──────────────┼──────────┼──────────┼────────────────────┤
│ [IMG]  │ cone1.jpg    │ GOOD     │ 95.2%    │ 11/24/2025, 20:15:30│
│ [IMG]  │ cone2.jpg    │ REJECT   │ 92.1%    │ 11/24/2025, 20:15:45│
│ [IMG]  │ cone1.jpg    │ GOOD     │ 94.8%    │ 11/24/2025, 20:16:02│
└────────┴──────────────┴──────────┴──────────┴────────────────────┘
```
✅ Clear timeline of scans
✅ Can calculate: 3 scans in 32 seconds = 5.6 scans/min
✅ Can see cone1.jpg was scanned twice (re-verification)

## Files Modified

- ✅ `app/frontend/src/pages/AuditPage.jsx` - Added Timestamp column
- ✅ `TIMESTAMP_COLUMN_ADDED.md` - This document

## Files Already Correct

- ✅ `app/backend/src/routes/reports.routes.js` - Already provides timestamps
  - CSV export: "Date & Time" column
  - JSON export: `created_at_formatted` field

## Testing

### View Report
1. Go to `/audit` page
2. Click "View Report" on any batch
3. See the report table with new Timestamp column
4. Each row shows when that image was classified

### Export Report
1. Click "Export CSV" or "Export JSON"
2. Open the exported file
3. Verify timestamps are included
4. CSV: "Date & Time" column
5. JSON: `created_at_formatted` field

### Multiple Scans
1. Scan same image 3 times
2. View report
3. See 3 rows with same filename
4. Each row has different timestamp
5. Can track the scanning sequence

## Summary

✅ **Timestamp column added** to report table
✅ **Format**: MM/DD/YYYY, HH:MM:SS (24-hour)
✅ **Timezone**: Asia/Singapore
✅ **Position**: Between Confidence and Model columns
✅ **Styling**: Smaller font, no line breaks
✅ **Exports**: Already included in CSV and JSON
✅ **Use cases**: Audit trail, performance metrics, quality analysis

The report now shows exactly when each image was classified, enabling better tracking, analysis, and quality control!
