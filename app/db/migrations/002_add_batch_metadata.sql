-- Add batch metadata table for storing inspection settings

CREATE TABLE IF NOT EXISTS batch_metadata (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(batch_id, key)
);

CREATE INDEX idx_batch_metadata_batch_id ON batch_metadata(batch_id);
CREATE INDEX idx_batch_metadata_key ON batch_metadata(key);
