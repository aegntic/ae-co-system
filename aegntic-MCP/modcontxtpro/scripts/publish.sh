#!/bin/bash

# Publishing script for @aegntic/mcp-standard and @aegntic/create-mcp

set -e

echo "🚀 Aegntic MCP Standard Publishing Script"
echo "========================================"

# Check if user is logged in to npm
echo "Checking npm authentication..."
npm whoami || (echo "❌ Please login to npm first: npm login" && exit 1)

# Check current branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "❌ You must be on the main branch to publish"
  exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ You have uncommitted changes. Please commit or stash them first."
  exit 1
fi

# Run tests
echo "Running tests..."
npm test

# Build everything
echo "Building packages..."
npm run build
cd packages/create-mcp && npm run build && cd ../..

# Get version bump type
echo ""
echo "Select version bump type:"
echo "1) patch (1.0.0 -> 1.0.1)"
echo "2) minor (1.0.0 -> 1.1.0)"
echo "3) major (1.0.0 -> 2.0.0)"
read -p "Enter choice (1-3): " choice

case $choice in
  1) VERSION_TYPE="patch";;
  2) VERSION_TYPE="minor";;
  3) VERSION_TYPE="major";;
  *) echo "Invalid choice"; exit 1;;
esac

# Get release message
read -p "Enter release message: " MESSAGE

# Bump version
echo "Bumping version..."
npm version $VERSION_TYPE -m "Release %s - $MESSAGE"

# Also bump create-mcp version to match
cd packages/create-mcp
npm version $VERSION_TYPE --no-git-tag-version
cd ../..

# Commit the version bump
git add packages/create-mcp/package.json
git commit -m "chore: bump create-mcp version"

# Push changes and tags
echo "Pushing to GitHub..."
git push origin main --follow-tags

echo ""
echo "✅ Version bumped and pushed to GitHub"
echo "GitHub Actions will now handle the npm publishing"
echo ""
echo "Monitor the release at: https://github.com/aegntic/aegntic-MCP/actions"
echo ""
echo "After successful publish, packages will be available at:"
echo "- https://www.npmjs.com/package/@aegntic/mcp-standard"
echo "- https://www.npmjs.com/package/@aegntic/create-mcp"