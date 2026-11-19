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
  test.setTimeout(600_000);
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
  test.setTimeout(900_000);
  test.setTimeout(120_000);
  await page.goto('/');
  const nav = page.getByRole('navigation', { name: 'Components' });
  await expect(nav.getByRole('link')).toHaveCount((await (await page.request.get('/api/components')).json()).components.length);
  const names = (await nav.getByRole('link').allInnerTexts()).map((t) => t.replace(/\s*New$/, ''));
  const box = async () => {
    const root = page.getByTestId('preview').locator('> div > *').first();
    const b = await root.boundingBox();
    if (!b) return null;
    // the preview can scroll when a component is taller than the pane; scrolling is not a layout shift
    const scroll = await page.getByTestId('preview').evaluate((e) => [e.scrollLeft, e.scrollTop]);
    return { x: b.x + scroll[0], y: b.y + scroll[1], width: b.width, height: b.height };
  };
  const mustBox = async (what: string) => { const b = await box(); if (!b) throw new Error(`${what}: the component disappeared`); return b; };
  for (const name of names) {
    await nav.getByRole('link', { name: new RegExp(`^${name}(\\s*New)?$`) }).click();
    await expect(page.getByRole('heading', { name, level: 1, exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(150);
    const before = await mustBox(`${name} before`);
    const targets = page.getByTestId('preview').locator('button:not([data-close]):not([role=treeitem]), input, select, textarea');
    const count = await targets.count();
    for (let i = 0; i < count; i++) {
      const t = targets.nth(i);
      if (!(await t.isEnabled()) || !(await t.isVisible())) continue;
      await t.scrollIntoViewIfNeeded();
      await t.click({ force: true });
      await page.waitForTimeout(220);
      const after = await box();
      if (!after && name === 'Command Palette') break; // running a command closes the palette by design
      if (!after) throw new Error(`${name} disappeared after click #${i}`);
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
  // Collapsed by default; the report is still in the DOM for agents and opens on click.
  await expect(page.getByTestId('a11y-contrast')).toBeHidden();
  await expect(page.getByTestId('usage')).not.toHaveAttribute('open', '');
  await page.getByTestId('a11y').locator('summary').click();
  await expect(page.getByTestId('a11y-contrast')).toBeVisible();
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

test('0.10.0: drag to resize and reorder, table sort, range pick, lightbox and password reveal work in the browser', async ({ page }) => {
  const preview = page.getByTestId('preview');
  await page.goto('/#resizable-panels');
  const handle = preview.locator('[data-handle]');
  const root = (await preview.locator('.p8-resize').boundingBox())!;
  const h = (await handle.boundingBox())!;
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2);
  await page.mouse.down();
  await page.mouse.move(root.x + root.width * 0.7, h.y + h.height / 2, { steps: 5 });
  await page.mouse.up();
  await expect(handle).toHaveAttribute('aria-valuenow', '70');
  expect(Math.round((await preview.locator('[data-pane]').boundingBox())!.width)).toBeGreaterThan(Math.round(root.width * 0.65));
  await handle.press('ArrowLeft');
  await expect(handle).toHaveAttribute('aria-valuenow', '65');

  await page.goto('/#sortable-list');
  const first = (await preview.locator('[data-item="Write brief"] [data-handle]').boundingBox())!;
  const last = (await preview.locator('[data-item="Ship"]').boundingBox())!;
  await page.mouse.move(first.x + first.width / 2, first.y + first.height / 2);
  await page.mouse.down();
  await page.mouse.move(first.x + first.width / 2, last.y + last.height - 2, { steps: 8 });
  await page.mouse.up();
  expect(await preview.locator('[data-item]').evaluateAll((els) => els.map((e) => e.getAttribute('data-item')))).toEqual(['Design review', 'Build prototype', 'User testing', 'Ship', 'Write brief']);
  await preview.locator('[data-item="Write brief"] [data-handle]').press('Home');
  await expect(preview.locator('[data-item]').first()).toHaveAttribute('data-item', 'Write brief');
  await expect(preview.locator('[data-item="Write brief"] [data-handle]')).toBeFocused();

  await page.goto('/#data-table');
  await preview.getByRole('button', { name: 'Joined' }).click();
  await expect(preview.locator('tbody tr').first()).toContainText('Grace Hopper');
  await preview.getByRole('checkbox', { name: 'Select Grace Hopper' }).click();
  await expect(preview.getByRole('button', { name: 'Export' })).toBeEnabled();
  await preview.getByRole('button', { name: 'Columns' }).click();
  await preview.getByRole('checkbox', { name: 'Show Role' }).click();
  await expect(preview.locator('th[data-col="1"]')).toBeHidden();

  await page.goto('/#date-range-picker');
  await preview.getByRole('button', { name: '2026-11-20', exact: true }).click();
  await preview.getByRole('button', { name: '2026-11-22', exact: true }).click();
  await expect(preview.getByRole('textbox', { name: 'End date' })).toHaveValue('2026-11-22');
  await expect(preview.locator('[data-hint]')).toHaveText('3 days selected');
  await expect(preview.locator('[data-panel]')).toBeHidden();

  await page.goto('/#image-viewer');
  await preview.getByRole('button', { name: 'Open Forest path' }).click();
  await expect(preview.getByRole('dialog', { name: 'Image viewer' })).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(preview.locator('[data-counter]')).toHaveText('4 / 6');
  await page.keyboard.press('Escape');
  await expect(preview.getByRole('dialog', { name: 'Image viewer' })).toBeHidden();
  await expect(preview.getByRole('button', { name: 'Open Forest path' })).toBeFocused();

  await page.goto('/#password-input');
  await preview.getByLabel('Password', { exact: true }).fill('Secret12!');
  await expect(preview.locator('.p8-password__rule--on')).toHaveCount(4);
  await preview.getByRole('button', { name: 'Show password' }).click();
  await expect(preview.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
});

test('⌘K searches components, templates and pages', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('search-open')).toBeVisible();
  await page.keyboard.press('Control+k');
  const input = page.getByTestId('search-input');
  await expect(input).toBeFocused();
  await input.fill('login');
  await expect(page.getByRole('option').first()).toContainText('Sign-in');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/templates#sign-in$/);
  await expect(page.getByTestId('search-open')).toBeVisible();
  await page.keyboard.press('Control+k');
  await page.getByTestId('search-input').fill('lightbox');
  await expect(page.getByRole('option').first()).toContainText('Image Viewer');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('search-input')).toHaveCount(0);
  await page.getByTestId('search-open').click();
  await page.getByTestId('search-input').fill('toggle');
  await page.getByRole('option', { name: /Toggle Group/ }).click();
});

test('link preview renders its states', async ({ page }) => {
  await page.goto('/#link-preview');
  const card = page.getByTestId('preview').getByRole('link');
  await expect(card).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(card).toContainText('example.com');
  await page.getByLabel('state').selectOption('loading');
  await expect(page.getByTestId('preview').getByRole('link')).toHaveAttribute('aria-busy', 'true');
});

test('templates page lists whole screens and they work', async ({ page }) => {
  await page.goto('/templates');
  const nav = page.getByRole('navigation', { name: 'Templates' });
  await expect(nav.getByRole('link')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'Sign-in', level: 1 })).toBeVisible();
  // sign-in: validation wiring
  const preview = page.getByTestId('preview');
  await preview.getByRole('button', { name: 'Sign in' }).click();
  await expect(preview.locator('#form-email-error')).toHaveText('Email is required');
  await preview.locator('#form-email').fill('ada@example.com');
  await expect(preview.locator('#form-email-error')).toHaveText('');
  // list to detail switches the panel
  await nav.getByRole('link', { name: /List to detail/ }).click();
  const rows = preview.locator('[data-target]');
  await rows.nth(1).click();
  await expect(preview.locator('[data-detail]:not([hidden])')).toHaveCount(1);
  await expect(preview.locator('[data-detail]:not([hidden])')).toContainText('Order 1041');
  // code for the whole screen in a framework
  await page.getByTestId('tab-react').click();
  await expect(page.getByTestId('code')).toContainText('export function ListDetail');
  await page.getByTestId('switch-link').click();
  await expect(page).toHaveURL(/\/$/);
});

