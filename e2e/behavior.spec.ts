import { test, expect, unlockApp } from './setup';

test.describe('Behavior: message flow', () => {
  test('can type in context textarea', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const textarea = page.locator('textarea[aria-label="Task description input"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Test login form with validation');
    await expect(textarea).toHaveValue('Test login form with validation');
  });

  test('word count updates as user types', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const textarea = page.locator('textarea[aria-label="Task description input"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Hello world');
    const wordCount = page.locator('text=2 words');
    await expect(wordCount).toBeVisible({ timeout: 3000 });
  });

  test('execute button disabled without task selected', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const executeBtn = page.locator('button', { hasText: /generate|execute/i }).first();
    await expect(executeBtn).toBeVisible({ timeout: 5000 });
    await expect(executeBtn).toBeDisabled();
  });

  test('reset button clears context', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const textarea = page.locator('textarea[aria-label="Task description input"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await textarea.fill('Test content');

    const resetBtn = page.locator('button', { hasText: /reset/i }).first();
    if (await resetBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resetBtn.click();
      await expect(textarea).toHaveValue('');
    }
  });
});

test.describe('Behavior: export panel', () => {
  test('export button opens export panel', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const exportBtn = page.locator('button[aria-label="Export options"]');
    const visible = await exportBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (visible) {
      await exportBtn.click();
      await page.waitForTimeout(300);
      const panel = page.locator('text=/markdown|json|csv|pdf/i').first();
      await expect(panel).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Behavior: metrics toggle', () => {
  test('metrics toggle shows/hides dashboard', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const metricsBtn = page.locator('button', { hasText: /metrics/i }).first();
    await expect(metricsBtn).toBeVisible({ timeout: 5000 });

    await metricsBtn.click();
    await page.waitForTimeout(300);
    const hideBtn = page.locator('button', { hasText: /hide metrics/i }).first();
    await expect(hideBtn).toBeVisible({ timeout: 3000 });

    await hideBtn.click();
    await page.waitForTimeout(300);
    await expect(hideBtn).not.toBeVisible();
  });
});

test.describe('Behavior: context presets', () => {
  test('context presets are clickable', async ({ page }) => {
    await page.goto('/');
    await unlockApp(page);

    const textarea = page.locator('textarea[aria-label="Task description input"]');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    const preset = page.locator('button', { hasText: /login form|rest api|navbar|payment/i }).first();
    if (await preset.isVisible({ timeout: 3000 }).catch(() => false)) {
      await preset.click();
      const value = await textarea.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
