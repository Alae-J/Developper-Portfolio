export interface WebGLError {
  type: 'webgl_context_lost' | 'webgl_not_supported' | 'shader_compilation_error' | 'texture_load_error' | 'model_load_error';
  message: string;
  stack?: string;
  userAgent: string;
  timestamp: number;
  additionalData?: Record<string, unknown>;
}

export interface PerformanceIssue {
  type: 'low_fps' | 'high_memory' | 'slow_load_time' | 'render_timeout';
  value: number;
  threshold: number;
  timestamp: number;
}

class ErrorTrackingService {
  private errors: WebGLError[] = [];
  private performanceIssues: PerformanceIssue[] = [];
  private readonly maxStoredErrors = 50;
  private readonly maxStoredIssues = 100;

  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupWebGLErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
      if (this.isWebGLRelated(event.error)) {
        this.trackError({
          type: 'webgl_not_supported',
          message: event.message,
          stack: event.error?.stack,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          additionalData: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        });
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (this.isWebGLRelated(event.reason)) {
        this.trackError({
          type: 'model_load_error',
          message: event.reason.message || 'Promise rejection',
          stack: event.reason.stack,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        });
      }
    });
  }

  private setupWebGLErrorHandlers() {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', (event) => {
        this.trackError({
          type: 'webgl_context_lost',
          message: 'WebGL context was lost',
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
          additionalData: {
            preventable: !event.defaultPrevented
          }
        });
      });
    }
  }

  trackError(error: WebGLError) {
    this.errors.unshift(error);
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors);
    }

    if (typeof window !== 'undefined' && import.meta.env.PROD) {
      this.reportToAnalytics('webgl_error', error);
    }

    console.error('[WebGL Error]:', error);
  }

  trackPerformanceIssue(issue: PerformanceIssue) {
    this.performanceIssues.unshift(issue);
    if (this.performanceIssues.length > this.maxStoredIssues) {
      this.performanceIssues = this.performanceIssues.slice(0, this.maxStoredIssues);
    }

    if (typeof window !== 'undefined' && import.meta.env.PROD) {
      this.reportToAnalytics('performance_issue', issue);
    }

    console.warn('[Performance Issue]:', issue);
  }

  private reportToAnalytics(eventName: string, data: WebGLError | PerformanceIssue) {
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', eventName, {
        event_category: 'WebGL',
        event_label: data.type,
        value: 'value' in data ? data.value : 1,
        custom_parameters: data
      });
    }
  }

  private isWebGLRelated(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = (error.message || '').toLowerCase();
    const webglKeywords = [
      'webgl', 'gl_', 'shader', 'texture', 'buffer', 'framebuffer',
      'three.js', 'threejs', 'webglrenderer', 'glcontext'
    ];
    
    return webglKeywords.some(keyword => errorMessage.includes(keyword));
  }

  getErrorSummary() {
    return {
      totalErrors: this.errors.length,
      errorsByType: this.errors.reduce((acc, error) => {
        acc[error.type] = (acc[error.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentErrors: this.errors.slice(0, 5)
    };
  }

  getPerformanceSummary() {
    return {
      totalIssues: this.performanceIssues.length,
      issuesByType: this.performanceIssues.reduce((acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentIssues: this.performanceIssues.slice(0, 5)
    };
  }

  checkWebGLSupport(): { supported: boolean; version?: string; renderer?: string } {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      this.trackError({
        type: 'webgl_not_supported',
        message: 'WebGL is not supported on this device',
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      });
      return { supported: false };
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    
    return {
      supported: true,
      version: gl.getParameter(gl.VERSION),
      renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown'
    };
  }

  clearErrors() {
    this.errors = [];
    this.performanceIssues = [];
  }
}

export const errorTrackingService = new ErrorTrackingService();