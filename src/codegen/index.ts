import { site } from '../config/site';
import { getDef, ruleMap, usedClasses, parseProps, defaultsOf } from '../components';
import { reactAttrName, reactify, styleToObject } from './react-node';
import { hasBehavior, runtime } from './behavior';
import type { ComponentDef, Decls, Node, Props, Rule } from '../components';

export const FRAMEWORKS = ['p8', 'astro', 'react', 'svelte', 'tailwind', 'html', 'scss'] as const;
export type Framework = (typeof FRAMEWORKS)[number];

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  p8: 'P8',
  astro: 'Astro',
  react: 'Next.js (React/TSX)',
  svelte: 'Svelte',
  tailwind: 'Tailwind',
  html: 'HTML (inline CSS)',
  scss: 'SCSS',
};

export interface CodeResult {
  component: string;
  framework: Framework;
  language: string;
  filename: string;
  props: Props;
  code: string;
}

type Mode = 'react' | 'class' | 'tailwind' | 'inline';
const STATES = ['hover', 'focus', 'disabled', 'placeholder'] as const;
const stateSel = { hover: ':hover:not(:disabled)', focus: ':focus-visible', disabled: ':disabled', placeholder: '::placeholder' };
const twState = { hover: 'enabled:hover:', focus: 'focus-visible:', disabled: 'disabled:', placeholder: 'placeholder:' };

const PARENT = {
  hover: { css: (P: string, C: string) => `.${P}:hover .${C}, .${P}:focus-within .${C}`, scss: (P: string) => `.${P}:hover &, .${P}:focus-within &`, tw: (P: string) => `group-hover/${P}:group-focus-within/${P}:` },
  active: { css: (P: string, C: string) => `.${P}:active:not(:disabled) .${C}`, scss: (P: string) => `.${P}:active:not(:disabled) &`, tw: (P: string) => `group-active/${P}:` },
} as const;
const PSTATES = ['hover', 'active'] as const;
/** Parent classes that need a Tailwind `group/name` marker for the current output. */
let ctxParents = new Set<string>();

/** `X--on` / `X--active` modifiers are toggled by the behavior script, so they must stay real classes with real CSS. */
const isMod = (k: string) => /--(on|active)$/.test(k);
const isPair = (k: string) => isMod(k) || ruleMap.has(`${k}--on`) || ruleMap.has(`${k}--active`);
const modRules = (rules: Rule[]) => rules.filter((r) => isMod(r.cls));

const pascal = (s: string) => s.replace(/(^|[-_ ])(\w)/g, (_, __, ch) => ch.toUpperCase());
const rulesFor = (node: Node): Rule[] => usedClasses(node).map((k) => ruleMap.get(k)).filter(Boolean) as Rule[];
const declLines = (d: Decls, important = false) => Object.entries(d).map(([k, val]) => `${k}: ${val}${important ? ' !important' : ''};`);

/* ---------- CSS / SCSS ---------- */
export function css(rules: Rule[], opts: { onlyStates?: boolean; important?: boolean } = {}): string {
  const out: string[] = [];
  for (const r of rules) {
    if (!opts.onlyStates && Object.keys(r.base).length)
      out.push(`.${r.cls} {\n${declLines(r.base).map((l) => `  ${l}`).join('\n')}\n}`);
    for (const s of STATES) {
      const d = r[s];
      if (d) out.push(`.${r.cls}${stateSel[s]} {\n${declLines(d, opts.important).map((l) => `  ${l}`).join('\n')}\n}`);
    }
    for (const nx of r.nested ?? []) out.push(`.${r.cls}${nx.sel} {\n${declLines(nx.decls, opts.important).map((l) => `  ${l}`).join('\n')}\n}`);
    for (const ps of PSTATES) {
      const d = r.parent?.[ps];
      if (d) out.push(`${PARENT[ps].css(r.parent!.cls, r.cls)} {\n${declLines(d, opts.important).map((l) => `  ${l}`).join('\n')}\n}`);
    }
  }
  return out.join('\n\n');
}

