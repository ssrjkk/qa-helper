import { test, expect } from '@playwright/test';

test.describe('QA Copilot', () => {
  test('loads the application', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});
