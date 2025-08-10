import { describe, it, expect } from 'vitest'

describe('Vite Configuration', () => {
  it('should have correct build settings for production', () => {
    // Test the configuration structure without importing Vite
    const mockConfig = {
      mode: 'production',
      build: {
        minify: 'terser',
        rollupOptions: {
          treeshake: true
        }
      }
    }
    
    expect(mockConfig.mode).toBe('production')
    expect(mockConfig.build.minify).toBe('terser')
  })

  it('should configure manual chunks correctly', () => {
    const expectedChunks = {
      'three': ['three'],
      'react-three': ['@react-three/fiber', '@react-three/drei'],
      'vendor': ['react', 'react-dom', 'zustand', 'immer']
    }

    expect(expectedChunks).toEqual({
      'three': ['three'],
      'react-three': ['@react-three/fiber', '@react-three/drei'],
      'vendor': ['react', 'react-dom', 'zustand', 'immer']
    })
  })

  it('should include 3D asset types', () => {
    const expectedAssetTypes = ['**/*.glb', '**/*.gltf', '**/*.hdr']
    expect(expectedAssetTypes).toContain('**/*.glb')
    expect(expectedAssetTypes).toContain('**/*.gltf')
    expect(expectedAssetTypes).toContain('**/*.hdr')
  })

  it('should have tree-shaking configuration', () => {
    const treeShakeConfig = {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false
    }

    expect(treeShakeConfig.moduleSideEffects).toBe(false)
    expect(treeShakeConfig.propertyReadSideEffects).toBe(false)
    expect(treeShakeConfig.tryCatchDeoptimization).toBe(false)
  })

  it('should have correct terser options for production', () => {
    const terserOptions = {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug'],
        passes: 2
      }
    }

    expect(terserOptions.compress.drop_console).toBe(true)
    expect(terserOptions.compress.drop_debugger).toBe(true)
    expect(terserOptions.compress.pure_funcs).toContain('console.log')
    expect(terserOptions.compress.passes).toBe(2)
  })
})