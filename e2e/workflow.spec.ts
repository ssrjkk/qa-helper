import { test, expect, unlockApp } from './setup';

test.describe('Full QA workflow', () => {
  test('complete flow: create project → select task → view chat', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1500);

    const newBtn = page.locator('button', { hasText: /new|create|add/i }).first();
    await expect(newBtn).toBeVisible({ timeout: 5000 });
    await newBtn.click();

    const nameInput = page.locator('input[placeholder*="project" i], input[placeholder*="name" i], input[aria-label*="project" i]').first();
    await expect(nameInput).toBeVisible({ timeout: 3000 });
    await nameInput.fill('E2E Workflow Project');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    await expect(page.locator('text=E2E Workflow Project')).toBeVisible({ timeout: 5000 });

    const bugTab = page.locator('button', { hasText: /bug/i }).first();
    await expect(bugTab).toBeVisible({ timeout: 3000 });
    await bugTab.click();
    await page.waitForTimeout(300);

    const taskCard = page.locator('text=/bug report|test plan|test case/i').first();
    await expect(taskCard).toBeVisible({ timeout: 3000 });
    await taskCard.click();
    await page.waitForTimeout(500);

    const chatArea = page.locator('textarea').first();
    await expect(chatArea).toBeVisible({ timeout: 5000 });
  });

  test('keyboard shortcuts work', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(1000);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible({ timeout: 3000 });
  });

  test('no JavaScript errors on page load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('/');
    await unlockApp(page);
    await page.waitForTimeout(2000);

    const criticalErrors = errors.filter(
      e => !e.includes('WebAssembly') && !e.includes('sql') && !e.includes('wasm'),
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
