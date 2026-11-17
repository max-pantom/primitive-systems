# Primitive Systems — build prompt (P8)

Build an **agentic component library** for Primitive 8 apps: everyday UI pieces (buttons, cards, inputs, menus, tabs, lists) that stay consistent across every project. Agents pull a component, its props, and ready-to-paste code through an MCP server (and a matching JSON/HTTP API). This is a reusable library with a docs site, codegen, and an agent API — not a visual component factory or playground.

The working name is **"Primitive Systems"**. Keep the product name, tagline, and display branding in ONE config file (`src/config/site.ts`) so they can be renamed later. Do not hardcode the name in components, docs copy, MCP metadata, or UI chrome; import it from that config. The repo slug may stay `primitive-systems`.

## Inspiration (structure only)

Study https://dimsum.systems for **how components are documented**, not how they look. Dimsum is Ruby on Rails — do not copy its visual design, typography, colors, or Rails/ERB API.

Steal only this documentation pattern:

- Sidebar catalog of real components
- Live preview at the top of each component page
- Interactive prop controls (variant, size, state, etc.) that update the preview immediately
- Code snippet always visible beside (or directly under) the preview, with a copy button
- Props table: name, description, type, default
- Short composition notes when a component contains others
- A dark-mode toggle

Our code outputs are Astro, Next.js (React/TSX), Svelte, Tailwind, plain HTML with inline CSS, and SCSS — not ERB.

## Look

Minimal, Interfere-style UI: white paper, black ink, lots of space, no shadows, gradients, or heavy chrome. Do not invent a signature look ahead of the design seeds below. Do not redesign established Primitive 8 UI.

---

## DESIGN SEEDS (do not skip)

metagravity will provide **two hand-designed components**. Those two are the visual source of truth. Every other component must derive radius, stroke, type scale, color usage, hover / focus / disabled, density, and overall feel from them.

Until the seeds arrive:

- Build Slice 1 with **neutral Interfere-style placeholders**
- Leave a clearly marked **DESIGN SEEDS** slot in the repo (`seeds/README.md`) and a visible "DESIGN SEEDS — pending" banner on the docs site
- Do not invent a custom visual language
- When the two designs land, restyle all components from them — do not redesign independently

---

## Tokens and theming

One theme file (e.g. `src/tokens/theme.ts` emitted as CSS variables). **Theming is by named colors** so every consuming app stays consistent — never put raw hex, rgb, or ad-hoc pixel values in component source. Changing the one theme file changes every app that uses the library.

Spacing, padding, and radius use **only multiples of 4 and 8** (8, 12, 16, 20, 24, …). Encode these as tokens. The only explicit exception is menu item horizontal padding (6px), called out below.

Hard rules (build these into tokens and component defaults):

- **Controls** (button, text input, textarea, select, and similar): 12px left and right padding
- **Cards**: 16px left and right, 12px top and bottom, with a prop option for 16px all around (16/16)
- **Default gap** between items: 12px
- **Stacked paragraph / data-list lines**: 2px or 4px gap (this is mostly for data lists)
- **Menu items**: 6px left and right (explicit exception to the 4/8 grid), 2px or 4px top and bottom
- **Tabs**: 12px spacing
- **Icons**: 14px or 16px, as a prop option

## Icons

Icons **MUST** come from metagravity's icon pack at https://factory.primitive8.cc/icons (Icon Factory, repo `max-pantom/icon-factory`). No Lucide, Heroicons, Phosphor, or any other icon library.

---

## Components

Real, everyday app pieces — not demo widgets.

**First-class set:** button, text input, textarea / text view, card, menu, tabs, divider, disclosure, data list.

**Common follow-ons:** select, checkbox, switch, badge, tooltip, dialog, toast, avatar, empty state — plus obvious companions (icon button, label, link) as needed.

Start with a tight first slice (see Slices). Do not boil the ocean.

Every component has:

- Typed props with documented defaults
- Variants and states (hover, focus, disabled, etc. as relevant)
- A **side panel** on the docs page to toggle options / props and watch the live preview update

## Single source of truth

