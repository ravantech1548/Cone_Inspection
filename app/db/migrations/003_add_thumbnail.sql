-- Add thumbnail column to images table for quick preview

ALTER TABLE images ADD COLUMN IF NOT EXISTS thumbnail TEXT;

COMMENT ON COLUMN images.thumbnail IS 'Base64 encoded thumbnail image (200x200)';
