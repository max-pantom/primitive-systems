import { createServer } from 'node:http';
import { route } from '../api/handlers';
import { site } from '../config/site';

const port = Number(process.env.PORT ?? 4322);

createServer(async (req, res) => {
  const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' };
  if (req.method === 'OPTIONS') return void res.writeHead(204, headers).end();
  let body: unknown;
  if (req.method === 'POST') {
    const chunks: Buffer[] = [];
    for await (const ch of req) chunks.push(ch as Buffer);
    try {
      body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    } catch {
      return void res.writeHead(400, headers).end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  }
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  const out = route(req.method ?? 'GET', pathname, body);
  res.writeHead(out.status, headers).end(JSON.stringify(out.body));
}).listen(port, () => console.error(`${site.name} API on http://localhost:${port}`));
