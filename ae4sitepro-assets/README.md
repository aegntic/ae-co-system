# AE4SitePro Assets Gallery

A collection of premium UI components and templates with thumbnail preview and drag-and-drop functionality.

## Features

- **61 Premium UI Assets** - Modern, interactive components
- **Thumbnail Gallery** - Visual preview of all components
- **Drag & Drop** - Easy integration into projects
- **Search & Filter** - Find assets by name or category
- **Live Preview** - Open assets directly in browser

## Quick Start

### View Gallery
```bash
# Option 1: Python HTTP server
python -m http.server 8000
# Then open: http://localhost:8000/gallery/

# Option 2: Node.js serve
npx serve .
# Then open: http://localhost:3000/gallery/

# Option 3: Bun (fastest)
bun run gallery
```

### Generate New Thumbnails
```bash
# Install dependencies
bun install

# Generate all thumbnails
bun run thumbnails

# Generate only missing thumbnails
node generate-remaining.js
```

## Asset Categories

- **Login** - Sign-in interfaces, registration forms
- **Dashboard** - Admin panels, management interfaces  
- **Hero** - Landing pages, portfolio sections
- **Cards** - Profile cards, testimonials, stats
- **Animation** - WebGL shaders, CSS animations, effects
- **Forms** - Input forms, onboarding flows
- **Navigation** - Sidebars, menus, navigation
- **Background** - Animated backgrounds, gradients

## Usage

1. **Browse**: Open the gallery to view all assets
2. **Search**: Use the search bar to find specific components
3. **Preview**: Click the eye icon to see full-size preview
4. **Drag**: Drag thumbnail images into your IDE or project
5. **Copy**: Use "Copy Path" to get the file location

## Technical Details

- **HTML5** with modern CSS3 and JavaScript
- **TailwindCSS** for styling
- **WebGL** shaders for advanced effects
- **Glassmorphism** design patterns
- **Responsive** design for all screen sizes

## Integration

These assets can be:
- Copied directly into projects
- Converted to React/Vue/Angular components
- Used as design system references
- Adapted for production applications