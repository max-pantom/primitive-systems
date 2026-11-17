import { v } from '../tokens/theme';
import { c as bc, iconNode, iconRule } from './button';
import { f, i } from './forms';
import { P, controlBase, fieldFocus, focus, lines, motion, n, p, ringDecl, text } from './shared';
import type { ComponentDef, Node, Props } from './types';

/* ---------- Radio group ---------- */
const r = { root: `${p}-radiogroup`, row: `${p}-radiogroup--row`, item: `${p}-radio`, on: `${p}-radio--on`, dot: `${p}-radio__dot`, dotOn: `${p}-radio__dot--on` };
export const radioGroup: ComponentDef = {
  id: 'radio-group', name: 'Radio Group', description: 'Pick exactly one option from a short list.', tags: ['control', 'form'], status: 'stable',
  usage: 'Click or use the arrow keys, Home and End to move the selection (roving tabindex).',
  props: [
    P.area('options', 'One\nTwo\nThree', 'Option labels, one per line.', 'string (one per line)'),
    P.text('value', 'One', 'Selected option label.'),
    P.select('direction', ['column', 'row'], 'column', 'Stack options vertically or in a row.'),
    P.bool('disabled', false, 'Disables every option.'),
  ],
  rules: [
    { cls: r.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-8') } },
    { cls: r.row, base: { 'flex-direction': 'row', gap: v('space-12') } },
    { cls: r.item, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-8'), padding: '0', border: 'none', background: 'transparent', color: v('color-ink'), cursor: 'pointer', ...text('sm') }, focus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: r.dot, base: { 'box-sizing': 'border-box', width: v('size-16'), height: v('size-16'), 'flex-shrink': '0', 'border-radius': v('radius-full'), background: v('color-control'), ...ringDecl, transition: `background ${motion}, border-width ${motion}` } },
    { cls: r.dotOn, base: { background: v('color-canvas'), border: `${v('space-4')} solid ${v('color-ink')}` } },
  ],
  render(pr: Props): Node {
    const items = lines(pr.options).map((o) => {
      const on = o === pr.value;
      const attrs: Node['attrs'] = { type: 'button', role: 'radio', 'aria-checked': String(on), tabindex: on ? '0' : '-1' };
      if (pr.disabled) attrs.disabled = true;
      return n('button', on ? [r.item, r.on] : [r.item], [n('span', on ? [r.dot, r.dotOn] : [r.dot], []), o], attrs);
    });
    return n('div', pr.direction === 'row' ? [r.root, r.row] : [r.root], items, { role: 'radiogroup', 'data-p8': 'group' });
  },
};

/* ---------- Field ---------- */
export const fl = { hint: `${p}-field__hint`, err: `${p}-field__error`, bad: `${p}-input--invalid` };
export const field: ComponentDef = {
  id: 'field', name: 'Field', description: 'Label, input, hint and error message in one wrapper.', tags: ['form', 'composition'], status: 'stable',
  usage: 'Wraps any input. An error replaces the hint, is linked with aria-describedby and outlines the input in ink.',
  composition: 'Contains a Text Input. Label, input and message stack with a 4px gap.',
  props: [
    P.text('label', 'Label', 'Label text.'),
    P.text('placeholder', 'Placeholder', 'Input placeholder.'),
    P.text('hint', 'Helper text.', 'Hint under the input. Empty to omit.'),
    P.text('error', '', 'Error message. When set, replaces the hint and marks the field invalid.'),
    P.bool('disabled', false, 'Disables the input.'),
  ],
  rules: [
    { cls: fl.hint, base: { ...text('sm'), color: v('color-ink-muted') } },
    { cls: fl.err, base: { ...text('sm'), 'font-weight': v('type-weight-strong'), color: v('color-ink') } },
    { cls: fl.bad, base: { ...ringDecl, outline: `${v('border-hairline')} solid ${v('color-ink')}` } },
  ],
  render(pr: Props): Node {
    const msg = pr.error || pr.hint;
    const attrs: Node['attrs'] = { id: 'field', type: 'text', placeholder: pr.placeholder as string };
    if (msg) attrs['aria-describedby'] = 'field-msg';
    if (pr.error) attrs['aria-invalid'] = 'true';
    if (pr.disabled) attrs.disabled = true;
    const kids: Node[] = [];
    if (pr.label) kids.push(n('label', [f.label], [pr.label as string], { for: 'field' }));
    kids.push(n('input', pr.error ? [i.root, fl.bad] : [i.root], undefined, attrs));
    if (msg) kids.push(n('p', [pr.error ? fl.err : fl.hint], [msg as string], { id: 'field-msg' }));
    return n('div', [f.root], kids);
  },
};

/* ---------- Search input ---------- */
const sr = { wrap: `${p}-search`, input: `${p}-search__input`, icon: `${p}-search__icon` };
export const search: ComponentDef = {
  id: 'search-input', name: 'Search Input', description: 'Text field with a leading search icon.', tags: ['control', 'form'], status: 'stable',
  usage: 'Uses type="search". Same fill, hover and focus as Text Input; 32px start padding makes room for the icon.',
  props: [
    P.text('placeholder', 'Search', 'Placeholder text.'),
    P.text('value', '', 'Initial value.'),
    P.bool('disabled', false, 'Disables the field.'),
  ],
  rules: [
    { cls: sr.wrap, base: { position: 'relative', display: 'flex', 'align-items': 'center', width: v('size-500'), 'max-width': '100%' } },
    { cls: sr.input, base: { ...controlBase, width: '100%', 'padding-inline-start': v('space-32') }, hover: { background: v('color-control-strong') }, focus: fieldFocus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' }, placeholder: { color: v('color-placeholder') } },
    { cls: sr.icon, base: { position: 'absolute', 'inset-inline-start': v('space-12'), 'pointer-events': 'none', color: v('color-ink-muted') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const attrs: Node['attrs'] = { type: 'search', placeholder: pr.placeholder as string, 'aria-label': 'Search' };
    if (pr.value) attrs.value = pr.value as string;
    if (pr.disabled) attrs.disabled = true;
    return n('div', [sr.wrap], [{ ...iconNode('search', 14), cls: [bc.icon, sr.icon] }, n('input', [sr.input], undefined, attrs)]);
  },
};

/* ---------- Segmented control ---------- */
const sg = { root: `${p}-segmented`, item: `${p}-segmented__item`, on: `${p}-segmented__item--active` };
export const segmented: ComponentDef = {
  id: 'segmented-control', name: 'Segmented Control', description: 'Switch between a few mutually exclusive views.', tags: ['control', 'navigation'], status: 'stable',
  usage: 'Arrow keys, Home and End move the selection; the selected segment lifts onto the canvas color.',
  props: [
    P.area('options', 'Day\nWeek\nMonth', 'Segment labels, one per line.', 'string (one per line)'),
    P.text('value', 'Day', 'Selected segment label.'),
  ],
  rules: [
    { cls: sg.root, base: { display: 'inline-flex', gap: v('space-4'), padding: v('space-4'), 'box-sizing': 'border-box', 'border-radius': v('radius-12'), background: v('color-control') } },
    { cls: sg.item, base: { 'padding-block': v('space-4'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), border: 'none', background: 'transparent', color: v('color-ink-muted'), cursor: 'pointer', ...text('sm') }, hover: { color: v('color-ink') }, focus },
    { cls: sg.on, base: { background: v('color-canvas'), color: v('color-ink'), ...ringDecl } },
  ],
  render(pr: Props): Node {
    const items = lines(pr.options).map((o) => {
      const on = o === pr.value;
      return n('button', on ? [sg.item, sg.on] : [sg.item], [o], { type: 'button', role: 'radio', 'aria-checked': String(on), tabindex: on ? '0' : '-1' });
    });
    return n('div', [sg.root], items, { role: 'radiogroup', 'data-p8': 'group' });
  },
};

/* ---------- Slider ---------- */
const sl = { root: `${p}-slider` };
const thumb = { 'box-sizing': 'border-box', width: v('size-16'), height: v('size-16'), 'border-radius': v('radius-full'), border: 'none', background: v('color-ink'), transition: `width ${motion}` };
const stretch = { width: v('size-24') };
const track = { height: v('space-4'), 'border-radius': v('radius-full'), background: v('color-control-strong') };
export const slider: ComponentDef = {
  id: 'slider', name: 'Slider', description: 'Pick a value in a range (native range input).', tags: ['control', 'form'], status: 'stable',
  usage: 'A native input type="range": arrow keys, Home/End and touch work without scripts. The thumb stretches into a pill while you drag.',
  props: [
    P.text('label', 'Value', 'Accessible label.'),
    P.text('value', '40', 'Initial value.'),
    P.text('min', '0', 'Minimum.'),
    P.text('max', '100', 'Maximum.'),
    P.text('step', '1', 'Step.'),
    P.bool('disabled', false, 'Disables the slider.'),
  ],
  rules: [
    { cls: sl.root, base: { appearance: 'none', width: v('size-320'), 'max-width': '100%', height: v('size-20'), margin: '0', background: 'transparent', cursor: 'pointer' }, focus: { outline: 'none' }, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' },
      nested: [
        { sel: '::-webkit-slider-runnable-track', decls: track },
        { sel: '::-moz-range-track', decls: track },
        { sel: '::-webkit-slider-thumb', decls: { ...thumb, appearance: 'none', 'margin-top': `calc((${v('space-4')} - ${v('size-16')}) / 2)` } },
        { sel: '::-moz-range-thumb', decls: thumb },
        { sel: ':active:not(:disabled)::-webkit-slider-thumb', decls: stretch },
        { sel: ':active:not(:disabled)::-moz-range-thumb', decls: stretch },
        { sel: ':focus-visible::-webkit-slider-thumb', decls: { 'box-shadow': `0 0 0 ${v('border-focus')} ${v('color-ring-focus')}` } },
        { sel: ':focus-visible::-moz-range-thumb', decls: { 'box-shadow': `0 0 0 ${v('border-focus')} ${v('color-ring-focus')}` } },
      ] },
  ],
  render(pr: Props): Node {
    const attrs: Node['attrs'] = { type: 'range', min: pr.min as string, max: pr.max as string, step: pr.step as string, value: pr.value as string, 'aria-label': pr.label as string };
    if (pr.disabled) attrs.disabled = true;
    return n('input', [sl.root], undefined, attrs);
  },
};
