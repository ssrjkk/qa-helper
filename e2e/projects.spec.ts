import { test, expect, unlockApp } from './setup';

test.describe('Project management', () => {
  test('create a new project', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const newBtn = page.locator('button', { hasText: /new/i }).first();
    await expect(newBtn).toBeVisible({ timeout: 5000 });

    await newBtn.click();

    const nameInput = page.locator('input[placeholder*="project" i], input[placeholder*="name" i]').first();
    await expect(nameInput).toBeVisible({ timeout: 3000 });

    await nameInput.fill('E2E Test Project');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const projectCard = page.locator('[role="button"][aria-label^="Select project"]', { hasText: 'E2E Test Project' });
    await expect(projectCard).toBeVisible();
  });

  test('select an existing project', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const newBtn = page.locator('button', { hasText: /new/i }).first();
    await expect(newBtn).toBeVisible({ timeout: 5000 });
    await newBtn.click();

    const nameInput = page.locator('input[placeholder*="project" i], input[placeholder*="name" i]').first();
    await expect(nameInput).toBeVisible({ timeout: 3000 });
    await nameInput.fill('Existing Project');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const projectCard = page.locator('[role="button"][aria-label^="Select project"]').first();
    await expect(projectCard).toBeVisible({ timeout: 5000 });

    await projectCard.click();
    await page.waitForTimeout(500);

    const chatArea = page.locator('textarea').first();
    await expect(chatArea).toBeVisible({ timeout: 5000 });
  });

  test('shows API key button when not configured', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const apiKeyBtn = page.locator('button', { hasText: /api key|set api/i }).first();
    await expect(apiKeyBtn).toBeVisible({ timeout: 5000 });
  });
});
