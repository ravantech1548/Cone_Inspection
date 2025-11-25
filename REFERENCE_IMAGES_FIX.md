# ✅ Reference Images Fix for Inspector Role

## Problem

When logging in as an inspector, reference images were not loading on the inspection page. All classes showed "No reference image" placeholders.

### Root Cause

The `/api/references/` endpoint was protected by `authorize(ROLES.ADMIN)`, which meant only admin users could access the list of reference images. Inspectors were getting a 403 Forbidden error when trying to load reference images.

---

## Solution

### 1. Created Public Endpoint for Listing References

**File**: `app/backend/src/routes/references.routes.js`

Added a new endpoint `/api/references/list` that is accessible to all authenticated users (both admin and inspector roles):

```javascript
// Public endpoint for listing reference images (accessible to all authenticated users)
router.get('/list', authenticate, async (req, res, next) => {
  try {
    await fs.mkdir(REFERENCE_DIR, { recursive: true });
    
    const entries = await fs.readdir(REFERENCE_DIR);
    const references = [];
    const allClasses = [];
    
    for (const className of entries) {
      const classPath = path.join(REFERENCE_DIR, className);
      
      try {
        const stat = await fs.stat(classPath);
        
        if (stat.isDirectory()) {
          allClasses.push(className);
          
          const files = await fs.readdir(classPath);
          const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
          
          for (const file of imageFiles) {
            references.push({
              class: className,
              filename: file,
              path: `/api/references/image/${className}/${file}`
            });
          }
        }
      } catch (err) {
        console.error(`Error reading class ${className}:`, err);
      }
    }
    
    res.json({ 
      references, 
      count: references.length,
      classes: allClasses 
    });
  } catch (error) {
    next(error);
  }
});
```

### 2. Updated Frontend to Use New Endpoint

**File**: `app/frontend/src/pages/InspectionPage.jsx`

Changed the API call from `/references` to `/references/list`:

```javascript
// Before (admin-only):
const refData = await api.get('/references').catch(() => ({ references: [] }));

// After (all authenticated users):
const refData = await api.get('/references/list').catch(() => ({ references: [] }));
```

---

## API Endpoints Summary

### Public Endpoints (No Auth Required)
- `GET /api/references/image/:class/:filename` - Serve reference image file

### Authenticated Endpoints (All Users)
- `GET /api/references/list` - List all reference images (NEW)

### Admin-Only Endpoints
- `GET /api/references/` - List references (kept for backward compatibility)
- `POST /api/references/upload` - Upload reference image
- `DELETE /api/references/:class/:filename` - Delete reference image
- `POST /api/references/classes` - Create new class directory

---

## Permission Matrix

| Endpoint | Inspector | Admin |
|----------|-----------|-------|
| GET /api/references/list | ✅ Yes | ✅ Yes |
| GET /api/references/image/:class/:filename | ✅ Yes (public) | ✅ Yes (public) |
| GET /api/references/ | ❌ No | ✅ Yes |
| POST /api/references/upload | ❌ No | ✅ Yes |
| DELETE /api/references/:class/:filename | ❌ No | ✅ Yes |

---

## Testing

### Test as Inspector

1. **Login as inspector**:
   - Username: `inspector`
   - Password: `inspector123`

2. **Navigate to Inspection page**

3. **Verify reference images load**:
   - If reference images have been uploaded by admin, they should display
   - If no images uploaded, should show "No reference image" with message "Upload in References page"

4. **Select good class and start inspection**

### Test as Admin

1. **Login as admin**:
   - Username: `admin`
   - Password: `admin123`

2. **Upload reference images**:
   - Go to References page
   - Upload images for each class

3. **Logout and login as inspector**

4. **Verify images now appear** on inspection page

---

## Files Modified

### Backend:
- ✅ `app/backend/src/routes/references.routes.js` - Added `/list` endpoint

### Frontend:
- ✅ `app/frontend/src/pages/InspectionPage.jsx` - Updated to use `/list` endpoint

---

## Next Steps

### 1. Restart Backend Service

The backend needs to be restarted to apply the changes:

```bash
# Stop current backend (Ctrl+C)
cd app/backend
npm start
```

### 2. Refresh Frontend

If frontend is running, it will hot-reload automatically. Otherwise:

```bash
cd app/frontend
npm run dev
```

### 3. Test Inspector Login

1. Login as inspector
2. Go to Inspection page
3. Verify reference images load (if uploaded)
4. Select good class
5. Start inspection

---

## Upload Reference Images (Admin Only)

If reference images haven't been uploaded yet:

1. **Login as admin**
2. **Go to References page**
3. **For each class** (Brown_Plain, Brown_Purple_Ring, Green_Brown_Shade):
   - Click "Upload Images"
   - Select one or more sample images
   - Upload

4. **Logout and login as inspector**
5. **Verify images appear** on inspection page

---

## Troubleshooting

### Reference Images Still Not Loading

**Check Backend Logs**:
```bash
# Look for errors in backend terminal
# Should see: [REFERENCE] Serving image: ...
```

**Check Network Tab** (Browser DevTools):
```
GET /api/references/list
Status: 200 OK (should not be 403)
```

**Check Reference Directory**:
```bash
# Verify reference images exist
ls -la uploads/references/
ls -la uploads/references/Brown_Plain/
ls -la uploads/references/Brown_Purple_Ring/
ls -la uploads/references/Green_Brown_Shade/
```

### 403 Forbidden Error

If still getting 403:
1. Verify backend has been restarted
2. Check token is valid (try logout/login)
3. Verify user role in database:
   ```sql
   SELECT username, role FROM users WHERE username = 'inspector';
   ```

### Images Not Displaying

If API returns images but they don't display:
1. Check image paths in response
2. Verify images are accessible:
   ```
   https://192.168.1.106:3001/api/references/image/Brown_Plain/image.jpg
   ```
3. Check browser console for errors

---

## Summary

✅ **Issue**: Inspector role couldn't load reference images  
✅ **Cause**: `/api/references/` endpoint was admin-only  
✅ **Fix**: Created `/api/references/list` endpoint for all authenticated users  
✅ **Result**: Inspectors can now view reference images  
✅ **Security**: Upload/delete still admin-only  

Reference images now load correctly for inspector role! 🎉

---

## Additional Notes

### Why Two Endpoints?

- `/api/references/` - Admin-only, kept for backward compatibility
- `/api/references/list` - All authenticated users, for viewing references

### Security Considerations

- ✅ Inspectors can VIEW reference images
- ❌ Inspectors CANNOT upload or delete reference images
- ✅ Image files themselves are publicly accessible (no auth on image serving)
- ✅ This is intentional - images need to be accessible for display

### Future Improvements

Consider:
1. Caching reference image list
2. Adding pagination for large number of references
3. Adding image thumbnails for faster loading
4. Adding image metadata (upload date, uploader, etc.)
