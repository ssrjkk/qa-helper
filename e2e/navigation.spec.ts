import { test, expect, unlockApp } from './setup';

test.describe('Tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(500);
  });

  test('switch between New and History tabs', async ({ page }) => {
    const historyTab = page.locator('[role="tab"]', { hasText: /history/i }).first();
    await expect(historyTab).toBeVisible({ timeout: 5000 });

    await historyTab.click();
    await page.waitForTimeout(300);

    const newTab = page.locator('[role="tab"]', { hasText: /new/i }).first();
    await expect(newTab).toBeVisible({ timeout: 5000 });

    await newTab.click();
    await page.waitForTimeout(300);
    await expect(newTab).toHaveAttribute('aria-selected', 'true');
  });

  test('keyboard shortcut Escape closes modals', async ({ page }) => {
    const apiKeyBtn = page.locator('button', { hasText: /api key|api required/i }).first();
    await expect(apiKeyBtn).toBeVisible({ timeout: 5000 });

    await apiKeyBtn.click();
    await page.waitForTimeout(500);

    const modal = page.locator('[role="dialog"], .fixed').first();
    await expect(modal).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(modal).not.toBeVisible();
  });
});
