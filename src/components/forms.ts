import { v } from '../tokens/theme';
import { c as bc, iconNode, iconRule } from './button';
import { controlBase, focus, lines, motion, n, p, ring, text } from './shared';
import type { ComponentDef, Node, Props, Rule } from './types';

/* ---------- Divider ---------- */
const dv = { root: `${p}-divider`, v: `${p}-divider--vertical`, m12: `${p}-divider--m12`, m16: `${p}-divider--m16`, row: `${p}-divider-row`, line: `${p}-divider__line` };
export const divider: ComponentDef = {
  id: 'divider', name: 'Divider', description: 'A hairline that separates content, optionally with a label.', tags: ['layout', 'separator'], status: 'stable',
  usage: 'Use horizontal dividers between stacked sections and vertical ones between side-by-side regions. Add a label for "or"-style breaks.',
  props: [
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal', description: 'Direction of the line.', control: { kind: 'select', options: ['horizontal', 'vertical'] } },
    { name: 'label', type: 'string', default: 'or', description: 'Text between two lines (horizontal only). Empty for a plain line.', control: { kind: 'text' } },
    { name: 'spacing', type: "'none' | '12' | '16'", default: 'none', description: 'Margin around the line, in px.', control: { kind: 'select', options: ['none', '12', '16'] } },
  ],
  rules: [
    { cls: dv.root, base: { 'flex-shrink': '0', width: v('size-400'), 'max-width': '100%', height: v('border-hairline'), background: v('color-ring') } },
    { cls: dv.v, base: { width: v('border-hairline'), height: v('size-48') } },
    { cls: dv.m12, base: { margin: v('space-12') } },
    { cls: dv.m16, base: { margin: v('space-16') } },
    { cls: dv.row, base: { display: 'flex', 'align-items': 'center', gap: v('space-12'), width: v('size-400'), 'max-width': '100%', color: v('color-ink-muted'), ...text('sm') } },
    { cls: dv.line, base: { flex: '1', height: v('border-hairline'), background: v('color-ring') } },
  ],
  render(pr: Props): Node {
    const spacing = pr.spacing === '12' ? [dv.m12] : pr.spacing === '16' ? [dv.m16] : [];
    if (pr.label && pr.orientation === 'horizontal')
      return n('div', [dv.row, ...spacing], [n('div', [dv.line], []), n('span', [], [pr.label as string]), n('div', [dv.line], [])], { role: 'separator', 'aria-orientation': 'horizontal' });
    return n('div', pr.orientation === 'vertical' ? [dv.root, dv.v, ...spacing] : [dv.root, ...spacing], [], { role: 'separator', 'aria-orientation': pr.orientation as string });
  },
};

/* ---------- Field wrapper shared by input / textarea / select ---------- */
const f = { root: `${p}-field`, label: `${p}-field__label` };
const fieldRules: Rule[] = [
  { cls: f.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'font-family': v('type-family'), width: v('size-500'), 'max-width': '100%' } },
  { cls: f.label, base: { ...text('sm'), 'font-weight': v('type-weight-strong'), color: v('color-ink') } },
];
const labelled = (pr: Props, id: string, control: Node): Node => {
  const kids: Node[] = [];
  if (pr.label) kids.push(n('label', [f.label], [pr.label as string], { for: id }));
  kids.push(control);
  return n('div', [f.root], kids);
};

