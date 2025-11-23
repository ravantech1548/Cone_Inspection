-- Cleanup unused tables that are not used by the current YOLO-based implementation
-- This migration removes tables that were part of the original design but are not used

-- Drop unused tables
DROP TABLE IF EXISTS color_taxonomy CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS overrides CASCADE;

-- Remove indexes that referenced dropped tables
-- (CASCADE should handle this, but being explicit)

-- Update batches table to remove references to dropped tables
ALTER TABLE batches DROP COLUMN IF EXISTS acceptable_color_id;
ALTER TABLE batches DROP COLUMN IF EXISTS delta_e_tolerance;

-- Add comment to document the schema
COMMENT ON TABLE users IS 'User authentication and authorization';
COMMENT ON TABLE batches IS 'Inspection batch tracking with YOLO classification';
COMMENT ON TABLE images IS 'Uploaded cone images with YOLO predictions';
COMMENT ON TABLE predictions IS 'YOLO model prediction results';
COMMENT ON TABLE models IS 'YOLO model registry and versioning';
COMMENT ON TABLE batch_metadata IS 'Batch configuration (e.g., selected_good_class)';
