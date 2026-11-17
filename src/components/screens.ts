import { v } from '../tokens/theme';
import { button, c as bc, iconNode, iconRule } from './button';
import { f, i as inp, s as sel, k as ck, checkbox } from './forms';
import { fl } from './forms2';
import { avatar } from './display';
import { iconButton, copyButton } from './bits';
import { DOW, monthLabel, monthGrid, validDate } from './pickers';
import { srOnly } from './kit';
import { P, focus, hiddenRule, lines, motion, n, p, ringDecl, text } from './shared';
import { ICON_NAMES, type IconName } from '../icons/icons';
import type { ComponentDef, Node, Props, Rule } from './types';

const btn = (label: string, variant: 'default' | 'primary' | 'ghost', extra: Node['attrs'] = {}, icon: IconName | 'none' = 'none'): Node => {
  const b = button.render({ label, variant, size: 'md', icon, iconSize: '14', iconPosition: 'start', fullWidth: false, disabled: false });
  return { ...b, attrs: { ...b.attrs, ...extra } };
};
const ibtn = (icon: IconName, label: string, extra: Node['attrs'] = {}, variant = 'ghost-flat', size: '14' | '16' = '16'): Node => {
  const b = iconButton.render({ icon, label, size, variant, disabled: false });
  return { ...b, attrs: { ...b.attrs, ...extra } };
};
const dis = (on: unknown): Node['attrs'] => (on ? { disabled: true } : {});
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'field';

