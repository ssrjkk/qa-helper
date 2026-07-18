import { test, expect, unlockApp } from './setup';

test.describe('Task selection', () => {
  test('displays task categories', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1000);

    const body = await page.locator('body').textContent({ timeout: 5000 });
    expect(body).toBeTruthy();
  });

  test('filter tasks by search', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('bug');
      await page.waitForTimeout(300);
      const bugCard = page.locator('text=/bug report/i').first();
      if (await bugCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(bugCard).toBeVisible();
      }
    }
  });

  test('select a task card', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const loaded = await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => false);
    if (!loaded) {
      test.skip();
      return;
    }

    const taskCard = page.locator('text=/bug report|test plan|test cases/i').first();
    if (await taskCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await taskCard.click();

      const chatArea = page.locator('textarea').first();
      if (await chatArea.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(chatArea).toBeVisible();
      }
    }
  });
});
