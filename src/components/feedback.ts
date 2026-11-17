import { v } from '../tokens/theme';
import { c as bc, iconNode, iconRule } from './button';
import { P, focus, n, p, ringDecl, text } from './shared';
import type { ComponentDef, Node, Props } from './types';

/* ---------- Spinner ---------- */
const sp = { root: `${p}-spinner` };
export const spinner: ComponentDef = {
  id: 'spinner', name: 'Spinner', description: 'Indeterminate loading indicator.', tags: ['feedback', 'loading'], status: 'stable',
  usage: 'Animated with SVG (no CSS keyframes), so it works in every output. Uses role="status".',
  props: [P.select('size', ['16', '20', '24'], '20', 'Diameter in px.')],
  rules: [{ cls: sp.root, base: { color: v('color-ink-muted'), 'flex-shrink': '0' } }],
  render(pr: Props): Node {
    const s = String(pr.size);
    const svg = n('svg', [sp.root], [
      n('circle', [], undefined, { cx: '12', cy: '12', r: '9', opacity: '0.25' }),
      n('path', [], [n('animateTransform', [], undefined, { attributeName: 'transform', type: 'rotate', from: '0 12 12', to: '360 12 12', dur: '0.8s', repeatCount: 'indefinite' })], { d: 'M21 12A9 9 0 0 0 12 3' }),
    ], { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', role: 'status', 'aria-label': 'Loading' });
    return svg;
  },
};

/* ---------- Skeleton ---------- */
const sk = { root: `${p}-skeleton`, bar: `${p}-skeleton__bar` };
export const skeleton: ComponentDef = {
  id: 'skeleton', name: 'Skeleton', description: 'Placeholder lines shown while content loads.', tags: ['feedback', 'loading'], status: 'stable',
  usage: 'Pulses with SVG animation. The last line is shorter, like real text.',
  props: [P.select('lines', ['1', '2', '3', '4', '5'], '3', 'Number of lines.')],
  rules: [
    { cls: sk.root, base: { display: 'block', width: v('size-320'), 'max-width': '100%' } },
    { cls: sk.bar, base: { fill: v('color-control-strong') } },
  ],
  render(pr: Props): Node {
    const count = Number(pr.lines);
    const bars = Array.from({ length: count }, (_, idx) =>
      n('rect', [sk.bar], [n('animate', [], undefined, { attributeName: 'opacity', values: '1;0.5;1', dur: '1.5s', repeatCount: 'indefinite' })], {
        x: '0', y: String(idx * 28), width: idx === count - 1 && count > 1 ? '60%' : '100%', height: '16', rx: '4' }));
    return n('svg', [sk.root], bars, { width: '100%', height: String(count * 28 - 12), role: 'img', 'aria-label': 'Loading' });
  },
};

/* ---------- Progress ---------- */
const pg = { root: `${p}-progress` };
const bar = { 'border-radius': v('radius-full'), background: v('color-control-strong') };
const fill = { 'border-radius': v('radius-full'), background: v('color-ink') };
export const progress: ComponentDef = {
  id: 'progress', name: 'Progress', description: 'Determinate progress bar (native progress element).', tags: ['feedback'], status: 'stable',
  usage: 'Native <progress>, so assistive tech reads value and max automatically.',
  props: [P.text('value', '40', 'Current value.'), P.text('max', '100', 'Maximum value.'), P.text('label', 'Progress', 'Accessible label.')],
  rules: [{ cls: pg.root, base: { appearance: 'none', display: 'block', width: v('size-320'), 'max-width': '100%', height: v('space-8'), border: 'none', overflow: 'hidden', ...bar },
    nested: [{ sel: '::-webkit-progress-bar', decls: bar }, { sel: '::-webkit-progress-value', decls: fill }, { sel: '::-moz-progress-bar', decls: fill }] }],
  render(pr: Props): Node {
    return n('progress', [pg.root], [], { value: pr.value as string, max: pr.max as string, 'aria-label': pr.label as string });
  },
};

/* ---------- Alert ---------- */
const al = { root: `${p}-alert`, text: `${p}-alert__text`, title: `${p}-alert__title`, body: `${p}-alert__body`, close: `${p}-alert__close`, icon: `${p}-alert__icon` };
export const alert: ComponentDef = {
  id: 'alert', name: 'Alert', description: 'Inline banner for important information.', tags: ['feedback'], status: 'stable',
  usage: 'Use role="alert" for urgent messages. Tone changes the icon only; color stays on the seed palette.',
  props: [
    P.text('title', 'Heads up', 'Heading. Empty to omit.'),
    P.area('body', 'Something you should know about.', 'Body text.'),
    P.select('tone', ['info', 'warning', 'success'], 'info', 'Icon used.'),
    P.bool('dismissible', false, 'Show a close button.'),
  ],
  rules: [
    { cls: al.root, base: { display: 'flex', gap: v('space-12'), 'align-items': 'flex-start', 'box-sizing': 'border-box', width: v('size-400'), 'max-width': '100%', 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-surface'), color: v('color-ink'), ...ringDecl, ...text('sm') } },
    { cls: al.icon, base: { 'margin-top': v('space-2') } },
    { cls: al.text, base: { flex: '1', display: 'flex', 'flex-direction': 'column', gap: v('space-4') } },
    { cls: al.title, base: { 'font-weight': v('type-weight-strong') } },
    { cls: al.body, base: { color: v('color-ink-muted') } },
    { cls: al.close, base: { display: 'inline-flex', padding: '0', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }, focus },
    iconRule,
  ],
  render(pr: Props): Node {
    const icon = pr.tone === 'warning' ? 'warning' : pr.tone === 'success' ? 'check-circle' : 'info';
    const text: Node[] = [];
    if (pr.title) text.push(n('div', [al.title], [pr.title as string]));
    if (pr.body) text.push(n('div', [al.body], [pr.body as string]));
    const kids: Node[] = [{ ...iconNode(icon, 16), cls: [bc.icon, al.icon] }, n('div', [al.text], text)];
    if (pr.dismissible) kids.push(n('button', [al.close], [iconNode('close', 16)], { type: 'button', 'aria-label': 'Dismiss', 'data-close': true }));
    return n('div', [al.root], kids, { role: 'alert', 'data-p8': 'dismiss' });
  },
};
