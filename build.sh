#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Building frontend..."
cd frontend
# Install frontend dependencies
npm install
# Build the frontend (outputs to frontend/dist)
npm run build
cd ..

echo "Installing backend dependencies..."
cd backend
# Render's Python environment doesn't always upgrade pip, but it's good practice
pip install --upgrade pip
# Install python packages
pip install -r requirements.txt
cd ..

echo "Build complete."
