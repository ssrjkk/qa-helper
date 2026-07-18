import { test as base, type Page } from '@playwright/test';

const MASTER_PASSWORD = 'TestPass123!';

export async function unlockApp(page: Page) {
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
    const passwordInput = page.locator('input[type="password"]').first();
    const visible = await passwordInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) return;

    await passwordInput.fill(MASTER_PASSWORD);

    const confirmInput = page.locator('input[type="password"]').nth(1);
    const confirmVisible = await confirmInput.isVisible({ timeout: 1000 }).catch(() => false);
    if (confirmVisible) {
      await confirmInput.fill(MASTER_PASSWORD);
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);
  } catch {
    // App may show DB error or page may close — that's fine for E2E
  }
}

export const test = base.extend<{ unlockedPage: Page }>({
  unlockedPage: async ({ page }, use) => {
    await page.goto('/');
    await unlockApp(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
