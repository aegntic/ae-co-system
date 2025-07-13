#!/bin/bash

echo "Installing peer dependencies for @aegntic/modcontxtpro..."
echo ""

# Check if package manager is npm or yarn or pnpm
if [ -f "pnpm-lock.yaml" ]; then
    PM="pnpm"
elif [ -f "yarn.lock" ]; then
    PM="yarn"
else
    PM="npm"
fi

echo "Using package manager: $PM"
echo ""

# Install peer dependencies
echo "Installing authentication peer dependencies..."
$PM add @octokit/rest jose

echo ""
echo "Installing optional dependencies..."
$PM add @types/node

echo ""
echo "✅ Peer dependencies installed successfully!"
echo ""
echo "Note: The framework includes simplified implementations for development."
echo "For production use, the installed packages will provide full functionality:"
echo "  - @octokit/rest: Full GitHub API integration"
echo "  - jose: JWT signing and verification"
echo ""