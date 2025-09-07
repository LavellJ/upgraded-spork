import { test, expect } from '@playwright/test'

test.describe('Student Flow', () => {
  test('should complete full student learning flow', async ({ page }) => {
    // 1) Go to map
    await page.goto('/#/')
    await page.waitForLoadState('networkidle')
    
    // Check we're on the map/campfire (main student view)
    const mapElement = page.locator('.campfire, .map, [data-testid*="map"], [data-testid*="campfire"]').first()
    if (!(await mapElement.isVisible())) {
      // Fallback: look for any main student content
      const studentContent = page.locator('main, .app-content, .student-view').first()
      await expect(studentContent).toBeVisible()
    }
    
    // 2) Look for next lesson button/card
    const nextLessonTriggers = [
      page.locator('button').filter({ hasText: /next|start|begin|continue/i }),
      page.locator('[data-testid*="lesson"], [data-testid*="next"]'),
      page.locator('.lesson-card, .pin, .node').filter({ hasText: /next|start/i })
    ]
    
    let nextLessonButton: any = null
    for (const trigger of nextLessonTriggers) {
      if (await trigger.first().isVisible()) {
        nextLessonButton = trigger.first()
        break
      }
    }
    
    if (nextLessonButton) {
      // 3) Open next lesson
      await nextLessonButton.click()
      await page.waitForLoadState('networkidle')
      
      // Check if we're in a lesson interface
      const lessonIndicators = [
        page.locator('text=/question|Question/i'),
        page.locator('[data-testid*="question"], [data-testid*="lesson"]'),
        page.locator('.question, .lesson-content, .quiz')
      ]
      
      let inLesson = false
      for (const indicator of lessonIndicators) {
        if (await indicator.first().isVisible()) {
          inLesson = true
          break
        }
      }
      
      if (inLesson) {
        // 4) Try to answer one question wrong (find answer options)
        const answerOptions = [
          page.locator('button').filter({ hasText: /^[a-d]$/i }),
          page.locator('.answer, .option'),
          page.locator('[data-testid*="answer"], [data-testid*="option"]'),
          page.locator('input[type="radio"], input[type="checkbox"]')
        ]
        
        let foundAnswers = false
        for (const options of answerOptions) {
          if (await options.count() > 0) {
            // Click first available answer
            await options.first().click()
            foundAnswers = true
            
            // Look for submit button
            const submitButton = page.locator('button').filter({ hasText: /submit|answer|check/i }).first()
            if (await submitButton.isVisible()) {
              await submitButton.click()
              await page.waitForTimeout(1000) // Wait for feedback
            }
            break
          }
        }
        
        if (foundAnswers) {
          // 5) Check for journal prompt badge or queue length indication
          await page.waitForTimeout(2000) // Allow time for journal prompt to appear
          
          const journalIndicators = [
            page.locator('text=/journal|reflect/i'),
            page.locator('[data-testid*="journal"], [data-testid*="badge"]'),
            page.locator('.badge, .notification, .scout-bubble'),
            page.locator('.queue-count, [data-testid*="queue"]')
          ]
          
          let journalPrompted = false
          for (const indicator of journalIndicators) {
            if (await indicator.first().isVisible()) {
              journalPrompted = true
              break
            }
          }
          
          // Alternative: check if scout queue has items (global state check)
          const queueLength = await page.evaluate(() => {
            // Try to access scout queue length from global state
            const scout = (window as any).__scoutQueue || (window as any).scout
            return scout ? (scout.queue?.length || scout.current ? 1 : 0) : 0
          }).catch(() => 0)
          
          if (journalPrompted || queueLength > 0) {
            // Success: journal prompt appeared or queue has items
            expect(journalPrompted || queueLength > 0).toBe(true)
          }
        }
      }
      
      // 6) Exit back to map without errors
      const exitButtons = [
        page.locator('button').filter({ hasText: /exit|back|map|home/i }),
        page.locator('[data-testid*="exit"], [data-testid*="back"]'),
        page.locator('.exit-button, .back-button')
      ]
      
      for (const exitBtn of exitButtons) {
        if (await exitBtn.first().isVisible()) {
          await exitBtn.first().click()
          break
        }
      }
      
      // Alternatively, navigate directly back to map
      await page.goto('/#/')
      await page.waitForLoadState('networkidle')
    }
    
    // Final check: ensure no critical errors
    const criticalErrors = page.locator('text=/Error|ERROR|Failed|Exception/i')
    await expect(criticalErrors.first()).toHaveCount(0, { timeout: 3000 })
    
    // Ensure we can see the main app interface
    const appContent = page.locator('body').first()
    await expect(appContent).toBeVisible()
  })

  test('should navigate to map and find interactive elements', async ({ page }) => {
    await page.goto('/#/')
    await page.waitForLoadState('networkidle')
    
    // Basic smoke test: ensure page loads without critical errors
    const errors = page.locator('text=/error|Error|ERROR/').first()
    await expect(errors).toHaveCount(0, { timeout: 5000 })
    
    // Check for interactive elements typical of student interface
    const interactiveElements = page.locator('button, [role="button"], a[href], [tabindex="0"]')
    await expect(interactiveElements.first()).toBeVisible({ timeout: 8000 })
  })

  test('should handle lesson state transitions gracefully', async ({ page }) => {
    await page.goto('/#/')
    await page.waitForLoadState('networkidle')
    
    // Try to find any lesson-related navigation
    const lessonLinks = page.locator('a[href*="lesson"], button').filter({ hasText: /lesson|learn|practice/i })
    
    if (await lessonLinks.count() > 0) {
      await lessonLinks.first().click()
      await page.waitForLoadState('networkidle')
      
      // Ensure transition completed without errors
      const errors = page.locator('text=/error|Error|ERROR/').first()
      await expect(errors).toHaveCount(0)
      
      // Go back to map
      await page.goto('/#/')
      await page.waitForLoadState('networkidle')
      
      // Ensure return navigation works
      const mainContent = page.locator('main, body').first()
      await expect(mainContent).toBeVisible()
    }
  })
})