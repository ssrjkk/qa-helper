import { test, expect, unlockApp } from './setup';

test.describe('Responsive layout', () => {
  test('renders correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1500);

    const root = page.locator('#root');
    await expect(root).toBeVisible();

    // Should not have horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('renders correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1500);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('renders correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1500);

    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });
});
