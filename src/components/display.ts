import { v } from '../tokens/theme';
import { button, c as bc, iconNode, iconRule } from './button';
import { divider } from './forms';
import { focus, lines, motion, n, p, noRing, ringDecl, text } from './shared';
import type { ComponentDef, Node, Props } from './types';

const btn = (label: string, variant: string, icon = 'none'): Node =>
  button.render({ label, variant, size: 'md', icon, iconSize: '14', iconPosition: 'start', fullWidth: false, disabled: false });
const dividerNode = () => divider.render({ orientation: 'horizontal', spacing: 'none' });
const surface = { background: v('color-surface'), color: v('color-ink'), ...ringDecl, 'border-radius': v('radius-8'), 'font-family': v('type-family') };

/* ---------- Menu ---------- */
const m = { root: `${p}-menu`, item: `${p}-menu__item`, active: `${p}-menu__item--active` };
export const menu: ComponentDef = {
  id: 'menu', name: 'Menu', description: 'A list of actions. Items use 6px side padding, 4px top/bottom.', tags: ['navigation', 'overlay-content'], status: 'stable',
  usage: 'Menu item horizontal padding is 6px, the one documented exception to the 4/8 grid. Use "---" on its own line for a divider.',
  composition: 'Dividers inside a menu are Divider components.',
  props: [
    { name: 'items', type: 'string (one per line)', default: 'Rename\nDuplicate\n---\nDelete', description: 'Item labels, one per line. "---" inserts a divider.', control: { kind: 'textarea' } },
    { name: 'active', type: 'string', default: '', description: 'Label of the highlighted item.', control: { kind: 'text' } },
  ],
  rules: [
    { cls: m.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'box-sizing': 'border-box', padding: v('space-4'), 'min-width': v('size-320'), ...surface, 'border-radius': v('radius-12') } },
    { cls: m.item, base: { 'box-sizing': 'border-box', 'text-align': 'left', width: '100%', 'padding-block': v('space-4'), 'padding-inline': v('space-6'), 'border-radius': v('radius-8'), border: 'none', background: 'transparent', color: v('color-ink'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus },
    { cls: m.active, base: { background: v('color-control-strong') } },
  ],
  render(pr: Props): Node {
    const kids = lines(pr.items).map((l) =>
      l === '---' ? dividerNode() : n('button', l === pr.active ? [m.item, m.active] : [m.item], [l], { type: 'button', role: 'menuitem' }));
    return n('div', [m.root], kids, { role: 'menu' });
  },
};

/* ---------- Tabs ---------- */
const t = { list: `${p}-tabs`, tab: `${p}-tabs__tab`, on: `${p}-tabs__tab--active`, panel: `${p}-tabs__panel`, root: `${p}-tabs-root` };
export const tabs: ComponentDef = {
  id: 'tabs', name: 'Tabs', description: 'Switch between related views. 12px spacing between tabs.', tags: ['navigation'], status: 'stable',
  usage: 'Active tab uses the ink color and control fill; inactive tabs are muted. Wire up selection state in your framework.',
  props: [
    { name: 'tabs', type: 'string (one per line)', default: 'Overview\nActivity\nSettings', description: 'Tab labels, one per line.', control: { kind: 'textarea' } },
    { name: 'active', type: 'string', default: 'Overview', description: 'Label of the active tab.', control: { kind: 'text' } },
  ],
  rules: [
    { cls: t.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), 'font-family': v('type-family'), color: v('color-ink') } },
    { cls: t.list, base: { display: 'flex', gap: v('space-12') } },
    { cls: t.tab, base: { 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), border: 'none', background: 'transparent', color: v('color-ink-muted'), cursor: 'pointer', ...text('sm') }, hover: { color: v('color-ink') }, focus },
    { cls: t.on, base: { background: v('color-control-strong'), color: v('color-ink') } },
  ],
  render(pr: Props): Node {
    const tabsN = lines(pr.tabs).map((l) => n('button', l === pr.active ? [t.tab, t.on] : [t.tab], [l], { type: 'button', role: 'tab', 'aria-selected': String(l === pr.active) }));
    return n('div', [t.root], [n('div', [t.list], tabsN, { role: 'tablist' })]);
  },
};

