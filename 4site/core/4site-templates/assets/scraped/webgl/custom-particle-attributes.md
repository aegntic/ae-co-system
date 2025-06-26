# Custom Particle Attributes System

## Overview
Advanced particle system with 100,000 particles using custom buffer attributes and shaders.

## Configuration
```javascript
const particles = 100000;
const geometry = new THREE.BufferGeometry();
```

## Custom Attributes Setup

### Position Attribute
```javascript
const positions = [];
for (let i = 0; i < particles; i++) {
    const x = Math.random() * 2000 - 1000;
    const y = Math.random() * 2000 - 1000;
    const z = Math.random() * 2000 - 1000;
    positions.push(x, y, z);
}
geometry.setAttribute('position', 
    new THREE.Float32BufferAttribute(positions, 3)
);
```

### Color Attribute
```javascript
const colors = [];
const color = new THREE.Color();

for (let i = 0; i < particles; i++) {
    // Create gradient based on particle index
    color.setHSL(i / particles, 1.0, 0.5);
    colors.push(color.r, color.g, color.b);
}
geometry.setAttribute('color', 
    new THREE.Float32BufferAttribute(colors, 3)
);
```

### Size Attribute
```javascript
const sizes = [];
for (let i = 0; i < particles; i++) {
    sizes[i] = 10;
}
geometry.setAttribute('size', 
    new THREE.Float32BufferAttribute(sizes, 1)
);
```

## Custom Shaders

### Vertex Shader
```glsl
attribute float size;
varying vec3 vColor;

void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Distance-based size attenuation
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
```

### Fragment Shader
```glsl
uniform sampler2D pointTexture;
varying vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor, 1.0);
    gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
    
    // Alpha test for circular particles
    if (gl_FragColor.a < 0.5) discard;
}
```

## Dynamic Animation

### Size Animation
```javascript
function animate() {
    const time = Date.now() * 0.005;
    const sizes = geometry.attributes.size.array;
    
    for (let i = 0; i < particles; i++) {
        sizes[i] = 10 * (1 + Math.sin(0.1 * i + time));
    }
    
    geometry.attributes.size.needsUpdate = true;
}
```

### Rotation Animation
```javascript
particleSystem.rotation.z = 0.01 * time;
```

## Material Configuration
```javascript
const material = new THREE.ShaderMaterial({
    uniforms: {
        pointTexture: { value: sprite }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true,
    vertexColors: true
});
```

## Advanced Techniques

### Performance Optimization
- Use `BufferGeometry` for efficient memory usage
- Update only necessary attributes per frame
- Disable depth testing for transparent particles
- Use additive blending for glow effects

### Visual Enhancements
- HSL color space for smooth gradients
- Sine wave modulation for organic motion
- Distance-based size scaling
- Sprite textures for soft particles

### Attribute Management
```javascript
// Efficient attribute updates
geometry.attributes.size.needsUpdate = true;  // Only when changed
geometry.attributes.color.needsUpdate = false; // Static colors
geometry.attributes.position.needsUpdate = false; // Static positions
```

## Use Cases
- Cosmic dust simulations
- Energy field visualizations
- Quantum particle effects
- Data point clouds
- Abstract art installations