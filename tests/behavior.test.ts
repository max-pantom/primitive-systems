// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateById } from '../src/codegen';

let stop: (() => void) | undefined;
afterEach(() => { stop?.(); stop = undefined; document.body.innerHTML = ''; vi.useRealTimers(); });

/** Load the generated plain-HTML output (markup + script) into the document and run its script. */
function mount(id: string, props: Record<string, unknown> = {}) {
  const code = generateById(id, props, 'html').code;
  const script = /<script>([\s\S]*?)<\/script>/.exec(code)?.[1] ?? '';
  document.body.innerHTML = code.replace(/<!--[\s\S]*?-->/g, '').replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<script>[\s\S]*?<\/script>/g, '');
  if (script) stop = new Function(script.replace(/initP8\(document\);\s*$/, 'return initP8(document);'))() as () => void;
  return document.body;
}
const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
const key = (el: Element | Document, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, ...init }));
const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
const $$ = (sel: string) => [...document.querySelectorAll(sel)] as HTMLElement[];

describe('generated behavior', () => {
  it('switch toggles on click and on label click', () => {
    mount('switch', { checked: false });
    const sw = $('[role=switch]');
    expect(sw.getAttribute('aria-checked')).toBe('false');
    click(sw);
    expect(sw.getAttribute('aria-checked')).toBe('true');
    expect(sw.classList.contains('p8-switch--on')).toBe(true);
    expect($('.p8-switch__thumb').classList.contains('p8-switch__thumb--on')).toBe(true);
    click($('label'));
    expect(sw.getAttribute('aria-checked')).toBe('false');
    expect(sw.classList.contains('p8-switch--on')).toBe(false);
  });

  it('checkbox toggles and shows its check without changing the DOM shape', () => {
    mount('checkbox', { checked: false });
    const cb = $('[role=checkbox]');
    const before = cb.innerHTML.length;
    click(cb);
    expect(cb.getAttribute('aria-checked')).toBe('true');
    expect(cb.classList.contains('p8-check__box--on')).toBe(true);
    expect(cb.querySelector('svg')!.classList.contains('p8-check__icon--on')).toBe(true);
    expect(cb.innerHTML.length).toBe(before + ' p8-check__icon--on'.length);
  });

  it('disabled toggles stay put', () => {
    mount('switch', { checked: false, disabled: true });
    click($('[role=switch]'));
    expect($('[role=switch]').getAttribute('aria-checked')).toBe('false');
  });

  it('tabs select on click and move with arrows/Home/End', () => {
    mount('tabs', { tabs: 'A\nB\nC', active: 'A' });
    const tabs = $$('[role=tab]');
    click(tabs[1]);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(tabs[1].classList.contains('p8-tabs__tab--active')).toBe(true);
    key(tabs[1], 'ArrowRight');
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    key(tabs[2], 'ArrowRight');
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    key(tabs[0], 'End');
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(tabs[2].tabIndex).toBe(0);
    expect(tabs[0].tabIndex).toBe(-1);
  });

  it('radio group and segmented control select with arrows', () => {
    for (const id of ['radio-group', 'segmented-control']) {
      mount(id, { options: 'A\nB\nC', value: 'A' });
      const radios = $$('[role=radio]');
      key(radios[0], 'ArrowDown');
      expect(radios[1].getAttribute('aria-checked'), id).toBe('true');
      click(radios[2]);
      expect(radios[2].getAttribute('aria-checked'), id).toBe('true');
      expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
      stop?.(); stop = undefined; document.body.innerHTML = '';
    }
  });

  it('menu moves focus with arrows and reports Escape', () => {
    mount('menu', { items: 'A\nB\nC', active: '' });
    const items = $$('[role=menuitem]');
    items[0].focus();
    key(items[0], 'ArrowDown');
    expect(document.activeElement).toBe(items[1]);
    key(items[1], 'End');
    expect(document.activeElement).toBe(items[2]);
    expect(items[2].classList.contains('p8-menu__item--active')).toBe(true);
    const closed = vi.fn();
    document.addEventListener('p8-close', closed);
    key(items[2], 'Escape');
    expect(closed).toHaveBeenCalled();
    document.removeEventListener('p8-close', closed);
  });

  it('dropdown opens, closes on Escape, outside click and selection', () => {
    mount('dropdown-menu', { open: false, items: 'A\nB' });
    const trigger = $('[data-trigger]'), panel = $('[data-panel]');
    expect(panel.hidden).toBe(true);
    click(trigger);
    expect(panel.hidden).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe($('[role=menuitem]'));
    key($('[role=menuitem]'), 'Escape');
    expect(panel.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
    click(trigger);
    click(document.body);
    expect(panel.hidden).toBe(true);
    click(trigger);
    click($('[role=menuitem]'));
    expect(panel.hidden).toBe(true);
  });

  it('popover toggles', () => {
    mount('popover', { open: false });
    const panel = $('[data-panel]');
    click($('[data-trigger]'));
    expect(panel.hidden).toBe(false);
    click($('[data-trigger]'));
    expect(panel.hidden).toBe(true);
  });

  it('dialog closes on Escape, backdrop click and Cancel; traps Tab', () => {
    mount('dialog');
    const overlay = $('[data-p8~=overlay]');
    key(document, 'Escape');
    expect(overlay.hidden).toBe(true);
    stop?.(); document.body.innerHTML = '';

    mount('dialog');
    click($('[data-p8~=overlay]'));
    expect($('[data-p8~=overlay]').hidden).toBe(true);
    stop?.(); document.body.innerHTML = '';

    mount('dialog');
    click($$('[data-close]')[0]);
    expect($('[data-p8~=overlay]').hidden).toBe(true);
    stop?.(); document.body.innerHTML = '';

    mount('dialog');
    const [cancel, confirm] = $$('button');
    confirm.focus();
    const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    confirm.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(cancel);
  });

  it('toast auto-dismisses and closes', () => {
    vi.useFakeTimers();
    mount('toast', { count: '2', duration: '4000' });
    expect($$('[role=status]')).toHaveLength(2);
    click($('[data-close]'));
    expect($$('[role=status]')).toHaveLength(1);
    vi.advanceTimersByTime(4001);
    expect($$('[role=status]')).toHaveLength(0);
  });

  it('toast with duration 0 stays', () => {
    vi.useFakeTimers();
    mount('toast', { duration: '0' });
    vi.advanceTimersByTime(60000);
    expect($$('[role=status]')).toHaveLength(1);
  });

  it('pagination selects pages and steps', () => {
    mount('pagination', { pages: '5', current: '1' });
    const pages = $$('[data-page]');
    click(pages[3]);
    expect(pages[3].getAttribute('aria-current')).toBe('page');
    expect(pages[0].hasAttribute('aria-current')).toBe(false);
    click($('[data-step="1"]'));
    expect(pages[4].getAttribute('aria-current')).toBe('page');
    click($('[data-step="1"]'));
    expect(pages[4].getAttribute('aria-current')).toBe('page');
    click($('[data-step="-1"]'));
    expect(pages[3].getAttribute('aria-current')).toBe('page');
  });

  it('tag and alert dismiss remove themselves', () => {
    mount('tag');
    click($('[data-close]'));
    expect($('.p8-tag')).toBeNull();
    stop?.(); document.body.innerHTML = '';
    mount('alert', { dismissible: true });
    click($('[data-close]'));
    expect($('[role=alert]')).toBeNull();
  });

  it('copy button copies and swaps its icon back', () => {
    vi.useFakeTimers();
    const writeText = vi.fn();
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });
    mount('copy-button', { text: 'hello' });
    const btn = $('[data-p8~=copy]');
    const [copyIcon, checkIcon] = [...btn.querySelectorAll('svg')];
    click(btn);
    expect(writeText).toHaveBeenCalledWith('hello');
    expect(copyIcon.classList.contains('p8-copybtn__icon--on')).toBe(false);
    expect(checkIcon.classList.contains('p8-copybtn__icon--on')).toBe(true);
    vi.advanceTimersByTime(1600);
    expect(copyIcon.classList.contains('p8-copybtn__icon--on')).toBe(true);
  });

  it('command palette filters, navigates and runs', () => {
    mount('command-palette', { items: 'Alpha\nBeta\nGamma', recent: '' });
    const input = $('input') as HTMLInputElement;
    input.value = 'ga';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const opts = $$('[role=option]');
    expect(opts.map((o) => o.hidden)).toEqual([true, true, false]);
    expect(opts[2].classList.contains('p8-palette__item--active')).toBe(true);
    const run = vi.fn();
    document.addEventListener('p8-run', (e) => run((e as CustomEvent).detail));
    key(input, 'Enter');
    expect(run).toHaveBeenCalledWith({ command: 'Gamma', section: '' });
  });

  it('command palette: sections, shortcuts, recents, no-match message and closing on run', () => {
    mount('command-palette', { items: '# Navigate\nGo home | G H\nGo away\n# Actions\nCreate thing | ⌘N', recent: 'Create thing' });
    const input = $('input') as HTMLInputElement;
    const groups = () => $$('[role=group]').map((g) => [g.getAttribute('aria-label'), g.hidden]);
    expect(groups()).toEqual([['Recent', false], ['Navigate', false], ['Actions', false]]);
    expect($('[data-recent]').getAttribute('aria-keyshortcuts')).toBe('⌘N');
    input.value = 'go'; input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(groups()).toEqual([['Recent', true], ['Navigate', false], ['Actions', true]]);
    input.value = 'zzz'; input.dispatchEvent(new Event('input', { bubbles: true }));
    expect($('[data-empty]').hidden).toBe(false);
    input.value = 'away'; input.dispatchEvent(new Event('input', { bubbles: true }));
    expect($('[data-empty]').hidden).toBe(true);
    const run = vi.fn();
    document.addEventListener('p8-run', (e) => run((e as CustomEvent).detail));
    key(input, 'Enter');
    expect(run).toHaveBeenCalledWith({ command: 'Go away', section: 'Navigate' });
    expect($('[data-p8~=overlay]').hidden).toBe(true);
    expect($$('[data-group=recent] [role=option]').map((o) => o.textContent!.replace(/G H|⌘N/, '').trim())).toEqual(['Go away', 'Create thing']);
    expect(input.value).toBe('');
  });

  it('Cmd/Ctrl+K toggles the palette', () => {
    mount('command-palette');
    const o = $('[data-hotkey]');
    key(document, 'k', { ctrlKey: true });
    expect(o.hidden).toBe(true);
    key(document, 'k', { metaKey: true });
    expect(o.hidden).toBe(false);
  });

  it('tooltip hover hook does not throw', () => {
    mount('tooltip');
    $('button').dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect($('[role=tooltip]')).not.toBeNull();
  });

  it('tree expands, collapses and navigates with the keyboard', () => {
    mount('tree-view', { items: 'src\n  a.ts\n  b.ts\nREADME.md', expand: 'none', selected: '' });
    const items = $$('[role=treeitem]');
    const folder = items[0];
    expect(folder.getAttribute('aria-expanded')).toBe('false');
    expect($('[role=group]').hidden).toBe(true);
    click(folder);
    expect(folder.getAttribute('aria-expanded')).toBe('true');
    expect($('[role=group]').hidden).toBe(false);
    expect(folder.classList.contains('p8-tree__item--on')).toBe(true);
    folder.focus();
    key(folder, 'ArrowRight');
    expect(document.activeElement).toBe(items[1]);
    key(items[1], 'ArrowLeft');
    expect(document.activeElement).toBe(folder);
    key(folder, 'ArrowLeft');
    expect(folder.getAttribute('aria-expanded')).toBe('false');
    key(folder, 'End');
    expect(document.activeElement).toBe(items[3]);
    expect(items[3].classList.contains('p8-tree__item--active')).toBe(true);
  });

  it('timer counts down, pauses, resets and fires done', () => {
    vi.useFakeTimers();
    mount('timer', { seconds: '3' });
    const time = $('[data-time]');
    const done = vi.fn();
    document.addEventListener('p8-timer-done', done);
    expect(time.textContent).toBe('00:03');
    click($('[data-timer=toggle]'));
    vi.advanceTimersByTime(1000);
    expect(time.textContent).toBe('00:02');
    expect($('[data-timer=toggle]').textContent).toBe('Pause');
    click($('[data-timer=toggle]'));
    vi.advanceTimersByTime(5000);
    expect(time.textContent).toBe('00:02');
    click($('[data-timer=toggle]'));
    vi.advanceTimersByTime(2000);
    expect(time.textContent).toBe('00:00');
    expect(done).toHaveBeenCalled();
    expect($('[data-timer=toggle]').textContent).toBe('Start');
    click($('[data-timer=reset]'));
    expect(time.textContent).toBe('00:03');
    document.removeEventListener('p8-timer-done', done);
  });

  it('stopwatch counts up and formats hours', () => {
    vi.useFakeTimers();
    mount('timer', { mode: 'stopwatch', autostart: true });
    vi.advanceTimersByTime(65000);
    expect($('[data-time]').textContent).toBe('01:05');
  });

  it('inline edit saves on Enter, cancels on Escape', () => {
    mount('inline-edit', { value: 'Old', label: 'Title' });
    const view = $('[data-view]'), input = $('[data-edit]') as HTMLInputElement;
    const changed = vi.fn();
    const onChange = (e: Event) => changed((e as CustomEvent).detail.value);
    document.addEventListener('p8-change', onChange);
    click(view);
    expect(input.hidden).toBe(false);
    expect(view.hidden).toBe(true);
    input.value = 'New name';
    key(input, 'Enter');
    expect(view.textContent).toContain('New name');
    expect(view.hidden).toBe(false);
    expect(changed).toHaveBeenCalledWith('New name');
    click(view);
    input.value = 'Discard me';
    key(input, 'Escape');
    expect(view.textContent).toContain('New name');
    expect(input.value).toBe('New name');
    document.removeEventListener('p8-change', onChange);
  });

  it('code block copies exactly the code shown', () => {
    const writeText = vi.fn();
    Object.defineProperty(window.navigator, 'clipboard', { value: { writeText }, configurable: true });
    mount('code-block', { code: '<p8-button>Hi</p8-button>' });
    expect($('pre').textContent).toBe('<p8-button>Hi</p8-button>');
    click($('[data-p8~=copy]'));
    expect(writeText).toHaveBeenCalledWith('<p8-button>Hi</p8-button>');
  });
});

