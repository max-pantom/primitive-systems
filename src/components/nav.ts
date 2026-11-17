import { v } from '../tokens/theme';
import { iconNode, iconRule } from './button';
import { ov, overlayRules } from './display';
import { P, focus, lines, n, p, ringDecl, text } from './shared';
import type { ComponentDef, Node, Props } from './types';

/* ---------- Sidebar nav ---------- */
const sn = { root: `${p}-sidenav`, item: `${p}-sidenav__item`, on: `${p}-sidenav__item--active`, head: `${p}-sidenav__heading` };
export const sidebarNav: ComponentDef = {
  id: 'sidebar-nav', name: 'Sidebar Nav', description: 'Vertical list of links with the current page highlighted.', tags: ['navigation'], status: 'stable',
  usage: 'Start a line with "# " for a group heading. The active item gets aria-current="page".',
  props: [
    P.area('items', '# Workspace\nOverview\nProjects\nSettings', 'Links one per line; "# " makes a heading.', 'string (one per line)'),
    P.text('active', 'Overview', 'Label of the current page.'),
  ],
  rules: [
    { cls: sn.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), width: v('size-240'), 'box-sizing': 'border-box', ...text('sm') } },
    { cls: sn.head, base: { 'padding-inline': v('space-12'), 'padding-block': v('space-8'), color: v('color-ink-muted') } },
    { cls: sn.item, base: { 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), color: v('color-ink-muted'), 'text-decoration': 'none' }, hover: { color: v('color-ink'), background: v('color-control') }, focus },
    { cls: sn.on, base: { color: v('color-ink'), background: v('color-control-strong') } },
  ],
  render(pr: Props): Node {
    const kids = lines(pr.items).map((l) =>
      l.startsWith('# ') ? n('div', [sn.head], [l.slice(2)]) : n('a', l === pr.active ? [sn.item, sn.on] : [sn.item], [l], l === pr.active ? { href: '#', 'aria-current': 'page' } : { href: '#' }));
    return n('nav', [sn.root], kids, { 'aria-label': 'Sidebar' });
  },
};