/* ---------- Empty state ---------- */
const es = { root: `${p}-empty`, bordered: `${p}-empty--bordered`, icon: `${p}-empty__icon`, title: `${p}-empty__title`, desc: `${p}-empty__desc`, actions: `${p}-empty__actions` };
export const emptyState: ComponentDef = {
  id: 'empty-state', name: 'Empty State', description: 'What to show when there is nothing here yet, with the next step.', tags: ['feedback', 'content'], status: 'stable',
  usage: 'Say what will appear here and how to make it appear, in two short lines. One primary action; an optional secondary one. Buttons fire p8-action with { action: label }. For "no search results" use the search icon and offer to clear filters.',
  composition: 'An icon, a Heading, Text and one or two Buttons.',
  props: [
    P.select('icon', ICON_NAMES as string[], 'folder', 'Icon from the Primitive8 pack.'),
    P.text('title', 'No projects yet', 'What is missing.'),
    P.area('description', 'Projects keep tasks, files and people together. Create one to get started.', 'One or two sentences: why it is empty and what to do.'),
    P.text('action', 'New project', 'Primary action. Empty to omit.'),
    P.text('secondary', 'Import projects', 'Secondary action. Empty to omit.'),
    P.select('variant', ['plain', 'bordered'], 'plain', 'Plain, or inside a hairline panel.'),
  ],
  rules: [
    { cls: es.root, base: { display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: v('space-12'), 'box-sizing': 'border-box', width: v('size-400'), 'max-width': '100%', 'padding-block': v('space-32'), 'padding-inline': v('space-16'), 'text-align': 'center', color: v('color-ink'), ...text('sm') } },
    { cls: es.bordered, base: { padding: v('space-16'), 'border-radius': v('radius-12'), ...ringDecl } },
    { cls: es.icon, base: { display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', width: v('size-48'), height: v('size-48'), 'border-radius': v('radius-full'), background: v('color-control'), color: v('color-ink') } },
    { cls: es.title, base: { margin: '0', ...text('md'), 'font-weight': v('type-weight-strong') } },
    { cls: es.desc, base: { margin: '0', 'max-width': v('size-320'), color: v('color-ink-muted') } },
    { cls: es.actions, base: { display: 'flex', 'flex-wrap': 'wrap', 'justify-content': 'center', gap: v('space-8'), 'margin-top': v('space-4') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const acts = [pr.action ? btn(pr.action as string, 'primary', { 'data-action': pr.action as string }, 'plus') : null, pr.secondary ? btn(pr.secondary as string, 'ghost', { 'data-action': pr.secondary as string }) : null].filter(Boolean) as Node[];
    return n('section', pr.variant === 'bordered' ? [es.root, es.bordered] : [es.root], [
      n('span', [es.icon], [iconNode(pr.icon as IconName, 16)]),
      n('h3', [es.title], [pr.title as string]),
      ...(pr.description ? [n('p', [es.desc], [pr.description as string])] : []),
      ...(acts.length ? [n('div', [es.actions], acts)] : []),
    ], { 'aria-label': (pr.title as string) || 'Empty', 'data-p8': 'action' });
  },
};

/* ---------- Form ---------- */
const fm = { root: `${p}-form`, title: `${p}-form__title`, field: `${p}-form__field`, opt: `${p}-form__optional`, control: `${p}-form__control`, err: `${p}-form__error`, actions: `${p}-form__actions`, status: `${p}-form__status` };
export interface FormField { label: string; name: string; type: string; options: string[]; required: boolean; min: number }
export function parseFormFields(s: unknown): FormField[] {
  const seen = new Set<string>();
  return lines(s).map((l) => {
    const [label = '', kind = 'text', flags = ''] = l.split('|').map((x) => x.trim());
    const [type, opts] = kind.includes(':') ? [kind.slice(0, kind.indexOf(':')).trim(), kind.slice(kind.indexOf(':') + 1)] : [kind, ''];
    let name = slug(label);
    while (seen.has(name)) name += '-2';
    seen.add(name);
    const t = ['text', 'email', 'password', 'number', 'url', 'tel', 'textarea', 'select', 'checkbox'].includes(type) ? type : 'text';
    return { label, name, type: t, options: opts.split(',').map((x) => x.trim()).filter(Boolean), required: /\brequired\b/.test(flags), min: Number(/\bmin:(\d+)/.exec(flags)?.[1] ?? 0) };
  }).filter((x) => x.label);
}
export const form: ComponentDef = {
  id: 'form', name: 'Form', description: 'Fields with validation, error messages and submit wiring.', tags: ['form', 'composition'], status: 'stable',
  usage: 'One field per line: "Label | type | flags". Types: text, email, password, number, url, tel, textarea, checkbox, or "select: A, B, C". Flags: required, min:N (characters). Errors show under each field on submit and then update as you type; focus moves to the first invalid field and a status line says how many need attention. A valid submit fires a cancelable p8-submit with { values, done(result) }: call event.preventDefault(), save, then done({ ok: true, message }) or done({ errors: { name: "message" } }). Without a handler it shows the success message.',
  composition: 'Text Inputs, Select, Textarea and Checkbox in Fields, with a primary Button.',
  props: [
    P.text('title', '', 'Optional heading above the fields.'),
    P.area('fields', 'Full name | text | required\nWork email | email | required\nPassword | password | required min:8\nRole | select: Designer, Engineer, Manager\nAbout you | textarea\nI agree to the terms | checkbox | required', 'One per line: "Label | type | flags".', 'string (one per line)'),
    P.text('submit', 'Create account', 'Submit button label.'),
    P.text('cancel', '', 'Optional secondary button (fires p8-action { action: "cancel" }).'),
    P.text('success', 'Account created.', 'Status message after a successful submit.'),
    P.bool('disabled', false, 'Disables every field.'),
  ],
  rules: [
    { cls: fm.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), width: v('size-500'), 'max-width': '100%', margin: '0', color: v('color-ink'), 'font-family': v('type-family') } },
    { cls: fm.title, base: { margin: '0', ...text('md'), 'font-weight': v('type-weight-strong') } },
    { cls: fm.field, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'min-width': '0' } },
    { cls: fm.opt, base: { color: v('color-ink-muted'), 'font-weight': v('type-weight') } },
    { cls: fm.control, base: {}, nested: [{ sel: '[aria-invalid="true"]', decls: { outline: `${v('border-hairline')} solid ${v('color-ink')}`, 'outline-offset': `calc(-1 * ${v('border-hairline')})` } }] },
    { cls: fm.err, base: { margin: '0', 'min-height': v('type-line-sm'), color: v('color-ink'), ...text('sm'), 'font-weight': v('type-weight-strong') } },
    { cls: fm.actions, base: { display: 'flex', 'align-items': 'center', gap: v('space-8') } },
    { cls: fm.status, base: { margin: '0', 'min-height': v('type-line-sm'), color: v('color-ink-muted'), ...text('sm') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const fields = parseFormFields(pr.fields);
    const off = dis(pr.disabled);
    const fieldNode = (x: FormField): Node => {
      const id = `form-${x.name}`;
      const err = n('p', [fm.err], [], { id: `${id}-error`, 'data-error': true });
      const a: Node['attrs'] = { id, name: x.name, 'aria-describedby': `${id}-error`, 'data-field': x.label, ...(x.required ? { required: true, 'aria-required': 'true' } : {}), ...(x.min ? { 'data-min': String(x.min) } : {}), ...off };
      const label = n('label', [f.label], [x.label, ...(x.required ? [] : [n('span', [fm.opt], [' (optional)'])])], { for: id });
      if (x.type === 'checkbox') {
        const cb = checkbox.render({ label: x.label, checked: false, disabled: Boolean(pr.disabled) });
        const box = (cb.children?.[0] as Node);
        return n('div', [fm.field], [{ ...cb, children: [{ ...box, cls: [...(box.cls ?? []), fm.control], attrs: { ...box.attrs, ...a, id } }, x.label] }, err]);
      }
      if (x.type === 'select') {
        const opts = x.options.length ? x.options : ['Choose…'];
        return n('div', [fm.field], [label, n('div', [sel.wrap], [n('select', [sel.root, fm.control], opts.map((o, i) => n('option', [], [o], i === 0 ? { value: o, selected: true } : { value: o })), a), { ...iconNode('chevron-down', 16), cls: [bc.icon, sel.icon, ...(pr.disabled ? [sel.iconOff] : [])] }]), err]);
      }
      if (x.type === 'textarea') return n('div', [fm.field], [label, n('textarea', [inp.root, fm.control], [], { ...a, rows: '3' }), err]);
      const auto: Record<string, string> = { email: 'email', password: 'new-password', tel: 'tel', url: 'url' };
      return n('div', [fm.field], [label, n('input', [inp.root, fm.control], undefined, { ...a, type: x.type, ...(auto[x.type] ? { autocomplete: auto[x.type] } : x.name.includes('name') ? { autocomplete: 'name' } : {}) }), err]);
    };
    return n('form', [fm.root], [
      ...(pr.title ? [n('h2', [fm.title], [pr.title as string])] : []),
      ...fields.map(fieldNode),
      n('div', [fm.actions], [btn((pr.submit as string) || 'Submit', 'primary', { type: 'submit', 'data-submit': true, ...off }), ...(pr.cancel ? [btn(pr.cancel as string, 'ghost', { 'data-action': 'cancel', ...off })] : [])]),
      n('p', [fm.status], [], { role: 'status', 'data-status': true }),
    ], { novalidate: true, 'aria-label': (pr.title as string) || 'Form', 'data-p8': 'form action', 'data-success': (pr.success as string) || 'Saved.' });
  },
};

/* ---------- Calendar (month view) ---------- */
const mc = { root: `${p}-mcal`, head: `${p}-mcal__head`, title: `${p}-mcal__title`, nav: `${p}-mcal__nav`, grid: `${p}-mcal__grid`, dow: `${p}-mcal__dow`, cell: `${p}-mcal__cell`, out: `${p}-mcal__cell--out`, on: `${p}-mcal__cell--on`, num: `${p}-mcal__num`, ev: `${p}-mcal__event`, more: `${p}-mcal__more`, agenda: `${p}-mcal__agenda`, agendaHead: `${p}-mcal__agenda-head`, agendaList: `${p}-mcal__agenda-list` };
export const parseEvents = (s: unknown): Record<string, string[]> => {
  const out: Record<string, string[]> = {};
  for (const l of lines(s)) { const [d = '', t = ''] = l.split('|').map((x) => x.trim()); if (validDate(d) && t) (out[d] ??= []).push(t); }
  return out;
};
const longDate = (iso: string) => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
const evCount = (k: number) => (k ? `${k} event${k === 1 ? '' : 's'}` : 'No events');
export const calendar: ComponentDef = {
  id: 'calendar', name: 'Calendar', description: 'A month view with events per day and an agenda for the selected day.', tags: ['data', 'layout'], status: 'stable',
  usage: 'Events are "YYYY-MM-DD | Title", one per line; each day shows up to two and "+N more". Click a day (or move with the arrows and press Enter) to select it: the agenda below lists all its events and p8-select fires with { date, events }. Arrows move by day and week, Home/End to the week edges, PageUp/PageDown change the month, Today jumps to the current date. For picking a date in a form use Date Picker.',
  composition: 'Icon Buttons and a Button in the header; days are buttons in a 7-column grid.',
  props: [
    P.text('month', '2026-11', 'Month shown, YYYY-MM.'),
    P.text('selected', '2026-11-12', 'Selected day, YYYY-MM-DD. Empty for none.'),
    P.area('events', '2026-11-03 | Design review\n2026-11-03 | 1:1 with Ada\n2026-11-12 | Launch\n2026-11-12 | Retro\n2026-11-12 | Team dinner\n2026-11-20 | Quarterly planning\n2026-11-26 | Office closed', 'One per line: "YYYY-MM-DD | Title".', 'string (one per line)'),
    P.select('weekStart', ['mon', 'sun'], 'mon', 'First day of the week.'),
  ],
  rules: [
    { cls: mc.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), width: v('size-500'), 'max-width': '100%', color: v('color-ink'), ...text('sm') } },
    { cls: mc.head, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12') } },
    { cls: mc.title, base: { margin: '0', ...text('md'), 'font-weight': v('type-weight-strong') } },
    { cls: mc.nav, base: { display: 'flex', 'align-items': 'center', gap: v('space-4') } },
    { cls: mc.grid, base: { display: 'grid', 'grid-template-columns': 'repeat(7, minmax(0, 1fr))', 'border-radius': v('radius-12'), overflow: 'hidden', ...ringDecl } },
    { cls: mc.dow, base: { 'padding-block': v('space-8'), 'padding-inline': v('space-8'), color: v('color-ink-muted'), 'text-align': 'left', 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}` } },
    { cls: mc.cell, base: { position: 'relative', display: 'flex', 'flex-direction': 'column', 'align-items': 'stretch', gap: v('space-4'), 'min-width': '0', height: v('size-72'), padding: v('space-4'), border: 'none', 'border-radius': '0', background: v('color-canvas'), color: v('color-ink'), 'text-align': 'left', cursor: 'pointer', overflow: 'hidden', 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}`, 'border-inline-end': `${v('border-hairline')} solid ${v('color-ring')}`, transition: `background ${motion}`, ...text('sm') }, hover: { background: v('color-control') }, focus: { 'box-shadow': `inset 0 0 0 ${v('border-focus')} ${v('color-ring-focus')}`, outline: 'none' } },
    { cls: mc.out, base: { color: v('color-ink-muted') } },
    { cls: mc.on, base: { background: v('color-control-strong') }, hover: { background: v('color-control-strong') } },
    { cls: mc.num, base: { 'padding-inline': v('space-4') }, nested: [{ sel: '[data-today]', decls: { 'align-self': 'flex-start', 'border-radius': v('radius-full'), background: v('color-ink'), color: v('color-ink-inverse') } }] },
    { cls: mc.ev, base: { 'padding-inline': v('space-4'), 'border-radius': v('radius-4'), background: v('color-control-strong'), color: v('color-ink'), overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' } },
    { cls: mc.more, base: { 'padding-inline': v('space-4'), color: v('color-ink-muted'), 'white-space': 'nowrap' } },
    { cls: mc.agenda, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), height: v('size-72'), 'overflow-y': 'auto' } },
    { cls: mc.agendaHead, base: { margin: '0', 'font-weight': v('type-weight-strong') } },
    { cls: mc.agendaList, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), margin: '0', padding: '0', 'list-style': 'none', color: v('color-ink-muted') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const events = parseEvents(pr.events);
    const selected = validDate(String(pr.selected)) ? String(pr.selected) : '';
    const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(pr.month)) ? String(pr.month) : selected.slice(0, 7) || '2026-11';
    const [y, m] = month.split('-').map(Number);
    const ws = pr.weekStart === 'sun' ? 0 : 1;
    const days = [...DOW.slice(ws), ...DOW.slice(0, ws)];
    const grid = monthGrid(y, m - 1, ws);
    const focusIso = grid.some((g) => g.iso === selected) ? selected : grid.find((g) => !g.out)!.iso;
    const cell = (g: { iso: string; n: number; out: boolean }): Node => {
      const ev = events[g.iso] ?? [];
      const cls = [mc.cell, ...(g.out ? [mc.out] : []), ...(g.iso === selected ? [mc.on] : [])];
      return n('button', cls, [
        n('span', [mc.num], [String(g.n)], { 'aria-hidden': 'true' }),
        ...ev.slice(0, ev.length > 2 ? 1 : 2).map((t) => n('span', [mc.ev], [t], { 'aria-hidden': 'true' })),
        ...(ev.length > 2 ? [n('span', [mc.more], [`+${ev.length - 1} more`], { 'aria-hidden': 'true' })] : []),
      ], { type: 'button', 'data-date': g.iso, 'aria-pressed': String(g.iso === selected), 'aria-label': `${longDate(g.iso)}, ${evCount(ev.length).toLowerCase()}`, tabindex: g.iso === focusIso ? '0' : '-1' });
    };
    const sel = selected ? events[selected] ?? [] : [];
    return n('section', [mc.root], [
      n('div', [mc.head], [
        n('h2', [mc.title], [monthLabel(y, m - 1)], { 'aria-live': 'polite', 'data-label': true }),
        n('div', [mc.nav], [btn('Today', 'ghost', { 'data-today-btn': true }), ibtn('chevron-left', 'Previous month', { 'data-dir': '-1' }), ibtn('chevron-right', 'Next month', { 'data-dir': '1' })]),
      ]),
      n('div', [mc.grid], [...days.map((d) => n('span', [mc.dow], [d], { 'aria-hidden': 'true' })), ...grid.map(cell)], { role: 'group', 'aria-label': 'Days', 'data-grid': true }),
      n('div', [mc.agenda], [
        n('p', [mc.agendaHead], [selected ? `${longDate(selected)} · ${evCount(sel.length)}` : 'Select a day to see its events'], { 'data-agenda-head': true }),
        n('ul', [mc.agendaList], sel.map((t) => n('li', [], [t])), { 'data-agenda': true }),
      ], { 'aria-live': 'polite' }),
      n('template', [], [n('span', [mc.num], [''], { 'aria-hidden': 'true' }), n('span', [mc.ev], [''], { 'aria-hidden': 'true' }), n('span', [mc.more], [''], { 'aria-hidden': 'true' })], { 'data-parts': true }),
    ], { 'aria-label': 'Calendar', 'data-p8': 'monthcal', 'data-month': month, 'data-week': String(ws), 'data-selected': selected, 'data-events': JSON.stringify(events) });
  },
};

