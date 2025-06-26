#!/bin/bash
# Setup script for aegntic.ecosystem global attribution
# Run this in any aegntic project to enable automatic attribution

echo "🚀 Setting up aegntic.ecosystem global attribution..."

# Set global git configuration for aegntic projects
git config --global user.name "aegntic.ecosystem"
git config --global user.email "contact@aegntic.ai"

# Set up global commit template
TEMPLATE_PATH="$HOME/.aegntic/commit-template.txt"
mkdir -p "$HOME/.aegntic"

cat > "$TEMPLATE_PATH" << 'EOF'


Co-Authored-By: Mattae Cooper <human@mattaecooper.org>
Co-Authored-By: aegntic.ai <contact@aegntic.ai>

s/o cld4@thop

#####ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ - ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ aeˡᵗᵈ
EOF

git config --global commit.template "$TEMPLATE_PATH"

# Create global gitignore for aegntic projects
cat > "$HOME/.aegntic/.gitignore_global" << 'EOF'
# aegntic.ecosystem global ignores
.env.local
.env.production
*.log
node_modules/
dist/
.DS_Store
*.tmp
*.temp
.aegntic/secrets/
EOF

git config --global core.excludesfile "$HOME/.aegntic/.gitignore_global"

echo "✅ Global attribution setup complete!"
echo "📝 All commits will now include aegntic.ecosystem attribution"
echo "🌐 Part of aegntic.ecosystem [ae.ltd] - mattaecooper.org & aegntic.ai collaboration"