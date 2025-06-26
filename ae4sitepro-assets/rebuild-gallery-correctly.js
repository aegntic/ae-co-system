const fs = require('fs');
const path = require('path');

// Get all actual HTML files
const htmlFiles = fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.html') && file !== 'Masonry Image Gallery Layout.html')
  .map(file => file.replace('.html', ''));

console.log(`Found ${htmlFiles.length} actual HTML files`);

// Check which ones have thumbnails
const thumbnailsDir = path.join(__dirname, 'thumbnails');
const actualThumbnails = fs.readdirSync(thumbnailsDir)
  .filter(file => file.endsWith('.png'))
  .map(file => file.replace('.png', ''));

// Match HTML files to their exact thumbnails
const exactMatches = [];
htmlFiles.forEach(htmlFile => {
  if (actualThumbnails.includes(htmlFile)) {
    exactMatches.push({
      name: htmlFile,
      thumbnail: `thumbnails/${htmlFile}.png`,
      title: htmlFile,
      description: `${htmlFile} - A professional UI component with modern design and interactive features.`
    });
  }
});

console.log(`Found ${exactMatches.length} exact matches between HTML files and thumbnails`);

// Categorize the exact matches
const categories = {
  navigation: [],
  interactive: [],
  content: [],
  forms: [],
  media: [],
  ecommerce: [],
  data: [],
  advanced: []
};

exactMatches.forEach(item => {
  const name = item.name.toLowerCase();
  
  if (name.includes('navigation') || name.includes('sidebar') || name.includes('header') || name.includes('footer') || name.includes('menu')) {
    categories.navigation.push(item);
  } else if (name.includes('interactive') || name.includes('modal') || name.includes('tooltip') || name.includes('accordion') || name.includes('dropdown') || name.includes('slider') || name.includes('carousel')) {
    categories.interactive.push(item);
  } else if (name.includes('card') || name.includes('timeline') || name.includes('testimonial') || name.includes('pricing') || name.includes('blog') || name.includes('portfolio') || name.includes('news')) {
    categories.content.push(item);
  } else if (name.includes('form') || name.includes('login') || name.includes('signup') || name.includes('registration') || name.includes('search') || name.includes('filter')) {
    categories.forms.push(item);
  } else if (name.includes('image') || name.includes('video') || name.includes('audio') || name.includes('gallery') || name.includes('carousel') || name.includes('masonry') || name.includes('parallax')) {
    categories.media.push(item);
  } else if (name.includes('product') || name.includes('shopping') || name.includes('cart') || name.includes('checkout') || name.includes('wishlist') || name.includes('ecommerce')) {
    categories.ecommerce.push(item);
  } else if (name.includes('dashboard') || name.includes('chart') || name.includes('data') || name.includes('table') || name.includes('analytics') || name.includes('stats') || name.includes('graph') || name.includes('calendar')) {
    categories.data.push(item);
  } else if (name.includes('3d') || name.includes('perspective') || name.includes('grid') || name.includes('flip') || name.includes('split') || name.includes('full') || name.includes('magazine') || name.includes('infinite')) {
    categories.advanced.push(item);
  } else {
    // Default to content if unsure
    categories.content.push(item);
  }
});

// Print categorization
Object.entries(categories).forEach(([cat, items]) => {
  console.log(`${cat}: ${items.length} items`);
  items.forEach(item => console.log(`  - ${item.name}`));
});

