import { usedClasses, ruleMap } from '../components';
import type { ComponentDef, Decls, Node } from '../components';
import { kindsIn } from '../codegen/behavior';
import { theme } from '../tokens/theme';
import { contrast } from './contrast';

/* ---------- Contrast ---------- */
export interface ContrastRow { element: string; sample: string; fg: string; bg: string; state: string; light: number; dark: number; pass: boolean; exempt?: string }

const tokenOf = (v?: string) => v?.match(/var\(--p8-color-([\w-]+)\)/)?.[1];
const hex = (mode: 'light' | 'dark', name: string) => (theme.color[mode] as Record<string, string>)[name];
const textOf = (n: Node | string): string => (typeof n === 'string' ? n : (n.children ?? []).map(textOf).join(''));
const ownText = (n: Node) => (n.children ?? []).filter((c): c is string => typeof c === 'string').join('').trim();
const merged = (cls: string[] | undefined, key: 'base' | 'hover' | 'placeholder'): Decls => Object.assign({}, ...(cls ?? []).map((k) => ruleMap.get(k)?.[key] ?? {}));
const ratio = (mode: 'light' | 'dark', fg: string, bg: string) => Math.round(contrast(hex(mode, fg), hex(mode, bg)) * 100) / 100;

/** Every text/background pair in the rendered tree, resolved through inherited backgrounds, in light and dark. */
export function contrastReport(node: Node): ContrastRow[] {
  const rows = new Map<string, ContrastRow>();
  const add = (el: Node, sample: string, fg: string, bg: string, state: string, exempt?: string) => {
    if (!hex('light', fg) || !hex('light', bg)) return;
    const key = `${fg}|${bg}|${state}`;
    if (rows.has(key)) return;
    const light = ratio('light', fg, bg), dark = ratio('dark', fg, bg);
    rows.set(key, { element: el.cls?.[0] ?? el.tag, sample: sample.slice(0, 28), fg, bg, state, light, dark, pass: light >= 4.5 && dark >= 4.5, exempt });
  };
  const walk = (n: Node, inheritedFg: string, inheritedBg: string) => {
    const base = merged(n.cls, 'base');
    const fg = tokenOf(base.color) ?? inheritedFg;
    const bg = tokenOf(base.background) ?? inheritedBg;
    const text = ownText(n) || (['input', 'textarea', 'select'].includes(n.tag) ? String(n.attrs?.value ?? '') || String(n.attrs?.['aria-label'] ?? 'field text') : '');
    if (text) {
      add(n, text, fg, bg, 'default');
      const hov = tokenOf(merged(n.cls, 'hover').background);
      if (hov) add(n, text, tokenOf(merged(n.cls, 'hover').color) ?? fg, hov, 'hover');
      const ph = tokenOf(merged(n.cls, 'placeholder').color);
      if (ph && n.attrs?.placeholder) add(n, String(n.attrs.placeholder), ph, bg, 'placeholder', 'Placeholder color is the seed #C0C0C0; labels carry the meaning, never the placeholder.');
    }
    for (const c of n.children ?? []) if (typeof c !== 'string') walk(c, fg, bg);
  };
  walk(node, 'ink', 'canvas');
  return [...rows.values()];
}

/* ---------- Keyboard ---------- */
export interface KeyRow { keys: string; does: string }
const KIND_KEYS: Record<string, KeyRow[]> = {
  toggle: [{ keys: 'Space', does: 'Toggle on / off' }],
  group: [{ keys: '← → ↑ ↓', does: 'Move the selection (wraps)' }, { keys: 'Home / End', does: 'Select first / last' }],
  menu: [{ keys: '↑ ↓', does: 'Move between items' }, { keys: 'Home / End', does: 'First / last item' }, { keys: 'Enter', does: 'Choose the item' }, { keys: 'Esc', does: 'Close the menu' }],
  popover: [{ keys: 'Enter / Space', does: 'Open from the trigger' }, { keys: 'Esc', does: 'Close and return focus to the trigger' }],
  overlay: [{ keys: 'Tab / Shift+Tab', does: 'Cycles inside (focus trap)' }, { keys: 'Esc', does: 'Close' }],
  palette: [{ keys: 'Type', does: 'Filter commands' }, { keys: '↑ ↓', does: 'Move' }, { keys: 'Enter', does: 'Run' }, { keys: 'Cmd / Ctrl + K', does: 'Open or close' }],
  combobox: [{ keys: 'Type', does: 'Filter options' }, { keys: '↑ ↓', does: 'Move' }, { keys: 'Enter', does: 'Choose' }, { keys: 'Esc', does: 'Close the list' }],
  otp: [{ keys: 'Type', does: 'Fill and advance' }, { keys: 'Backspace', does: 'Clear and go back' }, { keys: '← →', does: 'Move between boxes' }, { keys: 'Paste', does: 'Fills every box' }],
  rating: [{ keys: '← → ↑ ↓', does: 'Change the rating' }],
  number: [{ keys: '↑ ↓', does: 'Step the value (native)' }, { keys: 'Type', does: 'Enter a number' }],
  pager: [{ keys: 'Enter / Space', does: 'Go to the page' }],
  tooltip: [{ keys: 'Tab', does: 'Focusing the trigger shows the tooltip' }],
};