/* ---------- Chart ---------- */
const chc = { root: `${p}-chart`, head: `${p}-chart__head`, title: `${p}-chart__title`, legend: `${p}-chart__legend`, key: `${p}-chart__key`, sw: `${p}-chart__swatch`, plot: `${p}-chart__plot`, y: `${p}-chart__y`, area: `${p}-chart__area`, svg: `${p}-chart__svg`, gridline: `${p}-chart__gridline`, series: `${p}-chart__series`, band: `${p}-chart__band`, x: `${p}-chart__x`, tip: `${p}-chart__tip`, tipRow: `${p}-chart__tip-row`, sr: `${p}-chart__sr`, s: [`${p}-chart__s1`, `${p}-chart__s2`, `${p}-chart__s3`] };
const SERIES_COLORS = ['color-ink', 'color-ink-muted', 'color-placeholder'];
export function parseChart(s: unknown): { labels: string[]; series: { name: string; values: number[] }[] } {
  const rows = lines(s).map((l) => l.split('|').map((x) => x.trim()));
  const head = rows.shift() ?? [];
  const names = head.slice(1, 4);
  const body = rows.filter((r) => r[0]);
  return { labels: body.map((r) => r[0]), series: names.map((name, i) => ({ name: name || `Series ${i + 1}`, values: body.map((r) => Math.max(0, Number(r[i + 1]) || 0)) })) };
}
export const niceMax = (mx: number) => { if (mx <= 0) return 4; const e = 10 ** Math.floor(Math.log10(mx)); const f = [1, 2, 2.5, 5, 10].find((k) => k * e >= mx)!; return f * e; };
export const compact = (x: number) => (x >= 1e6 ? `${+(x / 1e6).toFixed(1)}M` : x >= 1e3 ? `${+(x / 1e3).toFixed(1)}k` : String(+x.toFixed(2)));
export const chart: ComponentDef = {
  id: 'chart', name: 'Chart', description: 'Bar, line or area chart with legend toggles, hover values and a data table for screen readers.', tags: ['data'], status: 'stable',
  usage: 'Data is a small table: the first line names the columns ("Month | Revenue | Costs"), each next line is a label and up to three values. Hover (or focus the plot and use ← →) to read the values of a point. Legend buttons hide and show a series. The same numbers are in a visually hidden table, so screen readers get the data, not a picture. Series are ink, muted and light grey; keep to three.',
  composition: 'Legend keys are toggle buttons; the tooltip is a Popover-style panel.',
  props: [
    P.text('title', 'Revenue vs costs', 'Chart title (also the accessible name).'),
    P.select('type', ['bar', 'line', 'area'], 'bar', 'Chart type.'),
    P.area('data', 'Month | Revenue | Costs\nJan | 120 | 80\nFeb | 150 | 95\nMar | 170 | 110\nApr | 140 | 100\nMay | 190 | 120\nJun | 230 | 130', 'Header line, then "Label | value | value" per line (up to three series).', 'string (one per line)'),
    P.bool('legend', true, 'Show the legend toggles.'),
  ],
  rules: [
    { cls: chc.root, base: { position: 'relative', display: 'flex', 'flex-direction': 'column', gap: v('space-12'), width: v('size-500'), 'max-width': '100%', color: v('color-ink'), ...text('sm') } },
    { cls: chc.head, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12') } },
    { cls: chc.title, base: { margin: '0', 'font-weight': v('type-weight-strong'), ...text('sm') } },
    { cls: chc.legend, base: { display: 'flex', gap: v('space-4') } },
    { cls: chc.key, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-8'), 'padding-block': v('space-4'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), border: 'none', background: 'transparent', color: v('color-ink'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus, nested: [{ sel: '[aria-pressed="false"]', decls: { color: v('color-ink-muted') } }, { sel: `[aria-pressed="false"] .${chc.sw}`, decls: { opacity: '0.3' } }] },
    { cls: chc.sw, base: { width: v('space-8'), height: v('space-8'), 'border-radius': v('radius-full'), 'flex-shrink': '0' } },
    { cls: chc.plot, base: { display: 'grid', 'grid-template-columns': 'auto minmax(0, 1fr)', 'column-gap': v('space-8'), 'row-gap': v('space-4') } },
    { cls: chc.y, base: { display: 'flex', 'flex-direction': 'column', 'justify-content': 'space-between', height: v('size-160'), color: v('color-ink-muted'), 'text-align': 'right', 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
    { cls: chc.area, base: { position: 'relative', height: v('size-160'), 'border-radius': v('radius-4'), cursor: 'crosshair' }, focus },
    { cls: chc.svg, base: { display: 'block', width: '100%', height: '100%', overflow: 'visible' } },
    { cls: chc.gridline, base: { stroke: v('color-ring'), 'stroke-width': v('border-hairline'), 'vector-effect': 'non-scaling-stroke' } },
    { cls: chc.series, base: {}, nested: [{ sel: '[data-off]', decls: { display: 'none' } }] },
    { cls: chc.band, base: { fill: v('color-control'), opacity: '0' }, nested: [{ sel: '[data-show]', decls: { opacity: '1' } }] },
    ...chc.s.map((cls, i): Rule => ({ cls, base: { fill: v(SERIES_COLORS[i]), stroke: v(SERIES_COLORS[i]), 'stroke-width': v('border-focus'), 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, nested: [{ sel: '[data-line]', decls: { fill: 'none' } }, { sel: '[data-fill]', decls: { stroke: 'none', 'fill-opacity': '0.15' } }, { sel: '[data-bar]', decls: { stroke: 'none' } }] })),
    { cls: chc.x, base: { display: 'grid', color: v('color-ink-muted'), 'text-align': 'center', 'grid-column': '2' } },
    { cls: chc.tip, base: { position: 'absolute', top: '0', 'z-index': '10', display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'box-sizing': 'border-box', 'min-width': v('size-160'), 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-canvas'), color: v('color-ink'), 'pointer-events': 'none', translate: '-50% 0', ...ringDecl, ...text('sm') }, nested: [hiddenRule] },
    { cls: chc.tipRow, base: { display: 'flex', 'align-items': 'center', gap: v('space-8'), 'white-space': 'nowrap' } },
    { cls: chc.sr, base: srOnly },
  ],
  render(pr: Props): Node {
    const { labels, series } = parseChart(pr.data);
    const nL = Math.max(1, labels.length);
    const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
    const W = nL * 100;
    const y = (val: number) => +(100 - (val / max) * 100).toFixed(2);
    const type = String(pr.type);
    const marks = series.map((s, si) => {
      let kids: Node[];
      if (type === 'bar') {
        const bw = 60 / series.length;
        kids = s.values.map((val, i) => n('rect', [chc.s[si]], undefined, { x: String(i * 100 + 20 + si * bw), y: String(y(val)), width: String(+(bw - 4).toFixed(2)), height: String(+(100 - y(val)).toFixed(2)), rx: '2', 'data-bar': true }));
      } else {
        const pts = s.values.map((val, i) => `${i * 100 + 50} ${y(val)}`);
        const d = pts.length ? `M${pts.join(' L')}` : '';
        kids = [...(type === 'area' && pts.length ? [n('path', [chc.s[si]], undefined, { d: `${d} L${(nL - 1) * 100 + 50} 100 L50 100 Z`, 'data-fill': true })] : []), n('path', [chc.s[si]], undefined, { d, 'data-line': true })];
      }
      return n('g', [chc.series], kids, { 'data-series': String(si) });
    });
    const ticks = [max, (max * 3) / 4, max / 2, max / 4, 0];
    const summary = `${pr.title || 'Chart'}: ${type} chart of ${series.map((s) => s.name).join(', ')} over ${labels.length} points`;
    return n('figure', [chc.root], [
      n('div', [chc.head], [
        n('figcaption', [chc.title], [(pr.title as string) || 'Chart']),
        ...(pr.legend && series.length ? [n('div', [chc.legend], series.map((s, i) => n('button', [chc.key], [n('span', [chc.sw], [], { style: `background: var(--p8-${SERIES_COLORS[i]})` }), s.name], { type: 'button', 'aria-pressed': 'true', 'data-key': String(i) })), { role: 'group', 'aria-label': 'Series' })] : []),
      ]),
      n('div', [chc.plot], [
        n('div', [chc.y], ticks.map((t) => n('span', [], [compact(t)])), { 'aria-hidden': 'true' }),
        n('div', [chc.area], [
          n('svg', [chc.svg], [
            ...[0, 25, 50, 75, 100].map((gy) => n('line', [chc.gridline], undefined, { x1: '0', x2: String(W), y1: String(gy), y2: String(gy) })),
            n('rect', [chc.band], undefined, { x: '0', y: '0', width: '100', height: '100', 'data-band': true }),
            ...marks,
          ], { viewBox: `0 0 ${W} 100`, preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' }),
          n('div', [chc.tip], [], { 'data-tip': true, hidden: true, 'aria-hidden': 'true' }),
        ], { tabindex: '0', role: 'img', 'aria-label': `${summary}. Use the left and right arrow keys to read values.`, 'data-plot': true }),
        n('div', [chc.x], labels.map((l) => n('span', [], [l])), { style: `grid-template-columns: repeat(${nL}, minmax(0, 1fr))`, 'aria-hidden': 'true' }),
      ]),
      n('p', [chc.sr], [], { 'aria-live': 'polite', 'data-live': true }),
      n('template', [], [n('div', [chc.tipRow], [n('span', [chc.sw], []), n('span', [], [''])])], { 'data-row': true }),
      n('table', [chc.sr], [
        n('caption', [], [(pr.title as string) || 'Chart']),
        n('thead', [], [n('tr', [], [n('th', [], [''], { scope: 'col' }), ...series.map((s) => n('th', [], [s.name], { scope: 'col' }))])]),
        n('tbody', [], labels.map((l, i) => n('tr', [], [n('th', [], [l], { scope: 'row' }), ...series.map((s) => n('td', [], [String(s.values[i])]))]))),
      ]),
    ], { 'data-p8': 'chart', 'data-chart': JSON.stringify({ labels, series }) });
  },
};

/* ---------- Sparkline ---------- */
const spk = { root: `${p}-sparkline`, svg: `${p}-sparkline__svg`, line: `${p}-sparkline__line`, fill: `${p}-sparkline__fill`, bar: `${p}-sparkline__bar`, dot: `${p}-sparkline__dot`, value: `${p}-sparkline__value`, delta: `${p}-sparkline__delta` };
export const sparkline: ComponentDef = {
  id: 'sparkline', name: 'Sparkline', description: 'A tiny trend line, area or bars to sit next to a number.', tags: ['data', 'content'], status: 'stable',
  usage: 'Values are comma-separated numbers, oldest first. It is a picture with a summary for screen readers ("Signups: 12 to 24, up 100%"); put the exact number next to it. For axes, labels or several series use Chart.',
  props: [
    P.text('values', '12, 14, 13, 18, 17, 21, 24', 'Comma-separated numbers, oldest first.'),
    P.select('type', ['line', 'area', 'bar'], 'line', 'Drawing.'),
    P.text('label', 'Signups', 'What the numbers are (for the summary).'),
    P.select('size', ['sm', 'md'], 'md', 'sm is 72×24, md is 160×32.'),
    P.bool('showValue', true, 'Show the last value and the change.'),
  ],
  rules: [
    { cls: spk.root, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-8'), color: v('color-ink'), ...text('sm') } },
    { cls: spk.svg, base: { display: 'block', 'flex-shrink': '0', overflow: 'visible' } },
    { cls: spk.line, base: { fill: 'none', stroke: v('color-ink'), 'stroke-width': v('border-focus'), 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } },
    { cls: spk.fill, base: { fill: v('color-ink'), 'fill-opacity': '0.12', stroke: 'none' } },
    { cls: spk.bar, base: { fill: v('color-ink-muted') } },
    { cls: spk.dot, base: { fill: v('color-ink') } },
    { cls: spk.value, base: { 'font-weight': v('type-weight-strong'), 'font-variant-numeric': 'tabular-nums' } },
    { cls: spk.delta, base: { color: v('color-ink-muted'), 'font-variant-numeric': 'tabular-nums' } },
  ],
  render(pr: Props): Node {
    const vals = String(pr.values).split(/[,\s]+/).map(Number).filter((x) => Number.isFinite(x));
    const data = vals.length ? vals : [0];
    const [W, H] = pr.size === 'sm' ? [72, 24] : [160, 32];
    const lo = Math.min(...data), hi = Math.max(...data), span = hi - lo || 1;
    const pad = 2;
    const X = (i: number) => +(data.length === 1 ? W / 2 : pad + (i * (W - pad * 2)) / (data.length - 1)).toFixed(2);
    const Y = (val: number) => +(H - pad - ((val - lo) / span) * (H - pad * 2)).toFixed(2);
    const first = data[0], last = data[data.length - 1];
    const pct = first ? Math.round(((last - first) / Math.abs(first)) * 100) : 0;
    const trend = last > first ? `up ${pct}%` : last < first ? `down ${Math.abs(pct)}%` : 'no change';
    let kids: Node[];
    if (pr.type === 'bar') {
      const bw = Math.max(1, (W - pad * 2) / data.length - 2);
      kids = data.map((val, i) => n('rect', [spk.bar], undefined, { x: String(+(pad + (i * (W - pad * 2)) / data.length + 1).toFixed(2)), y: String(Y(val)), width: String(+bw.toFixed(2)), height: String(+(H - pad - Y(val) + 1).toFixed(2)), rx: '1' }));
    } else {
      const d = `M${data.map((val, i) => `${X(i)} ${Y(val)}`).join(' L')}`;
      kids = [...(pr.type === 'area' ? [n('path', [spk.fill], undefined, { d: `${d} L${X(data.length - 1)} ${H} L${X(0)} ${H} Z` })] : []), n('path', [spk.line], undefined, { d }), n('circle', [spk.dot], undefined, { cx: String(X(data.length - 1)), cy: String(Y(last)), r: '2.5' })];
    }
    const svg = n('svg', [spk.svg], kids, { width: String(W), height: String(H), viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `${pr.label || 'Trend'}: ${compact(first)} to ${compact(last)}, ${trend}` });
    return n('span', [spk.root], [svg, ...(pr.showValue ? [n('span', [spk.value], [compact(last)], { 'aria-hidden': 'true' }), n('span', [spk.delta], [last >= first ? `+${pct}%` : `${pct}%`], { 'aria-hidden': 'true' })] : [])]);
  },
};

/* ---------- Chat message ---------- */
const cm = { root: `${p}-chatmsg`, user: `${p}-chatmsg--user`, body: `${p}-chatmsg__body`, meta: `${p}-chatmsg__meta`, name: `${p}-chatmsg__name`, bubble: `${p}-chatmsg__bubble`, para: `${p}-chatmsg__p`, code: `${p}-chatmsg__code`, pre: `${p}-chatmsg__pre`, actions: `${p}-chatmsg__actions`, status: `${p}-chatmsg__status`, typing: `${p}-chatmsg__typing` };
/** Minimal message formatting: blank lines split paragraphs, ```fences``` are code blocks, `ticks` are inline code. */
export function messageNodes(body: string): Node[] {
  const out: Node[] = [];
  const parts = body.split(/```/);
  parts.forEach((part, i) => {
    if (i % 2) { const code = part.replace(/^[a-z]*\n/, '').replace(/\n$/, ''); if (code) out.push(n('pre', [cm.pre], [n('code', [], [code])])); return; }
    for (const para of part.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean)) {
      const kids: (Node | string)[] = para.split(/`([^`]+)`/).map((t, j) => (j % 2 ? n('code', [cm.code], [t]) : t)).filter((t) => t !== '');
      out.push(n('p', [cm.para], kids));
    }
  });
  return out;
}
const dots = (): Node => n('svg', [cm.typing], [0, 1, 2].map((k) => n('circle', [], [n('animate', [], undefined, { attributeName: 'opacity', values: '0.3;1;0.3', dur: '1.2s', begin: `${k * 0.2}s`, repeatCount: 'indefinite' })], { cx: String(4 + k * 8), cy: '4', r: '3', fill: 'currentColor', opacity: '0.3' })), { width: '24', height: '8', viewBox: '0 0 24 8', role: 'img', 'aria-label': 'Typing' });
export const chatMessage: ComponentDef = {
  id: 'chat-message', name: 'Chat Message', description: 'One message in a conversation: user bubble or assistant reply, with status and actions.', tags: ['content', 'ai'], status: 'stable',
  usage: 'User messages sit on the right in a bubble; assistant replies sit on the left as plain text. The body supports paragraphs (blank line), `inline code` and ``` code blocks ```. Streaming shows a typing indicator until text arrives. Copy copies the text; Retry, Edit and Try again fire p8-action with { action }. Keep the list in a log region (role="log") so new messages are announced.',
  composition: 'Avatar, Copy Button and ghost Buttons around formatted text.',
  props: [
    P.select('role', ['assistant', 'user'], 'assistant', 'Who wrote it.'),
    P.text('name', 'Assistant', 'Author name.'),
    P.text('time', '10:24', 'Time shown next to the name.'),
    P.area('body', 'Here is a summary of the review:\n\nThe layout passes, but `gap: 10px` is off the grid. Use 12:\n\n```css\n.list { gap: var(--p8-space-12); }\n```', 'Message text. Blank line = new paragraph; `code`; ``` blocks ```.'),
    P.select('status', ['sent', 'sending', 'error'], 'sent', 'Delivery state (user messages).'),
    P.bool('streaming', false, 'Show the typing indicator (assistant is still writing).'),
    P.bool('actions', true, 'Show Copy and Retry / Edit.'),
  ],
  rules: [
    { cls: cm.root, base: { display: 'flex', 'align-items': 'flex-start', gap: v('space-12'), width: v('size-500'), 'max-width': '100%', color: v('color-ink'), ...text('sm') } },
    { cls: cm.user, base: { 'flex-direction': 'row-reverse' } },
    { cls: cm.body, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'min-width': '0', flex: '1' }, nested: [{ sel: `:where(.${cm.user} *)`, decls: { 'align-items': 'flex-end' } }] },
    { cls: cm.meta, base: { display: 'flex', 'align-items': 'baseline', gap: v('space-8'), color: v('color-ink-muted') } },
    { cls: cm.name, base: { color: v('color-ink'), 'font-weight': v('type-weight-strong') } },
    { cls: cm.bubble, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-8'), 'min-width': '0', 'max-width': '100%' } },
    { cls: `${cm.bubble}--user`, base: { 'max-width': '85%', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-12'), background: v('color-control') } },
    { cls: cm.para, base: { margin: '0', 'overflow-wrap': 'anywhere' } },
    { cls: cm.code, base: { 'padding-inline': v('space-4'), 'border-radius': v('radius-4'), background: v('color-control-strong'), 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
    { cls: cm.pre, base: { margin: '0', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), background: v('color-control'), overflow: 'auto', 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono'), 'white-space': 'pre' } },
    { cls: cm.actions, base: { display: 'flex', 'align-items': 'center', gap: v('space-4') } },
    { cls: cm.status, base: { display: 'flex', 'align-items': 'center', gap: v('space-8'), color: v('color-ink-muted') } },
    { cls: cm.typing, base: { color: v('color-ink-muted'), 'margin-block': v('space-8') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const user = pr.role === 'user';
    const body = String(pr.body);
    const content = messageNodes(body);
    const streaming = Boolean(pr.streaming) && !user;
    const bubbleKids: Node[] = streaming && !content.length ? [dots()] : content;
    const actions: Node[] = [];
    if (pr.actions && !streaming && pr.status !== 'sending') {
      const cp = copyButton.render({ text: body, label: '', variant: 'ghost' });
      actions.push({ ...cp, attrs: { ...cp.attrs, 'aria-label': 'Copy message' } });
      actions.push(user ? ibtn('edit', 'Edit message', { 'data-action': 'edit' }, 'ghost', '14') : btn('Retry', 'ghost', { 'data-action': 'retry' }));
    }
    const status: Node[] = user && pr.status === 'sending' ? [n('p', [cm.status], ['Sending…'], { role: 'status' })]
      : user && pr.status === 'error' ? [n('p', [cm.status], ['Not delivered.', btn('Try again', 'ghost', { 'data-action': 'retry' })], { role: 'alert' })] : [];
    return n('article', user ? [cm.root, cm.user] : [cm.root], [
      avatar.render({ name: (pr.name as string) || (user ? 'You' : 'Assistant'), src: '', size: '32' }),
      n('div', [cm.body], [
        n('div', [cm.meta], [n('span', [cm.name], [(pr.name as string) || (user ? 'You' : 'Assistant')]), ...(pr.time ? [n('time', [], [pr.time as string])] : [])]),
        n('div', user ? [cm.bubble, `${cm.bubble}--user`] : [cm.bubble], bubbleKids, streaming ? { 'aria-busy': 'true' } : undefined),
        ...status,
        ...(actions.length ? [n('div', [cm.actions], actions)] : []),
      ]),
    ], { 'aria-label': `${(pr.name as string) || (user ? 'You' : 'Assistant')}${pr.time ? ` at ${pr.time}` : ''}`, 'data-p8': 'action' });
  },
};

/* ---------- Chat composer ---------- */
const cc = { root: `${p}-composer`, box: `${p}-composer__box`, input: `${p}-composer__input`, bar: `${p}-composer__bar`, tools: `${p}-composer__tools`, send: `${p}-composer__send`, hint: `${p}-composer__hint`, files: `${p}-composer__files`, file: `${p}-composer__file` };
export const chatComposer: ComponentDef = {
  id: 'chat-composer', name: 'Chat Composer', description: 'The message box of a chat: grows as you type, Enter sends, Shift+Enter adds a line.', tags: ['control', 'form', 'ai'], status: 'stable',
  usage: 'Enter sends and Shift+Enter starts a new line (except while an input method is composing). The box grows up to 160px, then scrolls. Send is disabled while empty. Sending fires p8-send with { text } and clears the box. While busy (the assistant is answering) the send button becomes Stop, which fires p8-stop; dispatch new CustomEvent("p8-busy", { detail: { busy } }) on the element to switch. Attach opens a file picker and fires p8-attach with { files }.',
  composition: 'A Textarea with Icon Buttons in a control surface.',
  props: [
    P.text('placeholder', 'Message the assistant…', 'Placeholder.'),
    P.area('value', '', 'Initial text.'),
    P.bool('busy', false, 'The assistant is answering: show Stop instead of Send.'),
    P.bool('attach', true, 'Show the attach button.'),
    P.bool('hint', true, 'Show the keyboard hint below.'),
    P.bool('disabled', false, 'Disables the composer.'),
  ],
  rules: [
    { cls: cc.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), width: v('size-500'), 'max-width': '100%', margin: '0', 'font-family': v('type-family') } },
    { cls: cc.box, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-8'), 'box-sizing': 'border-box', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-12'), background: v('color-control'), transition: `background ${motion}` }, nested: [{ sel: ':focus-within', decls: { background: v('color-control-strong') } }] },
    { cls: cc.input, base: { display: 'block', width: '100%', 'box-sizing': 'border-box', 'max-height': v('size-160'), padding: '0', border: 'none', background: 'transparent', color: v('color-ink'), resize: 'none', outline: 'none', 'overflow-y': 'auto', ...text('sm') }, placeholder: { color: v('color-placeholder') }, disabled: { cursor: 'not-allowed' } },
    { cls: cc.bar, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-8') } },
    { cls: cc.tools, base: { display: 'flex', 'align-items': 'center', gap: v('space-8'), 'min-width': '0', color: v('color-ink-muted'), ...text('sm') } },
    { cls: cc.send, base: { background: v('color-ink'), color: v('color-ink-inverse') }, hover: { background: v('color-ink'), opacity: v('opacity-hover') }, nested: [hiddenRule] },
    { cls: cc.files, base: { overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' } },
    { cls: cc.file, base: srOnly },
    { cls: cc.hint, base: { margin: '0', color: v('color-ink-muted'), ...text('sm') }, nested: [hiddenRule] },
    iconRule,
  ],
  render(pr: Props): Node {
    const value = String(pr.value);
    const busy = Boolean(pr.busy);
    const off = dis(pr.disabled);
    const send = ibtn('arrow-right', 'Send message', { type: 'submit', 'data-send': true, ...(busy ? { hidden: true } : {}), ...(!value.trim() || pr.disabled ? { disabled: true } : {}) }, 'default');
    const stop = ibtn('close', 'Stop generating', { type: 'button', 'data-stop': true, ...(busy ? {} : { hidden: true }), ...off }, 'default');
    return n('form', [cc.root], [
      n('div', [cc.box], [
        n('textarea', [cc.input], value ? [value] : [], { rows: '1', placeholder: pr.placeholder as string, 'aria-label': 'Message', 'aria-describedby': 'composer-hint', enterkeyhint: 'send', 'data-input': true, ...off }),
        n('div', [cc.bar], [
          n('div', [cc.tools], pr.attach ? [ibtn('plus', 'Attach files', { 'data-attach': true, ...off }), n('input', [cc.file], undefined, { type: 'file', multiple: true, tabindex: '-1', 'aria-hidden': 'true', 'aria-label': 'Attach files', 'data-file': true }), n('span', [cc.files], [], { 'aria-live': 'polite', 'data-files': true })] : []),
          n('div', [cc.tools], [{ ...stop, cls: [...(stop.cls ?? []), cc.send] }, { ...send, cls: [...(send.cls ?? []), cc.send] }]),
        ]),
      ]),
      n('p', [cc.hint], ['Enter to send, Shift+Enter for a new line'], pr.hint ? { id: 'composer-hint' } : { id: 'composer-hint', hidden: true }),
    ], { 'aria-label': 'Send a message', 'data-p8': 'composer', 'data-busy': String(busy) });
  },
};

/* ---------- Navbar ---------- */
const nb = { root: `${p}-navbar`, brand: `${p}-navbar__brand`, logo: `${p}-navbar__logo`, links: `${p}-navbar__links`, link: `${p}-navbar__link`, on: `${p}-navbar__link--active`, right: `${p}-navbar__right` };
export const navbar: ComponentDef = {
  id: 'navbar', name: 'Navbar', description: 'The top bar of an app: brand, main links, search, action and account.', tags: ['navigation', 'page'], status: 'stable',
  usage: 'The current page link has aria-current="page"; clicking a link moves it and fires p8-navigate with { label, href }. On narrow screens the links scroll sideways instead of wrapping. Keep five links or fewer; put the rest in a Sidebar Nav or a menu.',
  composition: 'Links, an Icon Button, a Button and an Avatar in a header.',
  props: [
    P.text('brand', 'Acme', 'Product name.'),
    P.area('links', 'Overview\nProjects\nTeam\nSettings', 'Main links, one per line.', 'string (one per line)'),
    P.text('active', 'Projects', 'Label of the current page.'),
    P.text('action', 'New project', 'Primary action. Empty to omit.'),
    P.bool('search', true, 'Show the search button.'),
    P.text('user', 'Ada Lovelace', 'Signed-in user (avatar). Empty to omit.'),
  ],
  rules: [
    { cls: nb.root, base: { display: 'flex', 'align-items': 'center', gap: v('space-12'), width: '100%', 'box-sizing': 'border-box', 'padding-block': v('space-8'), 'padding-inline': v('space-16'), background: v('color-canvas'), color: v('color-ink'), 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}`, ...text('sm') } },
    { cls: nb.brand, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-8'), 'flex-shrink': '0', color: v('color-ink'), 'font-weight': v('type-weight-strong'), 'text-decoration': 'none', 'border-radius': v('radius-4') }, focus },
    { cls: nb.logo, base: { width: v('size-24'), height: v('size-24'), 'border-radius': v('radius-8'), background: v('color-ink') } },
    { cls: nb.links, base: { display: 'flex', 'align-items': 'center', gap: v('space-4'), flex: '1', 'min-width': '0', 'overflow-x': 'auto', 'scrollbar-width': 'none' } },
    { cls: nb.link, base: { 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), color: v('color-ink-muted'), 'text-decoration': 'none', 'white-space': 'nowrap', cursor: 'pointer', transition: `background ${motion}, color ${motion}` }, hover: { color: v('color-ink'), background: v('color-control') }, focus },
    { cls: nb.on, base: { color: v('color-ink'), background: v('color-control-strong') } },
    { cls: nb.right, base: { display: 'flex', 'align-items': 'center', gap: v('space-8'), 'flex-shrink': '0' } },
    iconRule,
  ],
  render(pr: Props): Node {
    const links = lines(pr.links);
    const right: Node[] = [];
    if (pr.search) right.push(ibtn('search', 'Search', { 'data-action': 'search' }));
    if (pr.action) right.push(btn(pr.action as string, 'primary', { 'data-action': pr.action as string }, 'plus'));
    if (pr.user) right.push(avatar.render({ name: pr.user as string, src: '', size: '32' }));
    return n('header', [nb.root], [
      n('a', [nb.brand], [n('span', [nb.logo], [], { 'aria-hidden': 'true' }), (pr.brand as string) || 'Home'], { href: '/' }),
      n('nav', [nb.links], links.map((l) => n('a', l === pr.active ? [nb.link, nb.on] : [nb.link], [l], { href: `#${slug(l)}`, 'data-nav': true, ...(l === pr.active ? { 'aria-current': 'page' } : {}) })), { 'aria-label': 'Main' }),
      ...(right.length ? [n('div', [nb.right], right)] : []),
    ], { 'data-p8': 'nav action' });
  },
};

/* ---------- App shell ---------- */
const as = { root: `${p}-shell`, framed: `${p}-shell--framed`, side: `${p}-shell__side`, sideOn: `${p}-shell__side--on`, sideHead: `${p}-shell__side-head`, brand: `${p}-shell__brand`, logo: `${p}-shell__logo`, nav: `${p}-shell__nav`, item: `${p}-shell__item`, itemOn: `${p}-shell__item--active`, label: `${p}-shell__label`, toggle: `${p}-shell__toggle`, main: `${p}-shell__main`, header: `${p}-shell__header`, title: `${p}-shell__title`, content: `${p}-shell__content`, placeholder: `${p}-shell__placeholder` };
export const parseNavItems = (s: unknown): { icon: IconName; label: string }[] => lines(s).map((l) => { const at = l.indexOf(':'); const ic = at > 0 ? l.slice(0, at).trim() : ''; return { icon: (ICON_NAMES as string[]).includes(ic) ? (ic as IconName) : 'file', label: at > 0 && (ICON_NAMES as string[]).includes(ic) ? l.slice(at + 1).trim() : l.trim() }; }).filter((x) => x.label);
export const appShell: ComponentDef = {
  id: 'app-shell', name: 'App Shell', description: 'The frame of an app: collapsible sidebar, page header and a scrolling content area.', tags: ['layout', 'navigation', 'page'], status: 'stable',
  usage: 'Put your page in the content area. The sidebar collapses to an icon rail with its toggle (labels stay available to screen readers and as tooltips); the current item has aria-current="page" and clicking an item fires p8-navigate. Set fill to take the whole viewport (100dvh); otherwise it is a 400px tall framed preview. Only the content area scrolls.',
  composition: 'Sidebar links, an Icon Button toggle, a Heading and a Button.',
  props: [
    P.text('brand', 'Acme', 'Product name.'),
    P.area('items', 'home: Home\nfolder: Projects\nuser: Team\nsettings: Settings', 'Sidebar items, one per line: "icon: Label" (icon from the pack).', 'string (one per line)'),
    P.text('active', 'Projects', 'Label of the current page.'),
    P.text('title', 'Projects', 'Page title in the header.'),
    P.text('action', 'New project', 'Header action. Empty to omit.'),
    P.bool('collapsed', false, 'Start with the sidebar collapsed to icons.'),
    P.bool('fill', false, 'Fill the viewport height instead of a framed 400px preview.'),
  ],
  rules: [
    { cls: as.root, base: { display: 'grid', 'grid-template-columns': 'auto minmax(0, 1fr)', width: '100%', 'min-height': '100dvh', 'box-sizing': 'border-box', background: v('color-canvas'), color: v('color-ink'), ...text('sm') } },
    { cls: as.framed, base: { width: v('size-720'), 'max-width': '100%', height: v('size-400'), 'min-height': '0', overflow: 'hidden', 'border-radius': v('radius-12'), ...ringDecl } },
    { cls: as.side, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), width: v('size-240'), 'box-sizing': 'border-box', 'padding-block': v('space-12'), 'padding-inline': v('space-12'), background: v('color-surface'), 'border-right': `${v('border-hairline')} solid ${v('color-ring')}`, overflow: 'hidden', transition: `width ${motion}` }, nested: [{ sel: ` .${as.label}`, decls: { transition: `opacity ${motion}` } }] },
    { cls: as.sideOn, base: { width: v('size-72') }, nested: [{ sel: ` .${as.label}`, decls: { ...srOnly } }, { sel: ` .${as.brand}`, decls: { display: 'none' } }, { sel: ` .${as.sideHead}`, decls: { 'justify-content': 'center' } }, { sel: ` .${as.toggle} svg`, decls: { rotate: '180deg' } }] },
    { cls: as.sideHead, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-8') } },
    { cls: as.brand, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-8'), 'font-weight': v('type-weight-strong'), 'white-space': 'nowrap', 'min-width': '0' } },
    { cls: as.logo, base: { width: v('size-24'), height: v('size-24'), 'flex-shrink': '0', 'border-radius': v('radius-8'), background: v('color-ink') } },
    { cls: as.nav, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4') } },
    { cls: as.item, base: { position: 'relative', display: 'flex', 'align-items': 'center', gap: v('space-8'), 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), color: v('color-ink-muted'), 'text-decoration': 'none', 'white-space': 'nowrap', cursor: 'pointer' }, hover: { color: v('color-ink'), background: v('color-control') }, focus },
    { cls: as.itemOn, base: { color: v('color-ink'), background: v('color-control-strong') } },
    { cls: as.label, base: {} },
    { cls: as.toggle, base: {}, nested: [{ sel: ' svg', decls: { transition: `rotate ${motion}` } }] },
    { cls: as.main, base: { display: 'flex', 'flex-direction': 'column', 'min-width': '0', 'min-height': '0' } },
    { cls: as.header, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12'), 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}` } },
    { cls: as.title, base: { margin: '0', ...text('md'), 'font-weight': v('type-weight-strong') } },
    { cls: as.content, base: { flex: '1', 'min-height': '0', 'overflow-y': 'auto', 'padding-block': v('space-16'), 'padding-inline': v('space-16') } },
    { cls: as.placeholder, base: { margin: '0', color: v('color-ink-muted') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const items = parseNavItems(pr.items);
    const collapsed = Boolean(pr.collapsed);
    const toggle = ibtn('chevron-left', collapsed ? 'Expand sidebar' : 'Collapse sidebar', { 'aria-expanded': String(!collapsed), 'aria-controls': 'shell-nav', 'data-collapse': true });
    return n('div', pr.fill ? [as.root] : [as.root, as.framed], [
      n('aside', collapsed ? [as.side, as.sideOn] : [as.side], [
        n('div', [as.sideHead], [n('span', [as.brand], [n('span', [as.logo], [], { 'aria-hidden': 'true' }), (pr.brand as string) || 'App']), { ...toggle, cls: [...(toggle.cls ?? []), as.toggle] }]),
        n('nav', [as.nav], items.map((x) => n('a', x.label === pr.active ? [as.item, as.itemOn] : [as.item], [iconNode(x.icon, 16), n('span', [as.label], [x.label])], { href: `#${slug(x.label)}`, 'data-nav': true, ...(collapsed ? { title: x.label } : {}), ...(x.label === pr.active ? { 'aria-current': 'page' } : {}) })), { id: 'shell-nav', 'aria-label': 'Sidebar' }),
      ], { 'aria-label': 'Sidebar' }),
      n('div', [as.main], [
        n('header', [as.header], [n('h1', [as.title], [(pr.title as string) || 'Page']), ...(pr.action ? [btn(pr.action as string, 'primary', { 'data-action': pr.action as string }, 'plus')] : [])]),
        n('main', [as.content], [n('p', [as.placeholder], ['Page content goes here.'])], { tabindex: '-1' }),
      ]),
    ], { 'data-p8': 'shell nav action' });
  },
};

export { f, ck };
