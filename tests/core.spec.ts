import { test, expect } from '@playwright/test';

test('Alice can create, save, refresh, and reopen a document', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /continue/i }).click();
  await expect(page).toHaveURL(/\/documents$/);
  await page.getByRole('button', { name: /new document/i }).click();
  await page.locator('.title-input').fill('Playwright document');
  await page.locator('.ProseMirror').fill('Persisted browser content');
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.locator('.save-state')).toContainText('Saved');
  await page.reload();
  await expect(page.locator('.title-input')).toHaveValue('Playwright document');
  await expect(page.locator('.ProseMirror')).toContainText('Persisted browser content');
});