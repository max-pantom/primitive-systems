import { components, templates } from '../components';

const SYNONYMS: Record<string, string[]> = {
  modal: ['dialog'], popup: ['dialog', 'popover'], confirm: ['dialog'], drawer: ['sheet'], sidebar: ['sheet', 'sidebar-nav'], notification: ['toast', 'alert'], snackbar: ['toast'],
  toggle: ['switch', 'checkbox'], chip: ['tag'], pill: ['badge', 'tag'], label: ['badge', 'field'], dropdown: ['dropdown-menu', 'select'], autocomplete: ['combobox'], typeahead: ['combobox'],
  loading: ['spinner', 'skeleton', 'progress'], loader: ['spinner'], placeholder: ['skeleton'], percent: ['progress', 'progress-ring'], steps: ['stepper'], wizard: ['stepper'], onboarding: ['stepper'],
  pin: ['otp-input'], otp: ['otp-input'], 'one-time': ['otp-input'], verification: ['otp-input'], code: ['otp-input', 'copy-button'], quantity: ['number-input'], stars: ['rating'], review: ['rating'], faq: ['accordion'], metric: ['stat-card'], kpi: ['stat-card'],
  team: ['avatar-group'], users: ['avatar-group', 'avatar'], announcement: ['banner'], menu: ['menu', 'dropdown-menu'], nav: ['sidebar-nav', 'tabs', 'breadcrumbs'], navigation: ['sidebar-nav', 'tabs', 'breadcrumbs'],
  input: ['text-input', 'field'], form: ['field', 'text-input', 'select', 'checkbox'], password: ['text-input'], search: ['search-input', 'command-palette', 'combobox'], list: ['list-row', 'data-list'], grid: ['stack'], layout: ['stack', 'card', 'app-shell'],
  lightbox: ['image-viewer'], gallery: ['image-viewer', 'carousel'], zoom: ['image-viewer'], unfurl: ['link-preview'], preview: ['link-preview', 'hover-card'], bookmark: ['link-preview'], embed: ['link-preview'],
  button: ['button', 'icon-button'], login: ['sign-in'], signin: ['sign-in'], auth: ['sign-in'], 'sign-in': ['sign-in'], preferences: ['settings'], account: ['settings'], profile: ['settings'], analytics: ['dashboard', 'chart'], overview: ['dashboard'], inbox: ['list-detail'], 'master-detail': ['list-detail'], screen: ['sign-in', 'settings', 'dashboard', 'list-detail', 'empty-page'], page: ['sign-in', 'settings', 'dashboard', 'list-detail', 'empty-page'], chat: ['chat-message', 'chat-composer'], graph: ['chart', 'sparkline'], trend: ['sparkline', 'chart'], topbar: ['navbar'], header: ['navbar', 'app-shell'], validation: ['form'], danger: ['dialog', 'alert'], error: ['alert', 'field'], help: ['tooltip', 'popover'], copy: ['copy-button'], shortcut: ['kbd', 'command-palette'], hotkey: ['kbd'],
};

/** "I need X" → ranked components, with why. */
export function searchComponents(query: string, limit = 8) {
  const words = query.toLowerCase().split(/[^a-z0-9-]+/).filter((w) => w.length > 1);
  const scored = [...components, ...templates].map((c) => {
    let score = 0;
    const why: string[] = [];
    const bump = (n: number, w: string, where: string) => { score += n; why.push(`${w} (${where})`); };
    for (const w of words) {
      const hay = (s: string) => s.toLowerCase().includes(w);
      if (c.id === w || c.name.toLowerCase() === w) bump(8, w, 'name');
      else if (hay(c.id) || hay(c.name)) bump(5, w, 'name');
      if (c.tags.some((t) => t === w)) bump(4, w, 'tag');
      if (hay(c.description)) bump(2, w, 'description');
      if (hay(c.usage)) bump(1, w, 'usage');
      if (c.guidelines && [...c.guidelines.do, ...c.guidelines.dont].some(hay)) bump(1, w, 'guidelines');
      if ((SYNONYMS[w] ?? []).includes(c.id)) bump(6, w, 'related');
    }
    return { id: c.id, name: c.name, kind: c.tags.includes('template') ? 'template' : 'component', description: c.description, tags: c.tags, score, why };
  });
  return { query, results: scored.filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit) };
}

