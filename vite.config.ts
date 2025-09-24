import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// A tiny plugin that strips test files from the client bundle.
// It maps any import that matches *.spec|*.test or __tests__/ to an empty module.
function ignoreTestsPlugin() {
  const TEST_RE = /(\.test|\.spec)\.[tj]sx?$/i
  return {
    name: 'ignore-tests-in-build',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (TEST_RE.test(source) || source.includes('__tests__/') || source.startsWith('client/test/') || source.includes('/test/')) {
        return '\0ignore-test'
      }
      return null
    },
    load(id: string) {
      if (id === '\0ignore-test') {
        return 'export default {}'
      }
      return null
    },
  }
}

export default defineConfig({
  root: 'client',
  plugins: [ignoreTestsPlugin(), react()],
  build: {
    // Modern target so top-level await is fine
    target: 'es2022',
    cssTarget: 'es2022',
    outDir: '../dist/public',
    sourcemap: false,
    emptyOutDir: true,
  },
  preview: {
    // Playwright launches preview on PORT from env (4173 in CI)
  },
})
