import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { site } from '../config/site';
import { FRAMEWORKS } from '../codegen';
import { ApiError, composeCode, getCode, getComponent, getInstall, getRules, getThemeBuild, getTokens, lintCode, listComponents, searchComponents } from '../api/handlers';

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
  server.registerTool('get_rules', { description: 'The rule book: design rules, documented exceptions, allowed grid values, and per-component do/don\'t guidelines. Read before composing UI.', inputSchema: {} }, async () => wrap(() => getRules()));
  server.registerTool('get_install', { description: 'How to use the library: remote MCP URL, HTTP endpoints, CLI commands, the <p8-*> script tag and the skill.', inputSchema: {} }, async () => wrap(() => getInstall()));
  server.registerTool('search_components', { description: 'Find the right components for a need, e.g. "confirm a destructive action" or "loading state". Returns ranked components with why.', inputSchema: { query: z.string(), limit: z.number().int().min(1).max(20).optional() } }, async ({ query, limit }) => wrap(() => searchComponents(query, limit ?? 8)));
  server.registerTool('compose_code', {
    description: 'Compose several component instances into one ready-to-paste output (stacked). Use after search_components to build a whole section.',
    inputSchema: { framework: z.enum(FRAMEWORKS), direction: z.enum(['column', 'row']).optional(), gap: z.enum(['4', '8', '12']).optional(), items: z.array(z.object({ component: z.string(), props: z.record(z.string(), z.unknown()).optional() })).min(1).max(30) },
  }, async (args) => wrap(() => composeCode(args)));
  server.registerTool('build_theme', {
    description: 'Generate a theme (CSS variables) for a P8 app from base ink/canvas colors per mode and a radius. Surfaces, strokes and muted text are derived and contrast-checked.',
    inputSchema: { light: z.object({ ink: z.string().optional(), canvas: z.string().optional() }).optional(), dark: z.object({ ink: z.string().optional(), canvas: z.string().optional() }).optional(), radius: z.enum(['4', '8', '12', '16']).optional() },
  }, async (args) => wrap(() => getThemeBuild(args)));
  server.registerTool('lint_code', { description: 'Check consumer code (CSS, SCSS, JSX, Tailwind) for padding, margin, gap and radius values that are off the 4/8 grid.', inputSchema: { code: z.string() } }, async ({ code }) => wrap(() => lintCode({ code })));
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
