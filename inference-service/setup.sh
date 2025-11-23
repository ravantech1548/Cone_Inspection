#!/bin/bash

# Setup script for inference service

echo "Setting up Textile Cone Inspector Inference Service..."

# Create directories
mkdir -p models
mkdir -p reference_images/green
mkdir -p reference_images/brown
mkdir -p reference_images/beige
mkdir -p reference_images/striped
mkdir -p reference_images/white

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✓ Created .env file"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Place your best.pt model in the models/ directory"
echo "2. Add reference images to reference_images/<class>/ directories"
echo "3. Start the HTTP server: python http_server.py"
echo "   OR configure as MCP server in Kiro IDE"
