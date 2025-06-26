#!/bin/bash

# Ensure dependencies are installed
echo "Checking dependencies..."
npm install
cd client && npm install && cd ..

# Build the app
echo "Building production package..."
npm run build

echo "Build completed! Check the 'dist' directory for the distribution packages."
