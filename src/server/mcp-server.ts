import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { site } from '../config/site';
import { FRAMEWORKS } from '../codegen';
import { ApiError, checkCopyTool, composeCode, getCode, getCodeBrief, getComponentBrief, getTemplateBrief, listComponentsBrief, scanTool, searchBrief, suggestCopyTool, suggestUi, getChangelog, getComponent, getDiff, getTemplateDetail, listTemplates, listVersions, getInstall, getRules, getThemeBuild, getTokens, lintCode, listComponents, searchComponents } from '../api/handlers';

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
  server.registerTool('list_components', { description: 'List the component catalog: id, name, description, tags, status. brief: true returns only [id, name] pairs (use when low on context).', inputSchema: { brief: z.boolean().optional() } }, async ({ brief }) => wrap(() => (brief ? listComponentsBrief() : listComponents())));
  server.registerTool('get_tokens', { description: 'The theme/token set: named colors (light/dark), spacing, radius, type.', inputSchema: {} }, async () => wrap(() => getTokens()));
  server.registerTool('get_rules', { description: 'The rule book: design rules, documented exceptions, allowed grid values, and per-component do/don\'t guidelines. Read before composing UI.', inputSchema: {} }, async () => wrap(() => getRules()));
  server.registerTool('list_templates', { description: 'Ready-made screens agents can request whole: sign-in, settings, dashboard, list-to-detail, empty page. Prefer these over assembling parts by hand.', inputSchema: {} }, async () => wrap(() => listTemplates()));
  server.registerTool('get_template', {
    description: 'One template: props, do/don\'t guidelines and which components it uses. Pass framework to also get the ready-to-paste code for the whole screen (behavior included).',
    inputSchema: { id: z.string(), framework: z.enum(FRAMEWORKS).optional(), props: z.record(z.string(), z.unknown()).optional(), brief: z.boolean().optional() },
  }, async ({ id, framework, props, brief }) => wrap(() => (brief ? getTemplateBrief(id, framework, props) : getTemplateDetail(id, framework, props))));
  server.registerTool('list_versions', { description: 'Released versions with snapshots (component counts), plus "latest". Use with diff_component and the version argument of get_component / get_code.', inputSchema: {} }, async () => wrap(() => listVersions()));
  server.registerTool('diff_component', {
    description: 'What changed between two releases, with migration hints: for one component (id) or, without id, a summary of the whole library (added, removed, changed, breaking). Use it to update code you generated earlier without breaking it: it lists removed props/options, changed defaults, removed class names and whether the generated output changed.',
    inputSchema: { id: z.string().optional(), from: z.string(), to: z.string().optional() },
  }, async (args) => wrap(() => getDiff(args)));
  server.registerTool('get_changelog', { description: 'Release history: what is New or Refined per version, with the components each release added.', inputSchema: {} }, async () => wrap(() => getChangelog()));
  server.registerTool('get_install', { description: 'How to use the library: remote MCP URL, HTTP endpoints, CLI commands, the <p8-*> script tag and the skill.', inputSchema: {} }, async () => wrap(() => getInstall()));
  server.registerTool('search_components', { description: 'Find the right components for a need, e.g. "confirm a destructive action" or "loading state". Returns ranked components with why.', inputSchema: { query: z.string(), limit: z.number().int().min(1).max(20).optional(), brief: z.boolean().optional() } }, async ({ query, limit, brief }) => wrap(() => (brief ? searchBrief(query, limit ?? 8) : searchComponents(query, limit ?? 8))));
  server.registerTool('compose_code', {
    description: 'Compose several component instances into one ready-to-paste output (stacked). Use after search_components to build a whole section.',
    inputSchema: { framework: z.enum(FRAMEWORKS), direction: z.enum(['column', 'row']).optional(), gap: z.enum(['4', '8', '12']).optional(), items: z.array(z.object({ component: z.string(), props: z.record(z.string(), z.unknown()).optional() })).min(1).max(30) },
  }, async (args) => wrap(() => composeCode(args)));
  server.registerTool('suggest_ui', {
    description: 'Describe a state in plain words ("user has no projects yet", "saving failed", "confirm deleting a file") and get the right component or screen with props and wording filled in, per the house voice. Pass framework to also get the code; brief: true returns only component, props and code.',
    inputSchema: { situation: z.string(), framework: z.enum(FRAMEWORKS).optional(), brief: z.boolean().optional() },
  }, async (args) => wrap(() => suggestUi(args)));
  server.registerTool('suggest_copy', {
    description: 'Copy in the house voice (sentence case, verb-first buttons, errors say what happened and how to fix it, past-tense confirmations): button labels, empty-state text, error messages, success and confirm dialogs.',
    inputSchema: { kind: z.enum(['button', 'empty', 'error', 'success', 'confirm', 'loading']), subject: z.string().optional(), action: z.string().optional(), reason: z.string().optional(), query: z.string().optional() },
  }, async (args) => wrap(() => suggestCopyTool(args)));
  server.registerTool('check_copy', {
    description: 'Check a piece of UI text against the house voice (no exclamation marks, no "please"/"Oops", sentence case, verb-first buttons, short, errors that say how to fix). Returns issues with suggestions.',
    inputSchema: { text: z.string(), kind: z.enum(['button', 'heading', 'message', 'label']).optional() },
  }, async (args) => wrap(() => checkCopyTool(args)));
  server.registerTool('scan_code', {
    description: 'Scan a project\'s files for UI built without Primitive Systems (raw button/input/select/textarea/table/dialog, hand-rolled cards, modals, toasts, MUI/Chakra/Ant/shadcn components) and get a swap for each: component, props taken from the markup, and the command. Also reports adoption %. Send files as [{ path, code }] in batches.',
    inputSchema: { files: z.array(z.object({ path: z.string(), code: z.string() })).min(1).max(300), framework: z.enum(FRAMEWORKS).optional() },
  }, async (args) => wrap(() => scanTool(args)));
  server.registerTool('build_theme', {
    description: 'Generate a theme (CSS variables) for a P8 app from base ink/canvas colors per mode and a radius. Surfaces, strokes and muted text are derived and contrast-checked.',
    inputSchema: { light: z.object({ ink: z.string().optional(), canvas: z.string().optional() }).optional(), dark: z.object({ ink: z.string().optional(), canvas: z.string().optional() }).optional(), radius: z.enum(['4', '8', '12', '16']).optional() },
  }, async (args) => wrap(() => getThemeBuild(args)));
  server.registerTool('lint_code', { description: 'Check consumer code (CSS, SCSS, JSX, Tailwind, HTML) for off-grid padding/margin/radius, gaps other than 4/8/12, raw hex colours and missing labels. With fix: true it also returns the corrected code and every change it made (nearest grid value, nearest theme colour token, aria-label from placeholder, alt=""); the rest stays in issues.', inputSchema: { code: z.string(), fix: z.boolean().optional() } }, async ({ code, fix }) => wrap(() => lintCode({ code, fix })));
  server.registerTool(
    'get_component',
    { description: 'Get a component: props, defaults, variants, docs, guidelines and accessibility. Pass version to get the props as they were in an earlier release (pinning). brief: true returns only the props and one snippet (use when low on context).', inputSchema: { id: z.string(), version: z.string().optional(), brief: z.boolean().optional() } },
    async ({ id, version, brief }) => wrap(() => (brief ? getComponentBrief(id) : getComponent(id, version))),
  );
  server.registerTool(
    'get_code',
    {
      description: 'Ready-to-paste code for a component in a framework, with the given props applied.',
      inputSchema: { component: z.string(), framework: z.enum(FRAMEWORKS), props: z.record(z.string(), z.unknown()).optional(), version: z.string().optional(), brief: z.boolean().optional() },
    },
    async (args) => wrap(() => (args.brief ? getCodeBrief(args) : getCode(args))),
  );
  return server;
}