// Generate the corrected gallery HTML
const generateGallerySection = (title, items) => {
  if (items.length === 0) return '';
  
  return `
    <!-- ${title} -->
    <div class="category-section">
      <h2 class="category-title">${title}</h2>
      <div class="masonry-grid">
        ${items.map(item => `
        <div class="glass-thumbnail" draggable="true" data-asset="${item.name.toLowerCase().replace(/\s+/g, '-')}">
          <div class="drag-indicator">⋮⋮</div>
          <img src="${item.thumbnail}" alt="${item.title}" class="thumbnail-image">
          <div class="thumbnail-info">
            <div class="thumbnail-title">${item.title}</div>
            <div class="thumbnail-description">${item.description}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>`;
};

// Generate complete HTML content
const galleryContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ProjectAssets Gallery | 4site.pro</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      background: #000000;
      color: #ffffff;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      overflow-x: hidden;
      min-height: 100vh;
      position: relative;
    }

    /* Animated smoke background effects */
    .smoke-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
    }

    .smoke-element {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(128,128,128,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
      filter: blur(40px);
      animation: float 20s infinite linear;
    }

    .smoke-element:nth-child(1) {
      width: 300px;
      height: 300px;
      top: 10%;
      left: 10%;
      animation-delay: 0s;
      animation-duration: 25s;
    }

    .smoke-element:nth-child(2) {
      width: 200px;
      height: 200px;
      top: 60%;
      right: 15%;
      animation-delay: -5s;
      animation-duration: 30s;
    }

    .smoke-element:nth-child(3) {
      width: 250px;
      height: 250px;
      bottom: 20%;
      left: 20%;
      animation-delay: -10s;
      animation-duration: 35s;
    }

    .smoke-element:nth-child(4) {
      width: 180px;
      height: 180px;
      top: 30%;
      right: 30%;
      animation-delay: -15s;
      animation-duration: 20s;
    }

    .smoke-element:nth-child(5) {
      width: 320px;
      height: 320px;
      bottom: 10%;
      right: 10%;
      animation-delay: -20s;
      animation-duration: 40s;
    }

    @keyframes float {
      0% {
        transform: translateY(0px) translateX(0px) rotate(0deg);
        opacity: 0.3;
      }
      25% {
        transform: translateY(-20px) translateX(10px) rotate(90deg);
        opacity: 0.6;
      }
      50% {
        transform: translateY(-40px) translateX(-10px) rotate(180deg);
        opacity: 0.4;
      }
      75% {
        transform: translateY(-20px) translateX(-20px) rotate(270deg);
        opacity: 0.7;
      }
      100% {
        transform: translateY(0px) translateX(0px) rotate(360deg);
        opacity: 0.3;
      }
    }

    .header {
      text-align: center;
      padding: 2rem 1rem;
      position: relative;
      z-index: 10;
    }

    .header h1 {
      font-size: clamp(2rem, 5vw, 4rem);
      font-weight: 900;
      background: linear-gradient(135deg, #ffffff, #cccccc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.5rem;
    }

    .header p {
      font-size: 1.1rem;
      color: #aaaaaa;
      margin-bottom: 1rem;
    }

    .branding {
      display: flex;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .brand-tag {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 0.3rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;
      color: #cccccc;
    }

    .gallery-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1rem 2rem;
      position: relative;
      z-index: 5;
    }

    .category-section {
      margin-bottom: 3rem;
    }

    .category-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 1.5rem;
      padding-left: 1rem;
      border-left: 4px solid rgba(255,255,255,0.5);
    }

    .masonry-grid {
      column-count: 1;
      column-gap: 1rem;
      column-fill: balance;
    }

    @media (min-width: 640px) {
      .masonry-grid { column-count: 2; }
    }

    @media (min-width: 768px) {
      .masonry-grid { column-count: 3; }
    }

    @media (min-width: 1024px) {
      .masonry-grid { column-count: 4; }
    }

    @media (min-width: 1280px) {
      .masonry-grid { column-count: 5; }
    }

    .glass-thumbnail {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 1rem;
      break-inside: avoid;
      transition: all 0.3s ease;
      cursor: grab;
      position: relative;
    }

    .glass-thumbnail:hover {
      transform: translateY(-5px);
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 10px 30px rgba(255, 255, 255, 0.1);
    }

    .glass-thumbnail:active {
      cursor: grabbing;
      transform: translateY(-2px) scale(0.98);
    }

    .thumbnail-image {
      width: 100%;
      height: auto;
      display: block;
      border-radius: 8px 8px 0 0;
    }

    .thumbnail-info {
      padding: 1rem;
    }

    .thumbnail-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 0.5rem;
      line-height: 1.2;
    }

    .thumbnail-description {
      font-size: 0.8rem;
      color: #aaaaaa;
      line-height: 1.3;
    }

    .drag-indicator {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .glass-thumbnail:hover .drag-indicator {
      opacity: 1;
    }

    .stats-bar {
      text-align: center;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin-top: 2rem;
    }

    .stats-bar p {
      color: #aaaaaa;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <!-- Animated smoke background -->
  <div class="smoke-container">
    <div class="smoke-element"></div>
    <div class="smoke-element"></div>
    <div class="smoke-element"></div>
    <div class="smoke-element"></div>
    <div class="smoke-element"></div>
  </div>

  <!-- Header -->
  <div class="header">
    <h1>ProjectAssets</h1>
    <p>Premium UI Components & Templates</p>
    <div class="branding">
      <span class="brand-tag">4site.pro</span>
      <span class="brand-tag">aegntic</span>
      <span class="brand-tag">{ae}</span>
      <span class="brand-tag">aegnt</span>
    </div>
  </div>

  <!-- Gallery Container -->
  <div class="gallery-container">
    ${generateGallerySection('Navigation & Layout Components', categories.navigation)}
    ${generateGallerySection('Interactive Elements', categories.interactive)}
    ${generateGallerySection('Content Display', categories.content)}
    ${generateGallerySection('Forms & Input', categories.forms)}
    ${generateGallerySection('Media & Visual', categories.media)}
    ${generateGallerySection('E-commerce', categories.ecommerce)}
    ${generateGallerySection('Data & Analytics', categories.data)}
    ${generateGallerySection('Advanced Layout', categories.advanced)}
  </div>

  <!-- Stats Bar -->
  <div class="stats-bar">
    <p>${exactMatches.length} Premium Components • 8 Categories • Drag & Drop Ready • Built for 4site.pro</p>
  </div>

  <script>
    // Drag and drop functionality
    document.querySelectorAll('.glass-thumbnail').forEach(thumbnail => {
      thumbnail.addEventListener('dragstart', (e) => {
        const assetName = e.target.dataset.asset;
        const assetData = {
          name: assetName,
          source: '4site.pro/assetsgal',
          type: 'ui-component'
        };
        
        e.dataTransfer.setData('text/plain', JSON.stringify(assetData));
        e.dataTransfer.setData('text/html', \`<div data-asset="\${assetName}" class="ui-component">\${assetName}</div>\`);
        e.dataTransfer.effectAllowed = 'copy';
        
        // Add dragging visual feedback
        e.target.style.opacity = '0.7';
      });
      
      thumbnail.addEventListener('dragend', (e) => {
        e.target.style.opacity = '1';
      });
    });

    // Console info for developers
    console.log('ProjectAssets Gallery loaded - ${exactMatches.length} components ready for drag & drop');
    console.log('Built with 4site.pro • aegntic • {ae} • aegnt');
  </script>
</body>
</html>`;

// Write the completely corrected gallery
fs.writeFileSync(path.join(__dirname, 'Masonry Image Gallery Layout.html'), galleryContent);
console.log('\n✅ Gallery completely rebuilt with CORRECT thumbnail mappings!');