import { components, defaultsOf } from '../components';
import type { ComponentDef, Decls, Node, Rule } from '../components';
import { theme } from '../tokens/theme';
import { EXCEPTIONS, FIELD_CLASSES, GAPS, GRID_SPACE, RADII } from './rulebook';
import { readdirSync, readFileSync } from 'node:fs';
import { site } from '../config/site';

export interface Violation { rule: string; target: string; message: string }

const excepted = (rule: string, target: string) => EXCEPTIONS.some((e) => e.rule === rule && e.target === target);
const tokensIn = (value: string) => [...value.matchAll(/var\(--p8-([\w-]+)\)/g)].map((m) => m[1]);
const entries = (r: Rule) => [['base', r.base], ['hover', r.hover], ['focus', r.focus], ['disabled', r.disabled], ['placeholder', r.placeholder], ...(r.nested ?? []).map((n): [string, Decls] => [`nested ${n.sel}`, n.decls]),
  ...(r.parent?.hover ? [['parent hover', r.parent.hover] as [string, Decls]] : []), ...(r.parent?.active ? [['parent active', r.parent.active] as [string, Decls]] : [])] as [string, Decls | undefined][];

import { contrast } from './contrast';
import { contrastReport } from './a11y';
export { contrast };

export function checkTokens(): Violation[] {
  const out: Violation[] = [];
  for (const mode of ['light', 'dark'] as const) {
    const c = theme.color[mode];
    const text: [string, string[]][] = [['ink', ['canvas', 'surface', 'control', 'control-strong']], ['ink-muted', ['canvas', 'surface', 'control', 'control-strong']], ['ink-inverse', ['ink']]];
    for (const [fg, bgs] of text) for (const bg of bgs) {
      const ratio = contrast((c as Record<string, string>)[fg].slice(0, 7), (c as Record<string, string>)[bg].slice(0, 7));
      if (ratio < 4.5) out.push({ rule: 'a11y', target: `${mode}: ${fg} on ${bg}`, message: `contrast ${ratio.toFixed(2)}:1 is below 4.5:1` });
    }
  }
  for (const [k, val] of Object.entries(theme.space)) if (!['2', '6'].includes(k) && parseInt(val) % 4) out.push({ rule: 'grid', target: `space-${k}`, message: `${val} is not a multiple of 4` });
  return out;
}

