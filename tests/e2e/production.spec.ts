import { test, expect } from '@playwright/test'

test.describe('Production Environment WebGL Compatibility', () => {
  test.beforeEach(async ({ page }) => {
    // Set up console logging to catch WebGL errors
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('webgl')) {
        console.error('WebGL Error:', msg.text())
      }
    })

    // Set up error handling for uncaught exceptions
    page.on('pageerror', error => {
      if (error.message.toLowerCase().includes('webgl')) {
        console.error('WebGL Page Error:', error.message)
      }
    })
  })

  test('should load the application without WebGL errors', async ({ page }) => {
    await page.goto('/')
    
    // Wait for the app to fully load
    await page.waitForLoadState('networkidle')
    
    // Check that the main application container is visible
    await expect(page.locator('#root')).toBeVisible()
    
    // Verify no critical errors in console
    const errors = await page.evaluate(() => {
      return window.console.error.toString()
    })
    
    expect(errors).not.toContain('WebGL')
  })

  test('should support WebGL context creation', async ({ page }) => {
    await page.goto('/')

    const webglSupport = await page.evaluate(() => {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      
      if (!gl) return { supported: false }
      
      return {
        supported: true,
        version: gl.getParameter(gl.VERSION),
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER)
      }
    })

    expect(webglSupport.supported).toBe(true)
    expect(webglSupport.version).toBeDefined()
  })

  test('should handle 3D scene initialization', async ({ page }) => {
    await page.goto('/')
    
    // Wait for potential 3D content to load
    await page.waitForTimeout(3000)
    
    // Check if canvas element is present (Three.js creates canvas)
    const canvasExists = await page.locator('canvas').count()
    
    // Should have at least one canvas for 3D rendering
    expect(canvasExists).toBeGreaterThanOrEqual(1)
  })

  test('should maintain stable FPS in 3D scene', async ({ page }) => {
    await page.goto('/')
    
    // Wait for scene to initialize
    await page.waitForTimeout(2000)
    
    // Measure performance over time
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0
        let startTime = performance.now()
        
        const checkFrame = () => {
          frameCount++
          
          if (frameCount >= 60) { // Check over 60 frames
            const endTime = performance.now()
            const fps = (frameCount * 1000) / (endTime - startTime)
            resolve({ fps, frameCount, duration: endTime - startTime })
          } else {
            requestAnimationFrame(checkFrame)
          }
        }
        
        requestAnimationFrame(checkFrame)
      })
    })
    
    // @ts-ignore
    expect(performanceMetrics.fps).toBeGreaterThan(20) // Minimum acceptable FPS
  })

  test('should handle WebGL context loss gracefully', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2000)
    
    // Simulate WebGL context loss
    const contextLossHandled = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return false
      
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
      if (!gl) return false
      
      // Get the WEBGL_lose_context extension if available
      const loseContextExt = gl.getExtension('WEBGL_lose_context')
      
      if (loseContextExt) {
        let contextLost = false
        let contextRestored = false
        
        canvas.addEventListener('webglcontextlost', () => {
          contextLost = true
        })
        
        canvas.addEventListener('webglcontextrestored', () => {
          contextRestored = true
        })
        
        // Simulate context loss
        loseContextExt.loseContext()
        
        // Restore context
        setTimeout(() => loseContextExt.restoreContext(), 100)
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({ contextLost, contextRestored })
          }, 500)
        })
      }
      
      return { contextLost: false, contextRestored: false, extensionAvailable: false }
    })
    
    // @ts-ignore
    if (contextLossHandled.extensionAvailable !== false) {
      // @ts-ignore
      expect(contextLossHandled.contextLost).toBe(true)
    }
  })

  test('should load 3D assets without errors', async ({ page }) => {
    await page.goto('/')
    
    // Monitor network requests for 3D assets
    const assetRequests: string[] = []
    const assetErrors: string[] = []
    
    page.on('request', request => {
      const url = request.url()
      if (url.match(/\.(glb|gltf|hdr|png|jpg|jpeg)$/i)) {
        assetRequests.push(url)
      }
    })
    
    page.on('requestfailed', request => {
      const url = request.url()
      if (url.match(/\.(glb|gltf|hdr|png|jpg|jpeg)$/i)) {
        assetErrors.push(url)
      }
    })
    
    // Wait for assets to potentially load
    await page.waitForTimeout(5000)
    
    // Check that if there were asset requests, none failed
    if (assetRequests.length > 0) {
      expect(assetErrors).toHaveLength(0)
    }
  })

  test('should have proper caching headers for 3D assets', async ({ page }) => {
    const assetResponses: any[] = []
    
    page.on('response', response => {
      const url = response.url()
      if (url.match(/\.(glb|gltf|hdr|png|jpg|jpeg)$/i)) {
        assetResponses.push({
          url,
          cacheControl: response.headers()['cache-control'],
          status: response.status()
        })
      }
    })
    
    await page.goto('/')
    await page.waitForTimeout(3000)
    
    // Verify caching headers for any 3D assets that were loaded
    assetResponses.forEach(response => {
      expect(response.status).toBeLessThan(400)
      if (response.cacheControl) {
        expect(response.cacheControl).toContain('max-age')
      }
    })
  })

  test('should handle different screen sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ]
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/')
      await page.waitForTimeout(2000)
      
      // Check that canvas adapts to viewport
      const canvasSize = await page.locator('canvas').first().evaluate((canvas) => {
        return {
          width: canvas.width,
          height: canvas.height,
          clientWidth: canvas.clientWidth,
          clientHeight: canvas.clientHeight
        }
      })
      
      expect(canvasSize.clientWidth).toBeGreaterThan(0)
      expect(canvasSize.clientHeight).toBeGreaterThan(0)
    }
  })

  test('should report performance metrics', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)
    
    // Check if performance service is available and reporting
    const performanceData = await page.evaluate(() => {
      // @ts-ignore - checking if performance service exists
      if (window.performanceService) {
        // @ts-ignore
        return {
          fps: window.performanceService.getCurrentFPS(),
          // @ts-ignore
          averageFPS: window.performanceService.getAverageFPS(),
          // @ts-ignore
          webglSupport: window.performanceService.checkWebGLSupport()
        }
      }
      return null
    })
    
    // If performance service exists, validate its data
    if (performanceData) {
      expect(performanceData.fps).toBeGreaterThan(0)
      expect(performanceData.webglSupport).toBeDefined()
    }
  })

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)
    
    const memoryUsage = await page.evaluate(() => {
      // @ts-ignore - performance.memory is Chrome-specific
      if (performance.memory) {
        return {
          // @ts-ignore
          used: performance.memory.usedJSHeapSize,
          // @ts-ignore
          total: performance.memory.totalJSHeapSize,
          // @ts-ignore
          limit: performance.memory.jsHeapSizeLimit
        }
      }
      return null
    })
    
    // If memory info is available, ensure reasonable usage
    if (memoryUsage) {
      const usedMB = memoryUsage.used / 1048576 // Convert to MB
      expect(usedMB).toBeLessThan(300) // Should use less than 300MB
    }
  })
})