/* ---------- Breadcrumbs ---------- */
const bcr = { root: `${p}-breadcrumbs`, link: `${p}-breadcrumbs__link`, sep: `${p}-breadcrumbs__sep`, cur: `${p}-breadcrumbs__current` };
export const breadcrumbs: ComponentDef = {
  id: 'breadcrumbs', name: 'Breadcrumbs', description: 'Shows where the current page sits in the hierarchy.', tags: ['navigation'], status: 'stable',
  usage: 'The last item is the current page (aria-current) and is not a link.',
  props: [P.area('items', 'Home\nProjects\nPrimitive', 'Crumbs one per line, in order.', 'string (one per line)')],
  rules: [
    { cls: bcr.root, base: { display: 'flex', 'align-items': 'center', gap: v('space-8'), margin: '0', padding: '0', 'list-style': 'none', ...text('sm') } },
    { cls: bcr.link, base: { color: v('color-ink-muted'), 'text-decoration': 'none' }, hover: { color: v('color-ink') }, focus },
    { cls: bcr.sep, base: { display: 'inline-flex', color: v('color-ink-muted') } },
    { cls: bcr.cur, base: { color: v('color-ink') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const items = lines(pr.items);
    const kids: Node[] = [];
    items.forEach((l, idx) => {
      const last = idx === items.length - 1;
      kids.push(n('li', [], [last ? n('span', [bcr.cur], [l], { 'aria-current': 'page' }) : n('a', [bcr.link], [l], { href: '#' })]));
      if (!last) kids.push(n('li', [bcr.sep], [iconNode('chevron-right', 14)], { 'aria-hidden': 'true' }));
    });
    return n('nav', [], [n('ol', [bcr.root], kids)], { 'aria-label': 'Breadcrumb' });
  },
};

/* ---------- Pagination ---------- */
const pg = { root: `${p}-pager`, btn: `${p}-pager__btn`, page: `${p}-pager__page`, on: `${p}-pager__page--active` };
export const pagination: ComponentDef = {
  id: 'pagination', name: 'Pagination', description: 'Move between pages of results.', tags: ['navigation'], status: 'stable',
  usage: 'Click a page or use the arrows; the current page carries aria-current="page".',
  props: [P.select('pages', ['3', '5', '7', '10'], '5', 'Number of pages.'), P.text('current', '1', 'Current page number.')],
  rules: [
    { cls: pg.root, base: { display: 'flex', 'align-items': 'center', gap: v('space-4') } },
    { cls: pg.btn, base: { display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'min-width': v('size-32'), height: v('size-32'), 'box-sizing': 'border-box', 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), border: 'none', background: 'transparent', color: v('color-ink-muted'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control'), color: v('color-ink') }, focus },
    { cls: pg.page, base: {} },
    { cls: pg.on, base: { background: v('color-control-strong'), color: v('color-ink') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const total = Number(pr.pages);
    const cur = Math.min(total, Math.max(1, Number(pr.current) || 1));
    const pages = Array.from({ length: total }, (_, idx) => {
      const on = idx + 1 === cur;
      return n('button', on ? [pg.btn, pg.page, pg.on] : [pg.btn, pg.page], [String(idx + 1)], on ? { type: 'button', 'data-page': true, 'aria-current': 'page' } : { type: 'button', 'data-page': true });
    });
    const arrow = (icon: 'chevron-left' | 'chevron-right', step: string, label: string) =>
      n('button', [pg.btn], [iconNode(icon, 14)], { type: 'button', 'data-step': step, 'aria-label': label });
    return n('nav', [pg.root], [arrow('chevron-left', '-1', 'Previous page'), ...pages, arrow('chevron-right', '1', 'Next page')], { 'aria-label': 'Pagination', 'data-p8': 'pager' });
  },
};

/* ---------- Command palette ---------- */
const cp = { root: `${p}-palette`, input: `${p}-palette__input`, list: `${p}-palette__list`, item: `${p}-palette__item`, on: `${p}-palette__item--active` };
export const commandPalette: ComponentDef = {
  id: 'command-palette', name: 'Command Palette', description: 'Search and run commands from the keyboard (Cmd/Ctrl + K).', tags: ['navigation', 'overlay'], status: 'stable',
  usage: 'Type to filter, arrows to move, Enter to run, Escape to close. With the backdrop on, Cmd/Ctrl+K toggles it.',
  props: [
    P.text('placeholder', 'Type a command', 'Input placeholder.'),
    P.area('items', 'Go to Overview\nCreate project\nOpen settings', 'Commands one per line.', 'string (one per line)'),
    P.bool('backdrop', true, 'Wrap in a dimmed full-screen backdrop.'),
  ],
  rules: [
    ...overlayRules,
    { cls: cp.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-8'), 'box-sizing': 'border-box', width: v('size-400'), 'max-width': '100%', padding: v('space-8'), 'border-radius': v('radius-12'), background: v('color-canvas'), color: v('color-ink'), ...ringDecl } },
    { cls: cp.input, base: { 'box-sizing': 'border-box', width: '100%', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), border: 'none', 'border-radius': v('radius-8'), background: v('color-control'), color: v('color-ink'), ...text('sm') }, focus: { outline: 'none', background: v('color-control-strong') }, placeholder: { color: v('color-placeholder') } },
    { cls: cp.list, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4') } },
    { cls: cp.item, base: { 'text-align': 'left', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus },
    { cls: cp.on, base: { background: v('color-control-strong') } },
  ],
  render(pr: Props): Node {
    const opts = lines(pr.items).map((l, idx) => n('button', idx === 0 ? [cp.item, cp.on] : [cp.item], [l], { type: 'button', role: 'option' }));
    const panel = n('div', [cp.root], [
      n('input', [cp.input], undefined, { type: 'text', role: 'combobox', 'aria-expanded': 'true', placeholder: pr.placeholder as string, 'aria-label': 'Command' }),
      n('div', [cp.list], opts, { role: 'listbox' }),
    ], { role: 'dialog', 'aria-label': 'Command palette', 'data-p8': 'palette' });
    return pr.backdrop ? n('div', [ov.root], [panel], { 'data-p8': 'overlay', 'data-hotkey': true }) : panel;
  },
};
