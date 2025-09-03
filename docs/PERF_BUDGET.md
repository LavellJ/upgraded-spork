# Performance Budget

This document outlines LearnOz's performance budgets, strategies, and monitoring guidelines to ensure optimal user experience across all devices and network conditions.

## Bundle Size Budgets

### JavaScript Bundles
- **Per Chunk:** Maximum 250KB gzipped
- **Total Bundle:** Maximum 1.2MB gzipped
- **Rationale:** Ensures fast loading on 3G networks (~400-700ms on average 3G)

### Enforcement
```bash
# Check current bundle sizes
npm run build:check

# Analyze bundle composition (dev only)
npm run build && npm run analyze
```

## Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID (First Input Delay):** < 100ms  
- **CLS (Cumulative Layout Shift):** < 0.1

### Loading Performance
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Speed Index:** < 2.0s

### Network Conditions
- **Fast 3G minimum:** App should be usable
- **Slow 3G target:** Critical features accessible
- **Offline capability:** Core learning functions work

## Optimization Strategies

### Code Splitting
```javascript
// Route-based splitting
const LazyComponent = lazy(() => import('./HeavyComponent'));

// Feature-based splitting  
const JournalSheet = lazy(() => import('./journal/JournalSheet'));
```

### Tree Shaking
- Import only needed functions from utility libraries
- Use ES modules for better tree-shaking
- Avoid importing entire libraries when only using small parts

### Lazy Loading
```javascript
// Component lazy loading
const Analytics = lazy(() => import('./analytics/Dashboard'));

// Image lazy loading
<img loading="lazy" src={imageUrl} alt="..." />
```

### Asset Optimization
- **Images:** Use WebP with fallbacks, optimize sizes
- **Fonts:** Preload critical fonts, use font-display: swap
- **Icons:** SVG sprites or icon fonts for better caching

## Bundle Analysis

### Regular Checks
Run bundle analysis regularly during development:
```bash
npm run analyze
```

Look for:
- Large dependencies that could be code-split
- Duplicate dependencies across chunks  
- Unnecessary polyfills or unused code

### Critical Dependencies
Monitor these heavy dependencies:
- **React:** ~45KB gzipped (acceptable)
- **Radix UI:** Load components individually
- **Framer Motion:** Consider lighter alternatives for simple animations
- **Date libraries:** Use date-fns/esm for tree-shaking

## Asset Prefetch Limits

### Prefetch Strategy
- **Critical resources:** Preload (fonts, hero images)
- **Likely-needed resources:** Prefetch (next lesson content)  
- **Bandwidth limit:** Max 500KB prefetched content per session

### Implementation
```html
<!-- Critical resources -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

<!-- Likely-needed resources -->
<link rel="prefetch" href="/assets/lesson-forest-1.js">
```

### Prefetch Budget
- **Fonts:** 100KB max
- **Lesson content:** 200KB max prefetch
- **Images:** 200KB max prefetch
- **Total session:** 500KB prefetch budget

## Monitoring & Alerts

### Build-time Checks
- Automated bundle size validation
- Performance budget enforcement
- Dependency size tracking

### Runtime Monitoring
- Core Web Vitals collection
- Real User Monitoring (RUM)
- Error tracking and performance correlation

### CI/CD Integration
```bash
# Bundle size check in CI
npm run build:check

# Performance testing
npm run test:perf
```

## Emergency Response

### When Budgets Exceed
1. **Immediate:** Identify the largest chunks
2. **Analyze:** Use bundle analyzer to find heavy imports
3. **Optimize:** Apply code splitting or remove unnecessary dependencies
4. **Verify:** Re-run budget checks
5. **Monitor:** Track impact on real user metrics

### Performance Regression
1. **Alert triggers:** >10% increase in bundle size
2. **Investigation:** Compare with previous builds
3. **Rollback plan:** Have previous working version ready
4. **Root cause:** Identify specific changes causing regression

## Tools & Resources

### Bundle Analysis
- `vite-bundle-analyzer` - Interactive bundle visualization
- `check-bundlesize.mjs` - Automated size validation

### Performance Testing
- Lighthouse CI for automated audits
- WebPageTest for real-world conditions
- Chrome DevTools for local debugging

### Best Practices
- Regular performance reviews
- Bundle size monitoring in CI
- Performance-first development mindset
- User-centric optimization priorities