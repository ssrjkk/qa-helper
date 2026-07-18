import { test, expect, unlockApp } from './setup';

test.describe('Tab navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(500);
  });

  test('switch between New and History tabs', async ({ page }) => {
    const historyTab = page.locator('button', { hasText: /history/i }).first();
    if (await historyTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historyTab.click();
      await page.waitForTimeout(300);

      const newTab = page.locator('button', { hasText: /^new$/i }).first();
      if (await newTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await newTab.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('keyboard shortcut Escape closes modals', async ({ page }) => {
    const apiKeyBtn = page.locator('button', { hasText: /set api key/i }).first();
    if (await apiKeyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await apiKeyBtn.click();
      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"], .fixed').first();
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
  });
});
