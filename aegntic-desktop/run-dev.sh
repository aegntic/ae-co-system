#!/bin/bash

# Ensure dependencies are installed
echo "Checking dependencies..."
npm install
cd client && npm install && cd ..

# Start the development server
echo "Starting development server..."
npm start
