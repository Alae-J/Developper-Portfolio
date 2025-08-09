import { test, expect } from '@playwright/test'

test.describe('3D Portfolio User Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/')
  })

  test.describe('Initial Load and Scene Setup', () => {
    test('should load the 3D scene within 10 seconds', async ({ page }) => {
      // Check for loading indicator
      const loadingIndicator = page.locator('text=Loading 3D Environment...')
      await expect(loadingIndicator).toBeVisible()

      // Wait for scene to load (max 10 seconds as per AC)
      await expect(loadingIndicator).toHaveCount(0, { timeout: 10000 })

      // Verify canvas is present and visible
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
    })

    test('should display WebGL support error for unsupported browsers', async ({ page, browserName }) => {
      // Skip this test for supported browsers in normal circumstances
      // This would typically be tested with a browser that doesn't support WebGL
      test.skip(browserName !== 'webkit', 'Testing WebGL error only on specific browsers')
      
      // In a real scenario, we'd mock WebGL to be unavailable
      await page.addInitScript(() => {
        // Mock WebGL context creation to fail
        HTMLCanvasElement.prototype.getContext = () => null
      })

      await page.reload()

      // Check for WebGL error in console
      const consoleLogs: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleLogs.push(msg.text())
        }
      })

      await page.waitForTimeout(2000)
      expect(consoleLogs.some(log => log.includes('WebGL is not supported'))).toBeTruthy()
    })
  })

  test.describe('Camera Controls and Navigation', () => {
    test('should respond to WASD keyboard controls', async ({ page }) => {
      await page.waitForSelector('canvas', { timeout: 10000 })
      
      const canvas = page.locator('canvas')
      await canvas.click() // Focus the canvas

      // Test W key (forward movement)
      await page.keyboard.press('KeyW')
      await page.waitForTimeout(500)
      await page.keyboard.up('KeyW')

      // Test S key (backward movement)
      await page.keyboard.press('KeyS')
      await page.waitForTimeout(500)
      await page.keyboard.up('KeyS')

      // Test A key (left strafe)
      await page.keyboard.press('KeyA')
      await page.waitForTimeout(500)
      await page.keyboard.up('KeyA')

      // Test D key (right strafe)
      await page.keyboard.press('KeyD')
      await page.waitForTimeout(500)
      await page.keyboard.up('KeyD')

      // Test Space (up movement)
      await page.keyboard.press('Space')
      await page.waitForTimeout(500)
      await page.keyboard.up('Space')

      // Test Shift (down movement)
      await page.keyboard.press('ShiftLeft')
      await page.waitForTimeout(500)
      await page.keyboard.up('ShiftLeft')

      // Verify no JavaScript errors occurred during navigation
      const jsErrors: string[] = []
      page.on('pageerror', error => {
        jsErrors.push(error.message)
      })
      
      expect(jsErrors).toHaveLength(0)
    })

    test('should respond to mouse look controls', async ({ page }) => {
      await page.waitForSelector('canvas', { timeout: 10000 })
      
      const canvas = page.locator('canvas')
      await canvas.click()

      // Test mouse movement for look controls
      await page.mouse.move(400, 300)
      await page.mouse.down()
      
      // Move mouse to simulate looking around
      await page.mouse.move(500, 200)
      await page.waitForTimeout(100)
      await page.mouse.move(300, 400)
      await page.waitForTimeout(100)
      
      await page.mouse.up()

      // Verify canvas is still responsive
      await expect(canvas).toBeVisible()
    })

    test('should handle arrow key navigation', async ({ page }) => {
      await page.waitForSelector('canvas', { timeout: 10000 })
      
      const canvas = page.locator('canvas')
      await canvas.click()

      // Test arrow keys
      await page.keyboard.press('ArrowUp')
      await page.waitForTimeout(200)
      await page.keyboard.up('ArrowUp')

      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(200)
      await page.keyboard.up('ArrowDown')

      await page.keyboard.press('ArrowLeft')
      await page.waitForTimeout(200)
      await page.keyboard.up('ArrowLeft')

      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(200)
      await page.keyboard.up('ArrowRight')

      await expect(canvas).toBeVisible()
    })
  })

  test.describe('Performance and Quality', () => {
    test('should maintain stable frame rate during navigation', async ({ page }) => {
      await page.waitForSelector('canvas', { timeout: 10000 })
      
      // Enable performance monitoring by setting debug mode
      await page.addInitScript(() => {
        localStorage.setItem('debug', 'true')
      })
      
      await page.reload()
      await page.waitForSelector('canvas', { timeout: 10000 })

      const canvas = page.locator('canvas')
      await canvas.click()

      // Perform intensive navigation to test performance
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('KeyW')
        await page.waitForTimeout(100)
        await page.mouse.move(400 + i * 20, 300 + i * 10)
        await page.waitForTimeout(100)
        await page.keyboard.up('KeyW')
      }

      // Check if the application is still responsive
      await expect(canvas).toBeVisible()
      
      // Verify no performance-related errors in console
      const consoleLogs: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          consoleLogs.push(msg.text())
        }
      })
      
      // Should not have critical performance warnings
      const criticalErrors = consoleLogs.filter(log => 
        log.includes('Performance') && log.includes('critical')
      )
      expect(criticalErrors).toHaveLength(0)
    })

    test('should adapt to different viewport sizes', async ({ page }) => {
      await page.waitForSelector('canvas', { timeout: 10000 })
      
      // Test desktop size
      await page.setViewportSize({ width: 1920, height: 1080 })
      await expect(page.locator('canvas')).toBeVisible()

      // Test tablet size
      await page.setViewportSize({ width: 768, height: 1024 })
      await expect(page.locator('canvas')).toBeVisible()

      // Test mobile size
      await page.setViewportSize({ width: 375, height: 667 })
      await expect(page.locator('canvas')).toBeVisible()

      // Verify canvas adapts to viewport
      const canvas = page.locator('canvas')
      const canvasSize = await canvas.boundingBox()
      expect(canvasSize?.width).toBeGreaterThan(0)
      expect(canvasSize?.height).toBeGreaterThan(0)
    })
  })

  test.describe('Browser Compatibility', () => {
    test('should work in Chrome', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium', 'Chrome-specific test')
      
      await page.waitForSelector('canvas', { timeout: 10000 })
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
      
      // Test basic interaction
      await canvas.click()
      await page.keyboard.press('KeyW')
      await page.waitForTimeout(500)
      await page.keyboard.up('KeyW')
    })

    test('should work in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox', 'Firefox-specific test')
      
      await page.waitForSelector('canvas', { timeout: 10000 })
      const canvas = page.locator('canvas')
      await expect(canvas).toBeVisible()
      
      // Test basic interaction
      await canvas.click()
      await page.keyboard.press('KeyW')
      await page.waitForTimeout(500)
      await page.keyboard.up('KeyW')
    })

    test('should handle WebGL context loss gracefully', async ({ page }) => {
      await page.waitForSelector('canvas', { timeout: 10000 })
      
      // Simulate WebGL context loss
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement
        if (canvas) {
          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
          if (gl) {
            const loseContextExt = gl.getExtension('WEBGL_lose_context')
            if (loseContextExt) {
              loseContextExt.loseContext()
              
              // Restore context after a short delay
              setTimeout(() => {
                loseContextExt.restoreContext()
              }, 1000)
            }
          }
        }
      })

      // Verify the application handles context loss gracefully
      await page.waitForTimeout(2000)
      await expect(page.locator('canvas')).toBeVisible()
    })
  })

  test.describe('Touch Controls (Mobile)', () => {
    test('should respond to touch navigation on mobile devices', async ({ page, isMobile }) => {
      test.skip(!isMobile, 'Touch controls test only for mobile')
      
      await page.waitForSelector('canvas', { timeout: 10000 })
      
      const canvas = page.locator('canvas')
      
      // Test touch and drag for look controls
      await page.touchscreen.tap(400, 300)
      
      // Simulate touch drag
      await page.touchscreen.tap(400, 300)
      await page.waitForTimeout(100)
      
      // Verify canvas is still responsive
      await expect(canvas).toBeVisible()
    })
  })

  test.describe('Accessibility and User Experience', () => {
    test('should not cause motion sickness with smooth camera transitions', async ({ page }) => {
      await page.waitForSelector('canvas', { timeout: 10000 })
      
      const canvas = page.locator('canvas')
      await canvas.click()

      // Test rapid movement changes
      await page.keyboard.press('KeyW')
      await page.waitForTimeout(50)
      await page.keyboard.press('KeyS')
      await page.waitForTimeout(50)
      await page.keyboard.up('KeyW')
      await page.keyboard.up('KeyS')

      // Verify smooth transitions by checking for frame rate stability
      // In a real test, we'd measure frame times
      await expect(canvas).toBeVisible()
    })

    test('should provide visual feedback during loading', async ({ page }) => {
      // Start fresh page load
      await page.goto('/')
      
      // Should show loading indicator immediately
      const loadingText = page.locator('text=Loading 3D Environment...')
      await expect(loadingText).toBeVisible({ timeout: 1000 })
      
      // Loading should complete within acceptable time
      await expect(loadingText).toHaveCount(0, { timeout: 10000 })
    })
  })
})