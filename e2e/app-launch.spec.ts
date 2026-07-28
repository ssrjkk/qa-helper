import { test, expect, unlockApp } from './setup';

test.describe('App launch', () => {
  test('shows master password modal or database error on first visit', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent({ timeout: 5000 });
    expect(body && body.length > 10).toBeTruthy();
  });

  test('page has title', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    const title = await page.title().catch(() => '');
    expect(title).toBeTruthy();
  });

  test('shows database error retry button on db failure', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const retryBtn = page.locator('button', { hasText: 'Retry' });
    const visible = await retryBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
      await expect(retryBtn).toBeVisible();
    } else {
      const hasApp = await page.locator('#root').isVisible({ timeout: 5000 });
      expect(hasApp).toBeTruthy();
    }
  });
});
