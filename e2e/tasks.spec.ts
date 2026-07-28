import { test, expect, unlockApp } from './setup';

test.describe('Task selection', () => {
  test('displays task categories', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1000);

    const body = await page.locator('body').textContent({ timeout: 5000 });
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(50);
  });

  test('filter tasks by search', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="search" i]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    await searchInput.fill('bug');
    await page.waitForTimeout(300);

    const bugCard = page.locator('text=/bug report/i').first();
    await expect(bugCard).toBeVisible({ timeout: 3000 });
  });

  test('select a task card', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    await page.waitForLoadState('domcontentloaded', { timeout: 5000 });

    const taskCard = page.locator('text=/bug report|test plan|test cases/i').first();
    await expect(taskCard).toBeVisible({ timeout: 5000 });

    await taskCard.click();

    const chatArea = page.locator('textarea').first();
    await expect(chatArea).toBeVisible({ timeout: 5000 });
  });
});
