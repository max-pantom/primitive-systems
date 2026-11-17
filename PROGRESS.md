# Progress

## Slice 1 — done (design seeds applied)

- Tokens: `src/tokens/theme.ts` → CSS variables (light/dark), served at `/theme.css`. Named colors only; space/radius on the 4/8 grid (2px and 6px documented exceptions).
- Components (single definition each, `src/components/`): **Button**, **Card** (16/12, `padding: even` → 16/16; Card composes Button via `withAction`).
- Codegen (`src/codegen/`): Astro, Next.js (TSX), Svelte, Tailwind (arbitrary properties over tokens), HTML inline CSS, SCSS, all from one node tree + rule set.
- Docs (Astro + Tailwind, React island): catalog, live preview, props side panel, six code tabs with copy, props table, usage/composition notes, dark mode toggle.
- MCP (`pnpm mcp`, stdio) and HTTP (`pnpm api`, port 4322): `list_components`, `get_component`, `get_code` ↔ `GET /api/components`, `GET /api/components/:id`, `POST /api/code`. Same handlers, same payloads.
- Icons: vendored from the Primitive8 Icon Factory pack (`src/icons/pack.json`, outline, sizes 14/16).
- Seeds: `seeds/seeds.tsx` + `seeds/README.md`; banner reads "DESIGN SEEDS — applied".
- Tests: Vitest (52: tokens, schemas, 6-framework snapshots, cross-framework parity, MCP≡HTTP); Playwright (5: catalog, props→preview+code, padding, tabs+copy, dark mode).

Run: `pnpm dev` (docs), `pnpm test`, `pnpm test:e2e`.

## Deviations / blockers

- **Seeds were applied in Slice 1** (they arrived), instead of placeholders.
- **Hover, focus, disabled are not in the seeds.** Derived: hover = `control-strong`, focus = 2px ink outline, disabled = 50% opacity, primary hover = 80% opacity. Please confirm.
- Seeds' dark canvas and surface are both #1D1D1D; the light seed has no canvas color, so light canvas is white.
- **Svelte island preview not done.** The preview is rendered with React from the shared node tree; Svelte integration is installed but unused. Per-framework live previews are still to do.
- Parity tests compare DOM shape and class structure, not screenshots.
- System Node is 22.23.3 but Astro 7 needs ≥22.23.4, so `node@22.23.5` is a devDependency (used by `pnpm` scripts). `astro check` does not support TypeScript 7; `pnpm check` runs `tsc`.
- Primary hover opacity token and button icon gap (8px) are my choices.
- The icon repo is private-ish; paths were read via `gh` and vendored, not installed as a package.

## Next (only when asked)

Slice 2: text input, textarea, divider, `get_tokens`.
