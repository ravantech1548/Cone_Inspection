-- Default admin user (password: admin123 - CHANGE IN PRODUCTION)
-- Hash generated with bcrypt rounds=10 for password 'admin123'
INSERT INTO users (username, password_hash, role) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
('inspector1', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'inspector');

-- Default model
INSERT INTO models (name, version, checksum, config, is_active) VALUES
('cone-tip-classifier', 'v1.0.0', 'placeholder-checksum', '{"type": "local", "runtime": "onnx"}', true);

-- Default prompt
INSERT INTO prompts (name, version, schema_version, content, schema, is_active) VALUES
('color-extraction', 'v1.0.0', '1.0', 
'Extract the dominant color from the cone tip region. Return JSON with LAB values and color name.',
'{"type": "object", "properties": {"L": {"type": "number"}, "A": {"type": "number"}, "B": {"type": "number"}, "color_name": {"type": "string"}}, "required": ["L", "A", "B", "color_name"]}',
true);

-- Default color taxonomy
INSERT INTO color_taxonomy (color_name, lab_range, hex_examples, description) VALUES
('white', '{"L": [85, 100], "A": [-5, 5], "B": [-5, 5]}', ARRAY['#FFFFFF', '#F5F5F5'], 'White or off-white cone tips'),
('beige', '{"L": [70, 85], "A": [0, 10], "B": [10, 25]}', ARRAY['#F5F5DC', '#EDD9C0'], 'Beige or cream colored tips'),
('brown', '{"L": [30, 60], "A": [5, 20], "B": [10, 30]}', ARRAY['#8B4513', '#A0522D'], 'Brown or tan tips'),
('gray', '{"L": [40, 70], "A": [-5, 5], "B": [-5, 5]}', ARRAY['#808080', '#A9A9A9'], 'Gray toned tips');
