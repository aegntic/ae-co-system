# Environment Mapping & Reflective Materials

## Overview
Implementation of reflective and refractive materials using environment mapping techniques.

## Environment Map Types

### Cube Mapping
```javascript
const loader = new THREE.CubeTextureLoader();
const textureCube = loader.load([
    'px.jpg', 'nx.jpg',
    'py.jpg', 'ny.jpg', 
    'pz.jpg', 'nz.jpg'
]);
textureCube.mapping = THREE.CubeReflectionMapping;
```

### Equirectangular Mapping
```javascript
const textureLoader = new THREE.TextureLoader();
const textureEquirec = textureLoader.load('equirectangular.jpg');
textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
```

## Material Configuration

### Basic Reflective Material
```javascript
const sphereMaterial = new THREE.MeshBasicMaterial({
    envMap: textureCube,
    // No additional lighting needed - pure reflection
});
```

### Refraction Effects
```javascript
// For glass-like materials
material.envMap.mapping = THREE.CubeRefractionMapping;
material.refractionRatio = 0.98; // Glass IOR
```

## Mapping Modes

1. **Reflection Mapping**
   - Creates mirror-like surfaces
   - Perfect for metallic materials
   - Chrome, liquid metal effects

2. **Refraction Mapping**
   - Simulates transparent materials
   - Glass, water, crystal effects
   - Uses index of refraction (IOR)

## Dynamic Environment Control

### Background Rotation
```javascript
scene.backgroundRotation = new THREE.Euler();
scene.backgroundRotation.x = params.backgroundRotationX;
scene.backgroundRotation.y = params.backgroundRotationY;
scene.backgroundRotation.z = params.backgroundRotationZ;
```

### Environment Intensity
```javascript
scene.backgroundIntensity = params.backgroundIntensity;
scene.environmentIntensity = params.envMapIntensity;
```

## Advanced Techniques

### Metallic Surface Properties
- Use `MeshStandardMaterial` for PBR
- Set `metalness: 1.0` for full metal
- Set `roughness: 0.0` for mirror finish

### Liquid Metal Effect
```javascript
const liquidMetalMaterial = new THREE.MeshStandardMaterial({
    envMap: hdriTexture,
    metalness: 1.0,
    roughness: 0.1,
    envMapIntensity: 1.5
});
```

## Performance Considerations
- Pre-generate mipmaps for smooth reflections
- Use lower resolution for mobile devices
- Consider LOD for distant reflective objects
- Cache environment maps to avoid reloading