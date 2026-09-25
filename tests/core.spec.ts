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

test('rich-text formatting survives save and reload', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /new document/i }).click();
  await expect(page).toHaveURL(/\/documents\/\d+$/);
  const documentId = Number(page.url().match(/\/documents\/(\d+)$/)?.[1]);
  expect(documentId).toBeGreaterThan(0);
  const formattedContent = { type: 'doc', content: [
    { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Heading line' }] },
    { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'Bold line' }] },
    { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'italic' }], text: 'Italic line' }] },
    { type: 'paragraph', content: [{ type: 'text', marks: [{ type: 'underline' }], text: 'Underline line' }] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet one' }] }] }, { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bullet two' }] }] }] },
    { type: 'orderedList', attrs: { start: 1 }, content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Number one' }] }] }, { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Number two' }] }] }] },
  ] };
  await page.evaluate(async ({ documentId, content }) => { const token = localStorage.getItem('token'); const response = await fetch(`http://localhost:4000/api/documents/${documentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ title: 'Formatted document', content }) }); if (!response.ok) throw new Error(await response.text()); }, { documentId, content: formattedContent });
  await page.reload();

  await expect(page.locator('.ProseMirror h1')).toContainText('Heading line');
  await expect(page.locator('.ProseMirror strong')).toContainText('Bold line');
  await expect(page.locator('.ProseMirror em')).toContainText('Italic line');
  await expect(page.locator('.ProseMirror u')).toContainText('Underline line');
  await expect(page.locator('.ProseMirror ul')).toContainText('Bullet one');
  await expect(page.locator('.ProseMirror ol')).toContainText('Number one');
});