export function scss(rules: Rule[]): string {
  return rules
    .map((r) => {
      const lines = declLines(r.base).map((l) => `  ${l}`);
      for (const s of STATES) {
        const d = r[s];
        if (d) lines.push(`  &${stateSel[s]} {\n${declLines(d).map((l) => `    ${l}`).join('\n')}\n  }`);
      }
      for (const nx of r.nested ?? []) lines.push(`  &${nx.sel} {\n${declLines(nx.decls).map((l) => `    ${l}`).join('\n')}\n  }`);
      for (const ps of PSTATES) {
        const d = r.parent?.[ps];
        if (d) lines.push(`  ${PARENT[ps].scss(r.parent!.cls)} {\n${declLines(d).map((l) => `    ${l}`).join('\n')}\n  }`);
      }
      return `.${r.cls} {\n${lines.join('\n')}\n}`;
    })
    .join('\n\n');
}

/** Every rule in the library, for the docs preview. */
export const allCss = () => css([...ruleMap.values()]);

/* ---------- Tailwind utilities (arbitrary properties over named tokens) ---------- */
const arb = (prop: string, val: string, prefix = '') => `${prefix}[${prop}:${val.replace(/ /g, '_')}]`;

function mergedDecls(cls: string[], key: 'base' | (typeof STATES)[number]): Decls {
  const out: Decls = {};
  for (const k of cls) Object.assign(out, ruleMap.get(k)?.[key] ?? {});
  return out;
}

function tailwindClasses(cls: string[]): string {
  const out: string[] = [];
  for (const [p, val] of Object.entries(mergedDecls(cls, 'base'))) out.push(arb(p, val));
  for (const s of STATES) for (const [p, val] of Object.entries(mergedDecls(cls, s))) out.push(arb(p, val, twState[s]));
  for (const ps of PSTATES) {
    const merged: Decls = {};
    let parent = '';
    for (const k of cls) {
      const r = ruleMap.get(k);
      if (r?.parent?.[ps]) { Object.assign(merged, r.parent[ps]); parent = r.parent.cls; }
    }
    const variants = PARENT[ps].tw(parent).split(':').filter(Boolean);
    for (const [p, val] of Object.entries(merged)) for (const vr of variants) out.push(arb(p, val, `${vr}:`));
  }
  const nested = new Map<string, Decls>();
  for (const k of cls) for (const nx of ruleMap.get(k)?.nested ?? []) nested.set(nx.sel, { ...(nested.get(nx.sel) ?? {}), ...nx.decls });
  for (const [sel, decls] of nested) for (const [p, val] of Object.entries(decls)) out.push(arb(p, val, `[&${sel.replace(/ /g, '_')}]:`));
  const groups = cls.filter((k) => ctxParents.has(k)).map((k) => `group/${k}`);
  return [...groups, ...out].join(' ');
}

