# Testing YOLO best.pt Integration

## How the System Works

### 1. **Reference Images Setup**
- Admin uploads 3 reference images to classes:
  - `green_brown`
  - `brown_purple_ring`
  - `brown_plain`

### 2. **Select "Good" Class**
- Inspector selects ONE class as acceptable (e.g., `green_brown`)
- This becomes the "GOOD" pattern

### 3. **YOLO Classification Flow**

```
Upload/Capture Image
    ↓
Save to disk
    ↓
Call YOLO best.pt model (Python service)
    ↓
Model returns: predicted_class, confidence, all_classes
    ↓
Compare: predicted_class === selectedGoodClass?
    ↓
YES → Mark as GOOD
NO  → Mark as REJECT
    ↓
Save to PostgreSQL with full metadata
```

## Testing Steps

### Step 1: Verify YOLO Service is Running

```powershell
# Terminal 1: Start inference service
cd inference-service
python http_server.py
```

Expected output:
```
 * Running on http://0.0.0.0:8000
```

### Step 2: Test YOLO Endpoint Directly

```powershell
# Test with curl (replace with actual image path)
curl -X POST http://localhost:8000/api/classify \
  -H "Content-Type: application/json" \
  -d "{\"image_path\": \"C:/path/to/test/image.jpg\", \"confidence_threshold\": 0.7}"
```

Expected response:
```json
{
  "predicted_class": "green_brown",
  "confidence": 0.95,
  "inference_time_ms": 234,
  "model_version": "best.pt",
  "all_classes": {
    "green_brown": 0.95,
    "brown_purple_ring": 0.03,
    "brown_plain": 0.02
  }
}
```

### Step 3: Verify Model Classes Match Your References

Your YOLO model should be trained to output these exact class names:
- `green_brown`
- `brown_purple_ring`
- `brown_plain`

Check model classes:
```powershell
curl http://localhost:8000/api/model-info
```

### Step 4: Test Full Workflow

1. **Login**: `admin` / `admin123`

2. **Upload References** (if not done):
   - Go to "References"
   - Create 3 classes with exact names from your model
   - Upload one sample image per class

3. **Start Inspection**:
   - Go to "Inspection"
   - Select `green_brown` as GOOD
   - Upload or capture test images

4. **Verify Classification**:
   - Image with green_brown tip → Should show "GOOD"
   - Image with brown_purple_ring → Should show "REJECT"
   - Image with brown_plain → Should show "REJECT"

### Step 5: Check Database

```sql
-- View all inspected images
SELECT 
  i.id,
  i.filename,
  i.classification,
  i.confidence,
  p.payload->>'predicted_class' as predicted_class,
  p.payload->>'method' as method
FROM images i
LEFT JOIN predictions p ON i.id = p.image_id
ORDER BY i.created_at DESC
LIMIT 10;
```

## Troubleshooting

### Issue: All images classified as "unknown"

**Cause**: YOLO service not running or not responding

**Solution**:
1. Check if Python service is running on port 8000
2. Check backend logs for "YOLO inference failed"
3. System falls back to classical color extraction

### Issue: Wrong classifications

**Cause**: Model class names don't match reference class names

**Solution**:
1. Check model output: `curl http://localhost:8000/api/model-info`
2. Ensure reference class names EXACTLY match model class names
3. Class names are case-sensitive and underscore-sensitive

### Issue: Low confidence scores

**Cause**: Model needs retraining or images are poor quality

**Solution**:
1. Check image quality (lighting, focus, angle)
2. Adjust confidence threshold in inference service
3. Retrain model with more diverse examples

## Expected Behavior

### Scenario 1: Perfect Match
- Upload image of green_brown cone
- Selected good class: green_brown
- **Result**: GOOD (confidence ~90-95%)

### Scenario 2: Different Class
- Upload image of brown_plain cone
- Selected good class: green_brown
- **Result**: REJECT (predicted: brown_plain)

### Scenario 3: Ambiguous Image
- Upload blurry/unclear image
- Selected good class: green_brown
- **Result**: REJECT (low confidence or wrong class)

## Performance Metrics

Monitor these in the database:

```sql
-- Average inference time
SELECT AVG(inference_time_ms) as avg_inference_time
FROM predictions
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Classification accuracy (requires manual verification)
SELECT 
  classification,
  COUNT(*) as count,
  AVG(confidence) as avg_confidence
FROM images
WHERE batch_id = YOUR_BATCH_ID
GROUP BY classification;
```

## Integration Points

1. **Frontend** (`InspectionPage.jsx`):
   - Captures/uploads image
   - Sends to `/api/inspection/classify-and-save`

2. **Backend** (`inspection.routes.js`):
   - Saves image to disk
   - Calls `extractTipColor(imagePath)`

3. **Inference Service** (`inference.service.js`):
   - Calls Python YOLO service at `http://localhost:8000/api/classify`
   - Receives predicted_class
   - Compares with selectedGoodClass

4. **Python Service** (`http_server.py`):
   - Loads best.pt model
   - Runs inference
   - Returns JSON with predictions

5. **Database**:
   - Stores image, classification, confidence
   - Stores full prediction payload
   - Maintains audit trail

## Success Criteria

✅ YOLO service responds within 3 seconds
✅ Predicted class matches one of your 3 reference classes
✅ Confidence scores are reasonable (>0.7 for good matches)
✅ Classification (GOOD/REJECT) is correct based on selected class
✅ All data saved to PostgreSQL
✅ Thumbnails display in gallery
✅ Full audit trail available
