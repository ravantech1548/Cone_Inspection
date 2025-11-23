-- Initial schema for textile cone inspector

-- Users and authentication
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('inspector', 'supervisor', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model registry
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

-- Prompt registry
CREATE TABLE prompts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  schema_version VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  schema JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, version)
);

-- Color taxonomy
CREATE TABLE color_taxonomy (
  id SERIAL PRIMARY KEY,
  color_name VARCHAR(100) UNIQUE NOT NULL,
  lab_range JSONB,
  hex_examples TEXT[],
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batches
CREATE TABLE batches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'uploading' CHECK (status IN ('uploading', 'uploaded', 'processing', 'classified', 'finalized')),
  acceptable_color_id INTEGER REFERENCES color_taxonomy(id),
  delta_e_tolerance NUMERIC(5,2) DEFAULT 10.0,
  total_images INTEGER DEFAULT 0,
  good_count INTEGER DEFAULT 0,
  reject_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  finalized_at TIMESTAMP
);

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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Predictions
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
  model_id INTEGER REFERENCES models(id),
  prompt_id INTEGER REFERENCES prompts(id),
  payload JSONB NOT NULL,
  tip_mask JSONB,
  inference_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Overrides
CREATE TABLE overrides (
  id SERIAL PRIMARY KEY,
  image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  original_classification VARCHAR(50) NOT NULL,
  new_classification VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_images_batch_id ON images(batch_id);
CREATE INDEX idx_images_checksum ON images(checksum);
CREATE INDEX idx_images_classification ON images(classification);
CREATE INDEX idx_predictions_image_id ON predictions(image_id);
CREATE INDEX idx_predictions_model_id ON predictions(model_id);
CREATE INDEX idx_overrides_image_id ON overrides(image_id);
CREATE INDEX idx_overrides_user_id ON overrides(user_id);
CREATE INDEX idx_batches_user_id ON batches(user_id);
CREATE INDEX idx_batches_status ON batches(status);

-- GIN indexes for JSONB
CREATE INDEX idx_images_lab_color ON images USING GIN (lab_color);
CREATE INDEX idx_predictions_payload ON predictions USING GIN (payload);
CREATE INDEX idx_prompts_schema ON prompts USING GIN (schema);

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
