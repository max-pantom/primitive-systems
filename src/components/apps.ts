import { v } from '../tokens/theme';
import { button, c as bc, iconNode, iconRule } from './button';
import { f, i as inp, k as ck, s as sel } from './forms';
import { iconButton, tag } from './bits';
import { ov, overlayRules } from './display';
import { po, popRules } from './overlay';
import { DOW, cal, monthGrid, monthLabel, validDate } from './pickers';
import { P, focus, hiddenRule, lines, motion, n, p, ringDecl, text } from './shared';
import type { IconName } from '../icons/icons';
import type { ComponentDef, Node, Props, Rule } from './types';

const btn = (label: string, variant: 'default' | 'primary' | 'ghost', extra: Node['attrs'] = {}, icon: IconName | 'none' = 'none'): Node => {
  const b = button.render({ label, variant, size: 'md', icon, iconSize: '14', iconPosition: 'start', fullWidth: false, disabled: false });
  return { ...b, attrs: { ...b.attrs, ...extra } };
};
const ibtn = (icon: IconName, label: string, extra: Node['attrs'] = {}, size: '14' | '16' = '16', variant = 'ghost-flat'): Node => {
  const b = iconButton.render({ icon, label, size, variant, disabled: false });
  return { ...b, attrs: { ...b.attrs, ...extra } };
};
const dis = (on: unknown): Node['attrs'] => (on ? { disabled: true } : {});
/** Visually hidden but read by screen readers. */
const srOnly: Rule['base'] = { position: 'absolute', width: v('size-16'), height: v('size-16'), overflow: 'hidden', 'clip-path': 'inset(50%)', 'white-space': 'nowrap' };

/* ---------- Password input ---------- */
const pw = { root: `${p}-password`, wrap: `${p}-password__wrap`, input: `${p}-password__input`, field: `${p}-password__field`, toggle: `${p}-password__toggle`, toggleOn: `${p}-password__toggle--on`, rules: `${p}-password__rules`, rule: `${p}-password__rule`, ruleOn: `${p}-password__rule--on`, yes: `${p}-password__yes`, no: `${p}-password__no` };
export const PASSWORD_RULES: Record<string, (arg: number) => string> = {
  length: (nn) => `At least ${nn} characters`, number: () => 'A number', upper: () => 'An uppercase letter', lower: () => 'A lowercase letter', symbol: () => 'A symbol',
};
export const passwordInput: ComponentDef = {
  id: 'password-input', name: 'Password Input', description: 'A password field with show/hide and live requirement checks.', tags: ['control', 'form'], status: 'stable',
  usage: 'The eye button switches between hidden and visible text (aria-pressed). Requirements are checked as you type: length:N, number, upper, lower, symbol, one per line. Use autocomplete="new-password" on sign-up and "current-password" on sign-in so password managers work.',
  composition: 'A Text Input with an Icon Button inside; the requirement list sits below it.',
  props: [
    P.text('label', 'Password', 'Visible label.'),
    P.text('value', '', 'Initial value.'),
    P.select('autocomplete', ['new-password', 'current-password'], 'new-password', 'Tells password managers whether to suggest a new password or fill a saved one.'),
    P.area('requirements', 'length:8\nnumber\nupper\nsymbol', 'One per line: length:N, number, upper, lower or symbol. Empty for none (e.g. on sign-in).', 'string (one per line)'),
    P.bool('disabled', false, 'Disables the field.'),
  ],
  rules: [
    { cls: pw.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-8'), width: v('size-500'), 'max-width': '100%', 'font-family': v('type-family') } },
    { cls: pw.wrap, base: { position: 'relative', display: 'flex', 'flex-direction': 'column', gap: v('space-4') } },
    { cls: pw.input, base: { 'padding-inline-end': `calc(${v('size-40')} + ${v('space-4')})` } },
    { cls: pw.field, base: { position: 'relative', display: 'flex' } },
    { cls: pw.toggle, base: { position: 'absolute', top: '50%', translate: '0 -50%', 'inset-inline-end': v('space-2') } },
    { cls: pw.toggleOn, base: { background: v('color-control-strong') } },
    { cls: pw.rules, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), margin: '0', padding: '0', 'list-style': 'none' } },
    { cls: pw.rule, base: { display: 'flex', 'align-items': 'center', gap: v('space-8'), color: v('color-ink-muted'), ...text('sm'), transition: `color ${motion}` } },
    { cls: pw.ruleOn, base: { color: v('color-ink') }, nested: [{ sel: ` .${pw.yes}`, decls: { display: 'inline-flex' } }, { sel: ` .${pw.no}`, decls: { display: 'none' } }] },
    { cls: pw.yes, base: { display: 'none' } },
    { cls: pw.no, base: { display: 'inline-flex' } },
    iconRule,
  ],
  render(pr: Props): Node {
    const reqs = lines(pr.requirements).map((l) => { const [k, a] = l.split(':').map((x) => x.trim()); return { k, a: Number(a) || 8 }; }).filter((r) => Object.hasOwn(PASSWORD_RULES, r.k));
    const attrs: Node['attrs'] = { id: 'password', type: 'password', autocomplete: pr.autocomplete as string, spellcheck: 'false', 'data-password': true };
    if (!pr.label) attrs['aria-label'] = 'Password';
    if (pr.value) attrs.value = pr.value as string;
    if (reqs.length) attrs['aria-describedby'] = 'password-rules';
    if (pr.disabled) attrs.disabled = true;
    const met = (k: string, a: number) => { const s = String(pr.value); return k === 'length' ? s.length >= a : k === 'number' ? /\d/.test(s) : k === 'upper' ? /[A-Z]/.test(s) : k === 'lower' ? /[a-z]/.test(s) : /[^A-Za-z0-9\s]/.test(s); };
    const eye = ibtn('eye', 'Show password', { 'aria-pressed': 'false', 'data-reveal': true, ...dis(pr.disabled) });
    return n('div', [pw.root], [
      n('div', [pw.wrap], [
        ...(pr.label ? [n('label', [f.label], [pr.label as string], { for: 'password' })] : []),
        n('div', [pw.field], [n('input', [inp.root, pw.input], undefined, attrs), { ...eye, cls: [...(eye.cls ?? []), pw.toggle] }]),
      ]),
      ...(reqs.length ? [n('ul', [pw.rules], reqs.map(({ k, a }) => n('li', met(k, a) ? [pw.rule, pw.ruleOn] : [pw.rule], [
        { ...iconNode('check', 14), cls: [bc.icon, pw.yes] }, { ...iconNode('minus', 14), cls: [bc.icon, pw.no] }, PASSWORD_RULES[k](a),
      ], { 'data-rule': k === 'length' ? `length:${a}` : k })), { id: 'password-rules', 'aria-label': 'Password requirements' })] : []),
    ], { 'data-p8': 'password' });
  },
};

