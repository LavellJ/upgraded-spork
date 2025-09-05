import { useMemo } from 'react'

export function usePrefersReducedMotion(): boolean {
  return useMemo(() => {
    if (typeof window === 'undefined') return false
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    return mq?.matches ?? false
  }, [])
}