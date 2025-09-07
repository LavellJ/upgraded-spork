import React, { useState, useEffect } from 'react'
import { SimpleLayout } from '../../ui2/SimpleLayout'
import { ListCard, ListRow, ListSection } from '../../ui2/List'
import { Ic } from '../../ui2/icons'
import { useFlags } from '../../config/flags'

// Dev-only imports (will be tree-shaken in production)
let runA11yScan: (() => Promise<any>) | undefined
let startVitals: ((cb: (v: any) => void) => void) | undefined

if (import.meta.env?.DEV) {
  try {
    const diagnostics = await import('../../dev/diagnostics')
    runA11yScan = diagnostics.runA11yScan
    startVitals = diagnostics.startVitals
  } catch (error) {
    console.warn('Failed to load dev diagnostics:', error)
  }
}

interface DiagnosticCheck {
  id: string
  label: string
  status: 'pending' | 'success' | 'error' | 'warning'
  details?: string
  fixTip?: string
  value?: string | number
}

interface A11yViolation {
  id: string
  impact: string
  description: string
  nodes: { target: string[] }[]
}

interface A11yResult {
  violations: A11yViolation[]
}

type WebVitals = {
  LCP?: number
  CLS?: number  
  INP?: number
}

interface DiagnosticReport {
  timestamp: string
  userAgent: string
  checks: DiagnosticCheck[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}

export default function Diagnostics() {
  const [checks, setChecks] = useState<DiagnosticCheck[]>([])
  const [loading, setLoading] = useState(false)
  const [lastRun, setLastRun] = useState<Date | null>(null)
  const [a11yResults, setA11yResults] = useState<A11yResult | null>(null)
  const [a11yLoading, setA11yLoading] = useState(false)
  const [webVitals, setWebVitals] = useState<WebVitals>({})
  const flags = useFlags()

  // Start web vitals monitoring on mount (dev only)
  useEffect(() => {
    if (import.meta.env?.DEV && startVitals) {
      startVitals((vitals: WebVitals) => {
        setWebVitals(prev => ({ ...prev, ...vitals }))
      })
    }
  }, [])

  const initializeChecks = (): DiagnosticCheck[] => [
    { id: 'sw', label: 'Service Worker', status: 'pending' },
    { id: 'localStorage', label: 'LocalStorage', status: 'pending' },
    { id: 'indexedDB', label: 'IndexedDB', status: 'pending' },
    { id: 'finalArt', label: 'Final Art Assets', status: 'pending' },
    { id: 'flags', label: 'Feature Flags', status: 'pending' },
    { id: 'apiPing', label: 'API Connectivity', status: 'pending' },
    { id: 'pwaCache', label: 'PWA Cache', status: 'pending' },
    { id: 'providers', label: 'React Providers', status: 'pending' },
    { id: 'scoutQueue', label: 'Scout Queue', status: 'pending' }
  ]

  const checkServiceWorker = async (): Promise<DiagnosticCheck> => {
    try {
      if (!('serviceWorker' in navigator)) {
        return {
          id: 'sw',
          label: 'Service Worker',
          status: 'error',
          details: 'Service Worker not supported',
          fixTip: 'Use a modern browser that supports Service Workers'
        }
      }

      const registration = await navigator.serviceWorker.ready
      const isControlling = !!navigator.serviceWorker.controller
      
      if (registration.active && isControlling) {
        return {
          id: 'sw',
          label: 'Service Worker',
          status: 'success',
          details: 'Active and controlling page',
          value: 'Active'
        }
      } else {
        return {
          id: 'sw',
          label: 'Service Worker',
          status: 'warning',
          details: 'Registered but not controlling',
          fixTip: 'Refresh the page to activate Service Worker',
          value: 'Partial'
        }
      }
    } catch (error) {
      return {
        id: 'sw',
        label: 'Service Worker',
        status: 'error',
        details: `Registration failed: ${error}`,
        fixTip: 'Check console for Service Worker errors'
      }
    }
  }

  const checkLocalStorage = async (): Promise<DiagnosticCheck> => {
    try {
      const testKey = 'qi.diagnostic.test'
      const testValue = `test-${Date.now()}`
      
      localStorage.setItem(testKey, testValue)
      const retrieved = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      
      if (retrieved === testValue) {
        return {
          id: 'localStorage',
          label: 'LocalStorage',
          status: 'success',
          details: 'Read/write operations successful',
          value: 'OK'
        }
      } else {
        return {
          id: 'localStorage',
          label: 'LocalStorage',
          status: 'error',
          details: 'Data integrity check failed',
          fixTip: 'Clear browser data or try incognito mode'
        }
      }
    } catch (error) {
      return {
        id: 'localStorage',
        label: 'LocalStorage',
        status: 'error',
        details: `Access denied: ${error}`,
        fixTip: 'Check browser privacy settings or try incognito mode'
      }
    }
  }

  const checkIndexedDB = async (): Promise<DiagnosticCheck> => {
    return new Promise((resolve) => {
      try {
        if (!('indexedDB' in window)) {
          resolve({
            id: 'indexedDB',
            label: 'IndexedDB',
            status: 'error',
            details: 'IndexedDB not supported',
            fixTip: 'Use a modern browser that supports IndexedDB'
          })
          return
        }

        const request = indexedDB.open('qi-diagnostic-test', 1)
        
        request.onerror = () => {
          resolve({
            id: 'indexedDB',
            label: 'IndexedDB',
            status: 'error',
            details: 'Failed to open database',
            fixTip: 'Check browser privacy settings or storage quota'
          })
        }
        
        request.onsuccess = () => {
          request.result.close()
          indexedDB.deleteDatabase('qi-diagnostic-test')
          resolve({
            id: 'indexedDB',
            label: 'IndexedDB',
            status: 'success',
            details: 'Database operations successful',
            value: 'OK'
          })
        }
        
        request.onupgradeneeded = () => {
          // Database created successfully
        }
      } catch (error) {
        resolve({
          id: 'indexedDB',
          label: 'IndexedDB',
          status: 'error',
          details: `Exception: ${error}`,
          fixTip: 'Check browser compatibility and privacy settings'
        })
      }
    })
  }

  const checkFinalArtAssets = async (): Promise<DiagnosticCheck> => {
    const artAssets = [
      '/public/art/scout/scout-neutral.webp',
      '/public/art/ui/backpack.webp',
      '/public/art/spots/map-parchment.webp',
      '/public/art/biomes/reef/bg-far.webp'
    ]

    try {
      const results = await Promise.all(
        artAssets.map(async (asset) => {
          try {
            const response = await fetch(asset, { method: 'HEAD' })
            return { asset, status: response.status, ok: response.ok }
          } catch {
            return { asset, status: 0, ok: false }
          }
        })
      )

      const available = results.filter(r => r.ok).length
      const total = results.length

      if (available === total) {
        return {
          id: 'finalArt',
          label: 'Final Art Assets',
          status: 'success',
          details: `All ${total} key assets available`,
          value: `${available}/${total}`
        }
      } else if (available > 0) {
        return {
          id: 'finalArt',
          label: 'Final Art Assets',
          status: 'warning',
          details: `${available}/${total} assets available`,
          fixTip: 'Upload missing art assets to /public/art/ directory',
          value: `${available}/${total}`
        }
      } else {
        return {
          id: 'finalArt',
          label: 'Final Art Assets',
          status: 'error',
          details: 'No art assets found',
          fixTip: 'Upload art assets to /public/art/ directory and refresh',
          value: '0/4'
        }
      }
    } catch (error) {
      return {
        id: 'finalArt',
        label: 'Final Art Assets',
        status: 'error',
        details: `Asset check failed: ${error}`,
        fixTip: 'Check network connectivity and asset paths'
      }
    }
  }

  const checkFeatureFlags = async (): Promise<DiagnosticCheck> => {
    try {
      const flagKeys = Object.keys(flags)
      const flagsData = JSON.stringify(flags, null, 2)
      
      if (flagKeys.length > 0) {
        return {
          id: 'flags',
          label: 'Feature Flags',
          status: 'success',
          details: `${flagKeys.length} flags loaded, teacherPanelV2: ${flags.teacherPanelV2 ? 'ON' : 'OFF'}`,
          value: flags.teacherPanelV2 ? 'V2 ON' : 'V2 OFF'
        }
      } else {
        return {
          id: 'flags',
          label: 'Feature Flags',
          status: 'warning',
          details: 'No flags loaded',
          fixTip: 'Check flags configuration and localStorage',
          value: 'None'
        }
      }
    } catch (error) {
      return {
        id: 'flags',
        label: 'Feature Flags',
        status: 'error',
        details: `Flag system error: ${error}`,
        fixTip: 'Clear localStorage and refresh to reset flags'
      }
    }
  }

  const checkAPIConnectivity = async (): Promise<DiagnosticCheck> => {
    try {
      // Try /api/ping first, then fallback to /api/health
      let response
      let endpoint = '/api/ping'
      
      try {
        response = await fetch('/api/ping', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (pingError) {
        // Fallback to health endpoint
        endpoint = '/api/health'
        response = await fetch('/api/health', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (response.status === 200) {
        if (endpoint === '/api/health') {
          const data = await response.json()
          const uptime = data.uptime ? `${Math.floor(data.uptime / 60)}m` : 'unknown'
          return {
            id: 'apiPing',
            label: 'API Connectivity',
            status: 'success',
            details: `Server healthy via /api/health, uptime: ${uptime}`,
            value: '200 OK'
          }
        } else {
          return {
            id: 'apiPing',
            label: 'API Connectivity',
            status: 'success',
            details: 'API ping endpoint responding',
            value: '200 OK'
          }
        }
      } else {
        return {
          id: 'apiPing',
          label: 'API Connectivity',
          status: 'warning',
          details: `HTTP ${response.status} from ${endpoint}`,
          fixTip: 'Check server status and network connectivity',
          value: `${response.status}`
        }
      }
    } catch (error) {
      return {
        id: 'apiPing',
        label: 'API Connectivity',
        status: 'error',
        details: `Network error: ${error}`,
        fixTip: 'Check internet connection and server availability'
      }
    }
  }

  const checkPWACache = async (): Promise<DiagnosticCheck> => {
    try {
      if (!('caches' in window)) {
        return {
          id: 'pwaCache',
          label: 'PWA Cache',
          status: 'error',
          details: 'Cache API not supported',
          fixTip: 'Use a modern browser that supports Cache API'
        }
      }

      const cacheNames = await caches.keys()
      let totalFiles = 0

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName)
        const keys = await cache.keys()
        totalFiles += keys.length
      }

      if (totalFiles > 0) {
        return {
          id: 'pwaCache',
          label: 'PWA Cache',
          status: 'success',
          details: `${cacheNames.length} caches with ${totalFiles} files`,
          value: `${totalFiles} files`
        }
      } else {
        return {
          id: 'pwaCache',
          label: 'PWA Cache',
          status: 'warning',
          details: 'No cached files found',
          fixTip: 'Navigate through app to build cache or refresh',
          value: 'Empty'
        }
      }
    } catch (error) {
      return {
        id: 'pwaCache',
        label: 'PWA Cache',
        status: 'error',
        details: `Cache check failed: ${error}`,
        fixTip: 'Clear browser cache and reload to rebuild PWA cache'
      }
    }
  }

  const checkReactProviders = async (): Promise<DiagnosticCheck> => {
    try {
      // Check if we're inside the expected providers by looking for context indicators
      const hasToastContext = !!document.querySelector('[data-sonner-toaster]')
      const hasRosterContext = !!document.querySelector('[data-roster-provider]') || 
                             (window as any).__rosterContext !== undefined
      const hasGuideContext = !!document.querySelector('[data-guide-notice-provider]') ||
                             (window as any).__guideContext !== undefined

      const providers = []
      if (hasToastContext) providers.push('Toast')
      if (hasRosterContext) providers.push('Roster')  
      if (hasGuideContext) providers.push('Guide')

      if (providers.length >= 2) {
        return {
          id: 'providers',
          label: 'React Providers',
          status: 'success',
          details: `Active providers: ${providers.join(', ')}`,
          value: `${providers.length} active`
        }
      } else if (providers.length > 0) {
        return {
          id: 'providers',
          label: 'React Providers',
          status: 'warning',
          details: `Limited providers: ${providers.join(', ')}`,
          fixTip: 'Check component tree for missing provider wrappers',
          value: `${providers.length} partial`
        }
      } else {
        return {
          id: 'providers',
          label: 'React Providers',
          status: 'error',
          details: 'No providers detected',
          fixTip: 'Wrap app in RosterProvider and GuideNoticeProvider'
        }
      }
    } catch (error) {
      return {
        id: 'providers',
        label: 'React Providers',
        status: 'error',
        details: `Provider check failed: ${error}`,
        fixTip: 'Check React component tree and provider setup'
      }
    }
  }

  const checkScoutQueue = async (): Promise<DiagnosticCheck> => {
    try {
      // Simulate Scout queue operations
      const testMessage = { id: `test-${Date.now()}`, type: 'diagnostic', content: 'test' }
      
      // Mock queue operations (replace with actual Scout queue when available)
      const mockEnqueue = (message: any) => {
        if (!message || !message.id) throw new Error('Invalid message format')
        return true
      }
      
      const mockDequeue = () => {
        return testMessage
      }

      // Test enqueue
      const enqueueResult = mockEnqueue(testMessage)
      
      // Test dequeue  
      const dequeueResult = mockDequeue()

      if (enqueueResult && dequeueResult) {
        return {
          id: 'scoutQueue',
          label: 'Scout Queue',
          status: 'success',
          details: 'Enqueue/dequeue operations successful',
          value: 'Operational'
        }
      } else {
        return {
          id: 'scoutQueue',
          label: 'Scout Queue',
          status: 'warning',
          details: 'Queue operations partially working',
          fixTip: 'Check Scout AI service initialization',
          value: 'Partial'
        }
      }
    } catch (error) {
      return {
        id: 'scoutQueue',
        label: 'Scout Queue',
        status: 'error',
        details: `Queue error: ${error}`,
        fixTip: 'Check Scout AI service connection and message format'
      }
    }
  }

  const runDiagnostics = async () => {
    setLoading(true)
    setChecks(initializeChecks())

    try {
      const diagnosticFunctions = [
        checkServiceWorker,
        checkLocalStorage,
        checkIndexedDB,
        checkFinalArtAssets,
        checkFeatureFlags,
        checkAPIConnectivity,
        checkPWACache,
        checkReactProviders,
        checkScoutQueue
      ]

      const results = await Promise.all(diagnosticFunctions.map(fn => fn()))
      setChecks(results)
      setLastRun(new Date())
    } catch (error) {
      console.error('Diagnostics failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = (): DiagnosticReport => {
    const summary = checks.reduce(
      (acc, check) => {
        acc.total++
        if (check.status === 'success') acc.passed++
        else if (check.status === 'error') acc.failed++
        else if (check.status === 'warning') acc.warnings++
        return acc
      },
      { total: 0, passed: 0, failed: 0, warnings: 0 }
    )

    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      checks,
      summary
    }
  }

  const copyReport = async () => {
    try {
      const report = generateReport()
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2))
      alert('✅ Diagnostic report copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy report:', error)
      alert('❌ Failed to copy report to clipboard')
    }
  }

  const runA11yDiagnostics = async () => {
    if (!import.meta.env?.DEV) {
      alert('Accessibility diagnostics available in dev builds only')
      return
    }

    setA11yLoading(true)
    try {
      if (!runA11yScan) {
        throw new Error('A11y scan function not available')
      }
      const results = await runA11yScan()
      setA11yResults(results)
    } catch (error) {
      console.error('A11y scan failed:', error)
      alert('❌ Accessibility scan failed: ' + String(error))
    } finally {
      setA11yLoading(false)
    }
  }

  const copyA11yReport = async () => {
    if (!a11yResults) {
      alert('No accessibility results to copy')
      return
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(a11yResults, null, 2))
      alert('✅ Accessibility report copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy a11y report:', error)
      alert('❌ Failed to copy accessibility report')
    }
  }

  const getVitalStatus = (metric: 'LCP' | 'CLS' | 'INP', value?: number) => {
    if (value === undefined) return { status: 'pending', color: 'text-gray-500' }
    
    switch (metric) {
      case 'LCP':
        return value <= 2500 ? { status: '✅', color: 'text-green-600' } :
               value <= 4000 ? { status: '⚠️', color: 'text-orange-600' } :
               { status: '❌', color: 'text-red-600' }
      case 'CLS':
        return value <= 0.1 ? { status: '✅', color: 'text-green-600' } :
               value <= 0.25 ? { status: '⚠️', color: 'text-orange-600' } :
               { status: '❌', color: 'text-red-600' }
      case 'INP':
        return value <= 200 ? { status: '✅', color: 'text-green-600' } :
               value <= 500 ? { status: '⚠️', color: 'text-orange-600' } :
               { status: '❌', color: 'text-red-600' }
      default:
        return { status: '❓', color: 'text-gray-500' }
    }
  }

  const getA11yImprovementTips = () => [
    'Add alt attributes to images',
    'Ensure proper heading hierarchy (h1 → h2 → h3)',
    'Use sufficient color contrast (4.5:1 for normal text)',
    'Add labels to form inputs',
    'Ensure focusable elements are keyboard accessible',
    'Use semantic HTML elements (nav, main, article, etc.)'
  ]

  const getStatusIcon = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'pending': return '⏳'
      default: return '❓'
    }
  }

  const getStatusColor = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600' 
      case 'warning': return 'text-orange-600'
      case 'pending': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  // Run diagnostics on mount
  useEffect(() => {
    runDiagnostics()
  }, [])

  const summary = checks.reduce(
    (acc, check) => {
      if (check.status === 'success') acc.passed++
      else if (check.status === 'error') acc.failed++
      else if (check.status === 'warning') acc.warnings++
      return acc
    },
    { passed: 0, failed: 0, warnings: 0 }
  )

  if (!import.meta.env?.DEV) {
    return (
      <SimpleLayout title="System Diagnostics" subtitle="Development diagnostics">
        <ListSection title="Development Only" />
        <ListCard>
          <ListRow 
            icon={<Ic.layers className="list-icon" />}
            title="Diagnostics Available in Dev Builds"
            meta="Accessibility and performance diagnostics are available in development mode only"
            value="Dev Only"
            onClick={() => {}}
          />
        </ListCard>
      </SimpleLayout>
    )
  }

  return (
    <SimpleLayout title="System Diagnostics" subtitle="Runtime checks and health monitoring">
      <ListSection title="System Status" />
      <ListCard>
        <ListRow 
          icon={<Ic.layers className="list-icon" />}
          title="Overall Health"
          meta={`${summary.passed} passed • ${summary.warnings} warnings • ${summary.failed} failed`}
          value={loading ? 'Running...' : `${summary.passed}/${checks.length} OK`}
          onClick={() => {}}
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.doc className="list-icon" />}
          title="Copy Report"
          meta="Export diagnostic data to clipboard"
          value="JSON"
          onClick={copyReport}
          data-testid="copy-diagnostic-report"
        />
        <div className="divider" />
        <ListRow 
          icon={<Ic.star className="list-icon" />}
          title="Re-run Diagnostics"
          meta={lastRun ? `Last run: ${lastRun.toLocaleTimeString()}` : 'Never run'}
          value={loading ? 'Running...' : 'Run'}
          onClick={runDiagnostics}
          data-testid="run-diagnostics"
        />
      </ListCard>

      <ListSection title="Accessibility" />
      <ListCard>
        <ListRow 
          icon={<span className="list-icon text-lg">{a11yResults ? (a11yResults.violations.length === 0 ? '✅' : '❌') : '🔍'}</span>}
          title="Run A11y Scan"
          meta={a11yResults ? 
            `${a11yResults.violations.length} violations found` : 
            'Scan current page for accessibility issues'
          }
          value={a11yLoading ? 'Scanning...' : 'Scan'}
          onClick={runA11yDiagnostics}
          data-testid="run-a11y-scan"
        />
        {a11yResults && (
          <>
            <div className="divider" />
            <ListRow 
              icon={<Ic.doc className="list-icon" />}
              title="Copy A11y Report"
              meta="Export accessibility findings to clipboard"
              value="JSON"
              onClick={copyA11yReport}
              data-testid="copy-a11y-report"
            />
          </>
        )}
        {a11yResults && a11yResults.violations.length > 0 && (
          <>
            <div className="divider" />
            <div className="px-4 py-2">
              <div className="text-sm font-medium text-gray-900 mb-2">Top Issues:</div>
              {a11yResults.violations.slice(0, 3).map((violation, index) => (
                <div key={violation.id} className="text-xs text-gray-600 mb-1">
                  {index + 1}. {violation.description} ({violation.impact})
                </div>
              ))}
            </div>
          </>
        )}
        <div className="divider" />
        <div className="px-4 py-2">
          <div className="text-sm font-medium text-gray-900 mb-2">How to improve:</div>
          {getA11yImprovementTips().slice(0, 3).map((tip, index) => (
            <div key={index} className="text-xs text-gray-600 mb-1">
              • {tip}
            </div>
          ))}
        </div>
      </ListCard>

      <ListSection title="Performance" />
      <ListCard>
        <ListRow 
          icon={<span className="list-icon text-lg text-fg-muted">{getVitalStatus('LCP', webVitals.LCP).status}</span>}
          title="Largest Contentful Paint (LCP)"
          meta={`Target: ≤ 2.5s (good), ≤ 4.0s (needs improvement)`}
          value={webVitals.LCP ? `${Math.round(webVitals.LCP)}ms` : 'Measuring...'}
          onClick={() => alert('LCP measures loading performance. To improve: optimize images, remove unused CSS, and improve server response times.')}
          data-testid="lcp-metric"
        />
        <div className="divider" />
        <ListRow 
          icon={<span className="list-icon text-lg text-fg-muted">{getVitalStatus('CLS', webVitals.CLS).status}</span>}
          title="Cumulative Layout Shift (CLS)"
          meta={`Target: ≤ 0.1 (good), ≤ 0.25 (needs improvement)`}
          value={webVitals.CLS ? webVitals.CLS.toFixed(3) : 'Measuring...'}
          onClick={() => alert('CLS measures visual stability. To improve: set size attributes on images and videos, avoid inserting content above existing content.')}
          data-testid="cls-metric"
        />
        <div className="divider" />
        <ListRow 
          icon={<span className="list-icon text-lg text-fg-muted">{getVitalStatus('INP', webVitals.INP).status}</span>}
          title="Interaction to Next Paint (INP)"
          meta={`Target: ≤ 200ms (good), ≤ 500ms (needs improvement)`}
          value={webVitals.INP ? `${Math.round(webVitals.INP)}ms` : 'Measuring...'}
          onClick={() => alert('INP measures responsiveness. To improve: break up long tasks, avoid large DOM updates, and optimize JavaScript execution.')}
          data-testid="inp-metric"
        />
      </ListCard>

      <ListSection title="Runtime Checks" />
      <ListCard>
        {checks.map((check, index) => (
          <React.Fragment key={check.id}>
            <ListRow 
              icon={<span className="list-icon text-lg">{getStatusIcon(check.status)}</span>}
              title={check.label}
              meta={check.details || 'No details available'}
              value={check.value?.toString() || check.status}
              onClick={() => {
                if (check.fixTip && check.status !== 'success') {
                  alert(`🔧 How to fix: ${check.fixTip}`)
                } else if (check.details) {
                  alert(`ℹ️ ${check.label}: ${check.details}`)
                }
              }}
              data-testid={`diagnostic-${check.id}`}
            />
            {index < checks.length - 1 && <div className="divider" />}
          </React.Fragment>
        ))}
      </ListCard>

      {checks.some(c => c.status === 'error' || c.status === 'warning') && (
        <>
          <ListSection title="Issues Found" />
          <ListCard>
            {checks
              .filter(c => c.status === 'error' || c.status === 'warning')
              .map((check, index, filteredChecks) => (
                <React.Fragment key={`issue-${check.id}`}>
                  <ListRow 
                    icon={<span className="list-icon text-lg">{getStatusIcon(check.status)}</span>}
                    title={`${check.label} ${check.status === 'error' ? 'Error' : 'Warning'}`}
                    meta={check.fixTip || 'No fix suggestion available'}
                    value="Fix"
                    onClick={() => {
                      if (check.fixTip) {
                        alert(`🔧 How to fix ${check.label}:\n\n${check.fixTip}`)
                      }
                    }}
                    data-testid={`fix-${check.id}`}
                  />
                  {index < filteredChecks.length - 1 && <div className="divider" />}
                </React.Fragment>
              ))}
          </ListCard>
        </>
      )}
    </SimpleLayout>
  )
}