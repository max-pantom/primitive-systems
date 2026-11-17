import { expect, test } from '@playwright/test';

test('catalog lists button and card, seeds banner visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Button' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Card' }).first()).toBeVisible();
  await expect(page.getByTestId('seeds-banner')).toContainText('DESIGN SEEDS');
});

test('props panel updates preview and code', async ({ page }) => {
  await page.goto('/components/button');
  const preview = page.getByTestId('preview').getByRole('button');
  await expect(preview).toHaveText('Button');
  await expect(page.getByTestId('code')).toContainText('p8-button');
  await page.getByLabel('label', { exact: true }).fill('Save');
  await page.getByLabel('variant').selectOption('primary');
  await page.getByLabel('disabled').check();
  await expect(preview).toHaveText('Save');
  await expect(preview).toBeDisabled();
  await expect(preview).toHaveClass(/p8-button--primary/);
  await expect(page.getByTestId('code')).toContainText('p8-button--primary');
  await expect(page.getByTestId('code')).toContainText('Save');
  await expect(page.getByTestId('code')).toContainText('disabled');
});

test('button padding is 12px left/right; card is 16/12 and 16/16 with prop', async ({ page }) => {
  await page.goto('/components/button');
  const btn = page.getByTestId('preview').getByRole('button');
  expect(await btn.evaluate((e) => getComputedStyle(e).paddingLeft)).toBe('12px');
  expect(await btn.evaluate((e) => getComputedStyle(e).paddingRight)).toBe('12px');
  await page.goto('/components/card');
  const card = page.getByTestId('preview').locator('.p8-card');
  const pad = () => card.evaluate((e) => { const s = getComputedStyle(e); return [s.paddingLeft, s.paddingTop]; });
  expect(await pad()).toEqual(['16px', '12px']);
  await page.getByLabel('padding').selectOption('even');
  expect(await pad()).toEqual(['16px', '16px']);
});

test('all six framework tabs show code and copy works', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/components/card');
  await page.getByLabel('title', { exact: true }).fill('Hello');
  for (const fw of ['astro', 'react', 'svelte', 'tailwind', 'html', 'scss']) {
    await page.getByTestId(`tab-${fw}`).click();
    await expect(page.getByTestId('code')).toContainText('Hello');
  }
  await page.getByTestId('tab-react').click();
  await page.getByTestId('copy').click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('export function Card');
  expect(clip).toContain('Hello');
});

test('dark mode toggle', async ({ page }) => {
  await page.goto('/components/button');
  await page.getByTestId('theme-toggle').click();
  const t = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByTestId('theme-toggle').click();
  const t2 = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(new Set([t, t2])).toEqual(new Set(['light', 'dark']));
});
