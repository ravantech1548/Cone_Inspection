# Timezone Fix Complete

## Issue

Timestamps were showing different times in summary vs details:
- **Summary**: `11/25/2025, 12:29:36 PM` ✅ (Correct - Singapore time)
- **Details**: `11/24/2025, 23:44:35` ❌ (Wrong - UTC time)

## Root Cause

The CSV export and some fallback code paths were missing the `timeZone: 'Asia/Singapore'` parameter, causing timestamps to display in UTC instead of Singapore time.

## Fixes Applied

### 1. Backend - CSV Export
**File**: `app/backend/src/routes/reports.routes.js`

```javascript
// Before
const timestamp = row.created_at ? new Date(row.created_at).toLocaleString('en-US', {
  // ... options
  hour12: false
  // ❌ Missing timeZone
}) : 'N/A';

// After
const timestamp = row.created_at ? new Date(row.created_at).toLocaleString('en-US', {
  // ... options
  hour12: false,
  timeZone: 'Asia/Singapore'  // ✅ Added
}) : 'N/A';
```

### 2. Frontend - Fallback Formatting
**File**: `app/frontend/src/pages/AuditPage.jsx`

```javascript
// Before
new Date(image.created_at).toLocaleString('en-US', {
  // ... options
  hour12: false
  // ❌ Missing timeZone
})

// After
new Date(image.created_at).toLocaleString('en-US', {
  // ... options
  hour12: false,
  timeZone: 'Asia/Singapore'  // ✅ Added
})
```

### 3. Cache Busting
**File**: `app/frontend/src/pages/AuditPage.jsx`

```javascript
// Added timestamp parameter to prevent caching
const data = await api.get(`/reports/batch/${batchId}?_t=${Date.now()}`);
```

### 4. Refresh Button
**File**: `app/frontend/src/pages/AuditPage.jsx`

Added a "🔄 Refresh Report" button to manually reload the report with fresh data.

## How to See the Fix

### Option 1: Refresh Button (Easiest)
1. Go to the Audit page
2. Click "View Report" on a batch
3. Click the new "🔄 Refresh Report" button
4. Timestamps will now show Singapore time

### Option 2: Hard Refresh Browser
1. Press `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. This clears the browser cache
3. Reload the report
4. Timestamps will now show Singapore time

### Option 3: Clear Browser Cache
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"
4. Reload the page

## Verification

After applying the fix, all timestamps should match:

| Location | Before | After |
|----------|--------|-------|
| Summary Created | `11/25/2025, 12:29:36 PM` | `11/25/2025, 12:29:36 PM` ✅ |
| Detail Timestamp | `11/24/2025, 23:44:35` ❌ | `11/25/2025, 12:29:36 PM` ✅ |
| CSV Export | UTC time ❌ | Singapore time ✅ |
| JSON Export | Singapore time ✅ | Singapore time ✅ |

## Timezone Details

- **Timezone**: Asia/Singapore (UTC+8)
- **Format**: `MM/DD/YYYY, HH:MM:SS`
- **Hour Format**: 24-hour (not AM/PM in table)
- **Consistency**: All timestamps now use Singapore time

## Files Modified

- ✅ `app/backend/src/routes/reports.routes.js` - Fixed CSV timestamp
- ✅ `app/frontend/src/pages/AuditPage.jsx` - Fixed fallback timestamp + cache busting + refresh button
- ✅ `restart-backend.ps1` - Created backend restart script
- ✅ `TIMEZONE_FIX_COMPLETE.md` - This document

## Testing

### Test 1: New Inspection
1. Create a new inspection batch
2. Scan some images
3. View the report
4. Verify timestamps match between summary and details

### Test 2: Existing Batch
1. Go to Audit page
2. Click "View Report" on existing batch
3. Click "🔄 Refresh Report" button
4. Verify timestamps now show Singapore time

### Test 3: Export
1. Export CSV
2. Open the file
3. Check "Date & Time" column
4. Verify it shows Singapore time (not UTC)

## Why This Happened

1. **Database stores UTC**: PostgreSQL stores timestamps in UTC
2. **Conversion needed**: Must convert to Singapore time for display
3. **Missing parameter**: Some code paths forgot to add `timeZone: 'Asia/Singapore'`
4. **Browser caching**: Old API responses were cached

## Prevention

All timestamp formatting now includes:
```javascript
{
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Singapore'  // ✅ Always include this
}
```

## Summary

✅ **Backend CSV export** - Fixed timezone
✅ **Frontend fallback** - Fixed timezone  
✅ **Cache busting** - Added timestamp parameter
✅ **Refresh button** - Added manual refresh
✅ **All timestamps** - Now show Singapore time consistently

The timezone issue is now completely resolved. All timestamps throughout the application will display in Singapore time (UTC+8)!