/* ---------- Text input ---------- */
const i = { root: `${p}-input`, lg: `${p}-input--lg` };
const inputRules: Rule[] = [
  { cls: i.root, base: { ...controlBase, width: '100%' }, hover: { background: v('color-control-strong') }, focus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' }, placeholder: { color: v('color-placeholder') } },
  { cls: i.lg, base: { 'padding-block': v('space-12'), 'font-size': v('type-size-md'), 'line-height': v('type-line-md') } },
];
export const input: ComponentDef = {
  id: 'text-input', name: 'Text Input', description: 'Single-line text field. 12px side padding, control fill from the seeds.', tags: ['control', 'form'], status: 'stable',
  usage: 'Pair with a label. Hover darkens the fill to control-strong; placeholder uses the seed placeholder color.',
  props: [
    { name: 'label', type: 'string', default: '', description: 'Optional label. Empty to omit.', control: { kind: 'text' } },
    { name: 'placeholder', type: 'string', default: 'Placeholder', description: 'Placeholder text.', control: { kind: 'text' } },
    { name: 'value', type: 'string', default: '', description: 'Initial value.', control: { kind: 'text' } },
    { name: 'type', type: "'text' | 'email' | 'password' | 'search'", default: 'text', description: 'Input type.', control: { kind: 'select', options: ['text', 'email', 'password', 'search'] } },
    { name: 'size', type: "'md' | 'lg'", default: 'md', description: 'md is 14/18, lg is 16/20 type.', control: { kind: 'select', options: ['md', 'lg'] } },
    { name: 'disabled', type: 'boolean', default: false, description: 'Disables the field.', control: { kind: 'boolean' } },
  ],
  composition: 'Wraps a label and the input in a field with a 4px gap.',
  rules: [...fieldRules, ...inputRules],
  render(pr: Props): Node {
    const attrs: Node['attrs'] = { id: 'field', type: pr.type as string, placeholder: pr.placeholder as string };
    if (pr.value) attrs.value = pr.value as string;
    if (pr.disabled) attrs.disabled = true;
    return labelled(pr, 'field', n('input', pr.size === 'lg' ? [i.root, i.lg] : [i.root], undefined, attrs));
  },
};

/* ---------- Textarea ---------- */
const t = { root: `${p}-textarea` };
export const textarea: ComponentDef = {
  id: 'textarea', name: 'Textarea', description: 'Multi-line text field, same surface as the text input.', tags: ['control', 'form'], status: 'stable',
  usage: 'Use for free-form text. Resize is vertical only.',
  props: [
    { name: 'label', type: 'string', default: '', description: 'Optional label.', control: { kind: 'text' } },
    { name: 'placeholder', type: 'string', default: 'Placeholder', description: 'Placeholder text.', control: { kind: 'text' } },
    { name: 'value', type: 'string', default: '', description: 'Initial value.', control: { kind: 'textarea' } },
    { name: 'rows', type: "'3' | '4' | '6'", default: '4', description: 'Visible rows.', control: { kind: 'select', options: ['3', '4', '6'] } },
    { name: 'disabled', type: 'boolean', default: false, description: 'Disables the field.', control: { kind: 'boolean' } },
  ],
  rules: [...fieldRules, { cls: t.root, base: { ...inputRules[0].base, resize: 'vertical' }, hover: inputRules[0].hover, focus, disabled: inputRules[0].disabled, placeholder: inputRules[0].placeholder }],
  render(pr: Props): Node {
    const attrs: Node['attrs'] = { id: 'field', rows: pr.rows as string, placeholder: pr.placeholder as string };
    if (pr.disabled) attrs.disabled = true;
    return labelled(pr, 'field', n('textarea', [t.root], pr.value ? [pr.value as string] : [], attrs));
  },
};

/* ---------- Select ---------- */
const s = { wrap: `${p}-select`, root: `${p}-select__control`, icon: `${p}-select__icon`, iconOff: `${p}-select__icon--disabled` };
export const select: ComponentDef = {
  id: 'select', name: 'Select', description: 'Native select styled as a control.', tags: ['control', 'form'], status: 'stable',
  usage: 'Native <select> so keyboard, mobile pickers and accessibility work out of the box.',
  props: [
    { name: 'label', type: 'string', default: '', description: 'Optional label.', control: { kind: 'text' } },
    { name: 'options', type: 'string (one per line)', default: 'One\nTwo\nThree', description: 'Option labels, one per line.', control: { kind: 'textarea' } },
    { name: 'value', type: 'string', default: 'One', description: 'Selected option label.', control: { kind: 'text' } },
    { name: 'disabled', type: 'boolean', default: false, description: 'Disables the select.', control: { kind: 'boolean' } },
  ],
  rules: [
    ...fieldRules,
    { cls: s.wrap, base: { position: 'relative', display: 'flex', 'align-items': 'center' } },
    { cls: s.root, base: { ...controlBase, width: '100%', appearance: 'none', 'padding-inline-end': v('space-32'), cursor: 'pointer' }, hover: { background: v('color-control-strong') }, focus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: s.icon, base: { position: 'absolute', 'inset-inline-end': v('space-12'), 'pointer-events': 'none', color: v('color-ink') } },
    { cls: s.iconOff, base: { opacity: v('opacity-disabled') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const opts = lines(pr.options).map((o) => n('option', [], [o], o === pr.value ? { selected: true } : undefined));
    const attrs: Node['attrs'] = { id: 'field' };
    if (pr.disabled) attrs.disabled = true;
    const ctl = n('div', [s.wrap], [n('select', [s.root], opts, attrs), { ...iconNode('chevron-down', 16), cls: pr.disabled ? [bc.icon, s.icon, s.iconOff] : [bc.icon, s.icon] }]);
    return labelled(pr, 'field', ctl);
  },
};

/* ---------- Checkbox ---------- */
const k = { row: `${p}-check`, box: `${p}-check__box`, on: `${p}-check__box--on` };
const rowBase = { display: 'inline-flex', 'align-items': 'center', gap: v('space-8'), ...text('sm'), color: v('color-ink'), cursor: 'pointer' };
export const checkbox: ComponentDef = {
  id: 'checkbox', content: 'label', name: 'Checkbox', description: 'Two-state choice with a label.', tags: ['control', 'form'], status: 'stable',
  usage: 'Rendered as role="checkbox" with aria-checked; toggle aria-checked and the --on class in your handler.',
  props: [
    { name: 'label', type: 'string', default: 'Label', description: 'Text next to the box.', control: { kind: 'text' } },
    { name: 'checked', type: 'boolean', default: true, description: 'Checked state.', control: { kind: 'boolean' } },
    { name: 'disabled', type: 'boolean', default: false, description: 'Disables the checkbox.', control: { kind: 'boolean' } },
  ],
  rules: [
    { cls: k.row, base: rowBase },
    { cls: k.box, base: { display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'flex-shrink': '0', width: v('size-16'), height: v('size-16'), padding: '0', 'box-sizing': 'border-box', 'border-radius': v('radius-8'), border: 'none', background: v('color-control'), color: v('color-ink-inverse'), 'box-shadow': ring, cursor: 'inherit' }, hover: { background: v('color-control-strong') }, focus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: k.on, base: { background: v('color-ink') }, hover: { background: v('color-ink'), opacity: v('opacity-hover') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const attrs: Node['attrs'] = { type: 'button', role: 'checkbox', 'aria-checked': String(pr.checked) };
    if (pr.disabled) attrs.disabled = true;
    const box = n('button', pr.checked ? [k.box, k.on] : [k.box], pr.checked ? [{ ...iconNode('check', 14) }] : [], attrs);
    return n('label', [k.row], [box, pr.label as string]);
  },
};

/* ---------- Switch ---------- */
const w = { row: `${p}-switch-row`, root: `${p}-switch`, on: `${p}-switch--on`, thumb: `${p}-switch__thumb`, thumbOn: `${p}-switch__thumb--on` };
const edge = (thumb: string) => `calc(100% - ${v(thumb)} - ${v('space-2')})`;
export const switchC: ComponentDef = {
  id: 'switch', content: 'label', name: 'Switch', description: 'On/off toggle. The thumb stretches while pressed.', tags: ['control', 'form'], status: 'stable',
  usage: 'role="switch" with aria-checked. Toggle aria-checked and the --on classes in your handler. Press and hold to see the stretch.',
  props: [
    { name: 'label', type: 'string', default: 'Label', description: 'Text next to the switch.', control: { kind: 'text' } },
    { name: 'checked', type: 'boolean', default: true, description: 'On/off.', control: { kind: 'boolean' } },
    { name: 'disabled', type: 'boolean', default: false, description: 'Disables the switch.', control: { kind: 'boolean' } },
  ],
  rules: [
    { cls: w.row, base: rowBase },
    { cls: w.root, base: { position: 'relative', display: 'inline-block', 'flex-shrink': '0', width: v('size-40'), height: v('size-24'), padding: '0', 'box-sizing': 'border-box', 'border-radius': v('radius-full'), border: 'none', background: v('color-control-strong'), cursor: 'inherit', transition: `background ${motion}` }, focus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: w.on, base: { background: v('color-ink') } },
    { cls: w.thumb, base: { position: 'absolute', top: v('space-2'), left: v('space-2'), width: v('size-20'), height: v('size-20'), 'border-radius': v('radius-full'), background: v('color-canvas'), 'box-shadow': ring, transition: `left ${motion}, width ${motion}` }, parent: { cls: w.root, active: { width: v('size-28') } } },
    { cls: w.thumbOn, base: { left: edge('size-20') }, parent: { cls: w.root, active: { width: v('size-28'), left: edge('size-28') } } },
  ],
  render(pr: Props): Node {
    const attrs: Node['attrs'] = { type: 'button', role: 'switch', 'aria-checked': String(pr.checked) };
    if (pr.disabled) attrs.disabled = true;
    const sw = n('button', pr.checked ? [w.root, w.on] : [w.root], [n('span', pr.checked ? [w.thumb, w.thumbOn] : [w.thumb], [])], attrs);
    return n('label', [w.row], [sw, pr.label as string]);
  },
};
