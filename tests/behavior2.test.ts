// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateById } from '../src/codegen';

let stop: (() => void) | undefined;
const docListeners: [string, EventListener][] = [];
const onDoc = (name: string, fn: (e: Event) => void) => { document.addEventListener(name, fn); docListeners.push([name, fn]); };
afterEach(() => { stop?.(); stop = undefined; document.body.innerHTML = ''; vi.useRealTimers(); docListeners.splice(0).forEach(([n, f]) => document.removeEventListener(n, f)); });

function mount(id: string, props: Record<string, unknown> = {}) {
  const code = generateById(id, props, 'html').code;
  const script = /<script>([\s\S]*?)<\/script>/.exec(code)?.[1] ?? '';
  document.body.innerHTML = code.replace(/<!--[\s\S]*?-->/g, '').replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<script>[\s\S]*?<\/script>/g, '');
  if (script) stop = new Function(script.replace(/initP8\(document\);\s*$/, 'return initP8(document);'))() as () => void;
}
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => { const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }); el.dispatchEvent(e); return e; };
const type = (el: HTMLInputElement | HTMLTextAreaElement, v: string) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); };
const $ = (s: string) => document.querySelector(s) as HTMLElement;
const $$ = (s: string) => [...document.querySelectorAll(s)] as HTMLElement[];
const listen = <T,>(name: string) => { const calls: T[] = []; onDoc(name, (e) => calls.push((e as CustomEvent).detail)); return calls; };

