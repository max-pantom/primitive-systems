import { v } from '../tokens/theme';
import { button, iconNode, iconRule } from './button';
import { tokenize } from '../lib/highlight';
import { P, focus, motion, n, p, ringDecl, text } from './shared';
import { i as inp } from './forms';
import type { ComponentDef, Node, Props } from './types';

/* ---------- Tree view ---------- */
const tr = { root: `${p}-tree`, group: `${p}-tree__group`, item: `${p}-tree__item`, on: `${p}-tree__item--on`, active: `${p}-tree__item--active`, chev: `${p}-tree__chev`, icon: `${p}-tree__icon`, label: `${p}-tree__label` };
interface TreeLine { label: string; depth: number }
const parseTree = (s: string): TreeLine[] => String(s).split('\n').filter((l) => l.trim()).map((l) => ({ label: l.trim(), depth: Math.floor((l.length - l.trimStart().length) / 2) }));
export const treeView: ComponentDef = {
  id: 'tree-view', name: 'Tree View', description: 'Folders and files you can expand and collapse.', tags: ['navigation', 'data'], status: 'stable',
  usage: 'Indent two spaces per level. Click or press Enter to open a folder; arrows move, Right opens or enters, Left closes or goes to the parent.',
  props: [
    P.area('items', 'src\n  components\n    Button.tsx\n    Card.tsx\n  tokens\n    theme.ts\nREADME.md', 'One entry per line; two spaces of indent per level.', 'string (one per line)'),
    P.text('selected', 'Button.tsx', 'Label of the selected item.'),
    P.select('expand', ['all', 'none'], 'all', 'Whether folders start open.'),
  ],
  rules: [
    { cls: tr.root, base: { margin: '0', padding: '0', 'list-style': 'none', width: v('size-320'), 'max-width': '100%', ...text('sm'), color: v('color-ink') } },
    { cls: tr.group, base: { margin: '0', 'margin-inline-start': v('space-16'), padding: '0', 'list-style': 'none' }, nested: [{ sel: '[hidden]', decls: { display: 'none' } }] },
    { cls: tr.item, base: { display: 'flex', 'align-items': 'center', gap: v('space-8'), width: '100%', 'box-sizing': 'border-box', 'padding-block': v('space-4'), 'padding-inline': v('space-12'), border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink'), 'text-align': 'left', cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus },
    { cls: tr.on, base: {}, nested: [{ sel: ` .${tr.chev}`, decls: { rotate: '90deg' } }] },
    { cls: tr.active, base: { background: v('color-control-strong') } },
    { cls: tr.chev, base: { display: 'inline-flex', width: v('icon-sm'), height: v('icon-sm'), 'flex-shrink': '0', color: v('color-ink-muted'), transition: `rotate ${motion}` } },
    { cls: tr.icon, base: { display: 'inline-flex', color: v('color-ink-muted') } },
    { cls: tr.label, base: { 'min-width': '0', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' } },
    iconRule,
  ],
  render(pr: Props): Node {
    const rows = parseTree(pr.items as string);
    const build = (from: number, depth: number): { nodes: Node[]; next: number } => {
      const nodes: Node[] = [];
      let i = from;
      while (i < rows.length && rows[i].depth >= depth) {
        if (rows[i].depth > depth) { i++; continue; }
        const row = rows[i];
        const hasKids = i + 1 < rows.length && rows[i + 1].depth > depth;
        const kids = hasKids ? build(i + 1, depth + 1) : { nodes: [], next: i + 1 };
        const open = hasKids && pr.expand === 'all';
        const active = row.label === pr.selected;
        const cls = [tr.item, ...(open ? [tr.on] : []), ...(active ? [tr.active] : [])];
        const attrs: Node['attrs'] = { type: 'button', role: 'treeitem', 'aria-level': String(depth + 1), tabindex: active ? '0' : '-1' };
        if (hasKids) attrs['aria-expanded'] = String(open);
        const item = n('button', cls, [
          n('span', [tr.chev], hasKids ? [iconNode('chevron-right', 14)] : []),
          n('span', [tr.icon], [iconNode(hasKids ? 'folder' : 'file', 16)]),
          n('span', [tr.label], [row.label]),
        ], attrs);
        const li: Node[] = [item];
        if (hasKids) li.push(n('ul', [tr.group], kids.nodes, open ? { role: 'group' } : { role: 'group', hidden: true }));
        nodes.push(n('li', [], li, { role: 'none' }));
        i = kids.next;
      }
      return { nodes, next: i };
    };
    return n('ul', [tr.root], build(0, 0).nodes, { role: 'tree', 'aria-label': 'Files', 'data-p8': 'tree' });
  },
};

/* ---------- Scroll area ---------- */
const sa = { root: `${p}-scroll`, row: `${p}-scroll__row` };
const thumb = { background: v('color-ring-focus'), 'border-radius': v('radius-full') };
export const scrollArea: ComponentDef = {
  id: 'scroll-area', name: 'Scroll Area', description: 'A fixed-size region that scrolls, with thin quiet scrollbars.', tags: ['layout', 'container'], status: 'stable',
  usage: 'The region is focusable (tabindex 0) so keyboard users can scroll it with the arrow keys. Rows are placeholders; put your own content inside.',
  props: [
    P.select('height', ['160', '240', '320'], '160', 'Height in px.'),
    P.select('direction', ['vertical', 'horizontal'], 'vertical', 'Scroll axis.'),
    P.select('rows', ['12', '24', '48'], '24', 'Number of placeholder rows.'),
  ],
  rules: [
    { cls: sa.root, base: { 'box-sizing': 'border-box', width: v('size-320'), 'max-width': '100%', 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-surface'), color: v('color-ink'), ...ringDecl, ...text('sm'), 'overflow-y': 'auto', 'overflow-x': 'hidden', 'scrollbar-width': 'thin', 'scrollbar-color': `${v('color-ring-focus')} transparent` }, focus: { 'box-shadow': `0 0 0 ${v('border-focus')} ${v('color-ring-focus')}` },
      nested: [{ sel: '::-webkit-scrollbar', decls: { width: v('space-8'), height: v('space-8') } }, { sel: '::-webkit-scrollbar-thumb', decls: thumb }, { sel: '::-webkit-scrollbar-track', decls: { background: 'transparent' } }, { sel: '::-webkit-scrollbar-corner', decls: { background: 'transparent' } }] },
    { cls: `${sa.root}--h160`, base: { height: v('size-160') } },
    { cls: `${sa.root}--h240`, base: { height: v('size-240') } },
    { cls: `${sa.root}--h320`, base: { height: v('size-320') } },
    { cls: `${sa.root}--x`, base: { 'overflow-x': 'auto', 'overflow-y': 'hidden', display: 'flex', gap: v('space-12') } },
    { cls: sa.row, base: { 'padding-block': v('space-4'), color: v('color-ink-muted'), 'white-space': 'nowrap' } },
  ],
  render(pr: Props): Node {
    const cls = [sa.root, `${sa.root}--h${pr.height}`, ...(pr.direction === 'horizontal' ? [`${sa.root}--x`] : [])];
    return n('div', cls, Array.from({ length: Number(pr.rows) }, (_, i) => n('div', [sa.row], [`Row ${i + 1}`])), { role: 'region', 'aria-label': 'Scrollable content', tabindex: '0' });
  },
};

/* ---------- Timer ---------- */
const tm = { root: `${p}-timer`, time: `${p}-timer__time`, done: `${p}-timer--done`, actions: `${p}-timer__actions` };
export const timer: ComponentDef = {
  id: 'timer', name: 'Timer', description: 'A countdown or stopwatch with start, pause and reset.', tags: ['content', 'time'], status: 'stable',
  usage: 'Countdown stops at 00:00 and fires a p8-timer-done event. Time shows as mm:ss, or h:mm:ss over an hour. role="timer" is not announced every second.',
  composition: 'Controls are ghost Buttons.',
  props: [
    P.select('mode', ['countdown', 'stopwatch'], 'countdown', 'Count down from seconds, or count up from zero.'),
    P.text('seconds', '90', 'Start value for a countdown, in seconds.'),
    P.bool('autostart', false, 'Start running immediately.'),
    P.bool('controls', true, 'Show Start/Pause and Reset.'),
  ],
  rules: [
    { cls: tm.root, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-12'), color: v('color-ink'), ...text('md') } },
    { cls: tm.time, base: { 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono'), 'font-weight': v('type-weight-strong'), 'font-variant-numeric': 'tabular-nums', 'min-width': v('size-64'), 'text-align': 'center' } },
    { cls: tm.done, base: { color: v('color-ink-muted') } },
    { cls: tm.actions, base: { display: 'inline-flex', gap: v('space-8') } },
    { cls: `${tm.root}__btn`, base: { 'min-width': v('size-72') } },
  ],
  render(pr: Props): Node {
    const secs = Math.max(0, Math.floor(Number(pr.seconds) || 0));
    const start = pr.mode === 'stopwatch' ? 0 : secs;
    const fmt = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`);
    const btn = (label: string, act: string): Node => { const b = button.render({ label, variant: 'ghost', size: 'md', icon: 'none', iconSize: '14', iconPosition: 'start', fullWidth: false, disabled: false }); return { ...b, cls: [...(b.cls ?? []), `${tm.root}__btn`], attrs: { ...b.attrs, 'data-timer': act } }; };
    const kids: Node[] = [n('span', [tm.time], [fmt(start)], { 'data-time': true })];
    if (pr.controls) kids.push(n('span', [tm.actions], [btn(pr.autostart ? 'Pause' : 'Start', 'toggle'), btn('Reset', 'reset')]));
    const attrs: Node['attrs'] = { role: 'timer', 'aria-label': pr.mode === 'stopwatch' ? 'Stopwatch' : 'Countdown', 'data-p8': 'timer', 'data-mode': pr.mode as string, 'data-seconds': String(secs) };
    if (pr.autostart) attrs['data-autostart'] = true;
    return n('div', [tm.root], kids, attrs);
  },
};

/* ---------- Inline edit ---------- */
const ie = { root: `${p}-inline`, view: `${p}-inline__view`, empty: `${p}-inline__view--empty`, pen: `${p}-inline__pen` };
export const inlineEdit: ComponentDef = {
  id: 'inline-edit', name: 'Inline Edit', description: 'Text that turns into an input when you click it.', tags: ['control', 'form'], status: 'stable',
  usage: 'Click or press Enter to edit; Enter or blur saves, Escape cancels. A p8-change event carries the new value.',
  props: [P.text('value', 'Click to edit', 'Current text.'), P.text('placeholder', 'Add a title', 'Shown when the value is empty.'), P.text('label', 'Title', 'Accessible name of the input.')],
  rules: [
    { cls: ie.root, base: { display: 'inline-grid', 'max-width': '100%' } },
    { cls: `${ie.root}__input`, base: { 'grid-area': '1 / 1', 'min-width': '0' }, nested: [{ sel: '[hidden]', decls: { display: 'block', visibility: 'hidden', 'pointer-events': 'none' } }] },
    { cls: ie.view, base: { 'grid-area': '1 / 1', display: 'inline-flex', 'align-items': 'center', gap: v('space-8'), 'padding-block': v('space-8'), 'padding-inline': v('space-12'), border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink'), cursor: 'text', ...text('sm') }, hover: { background: v('color-control') }, focus, nested: [{ sel: '[hidden]', decls: { visibility: 'hidden', 'pointer-events': 'none' } }] },
    { cls: ie.empty, base: { color: v('color-ink-muted') } },
    { cls: ie.pen, base: { display: 'inline-flex', color: v('color-ink-muted') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const value = pr.value as string;
    const view = n('button', value ? [ie.view] : [ie.view, ie.empty], [value || (pr.placeholder as string), n('span', [ie.pen], [iconNode('edit', 14)])], { type: 'button', 'data-view': true, 'aria-label': `${pr.label}: ${value || pr.placeholder}. Edit` });
    const input = n('input', [inp.root, `${ie.root}__input`], undefined, { type: 'text', value, placeholder: pr.placeholder as string, 'aria-label': pr.label as string, hidden: true, 'data-edit': true });
    return n('div', [ie.root], [view, input], { 'data-p8': 'inline' });
  },
};

/* ---------- Code block ---------- */
const cd = { root: `${p}-code`, head: `${p}-code__head`, lang: `${p}-code__lang`, pre: `${p}-code__pre`, t: `${p}-code__tok-t`, k: `${p}-code__tok-k`, a: `${p}-code__tok-a`, s: `${p}-code__tok-s`, v: `${p}-code__tok-v`, p: `${p}-code__tok-p`, c: `${p}-code__tok-c` };
export const codeBlock: ComponentDef = {
  id: 'code-block', name: 'Code Block', description: 'Code in the grey highlighter, with a copy button.', tags: ['content', 'code'], status: 'stable',
  usage: 'Highlights tags, attributes, strings, tokens and comments in greys only. The copy button copies exactly the code shown.',
  composition: 'Contains a Copy Button.',
  props: [
    P.area('code', '<p8-button variant="primary">Save</p8-button>', 'The code to show.'),
    P.text('language', 'html', 'Label in the header. Empty to omit.'),
    P.bool('copy', true, 'Show the copy button.'),
  ],
  rules: [
    { cls: cd.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), 'box-sizing': 'border-box', width: v('size-500'), 'max-width': '100%', 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-surface'), color: v('color-syntax-1'), ...ringDecl } },
    { cls: cd.head, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12') } },
    { cls: cd.lang, base: { color: v('color-ink-muted'), ...text('sm'), 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
    { cls: cd.pre, base: { margin: '0', overflow: 'auto', 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono'), 'font-size': v('type-size-sm'), 'line-height': v('type-line-sm'), 'font-weight': v('type-weight'), color: v('color-syntax-1'), 'scrollbar-width': 'thin' }, focus },
    ...(['t', 'k', 'a', 's', 'v', 'p', 'c'] as const).map((k) => ({ cls: cd[k], base: { color: v(`color-syntax-${{ t: 1, k: 1, a: 2, s: 3, v: 3, p: 4, c: 4 }[k]}`) } })),
  ],
  render(pr: Props): Node {
    const code = pr.code as string;
    const toks = tokenize(code).map((t): Node | string => (t.cls ? n('span', [cd[t.cls as 't']], [t.text]) : t.text));
    const head: Node[] = [n('span', [cd.lang], pr.language ? [pr.language as string] : [])];
    if (pr.copy) head.push(copyButtonNode(code));
    return n('div', [cd.root], [n('div', [cd.head], head), n('pre', [cd.pre], [n('code', [], toks)], { tabindex: '0', 'aria-label': 'Code' })], undefined);
  },
};
import { copyButton } from './bits';
function copyButtonNode(code: string): Node {
  const b = copyButton.render({ text: code, label: 'Copy', variant: 'ghost' });
  return b;
}
