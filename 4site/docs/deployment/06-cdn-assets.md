# Prompt 06: CDN and Static Assets Setup

## Objective
Configure CDN for optimal asset delivery, including images, fonts, and the lead capture widget.

## CDN Provider
Cloudflare (free tier includes CDN, DDoS protection, and SSL)

## Implementation

### 1. Static Assets Organization

Create asset structure:

```bash
public/
├── assets/
│   ├── images/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   ├── og-image.png (1200x630)
│   │   ├── favicon.ico
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── fonts/
│   │   ├── inter-var.woff2
│   │   └── jetbrains-mono.woff2
│   └── videos/
│       └── hero-demo.mp4
├── widget/
│   ├── widget.js (minified)
│   ├── widget.css (minified)
│   └── widget-loader.js
└── robots.txt
```

### 2. Lead Capture Widget CDN Distribution

Create `public/widget/widget-loader.js`:

```javascript
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
```

### 3. Widget Implementation

Create `src/widget/widget.ts`:

```typescript
interface WidgetConfig {
  apiKey: string;
  siteId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark';
  apiBase?: string;
  fields?: string[];
  customStyles?: Record<string, string>;
  onSuccess?: (lead: any) => void;
  onError?: (error: Error) => void;
}

class FourSiteWidget {
  private config: WidgetConfig;
  private container: HTMLElement | null = null;
  private isOpen: boolean = false;
  
  constructor() {
    this.handleMessage = this.handleMessage.bind(this);
    this.handleEscape = this.handleEscape.bind(this);
  }
  
  init(config: WidgetConfig) {
    this.config = config;
    this.validateConfig();
    this.createWidget();
    this.attachEventListeners();
    this.trackPageView();
  }
  
  private validateConfig() {
    if (!this.config.apiKey) {
      throw new Error('4site.pro: API key is required');
    }
    if (!this.config.siteId) {
      throw new Error('4site.pro: Site ID is required');
    }
  }
  
  private createWidget() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'foursite-widget-container';
    this.container.className = `foursite-widget foursite-${this.config.position || 'bottom-right'} foursite-${this.config.theme || 'dark'}`;
    
    // Create HTML
    this.container.innerHTML = `
      <button class="foursite-trigger" aria-label="Open contact form">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="currentColor"/>
        </svg>
        <span class="foursite-badge">Get in Touch</span>
      </button>
      
      <div class="foursite-modal" role="dialog" aria-hidden="true">
        <div class="foursite-modal-content">
          <button class="foursite-close" aria-label="Close form">&times;</button>
          <h3 class="foursite-title">Let's Connect</h3>
          <p class="foursite-subtitle">Drop us a message and we'll get back to you soon!</p>
          
          <form class="foursite-form" id="foursite-lead-form">
            ${this.renderFields()}
            <button type="submit" class="foursite-submit">
              <span class="foursite-submit-text">Send Message</span>
              <span class="foursite-submit-loading" style="display: none;">Sending...</span>
            </button>
          </form>
          
          <div class="foursite-success" style="display: none;">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="24" fill="#10B981" fill-opacity="0.1"/>
              <path d="M20 24L23 27L28 22" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <p>Thanks! We'll be in touch soon.</p>
          </div>
          
          <div class="foursite-error" style="display: none;">
            <p>Oops! Something went wrong. Please try again.</p>
          </div>
        </div>
      </div>
    `;
    
    // Add to page
    document.body.appendChild(this.container);
  }
  
  private renderFields(): string {
    const defaultFields = ['name', 'email', 'company', 'message'];
    const fields = this.config.fields || defaultFields;
    
    return fields.map(field => {
      switch (field) {
        case 'name':
          return `
            <div class="foursite-field">
              <input type="text" name="name" placeholder="Your Name" required />
            </div>
          `;
        case 'email':
          return `
            <div class="foursite-field">
              <input type="email" name="email" placeholder="Email Address" required />
            </div>
          `;
        case 'company':
          return `
            <div class="foursite-field">
              <input type="text" name="company" placeholder="Company (Optional)" />
            </div>
          `;
        case 'phone':
          return `
            <div class="foursite-field">
              <input type="tel" name="phone" placeholder="Phone Number (Optional)" />
            </div>
          `;
        case 'message':
          return `
            <div class="foursite-field">
              <textarea name="message" placeholder="Your Message" rows="4"></textarea>
            </div>
          `;
        default:
          return '';
      }
    }).join('');
  }
  
  private attachEventListeners() {
    // Toggle widget
    const trigger = this.container?.querySelector('.foursite-trigger');
    trigger?.addEventListener('click', () => this.toggle());
    
    // Close button
    const closeBtn = this.container?.querySelector('.foursite-close');
    closeBtn?.addEventListener('click', () => this.close());
    
    // Form submission
    const form = this.container?.querySelector('#foursite-lead-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Escape key
    document.addEventListener('keydown', this.handleEscape);
    
    // Click outside
    const modal = this.container?.querySelector('.foursite-modal');
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });
  }
  
  private async handleSubmit(e: Event) {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Show loading
    this.setLoading(true);
    
    try {
      const response = await fetch(`${this.config.apiBase}/api/widget/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          siteId: this.config.siteId,
          ...data,
          source: window.location.href,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) throw new Error('Failed to submit');
      
      const result = await response.json();
      
      // Show success
      this.showSuccess();
      
      // Callback
      if (this.config.onSuccess) {
        this.config.onSuccess(result);
      }
      
      // Track conversion
      this.trackEvent('lead_captured');
      
      // Reset form
      form.reset();
      
      // Close after delay
      setTimeout(() => this.close(), 3000);
      
    } catch (error) {
      this.showError();
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
    } finally {
      this.setLoading(false);
    }
  }
  
  private trackPageView() {
    this.trackEvent('page_view', {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title
    });
  }
  
  private trackEvent(eventType: string, metadata: any = {}) {
    // Fire and forget analytics
    fetch(`${this.config.apiBase}/api/widget/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
      body: JSON.stringify({
        siteId: this.config.siteId,
        eventType,
        metadata,
        timestamp: new Date().toISOString()
      })
    }).catch(() => {
      // Silently fail analytics
    });
  }
  
  toggle() {
    this.isOpen ? this.close() : this.open();
  }
  
  open() {
    this.isOpen = true;
    this.container?.classList.add('foursite-open');
    const modal = this.container?.querySelector('.foursite-modal');
    modal?.setAttribute('aria-hidden', 'false');
    this.trackEvent('widget_opened');
  }
  
  close() {
    this.isOpen = false;
    this.container?.classList.remove('foursite-open');
    const modal = this.container?.querySelector('.foursite-modal');
    modal?.setAttribute('aria-hidden', 'true');
  }
  
  private setLoading(loading: boolean) {
    const submitText = this.container?.querySelector('.foursite-submit-text') as HTMLElement;
    const submitLoading = this.container?.querySelector('.foursite-submit-loading') as HTMLElement;
    const submitBtn = this.container?.querySelector('.foursite-submit') as HTMLButtonElement;
    
    if (loading) {
      submitText.style.display = 'none';
      submitLoading.style.display = 'inline';
      submitBtn.disabled = true;
    } else {
      submitText.style.display = 'inline';
      submitLoading.style.display = 'none';
      submitBtn.disabled = false;
    }
  }
  
  private showSuccess() {
    const form = this.container?.querySelector('.foursite-form') as HTMLElement;
    const success = this.container?.querySelector('.foursite-success') as HTMLElement;
    form.style.display = 'none';
    success.style.display = 'block';
  }
  
  private showError() {
    const error = this.container?.querySelector('.foursite-error') as HTMLElement;
    error.style.display = 'block';
    setTimeout(() => {
      error.style.display = 'none';
    }, 5000);
  }
  
  private handleEscape(e: KeyboardEvent) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }
  
  private handleMessage(e: MessageEvent) {
    if (e.data.type === 'foursite:resize') {
      // Handle iframe resize if needed
    }
  }
  
  destroy() {
    document.removeEventListener('keydown', this.handleEscape);
    this.container?.remove();
  }
}

// Export for global use
(window as any).FourSiteWidget = new FourSiteWidget();
```

### 4. Widget Styles

Create `src/widget/widget.css`:

```css
/* 4site.pro Lead Capture Widget */
.foursite-widget {
  --foursite-primary: #8B5CF6;
  --foursite-primary-dark: #7C3AED;
  --foursite-bg: #FFFFFF;
  --foursite-text: #1F2937;
  --foursite-border: #E5E7EB;
  --foursite-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  position: fixed;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Dark theme */
.foursite-widget.foursite-dark {
  --foursite-bg: #1F2937;
  --foursite-text: #F9FAFB;
  --foursite-border: #374151;
}

/* Positioning */
.foursite-widget.foursite-bottom-right {
  bottom: 20px;
  right: 20px;
}

.foursite-widget.foursite-bottom-left {
  bottom: 20px;
  left: 20px;
}

/* Trigger button */
.foursite-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--foursite-primary);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: var(--foursite-shadow);
  transition: all 0.3s ease;
}

.foursite-trigger:hover {
  background: var(--foursite-primary-dark);
  transform: translateY(-2px);
}

.foursite-badge {
  font-weight: 500;
  font-size: 14px;
}

/* Modal */
.foursite-modal {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.foursite-open .foursite-modal {
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
}

.foursite-modal-content {
  background: var(--foursite-bg);
  color: var(--foursite-text);
  border-radius: 16px;
  padding: 32px;
  width: 90%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--foursite-shadow);
  transform: translateY(20px);
  transition: transform 0.3s ease;
}

.foursite-open .foursite-modal-content {
  transform: translateY(0);
}

/* Form styles */
.foursite-form {
  margin-top: 24px;
}

.foursite-field {
  margin-bottom: 16px;
}

.foursite-field input,
.foursite-field textarea {
  width: 100%;
  padding: 12px 16px;
  background: var(--foursite-bg);
  color: var(--foursite-text);
  border: 1px solid var(--foursite-border);
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.foursite-field input:focus,
.foursite-field textarea:focus {
  outline: none;
  border-color: var(--foursite-primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

/* Submit button */
.foursite-submit {
  width: 100%;
  padding: 12px 24px;
  background: var(--foursite-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.foursite-submit:hover:not(:disabled) {
  background: var(--foursite-primary-dark);
}

.foursite-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Success state */
.foursite-success {
  text-align: center;
  padding: 40px 0;
}

.foursite-success svg {
  margin: 0 auto 16px;
}

/* Animations */
@keyframes foursite-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.foursite-trigger:hover svg {
  animation: foursite-pulse 2s infinite;
}

/* Mobile responsive */
@media (max-width: 640px) {
  .foursite-modal-content {
    width: 95%;
    padding: 24px;
  }
  
  .foursite-badge {
    display: none;
  }
}
```

### 5. Cloudflare Configuration

Create `scripts/setup-cloudflare.js`:

```javascript
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_ZONE_ID = process.env.CF_ZONE_ID;
const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;

async function setupCloudflare() {
  // 1. Create Page Rules
  const pageRules = [
    {
      targets: [{ target: 'url', constraint: { operator: 'matches', value: '*.4site.pro/widget/*' }}],
      actions: [
        { id: 'cache_level', value: 'cache_everything' },
        { id: 'edge_cache_ttl', value: 2678400 }, // 31 days
        { id: 'browser_cache_ttl', value: 2678400 },
        { id: 'always_use_https', value: 'on' }
      ],
      priority: 1,
      status: 'active'
    },
    {
      targets: [{ target: 'url', constraint: { operator: 'matches', value: '*.4site.pro/assets/*' }}],
      actions: [
        { id: 'cache_level', value: 'cache_everything' },
        { id: 'edge_cache_ttl', value: 2678400 },
        { id: 'browser_cache_ttl', value: 2678400 }
      ],
      priority: 2,
      status: 'active'
    }
  ];
  
  // 2. Configure Transform Rules for widget embedding
  const transformRules = {
    name: 'Widget CORS Headers',
    phase: 'http_response_headers_transform',
    rules: [
      {
        expression: '(http.request.uri.path matches "^/widget/")',
        action: 'set_headers',
        action_parameters: {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Cache-Control': 'public, max-age=2678400',
            'X-Content-Type-Options': 'nosniff'
          }
        }
      }
    ]
  };
  
  // 3. Set up Cloudflare Workers for edge processing
  const workerScript = `
    addEventListener('fetch', event => {
      event.respondWith(handleRequest(event.request))
    })
    
    async function handleRequest(request) {
      const url = new URL(request.url)
      
      // Widget analytics edge processing
      if (url.pathname === '/api/widget/analytics') {
        // Process at edge for lower latency
        const data = await request.json()
        
        // Send to analytics queue
        await ANALYTICS_QUEUE.send({
          ...data,
          edgeLocation: request.cf.colo,
          country: request.cf.country
        })
        
        return new Response('OK', { status: 202 })
      }
      
      // Pass through to origin
      return fetch(request)
    }
  `;
  
  // Apply configurations via API
  console.log('Setting up Cloudflare CDN...');
}

setupCloudflare();
```

### 6. Image Optimization

Create `scripts/optimize-images.js`:

```javascript
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
```

## Expected Output Files
- `widget-loader.js` - Widget loader script
- `widget-bundle.js` - Compiled widget code
- `widget-styles.css` - Widget styles
- `cloudflare-config.js` - CDN configuration
- `image-optimizer.js` - Image optimization script

## Dependencies
- Requires: 04-frontend-deploy.md (deployment URL)
- Requires: 05-backend-deploy.md (API endpoints)

## Performance Metrics
- Widget load time: < 100ms
- Widget size: < 30KB (gzipped)
- Image loading: Progressive with WebP/AVIF
- Cache hit ratio: > 95%

## Widget Distribution
```html
<!-- For users to embed -->
<script>
  window.fourSiteConfig = {
    apiKey: 'pk_live_xxxxx',
    siteId: 'site_xxxxx'
  };
</script>
<script src="https://cdn.4site.pro/widget/widget-loader.js" async></script>
```

## Next Steps
- Configure DNS (Prompt 07)
- Set up GitHub OAuth (Prompt 08)