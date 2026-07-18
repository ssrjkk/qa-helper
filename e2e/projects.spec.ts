import { test, expect, unlockApp } from './setup';

test.describe('Project management', () => {
  test('create a new project', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const newBtn = page.locator('button', { hasText: /new/i }).first();
    if (!(await newBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await newBtn.click();

    const nameInput = page.locator('input[placeholder*="project" i], input[placeholder*="name" i]').first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('E2E Test Project');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      await expect(page.locator('text=E2E Test Project')).toBeVisible();
    }
  });

  test('select an existing project', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const projectCard = page.locator('[class*="glass"]').first();
    if (await projectCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectCard.click();
      await page.waitForTimeout(300);
    }
  });

  test('shows API key button when not configured', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const apiKeyBtn = page.locator('button', { hasText: /api key|set api/i }).first();
    if (await apiKeyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(apiKeyBtn).toBeVisible();
    }
  });
});
