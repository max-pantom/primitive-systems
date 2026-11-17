import { v } from '../tokens/theme';
import { c as bc, iconNode, iconRule } from './button';
import { s as sel } from './forms';
import { iconButton } from './bits';
import { po, popRules } from './overlay';
import { tag } from './bits';
import { P, fieldFocus, focus, hiddenRule, lines, n, p, ringDecl, text, controlBase } from './shared';
import { theme } from '../tokens/theme';
import type { ComponentDef, Node, Props, Rule } from './types';

/* ---------- Calendar math (mirrored in the behavior runtime) ---------- */
export const monthLabel = (y: number, m: number) => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m, 1)));
export function monthGrid(y: number, m: number, weekStart: number): { iso: string; n: number; out: boolean }[] {
  const off = (new Date(Date.UTC(y, m, 1)).getUTCDay() - weekStart + 7) % 7;
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(Date.UTC(y, m, 1 - off + i)); return { iso: d.toISOString().slice(0, 10), n: d.getUTCDate(), out: d.getUTCMonth() !== m }; });
}
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const validDate = (value: string) => ISO.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;

/* ---------- Date picker ---------- */
const cal = { root: `${p}-datepicker`, field: `${p}-datepicker__field`, trigger: `${p}-datepicker__trigger`, head: `${p}-cal__head`, label: `${p}-cal__label`, grid: `${p}-cal__grid`, dow: `${p}-cal__dow`, day: `${p}-cal__day`, on: `${p}-cal__day--on`, out: `${p}-cal__day--out` };
export const datePicker: ComponentDef = {
  id: 'date-picker', name: 'Date Picker', description: 'A date field with a calendar popover.', tags: ['control', 'form'], status: 'stable',
  usage: 'Type a date as YYYY-MM-DD or pick one. Prev/next change the month; choosing a day fills the field and closes the calendar.',
  composition: 'A Text Input plus an Icon Button trigger; the calendar sits in a Popover.',
  props: [
    P.text('value', '', 'Selected date, YYYY-MM-DD. Empty for none.'),
    P.text('month', '2026-11', 'Month the calendar opens on, YYYY-MM (used when no value).'),
    P.select('weekStart', ['sun', 'mon'], 'sun', 'First day of the week.'),
    P.text('placeholder', 'YYYY-MM-DD', 'Placeholder.'),
    P.bool('open', true, 'Initially open.'),
    P.bool('disabled', false, 'Disables the field.'),
  ],
  rules: [
    ...popRules,
    { cls: cal.root, base: { position: 'relative', display: 'inline-block', width: v('size-500'), 'max-width': '100%' } },
    { cls: cal.field, base: { ...controlBase, width: '100%', 'padding-inline-end': v('space-32') }, hover: { background: v('color-control-strong') }, focus: fieldFocus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' }, placeholder: { color: v('color-placeholder') } },
    { cls: cal.trigger, base: { position: 'absolute', top: '50%', translate: '0 -50%', 'inset-inline-end': v('space-4') } },
    { cls: cal.head, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12'), 'margin-bottom': v('space-8') } },
    { cls: cal.label, base: { ...text('sm'), 'font-weight': v('type-weight-strong') } },
    { cls: cal.grid, base: { display: 'grid', 'grid-template-columns': 'repeat(7, 1fr)', gap: v('space-4'), 'text-align': 'center' } },
    { cls: cal.dow, base: { color: v('color-ink-muted'), ...text('sm') } },
    { cls: cal.day, base: { display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', width: v('size-32'), height: v('size-32'), padding: '0', border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus },
    { cls: cal.out, base: { color: v('color-ink-muted') } },
    { cls: cal.on, base: { background: v('color-ink'), color: v('color-ink-inverse') }, hover: { background: v('color-ink') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const value = validDate(String(pr.value)) ? String(pr.value) : '';
    const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(pr.month)) ? String(pr.month) : '2026-11';
    const [y, m] = (value ? value.slice(0, 7) : month).split('-').map(Number);
    const ws = pr.weekStart === 'mon' ? 1 : 0;
    const days = [...DOW.slice(ws), ...DOW.slice(0, ws)];
    const grid = monthGrid(y, m - 1, ws);
    const arrow = (icon: 'chevron-left' | 'chevron-right', dir: string, label: string): Node => { const b = iconButton.render({ icon, label, size: '14', variant: 'ghost-flat', disabled: false }); return { ...b, attrs: { ...b.attrs, 'data-dir': dir, ...(pr.disabled ? { disabled: true as const } : {}) } }; };
    const panel = n('div', pr.open ? [po.panel] : [po.panel], [
      n('div', [cal.head], [arrow('chevron-left', '-1', 'Previous month'), n('span', [cal.label], [monthLabel(y, m - 1)], { 'aria-live': 'polite', 'data-label': true }), arrow('chevron-right', '1', 'Next month')]),
      n('div', [cal.grid], [
        ...days.map((d) => n('span', [cal.dow], [d], { 'aria-hidden': 'true' })),
        ...grid.map((g) => n('button', [cal.day, ...(g.out ? [cal.out] : []), ...(g.iso === value ? [cal.on] : [])], [String(g.n)], { type: 'button', ...(pr.disabled ? { disabled: true as const } : {}), 'data-date': g.iso, 'aria-label': g.iso, 'aria-pressed': String(g.iso === value) })),
      ], { role: 'group', 'aria-label': 'Calendar', 'data-grid': true }),
    ], pr.open && !pr.disabled ? { 'data-panel': true, role: 'dialog', 'aria-label': 'Choose date' } : { 'data-panel': true, role: 'dialog', 'aria-label': 'Choose date', hidden: true });
    const attrs: Node['attrs'] = { type: 'text', inputmode: 'numeric', placeholder: pr.placeholder as string, 'aria-label': 'Date', 'data-input': true };
    if (value) attrs.value = value;
    if (pr.disabled) attrs.disabled = true;
    const trig = iconButton.render({ icon: 'calendar', label: 'Choose date', size: '16', variant: 'ghost-flat', ...(pr.disabled ? { disabled: true as const } : {}) });
    return n('div', [po.root, cal.root], [
      n('input', [cal.field], undefined, attrs),
      { ...trig, cls: [...(trig.cls ?? []), cal.trigger], attrs: { ...trig.attrs, 'data-trigger': true, 'aria-expanded': String(Boolean(pr.open) && !pr.disabled), 'aria-haspopup': 'dialog' } },
      panel,
    ], { 'data-p8': 'popover calendar', 'data-week': String(ws), 'data-month': `${y}-${String(m).padStart(2, '0')}` });
  },
};

/* ---------- Time picker ---------- */
const tp = { root: `${p}-timepicker`, part: `${p}-timepicker__part`, sep: `${p}-timepicker__sep` };
export const timePicker: ComponentDef = {
  id: 'time-picker', name: 'Time Picker', description: 'Hour and minute selects, 12 or 24 hour.', tags: ['control', 'form'], status: 'stable',
  usage: 'Built from native selects, so it works with the keyboard, on phones and without scripts. Value is HH:MM in 24-hour time.',
  composition: 'Made of Select controls.',
  props: [
    P.text('value', '09:30', 'Selected time, HH:MM (24-hour).'),
    P.select('format', ['24h', '12h'], '24h', '24-hour or 12-hour with AM/PM.'),
    P.select('minuteStep', ['1', '5', '15', '30'], '5', 'Minutes between options.'),
    P.bool('disabled', false, 'Disables the selects.'),
  ],
  rules: [
    { cls: tp.root, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-8') } },
    { cls: tp.part, base: { width: v('size-72') } },
    { cls: tp.sep, base: { color: v('color-ink-muted'), ...text('sm') } },
  ],
  render(pr: Props): Node {
    const [h24, mm] = String(pr.value).split(':').map((x) => parseInt(x, 10));
    const hour = Number.isFinite(h24) ? h24 : 9;
    const minute = Number.isFinite(mm) ? mm : 0;
    const twelve = pr.format === '12h';
    const step = Number(pr.minuteStep);
    const mins = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
    const hours = twelve ? Array.from({ length: 12 }, (_, i) => i + 1) : Array.from({ length: 24 }, (_, i) => i);
    const curHour = twelve ? (hour % 12 === 0 ? 12 : hour % 12) : hour;
    const pad = (x: number) => String(x).padStart(2, '0');
    const part = (label: string, options: string[], current: string): Node => {
      const attrs: Node['attrs'] = { 'aria-label': label };
      if (pr.disabled) attrs.disabled = true;
      return n('div', [tp.part, sel.wrap], [
        n('select', [sel.root], options.map((o) => n('option', [], [o], o === current ? { selected: true } : undefined)), attrs),
        { ...iconNode('chevron-down', 16), cls: [bc.icon, sel.icon, ...(pr.disabled ? [sel.iconOff] : [])] },
      ]);
    };
    const kids: Node[] = [part('Hour', hours.map(pad), pad(curHour)), n('span', [tp.sep], [':'], { 'aria-hidden': 'true' }), part('Minute', mins.map(pad), pad(mins.reduce((a, b) => (Math.abs(b - minute) < Math.abs(a - minute) ? b : a), mins[0])))];
    if (twelve) kids.push(part('AM or PM', ['AM', 'PM'], hour >= 12 ? 'PM' : 'AM'));
    return n('div', [tp.root], kids, { role: 'group', 'aria-label': 'Time' });
  },
};

/* ---------- Multi-select ---------- */
const ms = { root: `${p}-multi`, box: `${p}-multi__box`, chips: `${p}-multi__chips`, input: `${p}-multi__input`, list: `${p}-multi__list`, opt: `${p}-multi__option`, on: `${p}-multi__option--active`, check: `${p}-multi__check` };
export const multiSelect: ComponentDef = {
  id: 'multi-select', name: 'Multi-select', description: 'Pick several options; the picks show as removable chips.', tags: ['control', 'form'], status: 'stable',
  usage: 'Type to filter, arrows to move, Enter or click to toggle, Backspace on an empty field removes the last chip, Escape closes.',
  composition: 'Chips are Tags; the list works like a Combobox.',
  props: [
    P.area('options', 'Design\nEngineering\nResearch\nSupport', 'Options one per line.', 'string (one per line)'),
    P.area('value', 'Design', 'Selected options one per line.', 'string (one per line)'),
    P.text('placeholder', 'Add…', 'Placeholder when typing.'),
    P.bool('open', true, 'Initially open.'),
    P.bool('disabled', false, 'Disables the field.'),
  ],
  rules: [
    { cls: ms.root, base: { position: 'relative', width: v('size-500'), 'max-width': '100%' } },
    { cls: ms.box, base: { 'min-height': `calc(${v('type-line-sm')} + ${v('space-8')} * 3)`, display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', gap: v('space-8'), 'box-sizing': 'border-box', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), background: v('color-control') }, hover: { background: v('color-control-strong') } },
    { cls: ms.chips, base: { display: 'contents' } },
    { cls: ms.input, base: { flex: '1', 'min-width': v('size-72'), padding: '0', border: 'none', background: 'transparent', color: v('color-ink'), ...text('sm') }, focus: { outline: 'none' }, placeholder: { color: v('color-placeholder') }, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: ms.list, base: { position: 'absolute', top: '100%', left: '0', right: '0', 'margin-top': v('space-8'), 'z-index': '40', display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'box-sizing': 'border-box', padding: v('space-4'), 'border-radius': v('radius-8'), background: v('color-canvas'), color: v('color-ink'), ...ringDecl }, nested: [hiddenRule] },
    { cls: ms.opt, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12'), 'text-align': 'left', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus,
      nested: [hiddenRule, { sel: '[aria-selected="false"] .' + ms.check, decls: { opacity: '0' } }] },
    { cls: ms.on, base: { background: v('color-control-strong') } },
    { cls: ms.check, base: { display: 'inline-flex' } },
    iconRule,
  ],
  render(pr: Props): Node {
    const options = lines(pr.options), chosen = lines(pr.value).filter((x) => options.includes(x));
    const chip = (label: string): Node => { const t = tag.render({ label, removable: true, variant: 'default' }); const { 'data-p8': _d, ...rest } = t.attrs ?? {}; return { ...t, attrs: { ...rest, 'data-chip': label }, children: t.children?.map((c) => typeof c !== 'string' && c.tag === 'button' ? { ...c, attrs: { ...c.attrs, ...(pr.disabled ? { disabled: true as const } : {}) } } : c) }; };
    const opts = options.map((o, i) => n('button', i === 0 ? [ms.opt, ms.on] : [ms.opt], [o, n('span', [ms.check], [iconNode('check', 14)])], { type: 'button', ...(pr.disabled ? { disabled: true as const } : {}), role: 'option', tabindex: '-1', 'aria-selected': String(chosen.includes(o)) }));
    const inAttrs: Node['attrs'] = { type: 'text', role: 'combobox', 'aria-expanded': String(Boolean(pr.open) && !pr.disabled), 'aria-controls': 'multi-list', 'aria-label': 'Add option', placeholder: pr.placeholder as string };
    if (pr.disabled) inAttrs.disabled = true;
    return n('div', [ms.root], [
      n('div', [ms.box], [n('span', [ms.chips], chosen.map(chip), { 'data-chips': true }), n('input', [ms.input], undefined, inAttrs)]),
      n('div', [ms.list], opts, pr.open && !pr.disabled ? { role: 'listbox', id: 'multi-list', 'aria-multiselectable': 'true' } : { role: 'listbox', id: 'multi-list', 'aria-multiselectable': 'true', hidden: true }),
      n('template', [], [chip('__label__')], { 'data-chip-template': true }),
    ], { 'data-p8': 'multi' });
  },
};

/* ---------- File upload ---------- */
const up = { root: `${p}-upload`, zone: `${p}-upload__zone`, over: `${p}-upload__zone--over`, input: `${p}-upload__input`, hint: `${p}-upload__hint`, list: `${p}-upload__list`, item: `${p}-upload__item`, name: `${p}-upload__name`, size: `${p}-upload__size` };
export const fileUpload: ComponentDef = {
  id: 'file-upload', name: 'File Upload', description: 'A dropzone with a list of the chosen files.', tags: ['control', 'form'], status: 'stable',
  usage: 'Click, press Enter on the focused zone, or drop files. Each chosen file is listed with its size and a remove button. The real <input type="file"> carries the files, so it works inside a normal form.',
  props: [
    P.text('label', 'Drop files here or click to browse', 'Zone text.'),
    P.text('accept', '', 'Accepted types, e.g. image/*,.pdf. Empty for any.'),
    P.bool('multiple', true, 'Allow several files.'),
    P.bool('disabled', false, 'Disables the zone.'),
  ],
  rules: [
    { cls: up.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), width: v('size-500'), 'max-width': '100%', ...text('sm'), color: v('color-ink') } },
    { cls: up.zone, base: { position: 'relative', display: 'flex', 'flex-direction': 'column', 'align-items': 'center', gap: v('space-8'), 'box-sizing': 'border-box', 'padding-block': v('space-24'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), background: v('color-surface'), ...ringDecl, 'text-align': 'center', cursor: 'pointer' }, hover: { background: v('color-control') }, nested: [{ sel: ':focus-within', decls: { 'box-shadow': `0 0 0 ${v('border-focus')} ${v('color-ring-focus')}` } }] },
    { cls: up.over, base: { background: v('color-control-strong') } },
    { cls: up.input, base: { position: 'absolute', inset: '0', width: '100%', height: '100%', opacity: '0', cursor: 'pointer' }, disabled: { cursor: 'not-allowed' } },
    { cls: up.hint, base: { color: v('color-ink-muted') } },
    { cls: up.list, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), margin: '0', padding: '0', 'list-style': 'none' }, nested: [hiddenRule] },
    { cls: up.item, base: { display: 'flex', 'align-items': 'center', gap: v('space-12'), 'padding-block': v('space-4'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), background: v('color-control') } },
    { cls: up.name, base: { flex: '1', 'min-width': '0', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' } },
    { cls: up.size, base: { color: v('color-ink-muted'), 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const attrs: Node['attrs'] = { type: 'file', 'aria-label': pr.label as string };
    if (pr.accept) attrs.accept = pr.accept as string;
    if (pr.multiple) attrs.multiple = true;
    if (pr.disabled) attrs.disabled = true;
    const rm = iconButton.render({ icon: 'close', label: 'Remove file', size: '14', variant: 'ghost-flat', disabled: false });
    const item = n('li', [up.item], [iconNode('file', 16), n('span', [up.name], ['__name__']), n('span', [up.size], ['__size__']), { ...rm, attrs: { ...rm.attrs, 'data-remove': true } }]);
    return n('div', [up.root], [
      n('div', [up.zone], [iconNode('upload', 16), n('span', [], [pr.label as string]), ...(pr.accept ? [n('span', [up.hint], [pr.accept as string])] : []), n('input', [up.input], undefined, attrs)], { 'data-zone': true }),
      n('ul', [up.list], [], { 'data-files': true, 'aria-label': 'Chosen files', 'aria-live': 'polite' }),
      n('template', [], [item], { 'data-file-template': true }),
    ], { 'data-p8': 'upload' });
  },
};

/* ---------- Color swatch picker ---------- */
const sw = { root: `${p}-swatches`, item: `${p}-swatch`, on: `${p}-swatch--on` };
const TOKENS = Object.keys(theme.color.light).filter((k) => !/ring|backdrop|syntax/.test(k));
export const swatchPicker: ComponentDef = {
  id: 'swatch-picker', name: 'Swatch Picker', description: 'Pick one colour from a row of swatches.', tags: ['control', 'form'], status: 'stable',
  usage: 'List theme colour names (ink, canvas, control…) or any #hex, one per line. Arrow keys move the selection like a radio group.',
  props: [
    P.area('colors', 'ink\nink-muted\ncontrol-strong\ncontrol\ncanvas', 'Colours one per line: a theme colour name or a #hex.', 'string (one per line)'),
    P.text('value', 'ink', 'Selected colour (name or hex).'),
  ],
  rules: [
    { cls: sw.root, base: { display: 'inline-flex', gap: v('space-12') } },
    { cls: sw.item, base: { width: v('size-24'), height: v('size-24'), padding: '0', 'box-sizing': 'border-box', 'border-radius': v('radius-full'), border: 'none', background: v('color-control'), cursor: 'pointer', ...ringDecl }, focus: { 'box-shadow': `0 0 0 ${v('border-focus')} ${v('color-ring-focus')}` }, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: sw.on, base: { outline: `${v('border-focus')} solid ${v('color-ink')}`, 'outline-offset': v('space-2') } },
    ...TOKENS.map((t): Rule => ({ cls: `${sw.item}--${t}`, base: { background: v(`color-${t}`) } })),
  ],
  render(pr: Props): Node {
    const colors = lines(pr.colors).filter((c) => TOKENS.includes(c) || /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(c));
    const selected = colors.includes(String(pr.value)) ? pr.value : colors[0];
    const items = colors.map((c) => {
      const hex = /^#[0-9a-fA-F]{3,8}$/.test(c);
      const known = TOKENS.includes(c);
      if (!hex && !known) return null;
      const on = c === selected;
      const attrs: Node['attrs'] = { type: 'button', role: 'radio', 'aria-checked': String(on), 'aria-label': c, tabindex: on ? '0' : '-1' };
      if (hex) attrs.style = `background: ${c}`;
      return n('button', [sw.item, ...(known ? [`${sw.item}--${c}`] : []), ...(on ? [sw.on] : [])], [], attrs);
    }).filter((x): x is Node => x !== null);
    return n('div', [sw.root], items, { role: 'radiogroup', 'aria-label': 'Colour', 'data-p8': 'group' });
  },
};
