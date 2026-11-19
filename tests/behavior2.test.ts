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

describe('mention input', () => {
  const people = 'Ada Lovelace\nAlan Turing\nGrace Hopper';
  const ta = () => $('[data-input]') as HTMLTextAreaElement;
  const typeAt = (v: string) => { ta().value = v; ta().setSelectionRange(v.length, v.length); ta().dispatchEvent(new Event('input', { bubbles: true })); };
  it('opens on the trigger, filters, navigates and inserts the name', () => {
    mount('mention-input', { people });
    const list = $('[data-list]');
    expect(list.hidden).toBe(true);
    typeAt('Hi @');
    expect(list.hidden).toBe(false);
    expect(ta().getAttribute('aria-expanded')).toBe('true');
    expect($$('[role=option]').filter((o) => !o.hidden)).toHaveLength(3);
    typeAt('Hi @al');
    expect($$('[role=option]').filter((o) => !o.hidden).map((o) => o.textContent)).toEqual(['Alan Turing']);
    expect(ta().getAttribute('aria-activedescendant')).toBe('mention-opt-1');
    const mentions = listen<{ name: string; trigger: string }>('p8-mention');
    key(ta(), 'Enter');
    expect(ta().value).toBe('Hi @Alan Turing ');
    expect(mentions).toEqual([{ name: 'Alan Turing', trigger: '@' }]);
    expect(list.hidden).toBe(true);
    expect(ta().selectionStart).toBe('Hi @Alan Turing '.length);
  });
  it('arrow keys move, Escape closes, and it ignores @ inside words and emails', () => {
    mount('mention-input', { people });
    typeAt('@');
    key(ta(), 'ArrowDown');
    expect($$('[role=option]')[1].classList.contains('p8-mention__option--active')).toBe(true);
    key(ta(), 'ArrowUp'); key(ta(), 'ArrowUp');
    expect($$('[role=option]')[2].classList.contains('p8-mention__option--active')).toBe(true);
    key(ta(), 'Escape');
    expect($('[data-list]').hidden).toBe(true);
    typeAt('mail me at ada@');
    expect($('[data-list]').hidden).toBe(true);
    typeAt('line one\n@gr');
    expect($$('[role=option]').filter((o) => !o.hidden).map((o) => o.textContent)).toEqual(['Grace Hopper']);
  });
  it('works with other triggers and clicks', () => {
    mount('mention-input', { people: 'design\nresearch', trigger: '#' });
    typeAt('tag #re');
    click($$('[role=option]').find((o) => !o.hidden)!);
    expect(ta().value).toBe('tag #research ');
  });
});

