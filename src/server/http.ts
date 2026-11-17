import { createServer } from 'node:http';
import { site } from '../config/site';
import { handleApi, handleMcp } from './web';

const port = Number(process.env.PORT ?? 4322);

/** Local server with the same handlers Vercel runs: /api/* and /mcp. */
createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const ch of req) chunks.push(ch as Buffer);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const request = new Request(url, { method: req.method, headers: req.headers as Record<string, string>, body: req.method === 'GET' || req.method === 'HEAD' ? undefined : body });
  const response = url.pathname.startsWith('/mcp') || url.pathname.startsWith('/api/mcp') ? await handleMcp(request) : await handleApi(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, () => console.error(`${site.name} API + MCP on http://localhost:${port}`));
