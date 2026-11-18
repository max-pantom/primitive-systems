---
name: primitive-systems
description: Build UI with the Primitive Systems (P8) component library. Use whenever you create or edit UI for a Primitive 8 app — buttons, forms, cards, dialogs, menus, tabs, toasts, tables, navigation — or need P8 tokens, theme, or spacing rules. Pulls components, props, ready-to-paste code (Astro, React/Next.js, Svelte, Tailwind, HTML, SCSS, or the short <p8-*> tag form) and the rule book through MCP, HTTP or the CLI.
---

# Primitive Systems (P8)

An agentic component library: one definition per component, six code outputs, a rule book, and tools so you never guess a padding or a color.

## Connect (pick one)

- **MCP (preferred):** `claude mcp add --transport http primitive-systems https://primitive-systems.vercel.app/mcp`
- **HTTP:** `https://primitive-systems.vercel.app/api` — `GET /components`, `GET /components/:id`, `POST /code`, `POST /compose`, `GET /search?q=`, `GET /rules`, `GET /tokens`, `POST /theme`, `POST /lint`
- **CLI:** `npx primitive add button --framework react` (also `search`, `info`, `lint`, `theme`, `tokens`, `rules`)
- **Zero build:** `<script src="https://primitive-systems.vercel.app/p8.js"></script>` then `<p8-button variant="primary">Save</p8-button>`

## Workflow

1. `get_rules` once per task. Obey it.
1b. **Low on context?** Pass `brief: true` to `get_component`, `get_code`, `get_template`, `list_components`, `search_components`: you get only props and the snippet. Ask for the full form when there is room.
2. If you only know the situation ("user has no projects yet", "saving failed", "confirm delete"), call `suggest_ui`: you get the component, props and house-voice wording. `suggest_copy` writes button labels, empty states and errors; `check_copy` checks yours.
2b. For a whole screen (sign-in, settings, dashboard, list-to-detail, empty page) call `list_templates` and `get_template` with a framework: you get the composed screen, behavior included. Otherwise `search_components` with the user's need in plain words ("confirm a destructive action") — pick from the results; do not invent components.
3. `get_component` for the props, defaults and **guidelines (do / don't)** of each one you will use.
4. `get_code` for one component, or `compose_code` for a whole section (it stacks several with one script). Use the framework the project already uses; if unsure, `html` or `p8`.
5. Put the theme in once: `get_tokens` (or `build_theme` for a custom palette), emitted as CSS variables. Never paste hex into components.
6. After editing a project that uses the library, run `lint_code` with `fix: true` (or `npx primitive lint src --fix`) on the files you changed: it corrects off-grid spacing, gaps, raw colours and missing labels and lists each change; handle what remains.
7. To adopt the library in an existing project, send its files to `scan_code` (or run `npx primitive scan src`) and apply the swaps it lists.
8. To update code you generated earlier, call `diff_component` (`from` = the version you used) and follow its migration hints; pin with `version` on `get_component` / `get_code` while you migrate.

## The rules that matter most

- Colors, spacing, radius: **named tokens only** (`var(--p8-…)`). Never raw hex or px.
- Padding, margin, gap on the **4 / 8 grid**. Controls have **12px left/right** padding. Cards are **16 sides / 12 top-bottom** (or 16 all around). Default gap **12**. Menu items 6/4. Tabs 12 apart.
- **One primary Button per view.** Icon buttons need a label. Every field needs a label or aria-label.
- Icons come only from the Primitive8 Icon Factory pack (14 or 16px): https://factory.primitive8.cc/icons
- One stroke: the 0.5px hairline. Focus is a dim stroke, not an outline ring.
- Behavior (toggle, tabs, menu, dialog focus trap, toast timers…) ships in the generated code. Do not reimplement it.

## Do not

- Do not hand-write a component that exists. Do not copy markup between frameworks by hand; ask `get_code` for the target framework.
- Do not change the generated class names or add inline px values.
- Do not hardcode the product name; it lives in `src/config/site.ts` of the library.
