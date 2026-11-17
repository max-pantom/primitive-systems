/** Release history: the source of truth for CHANGELOG.md, /changelog, GET /api/changelog and the get_changelog tool. */
export interface Release { version: string; title: string; items: string[] }

export const RELEASES: Release[] = [
  { version: '0.11.0', title: 'Templates, app components, lint --fix, diff_component', items: [
    'New templates (whole screens): Sign-in, Settings page, Dashboard, List to detail, Empty page. Page at /templates; tools list_templates and get_template; GET /api/templates. Search finds them ("login screen").',
    'New app components: Empty State, Form (validation and submit wiring), Calendar (month view with events), Chart and Sparkline, Chat Message and Chat Composer, Navbar, App Shell.',
    'New primitives: Toggle Group, Link, Heading, Text, Color Picker (full), Tag Input, Infinite List, Split Button.',
    'lint_code fix: true (CLI: primitive lint --fix) corrects off-grid spacing and radius, gaps other than 4/8/12, raw hex colours (nearest theme token) and missing labels (aria-label, alt), and lists every change. Lint now also reports gaps, colours and labels.',
    'Version pinning and diff_component: snapshots rebuilt from the real release history (0.1.0, 0.5.0 to 0.10.0). list_versions, diff_component (one component or the whole library, with breaking flag and migration hints), and a version argument on get_component and get_code.',
    'Code-creating widgets now clone styled template nodes, so they look right in Svelte and Astro scoped styles as well as plain HTML and Tailwind.',
  ] },
  { version: '0.10.0', title: 'App components: data table, range picker, panels', items: [
    'New: Password Input (show/hide, live requirements), Data Table (sorting, row selection, column visibility, bulk actions), Date Range Picker, Resizable Panels, Sortable List (drag and keyboard), Filter Bar, Notification List, Image Viewer (lightbox).',
    'Keyboard reports cover focusable widgets that are not buttons (the resize divider).',
  ] },
  { version: '0.9.0', title: 'Pickers, carousel, timeline, context menu', items: [
    'New: Date Picker (calendar popover), Time Picker, Multi-select with chips, File Upload (dropzone + list), Swatch Picker, Carousel, Timeline, Context Menu, Hover Card.',
    'Changelog page at /changelog, GET /api/changelog and the get_changelog tool.',
    'Nodes can carry an inline style (used by swatches); it is merged into the HTML output and emitted as an object in React.',
  ] },
  { version: '0.8.0', title: 'Usage, tree, timer, code block', items: [
    'New: Tree View, Scroll Area, Timer (countdown / stopwatch), Inline Edit, Code Block (grey highlighter + copy).',
    'Refined: Slider thumb stretches into a pill while dragging, like Switch. Menu items accept "Label | ⌘R" to show a shortcut on the right.',
    'Usage page at /usage: what agents pull from the public MCP and API (aggregate counts only).',
    'Code highlighter greys darkened so every shade passes 4.5:1; accessibility panel on every component page.',
  ] },
  { version: '0.7.0', title: 'Agent release', items: [
    'New: Combobox, Number Input, OTP Input, Stepper, Rating, Accordion, Stat Card, Avatar Group, Progress Ring, Banner.',
    'Rule book and check book: every design rule is data, enforced by tests (pnpm rules). Per-component do/don\'t guidelines.',
    'Refined: Icon Button, Toolbar, Popover, Sheet, Disclosure, Dialog (now follow the 12px control / 16-12 surface rules), Stack (gaps limited to 4/8/12).',
    'Agent surface: remote MCP (/mcp), HTTP API, <p8-*> runtime (/p8.js), CLI (primitive add|search|info|lint|theme|tokens|rules), skill, llms.txt, theme builder, compose and search tools, spacing lint.',
  ] },
  { version: '0.6.0', title: '25 components', items: ['Form, feedback, navigation, data and overlay components, plus small bits (Icon Button, Kbd, Tag, Copy Button).'] },
  { version: '0.5.0', title: 'Dialog, Toast, Avatar', items: ['Real behavior and backdrops.'] },
  { version: '0.4.0', title: 'Select, Checkbox, Switch, Badge, Tooltip', items: ['Form controls and small status pieces.'] },
  { version: '0.3.0', title: 'Menu, Tabs, Disclosure, Data List', items: ['Navigation and content pieces.'] },
  { version: '0.2.0', title: 'Text Input, Textarea, Divider', items: ['get_tokens (MCP and HTTP).'] },
  { version: '0.1.0', title: 'Foundations', items: ['Tokens, Button, Card, docs site, codegen, MCP and HTTP.'] },
];

export const changelogMarkdown = () =>
  `# Changelog\n\nGenerated from \`src/changelog.ts\`. Components are marked **New** or **Refined** in the catalog and in \`list_components\` (\`mark\`, \`since\`).\n\n${RELEASES.map((r) => `## ${r.version} — ${r.title}\n${r.items.map((i) => `- ${i}`).join('\n')}\n`).join('\n')}`;