/* ---------- Data table ---------- */
const dt = { root: `${p}-dtable`, bar: `${p}-dtable__bar`, count: `${p}-dtable__count`, actions: `${p}-dtable__actions`, table: `${p}-dtable__table`, th: `${p}-dtable__head`, td: `${p}-dtable__cell`, sel: `${p}-dtable__select`, row: `${p}-dtable__row`, rowOn: `${p}-dtable__row--on`, sort: `${p}-dtable__sort`, arrow: `${p}-dtable__arrow`, minus: `${p}-dtable__minus`, minusOn: `${p}-dtable__minus--on`, cols: `${p}-dtable__cols`, all: `${p}-dtable__all` };
const box = (on: boolean, label: string, extra: Node['attrs'], mixed = false): Node => n('button', on ? [ck.box, ck.on] : [ck.box], [
  { ...iconNode('check', 14), cls: on ? [bc.icon, ck.icon, ck.iconOn] : [bc.icon, ck.icon] },
  ...(mixed ? [{ ...iconNode('minus', 14), cls: [bc.icon, dt.minus] }] : []),
], { type: 'button', role: 'checkbox', 'aria-checked': String(on), 'aria-label': label, ...extra });
export const dataTable: ComponentDef = {
  id: 'data-table', name: 'Data Table', description: 'A table with sorting, row selection, column visibility and bulk actions.', tags: ['data', 'layout'], status: 'stable',
  usage: 'Write rows as "a | b | c"; the first line is the header. Click a header to sort (numbers and dates sort naturally). Select rows with the checkboxes, then run a bulk action: the table fires p8-action with { action, rows } (row indexes in the original order). Columns hides and shows columns.',
  composition: 'Checkboxes, Buttons and a Popover around a Table.',
  props: [
    P.area('rows', 'Name | Role | Joined\nAda Lovelace | Engineer | 2024-03-12\nGrace Hopper | Admiral | 2023-11-02\nAlan Turing | Researcher | 2025-01-20\nKatherine Johnson | Analyst | 2024-07-08', 'Rows one per line, cells split by "|". First line is the header.', 'string (one per line)'),
    P.bool('selectable', true, 'Show row checkboxes and the bulk action bar.'),
    P.area('actions', 'Export\nDelete', 'Bulk actions, one per line. Enabled while rows are selected.', 'string (one per line)'),
    P.bool('columnToggle', true, 'Show the Columns menu.'),
  ],
  rules: [
    ...popRules,
    { cls: dt.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), width: v('size-500'), 'max-width': '100%', color: v('color-ink'), ...text('sm') } },
    { cls: dt.bar, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12') } },
    { cls: dt.count, base: { color: v('color-ink-muted') } },
    { cls: dt.actions, base: { display: 'flex', 'align-items': 'center', gap: v('space-8') } },
    { cls: dt.cols, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-8') } },
    { cls: dt.table, base: { width: '100%', 'table-layout': 'fixed', 'border-collapse': 'collapse' } },
    { cls: dt.th, base: { 'text-align': 'left', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), color: v('color-ink-muted'), 'font-weight': v('type-weight'), 'white-space': 'nowrap', 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}` },
      nested: [hiddenRule, { sel: '[aria-sort="ascending"] .' + dt.arrow, decls: { opacity: '1', rotate: '180deg' } }, { sel: '[aria-sort="descending"] .' + dt.arrow, decls: { opacity: '1' } }] },
    { cls: dt.td, base: { 'padding-block': v('space-8'), 'padding-inline': v('space-12'), overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}` }, nested: [hiddenRule] },
    { cls: dt.sel, base: { width: v('size-16') } },
    { cls: dt.row, base: { transition: `background ${motion}` } },
    { cls: dt.rowOn, base: { background: v('color-control') } },
    { cls: dt.sort, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-4'), 'max-width': '100%', padding: '0', border: 'none', 'border-radius': v('radius-4'), background: 'transparent', color: 'inherit', cursor: 'pointer', ...text('sm') }, hover: { color: v('color-ink') }, focus },
    { cls: dt.arrow, base: { opacity: '0', transition: `opacity ${motion}, rotate ${motion}` }, parent: { cls: dt.sort, hover: { opacity: '1' } } },
    { cls: dt.all, base: { position: 'relative' } },
    { cls: dt.minus, base: { position: 'absolute', inset: '0', margin: 'auto', opacity: '0' } },
    { cls: dt.minusOn, base: { opacity: '1' } },
    iconRule,
  ],
  render(pr: Props): Node {
    const rows = lines(pr.rows).map((l) => l.split('|').map((c) => c.trim()));
    const head = rows.shift() ?? ['Column'];
    const width = head.length;
    const selectable = Boolean(pr.selectable);
    const actions = lines(pr.actions);
    const bar: Node[] = [];
    bar.push(n('span', [dt.count], [selectable ? '0 selected' : `${rows.length} rows`], { 'aria-live': 'polite', 'data-count': true }));
    const right: Node[] = selectable ? actions.map((a) => btn(a, 'default', { 'data-action': a, disabled: true })) : [];
    if (pr.columnToggle) {
      const trig = btn('Columns', 'ghost', { 'data-trigger': true, 'aria-expanded': 'false', 'aria-haspopup': 'true' }, 'list');
      right.push(n('div', [po.root], [trig, n('div', [po.panel, po.end, dt.cols], head.map((h, i) => n('label', [ck.row], [box(true, `Show ${h}`, { 'data-col': String(i) }), h])), { 'data-panel': true, role: 'group', 'aria-label': 'Columns', hidden: true })], { 'data-p8': 'popover' }));
    }
    if (right.length) bar.push(n('div', [dt.actions], right));
    const headRow = n('tr', [], [
      ...(selectable ? [n('th', [dt.th, dt.sel], [{ ...box(false, 'Select all rows', { 'data-all': true }, true), cls: [ck.box, dt.all] }], { scope: 'col' })] : []),
      ...head.map((h, i) => n('th', [dt.th], [n('button', [dt.sort], [h, { ...iconNode('chevron-down', 14), cls: [bc.icon, dt.arrow] }], { type: 'button', 'data-sort': String(i) })], { scope: 'col', 'aria-sort': 'none', 'data-col': String(i) })),
    ]);
    const body = rows.map((r, ri) => n('tr', [dt.row], [
      ...(selectable ? [n('td', [dt.td, dt.sel], [box(false, `Select ${r[0] || `row ${ri + 1}`}`, { 'data-pick': true })])] : []),
      ...Array.from({ length: width }, (_, ci) => n('td', [dt.td], r[ci] ? [r[ci]] : [], { 'data-col': String(ci), ...(r[ci] ? { title: r[ci] } : {}) })),
    ], { 'data-row': String(ri) }));
    return n('div', [dt.root], [
      n('div', [dt.bar], bar),
      n('table', [dt.table], [n('thead', [], [headRow]), n('tbody', [], body)]),
    ], { 'data-p8': 'datatable' });
  },
};