describe('0.9 interactions', () => {
  it('calendar follows typed dates, changes month, selects and closes', () => {
    mount('date-picker');
    const input = $('[data-input]') as HTMLInputElement;
    input.value = '2028-02-29';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect($('[data-label]').textContent).toBe('February 2028');
    expect($('[data-date="2028-02-29"]').getAttribute('aria-pressed')).toBe('true');
    click($('[data-dir="1"]'));
    expect($('[data-label]').textContent).toBe('March 2028');
    click($('[data-date="2028-03-12"]'));
    expect(input.value).toBe('2028-03-12');
    expect($('[data-panel]').hidden).toBe(true);
  });

  it('invalid date props fall back safely and impossible typed dates do not change the calendar', () => {
    expect(() => mount('date-picker', { month: 'bad', value: '2026-99-99' })).not.toThrow();
    const input = $('[data-input]') as HTMLInputElement;
    input.value = '2026-02-31';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect($('[data-label]').textContent).toBe('November 2026');
  });

  it('disabled calendar cannot open or select dates', () => {
    mount('date-picker', { disabled: true });
    click($('[data-trigger]'));
    click($('[data-date="2026-11-12"]'));
    expect($('[data-panel]').hidden).toBe(true);
    expect(($('[data-input]') as HTMLInputElement).value).toBe('');
  });

  it('multi-select filters, selects with the keyboard, removes and closes', () => {
    mount('multi-select');
    const input = $('input') as HTMLInputElement;
    input.value = 'Engineering';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect($$('[role=option]').filter((o) => !o.hidden)).toHaveLength(1);
    key(input, 'Enter');
    expect($('[data-chips]').textContent).toContain('Engineering');
    input.value = '';
    key(input, 'Backspace');
    expect($('[data-chips]').textContent).not.toContain('Engineering');
    key(input, 'Escape');
    expect($('[role=listbox]').hidden).toBe(true);
  });

  it('disabled multi-select cannot remove chips or select options', () => {
    mount('multi-select', { disabled: true });
    click($('[role=option]'));
    click($('[data-close]'));
    expect($('[data-chip]').getAttribute('data-chip')).toBe('Design');
    expect($('[role=listbox]').hidden).toBe(true);
    expect(($('[data-close]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('swatches keep a tab stop for an unknown value and support arrow keys', () => {
    mount('swatch-picker', { value: 'unknown' });
    const radios = $$('[role=radio]');
    expect(radios[0].tabIndex).toBe(0);
    key(radios[0], 'ArrowRight');
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(document.activeElement).toBe(radios[1]);
  });

  it('context menu opens with the keyboard and Escape restores focus', () => {
    mount('context-menu', { open: false });
    key($('[data-area]'), 'F10', { shiftKey: true });
    expect($('[data-panel]').hidden).toBe(false);
    expect(document.activeElement?.getAttribute('role')).toBe('menuitem');
    key($('[role=menuitem]'), 'Escape');
    expect($('[data-panel]').hidden).toBe(true);
    expect(document.activeElement).toBe($('[data-area]'));
  });
});

describe('0.10.0 components', () => {
  const input = (el: HTMLInputElement, value: string) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); };
  const change = (el: HTMLElement) => el.dispatchEvent(new Event('change', { bubbles: true }));

  it('password input reveals text and checks requirements live', () => {
    mount('password-input', { value: '' });
    const field = $('[data-password]') as HTMLInputElement, eye = $('[data-reveal]');
    expect(field.type).toBe('password');
    click(eye);
    expect(field.type).toBe('text');
    expect(eye.getAttribute('aria-pressed')).toBe('true');
    expect(eye.getAttribute('aria-label')).toBe('Hide password');
    click(eye);
    expect(field.type).toBe('password');
    let detail: any;
    document.body.addEventListener('p8-change', (e) => { detail = (e as CustomEvent).detail; });
    input(field, 'abc');
    expect($$('.p8-password__rule--on')).toHaveLength(0);
    expect(detail.valid).toBe(false);
    input(field, 'Abcdefg1!');
    expect($$('.p8-password__rule--on')).toHaveLength(4);
    expect(detail.valid).toBe(true);
  });

  it('data table sorts, selects, runs bulk actions and hides columns', () => {
    mount('data-table');
    const names = () => $$('tbody tr').map((r) => r.querySelector('td[data-col="0"]')!.textContent);
    click($('[data-sort="0"]'));
    expect(names()).toEqual(['Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Katherine Johnson']);
    expect($('th[data-col="0"]').getAttribute('aria-sort')).toBe('ascending');
    click($('[data-sort="0"]'));
    expect(names()[0]).toBe('Katherine Johnson');
    click($('[data-sort="2"]'));
    expect(names()).toEqual(['Grace Hopper', 'Ada Lovelace', 'Katherine Johnson', 'Alan Turing']);
    expect($('th[data-col="0"]').getAttribute('aria-sort')).toBe('none');
    const action = $('[data-action="Delete"]') as HTMLButtonElement;
    expect(action.disabled).toBe(true);
    click($$('[data-pick]')[0]);
    expect($('[data-count]').textContent).toBe('1 selected');
    expect($('[data-all]').getAttribute('aria-checked')).toBe('mixed');
    expect($$('tbody tr')[0].classList.contains('p8-dtable__row--on')).toBe(true);
    expect(action.disabled).toBe(false);
    let detail: any;
    document.body.addEventListener('p8-action', (e) => { detail = (e as CustomEvent).detail; });
    click(action);
    expect(detail).toEqual({ action: 'Delete', rows: [1] });
    click($('[data-all]'));
    expect($('[data-count]').textContent).toBe('4 selected');
    expect($('[data-all]').getAttribute('aria-checked')).toBe('true');
    click($('[data-all]'));
    expect($('[data-count]').textContent).toBe('0 selected');
    const colBox = $('[role=checkbox][data-col="1"]');
    click(colBox);
    expect($$('[data-col="1"]:is(th, td)').every((c) => c.hidden)).toBe(true);
    click(colBox);
    expect($$('[data-col="1"]:is(th, td)').some((c) => c.hidden)).toBe(false);
    click($('[role=checkbox][data-col="0"]')); click($('[role=checkbox][data-col="1"]')); click($('[role=checkbox][data-col="2"]'));
    expect($$('th[data-col]').filter((c) => !c.hidden)).toHaveLength(1);
  });

  it('date range picker picks start then end, highlights the range and closes', () => {
    mount('date-range-picker', { start: '', end: '', month: '2026-11', open: true });
    const day = (iso: string) => $(`[data-date="${iso}"]`);
    expect($('[data-hint]').textContent).toBe('Pick a start date');
    click(day('2026-11-05'));
    expect(($('[data-start]') as HTMLInputElement).value).toBe('2026-11-05');
    expect($('[data-hint]').textContent).toBe('Pick an end date');
    click(day('2026-11-03'));
    expect(($('[data-start]') as HTMLInputElement).value).toBe('2026-11-03');
    let detail: any;
    document.body.addEventListener('p8-change', (e) => { detail = (e as CustomEvent).detail; });
    click(day('2026-11-07'));
    expect(detail).toEqual({ start: '2026-11-03', end: '2026-11-07' });
    expect($('[data-hint]').textContent).toBe('5 days selected');
    expect($$('.p8-cal__day--active').map((b) => b.dataset.date)).toEqual(['2026-11-04', '2026-11-05', '2026-11-06']);
    expect($$('.p8-cal__day--on').map((b) => b.dataset.date)).toEqual(['2026-11-03', '2026-11-07']);
    expect($('[data-panel]').hidden).toBe(true);
    click($('[data-trigger]'));
    expect($('[data-panel]').hidden).toBe(false);
    click($('[data-dir="1"]'));
    expect($('[data-label]').textContent).toBe('December 2026');
    const end = $('[data-end]') as HTMLInputElement;
    end.value = '2026-11-01'; change(end);
    expect(($('[data-start]') as HTMLInputElement).value).toBe('2026-11-01');
    expect(end.value).toBe('2026-11-03');
  });

  it('resizable panels move with the keyboard and clamp to min / max', () => {
    mount('resizable-panels', { size: '40' });
    const h = $('[data-handle]'), pane = $('[data-pane]');
    key(h, 'ArrowRight');
    expect(h.getAttribute('aria-valuenow')).toBe('45');
    expect(pane.style.flexBasis).toBe('45%');
    key(h, 'End');
    expect(h.getAttribute('aria-valuenow')).toBe('80');
    key(h, 'Home');
    expect(h.getAttribute('aria-valuenow')).toBe('20');
    key(h, 'ArrowLeft');
    expect(h.getAttribute('aria-valuenow')).toBe('20');
  });

  it('sortable list reorders with the keyboard and announces the move', () => {
    mount('sortable-list', { items: 'A\nB\nC' });
    const order = () => $$('[data-item]').map((x) => x.dataset.item);
    let detail: any;
    document.body.addEventListener('p8-change', (e) => { detail = (e as CustomEvent).detail; });
    const handleA = $('[data-item="A"] [data-handle]');
    key(handleA, 'ArrowDown');
    expect(order()).toEqual(['B', 'A', 'C']);
    expect(detail.order).toEqual(['B', 'A', 'C']);
    expect($('[data-status]').textContent).toBe('A moved to position 2 of 3');
    expect(handleA.getAttribute('aria-label')).toBe('Move A, position 2 of 3');
    key(handleA, 'End');
    expect(order()).toEqual(['B', 'C', 'A']);
    key($('[data-item="C"] [data-handle]'), 'Home');
    expect(order()).toEqual(['C', 'B', 'A']);
  });

  it('filter bar adds, dedupes, removes and clears filters', () => {
    mount('filter-bar', { value: '' });
    const chips = () => $$('[data-chips] [data-chip]').map((c) => c.dataset.chip);
    expect(($('[data-clear]') as HTMLButtonElement).disabled).toBe(true);
    expect($('[data-empty]').hidden).toBe(false);
    let detail: any;
    document.body.addEventListener('p8-change', (e) => { detail = (e as CustomEvent).detail; });
    click($('[data-add]'));
    expect(chips()).toEqual(['Status: Open']);
    click($('[data-add]'));
    expect(chips()).toEqual(['Status: Open']);
    const field = $('[data-field]') as HTMLSelectElement;
    field.value = 'Owner'; change(field);
    expect($$('[data-value] option').map((o) => o.textContent)).toEqual(['Ada', 'Grace', 'Alan']);
    ($('[data-value]') as HTMLSelectElement).value = 'Grace';
    click($('[data-add]'));
    expect(chips()).toEqual(['Status: Open', 'Owner: Grace']);
    expect(detail.filters).toEqual([{ field: 'Status', value: 'Open' }, { field: 'Owner', value: 'Grace' }]);
    expect($('[data-empty]').hidden).toBe(true);
    click($('[data-chip="Status: Open"] [data-close]'));
    expect(chips()).toEqual(['Owner: Grace']);
    click($('[data-clear]'));
    expect(chips()).toEqual([]);
    expect(detail.filters).toEqual([]);
    expect(($('[data-clear]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('notification list marks one and all as read', () => {
    mount('notification-list');
    expect($('[data-count]').textContent).toBe('2 unread');
    click($$('[data-read]')[0]);
    expect($$('[data-unread="true"]')).toHaveLength(1);
    expect($('[data-count]').textContent).toBe('1 unread');
    expect(document.activeElement).toBe($$('[data-read]')[1]);
    click($('[data-all]'));
    expect($('[data-count]').textContent).toBe('All caught up');
    expect(($('[data-all]') as HTMLButtonElement).disabled).toBe(true);
    expect($$('[data-read]').every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
  });

  it('image viewer opens, steps, wraps and closes back to the thumbnail', () => {
    mount('image-viewer');
    const box = $('[data-lightbox]');
    expect(box.hidden).toBe(true);
    const thumbs = $$('[data-open]');
    thumbs[1].focus();
    click(thumbs[1]);
    expect(box.hidden).toBe(false);
    expect($('[data-counter]').textContent).toBe('2 / 6');
    expect(($('[data-full]') as HTMLImageElement).alt).toBe('Harbour lights');
    key(document, 'ArrowRight');
    expect($('[data-counter]').textContent).toBe('3 / 6');
    click($('[data-lightbox] [data-dir="-1"]'));
    click($('[data-lightbox] [data-dir="-1"]'));
    click($('[data-lightbox] [data-dir="-1"]'));
    expect($('[data-counter]').textContent).toBe('6 / 6');
    expect($('[data-lightbox] [data-caption]').textContent).toBe('Still life');
    key(document, 'Escape');
    expect(box.hidden).toBe(true);
    expect(document.activeElement).toBe(thumbs[1]);
  });
});
