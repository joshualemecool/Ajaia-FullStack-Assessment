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

test('shared user can open, edit, and persist a document', async ({ page, context, request }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: /continue/i }).click();
  await page.getByRole('button', { name: /new document/i }).click();
  await expect(page).toHaveURL(/\/documents\/\d+$/);
  const documentId = Number(page.url().match(/\/documents\/(\d+)$/)?.[1]);
  await page.locator('.title-input').fill('Phase 6 shared document');
  await page.locator('.ProseMirror').fill('Alice draft');
  await page.getByRole('button', { name: /^save$/i }).click();
  await expect(page.locator('.save-state')).toContainText('Saved');

  await page.getByPlaceholder('bob@example.com').fill('bob@example.com');
  await page.getByRole('button', { name: /^share$/i }).click();
  await expect(page.locator('.notice')).toContainText('bob@example.com');

  const bob = await context.newPage();
  await bob.goto('/login');
  await bob.locator('input[type="email"]').fill('bob@example.com');
  await bob.getByRole('button', { name: /continue/i }).click();
  await expect(bob).toHaveURL(/\/documents$/);
  const bobToken = await bob.evaluate(() => localStorage.getItem('token'));
  const bobDocuments = await request.get('http://localhost:4000/api/documents', { headers: { Authorization: `Bearer ${bobToken}` } });
  const bobDocumentList = await bobDocuments.json();
  expect(bobDocumentList.shared.some((document: { id: number }) => document.id === documentId)).toBe(true);
  await bob.goto(`http://localhost:5173/documents/${documentId}`);
  await expect(bob).toHaveURL(new RegExp(`/documents/${documentId}$`));
  await expect(bob.locator('.ProseMirror')).toContainText('Alice draft');

  const unauthorizedShare = await request.post(`http://localhost:4000/api/documents/${documentId}/share`, { headers: { Authorization: `Bearer ${bobToken}` }, data: { email: 'alice@example.com' } });
  expect(unauthorizedShare.status()).toBe(403);

  await bob.locator('.ProseMirror').fill('Bob persisted edit');
  await bob.getByRole('button', { name: /^save$/i }).click();
  await expect(bob.locator('.save-state')).toContainText('Saved');
  await page.reload();
  await expect(page.locator('.ProseMirror')).toContainText('Bob persisted edit');
});