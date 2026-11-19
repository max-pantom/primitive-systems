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
const pulse = () => n('animate', [], undefined, { attributeName: 'opacity', values: '1;0.5;1', dur: '1.5s', repeatCount: 'indefinite' });
const rect = (x: string, y: number, w: string, h: number, rx = 4): Node => n('rect', [sk.bar], [pulse()], { x, y: String(y), width: w, height: String(h), rx: String(rx) });
const dot = (cx: number, cy: number, r: number): Node => n('circle', [sk.bar], [pulse()], { cx: String(cx), cy: String(cy), r: String(r) });
export const skeleton: ComponentDef = {
  id: 'skeleton', name: 'Skeleton', description: 'Placeholder shapes shown while content loads: text, card, table, list or image.', tags: ['feedback', 'loading'], status: 'stable',
  usage: 'Match the variant to what is loading so the layout does not jump: text for paragraphs, card for a media card, table for rows and columns, list for avatar rows, image for a single picture. Pulses with SVG animation (no CSS keyframes). Give it an accessible name with label.',
  props: [
    P.select('variant', ['text', 'card', 'table', 'list', 'image'], 'text', 'The shape of what is loading.'),
    P.select('lines', ['1', '2', '3', '4', '5'], '3', 'Lines of text, or rows of a table / list.'),
    P.text('label', 'Loading', 'Accessible name announced to screen readers.'),
  ],
  rules: [
    { cls: sk.root, base: { display: 'block', width: v('size-320'), 'max-width': '100%' } },
    { cls: sk.bar, base: { fill: v('color-control-strong') } },
  ],
  render(pr: Props): Node {
    const count = Number(pr.lines);
    const svg = (kids: Node[], height: number) => n('svg', [sk.root], kids, { width: '100%', height: String(height), role: 'img', 'aria-label': (pr.label as string) || 'Loading' });
    switch (pr.variant) {
      case 'card':
        return svg([rect('0', 0, '100%', 120, 8), rect('0', 136, '70%', 16), rect('0', 164, '100%', 12), rect('0', 188, '55%', 12)], 200);
      case 'table': {
        const cols = ['0', '36%', '72%'];
        const head = cols.map((x) => rect(x, 0, '28%', 12));
        const body = Array.from({ length: count }, (_, r) => cols.map((x, c) => rect(x, 28 + r * 32, ['28%', '22%', '18%'][c], 12))).flat();
        return svg([...head, ...body], 28 + count * 32 - 12);
      }
      case 'list':
        return svg(Array.from({ length: count }, (_, r) => [dot(16, 16 + r * 48, 16), rect('44', r * 48 + 4, '50%', 12), rect('44', r * 48 + 24, '30%', 12)]).flat(), count * 48 - 16);
      case 'image':
        return svg([rect('0', 0, '100%', 160, 8)], 160);
      default:
        return svg(Array.from({ length: count }, (_, idx) => rect('0', idx * 28, idx === count - 1 && count > 1 ? '60%' : '100%', 16)), count * 28 - 12);
    }
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

/* ---------- Segmented progress ---------- */
const sgp = { root: `${p}-segmented-progress`, bar: `${p}-segmented-progress__bar`, seg: `${p}-segmented-progress__seg`, done: `${p}-segmented-progress__seg--done`, fill: `${p}-segmented-progress__fill`, labels: `${p}-segmented-progress__labels`, label: `${p}-segmented-progress__label`, on: `${p}-segmented-progress__label--done`, head: `${p}-segmented-progress__head` };
export const segmentedProgress: ComponentDef = {
  id: 'segmented-progress', name: 'Segmented Progress', description: 'A bar split into steps or parts, with the current one partly filled.', tags: ['feedback', 'progress'], status: 'stable',
  usage: 'Use for onboarding, checkout or multi-file uploads, where the whole is made of known parts. done is how many parts are complete and current is how far through the next part (0–100). The accessible value is the overall percent; labels, one per line, name each part below the bar.',
  composition: 'Like Progress, but made of equal parts; pair with Stepper when the parts need names and order.',
  props: [
    P.select('segments', ['3', '4', '5', '6', '8'], '4', 'Number of parts.'),
    P.select('done', ['0', '1', '2', '3', '4', '5', '6', '7', '8'], '2', 'Parts that are complete.'),
    P.text('current', '40', 'Percent (0–100) of the next part that is done.'),
    P.area('labels', 'Account\nPlan\nTeam\nConfirm', 'Names of the parts, one per line. Empty for none.', 'string (one per line)'),
    P.text('label', 'Setup progress', 'Accessible name.'),
  ],
  rules: [
    { cls: sgp.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-8'), width: v('size-400'), 'max-width': '100%', color: v('color-ink'), ...text('sm') } },
    { cls: sgp.head, base: { display: 'flex', 'justify-content': 'space-between', gap: v('space-12'), color: v('color-ink-muted') } },
    { cls: sgp.bar, base: { display: 'grid', gap: v('space-4') } },
    { cls: sgp.seg, base: { position: 'relative', height: v('space-8'), overflow: 'hidden', 'border-radius': v('radius-full'), background: v('color-control-strong') } },
    { cls: sgp.done, base: { background: v('color-ink') } },
    { cls: sgp.fill, base: { position: 'absolute', top: '0', left: '0', bottom: '0', 'border-radius': v('radius-full'), background: v('color-ink') } },
    { cls: sgp.labels, base: { display: 'grid', gap: v('space-4'), color: v('color-ink-muted') } },
    { cls: sgp.label, base: { overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap' } },
    { cls: sgp.on, base: { color: v('color-ink') } },
  ],
  render(pr: Props): Node {
    const total = Number(pr.segments);
    const done = Math.min(total, Number(pr.done));
    const cur = done >= total ? 0 : Math.min(100, Math.max(0, Number(pr.current) || 0));
    const overall = Math.round(((done + cur / 100) / total) * 100);
    const names = String(pr.labels).split('\n').map((l) => l.trim()).filter(Boolean).slice(0, total);
    const cols = `repeat(${total}, minmax(0, 1fr))`;
    return n('div', [sgp.root], [
      n('div', [sgp.head], [n('span', [], [(pr.label as string) || 'Progress']), n('span', [], [`${overall}%`], { 'aria-hidden': 'true' })]),
      n('div', [sgp.bar], Array.from({ length: total }, (_, i) => i < done ? n('span', [sgp.seg, sgp.done], []) : i === done && cur > 0 ? n('span', [sgp.seg], [n('span', [sgp.fill], [], { style: `width: ${cur}%` })]) : n('span', [sgp.seg], [])), { style: `grid-template-columns: ${cols}`, 'aria-hidden': 'true' }),
      ...(names.length ? [n('div', [sgp.labels], names.map((l, i) => n('span', i < done ? [sgp.label, sgp.on] : [sgp.label], [l])), { style: `grid-template-columns: ${cols}`, 'aria-hidden': 'true' })] : []),
    ], { role: 'progressbar', 'aria-label': (pr.label as string) || 'Progress', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(overall), 'aria-valuetext': `${done} of ${total} parts done${cur ? `, next ${cur}%` : ''}` });
  },
};
