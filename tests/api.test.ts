import { describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/server/mcp-server';
import { route } from '../src/api/handlers';

async function mcp() {
  const [a, b] = InMemoryTransport.createLinkedPair();
  await createMcpServer().connect(b);
  const client = new Client({ name: 't', version: '0' });
  await client.connect(a);
  return client;
}
const parse = (r: any) => JSON.parse(r.content[0].text);

describe('MCP and HTTP return the same data', () => {
  it('lists tools', async () => {
    const c = await mcp();
    expect((await c.listTools()).tools.map((t) => t.name).sort()).toEqual(['build_theme', 'compose_code', 'get_changelog', 'get_code', 'get_component', 'get_install', 'get_rules', 'get_tokens', 'lint_code', 'list_components', 'search_components']);
  });
  it('list_components', async () => {
    const c = await mcp();
    expect(parse(await c.callTool({ name: 'list_components', arguments: {} }))).toEqual(route('GET', '/api/components').body);
  });
  it('get_component', async () => {
    const c = await mcp();
    expect(parse(await c.callTool({ name: 'get_component', arguments: { id: 'card' } }))).toEqual(route('GET', '/api/components/card').body);
  });
  it('get_changelog returns the same release and component metadata over MCP and HTTP', async () => {
    const c = await mcp();
    const http = route('GET', '/api/changelog');
    expect(http.status).toBe(200);
    expect(parse(await c.callTool({ name: 'get_changelog', arguments: {} }))).toEqual(http.body);
    expect((http.body as any).releases[0].components).toHaveLength(8);
  });
  it('get_tokens', async () => {
    const c = await mcp();
    expect(parse(await c.callTool({ name: 'get_tokens', arguments: {} }))).toEqual(route('GET', '/api/tokens').body);
  });
  it('get_code', async () => {
    const c = await mcp();
    const args = { component: 'button', framework: 'svelte', props: { variant: 'primary', label: 'Go' } };
    const viaMcp = parse(await c.callTool({ name: 'get_code', arguments: args }));
    expect(viaMcp).toEqual(route('POST', '/api/code', args).body);
    expect(viaMcp.code).toContain('Go');
  });
  it('errors are consistent', async () => {
    const c = await mcp();
    const r: any = await c.callTool({ name: 'get_component', arguments: { id: 'nope' } });
    expect(r.isError).toBe(true);
    expect(route('GET', '/api/components/nope')).toEqual({ status: 404, body: { error: r.content[0].text } });
    expect(route('POST', '/api/code', { component: 'button', framework: 'astro', props: { variant: 'x' } }).status).toBe(400);
    expect(route('GET', '/nope').status).toBe(404);
  });
});
