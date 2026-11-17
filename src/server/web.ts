import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { route } from '../api/handlers';
import { createMcpServer } from './mcp-server';

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
  const out = route(req.method, path, body, query);
  return json(out.status, out.body);
}

/** Remote MCP over Streamable HTTP (stateless, JSON responses). */
export async function handleMcp(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  const server = createMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  const res = await transport.handleRequest(req);
  const headers = new Headers(res.headers);
  Object.entries(CORS).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
}
