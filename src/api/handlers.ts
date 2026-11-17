import { z } from 'zod';
import { components, getDef, defaultsOf } from '../components';
import type { ComponentDef } from '../components';
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
    components: components.map(({ id, name, description, tags, status }) => ({ id, name, description, tags, status })),
  };
}

const detail = (d: ComponentDef) => ({
  id: d.id,
  name: d.name,
  description: d.description,
  tags: d.tags,
  status: d.status,
  usage: d.usage,
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
    if (e instanceof z.ZodError) throw new ApiError(400, e.issues.map((i) => `props.${i.path.join('.')}: ${i.message}`).join('; '));
    throw e;
  }
}

export interface RouteResult {
  status: number;
  body: unknown;
}

/** Pure router, used by the HTTP server and tests. */
export function route(method: string, path: string, body?: unknown): RouteResult {
  try {
    if (method === 'GET' && path === '/api/components') return { status: 200, body: listComponents() };
    const m = path.match(/^\/api\/components\/([^/]+)$/);
    if (method === 'GET' && m) return { status: 200, body: getComponent(decodeURIComponent(m[1])) };
    if (method === 'GET' && path === '/api/tokens') return { status: 200, body: getTokens() };
    if (method === 'POST' && path === '/api/code') return { status: 200, body: getCode(body) };
    return { status: 404, body: { error: 'Not found' } };
  } catch (e) {
    if (e instanceof ApiError) return { status: e.status, body: { error: e.message } };
    return { status: 500, body: { error: 'Internal error' } };
  }
}
