-- Migration: Fix Duplicate Predictions
-- This migration adds a unique constraint to prevent duplicate predictions
-- and cleans up existing duplicates

-- Step 1: Remove duplicate predictions, keeping only the most recent one
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

-- Step 2: Add unique constraint to prevent future duplicates
-- This ensures each image can only have one prediction
ALTER TABLE predictions
ADD CONSTRAINT predictions_image_id_unique UNIQUE (image_id);

-- Step 3: Add comment explaining the constraint
COMMENT ON CONSTRAINT predictions_image_id_unique ON predictions IS 
'Ensures each image has only one prediction. If a new prediction is needed, the old one should be updated or deleted first.';

-- Verification query (for manual checking)
-- SELECT image_id, COUNT(*) as count FROM predictions GROUP BY image_id HAVING COUNT(*) > 1;
