#!/bin/bash

# Replace YOUR_USERNAME with your actual GitHub username
echo "🚀 Pushing zkFlow.pro to GitHub..."

# Add your GitHub repository URL here
git remote add origin https://github.com/YOUR_USERNAME/zkflow-pro.git

# Push to GitHub
git push -u origin main

echo "✅ Code pushed to GitHub!"
echo "🌐 GitHub Actions will now auto-deploy to https://zkflow.pro"
echo ""
echo "📋 Next steps:"
echo "1. Go to Vercel.com and import your GitHub repository"
echo "2. Set root directory to 'website/'"
echo "3. Add environment variables from GITHUB_SETUP.md"
echo "4. Your site will be live at https://zkflow.pro"