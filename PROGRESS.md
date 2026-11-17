# Progress

## 0.9.0 — pickers and changelog

- Nine new components: Date Picker, Time Picker, Multi-select, File Upload, Swatch Picker, Carousel, Timeline, Context Menu and Hover Card → 66 total. All share the seed tokens, six framework generators and per-component guidelines.
- Release history now lives in `src/changelog.ts`, generating CHANGELOG.md and powering `/changelog`, `GET /api/changelog` and MCP `get_changelog`. The catalog and component pages show release metadata.
- Fixed typed-date synchronization, invalid date fallbacks, disabled picker actions, keyboard swatch entry, multi-select filtering and selection announcements, and upload drops (including accept/multiple restrictions and the native FileList). Custom swatch colors work in React and inline HTML.
- Added interaction regression tests, MCP/HTTP changelog parity, custom-color codegen checks, and browser coverage for changelog links and new controls. Browser catalog checks now use the API count instead of a hardcoded 57.
- Verification: 1,204 Vitest tests; type checking and 66-component rule audit pass. Production build passes. All 18 Playwright checks pass (17 in the full run, then the catalog-wide layout guard after its final fix). Multi-select keeps its empty height and may grow as chips wrap.
- Usage storage remains unconnected, as documented in 0.8.0; this release does not change that.

## 0.8.0 — done

