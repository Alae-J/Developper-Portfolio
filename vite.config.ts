import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { compression } from 'vite-plugin-compression2'
import glsl from 'vite-plugin-glsl'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    glsl(),
    ...(mode === 'production' ? [
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        filter: /\.(js|mjs|json|css|html|glb|gltf|hdr)$/i,
        threshold: 1024,
        deleteOriginFile: false
      }),
      compression({
        algorithm: 'brotliCompress',
        ext: '.br',
        filter: /\.(js|mjs|json|css|html|glb|gltf|hdr)$/i,
        threshold: 1024,
        deleteOriginFile: false
      })
    ] : [])
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
          'vendor': ['react', 'react-dom', 'zustand', 'immer']
        }
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1000,
    minify: mode === 'production' ? 'terser' : false,
    ...(mode === 'production' && {
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug'],
          passes: 2
        }
      }
    })
  },
  assetsInclude: ['**/*.glb', '**/*.gltf', '**/*.hdr'],
  server: {
    fs: {
      allow: ['..']
    }
  },
  define: {
    __DEV__: mode === 'development'
  }
}))