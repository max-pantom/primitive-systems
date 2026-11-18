/**
 * Aggregate-only usage counters for the public API and MCP: which tools and components are pulled,
 * in which framework, by which kind of client. No IPs, no request bodies, no props are stored.
 * Store: Upstash Redis (REST) when UPSTASH_REDIS_REST_* or KV_REST_API_* env vars exist, otherwise memory.
 */
export interface UsageEvent { source: 'mcp' | 'http'; tool?: string; components?: string[]; framework?: string; client: string; model?: string }
export interface Counts { id: string; count: number }
export interface UsageSummary {
  store: 'redis' | 'memory'; since: string; total: number; today: number; last7: number;
  days: { day: string; count: number }[]; components: Counts[]; tools: Counts[]; frameworks: Counts[]; clients: Counts[]; models: Counts[]; sources: Counts[];
}

const HASHES = ['components', 'tools', 'frameworks', 'clients', 'models', 'sources', 'days'] as const;
const day = (d = new Date()) => d.toISOString().slice(0, 10);

/** Classify the caller from User-Agent / MCP clientInfo.name. Coarse on purpose. */
export function classifyClient(ua = '', name = ''): string {
  const s = `${name} ${ua}`.toLowerCase();
  const rules: [RegExp, string][] = [[/claude/, 'Claude'], [/cursor/, 'Cursor'], [/windsurf|codeium/, 'Windsurf'], [/vscode|copilot|visual studio code/, 'VS Code / Copilot'], [/codex|openai|chatgpt/, 'OpenAI / Codex'], [/gemini|google/, 'Gemini'], [/zed/, 'Zed'], [/cline|roo|continue/, 'Cline / Continue'], [/curl/, 'curl'], [/node|undici|axios|fetch/, 'Node script'], [/python|httpx|requests|aiohttp/, 'Python script'], [/mozilla|chrome|safari|firefox/, 'Browser']];
  return rules.find(([re]) => re.test(s))?.[1] ?? 'Other';
}

const mem: Record<(typeof HASHES)[number], Map<string, number>> & { since?: string } = Object.fromEntries(HASHES.map((h) => [h, new Map<string, number>()])) as never;

