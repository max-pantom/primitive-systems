# Primitive Systems

An **agentic component library** for Primitive 8 apps. Everyday UI (buttons, forms, cards, menus, dialogs, tables, navigation…) defined once, generated for **Astro, Next.js (React/TSX), Svelte, Tailwind, plain HTML and SCSS**, and served to agents through **MCP, HTTP, a CLI, a skill and a `<p8-*>` runtime**.

Docs + live playground: https://primitive-systems.vercel.app

## For agents (start here)

| Way | How |
| --- | --- |
| **MCP (remote)** | `claude mcp add --transport http primitive-systems https://primitive-systems.vercel.app/mcp` |
| **MCP (local)** | `pnpm install && pnpm mcp` (stdio) |
| **Skill** | copy `skills/primitive-systems/SKILL.md` to `.claude/skills/primitive-systems/SKILL.md` |
| **HTTP** | `https://primitive-systems.vercel.app/api/components`, `/code`, `/compose`, `/search?q=`, `/rules`, `/tokens`, `/theme`, `/lint` |
| **CLI** | `npx primitive add button --framework react` · `search` · `info` · `lint` · `theme` · `tokens` · `rules` |
| **Zero build** | `<script src="https://primitive-systems.vercel.app/p8.js"></script>` → `<p8-button variant="primary">Save</p8-button>` |
| **llms.txt** | https://primitive-systems.vercel.app/llms.txt |

MCP tools: `list_templates`, `get_template`, `diff_component`, `list_versions`, `list_components`, `get_component` (props + do/don't guidelines), `get_code`, `compose_code`, `search_components`, `get_rules`, `get_tokens`, `build_theme`, `lint_code`, `get_install`, `get_changelog`.

Release history: `/changelog` (site), `GET /api/changelog` (JSON), and `get_changelog` (MCP).

## Rules and checks

- **Rule book:** [RULEBOOK.md](RULEBOOK.md) — 4/8 grid, 12px controls, 16/12 surfaces, default gap 12, menu 6/4, one stroke, dim focus, 14/16 icons from the Primitive8 pack, accessibility. Source of truth: `src/rules/rulebook.ts`.
- **Check book:** [CHECKBOOK.md](CHECKBOOK.md) — `pnpm rules` checks every component's style rules and rendered markup against the rule book (tokens-only, grid, control/surface padding, gaps, type scale, hairline, focus, disabled, icons, ARIA, labels, contrast). It runs inside `pnpm test`.
- **Lint your own code:** `npx primitive lint src` flags off-grid padding/margin/radius, gaps other than 4/8/12, raw hex colours and missing labels; add `--fix` (MCP: `lint_code` with `fix: true`) to correct them and list every change.
- **Templates:** whole screens (sign-in, settings, dashboard, list-to-detail, empty page) at `/templates` and through `list_templates` / `get_template`.
- **Versions:** `list_versions`, `diff_component` and a `version` argument on `get_component` / `get_code` show what changed between releases, with migration hints (snapshots are rebuilt from real release history).
- **Themes:** `npx primitive theme --ink "#111" --canvas "#fff" --radius 12 --out theme.css` derives the whole token file and checks contrast.

## Develop

```bash
pnpm install
pnpm dev          # docs site at http://localhost:4321
pnpm test         # vitest: schemas, snapshots (6 frameworks), behavior (jsdom), rules, API, MCP, runtime, CLI
pnpm test:e2e     # playwright against the docs site
pnpm rules        # run the check book; pnpm rules:md regenerates RULEBOOK.md / CHECKBOOK.md
pnpm build        # runtime + API + CLI bundles, then the static site
```

A component is one definition in `src/components/` (props, style rules over named tokens, a framework-agnostic node tree) plus do/don't guidelines in `src/components/guidelines.ts`. Everything else — six code outputs, behavior script, docs page, MCP/HTTP payloads — is generated.

Name, tagline and URL live only in `src/config/site.ts`. Icons come only from https://factory.primitive8.cc/icons.

## License

MIT — see [LICENSE](LICENSE).