/* ---------- Disclosure ---------- */
const d = { root: `${p}-disclosure`, summary: `${p}-disclosure__summary`, body: `${p}-disclosure__body`, icon: `${p}-disclosure__icon` };
export const disclosure: ComponentDef = {
  id: 'disclosure', name: 'Disclosure', description: 'Show and hide a section of content (native details/summary).', tags: ['layout', 'content'], status: 'stable',
  usage: 'Uses <details>, so it works without JavaScript and is keyboard accessible.',
  props: [
    { name: 'summary', type: 'string', default: 'Summary', description: 'Always-visible heading.', control: { kind: 'text' } },
    { name: 'content', type: 'string', default: 'Hidden content revealed when open.', description: 'Content inside.', control: { kind: 'textarea' } },
    { name: 'open', type: 'boolean', default: true, description: 'Initially open.', control: { kind: 'boolean' } },
  ],
  rules: [
    { cls: d.root, base: { 'box-sizing': 'border-box', padding: v('space-12'), ...surface, 'min-width': v('size-320') } },
    { cls: d.summary, base: { display: 'flex', 'align-items': 'center', gap: v('space-8'), cursor: 'pointer', 'list-style': 'none', ...text('sm'), 'font-weight': v('type-weight-strong') }, focus },
    { cls: d.body, base: { 'padding-top': v('space-8'), ...text('sm'), color: v('color-ink-muted') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const attrs: Node['attrs'] = {};
    if (pr.open) attrs.open = true;
    return n('details', [d.root], [
      n('summary', [d.summary], [iconNode(pr.open ? 'chevron-down' : 'chevron-right', 14), pr.summary as string]),
      n('div', [d.body], [pr.content as string]),
    ], attrs);
  },
};

/* ---------- Data list ---------- */
const l = { root: `${p}-datalist`, row: `${p}-datalist__row`, term: `${p}-datalist__term`, def: `${p}-datalist__def`, g8: `${p}-datalist--gap8` };
export const dataList: ComponentDef = {
  id: 'data-list', name: 'Data List', description: 'Label/value pairs on stacked lines with a 4px or 8px gap.', tags: ['content', 'data'], status: 'stable',
  usage: 'Write each pair as "Label: Value". Line gap is 4px, or 8px for roomier lists.',
  props: [
    { name: 'items', type: 'string (Label: Value per line)', default: 'Status: Active\nOwner: Primitive 8\nUpdated: Today', description: 'One pair per line.', control: { kind: 'textarea' } },
    { name: 'gap', type: "'4' | '8'", default: '4', description: 'Gap between lines in px.', control: { kind: 'select', options: ['4', '8'] } },
  ],
  rules: [
    { cls: l.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), margin: '0', 'min-width': v('size-320'), 'font-family': v('type-family'), ...text('sm'), color: v('color-ink') } },
    { cls: l.g8, base: { gap: v('space-8') } },
    { cls: l.row, base: { display: 'flex', 'justify-content': 'space-between', gap: v('space-12') } },
    { cls: l.term, base: { margin: '0', color: v('color-ink-muted') } },
    { cls: l.def, base: { margin: '0', 'text-align': 'right' } },
  ],
  render(pr: Props): Node {
    const rows = lines(pr.items).map((ln) => {
      const i = ln.indexOf(':');
      const [a, b] = i < 0 ? [ln, ''] : [ln.slice(0, i).trim(), ln.slice(i + 1).trim()];
      return n('div', [l.row], [n('dt', [l.term], [a]), n('dd', [l.def], b ? [b] : [])]);
    });
    return n('dl', pr.gap === '8' ? [l.root, l.g8] : [l.root], rows);
  },
};

