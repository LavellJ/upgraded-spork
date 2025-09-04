# Performance Budget Documentation

## Bundle Size Targets

### Initial Bundle Size Limits

**Target**: Keep initial bundle under 200KB compressed

**Key Requirements**:
- Reports module must add <50KB to initial bundle (lazy-loaded)
- Chart/visualization components must be lazy-loaded
- Analytics modules should be code-split

### Per-Module Size Targets

| Module Type | Target Size (Compressed) | Status | Notes |
|-------------|-------------------------|--------|-------|
| **Core App** | <150KB | ✅ | Essential components only |
| **Reports Module** | <50KB | ✅ | Lazy-loaded via React.lazy() |
| **Chart Libraries** | <30KB | ✅ | SVG-based, no external deps |
| **Analytics Engine** | <25KB | ✅ | Cohort calculation utilities |
| **Export Utilities** | <15KB | ✅ | CSV generation functions |

### Lazy Loading Implementation

#### Reports Components
- **Trends View**: Lazy-loaded with React.Suspense
- **Parent Email**: Lazy-loaded with React.Suspense  
- **Chart Components**: Included in lazy-loaded modules
- **Export Functions**: Dynamically imported when needed

```typescript
// Lazy load report components to keep initial bundle small (<50KB target)
const Trends = React.lazy(() => 
  import('../guide/reports/Trends').then(module => ({ default: module.Trends }))
);
const ParentEmail = React.lazy(() => 
  import('../reports/parentEmail').then(module => ({ default: module.ParentEmail }))
);
```

#### Loading States
- Show spinner with "Loading report..." message
- Maintain responsive layout during loading
- Provide fallback for failed lazy loading

### Bundle Analysis Commands

```bash
# Analyze bundle size
npm run analyze

# Build with bundle analysis
npm run build:analyze

# Check individual chunk sizes
du -h dist/assets/*.js
```

### Performance Monitoring

#### Key Metrics
- **First Contentful Paint (FCP)**: <2s
- **Largest Contentful Paint (LCP)**: <3s  
- **Time to Interactive (TTI)**: <4s
- **Bundle Loading**: Reports module <500ms on 3G

#### Monitoring Tools
- Lighthouse performance audits
- Vite bundle analyzer
- Chrome DevTools Network tab
- Bundle Buddy for dependency analysis

### Code Splitting Strategy

#### Primary Splits
1. **Main App Bundle**: Navigation, core components
2. **Reports Bundle**: All analytics and reporting features
3. **Authentication Bundle**: Login and user management
4. **Learning Engine**: Educational content and progress tracking

#### Dynamic Imports
```typescript
// Chart components
const ChartComponent = lazy(() => import('./charts/ChartComponent'));

// Heavy analytics utilities  
const cohortAnalytics = await import('./analytics/cohort');

// Export utilities
const csvExport = await import('./utils/csvExport');
```

### Optimization Techniques

#### Bundle Size Reduction
- Tree shaking enabled for all modules
- SVG icons inlined (no icon library overhead)
- Custom chart implementation (no Recharts/Chart.js)
- Minimal external dependencies

#### Loading Performance
- Route-level code splitting
- Component-level lazy loading
- Critical path optimization
- Resource hints (preload, prefetch)

#### Runtime Performance
- Memoization for expensive calculations
- Virtual scrolling for large data sets
- Debounced user interactions
- Optimized re-rendering patterns

### Browser Support Targets

| Browser | Min Version | Bundle Support | Notes |
|---------|-------------|----------------|-------|
| Chrome | 90+ | ES2020 modules | Native lazy loading |
| Firefox | 88+ | ES2020 modules | Dynamic imports |
| Safari | 14+ | ES2020 modules | iOS 14+ |
| Edge | 90+ | ES2020 modules | Chromium-based |

### Budget Alerts

#### Warning Thresholds (80% of target)
- Initial bundle: >160KB (warn at 80%)
- Reports module: >40KB (warn at 80%)
- Chart components: >24KB (warn at 80%)

#### Error Thresholds (100% of target)
- Initial bundle: >200KB (fail build)
- Reports module: >50KB (fail build)
- Any single chunk: >100KB (review required)

### Testing Performance Budgets

#### Automated Checks
```json
{
  "lighthouse": {
    "performance": 90,
    "budget": [
      {
        "resourceType": "script",
        "budget": 200
      },
      {
        "resourceType": "total",
        "budget": 300
      }
    ]
  }
}
```

#### Manual Testing
1. Build production bundle: `npm run build`
2. Analyze chunk sizes: `npm run analyze`
3. Test on slow 3G connection
4. Verify lazy loading behavior
5. Check Time to Interactive metrics

### Future Improvements

#### Planned Optimizations
- Web Workers for heavy calculations
- Service Worker for caching strategies
- Progressive loading for large datasets
- Advanced compression (Brotli)

#### Monitoring Enhancements
- Real User Monitoring (RUM) integration
- Bundle size tracking in CI/CD
- Performance regression testing
- User experience metrics collection

---

*Last Updated: Jan 2025*
*Performance Budget Version: 1.0*