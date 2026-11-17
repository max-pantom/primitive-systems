import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { site } from '../config/site';
import { FRAMEWORKS } from '../codegen';
import { ApiError, getCode, getComponent, getTokens, listComponents } from '../api/handlers';

const wrap = (fn: () => unknown) => {
  try {
    const data = fn();
    return { content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }], structuredContent: data as Record<string, unknown> };
  } catch (e) {
    const message = e instanceof ApiError ? e.message : 'Internal error';
    return { isError: true, content: [{ type: 'text' as const, text: message }] };
  }
};

export function createMcpServer() {
  const server = new McpServer({ name: site.slug, version: '0.1.0' });
  server.registerTool('list_components', { description: 'List the component catalog: id, name, description, tags, status.', inputSchema: {} }, async () => wrap(() => listComponents()));
  server.registerTool('get_tokens', { description: 'The theme/token set: named colors (light/dark), spacing, radius, type.', inputSchema: {} }, async () => wrap(() => getTokens()));
  server.registerTool(
    'get_component',
    { description: 'Get a component: props, defaults, variants, docs.', inputSchema: { id: z.string() } },
    async ({ id }) => wrap(() => getComponent(id)),
  );
  server.registerTool(
    'get_code',
    {
      description: 'Ready-to-paste code for a component in a framework, with the given props applied.',
      inputSchema: { component: z.string(), framework: z.enum(FRAMEWORKS), props: z.record(z.string(), z.unknown()).optional() },
    },
    async (args) => wrap(() => getCode(args)),
  );
  return server;
}
