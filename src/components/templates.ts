/**
 * TEMPLATES: ready-made screens composed from the components. Agents request a whole screen
 * (sign-in, settings, dashboard, list-to-detail, empty page) instead of assembling parts.
 * A template is a ComponentDef, so it is generated for all six frameworks, carries its behavior,
 * and is held to the same rule book and accessibility checks as every component.
 */
import { v } from '../tokens/theme';
import { button } from './button';
import { divider } from './forms';
import { switchC } from './forms';
import { statCard } from './more';
import { table } from './data';
import { sidebarNav } from './nav';

import { link, heading, textC } from './kit';
import { form, chart, emptyState, navbar } from './screens';
import { P, hiddenRule, lines, n, p, ringDecl, text } from './shared';
import { defaultsOf } from './types';
import type { ComponentDef, Node, Props, Rule } from './types';

const r = (d: ComponentDef, o: Props = {}): Node => d.render({ ...defaultsOf(d.props), ...o });
const h = (level: number, t: string, description = '', size: 'md' | 'sm' = 'md') => r(heading, { text: t, level: String(level), size, description });
const t = (txt: string, tone = 'default', size = 'sm') => r(textC, { text: txt, tone, size, as: 'p' });
const btn = (label: string, variant: string, extra: Node['attrs'] = {}, fullWidth = false): Node => { const b = r(button, { label, variant, fullWidth }); return { ...b, attrs: { ...b.attrs, ...extra } }; };
const lnk = (label: string, href = '#') => r(link, { label, href });
const T = (id: string) => `${p}-tpl-${id}`;

const page: Rule[] = [
  { cls: T('page'), base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), 'box-sizing': 'border-box', width: '100%', 'max-width': v('size-500'), color: v('color-ink') } },
  { cls: T('bar'), base: { display: 'flex', 'align-items': 'center', 'justify-content': 'space-between', gap: v('space-12') } },
  { cls: T('grid'), base: { display: 'grid', 'grid-template-columns': `repeat(auto-fit, minmax(${v('size-160')}, 1fr))`, gap: v('space-12') } },
  { cls: T('center'), base: { display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'box-sizing': 'border-box', width: '100%', 'min-height': v('size-320'), 'padding-block': v('space-24'), 'padding-inline': v('space-16') } },
  { cls: T('panel'), base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), 'box-sizing': 'border-box', width: v('size-400'), 'max-width': '100%', padding: v('space-16'), 'border-radius': v('radius-12'), background: v('color-surface'), color: v('color-ink'), ...ringDecl } },
  { cls: T('row'), base: { display: 'flex', 'align-items': 'center', gap: v('space-12'), 'flex-wrap': 'wrap' } },
  { cls: T('split'), base: { display: 'flex', 'flex-wrap': 'wrap', gap: v('space-12'), width: '100%', 'max-width': v('size-500'), color: v('color-ink') } },
  { cls: T('main'), base: { flex: `1 1 ${v('size-320')}`, 'min-width': '0' } },
  { cls: T('section'), base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), 'min-width': '0' } },
  { cls: T('danger'), base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), 'box-sizing': 'border-box', 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-surface'), ...ringDecl } },
  { cls: T('prefs'), base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12') } },
  { cls: T('foot'), base: { display: 'flex', 'justify-content': 'center', 'flex-wrap': 'wrap', gap: v('space-4'), color: v('color-ink-muted'), ...text('sm') } },
  { cls: T('wide'), base: { 'min-width': '0', overflow: 'auto' } },
];

/* ---------- Sign-in ---------- */
export const signIn: ComponentDef = {
  id: 'sign-in', name: 'Sign-in', description: 'A centered sign-in card: email, password, forgot link, SSO and a sign-up line.', tags: ['template', 'auth', 'page'], status: 'stable',
  usage: 'Put it on an empty page. The form validates on submit and fires p8-submit with { values, done } (call event.preventDefault(), sign the user in, then done({ ok: true }) or done({ errors: { email: "…" } })). Set sso off to drop the SSO button.',
  uses: ['heading', 'form', 'link', 'divider', 'button', 'text'],
  props: [
    P.text('title', 'Sign in', 'Page heading.'),
    P.text('subtitle', 'Welcome back. Enter your details to continue.', 'Line under the heading.'),
    P.bool('remember', true, 'Show the "Keep me signed in" checkbox.'),
    P.bool('sso', true, 'Show the "Continue with SSO" button.'),
    P.bool('signup', true, 'Show the "Create an account" line.'),
  ],
  rules: page,
  render(pr: Props): Node {
    const fields = ['Email | email | required', 'Password | password | required', ...(pr.remember ? ['Keep me signed in | checkbox'] : [])].join('\n');
    return n('div', [T('center')], [n('section', [T('panel')], [
      h(1, pr.title as string, pr.subtitle as string),
      r(form, { fields, submit: 'Sign in', success: 'Signed in.' }),
      n('div', [T('row')], [lnk('Forgot your password?')]),
      ...(pr.sso ? [r(divider, { orientation: 'horizontal', label: 'or', spacing: 'none' }), btn('Continue with SSO', 'ghost', { 'data-action': 'sso' }, true)] : []),
      ...(pr.signup ? [n('p', [T('foot')], ['No account yet?', lnk('Create one')])] : []),
    ], { 'aria-label': pr.title as string, 'data-p8': 'action' })]);
  },
};

