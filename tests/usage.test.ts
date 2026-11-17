import { beforeEach, describe, expect, it } from 'vitest';
import { handleApi, handleMcp } from '../src/server/web';
import { classifyClient, describeCall, describeHttp, getUsage, resetMemoryUsage } from '../src/server/usage';

const api = (path: string, init?: RequestInit) => handleApi(new Request(`https://x.test${path}`, init));
const mcp = (body: unknown, qs = '', headers: Record<string, string> = {}) => handleMcp(new Request(`https://x.test/mcp${qs}`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', ...headers }, body: JSON.stringify(body) }));
const get = async () => (await api('/api/usage')).json();

beforeEach(() => resetMemoryUsage());

describe('usage tracking', () => {
  it('counts HTTP calls by tool, component and framework', async () => {
    await api('/api/code', { method: 'POST', body: JSON.stringify({ component: 'button', framework: 'react' }), headers: { 'user-agent': 'curl/8' } });
    await api('/api/components/dialog');
    await api('/api/components');
    const u = await get();
    expect(u.total).toBe(3);
    expect(u.components).toEqual(expect.arrayContaining([{ id: 'button', count: 1 }, { id: 'dialog', count: 1 }]));
    expect(u.frameworks).toEqual([{ id: 'react', count: 1 }]);
    expect(u.tools.map((t: { id: string }) => t.id).sort()).toEqual(['get_code', 'get_component', 'list_components']);
    expect(u.clients).toEqual(expect.arrayContaining([{ id: 'curl', count: 1 }]));
    expect(u.store).toBe('memory');
  });
  it('counts MCP tool calls, client names and self-reported models, but not tools/list', async () => {
    await mcp({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'claude-code', version: '1' } } });
    await mcp({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    await mcp({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_code', arguments: { component: 'switch', framework: 'svelte' } } }, '?model=opus-test');
    await mcp({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'compose_code', arguments: { framework: 'html', items: [{ component: 'field' }, { component: 'button' }, { component: 'field' }] } } });
    const u = await get();
    expect(u.total).toBe(2);
    expect(u.components.map((c: { id: string }) => c.id).sort()).toEqual(['button', 'field', 'switch']);
    expect(u.models).toEqual([{ id: 'opus-test', count: 1 }]);
    expect(u.clients.map((c: { id: string }) => c.id)).toContain('Claude');
    expect(u.sources.find((s: { id: string }) => s.id === 'mcp').count).toBeGreaterThanOrEqual(2);
  });
  it('does not count failures or the usage endpoint itself, and stores no payloads', async () => {
    await api('/api/components/nope');
    await api('/api/code', { method: 'POST', body: JSON.stringify({ component: 'button', framework: 'astro', props: { label: 'SECRET LABEL' } }) });
    await get();
    const u = await get();
    expect(u.total).toBe(1);
    expect(JSON.stringify(u)).not.toContain('SECRET');
  });
  it('returns 14 days and a store label', async () => {
    const u = await get();
    expect(u.days).toHaveLength(14);
    expect(u.days.at(-1).day).toBe(new Date().toISOString().slice(0, 10));
  });
  it('helpers', () => {
    expect(classifyClient('Mozilla/5.0')).toBe('Browser');
    expect(classifyClient('', 'cursor-vscode')).toBe('Cursor');
    expect(classifyClient('weird')).toBe('Other');
    expect(describeHttp('GET', '/api/components/card', undefined)).toMatchObject({ tool: 'get_component', components: ['card'] });
    expect(describeHttp('GET', '/api/usage', undefined)).toBeNull();
    expect(describeCall('get_code', { component: 'tabs', framework: 'p8' })).toEqual({ components: ['tabs'], framework: 'p8' });
  });
});
