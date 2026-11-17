import { v } from '../tokens/theme';
import { avatar } from './display';
import { menu } from './display';
import { iconButton } from './bits';
import { P, focus, hiddenRule, lines, motion, n, p, ringDecl, text } from './shared';
import { iconRule } from './button';
import type { ComponentDef, Node, Props } from './types';

/* ---------- Carousel ---------- */
const ca = { root: `${p}-carousel`, track: `${p}-carousel__track`, slide: `${p}-carousel__slide`, nav: `${p}-carousel__nav` };
export const carousel: ComponentDef = {
  id: 'carousel', name: 'Carousel', description: 'A swipeable row of slides with previous and next buttons.', tags: ['layout', 'content'], status: 'stable',
  usage: 'Swipe, scroll, use the arrow buttons or the Left/Right keys on the track. Slides snap into place. Slides are placeholders; put your own cards inside.',
  composition: 'Previous and next are Icon Buttons.',
  props: [P.select('slides', ['3', '5', '8'], '5', 'Number of placeholder slides.'), P.select('perView', ['1', '2'], '1', 'Slides visible at once.')],
  rules: [
    { cls: ca.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), width: v('size-400'), 'max-width': '100%' } },
    { cls: ca.track, base: { display: 'flex', gap: v('space-12'), 'overflow-x': 'auto', 'scroll-snap-type': 'x mandatory', 'scrollbar-width': 'none', 'border-radius': v('radius-8') }, focus,
      nested: [{ sel: '::-webkit-scrollbar', decls: { display: 'none' } }] },
    { cls: ca.slide, base: { flex: '0 0 100%', 'scroll-snap-align': 'start', display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'box-sizing': 'border-box', 'min-height': v('size-160'), 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-surface'), color: v('color-ink'), ...ringDecl, ...text('sm') } },
    { cls: `${ca.slide}--half`, base: { flex: `0 0 calc((100% - ${v('space-12')}) / 2)` } },
    { cls: ca.nav, base: { display: 'flex', 'justify-content': 'flex-end', gap: v('space-8') } },
  ],
  render(pr: Props): Node {
    const half = pr.perView === '2';
    const slides = Array.from({ length: Number(pr.slides) }, (_, i) => n('div', half ? [ca.slide, `${ca.slide}--half`] : [ca.slide], [`Slide ${i + 1}`], { role: 'group', 'aria-roledescription': 'slide', 'aria-label': `${i + 1} of ${pr.slides}` }));
    const btn = (icon: 'chevron-left' | 'chevron-right', dir: string, label: string): Node => {
      const b = iconButton.render({ icon, label, size: '16', variant: 'default', disabled: dir === '-1' });
      return { ...b, attrs: { ...b.attrs, 'data-dir': dir } };
    };
    return n('div', [ca.root], [
      n('div', [ca.track], slides, { 'data-track': true, tabindex: '0', 'aria-label': 'Slides' }),
      n('div', [ca.nav], [btn('chevron-left', '-1', 'Previous slide'), btn('chevron-right', '1', 'Next slide')]),
    ], { role: 'region', 'aria-roledescription': 'carousel', 'aria-label': 'Carousel', 'data-p8': 'carousel' });
  },
};

