#!/bin/bash

# Script to fix security vulnerabilities across all npm projects in the ae-co-system
echo "🔐 Fixing security vulnerabilities across all npm projects..."

# Function to fix npm vulnerabilities in a directory
fix_npm_audit() {
    local dir="$1"
    if [[ -f "$dir/package.json" && -f "$dir/package-lock.json" ]]; then
        echo "🔧 Fixing vulnerabilities in: $dir"
        cd "$dir"
        
        # Run npm audit fix (non-breaking changes only)
        npm audit fix --omit=dev --omit=optional 2>/dev/null || true
        
        # Go back to root
        cd "$OLDPWD"
    fi
}

# Find all directories with package.json files
echo "📁 Scanning for npm projects..."
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.venv/*" | while read -r package_file; do
    dir=$(dirname "$package_file")
    
    # Skip if directory doesn't have package-lock.json (might be a template or incomplete project)
    if [[ -f "$dir/package-lock.json" ]]; then
        fix_npm_audit "$dir"
    else
        echo "⚠️  Skipping $dir (no package-lock.json)"
    fi
done

echo "✅ Security vulnerability fixes completed!"
echo "📊 Run 'npm audit' in individual project directories to check remaining vulnerabilities."