describe('rich text', () => {
  const calls: [string, unknown][] = [];
  const setup = (props: Record<string, unknown> = {}) => {
    calls.length = 0;
    (document as unknown as { execCommand: unknown }).execCommand = vi.fn((c: string, _u: boolean, v?: unknown) => { calls.push([c, v]); return true; });
    mount('rich-text', props);
  };
  it('toolbar buttons run the matching command, keep the selection (mousedown prevented) and report changes', () => {
    setup();
    const changes = listen<{ html: string }>('p8-change');
    const md = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    $('[data-cmd=bold]').dispatchEvent(md);
    expect(md.defaultPrevented).toBe(true);
    click($('[data-cmd=bold]')); click($('[data-cmd=ul]')); click($('[data-cmd=ol]')); click($('[data-cmd=undo]')); click($('[data-cmd=h2]')); click($('[data-cmd=quote]'));
    expect(calls.map((c) => c[0])).toEqual(['bold', 'insertUnorderedList', 'insertOrderedList', 'undo', 'formatBlock', 'formatBlock']);
    expect(calls[4][1]).toBe('h2');
    expect(calls[5][1]).toBe('blockquote');
    expect(changes.at(-1)!.html).toContain('<p>');
  });
  it('link flow: validates the address (no javascript:), applies with createLink, cancels with Escape', () => {
    setup();
    click($('[data-cmd=link]'));
    const bar = $('[data-linkbar]'), url = $('[data-url]') as HTMLInputElement, err = $('[data-linkerr]');
    expect(bar.hidden).toBe(false);
    url.value = 'javascript:alert(1)';
    key(url, 'Enter');
    expect(err.hidden).toBe(false);
    expect(url.getAttribute('aria-invalid')).toBe('true');
    expect(calls.filter((c) => c[0] === 'createLink')).toEqual([]);
    url.value = 'https://example.com';
    key(url, 'Enter');
    expect(calls.at(-1)).toEqual(['createLink', 'https://example.com']);
    expect(bar.hidden).toBe(true);
    click($('[data-cmd=link]'));
    key(url, 'Escape');
    expect(bar.hidden).toBe(true);
  });
  it('pastes plain text only and roves the toolbar with arrows', () => {
    setup();
    const ev = new Event('paste', { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown };
    ev.clipboardData = { getData: (t: string) => (t === 'text/plain' ? 'plain' : '<b>x</b>') };
    $('[data-editor]').dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(calls.at(-1)).toEqual(['insertText', 'plain']);
    const btns = $$('[data-cmd]');
    btns[0].focus();
    key(btns[0], 'ArrowRight');
    expect(document.activeElement).toBe(btns[1]);
    expect(btns[1].tabIndex).toBe(0);
    expect(btns[0].tabIndex).toBe(-1);
    key(btns[1], 'End');
    expect(document.activeElement).toBe(btns[btns.length - 1]);
  });
  it('is a labelled textbox; disabled makes it read only', () => {
    setup({ disabled: true });
    expect($('[data-editor]').getAttribute('contenteditable')).toBe('false');
    expect($('[data-editor]').getAttribute('role')).toBe('textbox');
    expect($('[role=toolbar]').getAttribute('aria-label')).toContain('formatting');
  });
});

describe('segmented progress and skeleton variants', () => {
  it('segments report the overall percent', () => {
    mount('segmented-progress', { segments: '4', done: '2', current: '50' });
    const pb = $('[role=progressbar]');
    expect(pb.getAttribute('aria-valuenow')).toBe('63');
    expect(pb.getAttribute('aria-valuetext')).toBe('2 of 4 parts done, next 50%');
  });
});

describe('media timeline', () => {
  const root = () => $('[data-p8~=mediatl]');
  const time = () => Number(root().getAttribute('data-time'));
  const clip = (name: string) => $$('[data-clip]').find((c) => c.querySelector('[data-name]')!.textContent === name)!;
  const info = (c: HTMLElement) => ({ track: c.parentElement!.getAttribute('data-track'), start: Number(c.getAttribute('data-start')), dur: Number(c.getAttribute('data-dur')) });
  const ptr = (type: string, el: Element | Document, x: number, y = 0) => el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0 }));
  const rect = (o: Partial<DOMRect>) => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON() {}, ...o }) as DOMRect;
  const layout = () => {
    $('[data-canvas]').getBoundingClientRect = () => rect({ left: 0, width: 720 });
    $$('[data-lane]').forEach((l, i) => { l.getBoundingClientRect = () => rect({ top: 24 + i * 48, bottom: 72 + i * 48, height: 48 }); });
  };
  const noOverlap = () => $$('[data-lane]').forEach((l) => {
    const cs = [...l.querySelectorAll('[data-clip]')].map((c) => [Number(c.getAttribute('data-start')), Number(c.getAttribute('data-start')) + Number(c.getAttribute('data-dur'))]).sort((a, b) => a[0] - b[0]);
    cs.forEach((c, i) => i && expect(c[0], l.getAttribute('data-track')!).toBeGreaterThanOrEqual(cs[i - 1][1] - 1e-6));
  });

  it('renders tracks, clips, ruler slider and timecode', () => {
    mount('media-timeline');
    expect($$('[data-lane]').map((l) => l.getAttribute('data-track'))).toEqual(['Video 2', 'Video 1', 'Audio 1']);
    expect($$('[data-clip]')).toHaveLength(4);
    expect($('[data-timecode]').textContent).toBe('00:00:00:00');
    const ru = $('[data-ruler]');
    expect([ru.getAttribute('role'), ru.getAttribute('aria-valuemax'), ru.getAttribute('aria-valuetext')]).toEqual(['slider', '30', '00:00:00:00']);
    expect(clip('Interview').getAttribute('aria-label')).toBe('Interview, Video 1, starts at 00:00:06:15, 12 seconds');
    expect($$('[data-tick]').map((t) => t.textContent).slice(0, 3)).toEqual(['0:00', '0:05', '0:10']);
  });

  it('ruler keyboard: frames, seconds, 5 s pages, Home and End, with p8-seek events', () => {
    mount('media-timeline');
    const ru = $('[data-ruler]');
    const seeks = listen<{ time: number; timecode: string }>('p8-seek');
    key(ru, 'ArrowRight');
    expect($('[data-timecode]').textContent).toBe('00:00:00:01');
    key(ru, 'ArrowRight', { shiftKey: true });
    expect(time()).toBeCloseTo(1 + 1 / 30, 5);
    key(ru, 'PageUp'); expect(time()).toBeCloseTo(6 + 1 / 30, 5);
    key(ru, 'End'); expect(time()).toBe(30);
    key(ru, 'ArrowRight'); expect(time()).toBe(30);
    key(ru, 'Home'); expect(time()).toBe(0);
    expect(seeks.at(-1)).toEqual({ time: 0, timecode: '00:00:00:00' });
    expect($('[data-live]').textContent).toBe('00:00:00:00');
  });

  it('scrubs by dragging on the ruler and on empty lane space, snapping to clip edges', () => {
    mount('media-timeline', { snap: false });
    layout();
    ptr('pointerdown', $('[data-ruler]'), 240);
    expect(time()).toBe(10);
    ptr('pointermove', document, 480);
    expect(time()).toBe(20);
    ptr('pointerup', document, 480);
    ptr('pointermove', document, 120);
    expect(time()).toBe(20);
    root().setAttribute('data-snap', 'true');
    ptr('pointerdown', $('[data-ruler]'), 6.1 * 24);
    expect(time()).toBeCloseTo(6, 1);
    ptr('pointerup', document, 0);
  });

  it('plays in real time, pauses, restarts from the start at the end, and swaps the icon', () => {
    vi.useFakeTimers();
    mount('media-timeline', { time: '1' });
    const btn = $('[data-act=play]');
    click(btn);
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('aria-label')).toBe('Pause');
    vi.advanceTimersByTime(2000);
    expect(time()).toBeCloseTo(3, 1);
    click(btn);
    const at = time();
    vi.advanceTimersByTime(5000);
    expect(time()).toBe(at);
    expect(btn.getAttribute('aria-label')).toBe('Play');
    click(btn);
    vi.advanceTimersByTime(40000);
    expect(time()).toBe(30);
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    click(btn);
    vi.advanceTimersByTime(1000);
    expect(time()).toBeCloseTo(1, 1);
  });

  it('selects clips (click or keyboard activation) and reports them', () => {
    mount('media-timeline');
    const sel = listen<{ clip: { name: string; track: string } | null }>('p8-select');
    click(clip('Title'));
    expect(clip('Title').getAttribute('aria-pressed')).toBe('true');
    expect(clip('Title').classList.contains('p8-mt__clip--on')).toBe(true);
    expect(clip('Title').tabIndex).toBe(0);
    expect(clip('Intro').tabIndex).toBe(-1);
    expect(sel.at(-1)!.clip).toMatchObject({ name: 'Title', track: 'Video 2' });
  });

  it('split cuts the selected clip at the playhead and keeps both halves on the track', () => {
    mount('media-timeline');
    const changes = listen<{ clips: unknown[] }>('p8-change');
    click(clip('Interview'));
    key($('[data-ruler]'), 'End');
    $('[data-ruler]').setAttribute('data-x', '');
    root().setAttribute('data-time', '10');
    click($('[data-act=split]'));
    const parts = $$('[data-clip]').filter((c) => c.querySelector('[data-name]')!.textContent === 'Interview').map(info);
    expect(parts).toEqual([{ track: 'Video 1', start: 6.5, dur: 3.5 }, { track: 'Video 1', start: 10, dur: 8.5 }]);
    expect(changes.at(-1)!.clips).toHaveLength(5);
    expect($('[data-live]').textContent).toContain('Split at');
    noOverlap();
  });

  it('delete removes the selected clip and selects its neighbour; with nothing selected it says so', () => {
    mount('media-timeline');
    click($('[data-act=delete]'));
    expect($('[data-live]').textContent).toBe('Select a clip first');
    const intro = clip('Intro');
    key(intro, 'Delete');
    expect($$('[data-clip]')).toHaveLength(3);
    expect(clip('Interview').getAttribute('aria-pressed')).toBe('true');
  });

  it('trims to the playhead with [ and ], never past a neighbour or outside the clip', () => {
    mount('media-timeline');
    const iv = clip('Interview');
    root().setAttribute('data-time', '8');
    key(iv, ']');
    expect(info(iv)).toEqual({ track: 'Video 1', start: 6.5, dur: 1.5 });
    root().setAttribute('data-time', '7');
    key(iv, '[');
    expect(info(iv)).toEqual({ track: 'Video 1', start: 7, dur: 1 });
    root().setAttribute('data-time', '2');
    key(iv, ']');
    expect($('[data-live]').textContent).toContain('inside the clip');
    expect(info(iv).dur).toBe(1);
  });

  it('drags handles to trim and bodies to move, keeping clips from overlapping', () => {
    mount('media-timeline', { snap: false });
    layout();
    const intro = clip('Intro'), iv = clip('Interview');
    ptr('pointerdown', iv.querySelector('[data-handle=start]')!, 6.5 * 24, 90);
    ptr('pointermove', document, 5 * 24, 90);
    ptr('pointerup', document, 5 * 24, 90);
    expect(info(iv).start).toBe(6);
    ptr('pointerdown', intro.querySelector('[data-handle=end]')!, 6 * 24, 90);
    ptr('pointermove', document, 7 * 24, 90);
    ptr('pointerup', document, 7 * 24, 90);
    expect(info(intro).dur).toBe(6);
    const title = clip('Title');
    const changes = listen<{ clips: { name: string; start: number }[] }>('p8-change');
    ptr('pointerdown', title, 48, 40);
    ptr('pointermove', document, 48 + 2 * 24, 40);
    ptr('pointerup', document, 48 + 2 * 24, 40);
    expect(info(title)).toEqual({ track: 'Video 2', start: 3, dur: 4 });
    expect(changes.at(-1)!.clips.find((c) => c.name === 'Title')!.start).toBe(3);
    ptr('pointerdown', title, 100, 40);
    ptr('pointermove', document, 100, 90);
    ptr('pointerup', document, 100, 90);
    expect(title.parentElement!.getAttribute('data-track')).toBe('Video 1');
    noOverlap();
  });

  it('keyboard moves clips: Alt+arrows nudge frames/seconds and change track; plain arrows move focus', () => {
    mount('media-timeline', { snap: false });
    const title = clip('Title');
    key(title, 'ArrowRight', { altKey: true });
    expect(info(title).start).toBeCloseTo(1 + 1 / 30, 3);
    key(title, 'ArrowRight', { altKey: true, shiftKey: true });
    expect(info(title).start).toBeCloseTo(2 + 1 / 30, 3);
    const intro = clip('Intro');
    intro.focus();
    key(intro, 'ArrowRight');
    expect(document.activeElement).toBe(clip('Interview'));
    key(document.activeElement!, 'ArrowDown');
    expect(document.activeElement).toBe(clip('Music'));
    key(document.activeElement!, 'ArrowUp');
    expect(info(document.activeElement as HTMLElement).track).toBe('Video 1');
    key(clip('Music'), 'ArrowUp', { altKey: true });
    noOverlap();
  });

  it('zoom rescales the ruler and keeps the toolbar label; snapping toggles', () => {
    mount('media-timeline');
    const before = $$('[data-tick]').length;
    click($('[data-act=zoomin]'));
    expect(root().getAttribute('data-pps')).toBe('36');
    expect(root().style.getPropertyValue('--p8-pps')).toBe('36');
    expect($('[data-zoomlabel]').textContent).toBe('1.5×');
    expect($$('[data-tick]').length).toBeGreaterThan(before);
    click($('[data-act=zoomout]')); click($('[data-act=zoomout]'));
    expect(Number(root().getAttribute('data-pps'))).toBeLessThan(24);
    click($('[data-act=snap]'));
    expect(root().getAttribute('data-snap')).toBe('false');
    expect($('[data-act=snap]').getAttribute('aria-pressed')).toBe('false');
    const w = new Event('wheel', { bubbles: true, cancelable: true }) as Event & { ctrlKey: boolean; deltaY: number };
    Object.assign(w, { ctrlKey: true, deltaY: -1 });
    const p0 = Number(root().getAttribute('data-pps'));
    $('[data-scroll]').dispatchEvent(w);
    expect(Number(root().getAttribute('data-pps'))).toBeGreaterThan(p0);
    expect(w.defaultPrevented).toBe(true);
  });
});
