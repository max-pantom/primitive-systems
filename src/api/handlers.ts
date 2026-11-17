import { z } from 'zod';
import { components, getDef, defaultsOf, parseProps } from '../components';
import type { ComponentDef, Node } from '../components';
import { site } from '../config/site';
import { EXCEPTIONS, GAPS, GRID_SPACE, RADII, RULES } from '../rules/rulebook';
import { buildTheme } from '../tokens/builder';
import { lintSpacing } from '../lint/spacing';
import { FRAMEWORKS, generate } from '../codegen';
import { flatTokens } from '../tokens/theme';

/** Shared by the MCP server and the HTTP API so both return identical payloads. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function listComponents() {
  return {
    components: components.map(({ id, name, description, tags, status, since, mark }) => ({ id, name, description, tags, status, since, mark: mark ?? null })),
  };
}

const detail = (d: ComponentDef) => ({
  id: d.id,
  name: d.name,
  description: d.description,
  tags: d.tags,
  status: d.status,
  usage: d.usage,
  guidelines: d.guidelines ?? null,
  since: d.since,
  mark: d.mark ?? null,
  composition: d.composition ?? null,
  props: d.props.map((p) => ({ name: p.name, type: p.type, default: p.default, description: p.description, control: p.control })),
  defaults: defaultsOf(d.props),
  frameworks: [...FRAMEWORKS],
});

export function getComponent(id: string) {
  const def = getDef(id);
  if (!def) throw new ApiError(404, `Unknown component: ${id}`);
  return detail(def);
}

export const getTokens = () => flatTokens();

const zodMessage = (e: z.ZodError) => e.issues.map((i) => (i.code === 'unrecognized_keys' ? `unknown prop(s): ${(i as unknown as { keys: string[] }).keys.join(', ')}` : `props.${i.path.join('.')}: ${i.message}`)).join('; ');

const codeInput = z.object({
  component: z.string(),
  framework: z.enum(FRAMEWORKS),
  props: z.record(z.string(), z.unknown()).optional(),
});

export function getCode(input: unknown) {
  const parsed = codeInput.safeParse(input);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; '));
  const def = getDef(parsed.data.component);
  if (!def) throw new ApiError(404, `Unknown component: ${parsed.data.component}`);
  try {
    return generate(def, parsed.data.props ?? {}, parsed.data.framework);
  } catch (e) {
    if (e instanceof z.ZodError) throw new ApiError(400, zodMessage(e));
    throw e;
  }
}

export const getRules = () => ({ rules: RULES, exceptions: EXCEPTIONS, grid: { space: GRID_SPACE, radius: RADII, gaps: GAPS }, guidelines: Object.fromEntries(components.map((c) => [c.id, c.guidelines])) });

const SYNONYMS: Record<string, string[]> = {
  modal: ['dialog'], popup: ['dialog', 'popover'], confirm: ['dialog'], drawer: ['sheet'], sidebar: ['sheet', 'sidebar-nav'], notification: ['toast', 'alert'], snackbar: ['toast'],
  toggle: ['switch', 'checkbox'], chip: ['tag'], pill: ['badge', 'tag'], label: ['badge', 'field'], dropdown: ['dropdown-menu', 'select'], autocomplete: ['combobox'], typeahead: ['combobox'],
  loading: ['spinner', 'skeleton', 'progress'], loader: ['spinner'], placeholder: ['skeleton'], percent: ['progress', 'progress-ring'], steps: ['stepper'], wizard: ['stepper'], onboarding: ['stepper'],
  pin: ['otp-input'], code: ['otp-input', 'copy-button'], quantity: ['number-input'], stars: ['rating'], review: ['rating'], faq: ['accordion'], metric: ['stat-card'], kpi: ['stat-card'],
  team: ['avatar-group'], users: ['avatar-group', 'avatar'], announcement: ['banner'], menu: ['menu', 'dropdown-menu'], nav: ['sidebar-nav', 'tabs', 'breadcrumbs'], navigation: ['sidebar-nav', 'tabs', 'breadcrumbs'],
  input: ['text-input', 'field'], form: ['field', 'text-input', 'select', 'checkbox'], password: ['text-input'], search: ['search-input', 'command-palette', 'combobox'], list: ['list-row', 'data-list'], grid: ['stack'], layout: ['stack', 'card'],
  button: ['button', 'icon-button'], danger: ['dialog', 'alert'], error: ['alert', 'field'], help: ['tooltip', 'popover'], copy: ['copy-button'], shortcut: ['kbd', 'command-palette'], hotkey: ['kbd'],
};

/** "I need X" → ranked components, with why. */
export function searchComponents(query: string, limit = 8) {
  const words = query.toLowerCase().split(/[^a-z0-9-]+/).filter((w) => w.length > 1);
  const scored = components.map((c) => {
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
    return { id: c.id, name: c.name, description: c.description, tags: c.tags, score, why };
  });
  return { query, results: scored.filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit) };
}

