import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getSessionId, __resetSessionIdForTests } from '../src/analytics/session'

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
})

describe('session id', () => {
  beforeEach(() => {
    __resetSessionIdForTests()
    vi.clearAllMocks()
  })

  it('stays stable within session', () => {
    const a = getSessionId()
    const b = getSessionId()
    expect(a).toBe(b)
  })

  it('can be reset for tests', () => {
    const mockUuid = vi.mocked(crypto.randomUUID)
    mockUuid.mockReturnValueOnce('session-first')
    mockUuid.mockReturnValueOnce('session-second')
    
    const a = getSessionId()
    __resetSessionIdForTests()
    const b = getSessionId()
    expect(a).not.toBe(b)
  })

  it('returns a stable string within a session', () => {
    const sessionId = getSessionId()
    
    expect(typeof sessionId).toBe('string')
    expect(sessionId.length).toBeGreaterThan(0)
    expect(sessionId).toBe('test-uuid-123')
    
    // Multiple calls should return same value
    const sessionId2 = getSessionId()
    expect(sessionId2).toBe(sessionId)
    
    // Should only call randomUUID once
    expect(crypto.randomUUID).toHaveBeenCalledOnce()
  })

  it('handles missing crypto.randomUUID gracefully', () => {
    // Remove crypto.randomUUID
    const originalCrypto = global.crypto
    delete (global as any).crypto
    
    const sessionId = getSessionId()
    
    // Should generate a fallback UUID
    expect(sessionId).toBeTruthy()
    expect(typeof sessionId).toBe('string')
    expect(sessionId.length).toBeGreaterThan(10)
    // Should match UUID format
    expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    
    // Restore crypto
    global.crypto = originalCrypto
  })

  it('persists across module reloads via global state', () => {
    const sessionId1 = getSessionId()
    
    // Check global state
    const g = globalThis as any
    expect(g.__qiSessionId).toBe(sessionId1)
    
    // Simulate module reload by checking global first
    const sessionId2 = getSessionId()
    expect(sessionId2).toBe(sessionId1)
  })
})