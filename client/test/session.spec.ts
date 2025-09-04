import { describe, it, expect } from 'vitest'
import { getSessionId, __resetSessionIdForTests } from '../src/analytics/session'

describe('session id', () => {
  it('stays stable within session', () => {
    const a = getSessionId()
    const b = getSessionId()
    expect(a).toBe(b)
  })
  it('can be reset for tests', () => {
    const a = getSessionId()
    __resetSessionIdForTests()
    const b = getSessionId()
    expect(a).not.toBe(b)
  })
})