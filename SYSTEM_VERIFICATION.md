# System Verification - Pattern Matching Flow

## How the System Works

### 1. **Model Classes Extraction**
- System connects to YOLO inference service
- Calls `/api/model-info` endpoint
- Extracts class names from best.pt model
- Example: `['green_brown', 'brown_purple_ring', 'brown_plain']`

### 2. **Good Class Selection**
- Inspector sees all model classes on screen
- Clicks on ONE class to mark as "GOOD"
- Example: Selects `green_brown` as acceptable
- All other classes (`brown_purple_ring`, `brown_plain`) will be REJECT

### 3. **Image Classification**
When you upload/capture an image:

```
Upload Image
    ↓
YOLO Model Analyzes Image
    ↓
Returns: predicted_class = 'brown_purple_ring'
    ↓
Backend Compares:
  predicted_class === selectedGoodClass?
  'brown_purple_ring' === 'green_brown'?
  → NO
    ↓
Classification = REJECT
```

### 4. **Pattern Matching Logic**

```javascript
// In inspection.routes.js (line ~90)
const predictedClass = inferenceResult.predictedClass; // From YOLO
const isGood = predictedClass === selectedGoodClass;   // Exact string match
const classification = isGood ? 'good' : 'reject';
```

## Test Scenarios

### Scenario 1: Perfect Match
```
Selected GOOD class: green_brown
Uploaded image: Green/brown cone tip
YOLO predicts: green_brown
Match? YES → Result: GOOD ✅
```

### Scenario 2: Different Class
```
Selected GOOD class: green_brown
Uploaded image: Brown cone with purple ring
YOLO predicts: brown_purple_ring
Match? NO → Result: REJECT ❌
```

### Scenario 3: Another Different Class
```
Selected GOOD class: green_brown
Uploaded image: Plain brown cone
YOLO predicts: brown_plain
Match? NO → Result: REJECT ❌
```

## Verification Steps

### Step 1: Check YOLO Service is Running
```powershell
curl http://localhost:8000/api/model-info
```

Expected response:
```json
{
  "model_type": "YOLOv8 Classification",
  "classes": ["green_brown", "brown_purple_ring", "brown_plain"],
  "num_classes": 3
}
```

### Step 2: Verify Class Loading in Frontend
1. Open Inspection page
2. Check browser console (F12)
3. Should see: "Classes loaded from YOLO model"
4. Should display 3 class options

### Step 3: Test Classification
1. Select `green_brown` as GOOD
2. Upload image of green/brown cone
3. Check result - should be GOOD
4. Upload image of brown_purple_ring cone
5. Check result - should be REJECT

### Step 4: Verify in Database
```sql
SELECT 
  i.filename,
  i.classification,
  p.payload->>'predicted_class' as predicted_class,
  i.confidence
FROM images i
LEFT JOIN predictions p ON i.id = p.image_id
ORDER BY i.created_at DESC
LIMIT 5;
```

Expected output:
```
filename              | classification | predicted_class      | confidence
---------------------|----------------|---------------------|------------
green_cone_1.jpg     | good           | green_brown         | 0.95
purple_ring_1.jpg    | reject         | brown_purple_ring   | 0.92
plain_brown_1.jpg    | reject         | brown_plain         | 0.88
```

## Code References

### Frontend: Class Selection
**File**: `app/frontend/src/pages/InspectionPage.jsx`
**Line**: ~50-70

```javascript
const loadReferences = async () => {
  // Get model classes from YOLO model
  const modelData = await api.get('/model/classes');
  const modelClasses = modelData.classes || [];
  // Creates selection UI with model classes
};
```

### Backend: Pattern Matching
**File**: `app/backend/src/routes/inspection.routes.js`
**Line**: ~85-95

```javascript
// Run inference
const inferenceResult = await extractTipColor(savedPath);

// Determine classification
const predictedClass = inferenceResult.predictedClass || 'unknown';
const isGood = predictedClass === selectedGoodClass;  // ← EXACT MATCH
const classification = isGood ? 'good' : 'reject';
```

### Inference Service: YOLO Classification
**File**: `app/backend/src/services/inference.service.js`
**Line**: ~10-40

```javascript
const callYOLOInference = async (imagePath) => {
  const response = await fetch(`${config.inference.serviceUrl}/api/classify`, {
    method: 'POST',
    body: JSON.stringify({ 
      image_path: imagePath,
      confidence_threshold: 0.7
    })
  });
  return await response.json();
  // Returns: { predicted_class: 'green_brown', confidence: 0.95 }
};
```

## Troubleshooting

### Issue: All images marked as REJECT
**Cause**: Class names don't match exactly

**Check**:
1. What classes does your model output?
   ```powershell
   cd inference-service
   python inspect_model.py
   ```

2. What class did you select as GOOD?
   - Check in browser console

3. What class is YOLO predicting?
   - Check backend terminal output
   - Or check database: `SELECT payload FROM predictions ORDER BY id DESC LIMIT 1;`

**Solution**: Ensure class names match EXACTLY (case-sensitive, underscores, etc.)

### Issue: YOLO not classifying
**Cause**: Inference service not running or model not loaded

**Solution**:
```powershell
cd inference-service
python http_server.py
```

Look for:
```
✓ Model loaded from ./models/best.pt
✓ Classes: ['green_brown', 'brown_purple_ring', 'brown_plain']
```

## Summary

✅ **Classes extracted from best.pt** - Automatic
✅ **User selects GOOD class** - From model classes
✅ **YOLO classifies images** - Returns predicted class
✅ **Exact string match** - predicted_class === selectedGoodClass
✅ **Result: GOOD or REJECT** - Based on match

The system is working exactly as you described!
