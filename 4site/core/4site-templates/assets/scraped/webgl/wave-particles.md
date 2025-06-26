# Wave Particle System

## Overview
Dynamic wave simulation using thousands of particles with sinusoidal motion.

## Configuration
```javascript
const SEPARATION = 100;
const AMOUNTX = 50;
const AMOUNTY = 50;
const numParticles = AMOUNTX * AMOUNTY; // 2,500 particles
```

## Particle Grid Setup
```javascript
let i = 0, j = 0;
for (let ix = 0; ix < AMOUNTX; ix++) {
    for (let iy = 0; iy < AMOUNTY; iy++) {
        // Center the grid
        positions[i] = ix * SEPARATION - ((AMOUNTX * SEPARATION) / 2); // x
        positions[i + 1] = 0; // y (updated in animation)
        positions[i + 2] = iy * SEPARATION - ((AMOUNTY * SEPARATION) / 2); // z
        
        scales[j] = 1;
        i += 3;
        j++;
    }
}
```

## Wave Animation Mathematics

### Height Calculation
```javascript
// Combines two sine waves for complex motion
positions[i + 1] = (Math.sin((ix + count) * 0.3) * 50) + 
                   (Math.sin((iy + count) * 0.5) * 50);
```

### Scale Modulation
```javascript
// Dynamic particle sizing based on wave position
scales[j] = (Math.sin((ix + count) * 0.3) + 1) * 20 + 
            (Math.sin((iy + count) * 0.5) + 1) * 20;
```

## Shader Implementation

### Vertex Shader
```glsl
attribute float scale;
varying vec3 vColor;

void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = scale * (300.0 / -mvPosition.z);
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
}
```

## Animation Properties
- **Wave Speed**: Controlled by count increment (0.1 per frame)
- **Wave Frequency**: 0.3 for X-axis, 0.5 for Y-axis
- **Wave Amplitude**: 50 units for height
- **Scale Range**: 0-40 units

## Rendering Features
- Point sprites with texture mapping
- Distance-based size attenuation
- Color inheritance from vertex attributes
- Optimized buffer attribute updates

## Performance Optimization
- Only position and scale attributes updated per frame
- BufferGeometry for efficient memory usage
- Single draw call for all particles
- GPU-accelerated transformations