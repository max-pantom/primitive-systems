import { v } from '../tokens/theme';
import { c as bc, iconNode, iconRule } from './button';
import { divider } from './forms';
import { P, lines, n, p, ringDecl, text } from './shared';
import { ICON_NAMES, type IconName } from '../icons/icons';
import { iconButton } from './bits';
import type { ComponentDef, Node, Props, Rule } from './types';

/* ---------- List row ---------- */
const lr = { root: `${p}-row`, link: `${p}-row--interactive`, lead: `${p}-row__lead`, text: `${p}-row__text`, title: `${p}-row__title`, meta: `${p}-row__meta`, end: `${p}-row__end` };
export const listRow: ComponentDef = {
  id: 'list-row', name: 'List Row', description: 'Icon, title, meta and a trailing affordance in one row.', tags: ['layout', 'list'], status: 'stable',
  usage: 'Set interactive to render a button with hover and focus states. The trailing chevron signals navigation.',
  props: [
    P.text('title', 'Title', 'Primary text.'),
    P.text('meta', 'Meta', 'Secondary text. Empty to omit.'),
    P.select('icon', ['none', ...ICON_NAMES], 'folder', 'Leading icon from the Primitive8 pack.'),
    P.select('trailing', ['none', 'chevron', 'text'], 'chevron', 'Trailing element.'),
    P.text('trailingText', 'Edit', 'Text used when trailing is "text".'),
    P.bool('interactive', true, 'Render as a button with hover/focus.'),
  ],
  rules: [
    { cls: lr.root, base: { display: 'flex', 'align-items': 'center', gap: v('space-12'), 'box-sizing': 'border-box', width: v('size-400'), 'max-width': '100%', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), border: 'none', background: 'transparent', color: v('color-ink'), 'text-align': 'left', ...text('sm') } },
    { cls: lr.link, base: { cursor: 'pointer' }, hover: { background: v('color-control') }, focus: { 'box-shadow': `0 0 0 ${v('border-focus')} ${v('color-ring-focus')}` } },
    { cls: lr.lead, base: { color: v('color-ink-muted'), display: 'inline-flex' } },
    { cls: lr.text, base: { flex: '1', display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'min-width': '0' } },
    { cls: lr.title, base: { 'font-weight': v('type-weight-strong') } },
    { cls: lr.meta, base: { color: v('color-ink-muted') } },
    { cls: lr.end, base: { display: 'inline-flex', color: v('color-ink-muted') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const kids: Node[] = [];
    if (pr.icon !== 'none') kids.push(n('span', [lr.lead], [iconNode(pr.icon as IconName, 16)]));
    kids.push(n('span', [lr.text], [n('span', [lr.title], [pr.title as string]), ...(pr.meta ? [n('span', [lr.meta], [pr.meta as string])] : [])]));
    if (pr.trailing === 'chevron') kids.push(n('span', [lr.end], [iconNode('chevron-right', 16)]));
    if (pr.trailing === 'text') kids.push(n('span', [lr.end], [pr.trailingText as string]));
    return pr.interactive ? n('button', [lr.root, lr.link], kids, { type: 'button' }) : n('div', [lr.root], kids);
  },
};
void bc;

/* ---------- Table ---------- */
const tb = { root: `${p}-table`, th: `${p}-table__head`, td: `${p}-table__cell` };
export const table: ComponentDef = {
  id: 'table', name: 'Table', description: 'Rows and columns of data.', tags: ['data', 'layout'], status: 'stable',
  usage: 'Write rows as "a | b | c", one per line. The first line is the header when header is on.',
  props: [
    P.area('rows', 'Column A | Column B | Column C\nValue | Value | Value\nValue | Value | Value', 'Rows one per line, cells split by "|".', 'string (one per line)'),
    P.bool('header', true, 'Treat the first row as a header.'),
  ],
  rules: [
    { cls: tb.root, base: { 'border-collapse': 'collapse', width: v('size-500'), 'max-width': '100%', ...text('sm'), color: v('color-ink') } },
    { cls: tb.th, base: { 'text-align': 'left', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), color: v('color-ink-muted'), 'font-weight': v('type-weight'), 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}` } },
    { cls: tb.td, base: { 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}` } },
  ],
  render(pr: Props): Node {
    const rows = lines(pr.rows).map((l) => l.split('|').map((c) => c.trim()));
    const head = pr.header && rows.length ? rows.shift()! : null;
    const kids: Node[] = [];
    if (head) kids.push(n('thead', [], [n('tr', [], head.map((c) => n('th', [tb.th], [c], { scope: 'col' })))]));
    kids.push(n('tbody', [], rows.map((r) => n('tr', [], r.map((c) => n('td', [tb.td], c ? [c] : []))))));
    return n('table', [tb.root], kids);
  },
};

