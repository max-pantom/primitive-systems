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
const cp = { root: `${p}-palette`, input: `${p}-palette__input`, list: `${p}-palette__list`, item: `${p}-palette__item`, on: `${p}-palette__item--active`, group: `${p}-palette__group`, head: `${p}-palette__heading`, hint: `${p}-palette__hint`, empty: `${p}-palette__empty` };
const parseCommands = (s: unknown) => {
  const groups: { name: string; items: { label: string; hint: string }[] }[] = [{ name: '', items: [] }];
  for (const l of lines(s)) {
    if (l.startsWith('# ')) { groups.push({ name: l.slice(2).trim(), items: [] }); continue; }
    const [label, hint = ''] = l.split('|').map((x) => x.trim());
    groups[groups.length - 1].items.push({ label, hint });
  }
  return groups.filter((g) => g.items.length);
};
const commandItem = (label: string, hint: string, section: string, active: boolean, recent = false): Node =>
  n('button', active ? [cp.item, cp.on] : [cp.item], [n('span', [], [label], { 'data-label': true }), ...(hint ? [n('span', [cp.hint], [hint], { 'aria-hidden': 'true' })] : [])], { type: 'button', role: 'option', 'data-section': section, ...(recent ? { 'data-recent': true } : {}), ...(hint ? { 'aria-keyshortcuts': hint } : {}) });
export const commandPalette: ComponentDef = {
  id: 'command-palette', name: 'Command Palette', description: 'Search and run commands from the keyboard (Cmd/Ctrl + K), in sections, with shortcuts and recents.', tags: ['navigation', 'overlay'], status: 'stable',
  usage: 'Type to filter (sections with no match disappear), ↑ ↓ to move, Enter to run, Escape to close. Start a line with "# " for a section, add " | ⌘N" for a shortcut hint. Recent commands (the recent prop, then whatever you run) show first until you type. Running fires p8-run with { command, section } and closes the palette. With the backdrop on, Cmd/Ctrl+K toggles it.',
  props: [
    P.text('placeholder', 'Type a command', 'Input placeholder.'),
    P.area('items', '# Navigate\nGo to Overview | G O\nGo to Projects | G P\n# Actions\nCreate project | ⌘N\nInvite people\nOpen settings | ⌘,', 'Commands one per line. "# Name" starts a section, "Label | shortcut" adds a hint.', 'string (one per line)'),
    P.area('recent', 'Create project', 'Recent commands, one per line, shown first. Empty for none.', 'string (one per line)'),
    P.bool('backdrop', true, 'Wrap in a dimmed full-screen backdrop.'),
  ],
  rules: [
    ...overlayRules,
    { cls: cp.root, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-8'), 'box-sizing': 'border-box', width: v('size-400'), 'max-width': '100%', padding: v('space-8'), 'border-radius': v('radius-12'), background: v('color-canvas'), color: v('color-ink'), ...ringDecl } },
    { cls: cp.input, base: { 'box-sizing': 'border-box', width: '100%', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), border: 'none', 'border-radius': v('radius-8'), background: v('color-control'), color: v('color-ink'), ...text('sm') }, focus: { outline: 'none', background: v('color-control-strong') }, placeholder: { color: v('color-placeholder') } },
    { cls: cp.list, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'max-height': v('size-320'), 'overflow-y': 'auto' } },
    { cls: cp.group, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4') }, nested: [{ sel: '[hidden]', decls: { display: 'none' } }] },
    { cls: cp.head, base: { 'padding-block': v('space-4'), 'padding-inline': v('space-12'), color: v('color-ink-muted'), ...text('sm') } },
    { cls: cp.item, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12'), 'text-align': 'left', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus, nested: [{ sel: '[hidden]', decls: { display: 'none' } }] },
    { cls: cp.on, base: { background: v('color-control-strong') } },
    { cls: cp.hint, base: { color: v('color-ink-muted'), 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
    { cls: cp.empty, base: { margin: '0', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), color: v('color-ink-muted'), ...text('sm') }, nested: [{ sel: '[hidden]', decls: { display: 'none' } }] },
  ],
  render(pr: Props): Node {
    const groups = parseCommands(pr.items);
    const hintOf = (label: string) => groups.flatMap((g) => g.items).find((i) => i.label === label)?.hint ?? '';
    const recents = lines(pr.recent).slice(0, 3);
    let first = true;
    const take = () => { const f = first; first = false; return f; };
    const section = (name: string, kids: Node[], extra: Node['attrs'] = {}): Node => n('div', [cp.group], [...(name ? [n('div', [cp.head], [name], { 'aria-hidden': 'true' })] : []), ...kids], { role: 'group', 'aria-label': name || 'Commands', ...extra });
    const panel = n('div', [cp.root], [
      n('input', [cp.input], undefined, { type: 'text', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'palette-list', placeholder: pr.placeholder as string, 'aria-label': 'Command' }),
      n('div', [cp.list], [
        section('Recent', recents.map((l) => commandItem(l, hintOf(l), 'Recent', take(), true)), recents.length ? { 'data-group': 'recent' } : { 'data-group': 'recent', hidden: true }),
        ...groups.map((g) => section(g.name, g.items.map((i) => commandItem(i.label, i.hint, g.name, take())))),
        n('p', [cp.empty], ['No commands match.'], { 'data-empty': true, hidden: true, role: 'status' }),
        n('template', [], [commandItem('__label__', '', 'Recent', false, true)], { 'data-item-template': true }),
      ], { role: 'listbox', id: 'palette-list' }),
    ], { role: 'dialog', 'aria-label': 'Command palette', 'data-p8': 'palette' });
    return pr.backdrop ? n('div', [ov.root], [panel], { 'data-p8': 'overlay', 'data-hotkey': true }) : panel;
  },
};
