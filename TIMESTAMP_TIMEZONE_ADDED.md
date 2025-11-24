# ✅ Timestamp and Timezone Configuration Added

## Overview

Added timestamp fields to detailed reports and configured the database to use your local timezone (Asia/Singapore, UTC+8).

---

## Changes Made

### 1. Database Timezone Configuration

**Set Database Default Timezone**:
```sql
ALTER DATABASE textile_inspector SET timezone = 'Asia/Singapore';
```

**Result**:
- Database now uses Asia/Singapore timezone (UTC+8)
- All timestamps stored and retrieved in local timezone
- Matches your system timezone

### 2. Report Updates

#### CSV Export - Added "Date & Time" Column

**Before**:
```csv
Filename,Classification,Predicted Class,Selected Good Class,Confidence,Hex Color,Model,Inference Time (ms)
```

**After**:
```csv
Filename,Classification,Predicted Class,Selected Good Class,Confidence,Hex Color,Date & Time,Model,Inference Time (ms)
image1.jpg,REJECT,Brown_purple_ring,Green_brown_shade,100.0%,#8B4513,11/24/2025 18:24:12,cone-tip-classifier:v1.0.0,43ms
```

#### JSON Export - Added Formatted Timestamps

**Added Fields**:
- `created_at` - Original timestamp
- `created_at_formatted` - Human-readable format (MM/DD/YYYY HH:MM:SS)
- `prediction_time` - When prediction was made
- `prediction_time_formatted` - Human-readable prediction time

**Example**:
```json
{
  "filename": "image1.jpg",
  "classification": "reject",
  "created_at": "2025-11-24T18:24:12.000Z",
  "created_at_formatted": "11/24/2025, 18:24:12",
  "prediction_time": "2025-11-24T18:24:12.500Z",
  "prediction_time_formatted": "11/24/2025, 18:24:12"
}
```

### 3. Database Pool Configuration

**File**: `app/backend/src/db/pool.js`

**Added**:
```javascript
export const pool = new Pool({
  connectionString: config.database.url,
  min: config.database.poolMin,
  max: config.database.poolMax,
  // Set timezone for all connections
  options: `-c timezone=${config.database.timezone}`
});

// Set timezone on pool initialization
pool.on('connect', (client) => {
  client.query(`SET timezone = '${config.database.timezone}'`);
});
```

**Benefits**:
- Every database connection uses correct timezone
- Consistent timestamp handling across all queries
- No timezone conversion needed in application code

### 4. Configuration Files

#### .env File

**Added**:
```env
DB_TIMEZONE=Asia/Singapore
```

#### config.js

**Added**:
```javascript
database: {
  url: process.env.DATABASE_URL || '...',
  poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
  timezone: process.env.DB_TIMEZONE || 'Asia/Singapore'
}
```

### 5. Reports Route Updates

**File**: `app/backend/src/routes/reports.routes.js`

**Updated Queries** to include timestamps:
```javascript
SELECT i.filename, i.classification, i.hex_color, i.lab_color, i.confidence,
       i.created_at, i.updated_at,
       p.inference_time_ms, p.payload, p.created_at as prediction_time,
       m.name as model_name, m.version as model_version
FROM images i
LEFT JOIN predictions p ON i.id = p.image_id
LEFT JOIN models m ON p.model_id = m.id
WHERE i.batch_id = $1
ORDER BY i.created_at
```

**Added Timestamp Formatting**:
```javascript
const timestamp = row.created_at ? new Date(row.created_at).toLocaleString('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}) : 'N/A';
```

---

## Timezone Information

### System Timezone
- **ID**: Singapore Standard Time
- **Display Name**: (UTC+08:00) Kuala Lumpur, Singapore
- **UTC Offset**: +08:00

### Database Timezone
- **Before**: Asia/Calcutta (UTC+5:30)
- **After**: Asia/Singapore (UTC+8:00)
- **Status**: ✅ Configured

### Application Timezone
- **Backend**: Asia/Singapore (from config)
- **Database Pool**: Asia/Singapore (set on connect)
- **Reports**: Asia/Singapore (formatted output)

---

## Report Format Examples

### CSV Report

```csv
INSPECTION REPORT SUMMARY

Batch ID,3
Batch Name,Test Batch
Inspector,admin
Selected Good Class,Green_brown_shade
Status,classified
Total Images,2
Good Count,1
Reject Count,1
Created,11/24/2025, 18:20:45


INSPECTION DETAILS

Filename,Classification,Predicted Class,Selected Good Class,Confidence,Hex Color,Date & Time,Model,Inference Time (ms)
1763906845453_47e1f300cfda3bb6.jpg,REJECT,Brown_purple_ring,Green_brown_shade,100.0%,#8B4513,11/24/2025, 18:24:12,cone-tip-classifier:v1.0.0,43ms
1763906859233_6f2247d3a5bf09cb.jpg,GOOD,Green_brown_shade,Green_brown_shade,100.0%,#6B8E23,11/24/2025, 18:24:19,cone-tip-classifier:v1.0.0,71ms
```

### JSON Report

