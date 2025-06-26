# GPGPU Birds Flocking System

## Overview
GPU-accelerated bird flocking simulation using Three.js and WebGL compute shaders.

## Technical Details

### Configuration
```javascript
const WIDTH = 32;
const BIRDS = WIDTH * WIDTH; // 1024 particles
const BOUNDS = 800;
const BOUNDS_HALF = BOUNDS / 2;
```

### Flocking Behaviors

1. **Separation** (zoneRadiusSquared)
   - Default: 15.0
   - Prevents birds from crowding each other

2. **Alignment** (zoneRadiusSquared) 
   - Default: 40.0
   - Aligns velocity with neighboring birds

3. **Cohesion** (zoneRadiusSquared)
   - Default: 40.0
   - Pulls birds toward flock center

### Shader Structure

#### Velocity Compute Shader
- Calculates separation, alignment, and cohesion forces
- Updates velocity based on neighboring bird positions
- Applies predator avoidance (mouse position)
- Limits speed and applies boundary constraints

#### Position Compute Shader
- Integrates velocity to update positions
- Adds wing flapping animation using sine wave
- Wraps positions within bounds

### Bird Geometry
```javascript
// Custom triangular bird shape
vertices.push(
    0, -0, -20,      // Body point
    0, 4, -20,       // Wing up
    0, 0, 30         // Head
);
```

### Rendering Pipeline
1. Initialize GPUComputationRenderer
2. Create velocity and position textures
3. Update compute shaders each frame
4. Apply updated positions to bird instances
5. Render with custom vertex colors

### Mouse Interaction
- Mouse position acts as predator
- Birds flee from cursor position
- Predator uniform updated in real-time

### Performance Optimization
- Texture-based particle storage
- GPU parallel processing
- Efficient neighbor searching
- Minimal CPU-GPU data transfer