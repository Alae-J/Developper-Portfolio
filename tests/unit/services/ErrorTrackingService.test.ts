import { describe, it, expect, beforeEach, vi } from 'vitest'
import { errorTrackingService } from '../../../src/services/ErrorTrackingService'

describe('ErrorTrackingService', () => {
  beforeEach(() => {
    errorTrackingService.clearErrors()
    vi.clearAllMocks()
  })

  describe('WebGL Support Check', () => {
    it('should detect WebGL support correctly', () => {
      const support = errorTrackingService.checkWebGLSupport()
      
      expect(support).toHaveProperty('supported')
      expect(typeof support.supported).toBe('boolean')
      
      if (support.supported) {
        expect(support).toHaveProperty('version')
        expect(support).toHaveProperty('renderer')
      }
    })
  })

  describe('Error Tracking', () => {
    it('should track WebGL errors', () => {
      const testError = {
        type: 'webgl_context_lost' as const,
        message: 'Test WebGL context lost',
        userAgent: 'test-agent',
        timestamp: Date.now()
      }

      errorTrackingService.trackError(testError)
      
      const summary = errorTrackingService.getErrorSummary()
      expect(summary.totalErrors).toBe(1)
      expect(summary.errorsByType.webgl_context_lost).toBe(1)
      expect(summary.recentErrors[0]).toMatchObject(testError)
    })

    it('should limit stored errors to maximum', () => {
      const maxErrors = 50

      for (let i = 0; i < maxErrors + 10; i++) {
        errorTrackingService.trackError({
          type: 'shader_compilation_error',
          message: `Error ${i}`,
          userAgent: 'test-agent',
          timestamp: Date.now()
        })
      }

      const summary = errorTrackingService.getErrorSummary()
      expect(summary.totalErrors).toBe(maxErrors)
    })
  })

  describe('Performance Issue Tracking', () => {
    it('should track performance issues', () => {
      const testIssue = {
        type: 'low_fps' as const,
        value: 15,
        threshold: 30,
        timestamp: Date.now()
      }

      errorTrackingService.trackPerformanceIssue(testIssue)
      
      const summary = errorTrackingService.getPerformanceSummary()
      expect(summary.totalIssues).toBe(1)
      expect(summary.issuesByType.low_fps).toBe(1)
      expect(summary.recentIssues[0]).toMatchObject(testIssue)
    })

    it('should categorize different performance issue types', () => {
      const issues = [
        { type: 'low_fps' as const, value: 15, threshold: 30, timestamp: Date.now() },
        { type: 'high_memory' as const, value: 500, threshold: 200, timestamp: Date.now() },
        { type: 'slow_load_time' as const, value: 10000, threshold: 5000, timestamp: Date.now() }
      ]

      issues.forEach(issue => errorTrackingService.trackPerformanceIssue(issue))
      
      const summary = errorTrackingService.getPerformanceSummary()
      expect(summary.totalIssues).toBe(3)
      expect(summary.issuesByType.low_fps).toBe(1)
      expect(summary.issuesByType.high_memory).toBe(1)
      expect(summary.issuesByType.slow_load_time).toBe(1)
    })
  })

  describe('Error Summary', () => {
    it('should provide comprehensive error summary', () => {
      const errors = [
        { type: 'webgl_context_lost' as const, message: 'Context lost', userAgent: 'test', timestamp: Date.now() },
        { type: 'shader_compilation_error' as const, message: 'Shader error', userAgent: 'test', timestamp: Date.now() },
        { type: 'webgl_context_lost' as const, message: 'Another context lost', userAgent: 'test', timestamp: Date.now() }
      ]

      errors.forEach(error => errorTrackingService.trackError(error))
      
      const summary = errorTrackingService.getErrorSummary()
      expect(summary.totalErrors).toBe(3)
      expect(summary.errorsByType.webgl_context_lost).toBe(2)
      expect(summary.errorsByType.shader_compilation_error).toBe(1)
      expect(summary.recentErrors).toHaveLength(3)
    })
  })

  describe('Clear Errors', () => {
    it('should clear all errors and performance issues', () => {
      errorTrackingService.trackError({
        type: 'webgl_context_lost',
        message: 'Test error',
        userAgent: 'test',
        timestamp: Date.now()
      })

      errorTrackingService.trackPerformanceIssue({
        type: 'low_fps',
        value: 15,
        threshold: 30,
        timestamp: Date.now()
      })

      expect(errorTrackingService.getErrorSummary().totalErrors).toBe(1)
      expect(errorTrackingService.getPerformanceSummary().totalIssues).toBe(1)

      errorTrackingService.clearErrors()

      expect(errorTrackingService.getErrorSummary().totalErrors).toBe(0)
      expect(errorTrackingService.getPerformanceSummary().totalIssues).toBe(0)
    })
  })
})