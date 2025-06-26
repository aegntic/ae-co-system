# Aegntic.ai Brand Colors Reference

**The Neural-Themed Color Palette for the AI Revolution**

## 🎯 **Primary Brand Colors**

### **Aegntic Blue - The Intelligence Gradient**

| Shade | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| aegntic-50  | `#f0f7ff` | `240, 247, 255` | Lightest backgrounds, subtle highlights |
| aegntic-100 | `#e0f0fe` | `224, 240, 254` | Light backgrounds, hover states |
| aegntic-200 | `#bbe3fc` | `187, 227, 252` | Borders, dividers |
| aegntic-300 | `#7dcdf9` | `125, 205, 249` | Secondary text, icons |
| aegntic-400 | `#36b4f4` | `54, 180, 244` | Interactive elements, links |
| **aegntic-500** | `#0c9ae5` | `12, 154, 229` | **PRIMARY BRAND COLOR** |
| aegntic-600 | `#027bc4` | `2, 123, 196` | Buttons, primary actions |
| aegntic-700 | `#0361a0` | `3, 97, 160` | Pressed states, dark interactions |
| aegntic-800 | `#075284` | `7, 82, 132` | Deep blue text |
| aegntic-900 | `#0c446d` | `12, 68, 109` | Headers, emphasis |
| aegntic-950 | `#082b48` | `8, 43, 72` | Ultra dark, shadows |

### **Neural Background - The Deep Space Foundation**

| Shade | Hex Code | RGB | Usage |
|-------|----------|-----|-------|
| neural-50  | `#f8fafc` | `248, 250, 252` | Pure white (rare use) |
| neural-100 | `#f1f5f9` | `241, 245, 249` | **Primary text on dark** |
| neural-200 | `#e2e8f0` | `226, 232, 240` | Secondary text |
| neural-300 | `#cbd5e1` | `203, 213, 225` | **Secondary text hierarchy** |
| neural-400 | `#94a3b8` | `148, 163, 184` | Muted text, placeholders |
| neural-500 | `#64748b` | `100, 116, 139` | Placeholder text |
| neural-600 | `#475569` | `71, 85, 105` | Disabled elements |
| neural-700 | `#334155` | `51, 65, 85` | **Subtle borders** |
| neural-800 | `#1e293b` | `30, 41, 59` | **Card borders** |
| neural-900 | `#0f172a` | `15, 23, 42` | **Card backgrounds** |
| **neural-950** | `#020617` | `2, 6, 23` | **PRIMARY BACKGROUND** |

## 🚨 **Semantic Colors**

### **Success - Emerald Green**
| Shade | Hex Code | Usage |
|-------|----------|-------|
| success-400 | `#4ade80` | Success icons, positive indicators |
| success-500 | `#22c55e` | Success buttons, confirmations |
| success-600 | `#16a34a` | Success dark states |

### **Warning - Amber Yellow**
| Shade | Hex Code | Usage |
|-------|----------|-------|
| warning-400 | `#fbbf24` | Warning icons, caution indicators |
| warning-500 | `#f59e0b` | Warning buttons, alerts |
| warning-600 | `#d97706` | Warning dark states |

### **Error - Red Alert**
| Shade | Hex Code | Usage |
|-------|----------|-------|
| error-400 | `#f87171` | Error icons, danger indicators |
| error-500 | `#ef4444` | Error buttons, critical alerts |
| error-600 | `#dc2626` | Error dark states |

### **Info - Cyan Intelligence**
| Shade | Hex Code | Usage |
|-------|----------|-------|
| info-400 | `#22d3ee` | Info icons, helpful indicators |
| info-500 | `#06b6d4` | Info buttons, notifications |
| info-600 | `#0891b2` | Info dark states |

## 🎨 **Color Usage Guidelines**

### **Primary Color Application**
```css
/* Brand Identity */
.logo-primary { color: #0c9ae5; } /* aegntic-500 */
.logo-dark-bg { color: #36b4f4; } /* aegntic-400 */

/* Interactive Elements */
.button-primary { background: linear-gradient(135deg, #0c9ae5, #027bc4); }
.link-primary { color: #36b4f4; }
.focus-ring { border-color: #0c9ae5; box-shadow: 0 0 0 3px rgba(12, 154, 229, 0.1); }
```

### **Background Hierarchy**
```css
/* Page Structure */
.page-background { background: #020617; } /* neural-950 */
.card-background { background: #0f172a; } /* neural-900 */
.elevated-background { background: #1e293b; } /* neural-800 */

/* Interactive Backgrounds */
.hover-background { background: #334155; } /* neural-700 */
.active-background { background: #475569; } /* neural-600 */
```

### **Text Hierarchy**
```css
/* Text Colors */
.text-primary { color: #f1f5f9; } /* neural-100 */
.text-secondary { color: #cbd5e1; } /* neural-300 */
.text-muted { color: #94a3b8; } /* neural-400 */
.text-disabled { color: #64748b; } /* neural-500 */

/* Brand Text */
.text-brand { 
  background: linear-gradient(135deg, #36b4f4, #0c9ae5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## 📐 **Design Tokens**

### **CSS Custom Properties**
```css
:root {
  /* Primary Brand */
  --brand-primary: #0c9ae5;
  --brand-secondary: #36b4f4;
  
  /* Backgrounds */
  --bg-primary: #020617;
  --bg-secondary: #0f172a;
  --bg-tertiary: #1e293b;
  
  /* Text */
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-muted: #94a3b8;
  
  /* Borders */
  --border-primary: #334155;
  --border-focus: #0c9ae5;
  
  /* Status */
  --status-success: #22c55e;
  --status-warning: #f59e0b;
  --status-error: #ef4444;
  --status-info: #06b6d4;
}
```

### **Figma/Design Tool Variables**
```
Brand/Primary: #0c9ae5
Brand/Secondary: #36b4f4

