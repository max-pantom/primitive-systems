# Changelog

Components are marked **New** or **Refined** in the catalog and in `list_components` (`mark`, `since`).

## 0.8.0
- **New:** Tree View, Scroll Area, Timer (countdown / stopwatch), Inline Edit, Code Block (grey highlighter + copy).
- **Refined:** Slider (thumb stretches into a pill while dragging, like Switch), Menu (`Label | ⌘R` shows a keyboard shortcut on the right).
- **Usage page** at `/usage`: what agents pull from the public MCP and API (aggregate counts only).
- Code highlighter greys darkened so every shade passes 4.5:1; accessibility panel on every component page.

## 0.7.0 — agent release
- **New:** Combobox, Number Input, OTP Input, Stepper, Rating, Accordion, Stat Card, Avatar Group, Progress Ring, Banner.
- **Rule book and check book:** every design rule is data, enforced by tests (`pnpm rules`). Per-component do/don't guidelines.
- **Refined:** Icon Button, Toolbar, Popover, Sheet, Disclosure, Dialog (now follow the 12px control / 16-12 surface rules), Stack (gaps limited to 4/8/12).
- Agent surface: remote MCP (`/mcp`), HTTP API, `<p8-*>` runtime (`/p8.js`), CLI (`primitive add|search|info|lint|theme|tokens|rules`), skill, `llms.txt`, theme builder, compose and search tools, spacing lint.

## 0.6.0 — 25 components (form, feedback, navigation, data, overlays, small bits)
## 0.5.0 — Dialog, Toast, Avatar with real behavior and backdrops
## 0.4.0 — Select, Checkbox, Switch, Badge, Tooltip
## 0.3.0 — Menu, Tabs, Disclosure, Data List
## 0.2.0 — Text Input, Textarea, Divider, `get_tokens`
## 0.1.0 — Tokens, Button, Card, docs site, codegen, MCP + HTTP