/* ---------- Settings ---------- */
export const settingsPage: ComponentDef = {
  id: 'settings', name: 'Settings page', description: 'Sidebar of sections with a profile form, notification switches and a danger zone.', tags: ['template', 'page', 'form'], status: 'stable',
  usage: 'The sidebar lists the sections; this template shows Profile, Notifications and the danger zone together so you can copy the parts you need. Each switch toggles on its own; the profile form fires p8-submit.',
  uses: ['sidebar-nav', 'heading', 'form', 'switch', 'button', 'text'],
  props: [
    P.area('sections', 'Profile\nAccount\nNotifications\nBilling', 'Sidebar sections, one per line.', 'string (one per line)'),
    P.text('active', 'Profile', 'Current section.'),
    P.area('preferences', 'Email me about product updates\nEmail me when someone mentions me\nSend a weekly summary', 'Notification switches, one per line.', 'string (one per line)'),
    P.bool('danger', true, 'Show the delete-account section.'),
  ],
  rules: page,
  render(pr: Props): Node {
    return n('div', [T('split')], [
      r(sidebarNav, { items: lines(pr.sections).join('\n'), active: pr.active }),
      n('div', [T('page'), T('main')], [
        n('section', [T('section')], [h(2, 'Profile', 'How you appear to others.'), r(form, { fields: 'Display name | text | required\nEmail | email | required\nBio | textarea', submit: 'Save changes', success: 'Profile saved.' })], { 'aria-label': 'Profile' }),
        r(divider, { orientation: 'horizontal', label: '', spacing: 'none' }),
        n('section', [T('section')], [h(2, 'Notifications', 'Choose what we email you about.'), n('div', [T('prefs')], lines(pr.preferences).map((x, i) => r(switchC, { label: x, checked: i === 0, disabled: false })))], { 'aria-label': 'Notifications' }),
        ...(pr.danger ? [r(divider, { orientation: 'horizontal', label: '', spacing: 'none' }), n('section', [T('danger')], [h(2, 'Delete account', 'Permanently remove your account and all its data. This cannot be undone.', 'sm'), n('div', [T('row')], [btn('Delete account', 'ghost', { 'data-action': 'delete-account' })])], { 'aria-label': 'Danger zone', 'data-p8': 'action' })] : []),
      ]),
    ]);
  },
};

/* ---------- Dashboard ---------- */
export const dashboard: ComponentDef = {
  id: 'dashboard', name: 'Dashboard', description: 'A page header, three stat cards, a chart and a recent-activity table.', tags: ['template', 'page', 'data'], status: 'stable',
  usage: 'Change the numbers and the table rows; the chart reads its data from one small table (first line names the columns). Keep three stat cards; add rows, not more cards.',
  uses: ['heading', 'button', 'stat-card', 'sparkline', 'chart', 'table'],
  props: [
    P.text('title', 'Overview', 'Page heading.'),
    P.text('action', 'New report', 'Header action. Empty to omit.'),
    P.area('stats', 'Revenue | 12,400 | 12% | up\nSignups | 1,820 | 4% | up\nChurn | 2.1% | 0.3% | down', 'Three stats: "Label | Value | Change | up/down/flat".', 'string (one per line)'),
    P.area('chart', 'Month | Revenue | Costs\nJan | 120 | 80\nFeb | 150 | 95\nMar | 170 | 110\nApr | 140 | 100\nMay | 190 | 120\nJun | 230 | 130', 'Chart data (see Chart).', 'string (one per line)'),
    P.area('activity', 'Event | Owner | When\nInvoice 1042 paid | Ada | 2 min ago\nNew signup | Alan | 1 hour ago\nPlan upgraded | Grace | Yesterday', 'Recent activity table (see Table).', 'string (one per line)'),
  ],
  rules: page,
  render(pr: Props): Node {
    const stats = lines(pr.stats).slice(0, 3).map((l) => { const [label = '', value = '', change = '', trend = 'flat'] = l.split('|').map((x) => x.trim()); return r(statCard, { label, value, change, trend: ['up', 'down', 'flat'].includes(trend) ? trend : 'flat' }); });
    return n('div', [T('page')], [
      n('div', [T('bar')], [h(1, pr.title as string), ...(pr.action ? [btn(pr.action as string, 'primary', { 'data-action': pr.action as string })] : [])]),
      n('div', [T('grid')], stats),
      n('div', [T('wide')], [r(chart, { title: 'Revenue vs costs', type: 'bar', data: pr.chart, legend: true })]),
      n('section', [T('section')], [h(2, 'Recent activity', '', 'sm'), n('div', [T('wide')], [r(table, { rows: pr.activity, header: true })])]),
    ], { 'data-p8': 'action' });
  },
};