export function checkRules(def: ComponentDef): Violation[] {
  const out: Violation[] = [];
  const add = (rule: string, target: string, message: string) => { if (!excepted(rule, target)) out.push({ rule, target, message }); };
  for (const r of def.rules) {
    for (const [state, d] of entries(r)) {
      for (const [prop, value] of Object.entries(d ?? {})) {
        const where = `${r.cls} ${state} ${prop}`;
        if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|\d+(\.\d+)?(px|rem|em)\b/.test(value) && prop !== 'translate' && prop !== 'rotate') add('tokens-only', r.cls, `${where}: raw value "${value}"`);
        const toks = tokensIn(value);
        if (/^(padding|margin)(-(block|inline|top|bottom|left|right|inline-start|inline-end|block-start|block-end))?$/.test(prop) || prop === 'gap') {
          for (const t of toks) {
            if (t.startsWith('space-') && !(GRID_SPACE as readonly string[]).includes(t)) add('grid', r.cls, `${where}: ${t} is off the 4/8 grid`);
            if (prop === 'gap' && !(GAPS as readonly string[]).includes(t)) add('gap', r.cls, `${where}: gap ${t} (allowed: 4, 8, 12)`);
            if (t === 'space-6' && r.cls !== 'p8-menu__item') add('menu-item', r.cls, `${where}: space-6 is reserved for menu items`);
          }
        }
        if (prop === 'border-radius') for (const t of toks) if (!(RADII as readonly string[]).includes(t)) add('grid', r.cls, `${where}: ${t} is not an allowed radius`);
        if (prop === 'font-size' && !/type-size-(sm|md)/.test(value)) add('type-scale', r.cls, `${where}: ${value}`);
        if (prop === 'line-height' && !/type-line-(sm|md)/.test(value)) add('type-scale', r.cls, `${where}: ${value}`);
        if (prop === 'font-weight' && !/type-weight/.test(value) && !/^\d+$/.test(value)) add('type-scale', r.cls, `${where}: ${value}`);
        if (prop === 'font-family' && !/type-(family|mono)/.test(value) && !['inherit'].includes(value)) add('type-scale', r.cls, `${where}: ${value}`);
        if (prop === 'box-shadow' && /color-ring\b/.test(value) && state === 'base') add('hairline', r.cls, `${where}: use the outline hairline, not a box-shadow ring`);
        if (state === 'focus' && prop === 'outline' && value !== 'none') add('focus', r.cls, `${where}: outline rings are not allowed`);
        if (state === 'disabled' && prop === 'opacity' && !value.includes('opacity-disabled')) add('disabled', r.cls, `${where}: use opacity-disabled`);
        if (state === 'disabled' && prop === 'cursor' && value !== 'not-allowed') add('disabled', r.cls, `${where}: cursor must be not-allowed`);
      }
    }
    const b = r.base;
    const pi = b['padding-inline'] ?? (b.padding && b.padding !== '0' ? b.padding : undefined);
    const clickable = b.cursor === 'pointer' || FIELD_CLASSES.includes(r.cls);
    if (clickable && pi && pi !== '0') {
      const isItem = r.cls === 'p8-menu__item';
      if (!isItem && !/space-12/.test(pi) && !excepted('control-padding', r.cls)) add('control-padding', r.cls, `padding-inline is ${pi}, controls use space-12`);
      if (isItem && !(pi.includes('space-6') && /space-4/.test(b['padding-block'] ?? ''))) add('menu-item', r.cls, 'menu item must be 6px sides and 4px top/bottom');
    }
    const surface = b.outline?.includes('color-ring') && (b['padding-inline'] || b.padding) && !b.cursor;
    if (surface) {
      const side = b['padding-inline'] ?? b.padding;
      const block = b['padding-block'] ?? b.padding;
      const ok = /space-16/.test(side) && /space-(12|16)/.test(block);
      if (!ok) add('surface-padding', r.cls, `surface padding ${side}/${block} must be 16 sides and 12 or 16 top/bottom`);
    }
    if (r.cls === 'p8-tabs' && b.gap !== 'var(--p8-space-12)') add('tabs-spacing', r.cls, 'tabs gap must be space-12');
  }
  return out;
}

/* ---------- accessibility + structure over rendered defaults and an alternate variant ---------- */
const kids = (n: Node): Node[] => (n.children ?? []).filter((c): c is Node => typeof c !== 'string');
const textOf = (n: Node | string): string => (typeof n === 'string' ? n : (n.children ?? []).map(textOf).join(''));
function walk(n: Node, f: (n: Node, parents: Node[]) => void, parents: Node[] = []) { f(n, parents); kids(n).forEach((k) => walk(k, f, [...parents, n])); }