- Slider drag stretch; Menu shortcut hints; 5 new components (Tree View, Scroll Area, Timer, Inline Edit, Code Block) → 57 total.
- **/usage:** aggregate counters for MCP + HTTP (tools, components, frameworks, clients, optional `?model=` / `x-p8-model`, 14-day chart) and a live overview of the public MCP. Store is Upstash Redis when `UPSTASH_REDIS_REST_*` / `KV_REST_API_*` exist, otherwise memory. **Not connected yet, so /usage is incomplete on Vercel** (the MCP and API functions don't share memory) — run `vercel integration add upstash` (needs you to accept the terms) for durable stats. MCP does not transmit the model, so "models" is self-reported.
- Local dev: `pnpm api` now serves `/api/*` and `/mcp` exactly like Vercel; the docs dev server proxies to it.
- Fixed by the checker: highlighter greys below 4.5:1; fixed by the layout-shift guard: Timer button/time widths, Inline Edit swap.

## Agent release (0.7.0) — done

- **Rule book + check book:** `src/rules/rulebook.ts` → RULEBOOK.md / CHECKBOOK.md, enforced by `pnpm rules` and `pnpm test`. The checker caught real violations, including the Toolbar's Icon Buttons (8px side padding; now 12/8), plus Popover/Disclosure padding, Dialog gap, Stack gaps and muted-text contrast. Toolbar now passes.
- **10 new components:** Combobox, Number Input, OTP Input, Stepper, Rating, Accordion, Stat Card, Avatar Group, Progress Ring, Banner (52 total). Every component has do/don't guidelines and a New/Refined marker.
- **`<p8-*>` runtime:** `/p8.js` registers every component as a custom element (attributes = props, text = content, behavior included, theme injected).
- **Agent surface:** remote MCP at `/mcp` (Streamable HTTP), HTTP API at `/api`, CLI (`primitive add|search|info|lint|theme|tokens|rules|compose`), Claude Code skill, `llms.txt`, AGENTS.md, README. New MCP tools: `search_components`, `compose_code`, `get_rules`, `build_theme`, `lint_code`, `get_install`.
- **Theme builder** (ink/canvas per mode + radius → full contrast-checked token CSS), **spacing lint** for consumer code, **changelog** (CHANGELOG.md, `since`/`mark` in the catalog).
- Icons: Toolbar defaults now use six pack icons (edit, copy, download, star, trash + separator).

## Later slices (not started)

**Blocks** (explicitly later): sign-in, settings, pricing, onboarding, chat, empty dashboard, and then a generative "describe it" tool on top of them. Today `search_components` + `compose_code` cover the agent-driven version.

**Components:** the remaining pickers, upload, carousel, timeline, context menu and hover card shipped in 0.9.0.

**Bigger features:** Figma sync of tokens and components (needs the Figma connection); motion presets beyond the two motion tokens (enter / exit / press); accessibility *page* per component showing contrast / keyboard / labels (the automated checks exist, the docs UI for them does not); theme builder UI in the docs site (CLI, MCP and API exist); publish the CLI to npm so `npx primitive` works without the repo; per-framework live previews (Svelte island).

## Earlier work
## Behavior + 25 new components — done

- **Behavior runtime** (`src/codegen/behavior.ts`): one small `initP8(root)` generated per component, containing only the handlers its markup needs (`data-p8` hooks). Plain HTML/Tailwind/SCSS include a `<script>`; Astro a `<script>`; React a `useEffect`+ref; Svelte `onMount`+`bind:this`. The docs preview runs the same runtime, so what you click is what ships.
- Working: Checkbox, Switch (click, label, Space), Tabs/Radio/Segmented (click + arrows/Home/End, roving tabindex), Menu (arrows, Escape), Dropdown + Popover (open/close, outside click, Escape, focus return), Dialog/Sheet/Palette (backdrop, Escape, Tab trap, Cmd/Ctrl+K for the palette), Toast stack (auto-dismiss, close, 4 corners), Tooltip (hover/focus, viewport-aware flip/nudge), Pagination, Tag/Alert dismiss, Copy button, Disclosure (CSS height + chevron animation).
- New components: Radio Group, Field, Search Input, Segmented Control, Slider, Spinner, Skeleton, Progress, Alert, Sidebar Nav, Breadcrumbs, Pagination, Command Palette, List Row, Table, Key-Value Row, Stack, Toolbar, Popover, Dropdown Menu, Sheet, Icon Button, Kbd, Tag, Copy Button. 42 components total.
- Codegen: `Rule.nested` (pseudo/vendor selectors), toggled `--on/--active` classes kept real in HTML/Tailwind outputs, per-framework script embedding.
- Tests: 749 Vitest (incl. 17 jsdom behavior tests run against the generated HTML), 12 Playwright (incl. a layout-shift guard over every interactive element).
- Docs: usage/composition/props shown as a table in the right sidebar.

Caveats: the script is attached with `initP8(document)` (HTML/Astro) so it is page-global; React/Svelte scope it to the component root. Disclosure height animation needs Chrome 131+/Safari 18.4+ (`::details-content`); elsewhere it opens instantly. Tooltip flipping and Skeleton/Spinner animation are not covered by jsdom tests (no layout/SMIL).

## Feedback round 2 — done

- Strokes: the hairline is the seed's 0.5px again, but drawn as an inset outline (pixel-snapped on all sides, no layout impact) instead of box-shadow, which lost sides at half-pixel positions.
- Divider lines use a border (always visible). Light control fill is #EEEEEE; text-field focus = hover fill, no ring.
- Badge: 4px radius only, Geist Mono at -0.02em by default, `font: normal` prop for the interface font; stronger fill for light mode. Tabs/menu highlight uses control-strong.
- Right sidebar is wider (360, resizable) and holds controls + usage/composition/props; left sidebar is nav only. Thin low-contrast scrollbars.
- e2e guard: clicking any interactive element in any preview must not move or resize the component (found and fixed a 1px checkbox shift from inline-flex baseline).

## Feedback round 1 — done

- Spacing: header/nav text gaps are 4px (no 2px); data list gap options are 4 and 8.
- Hairline is now 1px at lower alpha (0.5px dropped sides at fractional zoom); focus is a dim 2px stroke, no outline rings.
- Docs (usage, composition, props) moved into the left sidebar, which is resizable (drag the divider, width saved). Code panel is fixed height so tab changes no longer move the page. Left padding 24, narrower, lighter inactive text.
- New first code tab **P8**: short `<p8-button variant="primary">Save</p8-button>` form (non-default props only). This is the agent shorthand; no runtime that renders `<p8-*>` tags exists yet.
- Fixes: divider shows (with label), tabs panel removed, selects/inputs 500px wide with no default label, disabled select icon dimmed, badge `shape` (pill/soft), tooltip is CSS hover/focus, switch toggles and its thumb stretches while pressed, preview checkbox/tabs/menu are clickable. Empty State removed.

## Slices 2–5 — done (one commit)

- Slice 2: Text Input, Textarea, Divider, `get_tokens` (MCP) + `GET /api/tokens`.
- Slice 3: Menu (6px sides, 4px top/bottom), Tabs (12px spacing), Disclosure (native details), Data List (4px or 2px gap).
- Slice 4: Select, Checkbox, Switch, Badge, Tooltip.
- Slice 5: Dialog, Toast, Avatar, Empty State.
- 18 components total, 288 Vitest tests (snapshots for all six outputs, parity, MCP≡HTTP), 8 Playwright tests (including every component rendering with six code tabs).
- Docs is now a one-page app at `/` (hash routes, first component loads immediately): left nav, centre preview + docs, right props panel, code at the bottom, vertical hairline dividers. Seeds banner removed. Custom grey-scale code highlighter. Agentation toolbar mounts in dev only.
- New tokens: `ink-muted` (derived), `syntax-1..4`, `size-*`, `radius-full`, `space-32`.
- Codegen fixes found by tests: attribute escaping, non-void empty elements, React `defaultValue` handling.

Caveats:
- Checkbox, Switch, Tabs, Menu, Tooltip, Disclosure ship as static markup with ARIA state (no behavior JS); toggle `aria-checked`/modifier classes in your app. Dialog/Toast/Tooltip are the panel only (no backdrop, positioning or timers).
- `ink-muted`, tooltip/toast/dialog styling and the 12px dialog/menu radius are derived from the seeds, not designed; confirm.
- Per-framework live previews (Svelte island) are still not done.

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
