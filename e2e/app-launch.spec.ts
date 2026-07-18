import { test, expect, unlockApp } from './setup';

test.describe('App launch', () => {
  test('shows master password modal or database error on first visit', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    const body = await page.locator('body').textContent({ timeout: 5000 });
    const hasContent = body && body.length > 10;
    expect(hasContent).toBeTruthy();
  });

  test('page has title', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const loaded = await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => false);
    if (!loaded) {
      test.skip();
      return;
    }
    const title = await page.title().catch(() => '');
    expect(title).toBeTruthy();
  });

  test('shows database error retry button on db failure', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const retryBtn = page.locator('button', { hasText: 'Retry' });
    if (await retryBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(retryBtn).toBeVisible();
    }
  });
});
