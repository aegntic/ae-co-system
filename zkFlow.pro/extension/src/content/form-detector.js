// Form detection utilities
const FormDetector = {
  // Common patterns for form field detection
  patterns: {
    username: /user|email|login|account|id|handle/i,
    password: /pass|pwd|secret/i,
    email: /email|e-mail|mail/i,
    phone: /phone|mobile|cell|tel/i,
    name: /name|firstname|lastname|fullname/i,
    address: /address|street|city|state|zip|postal/i,
    card: /card|credit|debit|payment/i,
    date: /date|birth|dob|expire/i,
    submit: /submit|login|signin|signup|register|continue|next/i,
    checkbox: /remember|agree|terms|subscribe/i
  },

  // Detect form elements on the page
  detectForms() {
    const forms = [];
    
    // Find all forms
    document.querySelectorAll('form').forEach(form => {
      const formData = this.analyzeForm(form);
      if (formData.fields.length > 0) {
        forms.push(formData);
      }
    });
    
    // Also look for form-like structures without form tags
    const standaloneFields = this.findStandaloneFields();
    if (standaloneFields.length > 0) {
      forms.push({
        id: 'standalone-fields',
        fields: standaloneFields,
        submitButtons: this.findSubmitButtons()
      });
    }
    
    return forms;
  },

  // Analyze a form element
  analyzeForm(form) {
    const fields = [];
    const submitButtons = [];
    
    // Find all input fields
    form.querySelectorAll('input, select, textarea').forEach(field => {
      if (this.isRelevantField(field)) {
        fields.push(this.getFieldInfo(field));
      }
    });
    
    // Find submit buttons
    form.querySelectorAll('button, input[type="submit"], input[type="button"]').forEach(button => {
      if (this.isSubmitButton(button)) {
        submitButtons.push(this.getButtonInfo(button));
      }
    });
    
    return {
      id: form.id || form.name || this.generateId(form),
      action: form.action,
      method: form.method,
      fields,
      submitButtons
    };
  },

  // Check if field is relevant for form filling
  isRelevantField(field) {
    const type = field.type?.toLowerCase();
    const hidden = field.type === 'hidden' || field.style.display === 'none';
    const readonly = field.readOnly || field.disabled;
    
    return !hidden && !readonly && type !== 'submit' && type !== 'button';
  },

  // Get field information
  getFieldInfo(field) {
    const info = {
      element: field,
      tagName: field.tagName.toLowerCase(),
      type: field.type || 'text',
      name: field.name,
      id: field.id,
      placeholder: field.placeholder,
      label: this.findLabel(field),
      value: field.value,
      required: field.required,
      pattern: field.pattern,
      fieldType: this.detectFieldType(field),
      selector: this.getSelector(field)
    };
    
    // Additional info for specific field types
    if (field.tagName === 'SELECT') {
      info.options = Array.from(field.options).map(opt => ({
        value: opt.value,
        text: opt.text
      }));
    }
    
    if (field.type === 'checkbox' || field.type === 'radio') {
      info.checked = field.checked;
    }
    
    return info;
  },

  // Detect the semantic type of the field
  detectFieldType(field) {
    // Check type attribute
    if (field.type === 'email') return 'email';
    if (field.type === 'password') return 'password';
    if (field.type === 'tel') return 'phone';
    if (field.type === 'date') return 'date';
    
    // Check patterns in various attributes
    const checkString = [
      field.name,
      field.id,
      field.placeholder,
      field.className,
      this.findLabel(field)
    ].join(' ').toLowerCase();
    
    for (const [type, pattern] of Object.entries(this.patterns)) {
      if (pattern.test(checkString)) {
        return type;
      }
    }
    
    return 'text';
  },

  // Find label for a field
  findLabel(field) {
    // Check for label with for attribute
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return label.textContent.trim();
    }
    
    // Check if field is inside a label
    const parentLabel = field.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.trim();
    }
    
    // Check for adjacent label
    const prev = field.previousElementSibling;
    if (prev && prev.tagName === 'LABEL') {
      return prev.textContent.trim();
    }
    
    // Check for aria-label
    if (field.getAttribute('aria-label')) {
      return field.getAttribute('aria-label');
    }
    
    return '';
  },

  // Check if element is a submit button
  isSubmitButton(button) {
    const text = button.textContent?.toLowerCase() || '';
    const type = button.type?.toLowerCase();
    
    if (type === 'submit') return true;
    
    return this.patterns.submit.test(text) ||
           this.patterns.submit.test(button.value || '') ||
           this.patterns.submit.test(button.className || '');
  },

  // Get button information
  getButtonInfo(button) {
    return {
      element: button,
      text: button.textContent?.trim() || button.value,
      type: button.type,
      selector: this.getSelector(button)
    };
  },

  // Find standalone form fields
  findStandaloneFields() {
    const fields = [];
    const processedElements = new Set();
    
    document.querySelectorAll('input, select, textarea').forEach(field => {
      // Skip if already in a form or processed
      if (field.form || processedElements.has(field)) return;
      
      if (this.isRelevantField(field)) {
        fields.push(this.getFieldInfo(field));
        processedElements.add(field);
      }
    });
    
    return fields;
  },

  // Find submit buttons not in forms
  findSubmitButtons() {
    const buttons = [];
    
    document.querySelectorAll('button, a').forEach(element => {
      if (!element.form && this.isSubmitButton(element)) {
        buttons.push(this.getButtonInfo(element));
      }
    });
    
    return buttons;
  },

  // Generate unique selector for an element
  getSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    const path = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();
      
      if (current.className) {
        const classes = Array.from(current.classList)
          .filter(c => !c.includes(':'))
          .slice(0, 2);
        if (classes.length) {
          selector += '.' + classes.join('.');
        }
      }
      
      const siblings = Array.from(current.parentNode?.children || []);
      const index = siblings.indexOf(current);
      
      if (siblings.length > 1) {
        selector += `:nth-child(${index + 1})`;
      }
      
      path.unshift(selector);
      
      if (current.id || path.length > 3) break;
      
      current = current.parentNode;
    }
    
    return path.join(' > ');
  },

  // Generate ID for elements without one
  generateId(element) {
    return 'zkflow-' + Math.random().toString(36).substr(2, 9);
  },

  // Monitor for dynamic form changes
  observeForms(callback) {
    const observer = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          const hasFormElements = Array.from(mutation.addedNodes).some(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return false;
            return node.matches('form, input, select, textarea, button') ||
                   node.querySelector('form, input, select, textarea, button');
          });
          
          if (hasFormElements) shouldUpdate = true;
        }
      });
      
      if (shouldUpdate) {
        callback();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return observer;
  }
};

// Export for use in other content scripts
window.FormDetector = FormDetector;