# Agent instructions — Primitive Systems

This repo is an agentic component library. If you are an AI agent building UI for a Primitive 8 app, **use it instead of writing components**.

1. Read the rule book: `RULEBOOK.md` (or MCP `get_rules`).
2. Find components or whole screens: MCP `search_components` / `list_templates`, or `GET /api/search?q=` / `GET /api/templates`.
3. Get code: MCP `get_code` / `compose_code`, or `npx primitive add <id> -f <framework>`.
4. Verify: `pnpm rules` (this repo) or MCP `lint_code` (add `fix: true`) / `npx primitive lint src --fix` (your project).
5. Update older generated code: MCP `diff_component` with the version you used.

MCP: `claude mcp add --transport http primitive-systems https://primitive-systems.vercel.app/mcp`
Skill: copy `skills/primitive-systems/SKILL.md` to `.claude/skills/primitive-systems/SKILL.md`.
Icons only from https://factory.primitive8.cc/icons. Brand/name only in `src/config/site.ts`.

Working in this repo: components live in `src/components/` (one definition each: props, style rules, node tree). Every rule in `src/rules/rulebook.ts` is enforced by `pnpm test`. Add a component by writing its definition, adding do/don't guidelines in `src/components/guidelines.ts`, then run `pnpm test && pnpm rules:md`.
