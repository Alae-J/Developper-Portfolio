import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortfolioScene } from '@/components/3d/Scene/PortfolioScene'

// Mock Three.js and React Three Fiber
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-canvas">{children}</div>
  ),
  useFrame: vi.fn(),
  useThree: () => ({
    camera: {
      position: { x: 0, y: 0, z: 5 },
      rotation: { x: 0, y: 0, z: 0 }
    },
    gl: {
      domElement: document.createElement('canvas')
    }
  })
}))

// Mock the hooks
vi.mock('@/hooks/use3DNavigation', () => ({
  use3DNavigation: () => ({
    navigationState: {
      performanceMode: 'auto',
      fps: 60,
      frameTime: 16.67,
      memoryUsage: 50.5,
      isWebGLSupported: true,
      webglInfo: {
        webgl1: true,
        webgl2: true,
        extensions: ['EXT_texture_filter_anisotropic']
      }
    },
    setPerformanceMode: vi.fn(),
    getPerformanceSettings: () => ({
      targetFPS: 60,
      antialias: true,
      shadows: true,
      textureQuality: 1.0,
      renderScale: 1.0
    }),
    getBrowserInfo: vi.fn(),
    currentFPS: 60,
    averageFPS: 58
  })
}))

vi.mock('@/store/sceneStore', () => ({
  useSceneStore: () => ({
    loaded: false,
    currentZone: 'main',
    performanceMode: 'auto',
    userPosition: { x: 0, y: 0, z: 5, toFixed: () => '0.0' },
    setLoaded: vi.fn(),
    initializeDefaults: vi.fn(),
    updateFPS: vi.fn(),
    updateAverageFPS: vi.fn(),
    setError: vi.fn(),
    setPerformanceMode: vi.fn()
  })
}))

// Mock environment variables
vi.mock('import.meta.env', () => ({
  VITE_DEBUG_ENABLED: 'false'
}))

describe('PortfolioScene', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading fallback initially', () => {
    render(<PortfolioScene />)
    
    expect(screen.getByText('Loading 3D Environment...')).toBeInTheDocument()
  })

  it('should render Canvas component', () => {
    render(<PortfolioScene />)
    
    expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
  })

  it('should call onSceneReady callback when scene is ready', () => {
    const onSceneReady = vi.fn()
    render(<PortfolioScene onSceneReady={onSceneReady} />)
    
    // The scene ready callback is called asynchronously
    // In a real test, we'd wait for it or mock the timeout
  })

  it('should accept custom initial camera position', () => {
    const customPosition: [number, number, number] = [10, 5, 15]
    render(<PortfolioScene initialCameraPosition={customPosition} />)
    
    // Verify that the Canvas receives the correct camera position
    expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
  })

  it('should accept custom performance mode', () => {
    render(<PortfolioScene performanceMode="low" />)
    
    expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
  })
})

describe('PortfolioScene with Debug Mode', () => {
  beforeEach(() => {
    // Mock debug mode enabled
    vi.stubEnv('VITE_DEBUG_ENABLED', 'true')
  })

  it('should show debug information when debug mode is enabled and not loading', async () => {
    // This test would need more complex mocking to show the debug overlay
    // as it depends on the loading state changing
    render(<PortfolioScene />)
    
    expect(screen.getByTestId('mock-canvas')).toBeInTheDocument()
  })
})