const composeInput = z.object({
  framework: z.enum(FRAMEWORKS),
  direction: z.enum(['column', 'row']).default('column'),
  gap: z.enum(['4', '8', '12']).default('12'),
  items: z.array(z.object({ component: z.string(), props: z.record(z.string(), z.unknown()).optional() })).min(1).max(30),
});

/** Several component instances composed into one ready-to-paste output (a Stack of them). */
export function composeCode(input: unknown) {
  const parsed = composeInput.safeParse(input);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues.map((i) => `${i.path.join('.') || 'input'}: ${i.message}`).join('; '));
  const { framework, direction, gap, items } = parsed.data;
  const nodes: Node[] = [];
  const p8: string[] = [];
  for (const it of items) {
    const def = getDef(it.component);
    if (!def) throw new ApiError(404, `Unknown component: ${it.component}`);
    try {
      const props = parseProps(def, it.props ?? {});
      nodes.push(def.render(props));
      if (framework === 'p8') p8.push(generate(def, props, 'p8').code.trim());
    } catch (e) {
      if (e instanceof z.ZodError) throw new ApiError(400, `${it.component}: ${zodMessage(e)}`);
      throw e;
    }
  }
  const stackCls = ['p8-stack', `p8-stack--gap${gap}`, 'p8-stack--align-stretch', ...(direction === 'row' ? ['p8-stack--row'] : [])];
  if (framework === 'p8') return { component: 'composition', framework, language: 'html', filename: 'composition.p8.html', props: {}, code: `<div style="display:flex;flex-direction:${direction};gap:var(--p8-space-${gap})">\n${p8.map((l) => `  ${l}`).join('\n')}\n</div>\n` };
  const root: Node = { tag: 'div', cls: stackCls, children: nodes };
  const synthetic: ComponentDef = { id: 'composition', name: 'Composition', description: '', tags: [], status: 'stable', usage: '', props: [], rules: [], render: () => root };
  return generate(synthetic, {}, framework);
}

export function getThemeBuild(input: unknown) {
  const r = buildTheme((input ?? {}) as Parameters<typeof buildTheme>[0]);
  if (!r.ok) throw new ApiError(400, r.errors.join('; '));
  return r;
}

export function lintCode(input: unknown) {
  const code = (input as { code?: unknown })?.code;
  if (typeof code !== 'string') throw new ApiError(400, 'code: expected a string');
  const issues = lintSpacing(code);
  return { ok: issues.every((i) => i.severity !== 'error'), issues };
}

export const getInstall = () => ({
  mcp: { remote: `${site.url}/mcp`, stdio: 'git clone <repo> && pnpm install && pnpm mcp' },
  http: { base: `${site.url}/api`, endpoints: ['GET /components', 'GET /components/:id', 'POST /code', 'POST /compose', 'GET /search?q=', 'GET /tokens', 'GET /rules', 'POST /theme', 'POST /lint'] },
  cli: [`npx ${site.cli} add button --framework react`, `npx ${site.cli} lint src`, `npx ${site.cli} theme --ink "#111111" --canvas "#FFFFFF" --radius 8`],
  runtime: { script: `<script src="${site.url}/p8.js"></script>`, example: '<p8-button variant="primary">Save</p8-button>' },
  skill: `${site.url}/skill/SKILL.md`,
});

export interface RouteResult {
  status: number;
  body: unknown;
}

/** Pure router, used by the HTTP server and tests. */
export function route(method: string, path: string, body?: unknown, query?: Record<string, string>): RouteResult {
  try {
    if (method === 'GET' && path === '/api/components') return { status: 200, body: listComponents() };
    const m = path.match(/^\/api\/components\/([^/]+)$/);
    if (method === 'GET' && m) return { status: 200, body: getComponent(decodeURIComponent(m[1])) };
    if (method === 'GET' && path === '/api/tokens') return { status: 200, body: getTokens() };
    if (method === 'GET' && path === '/api/rules') return { status: 200, body: getRules() };
    if (method === 'GET' && path === '/api/install') return { status: 200, body: getInstall() };
    if (method === 'GET' && path === '/api/search') return { status: 200, body: searchComponents(String(query?.q ?? ''), Number(query?.limit ?? 8)) };
    if (method === 'POST' && path === '/api/compose') return { status: 200, body: composeCode(body) };
    if (method === 'POST' && path === '/api/theme') return { status: 200, body: getThemeBuild(body) };
    if (method === 'POST' && path === '/api/lint') return { status: 200, body: lintCode(body) };
    if (method === 'POST' && path === '/api/code') return { status: 200, body: getCode(body) };
    return { status: 404, body: { error: 'Not found' } };
  } catch (e) {
    if (e instanceof ApiError) return { status: e.status, body: { error: e.message } };
    return { status: 500, body: { error: 'Internal error' } };
  }
}