/* ---------- List to detail ---------- */
const ld = { root: T('master'), list: T('master-list'), row: T('master-row'), on: T('master-row--active'), detail: T('master-detail'), meta: T('master-meta') };
export const listDetail: ComponentDef = {
  id: 'list-detail', name: 'List to detail', description: 'A list on the left; choosing a row shows its detail on the right.', tags: ['template', 'page', 'navigation'], status: 'stable',
  usage: 'Write each item as "Title | Meta | Detail". Click a row or use the arrow keys to move; the detail panel switches and the row carries aria-current. On narrow screens the list stacks above the detail.',
  uses: ['list-row', 'heading', 'text', 'button'],
  props: [
    P.area('items', 'Order 1042 | Paid | Placed on 12 Nov by Ada Lovelace. Two items, shipped to London.\nOrder 1041 | Pending | Waiting for payment confirmation from the bank.\nOrder 1040 | Refunded | Refunded on 9 Nov at the customer\'s request.', 'One per line: "Title | Meta | Detail".', 'string (one per line)'),
    P.text('selected', 'Order 1042', 'Title of the item shown first.'),
    P.text('action', 'Open order', 'Button in the detail panel. Empty to omit.'),
  ],
  rules: [
    ...page,
    { cls: ld.root, base: { display: 'grid', 'grid-template-columns': `repeat(auto-fit, minmax(${v('size-240')}, 1fr))`, gap: v('space-12'), width: '100%', 'max-width': v('size-500'), color: v('color-ink'), ...text('sm') } },
    { cls: ld.list, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4') } },
    { cls: ld.row, base: { display: 'flex', 'flex-direction': 'column', 'align-items': 'flex-start', gap: v('space-4'), width: '100%', 'box-sizing': 'border-box', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink'), 'text-align': 'left', cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus: { 'box-shadow': `0 0 0 ${v('border-focus')} ${v('color-ring-focus')}` } },
    { cls: ld.on, base: { background: v('color-control-strong') } },
    { cls: ld.meta, base: { color: v('color-ink-muted') } },
    { cls: ld.detail, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-12'), 'box-sizing': 'border-box', 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-surface'), ...ringDecl }, nested: [hiddenRule] },
  ],
  render(pr: Props): Node {
    const items = lines(pr.items).map((l, i) => { const [title = '', meta = '', detail = ''] = l.split('|').map((x) => x.trim()); return { id: `detail-${i}`, title, meta, detail }; });
    const first = Math.max(0, items.findIndex((x) => x.title === pr.selected));
    return n('div', [ld.root], [
      n('div', [ld.list], items.map((x, i) => n('button', i === first ? [ld.row, ld.on] : [ld.row], [n('span', [], [x.title]), n('span', [ld.meta], [x.meta])], { type: 'button', 'data-target': x.id, 'aria-controls': x.id, ...(i === first ? { 'aria-current': 'true' } : {}) })), { role: 'group', 'aria-label': 'Items' }),
      n('div', [T('section')], items.map((x, i) => n('article', [ld.detail], [h(2, x.title, x.meta), t(x.detail), ...(pr.action ? [n('div', [T('row')], [btn(pr.action as string, 'default', { 'data-action': `${pr.action}: ${x.title}` })])] : [])], i === first ? { id: x.id, 'data-detail': true, 'aria-label': x.title } : { id: x.id, 'data-detail': true, 'aria-label': x.title, hidden: true }))),
    ], { 'data-p8': 'listdetail action' });
  },
};

/* ---------- Empty page ---------- */
export const emptyPage: ComponentDef = {
  id: 'empty-page', name: 'Empty page', description: 'A navbar over a centered empty state: what to show a new user with nothing yet.', tags: ['template', 'page', 'feedback'], status: 'stable',
  usage: 'Use for first-run screens. Say what will appear and give one clear action; the secondary action is for importing. Both fire p8-action.',
  uses: ['navbar', 'empty-state'],
  props: [
    P.text('brand', 'Acme', 'Product name in the navbar.'),
    P.text('active', 'Projects', 'Current page.'),
    P.text('title', 'No projects yet', 'What is missing.'),
    P.text('description', 'Projects keep tasks, files and people together. Create one to get started.', 'Why it is empty and what to do.'),
    P.text('action', 'New project', 'Primary action.'),
    P.text('secondary', 'Import projects', 'Secondary action. Empty to omit.'),
  ],
  rules: page,
  render(pr: Props): Node {
    return n('div', [T('page')], [
      r(navbar, { brand: pr.brand, links: 'Overview\nProjects\nTeam\nSettings', active: pr.active, action: '', search: true, user: 'Ada Lovelace' }),
      n('div', [T('center')], [r(emptyState, { icon: 'folder', title: pr.title, description: pr.description, action: pr.action, secondary: pr.secondary, variant: 'plain' })]),
    ]);
  },
};

export const templates: ComponentDef[] = [signIn, settingsPage, dashboard, listDetail, emptyPage];

