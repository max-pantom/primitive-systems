import type { Node } from '../components';

/** React wants defaultValue instead of value/children-on-textarea/selected-option. Applied for code output and live preview. */
export function reactify(node: Node): Node {
  const attrs = { ...(node.attrs ?? {}) };
  let children = node.children?.map((c) => (typeof c === 'string' ? c : reactify(c)));
  if (node.tag === 'input' && 'value' in attrs) {
    attrs.defaultValue = attrs.value;
    delete attrs.value;
  }
  if (node.tag === 'textarea' && children?.length) {
    attrs.defaultValue = children.join('');
    children = [];
  }
  if (node.tag === 'select' && children) {
    const sel = children.find((c) => typeof c !== 'string' && c.attrs?.selected) as Node | undefined;
    if (sel) attrs.defaultValue = (sel.children?.[0] as string) ?? '';
    children = children.map((c) => {
      if (typeof c === 'string' || !c.attrs?.selected) return c;
      const { selected: _s, ...rest } = c.attrs;
      return { ...c, attrs: rest };
    });
  }
  return { ...node, attrs, children };
}

/** "background: var(--x); color: red" -> { background: 'var(--x)', color: 'red' } (React style object). */
export function styleToObject(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of css.split(';')) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    out[k.startsWith('--') ? k : k.replace(/-(\w)/g, (_, c) => c.toUpperCase())] = part.slice(i + 1).trim();
  }
  return out;
}