/* ---------- Date range picker ---------- */
const dr = { root: `${p}-daterange`, fields: `${p}-daterange__fields`, input: `${p}-daterange__input`, sep: `${p}-daterange__sep`, hint: `${p}-daterange__hint`, range: `${p}-cal__day--active` };
const days = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000) + 1;
export const rangeHint = (s: string, e: string) => (!s ? 'Pick a start date' : !e ? 'Pick an end date' : `${days(s, e)} day${days(s, e) === 1 ? '' : 's'} selected`);
export const dateRangePicker: ComponentDef = {
  id: 'date-range-picker', name: 'Date Range Picker', description: 'Start and end date fields with a calendar that selects a range.', tags: ['control', 'form'], status: 'stable',
  usage: 'Click a start day, then an end day; the days between are highlighted and the calendar closes. Picking a day before the start moves the start. You can also type both dates as YYYY-MM-DD. Fires p8-change with { start, end }.',
  composition: 'Two Text Inputs and an Icon Button trigger; the calendar is the Date Picker grid in a Popover.',
  props: [
    P.text('start', '2026-11-10', 'Start date, YYYY-MM-DD. Empty for none.'),
    P.text('end', '2026-11-14', 'End date, YYYY-MM-DD. Empty for none.'),
    P.text('month', '2026-11', 'Month the calendar opens on, YYYY-MM (used when there is no start).'),
    P.select('weekStart', ['sun', 'mon'], 'sun', 'First day of the week.'),
    P.bool('open', true, 'Initially open.'),
    P.bool('disabled', false, 'Disables the fields.'),
  ],
  rules: [
    ...popRules,
    { cls: dr.root, base: { position: 'relative', display: 'flex', 'flex-direction': 'column', gap: v('space-4'), width: v('size-500'), 'max-width': '100%' } },
    { cls: dr.fields, base: { display: 'flex', 'align-items': 'center', gap: v('space-8') } },
    { cls: dr.input, base: { flex: '1', 'min-width': '0' } },
    { cls: dr.sep, base: { color: v('color-ink-muted'), ...text('sm') } },
    { cls: dr.hint, base: { margin: '0', color: v('color-ink-muted'), ...text('sm') } },
    { cls: cal.head, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12'), 'margin-bottom': v('space-8') } },
    { cls: cal.label, base: { ...text('sm'), 'font-weight': v('type-weight-strong') } },
    { cls: cal.grid, base: { display: 'grid', 'grid-template-columns': 'repeat(7, 1fr)', gap: v('space-4'), 'text-align': 'center' } },
    { cls: cal.dow, base: { color: v('color-ink-muted'), ...text('sm') } },
    { cls: cal.day, base: { display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', width: v('size-32'), height: v('size-32'), padding: '0', border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus },
    { cls: cal.out, base: { color: v('color-ink-muted') } },
    { cls: dr.range, base: { background: v('color-control-strong'), color: v('color-ink') }, hover: { background: v('color-control-strong') } },
    { cls: cal.on, base: { background: v('color-ink'), color: v('color-ink-inverse') }, hover: { background: v('color-ink') } },
    iconRule,
  ],
  render(pr: Props): Node {
    let s = validDate(String(pr.start)) ? String(pr.start) : '';
    let e = validDate(String(pr.end)) ? String(pr.end) : '';
    if (!s) e = '';
    if (s && e && e < s) [s, e] = [e, s];
    const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(pr.month)) ? String(pr.month) : '2026-11';
    const [y, m] = (s ? s.slice(0, 7) : month).split('-').map(Number);
    const ws = pr.weekStart === 'mon' ? 1 : 0;
    const grid = monthGrid(y, m - 1, ws);
    const off = dis(pr.disabled);
    const arrow = (icon: 'chevron-left' | 'chevron-right', dir: string, label: string) => ibtn(icon, label, { 'data-dir': dir, ...off }, '14');
    const open = Boolean(pr.open) && !pr.disabled;
    const field = (label: string, value: string, key: string): Node => n('input', [inp.root, dr.input], undefined, { type: 'text', inputmode: 'numeric', placeholder: 'YYYY-MM-DD', 'aria-label': label, [key]: true, ...(value ? { value } : {}), ...off });
    const trig = ibtn('calendar', 'Choose dates', { 'data-trigger': true, 'aria-expanded': String(open), 'aria-haspopup': 'dialog', ...off }, '16', 'ghost');
    const panel = n('div', [po.panel, po.end], [
      n('div', [cal.head], [arrow('chevron-left', '-1', 'Previous month'), n('span', [cal.label], [monthLabel(y, m - 1)], { 'aria-live': 'polite', 'data-label': true }), arrow('chevron-right', '1', 'Next month')]),
      n('div', [cal.grid], [
        ...[...DOW.slice(ws), ...DOW.slice(0, ws)].map((d) => n('span', [cal.dow], [d], { 'aria-hidden': 'true' })),
        ...grid.map((g) => {
          const end = g.iso === s || g.iso === e, mid = Boolean(s && e && g.iso > s && g.iso < e);
          return n('button', [cal.day, ...(g.out ? [cal.out] : []), ...(mid ? [dr.range] : []), ...(end ? [cal.on] : [])], [String(g.n)], { type: 'button', ...off, 'data-date': g.iso, 'aria-label': g.iso, 'aria-pressed': String(end || mid) });
        }),
      ], { role: 'group', 'aria-label': 'Calendar', 'data-grid': true }),
    ], { 'data-panel': true, role: 'dialog', 'aria-label': 'Choose dates', ...(open ? {} : { hidden: true }) });
    return n('div', [po.root, dr.root], [
      n('div', [dr.fields], [field('Start date', s, 'data-start'), n('span', [dr.sep], ['–'], { 'aria-hidden': 'true' }), field('End date', e, 'data-end'), trig]),
      n('p', [dr.hint], [rangeHint(s, e)], { 'aria-live': 'polite', 'data-hint': true }),
      panel,
    ], { 'data-p8': 'popover range', 'data-week': String(ws), 'data-month': `${y}-${String(m).padStart(2, '0')}` });
  },
};

/* ---------- Resizable panels ---------- */
const rz = { root: `${p}-resize`, col: `${p}-resize--vertical`, pane: `${p}-resize__pane`, first: `${p}-resize__pane--first`, handle: `${p}-resize__handle`, title: `${p}-resize__title` };
export const resizablePanels: ComponentDef = {
  id: 'resizable-panels', name: 'Resizable Panels', description: 'Two panes with a draggable, keyboard-accessible divider.', tags: ['layout'], status: 'stable',
  usage: 'Drag the divider, or focus it and use the arrow keys (5% steps), Home and End (min / max). Fires p8-resize with { size } (the first pane, in percent). The panes are placeholders; put your own content inside.',
  props: [
    P.select('orientation', ['horizontal', 'vertical'], 'horizontal', 'Side by side (horizontal) or stacked (vertical).'),
    P.select('size', ['30', '40', '50', '60', '70'], '40', 'Starting size of the first pane, in percent.'),
    P.area('panes', 'Navigation\nContent', 'The two pane titles, one per line.', 'string (one per line)'),
  ],
  rules: [
    { cls: rz.root, base: { display: 'flex', width: v('size-500'), 'max-width': '100%', height: v('size-240'), 'box-sizing': 'border-box', overflow: 'hidden', 'border-radius': v('radius-8'), background: v('color-surface'), color: v('color-ink'), ...ringDecl, ...text('sm') } },
    { cls: rz.col, base: { 'flex-direction': 'column' } },
    { cls: rz.pane, base: { flex: '1 1 0', 'min-width': '0', 'min-height': '0', overflow: 'auto', 'box-sizing': 'border-box', 'padding-block': v('space-12'), 'padding-inline': v('space-16'), display: 'flex', 'flex-direction': 'column', gap: v('space-4') } },
    { cls: rz.first, base: { flex: '0 0 auto' } },
    { cls: rz.title, base: { 'font-weight': v('type-weight-strong') } },
    { cls: rz.handle, base: { position: 'relative', flex: `0 0 ${v('space-8')}`, display: 'flex', 'align-items': 'center', 'justify-content': 'center', cursor: 'col-resize', 'touch-action': 'none', background: 'transparent', transition: `background ${motion}` },
      hover: { background: v('color-control') }, focus: { ...focus, outline: 'none' },
      nested: [{ sel: '::before', decls: { content: "''", position: 'absolute', inset: '0', margin: 'auto', width: '0', height: '100%', 'border-left': `${v('border-hairline')} solid ${v('color-ring')}` } }, { sel: '[aria-orientation="horizontal"]', decls: { cursor: 'row-resize' } }, { sel: '[aria-orientation="horizontal"]::before', decls: { width: '100%', height: '0', 'border-left': 'none', 'border-top': `${v('border-hairline')} solid ${v('color-ring')}` } }] },
  ],
  render(pr: Props): Node {
    const vertical = pr.orientation === 'vertical';
    const size = Math.min(80, Math.max(20, Number(pr.size) || 40));
    const [a = 'First', b = 'Second'] = lines(pr.panes);
    const pane = (title: string, first: boolean) => n('div', first ? [rz.pane, rz.first] : [rz.pane], [n('span', [rz.title], [title]), n('span', [], ['Placeholder content'])], first ? { 'data-pane': true, style: `flex-basis: ${size}%` } : undefined);
    return n('div', vertical ? [rz.root, rz.col] : [rz.root], [
      pane(a, true),
      n('div', [rz.handle], [], { role: 'separator', tabindex: '0', 'aria-orientation': vertical ? 'horizontal' : 'vertical', 'aria-label': `Resize ${a} and ${b}`, 'aria-valuenow': String(size), 'aria-valuemin': '20', 'aria-valuemax': '80', 'data-handle': true }),
      pane(b, false),
    ], { 'data-p8': 'resize' });
  },
};

/* ---------- Sortable list ---------- */
const so = { wrap: `${p}-sortable-wrap`, root: `${p}-sortable`, item: `${p}-sortable__item`, itemOn: `${p}-sortable__item--active`, handle: `${p}-sortable__handle`, label: `${p}-sortable__label`, status: `${p}-sortable__status` };
export const sortableList: ComponentDef = {
  id: 'sortable-list', name: 'Sortable List', description: 'Reorder items by dragging the handle or with the keyboard.', tags: ['list', 'control'], status: 'stable',
  usage: 'Drag an item by its handle (mouse, pen or touch). With the keyboard, focus a handle and press ↑ / ↓ to move the item, Home / End to move it to the top or bottom; the new position is announced. Fires p8-change with { order }.',
  composition: 'Each handle is an Icon Button.',
  props: [P.area('items', 'Write brief\nDesign review\nBuild prototype\nUser testing\nShip', 'Items one per line, in their starting order.', 'string (one per line)')],
  rules: [
    { cls: so.wrap, base: { position: 'relative' } },
    { cls: so.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), width: v('size-400'), 'max-width': '100%', margin: '0', padding: '0', 'list-style': 'none', color: v('color-ink'), ...text('sm') } },
    { cls: so.item, base: { display: 'flex', 'align-items': 'center', gap: v('space-4'), 'padding-block': v('space-4'), 'padding-inline-start': v('space-4'), 'padding-inline-end': v('space-12'), 'border-radius': v('radius-8'), background: v('color-control'), 'user-select': 'none', transition: `background ${motion}` } },
    { cls: so.itemOn, base: { background: v('color-control-strong') } },
    { cls: so.handle, base: { cursor: 'grab', 'touch-action': 'none' } },
    { cls: so.label, base: { flex: '1', 'min-width': '0', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' } },
    { cls: so.status, base: srOnly },
    iconRule,
  ],
  render(pr: Props): Node {
    const items = lines(pr.items);
    return n('div', [so.wrap], [
      n('ul', [so.root], items.map((it, i) => {
        const h = ibtn('menu', `Move ${it}, position ${i + 1} of ${items.length}`, { 'data-handle': true, 'aria-roledescription': 'drag handle' }, '14');
        return n('li', [so.item], [{ ...h, cls: [...(h.cls ?? []), so.handle] }, n('span', [so.label], [it])], { 'data-item': it });
      }), { 'aria-label': 'Reorderable list' }),
      n('span', [so.status], [], { role: 'status', 'aria-live': 'assertive', 'data-status': true }),
    ], { 'data-p8': 'sortable' });
  },
};

/* ---------- Filter bar ---------- */
const fb = { root: `${p}-filters`, row: `${p}-filters__row`, pick: `${p}-filters__pick`, chips: `${p}-filters__chips`, list: `${p}-filters__list`, empty: `${p}-filters__empty` };
export const parseFields = (s: unknown): [string, string[]][] => lines(s).map((l) => { const at = l.indexOf(':'); return at < 0 ? [l, []] as [string, string[]] : [l.slice(0, at).trim(), l.slice(at + 1).split(',').map((x) => x.trim()).filter(Boolean)] as [string, string[]]; }).filter(([k, vs]) => k && vs.length);
export const filterBar: ComponentDef = {
  id: 'filter-bar', name: 'Filter Bar', description: 'Build filter conditions; active filters show as removable chips with clear-all.', tags: ['control', 'data'], status: 'stable',
  usage: 'Pick a field and a value, then Add filter. Each active filter is a chip with a remove button; Clear all removes every chip. Fields are "Field: value, value" one per line. Fires p8-change with { filters: [{ field, value }] } so you can filter your own data.',
  composition: 'Two Selects and a Button; active filters are Tags.',
  props: [
    P.area('fields', 'Status: Open, In progress, Closed\nOwner: Ada, Grace, Alan\nPriority: High, Medium, Low', 'One field per line: "Field: value, value, value".', 'string (one per line)'),
    P.area('value', 'Status: Open\nPriority: High', 'Active filters, one per line: "Field: value".', 'string (one per line)'),
    P.bool('disabled', false, 'Disables the bar.'),
  ],
  rules: [
    { cls: fb.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), width: v('size-500'), 'max-width': '100%', color: v('color-ink'), ...text('sm') } },
    { cls: fb.row, base: { display: 'flex', 'align-items': 'center', gap: v('space-8') } },
    { cls: fb.pick, base: { flex: '1', 'min-width': '0' } },
    { cls: fb.chips, base: { display: 'flex', 'align-items': 'center', gap: v('space-12') } },
    { cls: fb.list, base: { flex: '1', 'min-width': '0', display: 'flex', 'align-items': 'center', gap: v('space-8'), 'overflow-x': 'auto', 'scrollbar-width': 'thin', 'white-space': 'nowrap' } },
    { cls: fb.empty, base: { color: v('color-ink-muted') }, nested: [hiddenRule] },
    iconRule,
  ],
  render(pr: Props): Node {
    const fields = parseFields(pr.fields);
    const active = lines(pr.value).filter((l) => { const at = l.indexOf(':'); const fv = fields.find(([k]) => k === l.slice(0, at).trim()); return at > 0 && fv && fv[1].includes(l.slice(at + 1).trim()); }).map((l) => { const at = l.indexOf(':'); return `${l.slice(0, at).trim()}: ${l.slice(at + 1).trim()}`; });
    const uniq = [...new Set(active)];
    const off = dis(pr.disabled);
    const chip = (label: string): Node => {
      const t = tag.render({ label, removable: true, variant: 'default' });
      const { 'data-p8': _d, ...rest } = t.attrs ?? {};
      return { ...t, attrs: { ...rest, 'data-chip': label }, children: t.children?.map((c) => (typeof c !== 'string' && c.tag === 'button' ? { ...c, attrs: { ...c.attrs, ...off } } : c)) };
    };
    const select = (label: string, key: string, options: string[]): Node => n('div', [sel.wrap, fb.pick], [
      n('select', [sel.root], options.map((o, i) => n('option', [], [o], i === 0 ? { value: o, selected: true } : { value: o })), { 'aria-label': label, [key]: true, ...off }),
      { ...iconNode('chevron-down', 16), cls: [bc.icon, sel.icon, ...(pr.disabled ? [sel.iconOff] : [])] },
    ]);
    return n('div', [fb.root], [
      n('div', [fb.row], [select('Filter field', 'data-field', fields.map(([k]) => k)), select('Filter value', 'data-value', fields[0]?.[1] ?? []), btn('Add filter', 'default', { 'data-add': true, ...off }, 'plus')]),
      n('div', [fb.chips], [
        n('div', [fb.list], [...uniq.map(chip), n('span', [fb.empty], ['No filters'], uniq.length ? { 'data-empty': true, hidden: true } : { 'data-empty': true })], { role: 'group', 'aria-label': 'Active filters', 'data-chips': true }),
        btn('Clear all', 'ghost', { 'data-clear': true, ...(uniq.length && !pr.disabled ? {} : { disabled: true }) }),
      ]),
      n('template', [], [chip('__label__')], { 'data-chip-template': true }),
    ], { 'data-p8': 'filters', 'data-fields': JSON.stringify(Object.fromEntries(fields)) });
  },
};

