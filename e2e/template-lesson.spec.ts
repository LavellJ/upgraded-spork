/**
 * End-to-End Tests for Template Lesson Creation
 * Tests the full workflow from Content Studio to lesson generation
 */

import { test, expect, type Page } from '@playwright/test';

test.describe('Template Lesson Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app and wait for it to load
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should access Content Studio from Teacher Panel', async ({ page }) => {
    // Open Teacher Panel
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.waitForSelector('[data-testid="teacher-panel"]');

    // Navigate to Studio tab
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');

    // Verify Content Studio is visible
    await expect(page.locator('[data-testid="content-studio"]')).toBeVisible();
    await expect(page.locator('text=Content Studio')).toBeVisible();
  });

  test('should display Create from Template button', async ({ page }) => {
    // Navigate to Content Studio
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');

    // Check for Create from Template button
    await expect(page.locator('[data-testid="button-create-template"]')).toBeVisible();
    await expect(page.locator('text=Create from Template')).toBeVisible();
  });

  test('should open template creation dialog', async ({ page }) => {
    // Navigate to Content Studio and click Create from Template
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');
    
    await page.locator('[data-testid="button-create-template"]').click();

    // Verify dialog opens
    await expect(page.locator('text=Create Lesson from Template')).toBeVisible();
    await expect(page.locator('[data-testid="input-template-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-template-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="input-template-std-tag"]')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Open template creation dialog
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');
    await page.locator('[data-testid="button-create-template"]').click();

    // Try to create without filling required fields
    await page.locator('[data-testid="button-template-create"]').click();

    // Should show validation error
    await expect(page.locator('text=Please fill in all required fields')).toBeVisible();
  });

  test('should create lesson with valid input', async ({ page }) => {
    // Navigate to template creation
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');
    await page.locator('[data-testid="button-create-template"]').click();

    // Fill in required fields
    await page.locator('[data-testid="input-template-id"]').fill('test_addition_basic');
    await page.locator('[data-testid="input-template-title"]').fill('Basic Addition');
    await page.locator('[data-testid="input-template-std-tag"]').fill('M.ADD.BASIC.3');

    // Select biome
    await page.locator('[data-testid="select-template-biome"]').click();
    await page.locator('text=🏜️ Desert (All subjects)').click();

    // Fill optional fields
    await page.locator('[data-testid="input-template-teach"]').fill('Learn to add numbers using counting strategies');
    await page.locator('[data-testid="input-template-why-this"]').fill('Addition is fundamental for all math operations');
    await page.locator('[data-testid="input-template-next-step"]').fill('Practice subtraction next');

    // Create the lesson
    await page.locator('[data-testid="button-template-create"]').click();

    // Should show success message
    await expect(page.locator('text=Template lesson created successfully!')).toBeVisible();
  });

  test('should handle different biome selections', async ({ page }) => {
    // Open template creation dialog
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');
    await page.locator('[data-testid="button-create-template"]').click();

    // Test each biome option
    const biomes = [
      { name: '🪸 Reef (Science)', value: 'reef' },
      { name: '⛰️ Alpine (Math)', value: 'alpine' },
      { name: '🌲 Forest (English)', value: 'forest' },
      { name: '🏜️ Desert (All subjects)', value: 'desert' }
    ];

    for (const biome of biomes) {
      await page.locator('[data-testid="select-template-biome"]').click();
      await page.locator(`text=${biome.name}`).click();
      
      // Verify selection was made
      await expect(page.locator('[data-testid="select-template-biome"]')).toContainText(biome.name);
    }
  });

  test('should cancel template creation', async ({ page }) => {
    // Open template creation dialog
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');
    await page.locator('[data-testid="button-create-template"]').click();

    // Fill some fields
    await page.locator('[data-testid="input-template-id"]').fill('cancelled_lesson');
    await page.locator('[data-testid="input-template-title"]').fill('This Should Be Cancelled');

    // Cancel the dialog
    await page.locator('[data-testid="button-template-cancel"]').click();

    // Dialog should close
    await expect(page.locator('text=Create Lesson from Template')).not.toBeVisible();
    
    // Reopening should show empty form
    await page.locator('[data-testid="button-create-template"]').click();
    await expect(page.locator('[data-testid="input-template-id"]')).toHaveValue('');
    await expect(page.locator('[data-testid="input-template-title"]')).toHaveValue('');
  });

  test('should handle special characters in input', async ({ page }) => {
    // Open template creation dialog
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');
    await page.locator('[data-testid="button-create-template"]').click();

    // Fill with special characters
    await page.locator('[data-testid="input-template-id"]').fill('test_special-chars_2024.v1');
    await page.locator('[data-testid="input-template-title"]').fill('Test: Special "Characters" & More!');
    await page.locator('[data-testid="input-template-std-tag"]').fill('SPECIAL.CHAR-TEST.1');

    // Should accept and create lesson
    await page.locator('[data-testid="button-template-create"]').click();
    await expect(page.locator('text=Template lesson created successfully!')).toBeVisible();
  });

  test('should display template information panel', async ({ page }) => {
    // Open template creation dialog
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');
    await page.locator('[data-testid="button-create-template"]').click();

    // Check for info panel
    await expect(page.locator('text=Template Information')).toBeVisible();
    await expect(page.locator('text=The template system will automatically generate')).toBeVisible();
    await expect(page.locator('text=guided practice steps')).toBeVisible();
    await expect(page.locator('text=independent practice questions')).toBeVisible();
    await expect(page.locator('text=exit tickets')).toBeVisible();
  });

  test('should show lesson after creation in studio', async ({ page }) => {
    // Create a lesson through template
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');
    await page.locator('[data-testid="button-create-template"]').click();

    // Fill required fields for a test lesson
    await page.locator('[data-testid="input-template-id"]').fill('e2e_test_lesson');
    await page.locator('[data-testid="input-template-title"]').fill('E2E Test Lesson');
    await page.locator('[data-testid="input-template-std-tag"]').fill('E2E.TEST.1');

    await page.locator('[data-testid="button-template-create"]').click();
    await expect(page.locator('text=Template lesson created successfully!')).toBeVisible();

    // In a real implementation, the lesson would be added to the lesson list
    // and automatically selected. For now, we just verify the success message.
    await expect(page.locator('text=E2E Test Lesson')).toBeVisible();
  });

  test('should validate lesson ID format', async ({ page }) => {
    // Open template creation dialog
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');
    await page.locator('[data-testid="button-create-template"]').click();

    // Test various ID formats
    const validIds = ['math_frac_equiv_3', 'eng-read-main-3', 'sci.habitat.3', 'test_lesson_v2.1'];
    
    for (const id of validIds) {
      await page.locator('[data-testid="input-template-id"]').clear();
      await page.locator('[data-testid="input-template-id"]').fill(id);
      await page.locator('[data-testid="input-template-title"]').fill('Test Title');
      await page.locator('[data-testid="input-template-std-tag"]').fill('TEST.STD.1');
      
      await page.locator('[data-testid="button-template-create"]').click();
      await expect(page.locator('text=Template lesson created successfully!')).toBeVisible();
      
      // Reset for next test
      await page.locator('[data-testid="button-create-template"]').click();
    }
  });

  test('should handle textarea overflow for long content', async ({ page }) => {
    // Open template creation dialog
    await page.locator('[data-testid="teacher-panel-toggle"]').click();
    await page.locator('[data-testid="tab-studio"]').click();
    await page.waitForSelector('[data-testid="content-studio"]');
    await page.locator('[data-testid="button-create-template"]').click();

    // Fill with long content
    const longText = 'This is a very long description that might overflow the input field. '.repeat(10);
    
    await page.locator('[data-testid="input-template-id"]').fill('long_content_test');
    await page.locator('[data-testid="input-template-title"]').fill('Long Content Test');
    await page.locator('[data-testid="input-template-std-tag"]').fill('LONG.CONTENT.1');
    await page.locator('[data-testid="input-template-teach"]').fill(longText);
    await page.locator('[data-testid="input-template-why-this"]').fill(longText);
    await page.locator('[data-testid="input-template-next-step"]').fill(longText);

    // Should still create lesson successfully
    await page.locator('[data-testid="button-template-create"]').click();
    await expect(page.locator('text=Template lesson created successfully!')).toBeVisible();
  });
});