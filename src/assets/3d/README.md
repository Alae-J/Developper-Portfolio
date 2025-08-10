# 3D Assets Organization

## Folder Structure

### `/models/`
- `/characters/` - 3D character models and avatars
- `/objects/` - Interactive objects and props
- `/environments/` - Scene environments and backgrounds

### `/textures/`
- `/hdr/` - HDR environment maps and lighting
- `/pbr/` - PBR material textures (albedo, normal, roughness, metallic)
- `/ui/` - UI-related textures and sprites

### `/environments/`
- Environment lighting configurations and presets

### `/materials/`
- Material definitions and shader configurations

### `/shaders/`
- Custom GLSL shaders for special effects

## File Naming Conventions

### Models (.glb, .gltf)
- Use kebab-case: `portfolio-avatar.glb`
- Include version when needed: `desk-setup-v2.glb`
- Compressed models: `model-name.draco.glb`

### Textures
- Format: `[object]-[type]-[size].[ext]`
- Examples:
  - `desk-albedo-1024.jpg`
  - `environment-hdr-2048.hdr`
  - `metal-normal-512.png`

### Size Guidelines

#### Models
- Characters: < 5MB per model
- Objects: < 2MB per model
- Environments: < 10MB per model

#### Textures
- HDR environments: < 8MB (2048x1024 max)
- PBR textures: < 2MB each (1024x1024 max)
- UI textures: < 500KB (512x512 max)

## Optimization Guidelines

1. **Use compressed formats**: .glb with Draco compression
2. **Power-of-2 textures**: 256, 512, 1024, 2048
3. **Appropriate formats**:
   - HDR: `.hdr` or `.exr`
   - Albedo: `.jpg` (compressed)
   - Normal/Roughness/Metallic: `.png`
4. **Level of Detail (LOD)**: Multiple versions for different distances

## Loading Strategy

- Critical assets: Preload on app start
- Scene-specific: Lazy load when needed
- Background assets: Load with low priority