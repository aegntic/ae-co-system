(function() {
  'use strict';
  
  // Widget configuration
  const WIDGET_VERSION = '1.0.0';
  const CDN_BASE = 'https://cdn.4site.pro';
  const API_BASE = 'https://api.4site.pro';
  
  // Load widget styles
  function loadStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${CDN_BASE}/widget/widget.css?v=${WIDGET_VERSION}`;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
  
  // Load widget script
  function loadScript() {
    const script = document.createElement('script');
    script.src = `${CDN_BASE}/widget/widget.js?v=${WIDGET_VERSION}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = initializeWidget;
    document.body.appendChild(script);
  }
  
  // Initialize widget
  function initializeWidget() {
    if (window.FourSiteWidget) {
      const config = window.fourSiteConfig || {};
      window.FourSiteWidget.init({
        apiKey: config.apiKey,
        siteId: config.siteId,
        position: config.position || 'bottom-right',
        theme: config.theme || 'dark',
        apiBase: API_BASE,
        ...config
      });
    }
  }
  
  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      loadStyles();
      loadScript();
    });
  } else {
    loadStyles();
    loadScript();
  }
})();

// Usage:
// <script>
//   window.fourSiteConfig = {
//     apiKey: 'your-api-key',
//     siteId: 'your-site-id'
//   };
// </script>
// <script src="https://cdn.4site.pro/widget/widget-loader.js"></script>