Background/Primary: #020617
Background/Secondary: #0f172a
Background/Tertiary: #1e293b

Text/Primary: #f1f5f9
Text/Secondary: #cbd5e1
Text/Muted: #94a3b8

Border/Default: #334155
Border/Focus: #0c9ae5

Status/Success: #22c55e
Status/Warning: #f59e0b
Status/Error: #ef4444
Status/Info: #06b6d4
```

## 🎭 **Theme Variations**

### **Dark Theme (Primary)**
```css
.theme-dark {
  --bg-primary: var(--neural-950);
  --bg-secondary: var(--neural-900);
  --text-primary: var(--neural-100);
  --text-secondary: var(--neural-300);
}
```

### **Light Theme (Optional)**
```css
.theme-light {
  --bg-primary: #ffffff;
  --bg-secondary: var(--neural-50);
  --text-primary: var(--neural-900);
  --text-secondary: var(--neural-700);
}
```

### **High Contrast (Accessibility)**
```css
.theme-high-contrast {
  --bg-primary: #000000;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --text-secondary: #e6e6e6;
  --border-primary: #666666;
}
```

## 🌈 **Gradient Combinations**

### **Primary Brand Gradients**
```css
/* Neural Intelligence Gradient */
.gradient-primary {
  background: linear-gradient(135deg, #0c9ae5 0%, #027bc4 100%);
}

/* Bright Accent Gradient */
.gradient-accent {
  background: linear-gradient(135deg, #36b4f4 0%, #0c9ae5 100%);
}

/* Deep Neural Gradient */
.gradient-background {
  background: linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%);
}
```

### **Status Gradients**
```css
.gradient-success {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.gradient-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.gradient-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}
```

## 🔍 **Accessibility Guidelines**

### **Contrast Ratios (WCAG AA)**
| Combination | Ratio | Status |
|-------------|-------|--------|
| neural-100 on neural-950 | 19.1:1 | ✅ AAA |
| neural-300 on neural-950 | 11.2:1 | ✅ AAA |
| neural-400 on neural-950 | 6.8:1 | ✅ AA |
| aegntic-400 on neural-950 | 8.9:1 | ✅ AAA |
| aegntic-500 on neural-950 | 6.2:1 | ✅ AA |

### **Color Blind Friendly**
- Primary blue palette works well for all types of color blindness
- Status colors use sufficient brightness differences
- Never rely on color alone - always include icons or text

### **Focus Indicators**
```css
.focus-visible {
  outline: 2px solid var(--aegntic-400);
  outline-offset: 2px;
}
```

## 🚀 **Implementation Examples**

### **Component Color Usage**
```html
<!-- Primary Button -->
<button class="bg-gradient-to-r from-aegntic-500 to-aegntic-600 text-white">
  Primary Action
</button>

<!-- Secondary Button -->
<button class="bg-neural-800 border border-neural-700 text-neural-100">
  Secondary Action
</button>

<!-- Status Indicator -->
<div class="flex items-center">
  <div class="w-3 h-3 bg-success-400 rounded-full mr-2"></div>
  <span class="text-neural-200">System Online</span>
</div>

<!-- Brand Header -->
<h1 class="text-4xl font-bold bg-gradient-to-r from-aegntic-400 to-aegntic-600 bg-clip-text text-transparent">
  Aegntic.ai
</h1>
```

### **Brand Guidelines**
- **Primary Brand Color**: Always use `aegntic-500` (#0c9ae5) for logos
- **Interactive Elements**: Use `aegntic-600` for buttons and CTAs
- **Text Links**: Use `aegntic-400` for better contrast on dark backgrounds
- **Status Indicators**: Use semantic colors with appropriate icons
- **Backgrounds**: Default to `neural-950` with `neural-900` cards

## 🎨 **Color Psychology**

### **Neural Blue (Aegntic)**
- **Intelligence**: Represents AI and machine learning
- **Trust**: Professional and reliable technology
- **Innovation**: Cutting-edge and forward-thinking
- **Depth**: Deep understanding and analysis

### **Deep Space (Neural)**
- **Sophistication**: Premium and professional
- **Focus**: Minimizes distractions
- **Mystery**: Advanced technology and AI
- **Elegance**: Clean and modern aesthetic

---

## 🌟 **The Aegntic.ai Color Revolution**

**This neural-themed color palette creates a distinctive and memorable brand identity that immediately communicates intelligence, innovation, and technological excellence.**

**Every shade has been carefully selected to:**
- ✅ **Enhance readability** with optimal contrast ratios
- ✅ **Support accessibility** for all users
- ✅ **Reinforce brand identity** across all touchpoints
- ✅ **Create visual hierarchy** that guides user attention
- ✅ **Evoke emotional connection** with AI and intelligence themes

**"How we do anything is how we do everything."** - These colors now define the visual DNA of the entire Aegntic.ai ecosystem! 🚀