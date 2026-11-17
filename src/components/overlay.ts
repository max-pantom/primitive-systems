import { v } from '../tokens/theme';
import { button, iconNode, iconRule } from './button';
import { ov, overlayRules, menu } from './display';
import { P, focus, hiddenRule, n, p, ringDecl, text } from './shared';
import { iconButton } from './bits';
import type { ComponentDef, Node, Props, Rule } from './types';

const btnNode = (label: string, extra: Node['attrs']): Node => {
  const b = button.render({ label, variant: 'default', size: 'md', icon: 'none', iconSize: '14', iconPosition: 'start', fullWidth: false, disabled: false });
  return { ...b, attrs: { ...b.attrs, ...extra } };
};

const po = { root: `${p}-popover`, panel: `${p}-popover__panel`, end: `${p}-popover__panel--end`, bare: `${p}-popover__panel--bare` };
const popRules: Rule[] = [
  { cls: po.root, base: { position: 'relative', display: 'inline-block' } },
  { cls: po.panel, base: { position: 'absolute', top: '100%', left: '0', 'margin-top': v('space-8'), 'z-index': '40', 'box-sizing': 'border-box', 'min-width': v('size-240'), 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-canvas'), color: v('color-ink'), ...ringDecl, ...text('sm') }, nested: [hiddenRule] },
  { cls: po.end, base: { left: 'auto', right: '0' } },
  { cls: po.bare, base: { padding: '0', background: 'transparent', outline: 'none' } },
];

/* ---------- Popover ---------- */
export const popover: ComponentDef = {
  id: 'popover', name: 'Popover', description: 'A small floating panel anchored to a trigger.', tags: ['overlay'], status: 'stable',
  usage: 'Click the trigger to open; click outside or press Escape to close (focus returns to the trigger). aria-expanded is kept in sync.',
  composition: 'The trigger is a Button.',
  props: [
    P.text('trigger', 'Open', 'Trigger label.'),
    P.area('body', 'Popover content.', 'Panel text.'),
    P.select('align', ['start', 'end'], 'start', 'Which trigger edge the panel aligns to.'),
    P.bool('open', true, 'Initially open.'),
  ],
  rules: popRules,
  render(pr: Props): Node {
    const panel = n('div', pr.align === 'end' ? [po.panel, po.end] : [po.panel], [pr.body as string], pr.open ? { 'data-panel': true } : { 'data-panel': true, hidden: true });
    return n('span', [po.root], [btnNode(pr.trigger as string, { 'data-trigger': true, 'aria-expanded': String(pr.open), 'aria-haspopup': 'dialog' }), panel], { 'data-p8': 'popover' });
  },
};

/* ---------- Dropdown menu ---------- */
export const dropdown: ComponentDef = {
  id: 'dropdown-menu', name: 'Dropdown Menu', description: 'A Menu opened from a trigger.', tags: ['overlay', 'navigation'], status: 'stable',
  usage: 'Enter/click opens and focuses the first item; arrows move, Enter chooses and closes, Escape or an outside click closes.',
  composition: 'Trigger is a Button; the panel contains a Menu.',
  props: [
    P.text('trigger', 'Actions', 'Trigger label.'),
    P.area('items', 'Rename | ⌘R\nDuplicate | ⌘D\n---\nDelete | ⌫', 'Items one per line; "---" is a divider.', 'string (one per line)'),
    P.select('align', ['start', 'end'], 'start', 'Which trigger edge the panel aligns to.'),
    P.bool('open', true, 'Initially open.'),
  ],
  rules: popRules,
  render(pr: Props): Node {
    const panel = n('div', pr.align === 'end' ? [po.panel, po.bare, po.end] : [po.panel, po.bare], [menu.render({ items: pr.items, active: '' })], pr.open ? { 'data-panel': true } : { 'data-panel': true, hidden: true });
    return n('span', [po.root], [btnNode(pr.trigger as string, { 'data-trigger': true, 'aria-expanded': String(pr.open), 'aria-haspopup': 'menu' }), panel], { 'data-p8': 'popover', 'data-select-closes': true });
  },
};

/* ---------- Sheet ---------- */
const sh = { root: `${p}-sheet`, bottom: `${p}-sheet--bottom`, head: `${p}-sheet__head`, title: `${p}-sheet__title`, body: `${p}-sheet__body`, close: `${p}-sheet__close` };
export const sheet: ComponentDef = {
  id: 'sheet', name: 'Sheet', description: 'A drawer that slides in from a side or the bottom.', tags: ['overlay'], status: 'stable',
  usage: 'Backdrop click, Escape and the close button hide it; Tab stays inside while it is open.',
  props: [
    P.text('title', 'Sheet title', 'Heading.'),
    P.area('body', 'Sheet content goes here.', 'Body text.'),
    P.select('side', ['right', 'left', 'bottom'], 'right', 'Which edge the sheet attaches to.'),
  ],
  rules: [
    ...overlayRules,
    { cls: sh.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), 'box-sizing': 'border-box', width: v('size-320'), 'max-width': '100%', height: '100%', padding: v('space-16'), background: v('color-canvas'), color: v('color-ink'), ...ringDecl, ...text('sm') } },
    { cls: sh.bottom, base: { width: '100%', height: 'auto', 'min-height': v('size-240') } },
    { cls: sh.head, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between' } },
    { cls: sh.title, base: { margin: '0', ...text('md'), 'font-weight': v('type-weight-strong') } },
    { cls: sh.body, base: { color: v('color-ink-muted') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const panel = n('div', pr.side === 'bottom' ? [sh.root, sh.bottom] : [sh.root], [
      n('div', [sh.head], [n('h2', [sh.title], [pr.title as string]), { ...iconButton.render({ icon: 'close', label: 'Close', size: '16', variant: 'ghost-flat', disabled: false }), attrs: { type: 'button', 'aria-label': 'Close', 'data-close': true } }]),
      n('div', [sh.body], [pr.body as string]),
    ], { role: 'dialog', 'aria-modal': 'true' });
    const side = pr.side === 'left' ? ov.start : pr.side === 'bottom' ? ov.bottom : ov.end;
    return n('div', [ov.root, side], [panel], { 'data-p8': 'overlay' });
  },
};
