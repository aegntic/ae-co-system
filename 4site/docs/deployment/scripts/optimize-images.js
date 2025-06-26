const sharp = require('sharp');
const glob = require('glob');
const path = require('path');

async function optimizeImages() {
  const images = glob.sync('public/assets/images/*.{jpg,jpeg,png}');
  
  for (const imagePath of images) {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Create WebP version
    await image
      .webp({ quality: 85 })
      .toFile(imagePath.replace(/\.(jpg|jpeg|png)$/, '.webp'));
    
    // Create AVIF version
    await image
      .avif({ quality: 80 })
      .toFile(imagePath.replace(/\.(jpg|jpeg|png)$/, '.avif'));
    
    // Optimize original
    if (metadata.format === 'png') {
      await sharp(imagePath)
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(imagePath + '.tmp');
    } else {
      await sharp(imagePath)
        .jpeg({ quality: 85, progressive: true })
        .toFile(imagePath + '.tmp');
    }
    
    // Replace original
    await fs.rename(imagePath + '.tmp', imagePath);
    
    console.log(`✓ Optimized: ${path.basename(imagePath)}`);
  }
}

optimizeImages();