import { test, expect, unlockApp } from './setup';

test.describe('Memory management', () => {
  test('memory section is accessible', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1000);

    const memorySection = page.locator('text=/memory|structured/i').first();
    await expect(memorySection).toBeVisible({ timeout: 5000 });
  });

  test('category select is accessible', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1000);

    const categorySelect = page.locator('select[aria-label*="category" i], select[aria-label*="memory" i]').first();
    await expect(categorySelect).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Export functionality', () => {
  test('export buttons are visible', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1000);

    const exportBtn = page.locator('button', { hasText: /export/i }).first();
    await expect(exportBtn).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Cloud sync', () => {
  test('sync section is accessible', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1000);

    const syncSection = page.locator('text=/sync|cloud/i').first();
    await expect(syncSection).toBeVisible({ timeout: 5000 });
  });
});
