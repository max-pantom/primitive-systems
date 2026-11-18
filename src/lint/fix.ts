import { theme } from '../tokens/theme';
import { lintSpacing, snapGap, snapGrid, type LintIssue } from './spacing';

export interface Fix { line: number; rule: LintIssue['rule']; from: string; to: string; note?: string }
export interface FixResult { fixed: string; fixes: Fix[]; remaining: LintIssue[] }

const PROP = '(padding|margin|gap|row-gap|column-gap|border-radius|border-(?:top|bottom)-(?:left|right)-radius|padding-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?|margin-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)';
const CAMEL = '(padding|margin|gap|rowGap|columnGap|borderRadius|padding(?:Top|Right|Bottom|Left|Inline|Block)|margin(?:Top|Right|Bottom|Left|Inline|Block))';
const isGap = (p: string) => /^(gap|row-gap|column-gap|rowGap|columnGap|gap-[xy]|space-[xy])$/.test(p);
const lineOf = (code: string, idx: number) => code.slice(0, idx).split('\n').length;

/* ---------- colours ---------- */
const hexToRgb = (h: string): number[] | null => {
  let x = h.replace('#', '');
  if (x.length === 3 || x.length === 4) x = x.split('').map((c) => c + c).join('');
  if (![6, 8].includes(x.length)) return null;
  return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
};
const TOKENS = (['canvas', 'surface', 'control', 'control-strong', 'ink', 'ink-muted', 'placeholder'] as const).map((k) => ({ k, rgb: hexToRgb(theme.color.light[k])! }));
export function nearestToken(hex: string): { token: string; distance: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const best = TOKENS.map((t) => ({ token: t.k, distance: Math.hypot(...t.rgb.map((c, i) => c - rgb[i])) })).sort((a, b) => a.distance - b.distance)[0];
  return best;
}
const MAX_COLOR_DISTANCE = 48;
const HEX = /(?<![\w&#/-])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;

/* ---------- labels ---------- */
export function tagEnd(code: string, from: number): number {
  let depth = 0;
  let q = '';
  for (let i = from; i < code.length; i++) {
    const c = code[i];
    if (q) { if (c === q && code[i - 1] !== '\\') q = ''; continue; }
    if (depth === 0 && (c === '"' || c === "'")) { q = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') depth = Math.max(0, depth - 1);
    else if (c === '>' && depth === 0) return i;
  }
  return -1;
}
export const attr = (s: string, name: string) => new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{([^}]*)\\})`).exec(s);
export const has = (s: string, name: string) => new RegExp(`(?:^|\\s)${name}(?=[\\s=/>]|$)`).test(s);
const cap = (s: string) => s.replace(/[-_]+/g, ' ').trim().replace(/^./, (c) => c.toUpperCase());

interface LabelHit { start: number; end: number; tag: string; attrs: string; line: number; add?: string; note?: string; why: string }
function labelHits(code: string): LabelHit[] {
  const hits: LabelHit[] = [];
  const re = /<(img|input|textarea|select|button)(?=[\s/>])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const end = tagEnd(code, m.index + m[0].length);
    if (end < 0) continue;
    const raw = code.slice(m.index + m[0].length, end);
    const selfClose = raw.trimEnd().endsWith('/');
    const attrs = selfClose ? raw.trimEnd().slice(0, -1) : raw;
    const line = lineOf(code, m.index);
    if (/\{\s*\.\.\./.test(attrs)) continue;
    const tag = m[1];
    if (tag === 'img') {
      if (!has(attrs, 'alt')) hits.push({ start: m.index, end, tag, attrs, line, add: ' alt=""', note: 'marked decorative; describe the image if it carries meaning', why: '<img> without alt' });
    } else if (tag === 'button') {
      const close = code.indexOf('</button>', end);
      const inner = close > 0 ? code.slice(end + 1, close) : '';
      const named = has(attrs, 'aria-label') || has(attrs, 'aria-labelledby') || has(attrs, 'title');
      if (!named && /<svg|<img|<Icon/i.test(inner) && !inner.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').trim()) hits.push({ start: m.index, end, tag, attrs, line, why: 'icon-only <button> without a name (add aria-label saying what it does)' });
    } else {
      const type = attr(attrs, 'type')?.[1] ?? attr(attrs, 'type')?.[2];
      if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'reset' || type === 'image') continue;
      if (has(attrs, 'aria-label') || has(attrs, 'aria-labelledby') || has(attrs, 'hidden')) continue;
      const id = attr(attrs, 'id');
      const idv = id?.[1] ?? id?.[2];
      if (idv && new RegExp(`(?:for|htmlFor)\\s*=\\s*["'{]\\s*["']?${idv}["']?`).test(code)) continue;
      const name = attr(attrs, 'placeholder')?.[1] ?? attr(attrs, 'placeholder')?.[2] ?? attr(attrs, 'name')?.[1] ?? attr(attrs, 'name')?.[2] ?? type ?? (tag === 'select' ? 'Select' : tag === 'textarea' ? 'Message' : 'Field');
      hits.push({ start: m.index, end, tag, attrs, line, add: ` aria-label="${cap(name)}"`, note: 'label taken from the placeholder/name; use a visible <label> if you can', why: `<${tag}> without a label` });
    }
  }
  return hits;
}

/** All problems in a piece of consumer code: grid, gaps, raw colours and missing labels. */
export function lintAll(code: string): LintIssue[] {
  const issues = lintSpacing(code);
  code.split('\n').forEach((text, i) => {
    if (/^\s*(\/\/|\/\*|\*|<!--)/.test(text)) return;
    for (const m of text.matchAll(HEX)) {
      const before = text.slice(0, m.index);
      if (/url\($/.test(before) || /(href|id|for)\s*=\s*["']?$/.test(before)) continue;
      const near = nearestToken(`#${m[1]}`);
      const ok = near !== null && near.distance <= MAX_COLOR_DISTANCE;
      issues.push({ line: i + 1, rule: 'color', property: 'color', value: `#${m[1]}`, severity: 'error', fixable: ok, message: ok ? `raw colour #${m[1]} — use var(--p8-color-${near!.token})` : `raw colour #${m[1]} has no close theme colour — pick a token or build a theme (build_theme)` });
    }
  });
  for (const h of labelHits(code)) issues.push({ line: h.line, rule: 'label', property: h.tag, value: h.attrs.trim().slice(0, 40), severity: 'error', fixable: Boolean(h.add), message: h.why });
  return issues.sort((a, b) => a.line - b.line);
}

