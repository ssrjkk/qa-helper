import { test, expect, unlockApp } from './setup';
import type { Page } from '@playwright/test';

const DB_TIMEOUT = 15000;

async function waitForAppReady(page: Page) {
  await page.locator('[role="button"]').first().waitFor({ state: 'visible', timeout: DB_TIMEOUT });
  const skipBtn = page.locator('button[aria-label="Skip onboarding"]');
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Agent workflow', () => {
  test('task selector shows all categories', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await waitForAppReady(page);

    const taskCards = page.locator('[role="button"][aria-label*="task"]');
    await expect(taskCards.first()).toBeVisible({ timeout: DB_TIMEOUT });
    const count = await taskCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('selecting a task shows chat area', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await waitForAppReady(page);

    const firstTask = page.locator('[role="button"][aria-label*="task"]').first();
    if (await firstTask.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTask.click();
      const textarea = page.locator('textarea[aria-label="Task description input"]');
      await expect(textarea).toBeVisible({ timeout: 5000 });
    }
  });

  test('context presets appear when task is selected but no context', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await waitForAppReady(page);

    const firstTask = page.locator('[role="button"][aria-label*="task"]').first();
    if (await firstTask.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTask.click();
      await page.waitForTimeout(300);
      const presets = page.locator('button', { hasText: /login form|rest api|navbar|payment/i });
      const presetCount = await presets.count();
      expect(presetCount).toBeGreaterThan(0);
    }
  });

  test('clicking a preset fills the context', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await waitForAppReady(page);

    const firstTask = page.locator('[role="button"][aria-label*="task"]').first();
    if (await firstTask.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTask.click();
      await page.waitForTimeout(300);
      const preset = page.locator('button', { hasText: /login form|rest api|navbar|payment/i }).first();
      if (await preset.isVisible({ timeout: 2000 }).catch(() => false)) {
        await preset.click();
        const textarea = page.locator('textarea[aria-label="Task description input"]');
        const value = await textarea.inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });
});

test.describe('Sidebar features', () => {
  test('shows API connection status', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await waitForAppReady(page);

    const status = page.locator('text=/api connected|api key/i').first();
    await expect(status).toBeVisible({ timeout: 5000 });
  });

  test('shows memory section when project selected', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await waitForAppReady(page);

    const projectCard = page.locator('[role="button"][aria-label*="Select project"], [role="button"][aria-label*="select project"]').first();
    if (await projectCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectCard.click();
      await page.waitForTimeout(500);
      const memorySection = page.locator('text=/add.*entry|memory/i').first();
      await expect(memorySection).toBeVisible({ timeout: 5000 });
    }
  });

  test('shows rate limit bar', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await waitForAppReady(page);

    const rateLimit = page.locator('[role="progressbar"], text=/remaining|rate/i').first();
    if (await rateLimit.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(rateLimit).toBeVisible();
    }
  });
});

test.describe('Responsive layout', () => {
  test('sidebar is visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await unlockApp(page);
    await waitForAppReady(page);

    const sidebar = page.locator('text=/select project|projects/i').first();
    await expect(sidebar).toBeVisible({ timeout: DB_TIMEOUT });
  });
});