/* ---------- Markup ---------- */
const esc = (t: string, braces: boolean) => {
  let s = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (braces) s = s.replace(/[{}]/g, (ch) => `{'${ch}'}`);
  return s;
};
const VOID = new Set(['input', 'img', 'hr', 'br', 'path', 'line', 'circle', 'rect', 'polygon', 'animate', 'animateTransform']);
const escAttr = (t: string) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function attrString(node: Node, mode: Mode): string {
  const parts: string[] = [];
  const cls = node.cls ?? [];
  if (mode === 'react') {
    if (cls.length) parts.push(`className="${cls.join(' ')}"`);
  } else if (mode === 'class') {
    if (cls.length) parts.push(`class="${cls.join(' ')}"`);
  } else if (mode === 'tailwind') {
    const t = [...cls.filter(isPair), tailwindClasses(cls.filter((k) => !isMod(k)))].filter(Boolean).join(' ');
    if (t) parts.push(`class="${t}"`);
  } else {
    const base = [declLines(mergedDecls(cls.filter((k) => !isMod(k)), 'base')).join(' ').replace(/;$/, ''), typeof node.attrs?.style === 'string' ? node.attrs.style : ''].filter(Boolean).join('; ');
    const stateful = cls.filter((k) => isPair(k) || STATES.some((s) => ruleMap.get(k)?.[s]) || ruleMap.get(k)?.parent || ruleMap.get(k)?.nested);
    if (stateful.length) parts.push(`class="${stateful.join(' ')}"`);
    if (base) parts.push(`style="${base}"`);
  }
  for (const [k, val] of Object.entries(node.attrs ?? {})) {
    if (k === 'style' && mode === 'inline') continue;
    if (k === 'style' && mode === 'react' && typeof val === 'string') { parts.push(`style={${JSON.stringify(styleToObject(val)).replace(/"([A-Za-z_$][\w$]*)":/g, '$1: ').replace(/^\{/, '{ ').replace(/\}$/, ' }')}}`); continue; }
    const name = mode === 'react' ? reactAttrName(k) : k;
    parts.push(val === true ? name : `${name}="${escAttr(val)}"`);
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}

/** Whitespace is significant inside <pre>: serialize children with no indentation or newlines. */
function inlineMarkup(node: Node | string, mode: Mode): string {
  if (typeof node === 'string') return esc(node, mode === 'react');
  const a = attrString(node, mode);
  const kids = node.children ?? [];
  return kids.length ? `<${node.tag}${a}>${kids.map((k) => inlineMarkup(k, mode)).join('')}</${node.tag}>` : `<${node.tag}${a}></${node.tag}>`;
}

export function markup(node: Node | string, mode: Mode, depth = 0): string {
  if (mode === 'react' && typeof node !== 'string') node = reactify(node);
  const pad = '  '.repeat(depth);
  if (typeof node === 'string') return pad + esc(node, mode === 'react');
  if (node.tag === 'pre') return `${pad}${inlineMarkup(node, mode)}`;
  const a = attrString(node, mode);
  const kids = node.children ?? [];
  if (!kids.length) return VOID.has(node.tag) ? `${pad}<${node.tag}${a} />` : `${pad}<${node.tag}${a}></${node.tag}>`;
  if (kids.every((k) => typeof k === 'string')) return `${pad}<${node.tag}${a}>${kids.map((k) => esc(k as string, mode === 'react')).join('')}</${node.tag}>`;
  return `${pad}<${node.tag}${a}>\n${kids.map((k) => markup(k, mode, depth + 1)).join('\n')}\n${pad}</${node.tag}>`;
}

const indent = (s: string, n: number) => s.split('\n').map((l) => (l ? '  '.repeat(n) + l : l)).join('\n');
const note = `Requires the ${site.name} theme variables (theme.css).`;

export function generate(def: ComponentDef, input: unknown, framework: Framework): CodeResult {
  const props = parseProps(def, input);
  const node = def.render(props);
  const rules = rulesFor(node);
  ctxParents = new Set(rules.flatMap((r) => (r.parent ? [r.parent.cls] : [])));
  const name = pascal(def.id);
  const js = hasBehavior(node) ? runtime(node) : '';
  const withRef = (m: string, attr: string) => m.replace(/^(\s*<[A-Za-z0-9-]+)/, `$1 ${attr}`);
  let code: string, language: string, filename: string;

  switch (framework) {
    case 'p8': {
      language = 'html';
      filename = `${def.id}.p8.html`;
      const defaults = defaultsOf(def.props);
      const attrs = def.props
        .filter((pp) => pp.name !== def.content && props[pp.name] !== defaults[pp.name])
        .map((pp) => (props[pp.name] === true ? pp.name : `${pp.name}="${escAttr(String(props[pp.name]))}"`));
      const tag = `${site.cssPrefix}-${def.id}`;
      const open = [tag, ...attrs].join(' ');
      const inline = def.content ? `<${open}>${esc(String(props[def.content]), false)}</${tag}>` : `<${open} />`;
      code = inline.length <= 80 ? `${inline}\n` : `<${tag}\n${attrs.map((a) => `  ${a}`).join('\n')}${def.content ? `\n>${esc(String(props[def.content]), false)}</${tag}>` : '\n/>'}\n`;
      break;
    }
    case 'react':
      language = 'tsx';
      filename = `${name}.tsx`;
      code = js
        ? `// ${filename} — ${note}\nimport { useEffect, useRef } from 'react';\nimport './${def.id}.css';\n\nexport function ${name}() {\n  const ref = useRef<any>(null);\n  useEffect(() => initP8(ref.current), []);\n  return (\n${withRef(markup(node, 'react', 2), 'ref={ref}')}\n  );\n}\n\n/* ${def.id}.css */\n${css(rules)}\n\n// ---behavior---\n${js}\n`
        : `// ${filename} — ${note}\nimport './${def.id}.css';\n\nexport function ${name}() {\n  return (\n${markup(node, 'react', 2)}\n  );\n}\n\n/* ${def.id}.css */\n${css(rules)}\n`;
      break;
    case 'astro':
      language = 'astro';
      filename = `${name}.astro`;
      code = `---\n// ${note}\n---\n\n${markup(node, 'class')}\n\n<style>\n${indent(css(rules), 1)}\n</style>\n${js ? `\n<script>\n${js}\ninitP8(document);\n</script>\n` : ''}`;
      break;
    case 'svelte':
      language = 'svelte';
      filename = `${name}.svelte`;
      code = `${js ? `<script>\n  import { onMount } from 'svelte';\n  let el;\n  onMount(() => initP8(el));\n${indent(js, 1)}\n</script>\n\n` : ''}<!-- ${note} -->\n${js ? withRef(markup(node, 'class'), 'bind:this={el}') : markup(node, 'class')}\n\n<style>\n${indent(css(rules), 1)}\n</style>\n`;
      break;
    case 'tailwind':
      language = 'html';
      filename = `${def.id}.html`;
      const twMods = css(modRules(rules));
      code = `<!-- ${note} Tailwind v4 arbitrary properties over named tokens. -->\n${twMods ? `<style>\n${indent(twMods, 1)}\n</style>\n` : ''}${markup(node, 'tailwind')}\n${js ? `\n<script>\n${js}\ninitP8(document);\n</script>\n` : ''}`;
      break;
    case 'html': {
      language = 'html';
      filename = `${def.id}.html`;
      const mods = modRules(rules);
      const states = [css(rules.filter((r) => !isMod(r.cls)), { onlyStates: true, important: true }), css(mods, { important: true })].filter(Boolean).join('\n\n');
      code = `<!-- ${note} -->\n${states ? `<style>\n${indent(states, 1)}\n</style>\n` : ''}${markup(node, 'inline')}\n${js ? `\n<script>\n${js}\ninitP8(document);\n</script>\n` : ''}`;
      break;
    }
    case 'scss':
      language = 'scss';
      filename = `_${def.id}.scss`;
      code = `// ${filename} — ${note}\n${scss(rules)}\n\n// Markup\n${markup(node, 'class').split('\n').map((l) => `// ${l}`).join('\n')}\n${js ? `\n// Behavior (JS)\n${js.split('\n').map((l) => `// ${l}`).join('\n')}\n// initP8(document);\n` : ''}`;
      break;
  }
  return { component: def.id, framework, language, filename, props, code };
}

export function generateById(id: string, input: unknown, framework: Framework): CodeResult {
  const def = getDef(id);
  if (!def) throw new Error(`Unknown component: ${id}`);
  return generate(def, input, framework);
}
