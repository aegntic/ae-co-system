// Script to generate icon SVG files for the extension
// This creates a key/form themed icon in various sizes

const fs = require('fs');
const path = require('path');

const iconSVG = `
<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="64" cy="64" r="60" fill="#5b4cdb"/>
  
  <!-- Key shape -->
  <g transform="translate(64, 64)">
    <!-- Key handle -->
    <circle cx="-20" cy="0" r="16" fill="white" opacity="0.9"/>
    <circle cx="-20" cy="0" r="10" fill="#5b4cdb"/>
    
    <!-- Key shaft -->
    <rect x="-8" y="-4" width="40" height="8" fill="white" opacity="0.9"/>
    
    <!-- Key teeth -->
    <rect x="28" y="-4" width="4" height="12" fill="white" opacity="0.9"/>
    <rect x="24" y="-4" width="4" height="8" fill="white" opacity="0.9"/>
    <rect x="20" y="-4" width="4" height="10" fill="white" opacity="0.9"/>
    
    <!-- Flow indicator dots -->
    <circle cx="8" cy="0" r="2" fill="#5b4cdb"/>
    <circle cx="14" cy="0" r="2" fill="#5b4cdb"/>
    <circle cx="20" cy="0" r="2" fill="#5b4cdb"/>
  </g>
  
  <!-- zkFlow text (optional for larger sizes) -->
  <text x="64" y="100" font-family="Arial, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" fill="white">zkFlow</text>
</svg>
`;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname);

// Generate different sized PNGs (you would normally use a proper image library for this)
// For now, we'll create placeholder instructions
const instructions = `
To generate the PNG icons from the SVG:

1. Save the SVG content below as icon.svg
2. Use an online converter or image editor to export as PNG in these sizes:
   - 16x16 -> icon-16.png
   - 32x32 -> icon-32.png
   - 48x48 -> icon-48.png
   - 128x128 -> icon-128.png

SVG Content:
${iconSVG}

Alternative: You can use ImageMagick:
convert -background none icon.svg -resize 16x16 icon-16.png
convert -background none icon.svg -resize 32x32 icon-32.png
convert -background none icon.svg -resize 48x48 icon-48.png
convert -background none icon.svg -resize 128x128 icon-128.png
`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), iconSVG);
fs.writeFileSync(path.join(iconsDir, 'icon-generation-instructions.txt'), instructions);

console.log('Icon SVG and instructions created!');