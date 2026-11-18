# Changelog

Generated from `src/changelog.ts`. Components are marked **New** or **Refined** in the catalog and in `list_components` (`mark`, `since`).

## 0.12.0 — Search, repo scan, house voice, situations
- New: Link Preview (an unfurled URL as a card: image, site, title, description; loading and error states).
- Docs search: press ⌘K / Ctrl+K (or /) on any docs page to search components, templates and pages with the same engine agents use.
- scan_code (CLI: primitive scan <dir>): finds every raw button, input, select, textarea, table, dialog, hand-rolled card/modal/toast and MUI/Chakra/Ant/shadcn component in a project, with the swap, props taken from the markup, the command and an adoption %.
- suggest_ui (CLI: primitive suggest): describe a state ("user has no projects yet", "confirm deleting a file", "saving failed") and get the right component or screen with props and wording filled in; pass a framework for the code.
- House voice: written rules (get_rules → voice), suggest_copy (button labels, empty states, errors, confirmations, success, loading) and check_copy (flags exclamation marks, "please", "Oops", Title Case, "Submit", long text).
- Context budget mode: brief: true on list_components, get_component, get_code, get_template and search_components (HTTP ?brief=1) returns only props and the snippet.
- Lightbox: Image Viewer is the lightbox (one line = a single-image lightbox); it is now found by searching "lightbox".

## 0.11.0 — Templates, app components, lint --fix, diff_component
- New templates (whole screens): Sign-in, Settings page, Dashboard, List to detail, Empty page. Page at /templates; tools list_templates and get_template; GET /api/templates. Search finds them ("login screen").
- New app components: Empty State, Form (validation and submit wiring), Calendar (month view with events), Chart and Sparkline, Chat Message and Chat Composer, Navbar, App Shell.
- New primitives: Toggle Group, Link, Heading, Text, Color Picker (full), Tag Input, Infinite List, Split Button.
- lint_code fix: true (CLI: primitive lint --fix) corrects off-grid spacing and radius, gaps other than 4/8/12, raw hex colours (nearest theme token) and missing labels (aria-label, alt), and lists every change. Lint now also reports gaps, colours and labels.
- Version pinning and diff_component: snapshots rebuilt from the real release history (0.1.0, 0.5.0 to 0.10.0). list_versions, diff_component (one component or the whole library, with breaking flag and migration hints), and a version argument on get_component and get_code.
- Code-creating widgets now clone styled template nodes, so they look right in Svelte and Astro scoped styles as well as plain HTML and Tailwind.

## 0.10.0 — App components: data table, range picker, panels
- New: Password Input (show/hide, live requirements), Data Table (sorting, row selection, column visibility, bulk actions), Date Range Picker, Resizable Panels, Sortable List (drag and keyboard), Filter Bar, Notification List, Image Viewer (lightbox).
- Keyboard reports cover focusable widgets that are not buttons (the resize divider).

## 0.9.0 — Pickers, carousel, timeline, context menu
- New: Date Picker (calendar popover), Time Picker, Multi-select with chips, File Upload (dropzone + list), Swatch Picker, Carousel, Timeline, Context Menu, Hover Card.
- Changelog page at /changelog, GET /api/changelog and the get_changelog tool.
- Nodes can carry an inline style (used by swatches); it is merged into the HTML output and emitted as an object in React.

## 0.8.0 — Usage, tree, timer, code block
- New: Tree View, Scroll Area, Timer (countdown / stopwatch), Inline Edit, Code Block (grey highlighter + copy).
- Refined: Slider thumb stretches into a pill while dragging, like Switch. Menu items accept "Label | ⌘R" to show a shortcut on the right.
- Usage page at /usage: what agents pull from the public MCP and API (aggregate counts only).
- Code highlighter greys darkened so every shade passes 4.5:1; accessibility panel on every component page.

## 0.7.0 — Agent release
- New: Combobox, Number Input, OTP Input, Stepper, Rating, Accordion, Stat Card, Avatar Group, Progress Ring, Banner.
- Rule book and check book: every design rule is data, enforced by tests (pnpm rules). Per-component do/don't guidelines.
- Refined: Icon Button, Toolbar, Popover, Sheet, Disclosure, Dialog (now follow the 12px control / 16-12 surface rules), Stack (gaps limited to 4/8/12).
- Agent surface: remote MCP (/mcp), HTTP API, <p8-*> runtime (/p8.js), CLI (primitive add|search|info|lint|theme|tokens|rules), skill, llms.txt, theme builder, compose and search tools, spacing lint.

## 0.6.0 — 25 components
- Form, feedback, navigation, data and overlay components, plus small bits (Icon Button, Kbd, Tag, Copy Button).

## 0.5.0 — Dialog, Toast, Avatar
- Real behavior and backdrops.

## 0.4.0 — Select, Checkbox, Switch, Badge, Tooltip
- Form controls and small status pieces.

## 0.3.0 — Menu, Tabs, Disclosure, Data List
- Navigation and content pieces.

## 0.2.0 — Text Input, Textarea, Divider
- get_tokens (MCP and HTTP).

## 0.1.0 — Foundations
- Tokens, Button, Card, docs site, codegen, MCP and HTTP.
