#!/bin/bash

# Textile Cone Inspector - Automated Setup Script
# For Linux/macOS

set -e  # Exit on error

echo "==================================="
echo "Textile Cone Inspector Setup"
echo "==================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}Please do not run as root${NC}"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
echo "Checking Node.js..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 18.x or higher from https://nodejs.org/"
    exit 1
fi

# Check Python
echo "Checking Python..."
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✓ Python installed: $PYTHON_VERSION${NC}"
else
    echo -e "${RED}✗ Python not found${NC}"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check PostgreSQL
echo "Checking PostgreSQL..."
if command_exists psql; then
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✓ PostgreSQL installed: $PSQL_VERSION${NC}"
else
    echo -e "${RED}✗ PostgreSQL not found${NC}"
    echo "Please install PostgreSQL 14 or higher"
    exit 1
fi

echo ""
echo "==================================="
echo "Installing Dependencies"
echo "==================================="
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd app/backend
npm install
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
cd ../..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd app/frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ../..

# Setup Python virtual environment
echo "Setting up Python virtual environment..."
cd inference-service
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"
deactivate
cd ..

echo ""
echo "==================================="
echo "Configuration"
echo "==================================="
echo ""

# Copy environment files if they don't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}⚠ Please edit .env file with your settings${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

if [ ! -f inference-service/.env ]; then
    echo "Creating inference-service/.env file..."
    cp inference-service/.env.example inference-service/.env
    echo -e "${GREEN}✓ inference-service/.env file created${NC}"
else
    echo -e "${GREEN}✓ inference-service/.env file already exists${NC}"
fi

echo ""
echo "==================================="
echo "Database Setup"
echo "==================================="
echo ""

# Prompt for database setup
read -p "Do you want to set up the database now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Setting up database..."
    
    # Check if database exists
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw textile_inspector; then
        echo -e "${YELLOW}⚠ Database 'textile_inspector' already exists${NC}"
        read -p "Do you want to drop and recreate it? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            psql -U postgres -c "DROP DATABASE textile_inspector;"
            psql -U postgres -c "DROP USER IF EXISTS textile_user;"
        else
            echo "Skipping database creation..."
        fi
    fi
    
    # Create user and database
    echo "Creating database user and database..."
    psql -U postgres -c "CREATE USER textile_user WITH PASSWORD 'textile_pass_123';" 2>/dev/null || echo "User already exists"
    psql -U postgres -c "CREATE DATABASE textile_inspector OWNER textile_user;" 2>/dev/null || echo "Database already exists"
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE textile_inspector TO textile_user;"
    
    echo -e "${GREEN}✓ Database created${NC}"
    
    # Run migrations
    echo "Running database migrations..."
    node app/backend/src/db/migrate.js
    echo -e "${GREEN}✓ Migrations completed${NC}"
    
    # Create admin user
    echo "Creating admin user..."
    psql -U textile_user -d textile_inspector -c "
        INSERT INTO users (username, password_hash, role)
        VALUES ('admin', '\$2b\$10\$rZ5YhJKvXqKqYqKqYqKqYuO5YhJKvXqKqYqKqYqKqYqKqYqKqYqKq', 'admin')
        ON CONFLICT (username) DO NOTHING;
    "
    echo -e "${GREEN}✓ Admin user created (username: admin, password: admin123)${NC}"
else
    echo "Skipping database setup..."
    echo -e "${YELLOW}⚠ You'll need to set up the database manually${NC}"
fi

echo ""
echo "==================================="
echo "YOLO Model"
echo "==================================="
echo ""

# Check for YOLO model
if [ -f inference-service/models/best.pt ]; then
    echo -e "${GREEN}✓ YOLO model found: inference-service/models/best.pt${NC}"
else
    echo -e "${YELLOW}⚠ YOLO model not found${NC}"
    echo "Please place your trained YOLO model at:"
    echo "  inference-service/models/best.pt"
fi

echo ""
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd app/backend"
echo "  npm start"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd app/frontend"
echo "  npm run dev"
echo ""
echo "Terminal 3 (Inference Service):"
echo "  cd inference-service"
echo "  source venv/bin/activate"
echo "  python http_server.py"
echo ""
echo "Then open: http://localhost:5173"
echo "Login: admin / admin123"
echo ""
echo -e "${GREEN}Happy inspecting! 🎉${NC}"