```json
{
  "batch": {
    "id": 3,
    "name": "Test Batch",
    "username": "admin",
    "selected_good_class": "Green_brown_shade",
    "status": "classified",
    "total_images": 2,
    "good_count": 1,
    "reject_count": 1,
    "created_at": "2025-11-24T10:20:45.000Z"
  },
  "images": [
    {
      "filename": "1763906845453_47e1f300cfda3bb6.jpg",
      "classification": "reject",
      "predicted_class": "Brown_purple_ring",
      "selected_good_class": "Green_brown_shade",
      "confidence": 1.0,
      "hex_color": "#8B4513",
      "created_at": "2025-11-24T10:24:12.000Z",
      "created_at_formatted": "11/24/2025, 18:24:12",
      "prediction_time": "2025-11-24T10:24:12.500Z",
      "prediction_time_formatted": "11/24/2025, 18:24:12",
      "inference_time_ms": 43,
      "model_name": "cone-tip-classifier",
      "model_version": "v1.0.0"
    }
  ]
}
```

---

## Timestamp Format

### Display Format
- **Pattern**: `MM/DD/YYYY, HH:MM:SS`
- **Example**: `11/24/2025, 18:24:12`
- **24-hour format**: Yes
- **Timezone**: Asia/Singapore (UTC+8)

### Database Storage
- **Format**: `TIMESTAMP WITH TIME ZONE`
- **Storage**: UTC internally
- **Display**: Converted to Asia/Singapore on retrieval

---

## Configuration Options

### Changing Timezone

To use a different timezone, update `.env`:

```env
# Options: Asia/Singapore, Asia/Tokyo, America/New_York, Europe/London, etc.
DB_TIMEZONE=Asia/Singapore
```

**Common Timezones**:
- `Asia/Singapore` - Singapore, Malaysia (UTC+8)
- `Asia/Hong_Kong` - Hong Kong (UTC+8)
- `Asia/Shanghai` - China (UTC+8)
- `Asia/Tokyo` - Japan (UTC+9)
- `Asia/Bangkok` - Thailand (UTC+7)
- `UTC` - Coordinated Universal Time

### Changing Date Format

To change the display format, update the `toLocaleString` options in `reports.routes.js`:

```javascript
// Current format: MM/DD/YYYY, HH:MM:SS
new Date(row.created_at).toLocaleString('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

// Alternative: DD/MM/YYYY, HH:MM:SS
new Date(row.created_at).toLocaleString('en-GB', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})

// Alternative: YYYY-MM-DD HH:MM:SS
new Date(row.created_at).toLocaleString('sv-SE', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
})
```

---

## Testing

### Verify Database Timezone

```bash
node set-database-timezone.js
```

**Expected Output**:
```
Current database timezone: Asia/Singapore
✓ Database default timezone set to Asia/Singapore

Timestamp Test:
  Current Time: Mon Nov 24 2025 21:04:30 GMT+0800 (Singapore Standard Time)
  Formatted: 2025-11-24 21:04:30 +08

✓ Database timezone configured successfully!
```

### Test Report Generation

1. **Create a new batch**
2. **Upload and classify images**
3. **Generate CSV report**
4. **Verify "Date & Time" column** shows correct local time
5. **Generate JSON report**
6. **Verify `created_at_formatted`** field

---

## Files Modified

### Configuration Files:
- ✅ `.env` - Added `DB_TIMEZONE=Asia/Singapore`
- ✅ `app/backend/src/config.js` - Added timezone to database config
- ✅ `app/backend/src/db/pool.js` - Set timezone on all connections

### Application Files:
- ✅ `app/backend/src/routes/reports.routes.js` - Added timestamp fields and formatting

### Scripts Created:
- ✅ `set-database-timezone.js` - Configure database timezone
- ✅ `TIMESTAMP_TIMEZONE_ADDED.md` - This documentation

---

## Benefits

### For Users:
- ✅ See exact time when each image was inspected
- ✅ Timestamps in familiar local timezone
- ✅ Easy to track inspection timeline
- ✅ Better audit trail

### For System:
- ✅ Consistent timezone across all components
- ✅ No timezone conversion errors
- ✅ Accurate timestamp storage and retrieval
- ✅ Configurable timezone via environment variable

---

## Troubleshooting

### Timestamps Show Wrong Time

**Check Database Timezone**:
```bash
node set-database-timezone.js
```

**Verify .env Setting**:
```bash
cat .env | grep DB_TIMEZONE
```

**Expected**: `DB_TIMEZONE=Asia/Singapore`

### Timestamps Not Appearing in Reports

**Restart Backend**:
```bash
cd app/backend
npm start
```

**Check Logs** for timezone setting confirmation

### Different Timezone Needed

**Update .env**:
```env
DB_TIMEZONE=Your/Timezone
```

**Restart Services**:
- Backend
- Database connections will pick up new timezone

---

## Summary

✅ **Database Timezone**: Asia/Singapore (UTC+8)  
✅ **Report CSV**: Added "Date & Time" column  
✅ **Report JSON**: Added formatted timestamp fields  
✅ **Configuration**: Timezone configurable via .env  
✅ **Format**: MM/DD/YYYY, HH:MM:SS (24-hour)  
✅ **Consistency**: All timestamps use same timezone  

Reports now include inspection timestamps in your local timezone! 🕐
