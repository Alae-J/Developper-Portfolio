import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSceneStore } from '@/store/sceneStore'
import * as THREE from 'three'

// Mock navigator for testing
Object.defineProperty(navigator, 'hardwareConcurrency', {
  value: 4,
  writable: true
})

Object.defineProperty(navigator, 'userAgent', {
  value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  writable: true
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }))
})

describe('SceneStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useSceneStore.getState().resetScene()
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useSceneStore.getState()
      
      expect(state.loaded).toBe(false)
      expect(state.currentZone).toBe('main')
      expect(state.loadingProgress).toBe(0)
      expect(state.performanceMode).toBe('auto')
      expect(state.userPreferences.performanceMode).toBe('auto')
      expect(state.error).toBe(null)
    })
  })

  describe('Scene Management', () => {
    it('should set loaded state', () => {
      const { setLoaded } = useSceneStore.getState()
      
      setLoaded(true)
      expect(useSceneStore.getState().loaded).toBe(true)
      
      setLoaded(false)
      expect(useSceneStore.getState().loaded).toBe(false)
    })

    it('should set current zone', () => {
      const { setCurrentZone } = useSceneStore.getState()
      
      setCurrentZone('gallery')
      expect(useSceneStore.getState().currentZone).toBe('gallery')
    })

    it('should set loading progress with bounds checking', () => {
      const { setLoadingProgress } = useSceneStore.getState()
      
      setLoadingProgress(50)
      expect(useSceneStore.getState().loadingProgress).toBe(50)
      
      // Test upper bound
      setLoadingProgress(150)
      expect(useSceneStore.getState().loadingProgress).toBe(100)
      
      // Test lower bound
      setLoadingProgress(-10)
      expect(useSceneStore.getState().loadingProgress).toBe(0)
    })
  })

  describe('Camera Management', () => {
    it('should update user position', () => {
      const { updateUserPosition } = useSceneStore.getState()
      const newPosition = new THREE.Vector3(10, 5, -3)
      
      updateUserPosition(newPosition)
      const state = useSceneStore.getState()
      
      expect(state.userPosition.x).toBe(10)
      expect(state.userPosition.y).toBe(5)
      expect(state.userPosition.z).toBe(-3)
    })

    it('should update camera target', () => {
      const { updateCameraTarget } = useSceneStore.getState()
      const newTarget = new THREE.Vector3(5, 2, 1)
      
      updateCameraTarget(newTarget)
      const state = useSceneStore.getState()
      
      expect(state.cameraTarget.x).toBe(5)
      expect(state.cameraTarget.y).toBe(2)
      expect(state.cameraTarget.z).toBe(1)
    })

    it('should update camera rotation', () => {
      const { updateCameraRotation } = useSceneStore.getState()
      const newRotation = { x: 0.5, y: -0.3 }
      
      updateCameraRotation(newRotation)
      const state = useSceneStore.getState()
      
      expect(state.cameraRotation.x).toBe(0.5)
      expect(state.cameraRotation.y).toBe(-0.3)
    })
  })

  describe('Performance Management', () => {
    it('should set performance mode', () => {
      const { setPerformanceMode } = useSceneStore.getState()
      
      setPerformanceMode('high')
      const state = useSceneStore.getState()
      
      expect(state.performanceMode).toBe('high')
      expect(state.userPreferences.performanceMode).toBe('high')
    })

    it('should update FPS values', () => {
      const { updateFPS, updateAverageFPS } = useSceneStore.getState()
      
      updateFPS(45)
      updateAverageFPS(48)
      
      const state = useSceneStore.getState()
      expect(state.currentFPS).toBe(45)
      expect(state.averageFPS).toBe(48)
    })
  })

  describe('User Preferences', () => {
    it('should update user preferences', () => {
      const { updateUserPreferences } = useSceneStore.getState()
      
      updateUserPreferences({
        audioEnabled: false,
        reducedMotion: true,
        performanceMode: 'medium'
      })
      
      const state = useSceneStore.getState()
      expect(state.userPreferences.audioEnabled).toBe(false)
      expect(state.userPreferences.reducedMotion).toBe(true)
      expect(state.performanceMode).toBe('medium')
    })
  })

  describe('Navigation State', () => {
    it('should set navigation state', () => {
      const { setIsNavigating } = useSceneStore.getState()
      
      setIsNavigating(true)
      expect(useSceneStore.getState().isNavigating).toBe(true)
      
      setIsNavigating(false)
      expect(useSceneStore.getState().isNavigating).toBe(false)
    })

    it('should update last interaction time', () => {
      const { updateLastInteractionTime } = useSceneStore.getState()
      const beforeTime = Date.now()
      
      updateLastInteractionTime()
      
      const afterTime = useSceneStore.getState().lastInteractionTime
      expect(afterTime).toBeGreaterThanOrEqual(beforeTime)
    })
  })

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { setError } = useSceneStore.getState()
      
      setError('Test error message')
      expect(useSceneStore.getState().error).toBe('Test error message')
      
      setError(null)
      expect(useSceneStore.getState().error).toBe(null)
    })
  })

  describe('Utility Functions', () => {
    it('should reset scene to initial state', () => {
      const { setLoaded, setCurrentZone, resetScene } = useSceneStore.getState()
      
      // Modify state
      setLoaded(true)
      setCurrentZone('test')
      
      // Reset
      resetScene()
      
      const state = useSceneStore.getState()
      expect(state.loaded).toBe(false)
      expect(state.currentZone).toBe('main')
    })

    it('should initialize defaults based on device capabilities', () => {
      const { initializeDefaults } = useSceneStore.getState()
      
      // Test with low-end device
      Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 })
      
      initializeDefaults()
      
      const state = useSceneStore.getState()
      expect(state.performanceMode).toBe('medium')
      expect(state.userPreferences.performanceMode).toBe('medium')
    })
  })
})