/** Fix what can be fixed safely and report every change; the rest stays in `remaining`. */
export function fixCode(code: string): FixResult {
  const fixes: Fix[] = [];
  let out = code;
  const rec = (idx: number, rule: Fix['rule'], from: string, to: string, note?: string) => { if (from !== to) fixes.push({ line: lineOf(code, idx), rule, from, to, note }); };

  // 1. spacing, radius and gap values (CSS/SCSS, JSX style objects, Tailwind arbitrary values)
  const snap = (prop: string, num: number) => (isGap(prop) ? snapGap(Math.abs(num)) : num === 2 || num === 6 ? num : snapGrid(Math.abs(num)) * (num < 0 ? -1 : 1));
  out = out.replace(new RegExp(`\\b${PROP}(\\s*:\\s*)([^;}"'\`]+)`, 'g'), (all, prop: string, sep: string, val: string, idx: number) =>
    prop + sep + val.replace(/(-?\d*\.?\d+)(px|rem)\b/g, (u, n: string, unit: string) => {
      const px = parseFloat(n) * (unit === 'rem' ? 16 : 1);
      if (px === 0) return u;
      const to = snap(prop, px);
      if (to === px) return u;
      const next = unit === 'rem' ? `${+(to / 16).toFixed(4)}rem` : `${to}px`;
      rec(idx, isGap(prop) ? 'gap' : 'grid', `${prop}: ${u}`, `${prop}: ${next}`);
      return next;
    }));
  out = out.replace(new RegExp(`\\b${CAMEL}(\\s*:\\s*)(['"]?)(-?\\d*\\.?\\d+)(px|rem)?(['"]?)`, 'g'), (all, prop: string, sep: string, q1: string, n: string, unit: string | undefined, q2: string, idx: number) => {
    const px = parseFloat(n) * (unit === 'rem' ? 16 : 1);
    if (px === 0 || (unit && q1 === '' && q2 !== '')) return all;
    const to = snap(prop, px);
    if (to === px) return all;
    rec(idx, isGap(prop) ? 'gap' : 'grid', `${prop}: ${n}${unit ?? ''}`, `${prop}: ${to}${unit ?? ''}`);
    return `${prop}${sep}${q1}${unit === 'rem' ? +(to / 16).toFixed(4) : to}${unit ?? ''}${q2}`;
  });
  out = out.replace(/\b(p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy]|rounded(?:-[a-z]{1,2})?)-\[(-?\d*\.?\d+)(px|rem)\]/g, (all, prop: string, n: string, unit: string, idx: number) => {
    const px = parseFloat(n) * (unit === 'rem' ? 16 : 1);
    if (px === 0) return all;
    const to = snap(prop, px);
    if (to === px) return all;
    const next = `${prop}-[${unit === 'rem' ? +(to / 16).toFixed(4) : to}${unit}]`;
    rec(idx, isGap(prop) ? 'gap' : 'grid', all, next);
    return next;
  });

  // 2. raw colours → nearest named token
  out = out.replace(HEX, (all, h: string, idx: number, whole: string) => {
    const before = whole.slice(Math.max(0, idx - 60), idx);
    if (/url\($/.test(before) || /(href|id|for)\s*=\s*["']?$/.test(before)) return all;
    const near = nearestToken(`#${h}`);
    if (!near || near.distance > MAX_COLOR_DISTANCE) return all;
    const to = `var(--p8-color-${near.token})`;
    rec(idx, 'color', all, to, near.distance > 0 ? `nearest theme colour (distance ${Math.round(near.distance)})` : undefined);
    return to;
  });

  // 3. labels (positions shift as we insert, so go from the end)
  for (const h of labelHits(out).reverse()) {
    if (!h.add) continue;
    const raw = out.slice(h.start, h.end);
    const selfClose = /\/\s*$/.test(raw);
    const next = selfClose ? raw.replace(/\s*\/\s*$/, `${h.add} /`) : raw + h.add;
    out = out.slice(0, h.start) + next + out.slice(h.end);
    fixes.push({ line: h.line, rule: 'label', from: `<${h.tag}>`, to: `<${h.tag}${h.add}>`, note: h.note });
  }

  fixes.sort((a, b) => a.line - b.line);
  return { fixed: out, fixes, remaining: lintAll(out) };
}
