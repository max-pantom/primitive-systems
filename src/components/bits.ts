import { v } from '../tokens/theme';
import { c as bc, iconNode, iconRule } from './button';
import { P, focus, n, p, ringDecl, text } from './shared';
import { ICON_NAMES, type IconName, type IconSize } from '../icons/icons';
import type { ComponentDef, Node, Props } from './types';

/* ---------- Icon button ---------- */
const ib = { root: `${p}-iconbtn`, ghost: `${p}-iconbtn--ghost`, flat: `${p}-iconbtn--flat` };
export const iconButton: ComponentDef = {
  id: 'icon-button', name: 'Icon Button', description: 'A square button with just an icon.', tags: ['control', 'action'], status: 'stable',
  usage: 'Always set a label: it becomes aria-label. Padding is 8px on all sides (12px left/right would make it wider than tall).',
  props: [
    P.select('icon', ICON_NAMES as string[], 'plus', 'Icon from the Primitive8 pack.'),
    P.text('label', 'Add', 'Accessible name (aria-label).'),
    P.select('size', ['14', '16'], '16', 'Icon size in px.'),
    P.select('variant', ['default', 'ghost', 'ghost-flat'], 'default', 'default has a fill; ghost has the hairline; ghost-flat has neither until hover.'),
    P.bool('disabled', false, 'Disables the button.'),
  ],
  rules: [
    { cls: ib.root, base: { display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'box-sizing': 'border-box', padding: v('space-8'), 'border-radius': v('radius-8'), border: 'none', background: v('color-control'), color: v('color-ink'), cursor: 'pointer' }, hover: { background: v('color-control-strong') }, focus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: ib.ghost, base: { background: 'transparent', ...ringDecl }, hover: { background: v('color-control') } },
    { cls: ib.flat, base: { background: 'transparent' }, hover: { background: v('color-control') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const cls = [ib.root];
    if (pr.variant === 'ghost') cls.push(ib.ghost);
    if (pr.variant === 'ghost-flat') cls.push(ib.flat);
    const attrs: Node['attrs'] = { type: 'button', 'aria-label': pr.label as string };
    if (pr.disabled) attrs.disabled = true;
    return n('button', cls, [iconNode(pr.icon as IconName, Number(pr.size) as IconSize)], attrs);
  },
};

/* ---------- Kbd ---------- */
const kb = { group: `${p}-kbds`, key: `${p}-kbd` };
export const kbd: ComponentDef = {
  id: 'kbd', name: 'Kbd', description: 'A keyboard shortcut.', tags: ['content'], status: 'stable',
  usage: 'Separate keys with spaces. Each key is a <kbd> in the mono face.',
  props: [P.text('keys', '⌘ K', 'Keys separated by spaces.')],
  rules: [
    { cls: kb.group, base: { display: 'inline-flex', gap: v('space-4') } },
    { cls: kb.key, base: { display: 'inline-flex', 'align-items': 'center', 'min-width': v('size-24'), height: v('size-24'), 'box-sizing': 'border-box', 'justify-content': 'center', 'padding-inline': v('space-4'), 'border-radius': v('radius-4'), background: v('color-control-strong'), color: v('color-ink'), ...text('sm'), 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
  ],
  render(pr: Props): Node {
    return n('span', [kb.group], String(pr.keys).split(/\s+/).filter(Boolean).map((k) => n('kbd', [kb.key], [k])));
  },
};

/* ---------- Tag / chip ---------- */
const tg = { root: `${p}-tag`, outline: `${p}-tag--outline`, close: `${p}-tag__close` };
export const tag: ComponentDef = {
  id: 'tag', name: 'Tag', description: 'A removable chip for filters and selections.', tags: ['content', 'control'], status: 'stable',
  usage: 'With removable on, the X removes the tag from the DOM (and fires nothing else); hook your own handler for state.',
  props: [P.text('label', 'Tag', 'Text.'), P.bool('removable', true, 'Show the remove button.'), P.select('variant', ['default', 'outline'], 'default', 'Fill or hairline.')],
  rules: [
    { cls: tg.root, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-4'), 'padding-block': v('space-4'), 'padding-inline': v('space-8'), 'border-radius': v('radius-8'), background: v('color-control-strong'), color: v('color-ink'), ...text('sm') } },
    { cls: tg.outline, base: { background: 'transparent', ...ringDecl } },
    { cls: tg.close, base: { display: 'inline-flex', padding: '0', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', 'border-radius': v('radius-4') }, focus },
    iconRule,
  ],
  render(pr: Props): Node {
    const kids: (Node | string)[] = [pr.label as string];
    if (pr.removable) kids.push(n('button', [tg.close], [iconNode('close', 14)], { type: 'button', 'aria-label': `Remove ${pr.label}`, 'data-close': true }));
    return n('span', pr.variant === 'outline' ? [tg.root, tg.outline] : [tg.root], kids, { 'data-p8': 'dismiss' });
  },
};

/* ---------- Copy button ---------- */
const cb = { root: `${p}-copybtn`, icon: `${p}-copybtn__icon`, on: `${p}-copybtn__icon--on` };
export const copyButton: ComponentDef = {
  id: 'copy-button', name: 'Copy Button', description: 'Copies text to the clipboard and confirms with a check.', tags: ['control', 'action'], status: 'stable',
  usage: 'Click copies data-copy to the clipboard; the icon swaps to a check for 1.5 seconds.',
  props: [P.text('text', 'Text to copy', 'The string copied.'), P.text('label', 'Copy', 'Visible label. Empty for icon only.'), P.select('variant', ['default', 'ghost'], 'default', 'Fill or hairline.')],
  rules: [
    { cls: cb.root, base: { display: 'inline-flex', 'align-items': 'center', gap: v('space-8'), 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), border: 'none', background: v('color-control'), color: v('color-ink'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control-strong') }, focus },
    { cls: `${cb.root}--ghost`, base: { background: 'transparent', ...ringDecl }, hover: { background: v('color-control') } },
    { cls: cb.icon, base: { display: 'none' } },
    { cls: cb.on, base: { display: 'block' } },
    iconRule,
  ],
  render(pr: Props): Node {
    const kids: (Node | string)[] = [{ ...iconNode('copy', 14), cls: [bc.icon, cb.icon, cb.on] }, { ...iconNode('check', 14), cls: [bc.icon, cb.icon] }];
    if (pr.label) kids.push(pr.label as string);
    return n('button', pr.variant === 'ghost' ? [cb.root, `${cb.root}--ghost`] : [cb.root], kids, { type: 'button', 'data-p8': 'copy', 'data-copy': pr.text as string, 'aria-label': pr.label ? (pr.label as string) : 'Copy' });
  },
};