/* ---------- Badge ---------- */
const b = { root: `${p}-badge`, outline: `${p}-badge--outline`, solid: `${p}-badge--solid`, normal: `${p}-badge--normal-font` };
export const badge: ComponentDef = {
  id: 'badge', content: 'label', name: 'Badge', description: 'Small status or count label. Mono type, 4px radius.', tags: ['content', 'status'], status: 'stable',
  usage: 'Keep labels to one or two words. Set font to normal to use the interface font instead of the mono face.',
  props: [
    { name: 'label', type: 'string', default: 'Badge', description: 'Text.', control: { kind: 'text' } },
    { name: 'variant', type: "'default' | 'outline' | 'solid'", default: 'default', description: 'Emphasis.', control: { kind: 'select', options: ['default', 'outline', 'solid'] } },
    { name: 'font', type: "'mono' | 'normal'", default: 'mono', description: 'mono is Geist Mono with -0.02em tracking; normal is the interface font.', control: { kind: 'select', options: ['mono', 'normal'] } },
  ],
  rules: [
    { cls: b.root, base: { display: 'inline-flex', 'align-items': 'center', 'padding-block': v('space-4'), 'padding-inline': v('space-8'), 'border-radius': v('radius-4'), background: v('color-control-strong'), color: v('color-ink'), ...text('sm'), 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
    { cls: b.outline, base: { background: 'transparent', ...ringDecl } },
    { cls: b.solid, base: { background: v('color-ink'), color: v('color-ink-inverse') } },
    { cls: b.normal, base: { 'font-family': v('type-family'), 'letter-spacing': v('type-tracking-normal') } },
  ],
  render(pr: Props): Node {
    const cls = [b.root];
    if (pr.variant === 'outline') cls.push(b.outline);
    if (pr.variant === 'solid') cls.push(b.solid);
    if (pr.font === 'normal') cls.push(b.normal);
    return n('span', cls, [pr.label as string]);
  },
};

/* ---------- Tooltip ---------- */
const tt = { root: `${p}-tooltip`, bubble: `${p}-tooltip__bubble`, top: `${p}-tooltip__bubble--top`, bottom: `${p}-tooltip__bubble--bottom`, open: `${p}-tooltip__bubble--open` };
export const tooltip: ComponentDef = {
  id: 'tooltip', content: 'trigger', name: 'Tooltip', description: 'Short hint that appears on hover or focus.', tags: ['overlay', 'content'], status: 'stable',
  usage: 'CSS only: the bubble shows while the trigger is hovered or focused. Turn on open to keep it visible for review.',
  composition: 'Wraps a Button as the trigger.',
  props: [
    { name: 'text', type: 'string', default: 'Helpful hint', description: 'Bubble text.', control: { kind: 'text' } },
    { name: 'trigger', type: 'string', default: 'Hover me', description: 'Label of the trigger button.', control: { kind: 'text' } },
    { name: 'placement', type: "'top' | 'bottom'", default: 'top', description: 'Side of the trigger.', control: { kind: 'select', options: ['top', 'bottom'] } },
    { name: 'open', type: 'boolean', default: false, description: 'Keep the bubble visible.', control: { kind: 'boolean' } },
  ],
  rules: [
    { cls: tt.root, base: { position: 'relative', display: 'inline-flex' } },
    { cls: tt.bubble, base: { position: 'absolute', left: '50%', translate: '-50% 0', 'white-space': 'nowrap', 'pointer-events': 'none', opacity: '0', transition: `opacity ${motion}`, 'padding-block': v('space-4'), 'padding-inline': v('space-8'), 'border-radius': v('radius-8'), background: v('color-ink'), color: v('color-ink-inverse'), ...text('sm') }, parent: { cls: tt.root, hover: { opacity: '1' } } },
    { cls: tt.top, base: { bottom: '100%', 'margin-bottom': v('space-8') } },
    { cls: tt.bottom, base: { top: '100%', 'margin-top': v('space-8') } },
    { cls: tt.open, base: { opacity: '1' } },
  ],
  render(pr: Props): Node {
    const cls = [tt.bubble, pr.placement === 'bottom' ? tt.bottom : tt.top];
    if (pr.open) cls.push(tt.open);
    return n('span', [tt.root], [btn(pr.trigger as string, 'default'), n('span', cls, [pr.text as string], { role: 'tooltip' })]);
  },
};

/* ---------- Dialog ---------- */
const g = { root: `${p}-dialog`, title: `${p}-dialog__title`, body: `${p}-dialog__body`, foot: `${p}-dialog__footer` };
export const dialog: ComponentDef = {
  id: 'dialog', name: 'Dialog', description: 'A focused panel that asks for a decision.', tags: ['overlay'], status: 'stable',
  usage: 'This is the panel only. Add your own backdrop, focus trap and Escape handling. Uses role="dialog" with aria-modal.',
  composition: 'Footer actions are Buttons: ghost for cancel, primary for confirm.',
  props: [
    { name: 'title', type: 'string', default: 'Dialog title', description: 'Heading.', control: { kind: 'text' } },
    { name: 'body', type: 'string', default: 'Explain what happens when the user confirms.', description: 'Body text.', control: { kind: 'textarea' } },
    { name: 'confirmLabel', type: 'string', default: 'Confirm', description: 'Primary action label.', control: { kind: 'text' } },
    { name: 'cancelLabel', type: 'string', default: 'Cancel', description: 'Secondary action label. Empty to omit.', control: { kind: 'text' } },
  ],
  rules: [
    { cls: g.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-16'), 'box-sizing': 'border-box', width: v('size-400'), 'max-width': '100%', padding: v('space-16'), ...surface } },
    { cls: g.title, base: { margin: '0', ...text('md'), 'font-weight': v('type-weight-strong') } },
    { cls: g.body, base: { margin: '0', ...text('sm'), color: v('color-ink-muted') } },
    { cls: g.foot, base: { display: 'flex', 'justify-content': 'flex-end', gap: v('space-12') } },
  ],
  render(pr: Props): Node {
    const foot: Node[] = [];
    if (pr.cancelLabel) foot.push(btn(pr.cancelLabel as string, 'ghost'));
    foot.push(btn(pr.confirmLabel as string, 'primary'));
    const kids: Node[] = [];
    kids.push(n('div', [], [n('h2', [g.title], [pr.title as string]), ...(pr.body ? [n('p', [g.body], [pr.body as string])] : [])]));
    kids.push(n('div', [g.foot], foot));
    return n('div', [g.root], kids, { role: 'dialog', 'aria-modal': 'true' });
  },
};

/* ---------- Toast ---------- */
const o = { root: `${p}-toast`, inv: `${p}-toast--inverted`, msg: `${p}-toast__message`, action: `${p}-toast__action`, close: `${p}-toast__close` };
export const toast: ComponentDef = {
  id: 'toast', name: 'Toast', description: 'Brief, non-blocking message.', tags: ['feedback', 'overlay'], status: 'stable',
  usage: 'Position and auto-dismiss in your app. Uses role="status" so it is announced politely.',
  props: [
    { name: 'message', type: 'string', default: 'Changes saved.', description: 'Message.', control: { kind: 'text' } },
    { name: 'variant', type: "'default' | 'inverted'", default: 'default', description: 'Surface or inverted ink.', control: { kind: 'select', options: ['default', 'inverted'] } },
    { name: 'action', type: 'string', default: '', description: 'Optional action label.', control: { kind: 'text' } },
    { name: 'dismissible', type: 'boolean', default: true, description: 'Show a close button.', control: { kind: 'boolean' } },
  ],
  rules: [
    { cls: o.root, base: { display: 'flex', 'align-items': 'center', gap: v('space-12'), 'box-sizing': 'border-box', 'min-width': v('size-320'), 'padding-block': v('space-12'), 'padding-inline': v('space-16'), ...surface, ...text('sm') } },
    { cls: o.inv, base: { background: v('color-ink'), color: v('color-ink-inverse'), ...noRing } },
    { cls: o.msg, base: { flex: '1' } },
    { cls: o.action, base: { border: 'none', background: 'transparent', color: 'inherit', padding: '0', cursor: 'pointer', 'font-weight': v('type-weight-strong'), ...text('sm') }, focus },
    { cls: o.close, base: { display: 'inline-flex', border: 'none', background: 'transparent', color: 'inherit', padding: '0', cursor: 'pointer' }, focus },
    iconRule,
  ],
  render(pr: Props): Node {
    const kids: Node[] = [n('span', [o.msg], [pr.message as string])];
    if (pr.action) kids.push(n('button', [o.action], [pr.action as string], { type: 'button' }));
    if (pr.dismissible) kids.push(n('button', [o.close], [iconNode('close', 16)], { type: 'button', 'aria-label': 'Dismiss' }));
    return n('div', pr.variant === 'inverted' ? [o.root, o.inv] : [o.root], kids, { role: 'status' });
  },
};

/* ---------- Avatar ---------- */
const a = { root: `${p}-avatar`, s24: `${p}-avatar--24`, s40: `${p}-avatar--40`, img: `${p}-avatar__img` };
export const avatar: ComponentDef = {
  id: 'avatar', name: 'Avatar', description: 'Image or initials for a person or entity.', tags: ['content', 'identity'], status: 'stable',
  usage: 'Provide src for an image; otherwise initials are derived from name.',
  props: [
    { name: 'name', type: 'string', default: 'Primitive 8', description: 'Used for initials and alt text.', control: { kind: 'text' } },
    { name: 'src', type: 'string', default: '', description: 'Image URL. Empty shows initials.', control: { kind: 'text' } },
    { name: 'size', type: "'24' | '32' | '40'", default: '32', description: 'Diameter in px.', control: { kind: 'select', options: ['24', '32', '40'] } },
  ],
  rules: [
    { cls: a.root, base: { display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'flex-shrink': '0', overflow: 'hidden', width: v('size-32'), height: v('size-32'), 'border-radius': v('radius-full'), background: v('color-control-strong'), color: v('color-ink'), ...text('sm'), 'font-weight': v('type-weight-strong') } },
    { cls: a.s24, base: { width: v('size-24'), height: v('size-24') } },
    { cls: a.s40, base: { width: v('size-40'), height: v('size-40') } },
    { cls: a.img, base: { width: '100%', height: '100%', 'object-fit': 'cover' } },
  ],
  render(pr: Props): Node {
    const cls = [a.root];
    if (pr.size === '24') cls.push(a.s24);
    if (pr.size === '40') cls.push(a.s40);
    const name = pr.name as string;
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
    const kids: (Node | string)[] = pr.src ? [n('img', [a.img], undefined, { src: pr.src as string, alt: name })] : [initials];
    return n('span', cls, kids, pr.src ? undefined : { role: 'img', 'aria-label': name });
  },
};

