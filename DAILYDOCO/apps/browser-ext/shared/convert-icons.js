#!/usr/bin/env node

/**
 * DailyDoco Pro - Ultra-tier Icon Conversion Script
 * Converts SVG icons to high-quality PNG with advanced optimization
 */

const fs = require('fs').promises;
const path = require('path');

// For this script to work, you would need to install Sharp:
// npm install sharp

async function convertIcons(platform = 'chrome') {
  console.log(`🎨 Converting ultra-tier icons for ${platform}...`);
  
  const platformPath = path.join(__dirname, '..', platform);
  const assetsPath = path.join(platformPath, 'assets');
  
  const sizes = [16, 32, 48, 128];
  
  try {
    // Check if Sharp is available
    let sharp;
    try {
      sharp = require('sharp');
    } catch (error) {
      console.log('⚠️  Sharp not installed. Using fallback SVG icons.');
      console.log('   To enable PNG conversion, run: npm install sharp');
      return await createFallbackPNGs(assetsPath);
    }
    
    // Convert each size with ultra-high quality settings
    for (const size of sizes) {
      const svgPath = path.join(assetsPath, `icon-${size}.svg`);
      const pngPath = path.join(assetsPath, `icon-${size}.png`);
      
      try {
        const svgBuffer = await fs.readFile(svgPath);
        
        // Ultra-high quality PNG conversion
        await sharp(svgBuffer)
          .resize(size, size, {
            kernel: sharp.kernel.lanczos3,
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png({
            quality: 100,
            compressionLevel: 0,
            adaptiveFiltering: true,
            force: true
          })
          .toFile(pngPath);
          
        console.log(`✅ Converted icon-${size}.svg to PNG`);
        
      } catch (error) {
        console.error(`❌ Failed to convert icon-${size}.svg:`, error.message);
      }
    }
    
    console.log(`🎯 Ultra-tier icon conversion complete for ${platform}`);
    
  } catch (error) {
    console.error('❌ Icon conversion failed:', error);
    process.exit(1);
  }
}

async function createFallbackPNGs(assetsPath) {
  console.log('📝 Creating fallback PNG placeholders...');
  
  const sizes = [16, 32, 48, 128];
  
  // Create simple text-based PNG placeholders that indicate SVG should be used
  const pngComment = `
# DailyDoco Pro Icon Placeholder
# 
# This is a placeholder PNG file. For production use:
# 1. Install Sharp: npm install sharp
# 2. Run: npm run convert-icons
# 
# Or manually convert the corresponding SVG file to PNG
# using your preferred image editor or online converter.
# 
# The SVG versions are ultra-tier quality 3D isometric designs.
  `.trim();
  
  for (const size of sizes) {
    const pngPath = path.join(assetsPath, `icon-${size}.png`);
    await fs.writeFile(pngPath, pngComment, 'utf8');
    console.log(`📝 Created placeholder for icon-${size}.png`);
  }
  
  console.log('ℹ️  SVG icons will be used as fallback in browser extension');
}

// Ultra-polished build information
function displayBuildInfo() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    DailyDoco Pro Icon Builder                ║
║                   Ultra-Tier 3D Isometric Icons              ║
╠═══════════════════════════════════════════════════════════════╣
║ • Advanced SVG to PNG conversion with Sharp                  ║
║ • Lanczos3 resampling for ultra-sharp edges                  ║
║ • Adaptive filtering for optimal compression                 ║
║ • Transparent backgrounds with alpha channel                 ║
║ • Professional 3D isometric design language                 ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}

// Main execution
if (require.main === module) {
  displayBuildInfo();
  
  const platform = process.argv[2] || 'chrome';
  
  if (!['chrome', 'firefox'].includes(platform)) {
    console.error('❌ Invalid platform. Use: chrome or firefox');
    process.exit(1);
  }
  
  convertIcons(platform).catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });
}

module.exports = { convertIcons };