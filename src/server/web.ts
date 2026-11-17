import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { route } from '../api/handlers';
import { createMcpServer } from './mcp-server';
import { classifyClient, describeCall, describeHttp, getUsage, track } from './usage';

/** Count a call, but never let it slow or break the response. */
const safe = (p: Promise<unknown>) => Promise.race([p.catch(() => {}), new Promise((r) => setTimeout(r, 400))]);
const modelOf = (req: Request, url: URL) => req.headers.get('x-p8-model') ?? url.searchParams.get('model') ?? undefined;

const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, mcp-session-id, mcp-protocol-version, accept', 'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS', 'access-control-expose-headers': 'mcp-session-id' };
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...CORS } });

/** HTTP API (same payloads as the MCP tools). Works as a Vercel/Fetch handler. */
export async function handleApi(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  const p = url.searchParams.get('p');
  const path = p !== null ? `/api/${p.replace(/^\/+/, '')}` : url.pathname.replace(/\/+$/, '') || '/';
  let body: unknown;
  if (req.method === 'POST') {
    try { body = await req.json(); } catch { return json(400, { error: 'Invalid JSON' }); }
  }
  const query = Object.fromEntries([...url.searchParams].filter(([k]) => k !== 'p'));
  if (req.method === 'GET' && path === '/api/usage') return json(200, await getUsage());
  const out = route(req.method, path, body, query);
  if (out.status === 200) {
    const d = describeHttp(req.method, path, body);
    if (d) await safe(track({ source: 'http', ...d, client: classifyClient(req.headers.get('user-agent') ?? ''), model: modelOf(req, url) }));
  }
  return json(out.status, out.body);
}

/** Remote MCP over Streamable HTTP (stateless, JSON responses). */
export async function handleMcp(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const url = new URL(req.url);
  if (req.method === 'POST') {
    try {
      const msgs = [].concat((await req.clone().json()) as never) as { method?: string; params?: { name?: string; arguments?: Record<string, unknown>; clientInfo?: { name?: string } } }[];
      const ua = req.headers.get('user-agent') ?? '';
      const model = modelOf(req, url);
      for (const m of msgs) {
        if (m.method === 'tools/call' && m.params?.name) await safe(track({ source: 'mcp', tool: m.params.name, ...describeCall(m.params.name, m.params.arguments), client: classifyClient(ua, url.searchParams.get('client') ?? ''), model }));
        else if (m.method === 'initialize') await safe(track({ source: 'mcp', client: classifyClient(ua, m.params?.clientInfo?.name ?? url.searchParams.get('client') ?? ''), model }));
      }
    } catch { /* not JSON-RPC: let the transport answer */ }
  }
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  const res = await transport.handleRequest(req);
  const headers = new Headers(res.headers);
  Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
}
