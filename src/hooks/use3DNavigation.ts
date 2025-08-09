import { useEffect, useState } from 'react'
import { performanceService, PerformanceMetrics, PerformanceMode } from '@/services/PerformanceService'

export interface Navigation3DState {
  performanceMode: PerformanceMode
  fps: number
  frameTime: number
  memoryUsage?: number
  isWebGLSupported: boolean
  webglInfo: {
    webgl1: boolean
    webgl2: boolean
    extensions: string[]
  }
}

export function use3DNavigation() {
  const [navigationState, setNavigationState] = useState<Navigation3DState>({
    performanceMode: 'auto',
    fps: 60,
    frameTime: 16.67,
    isWebGLSupported: false,
    webglInfo: { webgl1: false, webgl2: false, extensions: [] }
  })

  useEffect(() => {
    // Check WebGL support on mount
    const webglInfo = performanceService.checkWebGLSupport()
    setNavigationState(prev => ({
      ...prev,
      isWebGLSupported: webglInfo.webgl1 || webglInfo.webgl2,
      webglInfo
    }))

    // Subscribe to performance updates
    const unsubscribe = performanceService.subscribe((metrics: PerformanceMetrics) => {
      setNavigationState(prev => ({
        ...prev,
        performanceMode: performanceService.getPerformanceMode(),
        fps: metrics.fps,
        frameTime: metrics.frameTime,
        memoryUsage: metrics.memoryUsage
      }))
    })

    return () => {
      unsubscribe()
      // Note: We don't stop monitoring here as it's a singleton service
      // that other components might be using
    }
  }, [])

  const setPerformanceMode = (mode: PerformanceMode) => {
    performanceService.setPerformanceMode(mode)
    setNavigationState(prev => ({
      ...prev,
      performanceMode: mode
    }))
  }

  const getPerformanceSettings = () => {
    return performanceService.getPerformanceSettings()
  }

  const getBrowserInfo = () => {
    return performanceService.getBrowserInfo()
  }

  return {
    navigationState,
    setPerformanceMode,
    getPerformanceSettings,
    getBrowserInfo,
    currentFPS: performanceService.getCurrentFPS(),
    averageFPS: performanceService.getAverageFPS()
  }
}