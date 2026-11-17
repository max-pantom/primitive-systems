import { v } from '../tokens/theme';
import { c as bc, iconNode, iconRule } from './button';
import { avatar } from './display';
import { disclosure } from './display';
import { iconButton } from './bits';
import { P, controlBase, fieldFocus, focus, lines, n, noRing, p, ringDecl, text } from './shared';
import { hiddenRule } from './shared';
import type { ComponentDef, Node, Props } from './types';

/* ---------- Combobox ---------- */
const cb = { root: `${p}-combobox`, input: `${p}-combobox__input`, list: `${p}-combobox__list`, opt: `${p}-combobox__option`, on: `${p}-combobox__option--active`, icon: `${p}-combobox__icon` };
export const combobox: ComponentDef = {
  id: 'combobox', name: 'Combobox', description: 'A searchable select: type to filter, arrows to move, Enter to choose.', tags: ['control', 'form'], status: 'stable',
  usage: 'Focus or click opens the list; typing filters; ArrowUp/Down move; Enter picks; Escape or an outside click closes.',
  props: [
    P.text('placeholder', 'Search…', 'Placeholder.'),
    P.area('options', 'Apple\nBanana\nCherry\nDate', 'Options one per line.', 'string (one per line)'),
    P.text('value', '', 'Initial value.'),
    P.bool('open', true, 'Initially open.'),
    P.bool('disabled', false, 'Disables the field.'),
  ],
  rules: [
    { cls: cb.root, base: { position: 'relative', width: v('size-500'), 'max-width': '100%' } },
    { cls: cb.input, base: { ...controlBase, width: '100%', 'padding-inline-end': v('space-32') }, hover: { background: v('color-control-strong') }, focus: fieldFocus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' }, placeholder: { color: v('color-placeholder') } },
    { cls: cb.icon, base: { position: 'absolute', top: '50%', translate: '0 -50%', 'inset-inline-end': v('space-12'), 'pointer-events': 'none', color: v('color-ink-muted') } },
    { cls: cb.list, base: { position: 'absolute', top: '100%', left: '0', right: '0', 'margin-top': v('space-8'), 'z-index': '40', display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'box-sizing': 'border-box', padding: v('space-4'), 'border-radius': v('radius-8'), background: v('color-canvas'), color: v('color-ink'), ...ringDecl, 'max-height': v('size-240'), 'overflow-y': 'auto' }, nested: [hiddenRule] },
    { cls: cb.opt, base: { 'text-align': 'left', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus },
    { cls: cb.on, base: { background: v('color-control-strong') } },
    { cls: `${cb.opt}-none`, base: { 'padding-block': v('space-8'), 'padding-inline': v('space-12'), color: v('color-ink-muted'), ...text('sm') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const opts = lines(pr.options).map((o, i) => n('button', i === 0 ? [cb.opt, cb.on] : [cb.opt], [o], { type: 'button', role: 'option', tabindex: '-1' }));
    const attrs: Node['attrs'] = { type: 'text', role: 'combobox', 'aria-expanded': String(pr.open), 'aria-autocomplete': 'list', placeholder: pr.placeholder as string, 'aria-label': (pr.placeholder as string) || 'Search' };
    if (pr.value) attrs.value = pr.value as string;
    if (pr.disabled) attrs.disabled = true;
    return n('div', [cb.root], [
      n('input', [cb.input], undefined, attrs),
      { ...iconNode('chevron-down', 16), cls: [bc.icon, cb.icon] },
      n('div', [cb.list], opts, pr.open ? { role: 'listbox' } : { role: 'listbox', hidden: true }),
    ], { 'data-p8': 'combobox' });
  },
};

/* ---------- Number input ---------- */
const nu = { root: `${p}-number`, input: `${p}-number__input` };
export const numberInput: ComponentDef = {
  id: 'number-input', name: 'Number Input', description: 'A number field with minus and plus buttons.', tags: ['control', 'form'], status: 'stable',
  usage: 'The buttons call the native stepUp/stepDown, so min, max and step are respected. Typing and arrow keys still work.',
  composition: 'Contains two Icon Buttons.',
  props: [
    P.text('value', '1', 'Initial value.'), P.text('min', '0', 'Minimum.'), P.text('max', '10', 'Maximum.'), P.text('step', '1', 'Step.'),
    P.text('label', 'Quantity', 'Accessible label.'), P.bool('disabled', false, 'Disables the control.'),
  ],
  rules: [
    { cls: nu.root, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-4'), 'box-sizing': 'border-box', padding: v('space-4'), 'border-radius': v('radius-8'), background: v('color-control') } },
    { cls: nu.input, base: { 'box-sizing': 'border-box', width: v('size-48'), 'padding-block': v('space-8'), 'padding-inline': v('space-12'), border: 'none', background: 'transparent', color: v('color-ink'), 'text-align': 'center', appearance: 'textfield', ...text('sm') }, focus: { background: v('color-control-strong'), outline: 'none' }, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' },
      nested: [{ sel: '::-webkit-inner-spin-button', decls: { appearance: 'none', margin: '0' } }, { sel: '::-webkit-outer-spin-button', decls: { appearance: 'none', margin: '0' } }] },
  ],
  render(pr: Props): Node {
    const step = (icon: 'minus' | 'plus', s: string, label: string): Node => {
      const b = iconButton.render({ icon, label, size: '14', variant: 'ghost-flat', disabled: Boolean(pr.disabled) });
      return { ...b, attrs: { ...b.attrs, 'data-step': s } };
    };
    const attrs: Node['attrs'] = { type: 'number', value: pr.value as string, min: pr.min as string, max: pr.max as string, step: pr.step as string, 'aria-label': pr.label as string };
    if (pr.disabled) attrs.disabled = true;
    return n('div', [nu.root], [step('minus', '-1', 'Decrease'), n('input', [nu.input], undefined, attrs), step('plus', '1', 'Increase')], { role: 'group', 'data-p8': 'number', 'aria-label': pr.label as string });
  },
};

/* ---------- OTP input ---------- */
const ot = { root: `${p}-otp`, cell: `${p}-otp__cell` };
export const otpInput: ComponentDef = {
  id: 'otp-input', name: 'OTP Input', description: 'One box per digit for one-time codes.', tags: ['control', 'form'], status: 'stable',
  usage: 'Typing advances, Backspace goes back, arrows move, and pasting a code fills every box. autocomplete="one-time-code" lets phones suggest the code.',
  props: [P.select('length', ['4', '6', '8'], '6', 'Number of digits.'), P.text('value', '', 'Initial digits.'), P.bool('disabled', false, 'Disables all boxes.')],
  rules: [
    { cls: ot.root, base: { display: 'inline-flex', gap: v('space-8') } },
    { cls: ot.cell, base: { ...controlBase, 'padding-block': v('space-12'), width: v('size-40'), 'text-align': 'center', 'font-family': v('type-mono'), 'letter-spacing': 'normal' }, hover: { background: v('color-control-strong') }, focus: fieldFocus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
  ],
  render(pr: Props): Node {
    const val = String(pr.value);
    const cells = Array.from({ length: Number(pr.length) }, (_, i) => {
      const attrs: Node['attrs'] = { type: 'text', inputmode: 'numeric', maxlength: '1', autocomplete: i === 0 ? 'one-time-code' : 'off', 'aria-label': `Digit ${i + 1}` };
      if (val[i]) attrs.value = val[i];
      if (pr.disabled) attrs.disabled = true;
      return n('input', [ot.cell], undefined, attrs);
    });
    return n('div', [ot.root], cells, { role: 'group', 'aria-label': 'One-time code', 'data-p8': 'otp' });
  },
};

/* ---------- Stepper ---------- */
const sp = { root: `${p}-stepper`, step: `${p}-stepper__step`, dot: `${p}-stepper__dot`, done: `${p}-stepper__dot--done`, now: `${p}-stepper__dot--now`, line: `${p}-stepper__line` };
export const stepper: ComponentDef = {
  id: 'stepper', name: 'Stepper', description: 'Numbered steps for onboarding or checkout.', tags: ['navigation', 'progress'], status: 'stable',
  usage: 'Finished steps show a check, the current step is filled, upcoming steps are muted. The current step carries aria-current="step".',
  props: [P.area('steps', 'Account\nPlan\nConfirm', 'Step labels one per line.', 'string (one per line)'), P.text('current', '2', 'Current step number (1-based).')],
  rules: [
    { cls: sp.root, base: { display: 'flex', 'align-items': 'center', gap: v('space-12'), margin: '0', padding: '0', 'list-style': 'none', ...text('sm'), color: v('color-ink') } },
    { cls: sp.step, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-8') } },
    { cls: sp.dot, base: { display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', width: v('size-24'), height: v('size-24'), 'border-radius': v('radius-full'), background: v('color-control-strong'), color: v('color-ink-muted'), 'flex-shrink': '0' } },
    { cls: sp.done, base: { background: v('color-ink'), color: v('color-ink-inverse') } },
    { cls: sp.now, base: { background: v('color-ink'), color: v('color-ink-inverse') } },
    { cls: sp.line, base: { flex: '1', 'min-width': v('size-24'), height: '0', 'border-top': `${v('border-hairline')} solid ${v('color-ring')}` } },
    iconRule,
  ],
  render(pr: Props): Node {
    const labels = lines(pr.steps);
    const cur = Math.min(labels.length, Math.max(1, Number(pr.current) || 1));
    const kids: Node[] = [];
    labels.forEach((l, i) => {
      const num = i + 1;
      const dotCls = num < cur ? [sp.dot, sp.done] : num === cur ? [sp.dot, sp.now] : [sp.dot];
      kids.push(n('li', [sp.step], [n('span', dotCls, [num < cur ? iconNode('check', 14) : String(num)]), l], num === cur ? { 'aria-current': 'step' } : undefined));
      if (i < labels.length - 1) kids.push(n('li', [sp.line], [], { 'aria-hidden': 'true' }));
    });
    return n('ol', [sp.root], kids);
  },
};

/* ---------- Rating ---------- */
const ra = { root: `${p}-rating`, star: `${p}-rating__star`, on: `${p}-rating__star--on` };
export const rating: ComponentDef = {
  id: 'rating', name: 'Rating', description: 'Star rating you can click or arrow through.', tags: ['control', 'feedback'], status: 'stable',
  usage: 'Click a star or use arrow keys. Stars up to the chosen value fill in.',
  props: [P.select('max', ['3', '5', '7'], '5', 'Number of stars.'), P.text('value', '3', 'Initial rating.'), P.bool('disabled', false, 'Disables rating.')],
  rules: [
    { cls: ra.root, base: { display: 'inline-flex', gap: v('space-4') } },
    { cls: ra.star, base: { display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', width: v('size-24'), height: v('size-24'), padding: '0', border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink-muted'), cursor: 'pointer' }, hover: { color: v('color-ink') }, focus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: ra.on, base: { color: v('color-ink') }, nested: [{ sel: ' svg', decls: { fill: 'currentColor' } }] },
    iconRule,
  ],
  render(pr: Props): Node {
    const max = Number(pr.max);
    const val = Math.min(max, Math.max(0, Number(pr.value) || 0));
    const stars = Array.from({ length: max }, (_, i) => {
      const attrs: Node['attrs'] = { type: 'button', role: 'radio', 'aria-checked': String(i + 1 === val), 'aria-label': `${i + 1} of ${max}`, tabindex: i + 1 === val || (val === 0 && i === 0) ? '0' : '-1' };
      if (pr.disabled) attrs.disabled = true;
      return n('button', i + 1 <= val ? [ra.star, ra.on] : [ra.star], [iconNode('star', 16)], attrs);
    });
    return n('div', [ra.root], stars, { role: 'radiogroup', 'aria-label': 'Rating', 'data-p8': 'rating' });
  },
};

/* ---------- Accordion ---------- */
const ac = { root: `${p}-accordion` };
export const accordion: ComponentDef = {
  id: 'accordion', name: 'Accordion', description: 'A group of Disclosures where only one is open at a time.', tags: ['layout', 'content'], status: 'stable',
  usage: 'Each item is a <details name="…">, so the browser closes the others for you. Write items as "Title | Content".',
  composition: 'Each item is a Disclosure; the group stacks them with a 12px gap.',
  props: [P.area('items', 'First | Content one.\nSecond | Content two.\nThird | Content three.', 'Items one per line: "Title | Content".', 'string (one per line)'), P.text('open', 'First', 'Title of the item open initially. Empty for none.')],
  rules: [{ cls: ac.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12') } }],
  render(pr: Props): Node {
    const items = lines(pr.items).map((l) => {
      const [title, ...rest] = l.split('|');
      const d = disclosure.render({ summary: title.trim(), content: rest.join('|').trim(), open: title.trim() === pr.open });
      return { ...d, attrs: { ...d.attrs, name: 'accordion' } };
    });
    return n('div', [ac.root], items);
  },
};

/* ---------- Stat card ---------- */
const st = { root: `${p}-stat`, label: `${p}-stat__label`, value: `${p}-stat__value`, change: `${p}-stat__change` };
export const statCard: ComponentDef = {
  id: 'stat-card', name: 'Stat Card', description: 'A number with its label and change.', tags: ['data', 'surface'], status: 'stable',
  usage: 'Use for headline metrics. Direction is shown by the arrow, never by color alone.',
  props: [P.text('label', 'Label', 'Metric name.'), P.text('value', '0', 'Metric value.'), P.text('change', '0%', 'Change text. Empty to omit.'), P.select('trend', ['up', 'down', 'flat'], 'up', 'Direction of the change.')],
  rules: [
    { cls: st.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'box-sizing': 'border-box', 'min-width': v('size-240'), 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-surface'), color: v('color-ink'), ...ringDecl, ...text('sm') } },
    { cls: st.label, base: { color: v('color-ink-muted') } },
    { cls: st.value, base: { ...text('md'), 'font-weight': v('type-weight-strong') } },
    { cls: st.change, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-4'), color: v('color-ink-muted') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const kids: Node[] = [n('span', [st.label], [pr.label as string]), n('span', [st.value], [pr.value as string])];
    if (pr.change) kids.push(n('span', [st.change], [...(pr.trend === 'flat' ? [] : [iconNode(pr.trend === 'down' ? 'chevron-down' : 'chevron-up', 14)]), pr.change as string]));
    return n('div', [st.root], kids);
  },
};

/* ---------- Avatar group ---------- */
const ag = { root: `${p}-avatars`, item: `${p}-avatars__item` };
export const avatarGroup: ComponentDef = {
  id: 'avatar-group', name: 'Avatar Group', description: 'Overlapping avatars with a +N count.', tags: ['content', 'identity'], status: 'stable',
  usage: 'Shows up to max avatars and a +N chip for the rest.',
  composition: 'Contains Avatars.',
  props: [P.area('names', 'Ada Lovelace\nAlan Turing\nGrace Hopper\nLinus Torvalds\nMargaret Hamilton', 'Names one per line.', 'string (one per line)'), P.select('max', ['2', '3', '4', '5'], '3', 'Avatars shown before +N.'), P.select('size', ['24', '32', '40'], '32', 'Diameter in px.')],
  rules: [
    { cls: ag.root, base: { display: 'inline-flex', 'align-items': 'center' } },
    { cls: ag.item, base: { 'margin-inline-start': `calc(-1 * ${v('space-8')})`, outline: `${v('border-focus')} solid ${v('color-canvas')}` } },
  ],
  render(pr: Props): Node {
    const names = lines(pr.names);
    const max = Math.min(Number(pr.max), names.length);
    const shown = names.slice(0, max).map((name, i) => { const a = avatar.render({ name, src: '', size: pr.size }); return i ? { ...a, cls: [...(a.cls ?? []), ag.item] } : a; });
    const extra = names.length - max;
    if (extra > 0) { const a = avatar.render({ name: `+${extra}`, src: '', size: pr.size }); shown.push({ ...a, cls: [...(a.cls ?? []), ag.item], children: [`+${extra}`], attrs: { role: 'img', 'aria-label': `${extra} more` } }); }
    return n('div', [ag.root], shown, { role: 'group', 'aria-label': 'Members' });
  },
};

/* ---------- Progress ring ---------- */
const pr_ = { root: `${p}-progress-ring`, track: `${p}-progress-ring__track`, bar: `${p}-progress-ring__bar`, label: `${p}-progress-ring__label` };
export const progressRing: ComponentDef = {
  id: 'progress-ring', name: 'Progress Ring', description: 'A circular percentage.', tags: ['feedback', 'data'], status: 'stable',
  usage: 'Use for compact progress. The label shows only at 40px and 48px.',
  props: [P.text('value', '65', 'Percent 0–100.'), P.select('size', ['24', '32', '40', '48'], '40', 'Diameter in px.'), P.bool('label', true, 'Show the percent in the middle (40/48 only).')],
  rules: [
    { cls: pr_.root, base: { position: 'relative', display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', color: v('color-ink') } },
    { cls: pr_.track, base: { stroke: v('color-control-strong') } },
    { cls: pr_.bar, base: { stroke: v('color-ink'), 'stroke-linecap': 'round' } },
    { cls: pr_.label, base: { position: 'absolute', ...text('sm'), 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
  ],
  render(pr: Props): Node {
    const pct = Math.min(100, Math.max(0, Number(pr.value) || 0));
    const C = 2 * Math.PI * 9;
    const size = String(pr.size);
    const svg = n('svg', [], [
      n('circle', [pr_.track], undefined, { cx: '12', cy: '12', r: '9' }),
      n('circle', [pr_.bar], undefined, { cx: '12', cy: '12', r: '9', 'stroke-dasharray': `${((pct / 100) * C).toFixed(2)} ${C.toFixed(2)}`, transform: 'rotate(-90 12 12)' }),
    ], { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'stroke-width': '3', 'aria-hidden': 'true' });
    const kids: Node[] = [svg];
    if (pr.label && Number(size) >= 40) kids.push(n('span', [pr_.label], [`${Math.round(pct)}`]));
    return n('div', [pr_.root], kids, { role: 'progressbar', 'aria-valuenow': String(Math.round(pct)), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': 'Progress' });
  },
};

/* ---------- Banner ---------- */
const bn = { root: `${p}-banner`, inv: `${p}-banner--inverted`, text: `${p}-banner__text`, action: `${p}-banner__action`, close: `${p}-banner__close` };
export const banner: ComponentDef = {
  id: 'banner', name: 'Banner', description: 'A full-width announcement bar for the top of a page.', tags: ['feedback', 'layout'], status: 'stable',
  usage: 'One banner per page, above everything else. Keep the message to a sentence.',
  props: [P.text('message', 'A short announcement.', 'Message.'), P.text('action', '', 'Optional link label. Empty to omit.'), P.select('tone', ['inverted', 'default'], 'inverted', 'Inverted ink or surface.'), P.bool('dismissible', true, 'Show a close button.')],
  rules: [
    { cls: bn.root, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'center', gap: v('space-12'), 'box-sizing': 'border-box', width: '100%', 'padding-block': v('space-12'), 'padding-inline': v('space-16'), background: v('color-surface'), color: v('color-ink'), 'border-radius': v('radius-8'), ...ringDecl, ...text('sm') } },
    { cls: bn.inv, base: { background: v('color-ink'), color: v('color-ink-inverse'), ...noRing } },
    { cls: bn.action, base: { color: 'inherit', 'font-weight': v('type-weight-strong'), 'text-decoration': 'underline' }, focus },
    { cls: bn.close, base: { display: 'inline-flex', padding: '0', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', 'margin-inline-start': 'auto' }, focus },
    iconRule,
  ],
  render(pr: Props): Node {
    const kids: Node[] = [n('span', [bn.text], [pr.message as string])];
    if (pr.action) kids.push(n('a', [bn.action], [pr.action as string], { href: '#' }));
    if (pr.dismissible) kids.push(n('button', [bn.close], [iconNode('close', 16)], { type: 'button', 'aria-label': 'Dismiss', 'data-close': true }));
    return n('div', pr.tone === 'inverted' ? [bn.root, bn.inv] : [bn.root], kids, { role: 'region', 'aria-label': 'Announcement', 'data-p8': 'dismiss' });
  },
};
