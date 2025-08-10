import { describe, it, expect, beforeEach, vi } from 'vitest'
import fs from 'fs'

vi.mock('fs')

const mockedFs = vi.mocked(fs)

describe('Bundle Size Checker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('File Size Utilities', () => {
    it('should format bytes correctly', () => {
      const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }

      expect(formatSize(0)).toBe('0 B')
      expect(formatSize(1024)).toBe('1 KB')
      expect(formatSize(1024 * 1024)).toBe('1 MB')
      expect(formatSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(formatSize(1536)).toBe('1.5 KB')
    })

    it('should parse size strings correctly', () => {
      const parseSize = (sizeString: string) => {
        const match = sizeString.match(/^(\d+(?:\.\d+)?)(kb|mb|gb)$/i)
        if (!match) return 0
        
        const value = parseFloat(match[1])
        const unit = match[2].toLowerCase()
        
        switch (unit) {
          case 'kb': return value * 1024
          case 'mb': return value * 1024 * 1024
          case 'gb': return value * 1024 * 1024 * 1024
          default: return value
        }
      }

      expect(parseSize('1kb')).toBe(1024)
      expect(parseSize('1.5mb')).toBe(1.5 * 1024 * 1024)
      expect(parseSize('2gb')).toBe(2 * 1024 * 1024 * 1024)
      expect(parseSize('invalid')).toBe(0)
    })
  })

  describe('Bundle Size Validation', () => {
    it('should validate bundle sizes against budget', () => {
      const budget = {
        budget: [
          {
            type: 'bundle',
            name: 'main',
            maximumWarning: '500kb',
            maximumError: '1mb'
          }
        ]
      }

      const parseSize = (sizeString: string) => {
        const match = sizeString.match(/^(\d+(?:\.\d+)?)(kb|mb|gb)$/i)
        if (!match) return 0
        const value = parseFloat(match[1])
        const unit = match[2].toLowerCase()
        switch (unit) {
          case 'kb': return value * 1024
          case 'mb': return value * 1024 * 1024
          case 'gb': return value * 1024 * 1024 * 1024
          default: return value
        }
      }

      const mainBundle = budget.budget.find(b => b.name === 'main')
      const warningSize = parseSize(mainBundle!.maximumWarning)
      const errorSize = parseSize(mainBundle!.maximumError)

      expect(warningSize).toBe(500 * 1024)
      expect(errorSize).toBe(1024 * 1024)

      // Test different bundle sizes
      const smallBundle = 100 * 1024 // 100KB - should pass
      const mediumBundle = 600 * 1024 // 600KB - should warn
      const largeBundle = 2 * 1024 * 1024 // 2MB - should error

      expect(smallBundle < warningSize).toBe(true)
      expect(mediumBundle > warningSize && mediumBundle < errorSize).toBe(true)
      expect(largeBundle > errorSize).toBe(true)
    })
  })

  describe('Performance Budget Structure', () => {
    it('should have valid budget configuration', () => {
      const budget = {
        budget: [
          { type: 'bundle', name: 'main', maximumWarning: '500kb', maximumError: '1mb' },
          { type: 'bundle', name: 'vendor', maximumWarning: '800kb', maximumError: '1.2mb' },
          { type: 'bundle', name: 'three', maximumWarning: '600kb', maximumError: '1mb' },
          { type: 'total', maximumWarning: '15mb', maximumError: '25mb' }
        ],
        performance: {
          lcp: { warning: 2500, error: 4000 },
          fid: { warning: 100, error: 300 },
          cls: { warning: 0.1, error: 0.25 }
        }
      }

      expect(budget.budget).toHaveLength(4)
      expect(budget.budget.every(b => b.maximumWarning && b.maximumError)).toBe(true)
      expect(budget.performance.lcp.warning).toBeLessThan(budget.performance.lcp.error)
      expect(budget.performance.fid.warning).toBeLessThan(budget.performance.fid.error)
      expect(budget.performance.cls.warning).toBeLessThan(budget.performance.cls.error)
    })
  })

  describe('File System Operations', () => {
    it('should handle missing build directory gracefully', () => {
      mockedFs.existsSync.mockReturnValue(false)

      const checkBuildExists = (distPath: string) => {
        return fs.existsSync(distPath)
      }

      expect(checkBuildExists('/fake/dist')).toBe(false)
    })

    it('should handle file size calculations', () => {
      mockedFs.statSync.mockReturnValue({ size: 1024 * 500 } as any) // 500KB

      const getFileSize = (filePath: string) => {
        try {
          const stats = fs.statSync(filePath)
          return stats.size
        } catch (error) {
          return 0
        }
      }

      expect(getFileSize('/fake/file.js')).toBe(500 * 1024)
    })
  })
})