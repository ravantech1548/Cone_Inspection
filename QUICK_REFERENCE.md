# Database Quick Reference

## Connection Info
```
Database: textile_inspector
User:     textile_user
Password: textile_pass_123
Host:     localhost:5432
```

## Active Tables (6)

### 1. users
```sql
SELECT * FROM users;
-- 2 records: admin, inspector accounts
```

### 2. batches
```sql
SELECT id, name, status, good_count, reject_count 
FROM batches 
ORDER BY created_at DESC;
-- 26 batches
```

### 3. images
```sql
SELECT id, filename, classification, confidence 
FROM images 
WHERE batch_id = ?;
-- 6 images total
```

### 4. predictions
```sql
SELECT payload->>'predicted_class' as class,
       payload->>'all_classes' as scores
FROM predictions 
WHERE image_id = ?;
-- 24 predictions
```

### 5. models
```sql
SELECT * FROM models WHERE is_active = true;
-- 1 active YOLO model
```

### 6. batch_metadata
```sql
SELECT * FROM batch_metadata 
WHERE batch_id = ? AND key = 'selected_good_class';
-- Stores which class is "good" for each batch
```

## Unused Tables (3)

- ❌ color_taxonomy (4 records)
- ❌ prompts (1 record)
- ❌ overrides (0 records)

## Common Queries

### Get batch with images
```sql
SELECT 
  b.id, b.name, b.status,
  COUNT(i.id) as total_images,
  SUM(CASE WHEN i.classification = 'good' THEN 1 ELSE 0 END) as good_count,
  SUM(CASE WHEN i.classification = 'reject' THEN 1 ELSE 0 END) as reject_count
FROM batches b
LEFT JOIN images i ON b.id = i.batch_id
WHERE b.id = ?
GROUP BY b.id;
```

### Get image with prediction
```sql
SELECT 
  i.*,
  p.payload->>'predicted_class' as predicted_class,
  p.payload->>'all_classes' as all_classes,
  p.inference_time_ms,
  m.name as model_name
FROM images i
LEFT JOIN predictions p ON i.id = p.image_id
LEFT JOIN models m ON p.model_id = m.id
WHERE i.id = ?;
```

### Get batch selected class
```sql
SELECT value as selected_good_class
FROM batch_metadata
WHERE batch_id = ? AND key = 'selected_good_class';
```

## Cleanup Commands

```bash
# 1. Analyze
node analyze-database.js

# 2. Cleanup
node cleanup-database.js --cleanup

# 3. Verify
node verify-database.js

# 4. Backup (optional)
pg_dump -U textile_user textile_inspector > backup.sql
```

## What Gets Removed

✓ color_taxonomy table  
✓ prompts table  
✓ overrides table  
✓ batches.acceptable_color_id column  
✓ batches.delta_e_tolerance column  

## What Stays

✓ All 6 active tables  
✓ All current data  
✓ All functionality  
✓ All frontend features  

## Schema After Cleanup

```
users → batches → images → predictions → models
           ↓
      batch_metadata
```

Simple, clean, and matches your YOLO workflow!
