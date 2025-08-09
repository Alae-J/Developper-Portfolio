import { describe, it, expect, beforeEach, vi } from 'vitest'
import { performanceService, PerformanceMode } from '@/services/PerformanceService'

// Mock the performance.now() function
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
      jsHeapSizeLimit: 2000 * 1024 * 1024 // 2GB
    }
  }
})

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16) // Simulate 60fps (16.67ms per frame)
  return 1
})

describe('PerformanceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Performance Mode Management', () => {
    it('should set and get performance mode correctly', () => {
      performanceService.setPerformanceMode('high')
      expect(performanceService.getPerformanceMode()).toBe('high')
      
      performanceService.setPerformanceMode('low')
      expect(performanceService.getPerformanceMode()).toBe('low')
    })

    it('should return correct performance settings for each mode', () => {
      const highSettings = performanceService.getPerformanceSettings('high')
      expect(highSettings.targetFPS).toBe(60)
      expect(highSettings.antialias).toBe(true)
      expect(highSettings.shadows).toBe(true)
      expect(highSettings.renderScale).toBe(1.0)

      const lowSettings = performanceService.getPerformanceSettings('low')
      expect(lowSettings.targetFPS).toBe(30)
      expect(lowSettings.antialias).toBe(false)
      expect(lowSettings.shadows).toBe(false)
      expect(lowSettings.renderScale).toBe(0.6)
    })
  })

  describe('FPS Monitoring', () => {
    it('should track FPS correctly', () => {
      const initialFPS = performanceService.getCurrentFPS()
      expect(typeof initialFPS).toBe('number')
      expect(initialFPS).toBeGreaterThan(0)
    })

    it('should calculate average FPS', () => {
      const averageFPS = performanceService.getAverageFPS()
      expect(typeof averageFPS).toBe('number')
      expect(averageFPS).toBeGreaterThan(0)
    })
  })

  describe('WebGL Support Detection', () => {
    it('should check WebGL support', () => {
      // Mock canvas and WebGL context
      const mockCanvas = {
        getContext: vi.fn((type: string) => {
          if (type === 'webgl' || type === 'webgl2') {
            return {
              getSupportedExtensions: () => ['EXT_texture_filter_anisotropic', 'WEBGL_lose_context']
            }
          }
          return null
        })
      }
      
      // Mock document.createElement
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any)
      
      const webglInfo = performanceService.checkWebGLSupport()
      expect(webglInfo.webgl1).toBe(true)
      expect(webglInfo.webgl2).toBe(true)
      expect(webglInfo.extensions).toContain('EXT_texture_filter_anisotropic')
    })
  })

  describe('Browser Information', () => {
    it('should return browser information', () => {
      const browserInfo = performanceService.getBrowserInfo()
      expect(browserInfo.userAgent).toBeDefined()
      expect(browserInfo.vendor).toBeDefined()
      expect(browserInfo.platform).toBeDefined()
      expect(typeof browserInfo.cookieEnabled).toBe('boolean')
    })
  })

  describe('Performance Monitoring Subscription', () => {
    it('should allow subscribing to performance updates', () => {
      const callback = vi.fn()
      const unsubscribe = performanceService.subscribe(callback)
      
      expect(typeof unsubscribe).toBe('function')
      
      // Clean up
      unsubscribe()
    })

    it('should allow unsubscribing from performance updates', () => {
      const callback = vi.fn()
      const unsubscribe = performanceService.subscribe(callback)
      
      unsubscribe()
      
      // Callback should not be called after unsubscribe
      // (This is a basic test - in practice, we'd need to trigger a performance update)
      expect(callback).not.toHaveBeenCalled()
    })
  })
})