/* ---------- Timeline ---------- */
const tl = { root: `${p}-timeline`, item: `${p}-timeline__item`, dot: `${p}-timeline__dot`, body: `${p}-timeline__body`, title: `${p}-timeline__title`, time: `${p}-timeline__time`, detail: `${p}-timeline__detail` };
export const timeline: ComponentDef = {
  id: 'timeline', name: 'Timeline', description: 'Events in order, like an activity feed.', tags: ['content', 'data'], status: 'stable',
  usage: 'Write each event as "Title | Time | Detail" (detail is optional). Newest first or oldest first is up to you; the list is read in the order written.',
  props: [P.area('items', 'Created | 09:00\nReviewed | 10:30 | Two comments\nPublished | 12:00', 'One event per line: Title | Time | Detail.', 'string (one per line)')],
  rules: [
    { cls: tl.root, base: { display: 'flex', 'flex-direction': 'column', margin: '0', padding: '0', 'list-style': 'none', width: v('size-400'), 'max-width': '100%', color: v('color-ink'), ...text('sm') } },
    { cls: tl.item, base: { display: 'flex', gap: v('space-12'), 'padding-bottom': v('space-12') } },
    { cls: tl.dot, base: { 'flex-shrink': '0', width: v('size-16'), display: 'flex', 'flex-direction': 'column', 'align-items': 'center' },
      nested: [{ sel: '::before', decls: { content: "''", width: v('space-8'), height: v('space-8'), 'margin-top': v('space-4'), 'border-radius': v('radius-full'), background: v('color-ink') } }, { sel: '::after', decls: { content: "''", flex: '1', 'border-left': `${v('border-hairline')} solid ${v('color-ring')}`, 'margin-top': v('space-4') } }] },
    { cls: tl.body, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'min-width': '0' } },
    { cls: tl.title, base: { 'font-weight': v('type-weight-strong') } },
    { cls: tl.time, base: { color: v('color-ink-muted'), 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
    { cls: tl.detail, base: { color: v('color-ink-muted') } },
    { cls: `${tl.item}--last`, base: { 'padding-bottom': '0' }, nested: [{ sel: ` .${tl.dot}::after`, decls: { display: 'none' } }] },
  ],
  render(pr: Props): Node {
    const rows = lines(pr.items).map((l) => l.split('|').map((x) => x.trim()));
    return n('ol', [tl.root], rows.map(([title, time, detail], i) => n('li', i === rows.length - 1 ? [tl.item, `${tl.item}--last`] : [tl.item], [
      n('span', [tl.dot], [], { 'aria-hidden': 'true' }),
      n('div', [tl.body], [n('span', [tl.title], [title]), ...(time ? [n('span', [tl.time], [time])] : []), ...(detail ? [n('span', [tl.detail], [detail])] : [])]),
    ])));
  },
};

/* ---------- Context menu ---------- */
const cx = { root: `${p}-context`, area: `${p}-context__area`, panel: `${p}-context__panel` };
export const contextMenu: ComponentDef = {
  id: 'context-menu', name: 'Context Menu', description: 'The right-click menu.', tags: ['overlay', 'navigation'], status: 'stable',
  usage: 'Right-click (or press the Menu key / Shift+F10) in the area. The menu opens at the pointer; arrows move, Enter chooses, Escape or an outside click closes it.',
  composition: 'The panel is a Menu.',
  props: [
    P.text('label', 'Right-click here', 'Text in the target area.'),
    P.area('items', 'Copy | ⌘C\nPaste | ⌘V\n---\nDelete | ⌫', 'Menu items; add " | shortcut" for a hint.', 'string (one per line)'),
    P.bool('open', true, 'Show the menu initially (at the top-left of the area).'),
  ],
  rules: [
    { cls: cx.root, base: { position: 'relative', display: 'inline-block', width: v('size-400'), 'max-width': '100%' } },
    { cls: cx.area, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'box-sizing': 'border-box', 'min-height': v('size-160'), 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-surface'), color: v('color-ink-muted'), ...ringDecl, ...text('sm') }, focus },
    { cls: cx.panel, base: { position: 'absolute', left: v('space-24'), top: v('space-24'), 'z-index': '40' }, nested: [hiddenRule] },
  ],
  render(pr: Props): Node {
    const panel = n('div', [cx.panel], [menu.render({ items: pr.items, active: '' })], pr.open ? { 'data-panel': true } : { 'data-panel': true, hidden: true });
    return n('div', [cx.root], [n('div', [cx.area], [pr.label as string], { 'data-area': true, tabindex: '0', 'aria-haspopup': 'menu', 'aria-expanded': String(Boolean(pr.open)) }), panel], { 'data-p8': 'context' });
  },
};

/* ---------- Hover card ---------- */
const hc = { root: `${p}-hovercard`, trigger: `${p}-hovercard__trigger`, wrap: `${p}-hovercard__wrap`, card: `${p}-hovercard__card`, text: `${p}-hovercard__text`, title: `${p}-hovercard__title`, body: `${p}-hovercard__body`, open: `${p}-hovercard__wrap--open` };
export const hoverCard: ComponentDef = {
  id: 'hover-card', name: 'Hover Card', description: 'A richer tooltip: a small preview card on hover or focus.', tags: ['overlay', 'content'], status: 'stable',
  usage: 'Shows on hover and keyboard focus and stays open while the pointer is over the card. Use it for previews (a person, a link), not for essential information.',
  composition: 'Contains an Avatar.',
  props: [
    P.text('trigger', '@primitive', 'The link text that opens the card.'),
    P.text('title', 'Primitive 8', 'Card heading (also the avatar initials).'),
    P.area('body', 'A short preview of what this link points to.', 'Card body.'),
    P.bool('open', false, 'Keep the card visible.'),
  ],
  rules: [
    { cls: hc.root, base: { position: 'relative', display: 'inline-block' } },
    { cls: hc.trigger, base: { color: v('color-ink'), 'text-decoration': 'underline', ...text('sm') }, focus },
    { cls: hc.wrap, base: { position: 'absolute', top: '100%', left: '0', 'padding-top': v('space-8'), 'z-index': '40', opacity: '0', 'pointer-events': 'none', transition: `opacity ${motion}` }, parent: { cls: hc.root, hover: { opacity: '1', 'pointer-events': 'auto' } } },
    { cls: hc.open, base: { opacity: '1', 'pointer-events': 'auto' } },
    { cls: hc.card, base: { display: 'flex', gap: v('space-12'), 'box-sizing': 'border-box', width: v('size-320'), 'max-width': '100vw', 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-canvas'), color: v('color-ink'), ...ringDecl, ...text('sm') } },
    { cls: hc.text, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'min-width': '0' } },
    { cls: hc.title, base: { 'font-weight': v('type-weight-strong') } },
    { cls: hc.body, base: { color: v('color-ink-muted') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const av = avatar.render({ name: pr.title, src: '', size: '40' });
    return n('span', [hc.root], [
      n('a', [hc.trigger], [pr.trigger as string], { href: '#' }),
      n('span', pr.open ? [hc.wrap, hc.open] : [hc.wrap], [n('span', [hc.card], [av, n('span', [hc.text], [n('span', [hc.title], [pr.title as string]), n('span', [hc.body], [pr.body as string])])], { role: 'tooltip' })]),
    ]);
  },
};