/* ---------- Notification list ---------- */
const nt = { root: `${p}-notify`, head: `${p}-notify__head`, heading: `${p}-notify__heading`, title: `${p}-notify__title`, count: `${p}-notify__count`, list: `${p}-notify__list`, item: `${p}-notify__item`, dot: `${p}-notify__dot`, body: `${p}-notify__body`, name: `${p}-notify__name`, detail: `${p}-notify__detail`, time: `${p}-notify__time`, read: `${p}-notify__read` };
const unreadText = (k: number) => (k ? `${k} unread` : 'All caught up');
export const notificationList: ComponentDef = {
  id: 'notification-list', name: 'Notification List', description: 'Notifications with unread markers, timestamps and mark-as-read.', tags: ['content', 'feedback'], status: 'stable',
  usage: 'One notification per line: "Title | Time | Detail". Start a line with * to mark it unread. The check button marks one read; Mark all read clears them all. Fires p8-read with { index } (or { all: true }).',
  composition: 'Mark-as-read buttons are Icon Buttons; Mark all read is a ghost Button.',
  props: [
    P.text('title', 'Notifications', 'Heading.'),
    P.area('items', '* New comment | 2m | Ada replied to your design review\n* Build passed | 1h | main was deployed to production\nInvite accepted | Yesterday | Grace joined the workspace', 'One per line: Title | Time | Detail. Prefix * for unread.', 'string (one per line)'),
  ],
  rules: [
    { cls: nt.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), 'box-sizing': 'border-box', width: v('size-400'), 'max-width': '100%', 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-12'), background: v('color-canvas'), color: v('color-ink'), ...ringDecl, ...text('sm') }, focus: { outline: 'none' } },
    { cls: nt.head, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12') } },
    { cls: nt.heading, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4') } },
    { cls: nt.title, base: { margin: '0', ...text('md'), 'font-weight': v('type-weight-strong') } },
    { cls: nt.count, base: { color: v('color-ink-muted') } },
    { cls: nt.list, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), margin: '0', padding: '0', 'list-style': 'none' } },
    { cls: nt.item, base: { display: 'flex', 'align-items': 'flex-start', gap: v('space-12'), 'padding-block': v('space-8'), 'border-radius': v('radius-8') },
      nested: [{ sel: `[data-unread="false"] .${nt.dot}`, decls: { visibility: 'hidden' } }, { sel: `[data-unread="false"] .${nt.read}`, decls: { visibility: 'hidden' } }, { sel: `[data-unread="false"] .${nt.name}`, decls: { 'font-weight': v('type-weight') } }] },
    { cls: nt.dot, base: { 'flex-shrink': '0', width: v('space-8'), height: v('space-8'), 'margin-top': v('space-4'), 'border-radius': v('radius-full'), background: v('color-ink') } },
    { cls: nt.body, base: { flex: '1', 'min-width': '0', display: 'flex', 'flex-direction': 'column', gap: v('space-4') } },
    { cls: nt.name, base: { 'font-weight': v('type-weight-strong') } },
    { cls: nt.detail, base: { color: v('color-ink-muted') } },
    { cls: nt.time, base: { color: v('color-ink-muted'), 'white-space': 'nowrap' } },
    { cls: nt.read, base: {} },
    iconRule,
  ],
  render(pr: Props): Node {
    const items = lines(pr.items).map((l) => { const unread = l.startsWith('*'); const [title = '', time = '', detail = ''] = l.replace(/^\*\s*/, '').split('|').map((x) => x.trim()); return { unread, title, time, detail }; });
    const unread = items.filter((x) => x.unread).length;
    const all = btn('Mark all read', 'ghost', { 'data-all': true, ...(unread ? {} : { disabled: true }) });
    return n('section', [nt.root], [
      n('div', [nt.head], [n('div', [nt.heading], [n('h2', [nt.title], [pr.title as string]), n('span', [nt.count], [unreadText(unread)], { 'aria-live': 'polite', 'data-count': true })]), all]),
      n('ul', [nt.list], items.map((x, i) => {
        const b = ibtn('check', `Mark "${x.title}" as read`, { 'data-read': true }, '14');
        return n('li', [nt.item], [
          n('span', [nt.dot], [], { role: 'img', 'aria-label': 'Unread' }),
          n('div', [nt.body], [n('span', [nt.name], [x.title]), ...(x.detail ? [n('span', [nt.detail], [x.detail])] : [])]),
          ...(x.time ? [n('span', [nt.time], [x.time])] : []),
          { ...b, cls: [...(b.cls ?? []), nt.read] },
        ], { 'data-unread': String(x.unread), 'data-index': String(i) });
      })),
    ], { 'aria-label': pr.title as string || 'Notifications', tabindex: '-1', 'data-p8': 'notify' });
  },
};

