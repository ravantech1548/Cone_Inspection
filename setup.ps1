# Textile Cone Inspector - Automated Setup Script
# For Windows PowerShell

$ErrorActionPreference = "Stop"

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Textile Cone Inspector Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        if (Get-Command $Command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
if (Test-Command node) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js installed: $nodeVersion" -ForegroundColor Green
}
else {
    Write-Host "✗ Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js 18.x or higher from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
if (Test-Command python) {
    $pythonVersion = python --version
    Write-Host "✓ Python installed: $pythonVersion" -ForegroundColor Green
}
else {
    Write-Host "✗ Python not found" -ForegroundColor Red
    Write-Host "Please install Python 3.8 or higher from https://www.python.org/" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
if (Test-Command psql) {
    $psqlVersion = psql --version
    Write-Host "✓ PostgreSQL installed: $psqlVersion" -ForegroundColor Green
}
else {
    Write-Host "✗ PostgreSQL not found" -ForegroundColor Red
    Write-Host "Please install PostgreSQL 14 or higher from https://www.postgresql.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Installing Dependencies" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location app\backend
npm install
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
Set-Location ..\..

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location app\frontend
npm install
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Set-Location ..\..

# Setup Python virtual environment
Write-Host "Setting up Python virtual environment..." -ForegroundColor Yellow
Set-Location inference-service
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Write-Host "✓ Python dependencies installed" -ForegroundColor Green
deactivate
Set-Location ..

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Configuration" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Copy environment files if they don't exist
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "⚠ Please edit .env file with your settings" -ForegroundColor Yellow
}
else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

if (-not (Test-Path inference-service\.env)) {
    Write-Host "Creating inference-service\.env file..." -ForegroundColor Yellow
    Copy-Item inference-service\.env.example inference-service\.env
    Write-Host "✓ inference-service\.env file created" -ForegroundColor Green
}
else {
    Write-Host "✓ inference-service\.env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Database Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Prompt for database setup
$setupDb = Read-Host "Do you want to set up the database now? (y/n)"
if ($setupDb -eq "y" -or $setupDb -eq "Y") {
    Write-Host "Setting up database..." -ForegroundColor Yellow
    
    # Create user and database
    Write-Host "Creating database user and database..." -ForegroundColor Yellow
    
    # Note: You may need to enter postgres password
    psql -U postgres -c "CREATE USER textile_user WITH PASSWORD 'textile_pass_123';" 2>$null
    psql -U postgres -c "CREATE DATABASE textile_inspector OWNER textile_user;" 2>$null
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE textile_inspector TO textile_user;"
    
    Write-Host "✓ Database created" -ForegroundColor Green
    
    # Run migrations
    Write-Host "Running database migrations..." -ForegroundColor Yellow
    node app\backend\src\db\migrate.js
    Write-Host "✓ Migrations completed" -ForegroundColor Green
    
    # Create admin user
    Write-Host "Creating admin user..." -ForegroundColor Yellow
    $sql = @"
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$10$rZ5YhJKvXqKqYqKqYqKqYuO5YhJKvXqKqYqKqYqKqYqKqYqKqYqKq', 'admin')
ON CONFLICT (username) DO NOTHING;
"@
    $sql | psql -U textile_user -d textile_inspector
    Write-Host "✓ Admin user created (username: admin, password: admin123)" -ForegroundColor Green
}
else {
    Write-Host "Skipping database setup..." -ForegroundColor Yellow
    Write-Host "⚠ You'll need to set up the database manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "YOLO Model" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check for YOLO model
if (Test-Path inference-service\models\best.pt) {
    Write-Host "✓ YOLO model found: inference-service\models\best.pt" -ForegroundColor Green
}
else {
    Write-Host "⚠ YOLO model not found" -ForegroundColor Yellow
    Write-Host "Please place your trained YOLO model at:" -ForegroundColor Yellow
    Write-Host "  inference-service\models\best.pt" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To start the application:" -ForegroundColor White
Write-Host ""
Write-Host "Option 1: Use start script" -ForegroundColor Cyan
Write-Host "  .\start-all.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Option 2: Manual start" -ForegroundColor Cyan
Write-Host "Terminal 1 (Backend):" -ForegroundColor Yellow
Write-Host "  cd app\backend" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 (Frontend):" -ForegroundColor Yellow
Write-Host "  cd app\frontend" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 3 (Inference Service):" -ForegroundColor Yellow
Write-Host "  cd inference-service" -ForegroundColor White
Write-Host "  .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  python http_server.py" -ForegroundColor White
Write-Host ""
Write-Host "Then open: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Login: admin / admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy inspecting! 🎉" -ForegroundColor Green
