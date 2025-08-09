export type PerformanceMode = 'auto' | 'high' | 'medium' | 'low'

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsage?: number
  gpuMemoryUsage?: number
}

export interface PerformanceSettings {
  targetFPS: number
  antialias: boolean
  shadows: boolean
  textureQuality: number
  renderScale: number
}

class PerformanceService {
  private frameCount = 0
  private lastTime = performance.now()
  private fpsCalculationStartTime = performance.now()
  private fps = 60
  private frameTime = 16.67
  private fpsHistory: number[] = []
  private performanceMode: PerformanceMode = 'auto'
  private targetFPS = 60
  private callbacks: ((metrics: PerformanceMetrics) => void)[] = []
  private animationFrameId: number | null = null

  private performanceSettings: Record<PerformanceMode, PerformanceSettings> = {
    high: {
      targetFPS: 60,
      antialias: true,
      shadows: true,
      textureQuality: 1.0,
      renderScale: 1.0
    },
    medium: {
      targetFPS: 45,
      antialias: true,
      shadows: false,
      textureQuality: 0.75,
      renderScale: 0.8
    },
    low: {
      targetFPS: 30,
      antialias: false,
      shadows: false,
      textureQuality: 0.5,
      renderScale: 0.6
    },
    auto: {
      targetFPS: 60,
      antialias: true,
      shadows: true,
      textureQuality: 1.0,
      renderScale: 1.0
    }
  }

  constructor() {
    this.startMonitoring()
  }

  public startMonitoring(): void {
    const monitor = () => {
      const currentTime = performance.now()
      this.frameTime = currentTime - this.lastTime
      this.lastTime = currentTime
      this.frameCount++

      // Calculate FPS every 60 frames using total elapsed time
      if (this.frameCount % 60 === 0) {
        const elapsedTime = currentTime - this.fpsCalculationStartTime
        this.fps = (60 * 1000) / elapsedTime // 60 frames over elapsed time in ms
        this.fpsCalculationStartTime = currentTime // Reset for next calculation
        this.updateFPSHistory(this.fps)
        
        // Auto-adjust performance if needed
        if (this.performanceMode === 'auto') {
          this.autoAdjustPerformance()
        }

        // Notify subscribers
        const metrics: PerformanceMetrics = {
          fps: this.fps,
          frameTime: this.frameTime,
          memoryUsage: this.getMemoryUsage(),
          gpuMemoryUsage: this.getGPUMemoryUsage()
        }

        this.callbacks.forEach(callback => callback(metrics))
      }

      this.animationFrameId = requestAnimationFrame(monitor)
    }

    this.animationFrameId = requestAnimationFrame(monitor)
  }

  public stopMonitoring(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  public setPerformanceMode(mode: PerformanceMode): void {
    this.performanceMode = mode
    this.targetFPS = this.performanceSettings[mode].targetFPS
  }

  public getPerformanceMode(): PerformanceMode {
    return this.performanceMode
  }

  public getPerformanceSettings(mode?: PerformanceMode): PerformanceSettings {
    const currentMode = mode || this.performanceMode
    return { ...this.performanceSettings[currentMode] }
  }

  public getCurrentFPS(): number {
    return this.fps
  }

  public getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return this.fps
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0)
    return sum / this.fpsHistory.length
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  public checkWebGLSupport(): {
    webgl1: boolean
    webgl2: boolean
    extensions: string[]
  } {
    const canvas = document.createElement('canvas')
    
    const webgl1 = !!canvas.getContext('webgl')
    const webgl2 = !!canvas.getContext('webgl2')
    
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    const extensions: string[] = []
    
    if (gl) {
      const supportedExtensions = gl.getSupportedExtensions()
      if (supportedExtensions) {
        extensions.push(...supportedExtensions)
      }
    }

    return { webgl1, webgl2, extensions }
  }

  public getBrowserInfo(): {
    userAgent: string
    vendor: string
    platform: string
    cookieEnabled: boolean
  } {
    return {
      userAgent: navigator.userAgent,
      vendor: navigator.vendor || 'unknown',
      platform: (navigator as any).userAgentData?.platform || navigator.platform || 'unknown',
      cookieEnabled: navigator.cookieEnabled
    }
  }

  private updateFPSHistory(fps: number): void {
    this.fpsHistory.push(fps)
    if (this.fpsHistory.length > 30) {
      this.fpsHistory.shift()
    }
  }

  private autoAdjustPerformance(): void {
    const averageFPS = this.getAverageFPS()
    
    if (averageFPS < 25 && this.performanceMode !== 'low') {
      console.warn('Performance: Switching to LOW quality mode (FPS:', averageFPS, ')')
      this.performanceMode = 'low'
    } else if (averageFPS < 40 && this.performanceMode === 'high') {
      console.warn('Performance: Switching to MEDIUM quality mode (FPS:', averageFPS, ')')
      this.performanceMode = 'medium'
    } else if (averageFPS > 55 && this.performanceMode === 'low') {
      console.log('Performance: Switching to MEDIUM quality mode (FPS:', averageFPS, ')')
      this.performanceMode = 'medium'
    } else if (averageFPS > 55 && this.performanceMode === 'medium') {
      console.log('Performance: Switching to HIGH quality mode (FPS:', averageFPS, ')')
      this.performanceMode = 'high'
    }
  }

  private getMemoryUsage(): number | undefined {
    // @ts-ignore - performance.memory is non-standard but available in Chrome
    if (performance.memory) {
      // @ts-ignore
      return performance.memory.usedJSHeapSize / 1048576 // Convert to MB
    }
    return undefined
  }

  private getGPUMemoryUsage(): number | undefined {
    // GPU memory usage is not easily accessible in web browsers
    // This is a placeholder for future implementation
    return undefined
  }
}

export const performanceService = new PerformanceService()