function redisEnv() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}
async function pipeline(cmds: (string | number)[][]) {
  const r = redisEnv()!;
  const res = await fetch(`${r.url}/pipeline`, { method: 'POST', headers: { authorization: `Bearer ${r.token}`, 'content-type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!res.ok) throw new Error(`redis ${res.status}`);
  return (await res.json()) as { result: unknown }[];
}

export async function track(e: UsageEvent): Promise<void> {
  const incs: [string, string][] = [['sources', e.source], ['clients', e.client], ['days', day()]];
  if (e.tool) incs.push(['tools', e.tool]);
  for (const c of e.components ?? []) incs.push(['components', c]);
  if (e.framework) incs.push(['frameworks', e.framework]);
  if (e.model) incs.push(['models', e.model.slice(0, 40)]);
  try {
    if (redisEnv()) await pipeline([['SETNX', 'p8:since', new Date().toISOString()], ...incs.map(([h, k]) => ['HINCRBY', `p8:${h}`, k, 1])]);
    else {
      mem.since ??= new Date().toISOString();
      for (const [h, k] of incs) mem[h as (typeof HASHES)[number]].set(k, (mem[h as (typeof HASHES)[number]].get(k) ?? 0) + 1);
    }
  } catch { /* usage must never break an API call */ }
}

const sorted = (m: Map<string, number> | Record<string, number>): Counts[] => Object.entries(m instanceof Map ? Object.fromEntries(m) : m).map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count || a.id.localeCompare(b.id));

export async function getUsage(): Promise<UsageSummary> {
  let data: Record<string, Record<string, number>>;
  let since: string;
  let store: 'redis' | 'memory';
  if (redisEnv()) {
    store = 'redis';
    const out = await pipeline([...HASHES.map((h) => ['HGETALL', `p8:${h}`]), ['GET', 'p8:since']]);
    data = Object.fromEntries(HASHES.map((h, i) => {
      const flat = (out[i].result as string[]) ?? [];
      const o: Record<string, number> = {};
      for (let j = 0; j < flat.length; j += 2) o[flat[j]] = Number(flat[j + 1]);
      return [h, o];
    }));
    since = (out[HASHES.length].result as string) ?? new Date().toISOString();
  } else {
    store = 'memory';
    data = Object.fromEntries(HASHES.map((h) => [h, Object.fromEntries(mem[h])]));
    since = mem.since ?? new Date().toISOString();
  }
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => { const d = day(new Date(today.getTime() - (13 - i) * 86400000)); return { day: d, count: data.days[d] ?? 0 }; });
  const total = Object.values(data.tools).reduce((a, b) => a + b, 0);
  return {
    store, since, total, today: days[13].count, last7: days.slice(7).reduce((a, d) => a + d.count, 0), days,
    components: sorted(data.components), tools: sorted(data.tools), frameworks: sorted(data.frameworks), clients: sorted(data.clients), models: sorted(data.models), sources: sorted(data.sources),
  };
}

export function resetMemoryUsage() { HASHES.forEach((h) => mem[h].clear()); mem.since = undefined; }

/** HTTP route → the equivalent tool name, so HTTP and MCP callers are counted together. */
const HTTP_TOOL: [RegExp, string, string][] = [[/^GET \/api\/components$/, 'list_components', ''], [/^GET \/api\/components\/[^/]+$/, 'get_component', ''], [/^POST \/api\/code$/, 'get_code', ''], [/^POST \/api\/compose$/, 'compose_code', ''], [/^GET \/api\/search$/, 'search_components', ''], [/^GET \/api\/rules$/, 'get_rules', ''], [/^GET \/api\/tokens$/, 'get_tokens', ''], [/^POST \/api\/theme$/, 'build_theme', ''], [/^POST \/api\/lint$/, 'lint_code', ''], [/^GET \/api\/install$/, 'get_install', ''], [/^GET \/api\/changelog$/, 'get_changelog', ''], [/^GET \/api\/versions$/, 'list_versions', ''], [/^(GET|POST) \/api\/situation$/, 'suggest_ui', ''], [/^POST \/api\/copy$/, 'suggest_copy', ''], [/^POST \/api\/copy\/check$/, 'check_copy', ''], [/^POST \/api\/scan$/, 'scan_code', ''], [/^GET \/api\/diff$/, 'diff_component', ''], [/^GET \/api\/templates$/, 'list_templates', ''], [/^GET \/api\/templates\/[^/]+$/, 'get_template', ''], [/^POST \/api\/templates\/code$/, 'get_template', '']];

export function describeCall(tool: string, args: Record<string, unknown> | undefined): Pick<UsageEvent, 'components' | 'framework'> {
  const a = args ?? {};
  const fw = typeof a.framework === 'string' ? a.framework : undefined;
  if ((tool === 'get_component' || tool === 'get_template') && typeof a.id === 'string') return { components: [a.id], framework: fw };
  if (tool === 'get_code' && typeof a.component === 'string') return { components: [a.component], framework: fw };
  if (tool === 'compose_code' && Array.isArray(a.items)) return { components: [...new Set((a.items as { component?: string }[]).map((i) => i.component).filter((x): x is string => typeof x === 'string'))], framework: fw };
  return {};
}

export function describeHttp(method: string, path: string, body: unknown): { tool: string; components?: string[]; framework?: string } | null {
  const key = `${method} ${path}`;
  const hit = HTTP_TOOL.find(([re]) => re.test(key));
  if (!hit) return null;
  const tool = hit[1];
  const idMatch = path.match(/^\/api\/(?:components|templates)\/([^/]+)$/);
  const b = body as Record<string, unknown> | undefined;
  return { tool, ...describeCall(tool, idMatch ? { id: decodeURIComponent(idMatch[1]) } : path === '/api/templates/code' ? { id: b?.id, framework: b?.framework } : b) };
}