export function checkNode(def: ComponentDef, node: Node, label: string): Violation[] {
  const out: Violation[] = [];
  const add = (rule: string, msg: string) => out.push({ rule, target: `${def.id} (${label})`, message: msg });
  const ids = new Set<string>();
  const labels = new Set<string>();
  walk(node, (n) => { if (n.tag === 'label' && n.attrs?.for) labels.add(String(n.attrs.for)); });
  walk(node, (n, parents) => {
    const a = n.attrs ?? {};
    if (typeof a.id === 'string') { if (ids.has(a.id)) add('a11y', `duplicate id ${a.id}`); ids.add(a.id); }
    const interactive = ['button', 'a', 'input', 'select', 'textarea', 'summary'].includes(n.tag);
    if (interactive && parents.some((p) => ['button', 'a'].includes(p.tag))) add('a11y', `<${n.tag}> nested inside an interactive element`);
    if (n.tag === 'button' && !textOf(n).trim() && !a['aria-label'] && !parents.some((p) => p.tag === 'label' && textOf(p).trim())) add('a11y', 'button without text or aria-label');
    if (n.tag === 'a' && !textOf(n).trim() && !a['aria-label']) add('a11y', 'link without text or aria-label');
    if (['input', 'select', 'textarea'].includes(n.tag) && a.type !== 'hidden' && !a['aria-label'] && !(typeof a.id === 'string' && labels.has(a.id)) && !parents.some((p) => p.tag === 'label')) add('a11y', `<${n.tag}> has no label`);
    if (n.tag === 'img' && a.alt === undefined) add('a11y', 'img without alt');
    if (n.tag === 'svg' && a.role === 'img' && !a['aria-label']) add('a11y', 'svg role=img without aria-label');
    if (n.tag === 'svg' && n.cls?.includes('p8-icon')) {
      const w = Number(a.width);
      if (![14, 16].includes(w)) add('icons', `icon is ${a.width}px (allowed: 14, 16)`);
      if (a['aria-hidden'] !== 'true') add('a11y', 'decorative icon must be aria-hidden');
    }
    if (a.role === 'checkbox' || a.role === 'switch' || a.role === 'radio') if (a['aria-checked'] === undefined) add('a11y', `role=${a.role} without aria-checked`);
    if (a.role === 'tab' && a['aria-selected'] === undefined) add('a11y', 'role=tab without aria-selected');
    if (a.role === 'combobox' && a['aria-expanded'] === undefined) add('a11y', 'role=combobox without aria-expanded');
    if (a['aria-haspopup'] && a['aria-expanded'] === undefined) add('a11y', 'trigger with aria-haspopup needs aria-expanded');
    if (a.role === 'dialog' && !a['aria-label'] && !a['aria-labelledby'] && !kids(n).some((k) => textOf(k).trim())) add('a11y', 'dialog without a name');
  });
  return out;
}

export function checkSource(): Violation[] {
  const out: Violation[] = [];
  for (const f of readdirSync('src/components')) {
    const src = readFileSync(`src/components/${f}`, 'utf8');
    if (src.includes(site.name)) out.push({ rule: 'no-brand', target: f, message: `contains "${site.name}"` });
    if (/#[0-9a-fA-F]{3,8}\b/.test(src.replace(/'#'/g, ''))) out.push({ rule: 'tokens-only', target: f, message: 'raw hex in component source' });
  }
  return out;
}

export function variants(def: ComponentDef): Record<string, string | boolean>[] {
  const alt: Record<string, string | boolean> = { ...defaultsOf(def.props) };
  for (const p of def.props) {
    if (p.control.kind === 'select') alt[p.name] = p.control.options[p.control.options.length - 1] === p.default ? p.control.options[1] ?? p.default : p.control.options[p.control.options.length - 1];
    else if (p.control.kind === 'boolean') alt[p.name] = !p.default;
  }
  return [defaultsOf(def.props), alt];
}

export function checkAll(): Violation[] {
  const out: Violation[] = [...checkTokens(), ...checkSource()];
  for (const def of components) {
    out.push(...checkRules(def));
    variants(def).forEach((props, i) => {
      const node = def.render(props);
      out.push(...checkNode(def, node, i === 0 ? 'defaults' : 'alt'));
      for (const r of contrastReport(node)) if (!r.pass && !r.exempt) out.push({ rule: 'a11y', target: `${def.id} (${i === 0 ? 'defaults' : 'alt'})`, message: `text "${r.sample}" ${r.fg} on ${r.bg} (${r.state}): ${r.light}:1 light, ${r.dark}:1 dark (needs 4.5:1)` });
    });
    if (!def.guidelines?.do.length || !def.guidelines?.dont.length) out.push({ rule: 'guidelines', target: def.id, message: 'missing guidelines (do / dont)' });
  }
  return out;
}
