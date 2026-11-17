import { v } from '../tokens/theme';
import { button, c as bc, iconNode, iconRule } from './button';
import { i as inp } from './forms';
import { f } from './forms';
import { tag } from './bits';
import { menu } from './display';
import { po, popRules } from './overlay';
import { P, focus, hiddenRule, lines, motion, n, p, ringDecl, text } from './shared';
import type { IconName } from '../icons/icons';
import type { ComponentDef, Node, Props, Rule } from './types';

const btn = (label: string, variant: 'default' | 'primary' | 'ghost', extra: Node['attrs'] = {}, icon: IconName | 'none' = 'none', fullWidth = false): Node => {
  const b = button.render({ label, variant, size: 'md', icon, iconSize: '14', iconPosition: 'start', fullWidth, disabled: false });
  return { ...b, attrs: { ...b.attrs, ...extra } };
};
const dis = (on: unknown): Node['attrs'] => (on ? { disabled: true } : {});
/** Visually hidden but read by screen readers. */
export const srOnly: Rule['base'] = { position: 'absolute', width: v('size-16'), height: v('size-16'), overflow: 'hidden', 'clip-path': 'inset(50%)', 'white-space': 'nowrap' };

/* ---------- Toggle group ---------- */
const tgp = { root: `${p}-togglegroup`, item: `${p}-togglegroup__item`, on: `${p}-togglegroup__item--on` };
export const toggleGroup: ComponentDef = {
  id: 'toggle-group', name: 'Toggle Group', description: 'A set of toggle buttons; one or several can be pressed.', tags: ['control', 'form'], status: 'stable',
  usage: 'Each option is a button with aria-pressed. With type "multiple" any number can be pressed (bold, italic, underline); with "single" pressing one releases the others, and pressing it again releases it. Arrow keys move between options. Fires p8-change with { value: [labels] }.',
  composition: 'Looks like a Segmented Control; use Segmented Control when exactly one option must always be chosen.',
  props: [
    P.area('items', 'Bold\nItalic\nUnderline', 'Options, one per line.', 'string (one per line)'),
    P.area('value', 'Bold', 'Pressed options, one per line.', 'string (one per line)'),
    P.select('type', ['multiple', 'single'], 'multiple', 'Whether several options can be pressed at once.'),
    P.text('label', 'Text style', 'Accessible name of the group.'),
    P.bool('disabled', false, 'Disables every option.'),
  ],
  rules: [
    { cls: tgp.root, base: { display: 'inline-flex', gap: v('space-4'), padding: v('space-4'), 'box-sizing': 'border-box', 'border-radius': v('radius-12'), background: v('color-control') } },
    { cls: tgp.item, base: { 'padding-block': v('space-4'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), border: 'none', background: 'transparent', color: v('color-ink-muted'), cursor: 'pointer', transition: `background ${motion}, color ${motion}`, ...text('sm') }, hover: { color: v('color-ink') }, focus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: tgp.on, base: { background: v('color-canvas'), color: v('color-ink'), ...ringDecl } },
  ],
  render(pr: Props): Node {
    const items = [...new Set(lines(pr.items))];
    let pressed = lines(pr.value).filter((x) => items.includes(x));
    if (pr.type === 'single') pressed = pressed.slice(0, 1);
    const first = items.findIndex((x) => pressed.includes(x));
    return n('div', [tgp.root], items.map((x, i) => n('button', pressed.includes(x) ? [tgp.item, tgp.on] : [tgp.item], [x], {
      type: 'button', 'aria-pressed': String(pressed.includes(x)), 'data-value': x, tabindex: i === Math.max(0, first) ? '0' : '-1', ...dis(pr.disabled),
    })), { role: 'group', 'aria-label': (pr.label as string) || 'Options', 'data-type': pr.type as string, 'data-p8': 'togglegroup' });
  },
};