/* ---------- Key-value row ---------- */
const kv = { root: `${p}-kv`, stack: `${p}-kv--stacked`, k: `${p}-kv__key`, v: `${p}-kv__value` };
export const keyValue: ComponentDef = {
  id: 'key-value', name: 'Key-Value Row', description: 'A label and its value on one row, or stacked.', tags: ['data', 'layout'], status: 'stable',
  usage: 'Use inside cards and panels for single facts. For several pairs use Data List.',
  props: [P.text('label', 'Label', 'Key text.'), P.text('value', 'Value', 'Value text.'), P.select('layout', ['split', 'stacked'], 'split', 'Side by side or stacked (4px gap).')],
  rules: [
    { cls: kv.root, base: { display: 'flex', 'justify-content': 'space-between', gap: v('space-12'), width: v('size-320'), 'max-width': '100%', ...text('sm'), color: v('color-ink') } },
    { cls: kv.stack, base: { 'flex-direction': 'column', 'justify-content': 'flex-start', gap: v('space-4') } },
    { cls: kv.k, base: { color: v('color-ink-muted') } },
    { cls: kv.v, base: {} },
  ],
  render(pr: Props): Node {
    return n('div', pr.layout === 'stacked' ? [kv.root, kv.stack] : [kv.root], [n('span', [kv.k], [pr.label as string]), n('span', [kv.v], [pr.value as string])]);
  },
};

/* ---------- Stack ---------- */
const st = { root: `${p}-stack`, item: `${p}-stack__item`, row: `${p}-stack--row` };
const GAPS = ['4', '8', '12', '16', '24'];
const ALIGN = ['start', 'center', 'end', 'stretch'];
const alignVal = (a: string) => (a === 'start' ? 'flex-start' : a === 'end' ? 'flex-end' : a);
export const stack: ComponentDef = {
  id: 'stack', name: 'Stack', description: 'Lays children out in a row or column with a token gap.', tags: ['layout'], status: 'stable',
  usage: 'The Item blocks are placeholders; put your own content inside the stack. Gap defaults to 12px.',
  props: [
    P.select('direction', ['column', 'row'], 'column', 'Main axis.'),
    P.select('gap', GAPS, '12', 'Gap in px.'),
    P.select('align', ALIGN, 'stretch', 'Cross-axis alignment.'),
    P.select('count', ['1', '2', '3', '4', '5', '6'], '3', 'Placeholder items shown.'),
  ],
  rules: [
    { cls: st.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), width: v('size-240'), 'max-width': '100%' } },
    { cls: st.row, base: { 'flex-direction': 'row', width: 'auto' } },
    ...GAPS.map((g): Rule => ({ cls: `${st.root}--gap${g}`, base: { gap: v(`space-${g}`) } })),
    ...ALIGN.map((a): Rule => ({ cls: `${st.root}--align-${a}`, base: { 'align-items': alignVal(a) } })),
    { cls: st.item, base: { 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), background: v('color-control'), color: v('color-ink-muted'), ...text('sm') } },
  ],
  render(pr: Props): Node {
    const cls = [st.root, `${st.root}--gap${pr.gap}`, `${st.root}--align-${pr.align}`];
    if (pr.direction === 'row') cls.push(st.row);
    return n('div', cls, Array.from({ length: Number(pr.count) }, (_, idx) => n('div', [st.item], [`Item ${idx + 1}`])));
  },
};

/* ---------- Toolbar ---------- */
const tl = { root: `${p}-toolbar` };
export const toolbar: ComponentDef = {
  id: 'toolbar', name: 'Toolbar', description: 'A row of icon buttons, with optional separators.', tags: ['layout', 'actions'], status: 'stable',
  usage: 'List Primitive8 icon names one per line; "---" adds a vertical divider. Each button gets an aria-label from its icon name.',
  composition: 'Contains Icon Buttons and vertical Dividers.',
  props: [P.area('items', 'edit\ncopy\n---\ntrash', 'Icon names one per line; "---" is a separator.', 'string (one per line)')],
  rules: [{ cls: tl.root, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-4'), 'box-sizing': 'border-box', padding: v('space-4'), 'border-radius': v('radius-12'), background: v('color-surface'), color: v('color-ink'), ...ringDecl } }],
  render(pr: Props): Node {
    const kids = lines(pr.items).map((l): Node =>
      l === '---' ? divider.render({ orientation: 'vertical', label: '', spacing: 'none' })
        : iconButton.render({ icon: (ICON_NAMES as string[]).includes(l) ? l : 'plus', label: l, size: '16', variant: 'ghost-flat', disabled: false }));
    return n('div', [tl.root], kids, { role: 'toolbar' });
  },
};
