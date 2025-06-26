const fs = require('fs');
const path = require('path');

// Get list of actual thumbnail files
const thumbnailsDir = path.join(__dirname, 'thumbnails');
const actualThumbnails = fs.readdirSync(thumbnailsDir)
  .filter(file => file.endsWith('.png'))
  .map(file => file.replace('.png', ''));

console.log(`Found ${actualThumbnails.length} actual thumbnails`);

// Read the gallery HTML
const galleryPath = path.join(__dirname, 'Masonry Image Gallery Layout.html');
let galleryContent = fs.readFileSync(galleryPath, 'utf8');

// Create a mapping of key components to actual thumbnails
const componentMapping = {
  // Navigation & Layout
  'navigation-sidebar': 'Sidebar Navigation with Animated Grid',
  'hero-section': 'Hero Section with Background Video', 
  'breadcrumb-navigation': 'Breadcrumb Navigation',
  'sticky-header': 'Sticky Header on Scroll',
  'mega-menu': 'Mega Menu Layout',
  'footer-design': 'Footer with Social Links',
  
  // Interactive Elements  
  'modal-dialog': 'Modal Dialog Box',
  'tooltip-system': 'Tooltip and Popover',
  'accordion-menu': 'Accordion Menu',
  'dropdown-menu': 'Dropdown Menu',
  'tabs-interface': 'Tabbed Interface',
  'slider-carousel': 'Image Slider',
  'pagination': 'Pagination',
  
  // Content Display
  'card-layout': 'Card Layout',
  'timeline-display': 'Timeline Display', 
  'testimonial-section': 'Testimonial Section',
  'pricing-table': 'Pricing Table',
  'blog-grid': 'Blog Post Grid',
  'portfolio-gallery': 'Portfolio Gallery',
  'news-feed': 'News Feed Layout',
  
  // Forms & Input
  'contact-form': 'Contact Form',
  'login-form': 'Login Form',
  'registration-form': 'Registration Form',
  'search-bar': 'Search Bar with Autocomplete',
  'filter-options': 'Filter and Sort Options',
  'multi-step-form': 'Multi-step Form',
  
  // Media & Visual
  'image-gallery': 'Image Gallery with Lightbox',
  'video-player': 'Video Player',
  'masonry-gallery': 'Masonry Image Gallery Layout',
  'parallax-section': 'Parallax Scrolling Section',
  'image-upload': 'Image Upload with Preview',
  'audio-player': 'Audio Player',
  
  // E-commerce
  'product-card': 'Product Card',
  'shopping-cart': 'Shopping Cart Sidebar',
  'product-gallery': 'Product Image Gallery',
  'wishlist': 'Wishlist',
  'checkout-form': 'Checkout Form',
  
  // Data & Analytics
  'dashboard': 'Dashboard Layout',
  'data-table': 'Data Table',
  'charts-graphs': 'Charts and Graphs',
  'progress-bars': 'Progress Bars',
  'stats-cards': 'Statistics Cards',
  'calendar-widget': 'Calendar Widget',
  
  // Advanced Layout
  '3d-perspective-grid': '3D Perspective Grid with Flip Cards',
  'split-screen': 'Split Screen Layout',
  'full-screen-menu': 'Full Screen Menu',
  'magazine-layout': 'Magazine Style Layout',
  'infinite-scroll': 'Infinite Scroll',
  'grid-system': 'Grid System'
};

// Fix thumbnail paths
Object.entries(componentMapping).forEach(([key, expectedName]) => {
  // Find matching actual thumbnail
  const matchingThumbnail = actualThumbnails.find(thumb => 
    thumb.toLowerCase().includes(expectedName.toLowerCase().replace(/[^a-z0-9\s]/gi, '').split(' ')[0]) ||
    expectedName.toLowerCase().includes(thumb.toLowerCase().replace(/[^a-z0-9\s]/gi, '').split(' ')[0])
  );
  
  if (matchingThumbnail) {
    // Replace absolute paths with relative paths
    const oldPath = new RegExp(`src="[^"]*${expectedName}[^"]*"`, 'g');
    const newPath = `src="thumbnails/${matchingThumbnail}.png"`;
    
    const oldAbsolutePath = new RegExp(`src="/home/tabs/ae-co-system/ae4sitepro-assets/thumbnails/${expectedName}[^"]*"`, 'g');
    
    galleryContent = galleryContent.replace(oldPath, newPath);
    galleryContent = galleryContent.replace(oldAbsolutePath, newPath);
    
    console.log(`Mapped ${key}: ${expectedName} -> ${matchingThumbnail}`);
  } else {
    console.log(`❌ No thumbnail found for: ${expectedName}`);
  }
});

// Write the fixed gallery
fs.writeFileSync(galleryPath, galleryContent);
console.log('\n✅ Gallery thumbnail paths fixed!');