/* ---------- Link ---------- */
const lk = { root: `${p}-link`, muted: `${p}-link--muted`, icon: `${p}-link__icon`, sr: `${p}-link__sr` };
export const link: ComponentDef = {
  id: 'link', name: 'Link', content: 'label', description: 'An inline text link, optionally opening in a new tab.', tags: ['navigation', 'content'], status: 'stable',
  usage: 'Use for navigation, not actions (use Button for actions). It inherits the surrounding font size. External links open in a new tab with rel="noopener noreferrer", show an icon and tell screen readers "(opens in a new tab)".',
  props: [
    P.text('label', 'Read the docs', 'Link text. Say where it goes; never "click here".'),
    P.text('href', '/docs', 'Destination URL.'),
    P.select('variant', ['default', 'muted'], 'default', 'Ink or muted text; both are underlined.'),
    P.bool('external', false, 'Opens in a new tab and shows an external icon.'),
  ],
  rules: [
    { cls: lk.root, base: { color: v('color-ink'), 'text-decoration-line': 'underline', 'text-decoration-color': v('color-ink-muted'), 'text-underline-offset': v('space-4'), 'border-radius': v('radius-4'), cursor: 'pointer', transition: `text-decoration-color ${motion}, color ${motion}` }, hover: { 'text-decoration-color': v('color-ink') }, focus },
    { cls: lk.muted, base: { color: v('color-ink-muted') }, hover: { color: v('color-ink') } },
    { cls: lk.icon, base: { 'margin-inline-start': v('space-4'), 'vertical-align': 'middle' } },
    { cls: lk.sr, base: srOnly },
    iconRule,
  ],
  render(pr: Props): Node {
    const kids: (Node | string)[] = [(pr.label as string) || (pr.href as string)];
    const attrs: Node['attrs'] = { href: (pr.href as string) || '#' };
    if (pr.external) {
      attrs.target = '_blank';
      attrs.rel = 'noopener noreferrer';
      kids.push({ ...iconNode('external-link', 14), cls: [bc.icon, lk.icon] }, n('span', [lk.sr], [' (opens in a new tab)']));
    }
    return n('a', pr.variant === 'muted' ? [lk.root, lk.muted] : [lk.root], kids, attrs);
  },
};

