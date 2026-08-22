#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Installing backend dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt

echo "Initializing database..."
python -c "import database; database.init_db(); print('Database initialized successfully!')"
cd ..

echo "Build complete."
