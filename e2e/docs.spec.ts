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
  await expect(nav.getByRole('link')).toHaveCount((await (await page.request.get('/api/components')).json()).components.length);
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
  await expect(nav.getByRole('link')).toHaveCount((await (await page.request.get('/api/components')).json()).components.length);
  const names = (await nav.getByRole('link').allInnerTexts()).map((t) => t.replace(/\s*New$/, ''));
  for (const name of names) {
    await nav.getByRole('link', { name: new RegExp(`^${name}(\\s*New)?$`) }).click();
    await expect(page.getByRole('heading', { name, level: 1, exact: true })).toBeVisible();
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

/** Fixed controls keep their bounds; multi-select may grow vertically as chips wrap. */
test('no layout shift when interacting with any component', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Components' });
  await expect(nav.getByRole('link')).toHaveCount((await (await page.request.get('/api/components')).json()).components.length);
  const names = (await nav.getByRole('link').allInnerTexts()).map((t) => t.replace(/\s*New$/, ''));
  const box = async () => {
    const root = page.getByTestId('preview').locator('> div > *').first();
    return (await root.boundingBox())!;
  };
  for (const name of names) {
    await nav.getByRole('link', { name: new RegExp(`^${name}(\\s*New)?$`) }).click();
    await expect(page.getByRole('heading', { name, level: 1, exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const before = await box();
    const targets = page.getByTestId('preview').locator('button:not([data-close]):not([role=treeitem]), input, select, textarea');
    const count = await targets.count();
    for (let i = 0; i < count; i++) {
      const t = targets.nth(i);
      if (!(await t.isEnabled()) || !(await t.isVisible())) continue;
      await t.click({ force: true });
      await page.waitForTimeout(220);
      const after = await box();
      expect(Math.round(after.x), `${name} x after click #${i}`).toBe(Math.round(before.x));
      if (name !== 'Multi-select') expect(Math.round(after.y), `${name} y after click #${i}`).toBe(Math.round(before.y));
      expect(Math.round(after.width), `${name} width after click #${i}`).toBe(Math.round(before.width));
      if (name === 'Multi-select') {
        expect(after.height).toBeGreaterThanOrEqual(before.height);
        expect(await page.getByTestId('preview').locator('.p8-multi').evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      } else expect(Math.round(after.height), `${name} height after click #${i}`).toBe(Math.round(before.height));
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

test('responsive: no horizontal overflow and every section reachable at phone and tablet widths', async ({ page }) => {
  for (const [w, h] of [[390, 800], [820, 1100]]) {
    await page.setViewportSize({ width: w, height: h });
    for (const id of ['button', 'text-input', 'table', 'command-palette', 'dialog']) {
      await page.goto(`/#${id}`);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${id} at ${w}px overflows horizontally`).toBe(true);
      for (const t of ['preview', 'code', 'panel']) await expect(page.getByTestId(t)).toBeAttached();
      await page.getByTestId('panel').scrollIntoViewIfNeeded();
      await expect(page.getByTestId('panel')).toBeVisible();
    }
    // nav strip scrolls instead of wrapping off-screen
    await page.goto('/');
    await page.getByRole('navigation', { name: 'Components' }).getByRole('link', { name: 'Avatar Group' }).click();
    await expect(page.getByRole('heading', { name: 'Avatar Group', level: 1 })).toBeVisible();
  }
});

test('accessibility panel shows contrast, keyboard and labels and follows the props', async ({ page }) => {
  await page.goto('/#button');
  await expect(page.getByTestId('a11y')).toBeVisible();
  await expect(page.getByTestId('a11y-contrast')).toContainText('ink');
  await expect(page.getByTestId('a11y-keyboard')).toContainText('Enter / Space');
  await expect(page.getByTestId('a11y-labels')).toContainText('Button');
  await page.getByLabel('variant').selectOption('primary');
  await expect(page.getByTestId('a11y-contrast')).toContainText('ink-inverse');
  await page.getByLabel('label', { exact: true }).fill('Save changes');
  await expect(page.getByTestId('a11y-labels')).toContainText('Save changes');
  await page.goto('/#icon-button');
  await expect(page.getByTestId('a11y-labels')).toContainText('aria-label');
  await page.goto('/#switch');
  await expect(page.getByTestId('a11y-keyboard')).toContainText('Space');
});

test('usage page shows what was pulled and the public MCP', async ({ page, request }) => {
  await request.post('http://localhost:4322/api/code', { data: { component: 'stat-card', framework: 'react' }, headers: { 'user-agent': 'curl/8' } });
  await page.goto('/usage');
  await expect(page.getByRole('heading', { name: 'Usage', level: 1 })).toBeVisible();
  await expect(page.getByTestId('usage-totals')).toContainText('Calls');
  await expect(page.getByTestId('usage-components')).toContainText('stat-card');
  await expect(page.getByTestId('usage-mcp')).toContainText('Online');
  await expect(page.getByTestId('usage-mcp')).toContainText('search_components');
  await expect(page.getByTestId('usage-store')).toBeVisible();
  await page.goto('/');
  await page.getByTestId('usage-link').click();
  await expect(page).toHaveURL(/\/usage$/);
});

test('new components: slider thumb stretches while dragging; menu shows shortcuts', async ({ page }) => {
  await page.goto('/#menu');
  await expect(page.getByTestId('preview').getByRole('menuitem').first()).toContainText('⌘R');
  await page.goto('/#slider');
  const slider = page.getByTestId('preview').locator('input[type=range]');
  const css = await page.evaluate(() => [...document.styleSheets].flatMap((sh) => { try { return [...sh.cssRules].map((r) => r.cssText); } catch { return []; } }).join('\n'));
  expect(css).toMatch(/p8-slider:active:not\(:disabled\)::-webkit-slider-thumb\s*\{[^}]*width:\s*var\(--p8-size-24\)/);
  const box = (await slider.boundingBox())!;
  const rest = await slider.screenshot();
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(400);
  const pressed = await slider.screenshot();
  await page.mouse.up();
  expect(pressed.equals(rest)).toBe(false);
});

test('changelog links to the new components', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('changelog-link').click();
  await expect(page.getByRole('heading', { name: 'Changelog', exact: true })).toBeVisible();
  const latest = page.locator('[data-version="0.9.0"]');
  await expect(latest.locator('a.chip')).toHaveCount(9);
  await latest.getByRole('link', { name: 'Date Picker' }).click();
  await expect(page.getByRole('heading', { name: 'Date Picker', exact: true })).toBeVisible();
});

test('new pickers, file drops and hover focus work in the preview', async ({ page }) => {
  await page.goto('/#date-picker');
  let preview = page.getByTestId('preview');
  await preview.getByRole('textbox', { name: 'Date', exact: true }).fill('2028-02-29');
  await expect(preview.locator('[data-label]')).toHaveText('February 2028');
  await preview.getByRole('button', { name: '2028-02-29', exact: true }).click();
  await expect(preview.locator('[data-panel]')).toBeHidden();
  await page.goto('/#time-picker');
  await preview.getByRole('combobox', { name: 'Hour', exact: true }).selectOption('14');
  await expect(preview.getByRole('combobox', { name: 'Hour', exact: true })).toHaveValue('14');
  await page.goto('/#multi-select');
  await preview.getByRole('combobox').fill('Engineering');
  await expect(preview.getByRole('option', { name: 'Design', exact: true })).toBeHidden();
  await preview.getByRole('combobox').press('Enter');
  await expect(preview.locator('[data-chips]')).toContainText('Engineering');
  await preview.getByRole('button', { name: 'Remove Engineering', exact: true }).click();
  await expect(preview.locator('[data-chips]')).not.toContainText('Engineering');
  await page.goto('/#file-upload');
  await preview.locator('[data-zone]').evaluate((zone) => {
    const data = new DataTransfer();
    data.items.add(new File(['hello'], 'hello.txt', { type: 'text/plain' }));
    zone.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: data }));
  });
  await expect(preview.locator('[data-files]')).toContainText('hello.txt');
  expect(await preview.locator('input[type=file]').evaluate((input: HTMLInputElement) => input.files?.length)).toBe(1);
  await preview.getByRole('button', { name: 'Remove hello.txt' }).click();
  expect(await preview.locator('input[type=file]').evaluate((input: HTMLInputElement) => input.files?.length)).toBe(0);
  await page.goto('/#hover-card');
  await preview.locator('a').focus();
  await expect(preview.locator('.p8-hovercard__wrap')).toHaveCSS('opacity', '1');
});