/* ---------- Heading ---------- */
const hd = { root: `${p}-heading`, sm: `${p}-heading--sm`, group: `${p}-heading-group`, desc: `${p}-heading__desc` };
export const heading: ComponentDef = {
  id: 'heading', name: 'Heading', content: 'text', description: 'A section or page title at the right level, with an optional description.', tags: ['content', 'typography'], status: 'stable',
  usage: 'Pick the level from the document outline (one h1 per page, then h2, h3 without skipping); pick the size for looks. The system has two sizes: md (16/20) and sm (14/18), both medium weight.',
  props: [
    P.text('text', 'Account settings', 'Heading text.'),
    P.select('level', ['1', '2', '3', '4', '5', '6'], '2', 'Heading level (h1–h6) for the document outline.'),
    P.select('size', ['md', 'sm'], 'md', 'Visual size: md 16/20 or sm 14/18.'),
    P.text('description', '', 'Optional muted line under the heading.'),
  ],
  rules: [
    { cls: hd.root, base: { margin: '0', color: v('color-ink'), ...text('md'), 'font-weight': v('type-weight-strong') } },
    { cls: hd.sm, base: { 'font-size': v('type-size-sm'), 'line-height': v('type-line-sm') } },
    { cls: hd.group, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4') } },
    { cls: hd.desc, base: { margin: '0', color: v('color-ink-muted'), ...text('sm') } },
  ],
  render(pr: Props): Node {
    const h = n(`h${pr.level}`, pr.size === 'sm' ? [hd.root, hd.sm] : [hd.root], [pr.text as string]);
    return pr.description ? n('div', [hd.group], [h, n('p', [hd.desc], [pr.description as string])]) : h;
  },
};

/* ---------- Text ---------- */
const tx = { root: `${p}-text`, md: `${p}-text--md`, muted: `${p}-text--muted`, strong: `${p}-text--strong`, trunc: `${p}-text--truncate` };
export const textC: ComponentDef = {
  id: 'text', name: 'Text', content: 'text', description: 'Body text in one of the two type sizes, ink or muted.', tags: ['content', 'typography'], status: 'stable',
  usage: 'Use for paragraphs and labels outside other components. Two sizes (sm 14/18, md 16/20), two tones (ink, muted) and two weights (400, 500). Truncate cuts one line with an ellipsis; give the full text in a title or elsewhere.',
  props: [
    P.area('text', 'Changes are saved automatically. You can undo them for 30 days.', 'The text.'),
    P.select('size', ['sm', 'md'], 'sm', 'sm is 14/18, md is 16/20.'),
    P.select('tone', ['default', 'muted'], 'default', 'Ink or muted.'),
    P.select('weight', ['regular', 'strong'], 'regular', '400 or 500.'),
    P.select('as', ['p', 'span', 'div'], 'p', 'Element to render.'),
    P.bool('truncate', false, 'Keep to one line with an ellipsis.'),
  ],
  rules: [
    { cls: tx.root, base: { margin: '0', color: v('color-ink'), ...text('sm') } },
    { cls: tx.md, base: { 'font-size': v('type-size-md'), 'line-height': v('type-line-md') } },
    { cls: tx.muted, base: { color: v('color-ink-muted') } },
    { cls: tx.strong, base: { 'font-weight': v('type-weight-strong') } },
    { cls: tx.trunc, base: { display: 'block', 'max-width': '100%', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' } },
  ],
  render(pr: Props): Node {
    const cls = [tx.root];
    if (pr.size === 'md') cls.push(tx.md);
    if (pr.tone === 'muted') cls.push(tx.muted);
    if (pr.weight === 'strong') cls.push(tx.strong);
    if (pr.truncate) cls.push(tx.trunc);
    return n(pr.as as string, cls, [pr.text as string], pr.truncate ? { title: pr.text as string } : undefined);
  },
};

/* ---------- Color picker ---------- */
/** HSV (h 0–360, s/v 0–100) → hex. The runtime carries the same math. */
export function hsvToHex(h: number, s: number, val: number): string {
  const S = s / 100, V = val / 100;
  const k = (nn: number) => (nn + h / 60) % 6;
  const ch = (nn: number) => Math.round(255 * (V - V * S * Math.max(0, Math.min(k(nn), 4 - k(nn), 1))));
  return '#' + [ch(5), ch(3), ch(1)].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}
export function hexToHsv(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const [r, g, b] = [0, 2, 4].map((o) => parseInt(m[1].slice(o, o + 2), 16) / 255);
  const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [Math.round((h * 60 + 360) % 360), Math.round(mx ? (d / mx) * 100 : 0), Math.round(mx * 100)];
}
const DEFAULT_COLOR = hsvToHex(217, 78, 92);
const cp = { root: `${p}-colorpicker`, field: `${p}-colorpicker__field`, swatch: `${p}-colorpicker__swatch`, hex: `${p}-colorpicker__hex`, panel: `${p}-colorpicker__panel`, area: `${p}-colorpicker__area`, hue: `${p}-colorpicker__hue`, thumb: `${p}-colorpicker__thumb`, row: `${p}-colorpicker__row`, preview: `${p}-colorpicker__preview` };
const areaBg = (h: number) => `background: linear-gradient(to top, black, transparent), linear-gradient(to right, white, hsl(${h} 100% 50%))`;
export const colorPicker: ComponentDef = {
  id: 'color-picker', name: 'Color Picker', description: 'Pick any colour: saturation/brightness area, hue slider and hex field.', tags: ['control', 'form'], status: 'stable',
  usage: 'Click the swatch to open the picker. Drag in the area for saturation and brightness, drag the hue bar for the hue, or type a hex value (RRGGBB). Arrow keys move the focused thumb (Shift for 10 steps). Fires p8-change with { value: "#RRGGBB" }. For a fixed palette use Swatch Picker instead.',
  composition: 'A swatch button and a Text Input; the picker sits in a Popover.',
  props: [
    P.text('value', DEFAULT_COLOR, 'Colour as #RRGGBB.'),
    P.text('label', 'Brand colour', 'Accessible name.'),
    P.bool('open', true, 'Initially open.'),
    P.bool('disabled', false, 'Disables the picker.'),
  ],
  rules: [
    ...popRules,
    { cls: cp.root, base: { position: 'relative', display: 'inline-block', width: v('size-240'), 'max-width': '100%' } },
    { cls: cp.field, base: { display: 'flex', 'align-items': 'stretch', gap: v('space-8') } },
    { cls: cp.swatch, base: { 'flex-shrink': '0', width: v('size-40'), padding: '0', border: 'none', 'border-radius': v('radius-8'), cursor: 'pointer', ...ringDecl }, focus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: cp.hex, base: { 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono'), 'text-transform': 'uppercase' } },
    { cls: cp.panel, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), width: v('size-240') } },
    { cls: cp.area, base: { position: 'relative', height: v('size-160'), 'border-radius': v('radius-8'), cursor: 'crosshair', 'touch-action': 'none', ...ringDecl } },
    { cls: cp.hue, base: { position: 'relative', height: v('size-16'), 'border-radius': v('radius-full'), cursor: 'pointer', 'touch-action': 'none', background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)' } },
    { cls: cp.thumb, base: { position: 'absolute', width: v('size-16'), height: v('size-16'), translate: '-50% -50%', 'box-sizing': 'border-box', 'border-radius': v('radius-full'), background: 'transparent', 'box-shadow': `0 0 0 ${v('border-focus')} white, 0 0 0 calc(${v('border-focus')} * 2) ${v('color-backdrop')}` }, focus: { 'box-shadow': `0 0 0 ${v('border-focus')} white, 0 0 0 calc(${v('border-focus')} * 3) ${v('color-ink')}`, outline: 'none' } },
    { cls: cp.row, base: { display: 'flex', 'align-items': 'center', gap: v('space-8'), color: v('color-ink-muted'), ...text('sm') } },
    { cls: cp.preview, base: { width: v('size-24'), height: v('size-24'), 'flex-shrink': '0', 'border-radius': v('radius-8'), ...ringDecl } },
  ],
  render(pr: Props): Node {
    const hsv = hexToHsv(String(pr.value)) ?? hexToHsv(DEFAULT_COLOR)!;
    const hex = hsvToHex(...hsv);
    const [h, s, b] = hsv;
    const open = Boolean(pr.open) && !pr.disabled;
    const label = (pr.label as string) || 'Colour';
    const off = dis(pr.disabled);
    const panel = n('div', [po.panel, cp.panel], [
      n('div', [cp.area], [n('div', [cp.thumb], [], { role: 'slider', tabindex: '0', 'aria-label': 'Saturation and brightness', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(s), 'aria-valuetext': `Saturation ${s}%, brightness ${b}%`, style: `left: ${s}%; top: ${100 - b}%`, 'data-thumb': 'sv' })], { style: areaBg(h), 'data-area': 'sv' }),
      n('div', [cp.hue], [n('div', [cp.thumb], [], { role: 'slider', tabindex: '0', 'aria-label': 'Hue', 'aria-valuemin': '0', 'aria-valuemax': '360', 'aria-valuenow': String(h), style: `left: ${(h / 360) * 100}%; top: 50%`, 'data-thumb': 'hue' })], { 'data-area': 'hue' }),
      n('div', [cp.row], [n('span', [cp.preview], [], { style: `background: ${hex}`, 'data-preview': true }), n('span', [], [hex], { 'aria-live': 'polite', 'data-readout': true })]),
    ], open ? { 'data-panel': true, role: 'dialog', 'aria-label': `Choose ${label.toLowerCase()}` } : { 'data-panel': true, role: 'dialog', 'aria-label': `Choose ${label.toLowerCase()}`, hidden: true });
    return n('div', [po.root, cp.root], [
      n('div', [cp.field], [
        n('button', [cp.swatch], [], { type: 'button', style: `background: ${hex}`, 'aria-label': `${label}: ${hex}`, 'aria-haspopup': 'dialog', 'aria-expanded': String(open), 'data-trigger': true, ...off }),
        n('input', [inp.root, cp.hex], undefined, { type: 'text', value: hex, 'aria-label': `${label} hex value`, spellcheck: 'false', autocomplete: 'off', maxlength: '7', 'data-hex': true, ...off }),
      ]),
      panel,
    ], { 'data-p8': 'popover color', 'data-h': String(h), 'data-s': String(s), 'data-v': String(b), 'data-label': label });
  },
};

/* ---------- Tag input ---------- */
const ti = { root: `${p}-taginput`, field: `${p}-taginput__field`, list: `${p}-taginput__list`, entry: `${p}-taginput__entry`, foot: `${p}-taginput__foot` };
export const tagInput: ComponentDef = {
  id: 'tag-input', name: 'Tag Input', description: 'Type to add free-form tags; remove them with their button or Backspace.', tags: ['control', 'form'], status: 'stable',
  usage: 'Enter or comma adds the typed tag; pasting "a, b, c" adds three. Backspace in the empty field removes the last tag. Duplicates (any case) are ignored and the count stops at max. A hidden input named after the name prop carries "a,b,c" for forms. Fires p8-change with { tags }. To choose from a known list use Multi-select.',
  composition: 'Tags inside a Text Input surface.',
  props: [
    P.text('label', 'Tags', 'Visible label.'),
    P.area('value', 'design\nresearch', 'Initial tags, one per line.', 'string (one per line)'),
    P.text('placeholder', 'Add a tag…', 'Placeholder for the typing field.'),
    P.select('max', ['5', '10', '20'], '10', 'Most tags allowed.'),
    P.text('name', 'tags', 'Form field name of the hidden input.'),
    P.bool('disabled', false, 'Disables the field.'),
  ],
  rules: [
    { cls: ti.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), width: v('size-500'), 'max-width': '100%', 'font-family': v('type-family') } },
    { cls: ti.field, base: { display: 'flex', 'align-items': 'center', gap: v('space-4'), 'box-sizing': 'border-box', 'padding-block': v('space-4'), 'padding-inline': v('space-4'), 'border-radius': v('radius-8'), background: v('color-control'), cursor: 'text', transition: `background ${motion}` }, hover: { background: v('color-control-strong') }, nested: [{ sel: ':focus-within', decls: { background: v('color-control-strong') } }, { sel: '[aria-disabled="true"]', decls: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } }] },
    { cls: ti.list, base: { display: 'flex', 'align-items': 'center', gap: v('space-4'), 'flex-shrink': '1', 'min-width': '0', 'overflow-x': 'auto', 'scrollbar-width': 'none', 'white-space': 'nowrap' } },
    { cls: ti.entry, base: { flex: '1', 'min-width': v('size-64'), 'box-sizing': 'border-box', 'padding-block': v('space-4'), 'padding-inline': v('space-8'), border: 'none', background: 'transparent', color: v('color-ink'), outline: 'none', ...text('sm') }, placeholder: { color: v('color-placeholder') }, disabled: { cursor: 'not-allowed' } },
    { cls: ti.foot, base: { display: 'flex', 'justify-content': 'space-between', gap: v('space-12'), color: v('color-ink-muted'), ...text('sm') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const max = Number(pr.max) || 10;
    const seen = new Set<string>();
    const tags = lines(pr.value).map((t) => t.replace(/,/g, '').trim()).filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase())).slice(0, max);
    const off = dis(pr.disabled);
    const chip = (label: string): Node => {
      const t = tag.render({ label, removable: true, variant: 'default' });
      const { 'data-p8': _d, ...rest } = t.attrs ?? {};
      return { ...t, attrs: { ...rest, 'data-chip': label }, children: t.children?.map((c) => (typeof c !== 'string' && c.tag === 'button' ? { ...c, attrs: { ...c.attrs, ...off } } : c)) };
    };
    const full = tags.length >= max;
    return n('div', [ti.root], [
      ...(pr.label ? [n('label', [f.label], [pr.label as string], { for: 'tag-entry' })] : []),
      n('div', [ti.field], [
        n('div', [ti.list], tags.map(chip), { role: 'group', 'aria-label': `${(pr.label as string) || 'Tags'} added`, 'data-chips': true }),
        n('input', [ti.entry], undefined, { id: 'tag-entry', type: 'text', placeholder: full ? 'Limit reached' : (pr.placeholder as string), autocomplete: 'off', 'aria-describedby': 'tag-help', 'data-entry': true, ...(pr.label ? {} : { 'aria-label': 'Add a tag' }), ...off }),
      ], pr.disabled ? { 'aria-disabled': 'true' } : undefined),
      n('div', [ti.foot], [n('span', [], ['Enter or comma to add'], { id: 'tag-help' }), n('span', [], [`${tags.length} / ${max}`], { 'aria-live': 'polite', 'data-count': true })]),
      n('input', [], undefined, { type: 'hidden', name: (pr.name as string) || 'tags', value: tags.join(','), 'data-value': true }),
      n('template', [], [chip('__tag__')], { 'data-chip-template': true }),
    ], { 'data-p8': 'taginput', 'data-max': String(max), 'data-placeholder': pr.placeholder as string });
  },
};

/* ---------- Infinite list ---------- */
const il = { root: `${p}-infinite`, scroller: `${p}-infinite__scroller`, list: `${p}-infinite__list`, item: `${p}-infinite__item`, title: `${p}-infinite__title`, meta: `${p}-infinite__meta`, foot: `${p}-infinite__foot`, end: `${p}-infinite__end`, status: `${p}-infinite__status` };
const ilItem = (title: string, meta: string): Node => n('li', [il.item], [n('span', [il.title], [title]), n('span', [il.meta], [meta])], { 'data-item': true });
export const infiniteList: ComponentDef = {
  id: 'infinite-list', name: 'Infinite List', description: 'A scrolling list that loads the next page when you reach the end.', tags: ['data', 'layout'], status: 'stable',
  usage: 'Scrolling near the end, or pressing Load more, fires p8-load-more with { page, append(items, hasMore) }. Call event.preventDefault() and later append([{ title, meta }], hasMore) with your data. Without a handler and with demo on, it adds placeholder rows until total. A status line announces how many rows are shown. The Load more button keeps it usable by keyboard.',
  composition: 'Rows in a Scroll Area; the footer is a Button and a Spinner.',
  props: [
    P.area('items', 'Order 1024 | Paid\nOrder 1023 | Paid\nOrder 1022 | Refunded\nOrder 1021 | Paid\nOrder 1020 | Pending\nOrder 1019 | Paid\nOrder 1018 | Paid\nOrder 1017 | Paid', 'First page, one row per line: "Title | Meta".', 'string (one per line)'),
    P.select('pageSize', ['5', '10', '20'], '10', 'Rows per demo page.'),
    P.select('total', ['20', '40', '100'], '40', 'Rows available in demo mode.'),
    P.bool('demo', true, 'Without a p8-load-more handler, add placeholder rows.'),
  ],
  rules: [
    { cls: il.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-8'), width: v('size-400'), 'max-width': '100%', color: v('color-ink'), ...text('sm') } },
    { cls: il.scroller, base: { height: v('size-320'), 'overflow-y': 'auto', 'border-radius': v('radius-12'), 'overscroll-behavior': 'contain', ...ringDecl }, focus },
    { cls: il.list, base: { display: 'flex', 'flex-direction': 'column', margin: '0', padding: '0', 'list-style': 'none' } },
    { cls: il.item, base: { display: 'flex', 'justify-content': 'space-between', gap: v('space-12'), 'padding-block': v('space-8'), 'padding-inline': v('space-16'), 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}` } },
    { cls: il.title, base: { overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' } },
    { cls: il.meta, base: { color: v('color-ink-muted'), 'white-space': 'nowrap' } },
    { cls: il.foot, base: { 'padding-block': v('space-8'), 'padding-inline': v('space-16') }, nested: [hiddenRule] },
    { cls: il.end, base: { margin: '0', 'padding-block': v('space-12'), 'text-align': 'center', color: v('color-ink-muted') }, nested: [hiddenRule] },
    { cls: il.status, base: { margin: '0', color: v('color-ink-muted') } },
  ],
  render(pr: Props): Node {
    const rows = lines(pr.items).map((l) => { const [t = '', m = ''] = l.split('|').map((x) => x.trim()); return [t, m]; });
    const total = Math.max(rows.length, Number(pr.total) || 40);
    return n('div', [il.root], [
      n('div', [il.scroller], [
        n('ul', [il.list], rows.map(([t, m]) => ilItem(t, m)), { 'data-list': true, 'aria-label': 'Results' }),
        n('div', [il.foot], [btn('Load more', 'ghost', { 'data-more': true }, 'none', true)], { 'data-foot': true }),
        n('p', [il.end], ['You have reached the end'], { 'data-end': true, hidden: true }),
      ], { tabindex: '0', role: 'region', 'aria-label': 'Results list', 'data-scroller': true }),
      n('p', [il.status], [pr.demo ? `Showing ${rows.length} of ${total}` : `Showing ${rows.length}`], { role: 'status', 'data-status': true }),
      n('template', [], [ilItem('__title__', '__meta__')], { 'data-item-template': true }),
    ], { 'data-p8': 'infinite', 'data-page': '1', 'data-size': String(pr.pageSize), 'data-total': String(total), 'data-demo': String(Boolean(pr.demo)) });
  },
};

/* ---------- Split button ---------- */
const sb = { root: `${p}-split`, main: `${p}-split__main`, toggle: `${p}-split__toggle` };
export const splitButton: ComponentDef = {
  id: 'split-button', name: 'Split Button', description: 'A main action with a menu of related actions.', tags: ['control', 'action'], status: 'stable',
  usage: 'The left part runs the main action; the chevron opens a Menu of alternatives (arrows move, Enter chooses, Escape closes). Both fire p8-action with { action: label }. Use only when the alternatives are variations of the main action (Save, Save as draft).',
  composition: 'A Button and a chevron Button joined by a hairline; the menu is a Dropdown Menu.',
  props: [
    P.text('label', 'Save', 'Main action.'),
    P.area('items', 'Save as draft\nSave and publish\n---\nSchedule…', 'Menu items, one per line; "---" is a divider.', 'string (one per line)'),
    P.select('variant', ['default', 'primary'], 'primary', 'Fill of both parts.'),
    P.bool('open', false, 'Initially open.'),
    P.bool('disabled', false, 'Disables both parts.'),
  ],
  rules: [
    ...popRules,
    { cls: sb.root, base: { display: 'inline-flex', 'align-items': 'stretch' } },
    { cls: sb.main, base: { 'border-start-end-radius': '0', 'border-end-end-radius': '0' } },
    { cls: sb.toggle, base: { 'border-start-start-radius': '0', 'border-end-start-radius': '0', 'border-inline-start': `${v('border-hairline')} solid ${v('color-ring')}` } },
    iconRule,
  ],
  render(pr: Props): Node {
    const variant = pr.variant === 'primary' ? 'primary' : 'default';
    const off = dis(pr.disabled);
    const open = Boolean(pr.open) && !pr.disabled;
    const main = btn(pr.label as string, variant, { 'data-main': true, ...off });
    const toggle = n('button', variant === 'primary' ? [bc.root, bc.primary, sb.toggle] : [bc.root, sb.toggle], [iconNode('chevron-down', 14)], { type: 'button', 'aria-label': `More ${String(pr.label).toLowerCase()} options`, 'aria-haspopup': 'menu', 'aria-expanded': String(open), 'data-trigger': true, ...off });
    const panel = n('div', [po.panel, po.bare, po.end], [menu.render({ items: pr.items, active: '' })], open ? { 'data-panel': true } : { 'data-panel': true, hidden: true });
    return n('div', [po.root, sb.root], [{ ...main, cls: [...(main.cls ?? []), sb.main] }, toggle, panel], { role: 'group', 'aria-label': pr.label as string, 'data-p8': 'popover split', 'data-select-closes': true });
  },
};

