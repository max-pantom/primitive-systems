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
  await expect(nav.getByRole('link')).toHaveCount(17);
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
  await expect(page.getByTestId('code')).toContainText('<p8-button variant="primary" disabled>Save</p8-button>');
  await page.getByTestId('tab-astro').click();
  await expect(page.getByTestId('code')).toContainText('p8-button--primary');
});

test('docs and props live in the right sidebar; code below the preview; no page jump between tabs', async ({ page }) => {
  await page.goto('/#button');
  const [panel, preview, code] = await Promise.all(['panel', 'preview', 'code'].map((t) => page.getByTestId(t).boundingBox()));
  expect(panel!.x).toBeGreaterThan(preview!.x + preview!.width - 1);
  expect(code!.y).toBeGreaterThan(preview!.y + preview!.height);
  const docs = await page.getByTestId('docs').boundingBox();
  expect(docs!.x).toBeGreaterThan(preview!.x + preview!.width - 1);
  const h = async () => (await page.getByTestId('code').boundingBox())!.height;
  const first = await h();
  for (const fw of ['astro', 'scss', 'p8']) { await page.getByTestId(`tab-${fw}`).click(); expect(await h()).toBe(first); }
});

test('left sidebar is resizable', async ({ page }) => {
  await page.goto('/');
  const w = async () => (await page.locator('.left').boundingBox())!.width;
  const before = await w();
  const handle = (await page.getByTestId('resize').boundingBox())!;
  await page.mouse.move(handle.x + 4, 300);
  await page.mouse.down();
  await page.mouse.move(handle.x + 124, 300, { steps: 5 });
  await page.mouse.up();
  expect(await w()).toBeGreaterThan(before + 80);
});

test('divider shows with a label; switch toggles; tooltip appears on hover', async ({ page }) => {
  await page.goto('/#divider');
  const sep = page.getByTestId('preview').getByRole('separator');
  expect((await sep.boundingBox())!.width).toBeGreaterThan(100);
  await expect(sep).toContainText('or');

  await page.goto('/#switch');
  const sw = page.getByTestId('preview').getByRole('switch');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');

  await page.goto('/#tooltip');
  const bubble = page.getByTestId('preview').getByRole('tooltip');
  await expect(bubble).toHaveCSS('opacity', '0');
  await page.getByTestId('preview').getByRole('button').hover();
  await expect(bubble).toHaveCSS('opacity', '1');
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

test('every component renders and has code in every tab', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Components' });
  await expect(nav.getByRole('link')).toHaveCount(17);
  const names = await nav.getByRole('link').allInnerTexts();
  for (const name of names) {
    await nav.getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
    expect((await page.getByTestId('preview').innerHTML()).length).toBeGreaterThan(20);
    for (const fw of ['p8', 'astro', 'react', 'svelte', 'tailwind', 'html', 'scss']) {
      await page.getByTestId(`tab-${fw}`).click();
      expect((await page.getByTestId('code').innerText()).length).toBeGreaterThan(8);
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

/** Layout-shift guard: interacting with any component must never move or resize it. */
test('no layout shift when interacting with any component', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Components' });
  await expect(nav.getByRole('link')).toHaveCount(17);
  const names = await nav.getByRole('link').allInnerTexts();
  const box = async () => {
    const root = page.getByTestId('preview').locator('> div > *').first();
    return (await root.boundingBox())!;
  };
  for (const name of names) {
    await nav.getByRole('link', { name }).click();
    await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
    await page.waitForTimeout(150);
    const before = await box();
    const targets = page.getByTestId('preview').locator('button, input, select, textarea');
    const count = await targets.count();
    for (let i = 0; i < count; i++) {
      const t = targets.nth(i);
      if (!(await t.isEnabled())) continue;
      await t.click({ force: true });
      await page.waitForTimeout(220);
      const after = await box();
      expect(Math.round(after.x), `${name} x after click #${i}`).toBe(Math.round(before.x));
      expect(Math.round(after.y), `${name} y after click #${i}`).toBe(Math.round(before.y));
      expect(Math.round(after.width), `${name} width after click #${i}`).toBe(Math.round(before.width));
      expect(Math.round(after.height), `${name} height after click #${i}`).toBe(Math.round(before.height));
    }
  }
});

test('text fields are 500px wide; focus matches hover; light fill is #EEEEEE', async ({ page }) => {
  await page.goto('/#text-input');
  const input = page.getByTestId('preview').locator('input');
  expect((await input.boundingBox())!.width).toBe(500);
  expect(await input.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(238, 238, 238)');
  await input.hover();
  const hover = await input.evaluate((e) => getComputedStyle(e).backgroundColor);
  await page.mouse.move(5, 5);
  await input.focus();
  expect(await input.evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(hover);
});
