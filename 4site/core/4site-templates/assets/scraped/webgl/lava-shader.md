# Lava Shader Implementation

## Overview
Dynamic lava/molten metal shader effect using noise-based texture animation and color blending.

## Shader Uniforms
```javascript
uniforms: {
    fogDensity: { value: 0.45 },
    fogColor: { value: new THREE.Vector3(0, 0, 0) },
    time: { value: 1.0 },
    texture1: { value: textureLoader.load('textures/lava/cloud.png') },
    texture2: { value: textureLoader.load('textures/lava/lavatile.jpg') }
}
```

## Vertex Shader Features
```glsl
uniform vec2 uvScale;
varying vec2 vUv;

void main() {
    vUv = uvScale * uv;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
```

## Fragment Shader Techniques

### Texture Animation
- UV coordinates animated with time uniform
- Noise texture creates flow distortion
- Dual texture sampling for complex patterns

### Color Processing
```glsl
// Pseudo-code representation
vec2 position = vUv * 2.0;
vec4 noise = texture2D(texture1, position + vec2(time * 0.05));
vec2 T1 = position + vec2(1.5, -1.5) * time * 0.02;
vec2 T2 = position + vec2(-0.5, 2.0) * time * 0.01;

// Sample textures with distorted coordinates
T1 += noise.xy * 2.0;
T2 += noise.xy * 2.0;

vec4 color1 = texture2D(texture2, T1);
vec4 color2 = texture2D(texture2, T2);
```

### Color Channel Manipulation
- Cross-channel blending for dynamic colors
- Overflow compensation between RGB channels
- Creates molten, flowing appearance

### Fog Effect
```glsl
// Exponential fog
float depth = gl_FragCoord.z / gl_FragCoord.w;
float fogFactor = exp2(-fogDensity * fogDensity * depth * depth);
gl_FragColor = mix(vec4(fogColor, 1.0), finalColor, fogFactor);
```

## Animation Properties
- Continuous texture scrolling
- Multi-directional flow patterns
- Dynamic color intensity
- Mesh rotation for added movement

## Texture Requirements
1. **Cloud Texture**: Grayscale noise for distortion
2. **Lava Texture**: Tileable lava/magma pattern

## Performance Considerations
- Single-pass rendering
- Minimal texture lookups
- Efficient fog calculation
- Hardware-accelerated blending