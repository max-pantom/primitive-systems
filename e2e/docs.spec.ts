import { expect, test } from '@playwright/test';

test('/ shows the first component immediately; no seeds banner', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Button', level: 1 })).toBeVisible();
  await expect(page.getByTestId('preview').getByRole('button')).toBeVisible();
  await expect(page.getByText(/DESIGN SEEDS — /)).toHaveCount(0);
});

test('nav lists all components and switches in place', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Components' });
  await expect(nav.getByRole('link')).toHaveCount(18);
  await nav.getByRole('link', { name: 'Tabs' }).click();
  await expect(page.getByRole('heading', { name: 'Tabs', level: 1 })).toBeVisible();
  await expect(page).toHaveURL(/#tabs$/);
  await expect(nav.getByRole('link', { name: 'Tabs' })).toHaveAttribute('aria-current', 'page');
});

test('props panel updates preview and code', async ({ page }) => {
  await page.goto('/#button');
  const preview = page.getByTestId('preview').getByRole('button');
  await page.getByLabel('label', { exact: true }).fill('Save');
  await page.getByLabel('variant').selectOption('primary');
  await page.getByLabel('disabled').check();
  await expect(preview).toHaveText('Save');
  await expect(preview).toBeDisabled();
  await expect(preview).toHaveClass(/p8-button--primary/);
  await expect(page.getByTestId('code')).toContainText('p8-button--primary');
  await expect(page.getByTestId('code')).toContainText('Save');
});

test('props are in the right sidebar; code is below the preview', async ({ page }) => {
  await page.goto('/#button');
  const [panel, preview, code] = await Promise.all(['panel', 'preview', 'code'].map((t) => page.getByTestId(t).boundingBox()));
  expect(panel!.x).toBeGreaterThan(preview!.x + preview!.width - 1);
  expect(code!.y).toBeGreaterThan(preview!.y + preview!.height);
});

test('spacing rules hold in the rendered preview', async ({ page }) => {
  await page.goto('/#button');
  const btn = page.getByTestId('preview').getByRole('button');
  expect(await btn.evaluate((e) => [getComputedStyle(e).paddingLeft, getComputedStyle(e).paddingRight])).toEqual(['12px', '12px']);
  await page.goto('/#card');
  const card = page.getByTestId('preview').locator('.p8-card');
  const pad = () => card.evaluate((e) => [getComputedStyle(e).paddingLeft, getComputedStyle(e).paddingTop]);
  expect(await pad()).toEqual(['16px', '12px']);
  await page.getByLabel('padding').selectOption('even');
  expect(await pad()).toEqual(['16px', '16px']);
});

test('every component renders and has code in all six tabs', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Components' });
  await expect(nav.getByRole('link')).toHaveCount(18);
  const names = await nav.getByRole('link').allInnerTexts();
  for (const name of names) {
    await nav.getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
    expect((await page.getByTestId('preview').innerHTML()).length).toBeGreaterThan(20);
    for (const fw of ['astro', 'react', 'svelte', 'tailwind', 'html', 'scss']) {
      await page.getByTestId(`tab-${fw}`).click();
      expect((await page.getByTestId('code').innerText()).length).toBeGreaterThan(20);
    }
  }
});

test('copy puts the current code on the clipboard', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/#card');
  await page.getByLabel('title', { exact: true }).fill('Hello');
  await page.getByTestId('tab-react').click();
  await page.getByTestId('copy').click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip).toContain('export function Card');
  expect(clip).toContain('Hello');
});

test('dark mode toggle', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('theme-toggle').click();
  const a = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByTestId('theme-toggle').click();
  const b = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(new Set([a, b])).toEqual(new Set(['light', 'dark']));
});