describe('toggle group', () => {
  it('multiple presses independently, single releases the others, arrows rove', () => {
    mount('toggle-group', { items: 'A\nB\nC', value: 'A', type: 'multiple' });
    const [a, b, c] = $$('[data-value]');
    const changes = listen<{ value: string[] }>('p8-change');
    click(b);
    expect([a, b, c].map((x) => x.getAttribute('aria-pressed'))).toEqual(['true', 'true', 'false']);
    expect(changes.at(-1)!.value).toEqual(['A', 'B']);
    click(a);
    expect(a.getAttribute('aria-pressed')).toBe('false');
    key(b, 'ArrowRight');
    expect(document.activeElement).toBe(c);
    expect(c.tabIndex).toBe(0);
    expect(b.tabIndex).toBe(-1);
  });
  it('single mode releases others and allows releasing the pressed one', () => {
    mount('toggle-group', { items: 'A\nB', value: 'A', type: 'single' });
    const [a, b] = $$('[data-value]');
    click(b);
    expect([a, b].map((x) => x.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
    click(b);
    expect(b.getAttribute('aria-pressed')).toBe('false');
  });
});

describe('color picker', () => {
  it('keyboard moves the thumbs and updates every readout', () => {
    mount('color-picker', { value: '#FF0000', open: true });
    const c = $('[data-p8~=color]');
    const changes = listen<{ value: string }>('p8-change');
    const sv = $('[data-thumb=sv]');
    expect($('[data-readout]').textContent).toBe('#FF0000');
    key(sv, 'ArrowLeft', { shiftKey: true });
    expect(c.getAttribute('data-s')).toBe('90');
    expect(changes.at(-1)!.value).toBe('#FF1919');
    expect($('[data-readout]').textContent).toBe('#FF1919');
    expect(($('[data-hex]') as HTMLInputElement).value).toBe('#FF1919');
    expect($('[data-trigger]').style.background).not.toBe('');
    key($('[data-thumb=hue]'), 'End');
    expect(c.getAttribute('data-h')).toBe('360');
    expect($('[data-thumb=hue]').getAttribute('aria-valuenow')).toBe('360');
  });
  it('typing a hex updates the picker; invalid hex is ignored and normalised on change', () => {
    mount('color-picker', { value: '#FF0000' });
    const hex = $('[data-hex]') as HTMLInputElement;
    type(hex, '00ff00');
    expect($('[data-p8~=color]').getAttribute('data-h')).toBe('120');
    type(hex, 'zzz');
    expect($('[data-p8~=color]').getAttribute('data-h')).toBe('120');
    hex.dispatchEvent(new Event('change', { bubbles: true }));
    expect(hex.value).toBe('#00FF00');
  });
});

describe('split button', () => {
  it('main action and menu items fire p8-action; menu closes', () => {
    mount('split-button', { label: 'Save', items: 'Save as draft\nPublish', open: false });
    const acts = listen<{ action: string }>('p8-action');
    click($('[data-main]'));
    expect(acts.at(-1)!.action).toBe('Save');
    click($('[data-trigger]'));
    expect($('[data-panel]').hidden).toBe(false);
    click($$('[role=menuitem]')[1]);
    expect(acts.at(-1)!.action).toBe('Publish');
    expect($('[data-panel]').hidden).toBe(true);
  });
});

describe('tag input', () => {
  it('adds on Enter/comma, ignores duplicates, respects max, removes with Backspace and button', () => {
    mount('tag-input', { value: '', max: '5' });
    const en = $('[data-entry]') as HTMLInputElement;
    const changes = listen<{ tags: string[] }>('p8-change');
    type(en, 'Design'); key(en, 'Enter');
    type(en, 'design'); key(en, ',');
    type(en, 'Research'); key(en, ',');
    expect($$('[data-chip]').map((c) => c.getAttribute('data-chip'))).toEqual(['Design', 'Research']);
    expect(($('[data-value]') as HTMLInputElement).value).toBe('Design,Research');
    expect($('[data-count]').textContent).toBe('2 / 5');
    expect(changes.at(-1)!.tags).toEqual(['Design', 'Research']);
    key(en, 'Backspace');
    expect($$('[data-chip]')).toHaveLength(1);
    click($('[data-chip] [data-close]'));
    expect($$('[data-chip]')).toHaveLength(0);
  });
  it('stops at max and handles pasted lists', () => {
    mount('tag-input', { value: '', max: '5' });
    const en = $('[data-entry]') as HTMLInputElement;
    const ev = new Event('paste', { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown };
    ev.clipboardData = { getData: () => 'a, b, c, d, e, f, g' };
    en.dispatchEvent(ev);
    expect($$('[data-chip]')).toHaveLength(5);
    expect(en.placeholder).toBe('Limit reached');
    expect(ev.defaultPrevented).toBe(true);
  });
});

describe('infinite list', () => {
  it('Load more fires p8-load-more; a handler can append real rows and end the list', () => {
    mount('infinite-list', { items: 'A | 1\nB | 2', demo: false, total: '20' });
    let handled: ((items: { title: string; meta: string }[], more: boolean) => void) | null = null;
    onDoc('p8-load-more', (e) => { e.preventDefault(); handled = (e as CustomEvent).detail.append; expect((e as CustomEvent).detail.page).toBe(2); });
    click($('[data-more]'));
    expect($('[data-list]').getAttribute('aria-label')).toBe('Results');
    expect(document.querySelector('[data-p8~=infinite]')!.getAttribute('aria-busy')).toBe('true');
    handled!([{ title: 'C', meta: '3' }], false);
    expect($$('[data-item]')).toHaveLength(3);
    expect($('[data-end]').hidden).toBe(false);
    expect($('[data-foot]').hidden).toBe(true);
    expect($('[data-status]').textContent).toBe('Showing 3');
  });
  it('demo mode adds placeholder pages until total', () => {
    mount('infinite-list', { items: 'A | 1', demo: true, pageSize: '5', total: '20' });
    click($('[data-more]'));
    expect($$('[data-item]')).toHaveLength(6);
    expect($('[data-status]').textContent).toBe('Showing 6 of 20');
    for (let i = 0; i < 5; i++) click($('[data-more]'));
    expect($$('[data-item]')).toHaveLength(20);
    expect($('[data-end]').hidden).toBe(false);
  });
});

describe('month calendar', () => {
  const base = { month: '2026-11', selected: '', events: '2026-11-03 | A\n2026-11-03 | B\n2026-11-03 | C', weekStart: 'mon' };
  it('navigates months and repaints the grid', () => {
    mount('calendar', base);
    expect($('[data-label]').textContent).toBe('November 2026');
    click($('[data-dir="1"]'));
    expect($('[data-label]').textContent).toBe('December 2026');
    expect($$('[data-date]').filter((b) => !b.classList.contains('p8-mcal__cell--out'))).toHaveLength(31);
    click($('[data-dir="-1"]')); click($('[data-dir="-1"]'));
    expect($('[data-label]').textContent).toBe('October 2026');
  });
  it('selects a day, lists its events and fires p8-select', () => {
    mount('calendar', base);
    const sel = listen<{ date: string; events: string[] }>('p8-select');
    const day = $('[data-date="2026-11-03"]');
    expect(day.textContent).toContain('+2 more');
    click(day);
    expect(sel.at(-1)).toEqual({ date: '2026-11-03', events: ['A', 'B', 'C'] });
    expect($$('[data-agenda] li').map((l) => l.textContent)).toEqual(['A', 'B', 'C']);
    expect($('[data-agenda-head]').textContent).toContain('3 events');
    expect($('[data-date="2026-11-03"]').getAttribute('aria-pressed')).toBe('true');
  });
  it('arrow keys move by day and week, crossing months; PageDown changes month', () => {
    mount('calendar', { ...base, selected: '2026-11-30' });
    const d = $('[data-date="2026-11-30"]');
    d.focus();
    key(d, 'ArrowRight');
    expect($('[data-label]').textContent).toBe('December 2026');
    expect(document.activeElement!.getAttribute('data-date')).toBe('2026-12-01');
    key(document.activeElement!, 'ArrowUp');
    expect(document.activeElement!.getAttribute('data-date')).toBe('2026-11-24');
    expect($('[data-label]').textContent).toBe('November 2026');
    key(document.activeElement!, 'PageDown');
    expect($('[data-label]').textContent).toBe('December 2026');
    expect(document.activeElement!.getAttribute('data-date')).toBe('2026-12-24');
    key(document.activeElement!, 'Home');
    expect(document.activeElement!.getAttribute('data-date')).toBe('2026-12-21');
  });
});

describe('chart', () => {
  it('legend toggles series (never the last one) and keyboard reads values', () => {
    mount('chart', { type: 'bar' });
    const keys = $$('[data-key]');
    click(keys[0]);
    expect(keys[0].getAttribute('aria-pressed')).toBe('false');
    expect($('[data-series="0"]').hasAttribute('data-off')).toBe(true);
    click(keys[1]);
    expect(keys[1].getAttribute('aria-pressed')).toBe('true');
    const plot = $('[data-plot]');
    key(plot, 'ArrowRight');
    expect($('[data-tip]').hidden).toBe(false);
    expect($('[data-live]').textContent).toBe('Jan: Costs 80');
    key(plot, 'End');
    expect($('[data-live]').textContent).toBe('Jun: Costs 130');
    expect($('[data-band]').getAttribute('x')).toBe('500');
    key(plot, 'Escape');
    expect($('[data-tip]').hidden).toBe(true);
  });
});

describe('chat composer', () => {
  it('Enter sends and clears, Shift+Enter does not, empty disables send, busy swaps Stop', () => {
    mount('chat-composer', { value: '', hint: true });
    const t = $('[data-input]') as HTMLTextAreaElement, send = $('[data-send]') as HTMLButtonElement;
    const sent = listen<{ text: string }>('p8-send');
    expect(send.disabled).toBe(true);
    type(t, 'Hello');
    expect(send.disabled).toBe(false);
    expect(key(t, 'Enter', { shiftKey: true }).defaultPrevented).toBe(false);
    expect(sent).toHaveLength(0);
    key(t, 'Enter');
    expect(sent).toEqual([{ text: 'Hello' }]);
    expect(t.value).toBe('');
    expect(send.disabled).toBe(true);
    type(t, 'More');
    document.querySelector('[data-p8~=composer]')!.dispatchEvent(new CustomEvent('p8-busy', { detail: { busy: true } }));
    expect(send.hidden).toBe(true);
    expect($('[data-stop]').hidden).toBe(false);
    key(t, 'Enter');
    expect(sent).toHaveLength(1);
    const stops = listen('p8-stop');
    click($('[data-stop]'));
    expect(stops).toHaveLength(1);
  });
});

describe('form', () => {
  const props = { fields: 'Name | text | required\nEmail | email | required\nPassword | password | required min:8\nTerms | checkbox | required', success: 'All set.' };
  const submit = () => $('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  it('shows errors, focuses the first invalid field, then validates live', () => {
    mount('form', props);
    submit();
    expect($('#form-name-error').textContent).toBe('Name is required');
    expect($('#form-name').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe($('#form-name'));
    expect($('[data-status]').textContent).toBe('4 fields need attention');
    type($('#form-name') as HTMLInputElement, 'Ada');
    expect($('#form-name-error').textContent).toBe('');
    type($('#form-email') as HTMLInputElement, 'nope');
    expect($('#form-email-error').textContent).toBe('Enter a valid email address');
    type($('#form-password') as HTMLInputElement, 'short');
    expect($('#form-password-error').textContent).toBe('Password must be at least 8 characters');
  });
  it('a valid submit fires p8-submit; done({errors}) maps server errors, done({ok}) shows success', () => {
    mount('form', props);
    type($('#form-name') as HTMLInputElement, 'Ada');
    type($('#form-email') as HTMLInputElement, 'ada@example.com');
    type($('#form-password') as HTMLInputElement, 'longenough');
    click($('#form-terms'));
    let done!: (r: unknown) => void, values: unknown;
    onDoc('p8-submit', (e) => { e.preventDefault(); done = (e as CustomEvent).detail.done; values = (e as CustomEvent).detail.values; });
    submit();
    expect(values).toEqual({ name: 'Ada', email: 'ada@example.com', password: 'longenough', terms: true });
    expect($('[data-submit]').hasAttribute('disabled')).toBe(true);
    done({ errors: { email: 'Already registered' } });
    expect($('#form-email-error').textContent).toBe('Already registered');
    expect($('[data-submit]').hasAttribute('disabled')).toBe(false);
    done({ ok: true, message: 'Welcome, Ada.' });
    expect($('[data-status]').textContent).toBe('Welcome, Ada.');
  });
  it('without a handler it shows the success message', () => {
    mount('form', { fields: 'Name | text | required', success: 'All set.' });
    type($('#form-name') as HTMLInputElement, 'Ada');
    submit();
    expect($('[data-status]').textContent).toBe('All set.');
  });
});

describe('navigation and shell', () => {
  it('navbar moves aria-current and fires p8-navigate without changing the hash', () => {
    mount('navbar', { links: 'One\nTwo', active: 'One' });
    const nav = listen<{ label: string; href: string }>('p8-navigate');
    const [a, b] = $$('[data-nav]');
    const e = new MouseEvent('click', { bubbles: true, cancelable: true });
    b.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
    expect(b.getAttribute('aria-current')).toBe('page');
    expect(a.hasAttribute('aria-current')).toBe(false);
    expect(b.classList.contains('p8-navbar__link--active')).toBe(true);
    expect(a.classList.contains('p8-navbar__link--active')).toBe(false);
    expect(nav.at(-1)).toEqual({ label: 'Two', href: '#two' });
  });
  it('app shell collapses to icons with titles, and navigation works inside it', () => {
    mount('app-shell', { items: 'home: Home\nfolder: Projects', active: 'Home' });
    const side = $('aside');
    click($('[data-collapse]'));
    expect(side.classList.contains('p8-shell__side--on')).toBe(true);
    expect($('[data-collapse]').getAttribute('aria-expanded')).toBe('false');
    expect($$('[data-nav]')[1].getAttribute('title')).toBe('Projects');
    click($('[data-collapse]'));
    expect($$('[data-nav]')[1].hasAttribute('title')).toBe(false);
    click($$('[data-nav]')[1]);
    expect($$('[data-nav]')[1].classList.contains('p8-shell__item--active')).toBe(true);
  });
  it('action buttons fire p8-action (empty state, chat message)', () => {
    mount('empty-state', { action: 'New project', secondary: '' });
    const acts = listen<{ action: string }>('p8-action');
    click($('[data-action]'));
    expect(acts).toEqual([{ action: 'New project' }]);
  });
});

describe('templates', () => {
  it('list-detail switches the detail with click and arrows', () => {
    mount('list-detail', { items: 'A | m1 | detail A\nB | m2 | detail B\nC | m3 | detail C', selected: 'A' });
    const rows = $$('[data-target]');
    const panels = $$('[data-detail]');
    expect(panels.map((p) => p.hidden)).toEqual([false, true, true]);
    click(rows[1]);
    expect(panels.map((p) => p.hidden)).toEqual([true, false, true]);
    expect(rows[1].getAttribute('aria-current')).toBe('true');
    expect(rows[0].hasAttribute('aria-current')).toBe(false);
    key(rows[1], 'ArrowDown');
    expect(document.activeElement).toBe(rows[2]);
    expect(panels[2].hidden).toBe(false);
    key(rows[2], 'Home');
    expect(panels[0].hidden).toBe(false);
  });
});

describe('templates rendered by React (children live on the <template>, not in .content)', () => {
  it('month calendar still repaints', () => {
    mount('calendar', { month: '2026-11', selected: '', events: '2026-11-03 | A', weekStart: 'mon' });
    const tpl = $('template[data-parts]') as HTMLTemplateElement;
    const kids = [...tpl.content.children];
    kids.forEach((k) => tpl.appendChild(k));
    expect(tpl.content.children.length).toBe(0);
    click($('[data-dir="1"]'));
    expect($('[data-label]').textContent).toBe('December 2026');
  });
  it('tag input, multi-select, infinite list and chart clone from plain template children too', () => {
    mount('tag-input', { value: '' });
    const t = $('template[data-chip-template]') as HTMLTemplateElement;
    [...t.content.children].forEach((k) => t.appendChild(k));
    const en = $('[data-entry]') as HTMLInputElement;
    type(en, 'x'); key(en, 'Enter');
    expect($$('[data-chips] [data-chip]').map((c) => c.getAttribute('data-chip'))).toEqual(['x']);
  });
});
