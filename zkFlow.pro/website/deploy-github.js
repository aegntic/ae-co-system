const { exec } = require('child_process');
const fs = require('fs');

// Create GitHub deployment script
const deployScript = `
# GitHub Actions workflow for auto-deployment
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.ORG_ID }}
          vercel-project-id: \${{ secrets.PROJECT_ID }}
          working-directory: ./website
`;

fs.writeFileSync('.github/workflows/deploy.yml', deployScript);
console.log('✅ GitHub Actions deployment configured');
