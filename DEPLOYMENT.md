# Deployment Guide

## Overview

This project is configured for automated deployment to Vercel with optimized 3D asset delivery and performance monitoring.

## Prerequisites

- Node.js 18+ installed
- Git repository connected to Vercel
- Vercel CLI (optional for manual deployments)
- GitHub account with Actions enabled

## Automatic Deployment

### GitHub Integration

The project uses GitHub Actions for continuous integration and deployment:

1. **CI Pipeline** (`.github/workflows/ci.yml`):
   - Triggers on pushes to `main` and `develop` branches
   - Runs TypeScript checks, linting, tests, and build
   - Validates bundle sizes against performance budget
   - Executes E2E tests

2. **Deployment Pipeline** (`.github/workflows/deploy.yml`):
   - Triggers only on `main` branch commits
   - Deploys to Vercel production environment
   - Runs post-deployment validation

### Vercel Configuration

The `vercel.json` file configures:

- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **CDN Caching**: Optimized headers for 3D assets
- **Security Headers**: CSP, HTTPS enforcement, XSS protection
- **Asset Optimization**: Gzip and Brotli compression

## Manual Deployment

### Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Using npm scripts

```bash
# Build and check bundle sizes
npm run build:check

# Check bundle sizes only
npm run size-check

# Run all tests
npm test && npm run test:e2e
```

## Environment Variables

### Required Secrets (GitHub Actions)

Add these secrets in your GitHub repository settings:

```bash
VERCEL_TOKEN=your_vercel_token
ORG_ID=your_vercel_org_id
PROJECT_ID=your_vercel_project_id
VERCEL_URL=your_production_domain.vercel.app
```

### Optional Environment Variables

```bash
# Analytics and monitoring
VERCEL_ANALYTICS_ID=optional_analytics_id
```

## Performance Monitoring

### Bundle Size Monitoring

The project enforces performance budgets:

- **Main bundle**: 500KB warning, 1MB error
- **Vendor bundle**: 800KB warning, 1.2MB error
- **Three.js bundle**: 600KB warning, 1MB error
- **Total assets**: 15MB warning, 25MB error

### Core Web Vitals Tracking

Vercel Analytics automatically tracks:
- **LCP (Largest Contentful Paint)**: Target <2.5s
- **FID (First Input Delay)**: Target <100ms
- **CLS (Cumulative Layout Shift)**: Target <0.1

### 3D Performance Metrics

Custom performance service tracks:
- Frame rate (FPS)
- Memory usage
- Scene complexity
- WebGL compatibility
- Asset loading times

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Symptom**: Build fails with TypeScript errors
```bash
error TS2307: Cannot find module
```

**Solution**:
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

#### 2. Bundle Size Exceeded

**Symptom**: Build fails with bundle size error
```bash
❌ Bundle size check failed! Some bundles exceed error thresholds.
```

**Solutions**:
- Check `performance-budget.json` thresholds
- Optimize imports (use tree-shaking)
- Analyze bundle with `npm run build && npx vite-bundle-analyzer dist`
- Consider code splitting or lazy loading

#### 3. WebGL Compatibility Issues

**Symptom**: 3D content not loading on certain devices
```bash
WebGL is not supported on this device
```

**Solutions**:
- Check `ErrorTrackingService` logs
- Implement WebGL fallbacks
- Test with different browsers/devices
- Review browser support matrix

#### 4. CDN Caching Issues

**Symptom**: Assets not updating after deployment
```bash
Old 3D models still showing after update
```

**Solutions**:
- Verify `vercel.json` cache headers
- Check asset naming includes content hash
- Clear browser cache
- Verify immutable assets have proper versioning

#### 5. Performance Degradation

**Symptom**: Low FPS or high memory usage
```bash
Performance: Switching to LOW quality mode (FPS: 15)
```

**Solutions**:
- Check `PerformanceService` auto-adjustment
- Monitor memory leaks
- Optimize 3D assets (reduce polygon count, compress textures)
- Implement LOD (Level of Detail) systems

### Debugging Commands

```bash
# Check build output
npm run build && ls -la dist/

# Analyze bundle sizes
npm run size-check

# Test WebGL support locally
npm run dev
# Open browser console and check: performanceService.checkWebGLSupport()

# Run performance tests
npm run test:e2e -- --grep "performance"

# Check for memory leaks
npm run dev
# Monitor browser dev tools Memory tab
```

### Vercel-Specific Issues

#### Function Timeouts
- Vercel free tier has 10s function timeout
- Build scripts should complete within limits
- Large asset processing may need optimization

#### Edge Function Limits
- 4MB bundle size limit for edge functions
- Use static generation when possible
- Optimize serverless function code

### Monitoring and Alerts

#### Error Tracking
- WebGL errors logged via `ErrorTrackingService`
- Console errors in production environment
- Performance issues auto-reported

#### Performance Monitoring
```bash
# View performance metrics
# Check Vercel dashboard Analytics tab
# Monitor browser console for performance reports
```

## Asset Optimization

### 3D Model Guidelines

- **Format**: Use `.glb` with Draco compression
- **Size**: <5MB per character model, <2MB per object
- **Polygons**: <50K triangles for detailed models
- **Textures**: Power-of-2 sizes, use appropriate compression

### Texture Guidelines

- **HDR environments**: <8MB, 2048x1024 max
- **PBR textures**: <2MB each, 1024x1024 max
- **Formats**: Use `.jpg` for albedo, `.png` for alpha/normal maps

### Compression Settings

- **Gzip**: Enabled for all assets >1KB
- **Brotli**: Enabled for modern browsers
- **Asset optimization**: Vite handles automatic optimization

## Security

### Content Security Policy

The CSP headers allow:
- WebGL operations and shader compilation
- Asset loading from same origin and CDN
- Analytics and monitoring scripts

### HTTPS Enforcement

- All HTTP traffic redirects to HTTPS
- TLS 1.3 minimum version
- HSTS headers for security

## Support

### Logs and Debugging

- **Build logs**: Check GitHub Actions output
- **Runtime logs**: Browser console in production
- **Performance logs**: Vercel Analytics dashboard
- **Error tracking**: `ErrorTrackingService` console output

### Performance Budget Updates

Update `performance-budget.json` when adding new features:

```json
{
  "budget": [
    {
      "type": "bundle",
      "name": "new-feature",
      "maximumWarning": "200kb",
      "maximumError": "400kb"
    }
  ]
}
```

Remember to update CI/CD validation scripts accordingly.