export function keyboardReport(node: Node): KeyRow[] {
  const out: KeyRow[] = [];
  const push = (rows: KeyRow[]) => rows.forEach((r) => { if (!out.some((o) => o.keys === r.keys && o.does === r.does)) out.push(r); });
  const tags = new Set<string>(); const types = new Set<string>();
  (function walk(n: Node) { tags.add(n.tag); if (typeof n.attrs?.type === 'string') types.add(n.attrs.type); (n.children ?? []).forEach((c) => typeof c !== 'string' && walk(c)); })(node);
  const kinds = kindsIn(node);
  push([{ keys: 'Tab / Shift+Tab', does: 'Move focus to and from the control' }]);
  if (tags.has('button') && !kinds.has('toggle') && !kinds.has('group') && !kinds.has('rating')) push([{ keys: 'Enter / Space', does: 'Activate' }]);
  if (tags.has('a')) push([{ keys: 'Enter', does: 'Follow the link' }]);
  if (tags.has('summary')) push([{ keys: 'Enter / Space', does: 'Open or close' }]);
  if (tags.has('select')) push([{ keys: '↑ ↓', does: 'Change the option' }, { keys: 'Type', does: 'Jump to an option' }]);
  if (types.has('range')) push([{ keys: '← →', does: 'Change the value' }, { keys: 'Home / End', does: 'Minimum / maximum' }, { keys: 'PgUp / PgDn', does: 'Larger step' }]);
  if ((tags.has('input') && ![...types].every((t) => ['range', 'number'].includes(t))) || tags.has('textarea')) if (!kinds.has('otp') && !kinds.has('combobox') && !kinds.has('palette') && !kinds.has('number')) push([{ keys: 'Type', does: 'Enter text' }]);
  for (const k of kinds) push(KIND_KEYS[k] ?? []);
  if (!tags.has('button') && !tags.has('a') && !tags.has('summary') && !tags.has('input') && !tags.has('select') && !tags.has('textarea')) return [{ keys: '—', does: 'Not interactive: no keyboard interaction and not in the tab order' }];
  return out;
}

/* ---------- Labels & roles ---------- */
export interface LabelRow { element: string; role: string; name: string; source: string; state?: string }
export function labelReport(node: Node): LabelRow[] {
  const rows: LabelRow[] = [];
  const labelFor = new Map<string, string>();
  (function find(n: Node) { if (n.tag === 'label' && n.attrs?.for) labelFor.set(String(n.attrs.for), textOf(n).trim()); (n.children ?? []).forEach((c) => typeof c !== 'string' && find(c)); })(node);
  (function walk(n: Node, parents: Node[]) {
    const a = n.attrs ?? {};
    const role = typeof a.role === 'string' ? a.role : ({ button: 'button', a: 'link', input: 'textbox', textarea: 'textbox', select: 'combobox', img: 'img', summary: 'button', progress: 'progressbar', table: 'table', nav: 'navigation', dialog: 'dialog', details: 'group', kbd: 'text' } as Record<string, string>)[n.tag];
    const interesting = a.role || ['button', 'a', 'input', 'textarea', 'select', 'img', 'summary', 'progress', 'nav', 'table'].includes(n.tag);
    if (interesting && role) {
      const labelledParent = [...parents].reverse().find((p) => p.tag === 'label');
      const aria = typeof a['aria-label'] === 'string' ? a['aria-label'] : '';
      const forLabel = typeof a.id === 'string' ? labelFor.get(a.id) : undefined;
      const own = textOf(n).trim();
      const container = ['tablist', 'menu', 'radiogroup', 'listbox', 'toolbar', 'group'].includes(role);
      const [name, source] = !aria && container ? ['—', 'container: name not required'] : aria ? [aria, 'aria-label'] : forLabel ? [forLabel, '<label for>'] : own ? [own, 'visible text'] : labelledParent ? [textOf(labelledParent).trim(), 'wrapping <label>'] : typeof a.alt === 'string' ? [a.alt, 'alt'] : ['', 'none'];
      const state = ['aria-checked', 'aria-selected', 'aria-expanded', 'aria-current', 'aria-invalid', 'aria-valuenow', 'aria-haspopup', 'aria-modal', 'disabled'].filter((k) => a[k] !== undefined).map((k) => (a[k] === true ? k : `${k}=${a[k]}`)).join(' ');
      rows.push({ element: n.tag, role, name: name || '—', source, state: state || undefined });
    }
    (n.children ?? []).forEach((c) => typeof c !== 'string' && walk(c, [...parents, n]));
  })(node, []);
  return rows;
}

export function a11yReport(def: ComponentDef, node: Node) {
  return { contrast: contrastReport(node), keyboard: keyboardReport(node), labels: labelReport(node), classes: usedClasses(node).length };
}
