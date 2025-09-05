import { describe, it, expect, vi, beforeEach } from 'vitest'
import { confirm } from '../src/ui2/Confirm'

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  }
})

describe('Confirm dialog', () => {
  beforeEach(() => {
    // Clean up any existing dialogs
    document.body.innerHTML = ''
  })

  it('resolves true when confirm button is clicked', async () => {
    const promise = confirm({
      title: 'Test Dialog',
      body: 'Test body text'
    })

    // Wait for dialog to be rendered
    await new Promise(resolve => setTimeout(resolve, 0))
    
    const confirmButton = document.querySelector('button:last-child') as HTMLButtonElement
    expect(confirmButton).toBeTruthy()
    expect(confirmButton.textContent).toBe('Confirm')
    
    confirmButton.click()
    
    const result = await promise
    expect(result).toBe(true)
  })

  it('resolves false when cancel button is clicked', async () => {
    const promise = confirm({
      title: 'Test Dialog',
      body: 'Test body text'
    })

    // Wait for dialog to be rendered
    await new Promise(resolve => setTimeout(resolve, 0))
    
    const cancelButton = document.querySelector('button:first-child') as HTMLButtonElement
    expect(cancelButton).toBeTruthy()
    expect(cancelButton.textContent).toBe('Cancel')
    
    cancelButton.click()
    
    const result = await promise
    expect(result).toBe(false)
  })

  it('renders custom button text', async () => {
    const promise = confirm({
      title: 'Delete Item',
      body: 'This action cannot be undone',
      ok: 'Delete',
      cancel: 'Keep'
    })

    // Wait for dialog to be rendered
    await new Promise(resolve => setTimeout(resolve, 0))
    
    expect(document.querySelector('button:first-child')?.textContent).toBe('Keep')
    expect(document.querySelector('button:last-child')?.textContent).toBe('Delete')
    
    // Clean up
    const cancelButton = document.querySelector('button:first-child') as HTMLButtonElement
    cancelButton.click()
    await promise
  })

  it('has proper accessibility attributes', async () => {
    const promise = confirm({
      title: 'Test Dialog'
    })

    // Wait for dialog to be rendered
    await new Promise(resolve => setTimeout(resolve, 0))
    
    const dialog = document.querySelector('[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
    
    // Clean up
    const cancelButton = document.querySelector('button:first-child') as HTMLButtonElement
    cancelButton.click()
    await promise
  })
})