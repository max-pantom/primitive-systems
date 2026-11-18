import { attr, has, tagEnd } from './fix';
import { components } from '../components';

export interface Swap { component: string; props: Record<string, unknown>; why: string }
export interface ScanFinding { file: string; line: number; element: string; found: string; swap: Swap; framework: string; command: string }
export interface ScanReport {
  files: number; adopted: number; raw: number; adoption: number;
  findings: ScanFinding[]; byComponent: { component: string; count: number }[]; libraries: { name: string; files: string[] }[];
}

const ids = new Set(components.map((c) => c.id));
const lineOf = (code: string, idx: number) => code.slice(0, idx).split('\n').length;
const val = (attrs: string, name: string) => { const m = attr(attrs, name); return m?.[1] ?? m?.[2] ?? m?.[3]; };
const plain = (s?: string) => (s && !/[{}$]/.test(s) ? s : undefined);
const frameworkOf = (file: string) => (/\.(tsx|jsx)$/.test(file) ? 'react' : /\.svelte$/.test(file) ? 'svelte' : /\.astro$/.test(file) ? 'astro' : 'html');

/** UI libraries and the components they export that Primitive Systems replaces. */
const LIBS: { name: string; test: RegExp }[] = [
  { name: 'MUI', test: /^@mui\// }, { name: 'Ant Design', test: /^antd(\/|$)/ }, { name: 'Chakra UI', test: /^@chakra-ui\// }, { name: 'Mantine', test: /^@mantine\// },
  { name: 'React Bootstrap', test: /^react-bootstrap/ }, { name: 'Radix UI', test: /^@radix-ui\// }, { name: 'Headless UI', test: /^@headlessui\// }, { name: 'NextUI / HeroUI', test: /^@(nextui-org|heroui)\// },
  { name: 'shadcn/ui', test: /^(@|~)\/components\/ui\// }, { name: 'Bootstrap', test: /^bootstrap/ },
];
const COMPONENT_MAP: Record<string, string> = {
  Button: 'button', IconButton: 'icon-button', TextField: 'text-input', Input: 'text-input', InputBase: 'text-input', Textarea: 'textarea', TextArea: 'textarea', Select: 'select', NativeSelect: 'select',
  Checkbox: 'checkbox', Switch: 'switch', Toggle: 'switch', Radio: 'radio-group', RadioGroup: 'radio-group', Slider: 'slider', Card: 'card', Paper: 'card', Dialog: 'dialog', Modal: 'dialog', AlertDialog: 'dialog',
  Drawer: 'sheet', Sheet: 'sheet', Tabs: 'tabs', Tooltip: 'tooltip', Badge: 'badge', Chip: 'tag', Tag: 'tag', Avatar: 'avatar', Alert: 'alert', Snackbar: 'toast', Toast: 'toast', Toaster: 'toast',
  Spinner: 'spinner', CircularProgress: 'spinner', Progress: 'progress', LinearProgress: 'progress', Skeleton: 'skeleton', Table: 'table', DataTable: 'data-table', Menu: 'menu', DropdownMenu: 'dropdown-menu',
  Popover: 'popover', Accordion: 'accordion', Breadcrumb: 'breadcrumbs', Breadcrumbs: 'breadcrumbs', Pagination: 'pagination', Divider: 'divider', Separator: 'divider', Link: 'link', Typography: 'text', Heading: 'heading',
  DatePicker: 'date-picker', Combobox: 'combobox', Autocomplete: 'combobox', Stepper: 'stepper', Rating: 'rating', Navbar: 'navbar', AppBar: 'navbar', Calendar: 'calendar', Form: 'form',
};
const CLASS_HINTS: [RegExp, string, string][] = [
  [/\bcard\b/i, 'card', 'A hand-rolled card'], [/\b(modal|dialog|popup)\b/i, 'dialog', 'A hand-rolled modal'], [/\b(toast|snackbar)\b/i, 'toast', 'A hand-rolled toast'], [/\btooltip\b/i, 'tooltip', 'A hand-rolled tooltip'],
  [/\b(badge|pill)\b/i, 'badge', 'A hand-rolled badge'], [/\b(chip|tag)\b/i, 'tag', 'A hand-rolled chip'], [/\bavatar\b/i, 'avatar', 'A hand-rolled avatar'], [/\b(spinner|loader|loading-indicator)\b/i, 'spinner', 'A hand-rolled spinner'],
  [/\bskeleton\b/i, 'skeleton', 'A hand-rolled skeleton'], [/\b(alert|notice|callout)\b/i, 'alert', 'A hand-rolled alert'], [/\bbreadcrumbs?\b/i, 'breadcrumbs', 'Hand-rolled breadcrumbs'], [/\bpagination\b/i, 'pagination', 'Hand-rolled pagination'],
  [/\b(navbar|top-?bar|app-?bar)\b/i, 'navbar', 'A hand-rolled top bar'], [/\bsidebar\b/i, 'sidebar-nav', 'A hand-rolled sidebar'], [/\btabs?\b/i, 'tabs', 'Hand-rolled tabs'], [/\bdropdown\b/i, 'dropdown-menu', 'A hand-rolled dropdown'],
  [/\bempty-?state\b/i, 'empty-state', 'A hand-rolled empty state'],
];

function inputSwap(attrs: string): Swap | null {
  const type = (val(attrs, 'type') ?? 'text').toLowerCase();
  const ph = plain(val(attrs, 'placeholder'));
  const off = has(attrs, 'disabled');
  const common: Record<string, unknown> = { ...(ph ? { placeholder: ph } : {}), ...(off ? { disabled: true } : {}) };
  if (['hidden', 'image', 'reset'].includes(type)) return null;
  if (type === 'submit' || type === 'button') return { component: 'button', props: { ...(plain(val(attrs, 'value')) ? { label: plain(val(attrs, 'value')) } : {}), ...(off ? { disabled: true } : {}) }, why: `<input type="${type}"> is a button: use Button.` };
  if (type === 'password') return { component: 'password-input', props: common, why: 'Password field: Password Input adds show/hide and live requirements.' };
  if (type === 'search') return { component: 'search-input', props: common, why: 'Search field: Search Input has the leading icon and field fill.' };
  if (type === 'number') return { component: 'number-input', props: off ? { disabled: true } : {}, why: 'Number field: Number Input adds minus and plus buttons.' };
  if (type === 'checkbox') return { component: /switch|toggle/i.test(attrs) ? 'switch' : 'checkbox', props: off ? { disabled: true } : {}, why: 'Checkbox/switch: use the accessible controls.' };
  if (type === 'radio') return { component: 'radio-group', props: {}, why: 'Radios belong in a Radio Group with arrow-key selection.' };
  if (type === 'range') return { component: 'slider', props: off ? { disabled: true } : {}, why: 'Range input: Slider (stretches while dragging).' };
  if (type === 'file') return { component: 'file-upload', props: {}, why: 'File input: File Upload gives a dropzone and a file list.' };
  if (type === 'date') return { component: 'date-picker', props: {}, why: 'Date input: Date Picker has a calendar.' };
  if (type === 'time') return { component: 'time-picker', props: {}, why: 'Time input: Time Picker.' };
  if (type === 'color') return { component: 'color-picker', props: {}, why: 'Color input: Color Picker.' };
  const t = ['email', 'tel', 'url', 'text'].includes(type) ? (type === 'email' ? 'email' : 'text') : 'text';
  return { component: 'text-input', props: { ...common, type: t }, why: 'Text field: Text Input is 500px wide, hover/focus fill, aria-label from the placeholder.' };
}

/**
 * Scan source files for UI built without Primitive Systems and say what to swap in.
 * Pure text analysis (no parsing), tuned for HTML, JSX/TSX, Svelte, Astro and Vue.
 */
export function scanCode(files: { path: string; code: string }[], opts: { framework?: string } = {}): ScanReport {
  const findings: ScanFinding[] = [];
  const libs = new Map<string, Set<string>>();
  let adopted = 0;
  for (const { path, code } of files) {
    const fw = opts.framework ?? frameworkOf(path);
    const push = (idx: number, element: string, found: string, swap: Swap) => {
      if (!ids.has(swap.component)) return;
      const flags = Object.entries(swap.props).map(([k, v]) => `--prop ${k}=${v}`).join(' ');
      findings.push({ file: path, line: lineOf(code, idx), element, found: found.replace(/\s+/g, ' ').slice(0, 80), swap, framework: fw, command: `npx primitive add ${swap.component} -f ${fw}${flags ? ` ${flags}` : ''}` });
    };

    adopted += (code.match(/<p8-[a-z-]+/g) ?? []).length + (code.match(/class(?:Name)?\s*=\s*["'{`][^"'`]*\bp8-[a-z][a-z-]*/g) ?? []).length;

    // imports from UI libraries: remember library + local names
    const local = new Map<string, string>();
    for (const m of code.matchAll(/import\s+(?:type\s+)?([^'";]+?)\s+from\s+['"]([^'"]+)['"]/g)) {
      const lib = LIBS.find((l) => l.test.test(m[2]));
      if (!lib) continue;
      (libs.get(lib.name) ?? libs.set(lib.name, new Set()).get(lib.name)!).add(path);
      const names = [...m[1].matchAll(/(?:\{([^}]*)\})|(\w+)/g)].flatMap((x) => (x[1] ? x[1].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()!) : [x[2]]));
      for (const nme of names) if (nme) local.set(nme, lib.name);
      const base = m[2].split('/').pop() ?? '';
      const guess = COMPONENT_MAP[base.charAt(0).toUpperCase() + base.slice(1)];
      if (guess) for (const nme of names) if (!COMPONENT_MAP[nme]) local.set(nme, lib.name);
    }

    const re = /<(button|input|textarea|select|table|dialog|details|progress|[A-Z][A-Za-z0-9.]*|div|section|article|aside|nav|header|span|ul)(?=[\s/>])/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(code))) {
      const tag = m[1];
      const end = tagEnd(code, m.index + m[0].length);
      if (end < 0) continue;
      const attrs = code.slice(m.index + m[0].length, end).replace(/\/$/, '');
      if (/\bp8-/.test(attrs) || /\{\s*\.\.\./.test(attrs) && tag === 'div') continue;
      const open = code.slice(m.index, end + 1);
      if (tag === 'button') {
        const close = code.indexOf('</button>', end);
        const inner = close > 0 ? code.slice(end + 1, close) : '';
        const text = plain(inner.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());
        const iconOnly = /<svg|<img|<Icon/i.test(inner) && !inner.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').trim();
        const cls = val(attrs, 'class') ?? val(attrs, 'className') ?? '';
        const variant = /primary|cta|filled|solid/i.test(cls) ? 'primary' : /ghost|outline|secondary|link|text/i.test(cls) ? 'ghost' : undefined;
        push(m.index, 'button', open, iconOnly ? { component: 'icon-button', props: { label: plain(val(attrs, 'aria-label')) ?? 'Action', ...(has(attrs, 'disabled') ? { disabled: true } : {}) }, why: 'Icon-only button: Icon Button requires a label (aria-label).' } : { component: 'button', props: { ...(text ? { label: text } : {}), ...(variant ? { variant } : {}), ...(has(attrs, 'disabled') ? { disabled: true } : {}) }, why: 'Raw <button>: Button has the 12px control padding, hover, focus and disabled states.' });
      } else if (tag === 'input') { const s = inputSwap(attrs); if (s) push(m.index, 'input', open, s); }
      else if (tag === 'textarea') push(m.index, 'textarea', open, { component: 'textarea', props: { ...(plain(val(attrs, 'placeholder')) ? { placeholder: plain(val(attrs, 'placeholder')) } : {}), ...(plain(val(attrs, 'rows')) ? { rows: plain(val(attrs, 'rows')) } : {}) }, why: 'Raw <textarea>: use Textarea.' });
      else if (tag === 'select') push(m.index, 'select', open, { component: 'select', props: has(attrs, 'disabled') ? { disabled: true } : {}, why: 'Raw <select>: Select keeps native behavior with the control styling.' });
      else if (tag === 'table') push(m.index, 'table', open, { component: /sort|selectable|pagin/i.test(attrs) ? 'data-table' : 'table', props: {}, why: 'Raw <table>: Table (or Data Table for sorting and selection).' });
      else if (tag === 'dialog') push(m.index, 'dialog', open, { component: 'dialog', props: {}, why: '<dialog>: Dialog adds backdrop, Escape and a focus trap.' });
      else if (tag === 'details') push(m.index, 'details', open, { component: 'disclosure', props: {}, why: '<details>: Disclosure adds the animated chevron and tokens (Accordion for a group).' });
      else if (tag === 'progress') push(m.index, 'progress', open, { component: 'progress', props: {}, why: '<progress>: Progress is styled with tokens.' });
      else if (/^[A-Z]/.test(tag)) {
        const lib = local.get(tag.split('.')[0]);
        const id = COMPONENT_MAP[tag.split('.').pop()!];
        if (lib && id) push(m.index, tag, open, { component: id, props: {}, why: `<${tag}> from ${lib}: replace with Primitive Systems ${id}.` });
      } else {
        const cls = val(attrs, 'class') ?? val(attrs, 'className') ?? val(attrs, 'role') ?? '';
        if (!cls) continue;
        const hit = CLASS_HINTS.find(([r]) => r.test(cls));
        if (hit && !(tag === 'nav' && hit[1] !== 'breadcrumbs' && hit[1] !== 'navbar' && hit[1] !== 'sidebar-nav' && hit[1] !== 'pagination' && hit[1] !== 'tabs') && !(tag === 'ul' && hit[1] === 'card')) push(m.index, `${tag}.${cls.split(/\s+/)[0]}`, open, { component: hit[1], props: {}, why: `${hit[2]} (class "${cls.split(/\s+/).find((c) => hit[0].test(c)) ?? cls}"): use ${hit[1]}.` });
      }
    }
  }
  const counts = new Map<string, number>();
  for (const f of findings) counts.set(f.swap.component, (counts.get(f.swap.component) ?? 0) + 1);
  const raw = findings.length;
  return {
    files: files.length, adopted, raw, adoption: adopted + raw ? Math.round((adopted / (adopted + raw)) * 100) : 100,
    findings, byComponent: [...counts].map(([component, count]) => ({ component, count })).sort((a, b) => b.count - a.count || a.component.localeCompare(b.component)),
    libraries: [...libs].map(([name, f]) => ({ name, files: [...f] })),
  };
}
