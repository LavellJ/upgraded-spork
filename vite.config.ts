import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// Strip test files from the browser bundle
function ignoreTestsPlugin() {
  const TEST_RE = /(\.test|\.spec)\.[tj]sx?$/i
  return {
    name: 'ignore-tests-in-build',
    enforce: 'pre' as const,
    resolveId(source: string) {
      if (
        TEST_RE.test(source) ||
        source.includes('__tests__/') ||
        source.startsWith('client/test/') ||
        source.includes('/test/')
      ) return '\0ignore-test'
      return null
    },
    load(id: string) {
      if (id === '\0ignore-test') return 'export default {}'
      return null
    },
  }
}

export default defineConfig({
  root: 'client',
  plugins: [ignoreTestsPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./client/src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    cssTarget: 'es2022',
    outDir: '../dist/public',
    sourcemap: false,
    emptyOutDir: true,
  },
})
