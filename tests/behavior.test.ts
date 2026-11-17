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
    mount('command-palette', { items: 'Alpha\nBeta\nGamma' });
    const input = $('input') as HTMLInputElement;
    input.value = 'ga';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const opts = $$('[role=option]');
    expect(opts.map((o) => o.hidden)).toEqual([true, true, false]);
    expect(opts[2].classList.contains('p8-palette__item--active')).toBe(true);
    const run = vi.fn();
    opts[2].addEventListener('click', run);
    key(input, 'Enter');
    expect(run).toHaveBeenCalled();
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
});
