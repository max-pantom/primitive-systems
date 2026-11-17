/** Release history: the source of truth for CHANGELOG.md, /changelog, GET /api/changelog and the get_changelog tool. */
export interface Release { version: string; title: string; items: string[] }

export const RELEASES: Release[] = [
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
