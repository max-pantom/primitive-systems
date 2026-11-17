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