/* ---------- Image viewer / lightbox ---------- */
const lb = { root: `${p}-gallery`, grid: `${p}-gallery__grid`, c2: `${p}-gallery__grid--2`, c4: `${p}-gallery__grid--4`, thumb: `${p}-gallery__thumb`, img: `${p}-gallery__img`, panel: `${p}-lightbox`, fig: `${p}-lightbox__figure`, full: `${p}-lightbox__img`, cap: `${p}-lightbox__caption`, counter: `${p}-lightbox__counter`, bar: `${p}-lightbox__bar`, nav: `${p}-lightbox__nav` };
const SHADES = ['gainsboro', 'silver', 'darkgray', 'lightgray', 'gray', 'whitesmoke'];
/** A neutral placeholder picture (SVG data URI) used when an image line has no src. */
export const placeholderImage = (i: number) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'><rect width='800' height='600' fill='${SHADES[i % SHADES.length]}'/><circle cx='${560 - (i % 3) * 120}' cy='180' r='70' fill='white' fill-opacity='0.7'/><path d='M0 600L${220 + (i % 4) * 40} ${300 + (i % 2) * 40}L420 460L560 340L800 520V600Z' fill='dimgray' fill-opacity='0.55'/></svg>`)}`;
export const imageViewer: ComponentDef = {
  id: 'image-viewer', name: 'Image Viewer', description: 'A thumbnail grid that opens images in a lightbox with captions and previous/next.', tags: ['content', 'overlay', 'lightbox'], status: 'stable',
  usage: 'This is the lightbox: one line gives a single-image lightbox, several give a gallery. One image per line: "Caption | image URL" (a line with only a caption gets a placeholder). Click a thumbnail to open it; ← / → or the arrow buttons move between images, Esc or the backdrop closes and focus returns to the thumbnail.',
  composition: 'The lightbox is a Dialog-style overlay; navigation uses Icon Buttons.',
  props: [
    P.area('images', 'Dunes at dawn\nHarbour lights\nForest path\nCity at night\nMountain lake\nStill life', 'One per line: Caption | image URL. The URL is optional.', 'string (one per line)'),
    P.select('columns', ['2', '3', '4'], '3', 'Thumbnails per row.'),
    P.bool('open', false, 'Start with the first image open.'),
  ],
  rules: [
    ...overlayRules,
    { cls: lb.root, base: { width: v('size-400'), 'max-width': '100%' } },
    { cls: lb.grid, base: { display: 'grid', 'grid-template-columns': 'repeat(3, 1fr)', gap: v('space-8'), margin: '0', padding: '0', 'list-style': 'none' } },
    { cls: lb.c2, base: { 'grid-template-columns': 'repeat(2, 1fr)' } },
    { cls: lb.c4, base: { 'grid-template-columns': 'repeat(4, 1fr)' } },
    { cls: lb.thumb, base: { display: 'block', width: '100%', padding: '0', border: 'none', overflow: 'hidden', 'border-radius': v('radius-8'), background: v('color-control'), cursor: 'zoom-in' }, focus, nested: [{ sel: ':hover img', decls: { opacity: v('opacity-hover') } }] },
    { cls: lb.img, base: { display: 'block', width: '100%', 'aspect-ratio': '4 / 3', 'object-fit': 'cover', transition: `opacity ${motion}` } },
    { cls: lb.panel, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), 'box-sizing': 'border-box', width: v('size-500'), 'max-width': '100%', 'max-height': '100%', overflow: 'hidden', padding: v('space-16'), 'border-radius': v('radius-12'), background: v('color-canvas'), color: v('color-ink'), ...ringDecl, ...text('sm') } },
    { cls: lb.fig, base: { flex: '1 1 auto', display: 'flex', 'flex-direction': 'column', gap: v('space-12'), margin: '0', 'min-height': '0' } },
    { cls: lb.full, base: { flex: '1 1 auto', 'min-height': '0', display: 'block', width: '100%', 'max-height': '60vh', 'object-fit': 'contain', 'border-radius': v('radius-8'), background: v('color-control') } },
    { cls: lb.cap, base: { display: 'flex', 'justify-content': 'space-between', gap: v('space-12') } },
    { cls: lb.counter, base: { color: v('color-ink-muted'), 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
    { cls: lb.bar, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12') } },
    { cls: lb.nav, base: { display: 'flex', gap: v('space-8') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const imgs = lines(pr.images).map((l, i) => { const [cap = '', src = ''] = l.split('|').map((x) => x.trim()); return { cap: cap || `Image ${i + 1}`, src: src || placeholderImage(i) }; });
    if (!imgs.length) imgs.push({ cap: 'Image 1', src: placeholderImage(0) });
    const cols = pr.columns === '2' ? [lb.grid, lb.c2] : pr.columns === '4' ? [lb.grid, lb.c4] : [lb.grid];
    const first = imgs[0];
    const many = imgs.length > 1;
    return n('div', [lb.root], [
      n('ul', cols, imgs.map((im, i) => n('li', [], [n('button', [lb.thumb], [n('img', [lb.img], undefined, { src: im.src, alt: '', loading: 'lazy' })], { type: 'button', 'aria-label': `Open ${im.cap}`, 'data-open': String(i), 'data-caption': im.cap })])), { 'aria-label': 'Images' }),
      n('div', [ov.root], [
        n('div', [lb.panel], [
          n('div', [lb.bar], [
            n('span', [lb.counter], [`1 / ${imgs.length}`], { 'data-counter': true, 'aria-live': 'polite' }),
            n('div', [lb.nav], [ibtn('chevron-left', 'Previous image', { 'data-dir': '-1', ...dis(!many) }), ibtn('chevron-right', 'Next image', { 'data-dir': '1', ...dis(!many) }), ibtn('close', 'Close', { 'data-close': true })]),
          ]),
          n('figure', [lb.fig], [n('img', [lb.full], undefined, { src: first.src, alt: first.cap, 'data-full': true }), n('figcaption', [lb.cap], [n('span', [], [first.cap], { 'data-caption': true })])]),
        ], { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Image viewer' }),
      ], pr.open ? { 'data-p8': 'overlay', 'data-lightbox': true } : { 'data-p8': 'overlay', 'data-lightbox': true, hidden: true }),
    ], { 'data-p8': 'lightbox' });
  },
};
