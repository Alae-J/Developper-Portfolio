import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'

export type PerformanceMode = 'auto' | 'high' | 'medium' | 'low'

export interface UserPreferences {
  reducedMotion: boolean
  audioEnabled: boolean
  skipIntroduction: boolean
  performanceMode: PerformanceMode
}

export interface SceneState {
  // Scene loading and initialization
  loaded: boolean
  currentZone: string
  loadingProgress: number
  
  // Camera and user position
  userPosition: THREE.Vector3
  cameraTarget: THREE.Vector3
  cameraRotation: { x: number; y: number }
  
  // Performance and settings
  performanceMode: PerformanceMode
  currentFPS: number
  averageFPS: number
  
  // User preferences
  userPreferences: UserPreferences
  
  // Navigation state
  isNavigating: boolean
  lastInteractionTime: number
  
  // Error handling
  error: string | null
}

export interface SceneActions {
  // Scene management
  setLoaded: (loaded: boolean) => void
  setCurrentZone: (zone: string) => void
  setLoadingProgress: (progress: number) => void
  
  // Camera management
  updateUserPosition: (position: THREE.Vector3) => void
  updateCameraTarget: (target: THREE.Vector3) => void
  updateCameraRotation: (rotation: { x: number; y: number }) => void
  
  // Performance management
  setPerformanceMode: (mode: PerformanceMode) => void
  updateFPS: (fps: number) => void
  updateAverageFPS: (averageFPS: number) => void
  
  // User preferences
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void
  
  // Navigation
  setIsNavigating: (navigating: boolean) => void
  updateLastInteractionTime: () => void
  
  // Error handling
  setError: (error: string | null) => void
  
  // Utility actions
  resetScene: () => void
  initializeDefaults: () => void
}

export type SceneStore = SceneState & SceneActions

const initialState: SceneState = {
  loaded: false,
  currentZone: 'main',
  loadingProgress: 0,
  userPosition: new THREE.Vector3(0, 0, 5),
  cameraTarget: new THREE.Vector3(0, 0, 0),
  cameraRotation: { x: 0, y: 0 },
  performanceMode: 'auto',
  currentFPS: 60,
  averageFPS: 60,
  userPreferences: {
    reducedMotion: false,
    audioEnabled: true,
    skipIntroduction: false,
    performanceMode: 'auto'
  },
  isNavigating: false,
  lastInteractionTime: Date.now(),
  error: null
}

export const useSceneStore = create<SceneStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,
      
      // Scene management
      setLoaded: (loaded) => set((state) => {
        state.loaded = loaded
      }),
      
      setCurrentZone: (zone) => set((state) => {
        state.currentZone = zone
      }),
      
      setLoadingProgress: (progress) => set((state) => {
        state.loadingProgress = Math.max(0, Math.min(100, progress))
      }),
      
      // Camera management
      updateUserPosition: (position) => set((state) => {
        state.userPosition = position.clone()
      }),
      
      updateCameraTarget: (target) => set((state) => {
        state.cameraTarget = target.clone()
      }),
      
      updateCameraRotation: (rotation) => set((state) => {
        state.cameraRotation = { ...rotation }
      }),
      
      // Performance management
      setPerformanceMode: (mode) => set((state) => {
        state.performanceMode = mode
        state.userPreferences.performanceMode = mode
      }),
      
      updateFPS: (fps) => set((state) => {
        state.currentFPS = fps
      }),
      
      updateAverageFPS: (averageFPS) => set((state) => {
        state.averageFPS = averageFPS
      }),
      
      // User preferences
      updateUserPreferences: (preferences) => set((state) => {
        state.userPreferences = { ...state.userPreferences, ...preferences }
        
        // Update performance mode if it changed
        if (preferences.performanceMode) {
          state.performanceMode = preferences.performanceMode
        }
      }),
      
      // Navigation
      setIsNavigating: (navigating) => set((state) => {
        state.isNavigating = navigating
      }),
      
      updateLastInteractionTime: () => set((state) => {
        state.lastInteractionTime = Date.now()
      }),
      
      // Error handling
      setError: (error) => set((state) => {
        state.error = error
      }),
      
      // Utility actions
      resetScene: () => set((state) => {
        // Reset all properties individually for better type safety with Immer
        state.loaded = initialState.loaded
        state.currentZone = initialState.currentZone
        state.loadingProgress = initialState.loadingProgress
        state.userPosition = initialState.userPosition.clone()
        state.cameraTarget = initialState.cameraTarget.clone()
        state.cameraRotation = { ...initialState.cameraRotation }
        state.performanceMode = initialState.performanceMode
        state.currentFPS = initialState.currentFPS
        state.averageFPS = initialState.averageFPS
        state.userPreferences = { ...initialState.userPreferences }
        state.isNavigating = initialState.isNavigating
        state.lastInteractionTime = Date.now() // Use current time instead
        state.error = initialState.error
      }),
      
      initializeDefaults: () => set((state) => {
        // Initialize with browser/device appropriate defaults
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        const isLowEndDevice = navigator.hardwareConcurrency <= 2
        
        if (isMobile || isLowEndDevice) {
          state.performanceMode = 'medium'
          state.userPreferences.performanceMode = 'medium'
        }
        
        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (prefersReducedMotion) {
          state.userPreferences.reducedMotion = true
        }
        
        state.lastInteractionTime = Date.now()
      })
    }))
  )
)

// Selectors for common state combinations
export const selectSceneReady = (state: SceneStore) => state.loaded && !state.error
export const selectCameraState = (state: SceneStore) => ({
  position: state.userPosition,
  target: state.cameraTarget,
  rotation: state.cameraRotation
})
export const selectPerformanceState = (state: SceneStore) => ({
  mode: state.performanceMode,
  currentFPS: state.currentFPS,
  averageFPS: state.averageFPS
})

// Subscription helpers
export const subscribeToPerformance = (callback: (fps: number, averageFPS: number) => void) => {
  return useSceneStore.subscribe(
    (state) => ({ fps: state.currentFPS, averageFPS: state.averageFPS }),
    ({ fps, averageFPS }) => callback(fps, averageFPS),
    { equalityFn: (a, b) => a.fps === b.fps && a.averageFPS === b.averageFPS }
  )
}

export const subscribeToUserPosition = (callback: (position: THREE.Vector3) => void) => {
  return useSceneStore.subscribe(
    (state) => state.userPosition,
    callback,
    { equalityFn: (a, b) => a.equals(b) }
  )
}