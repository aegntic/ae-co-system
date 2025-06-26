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