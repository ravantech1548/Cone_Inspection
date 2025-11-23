-- Clean schema for Textile Cone Inspector
-- This represents the final state after all migrations
-- Database: textile_inspector
-- User: textile_user
-- Password: textile_pass_123

-- Users and authentication
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('inspector', 'supervisor', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE users IS 'User authentication and authorization';

-- Model registry (YOLO models)
CREATE TABLE models (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  config JSONB,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, version)
);

COMMENT ON TABLE models IS 'YOLO model registry and versioning';

-- Inspection batches
CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'uploading' CHECK (status IN ('uploading', 'uploaded', 'processing', 'classified', 'finalized')),
  total_images INTEGER DEFAULT 0,
  good_count INTEGER DEFAULT 0,
  reject_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finalized_at TIMESTAMP
);

COMMENT ON TABLE batches IS 'Inspection batch tracking with YOLO classification';

-- Batch metadata (stores selected_good_class and other settings)
CREATE TABLE batch_metadata (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_id, key)
);

COMMENT ON TABLE batch_metadata IS 'Batch configuration (e.g., selected_good_class)';

-- Images
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  checksum VARCHAR(64) UNIQUE NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(50) NOT NULL,
  width INTEGER,
  height INTEGER,
  lab_color JSONB,
  hex_color VARCHAR(7),
  classification VARCHAR(50) CHECK (classification IN ('pending', 'good', 'reject')),
  confidence NUMERIC(5,4),
  thumbnail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE images IS 'Uploaded cone images with YOLO predictions';
COMMENT ON COLUMN images.thumbnail IS 'Base64 encoded thumbnail image (200x200)';

-- Predictions (YOLO results)
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
  model_id INTEGER REFERENCES models(id),
  prompt_id INTEGER,
  payload JSONB NOT NULL,
  tip_mask JSONB,
  inference_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE predictions IS 'YOLO model prediction results';
COMMENT ON COLUMN predictions.prompt_id IS 'Legacy field, not used with YOLO';

-- Indexes for performance
CREATE INDEX idx_images_batch_id ON images(batch_id);
CREATE INDEX idx_images_checksum ON images(checksum);
CREATE INDEX idx_images_classification ON images(classification);
CREATE INDEX idx_predictions_image_id ON predictions(image_id);
CREATE INDEX idx_predictions_model_id ON predictions(model_id);
CREATE INDEX idx_batches_user_id ON batches(user_id);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batch_metadata_batch_id ON batch_metadata(batch_id);
CREATE INDEX idx_batch_metadata_key ON batch_metadata(key);

-- GIN indexes for JSONB
CREATE INDEX idx_images_lab_color ON images USING GIN (lab_color);
CREATE INDEX idx_predictions_payload ON predictions USING GIN (payload);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE migrations IS 'Database migration tracking';