Define each component **once**: a schema (props, defaults, variants, slots, token bindings) plus a framework-agnostic structure. **Generate** all six framework outputs from that definition. Do not hand-maintain six diverging implementations.

Snapshot tests must assert that all framework outputs match visually and structurally for the same props (shared token/class structure, DOM shape, and/or preview screenshots).

## Docs site

A local docs site in the same repo. Each component page shows, together:

1. Live preview
2. Side panel of prop controls (toggles, selects, text fields), defaults selected on load
3. Code panel **always visible**, with framework tabs: **Astro**, **Next.js (React/TSX)**, **Svelte**, **Tailwind**, **HTML (inline CSS)**, **SCSS**
4. Copy button per tab; the code reflects the **current** prop values
5. Props table (name, type, default, description) and a short usage note

## MCP and HTTP API

Ship an MCP server agents can call, plus a plain JSON/HTTP API that mirrors it (same payloads).

Tools:

- `list_components` — catalog: id, name, description, tags, status
- `get_component` — props, defaults, variants, docs
- `get_code(component, framework, props)` — ready-to-paste code for that framework, with the given props applied
- `get_tokens` — the theme/token set (named colors, spacing, radius, type)

HTTP, for example: `GET /api/components`, `GET /api/components/:id`, `POST /api/code`, `GET /api/tokens`.

---

## Stack

- Docs site: **Astro** (TypeScript) + Tailwind, local first. Do NOT use Next.js for the site. Render live previews with Astro islands (React and Svelte integrations) so each framework output can be previewed. Next.js stays only as one of the six code outputs.
- Component schemas in TypeScript (zod or equivalent)
- Codegen + MCP server in TypeScript, same repo
- Tests: Vitest for schema and codegen snapshots; Playwright for the docs preview, props panel, and code tabs
- Package manager: pnpm preferred

No Xcode. No native/macOS/iOS app. No Tauri/Electron — this is a web docs site plus an MCP/HTTP API.

---

## Slices (small, fast; stop and report after each)

Keep runs short. Each slice ends with a local git commit and a `PROGRESS.md` update (what's done, what's next, blockers). Do not auto-continue into the next slice.

### Slice 1 (this run, unless told otherwise)

- Token / theme file with the spacing, radius, and named-color rules above
- **Button** and **Card** (control padding 12px left/right; card 16/12 with a prop for 16/16)
- Docs site: catalog, component page with live preview, props side panel, six framework code tabs + copy
- MCP + HTTP: `list_components`, `get_component`, `get_code`
- Neutral placeholder look + visible DESIGN SEEDS slot
- Snapshot tests for both components across all six outputs
- Write `PROGRESS.md`, commit locally, **stop**. Do not start Slice 2.

### Later (do not start until asked)

- **Slice 2:** text input, textarea / text view, divider; add `get_tokens`
- **Slice 3:** menu (6px exception), tabs (12px spacing), disclosure, data list (2px or 4px line gap)
- **Slice 4:** select, checkbox, switch, badge, tooltip
- **Slice 5:** dialog, toast, avatar, empty state
- **Slice 6:** when the two design seeds arrive, restyle everything from them and pack the library for consumption (Astro, Next.js, Svelte, Tailwind, HTML, SCSS)

---

## Builder notes

- **Claude Sonnet only for code** (`--model claude-sonnet-5-5 --effort medium`). No other model writes code.
- No Xcode.
- Commit finished work after each slice (local commit is enough unless told to push). Do not zip the repo.
- Icons only from https://factory.primitive8.cc/icons.
- Never put secrets, tokens, or passwords in chat or in the repo. Anything sensitive stays in gitignored files (`.env.local`).
- Do not invent ads, sample product data, or a custom visual language ahead of the design seeds.
- Name, tagline, and branding live only in `src/config/site.ts`.

## Done when (Slice 1)

- The docs site runs locally and shows Button and Card
- The props side panel updates the live preview
- All six framework tabs show copyable code that matches the current props
- MCP tools and the HTTP endpoints return the same data
- Tokens enforce the spacing / padding / radius rules
- The DESIGN SEEDS slot is visible and waiting
- Tests pass, `PROGRESS.md` is written, and the slice is committed locally
