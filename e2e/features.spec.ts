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

    const memoryAccordion = page.locator('button', { hasText: 'Structured Memory' }).first();
    await expect(memoryAccordion).toBeVisible({ timeout: 5000 });
    await memoryAccordion.click();

    const categorySelect = page.locator('select[aria-label="Memory category"]');
    await expect(categorySelect).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Export functionality', () => {
  test('export buttons are visible', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1000);

    const teamAccordion = page.locator('button', { hasText: 'Team Features' }).first();
    await expect(teamAccordion).toBeVisible({ timeout: 5000 });
    await teamAccordion.click();

    const exportTab = page.locator('[role="tab"]', { hasText: /export/i }).first();
    await expect(exportTab).toBeVisible({ timeout: 5000 });
    await exportTab.click();

    const exportLabel = page.locator('text=Export Project').first();
    await expect(exportLabel).toBeVisible({ timeout: 5000 });
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
