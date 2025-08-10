import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

// Mock WebGL context for testing
const mockWebGLContext = {
  getParameter: vi.fn((param) => {
    if (param === 0x1F00) return 'WebGL 2.0 (Mock)'
    if (param === 0x1F02) return 'Mock WebGL Renderer'
    return null
  }),
  getExtension: vi.fn((name) => {
    if (name === 'WEBGL_debug_renderer_info') {
      return {
        UNMASKED_RENDERER_WEBGL: 0x9246,
      }
    }
    return null
  }),
  getSupportedExtensions: vi.fn(() => ['WEBGL_debug_renderer_info', 'OES_standard_derivatives']),
}

// Mock HTMLCanvasElement.getContext
const originalGetContext = HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.getContext = vi.fn((contextType) => {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    return mockWebGLContext
  }
  return originalGetContext.call(this, contextType)
})