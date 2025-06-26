#!/usr/bin/env node

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create preview images for each template
const templates = [
  {
    name: 'liquid-metal-preview.png',
    gradient: ['#1a1a2e', '#16213e', '#0f3460'],
    title: 'LIQUID METAL',
    subtitle: 'COMMERCE',
    features: 'WebGL • AR • AI',
    color: '#00ffff'
  },
  {
    name: 'motion-system-preview.png',
    gradient: ['#667eea', '#764ba2'],
    title: 'MOTION',
    subtitle: 'DESIGN SYSTEM',
    features: '200+ Animations',
    color: '#ffffff'
  },
  {
    name: 'quantum-interface-preview.png',
    gradient: ['#000000', '#1a0033', '#330066'],
    title: 'QUANTUM',
    subtitle: 'INTERFACE PRO',
    features: 'Particles • Shaders',
    color: '#00ffff'
  },
  {
    name: 'dimensional-preview.png',
    gradient: ['#0f0f1e', '#1a1a3e', '#3a86ff'],
    title: 'DIMENSIONAL',
    subtitle: 'DASHBOARD',
    features: '4D Visualization',
    color: '#ffffff'
  }
];

const outputDir = path.join(__dirname, 'templates');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

templates.forEach(template => {
  const canvas = createCanvas(1200, 675);
  const ctx = canvas.getContext('2d');
  
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, 1200, 675);
  template.gradient.forEach((color, i) => {
    gradient.addColorStop(i / (template.gradient.length - 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 675);
  
  // Add grid pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 1200; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 675);
    ctx.stroke();
  }
  for (let y = 0; y < 675; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1200, y);
    ctx.stroke();
  }
  
  // Add title
  ctx.fillStyle = template.color;
  ctx.font = 'bold 96px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = template.color;
  ctx.shadowBlur = 20;
  ctx.fillText(template.title, 600, 280);
  
  // Add subtitle
  ctx.font = 'bold 48px Arial';
  ctx.shadowBlur = 10;
  ctx.fillText(template.subtitle, 600, 360);
  
  // Add features
  ctx.font = '24px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 0;
  ctx.fillText(template.features, 600, 450);
  
  // Add aeLTD branding
  ctx.font = '20px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('aeLTD Premium Collection', 600, 600);
  ctx.fillText('Open Tabs ∞ Certified', 600, 625);
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, template.name), buffer);
  console.log(`✅ Created: ${template.name}`);
});

console.log('🎉 All preview images created!');