test('new app components work in the live preview', async ({ page }) => {
  await page.goto('/#toggle-group');
  const preview = page.getByTestId('preview');
  await preview.getByRole('button', { name: 'Italic' }).click();
  await expect(preview.getByRole('button', { name: 'Italic' })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/#tag-input');
  await preview.locator('[data-entry]').fill('new tag');
  await preview.locator('[data-entry]').press('Enter');
  await expect(preview.locator('[data-chip="new tag"]')).toBeVisible();
  await page.goto('/#chart');
  await preview.locator('[data-plot]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(preview.locator('[data-tip]')).toBeVisible();
  await page.goto('/#calendar');
  await preview.locator('[data-dir="1"]').click();
  await expect(preview.locator('[data-label]')).toHaveText('December 2026');
  await page.goto('/#chat-composer');
  await preview.locator('[data-input]').fill('Hello');
  await expect(preview.locator('[data-send]')).toBeEnabled();
});

test('media timeline: scrub, drag, trim, split and zoom with a real pointer', async ({ page }) => {
  await page.goto('/#media-timeline');
  const preview = page.getByTestId('preview');
  const canvas = preview.locator('[data-canvas]');
  await expect(canvas).toBeVisible();
  const box = (await canvas.boundingBox())!;
  const ruler = preview.locator('[data-ruler]');
  // scrub on the ruler: 24 px per second
  await page.mouse.move(box.x + 240, box.y + 10);
  await page.mouse.down();
  await expect(preview.locator('[data-timecode]')).toHaveText('00:00:10:00');
  await page.mouse.move(box.x + 480, box.y + 10, { steps: 6 });
  await page.mouse.up();
  await expect(preview.locator('[data-timecode]')).toHaveText('00:00:20:00');
  await expect(ruler).toHaveAttribute('aria-valuetext', '00:00:20:00');
  // keyboard on the ruler
  await ruler.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(preview.locator('[data-timecode]')).toHaveText('00:00:00:02');
  // drag the Title clip two seconds to the right
  const title = preview.getByRole('button', { name: /^Title,/ });
  const tb = (await title.boundingBox())!;
  await page.mouse.move(tb.x + tb.width / 2, tb.y + tb.height / 2);
  await page.mouse.down();
  await page.mouse.move(tb.x + tb.width / 2 + 48, tb.y + tb.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(title).toHaveAttribute('aria-label', /starts at 00:00:03:00/);
  // trim the Interview clip from its right handle
  const iv = preview.getByRole('button', { name: /^Interview,/ });
  const ib = (await iv.boundingBox())!;
  await page.mouse.move(ib.x + ib.width - 3, ib.y + ib.height / 2);
  await page.mouse.down();
  await page.mouse.move(ib.x + ib.width - 3 - 120, ib.y + ib.height / 2, { steps: 8 });
  await page.mouse.up();
  const after = (await iv.boundingBox())!;
  expect(after.width).toBeLessThan(ib.width - 90);
  // split at the playhead with the keyboard
  await ruler.focus();
  await page.keyboard.press('End');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageDown');
  await page.keyboard.press('PageDown');
  await expect(preview.locator('[data-timecode]')).toHaveText('00:00:10:00');
  await preview.getByRole('button', { name: /^Music,/ }).focus();
  await page.keyboard.press('s');
  await expect(preview.getByRole('button', { name: /^Music,/ })).toHaveCount(2);
  // zoom
  const before = await preview.locator('[data-p8~=mediatl]').getAttribute('data-pps');
  await preview.getByRole('button', { name: 'Zoom in' }).click();
  expect(Number(await preview.locator('[data-p8~=mediatl]').getAttribute('data-pps'))).toBeGreaterThan(Number(before));
  // playback advances the playhead
  await preview.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForTimeout(600);
  await preview.getByRole('button', { name: 'Pause', exact: true }).click();
  expect(await preview.locator('[data-timecode]').textContent()).not.toBe('00:00:10:00');
});

test('rich text formats with the toolbar; mention suggests people; palette runs commands', async ({ page }) => {
  const preview = page.getByTestId('preview');
  await page.goto('/#rich-text');
  const editor = preview.locator('[data-editor]');
  await editor.click();
  await editor.evaluate((el) => { const r = document.createRange(); r.selectNodeContents(el); const s = getSelection()!; s.removeAllRanges(); s.addRange(r); });
  await preview.getByRole('button', { name: 'Bold' }).click();
  await expect(editor).toContainText('Write something worth reading.');
  expect(await editor.innerHTML()).toMatch(/<(b|strong)>/);
  await expect(preview.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'true');
  await preview.getByRole('button', { name: 'Link' }).click();
  await preview.locator('[data-url]').fill('javascript:alert(1)');
  await page.keyboard.press('Enter');
  await expect(preview.locator('[data-linkerr]')).toBeVisible();
  await preview.locator('[data-url]').fill('https://example.com');
  await page.keyboard.press('Enter');
  expect(await editor.innerHTML()).toContain('href="https://example.com"');

  await page.goto('/#mention-input');
  const ta = preview.locator('textarea');
  await ta.click();
  await page.keyboard.type('Hi @al');
  await expect(preview.getByRole('option', { name: 'Alan Turing' })).toBeVisible();
  await expect(preview.getByRole('option', { name: 'Grace Hopper' })).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(ta).toHaveValue('Hi @Alan Turing ');

  await page.goto('/#command-palette');
  await preview.getByRole('combobox').fill('sett');
  await expect(preview.getByRole('option', { name: /Open settings/ })).toBeVisible();
  await expect(preview.getByRole('option', { name: /Invite people/ })).toBeHidden();
  await page.keyboard.press('Enter');
  await expect(preview.locator('[data-p8~=overlay]')).toBeHidden();
});

test('skeleton variants and segmented progress', async ({ page }) => {
  await page.goto('/#skeleton');
  const preview = page.getByTestId('preview');
  const h = async () => Number(await preview.locator('svg').first().getAttribute('height'));
  const text = await h();
  await page.getByLabel('variant').selectOption('card');
  expect(await h()).toBe(200);
  await page.getByLabel('variant').selectOption('table');
  expect(await h()).not.toBe(text);
  await page.goto('/#segmented-progress');
  await expect(preview.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  await page.getByLabel('done').selectOption('3');
  await expect(preview.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '85');
});
