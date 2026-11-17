/**
 * <p8-*> runtime: registers every component as a custom element so the short P8 form just works.
 *   <script src=".../p8.js"></script>
 *   <p8-button variant="primary">Save</p8-button>
 * Attributes are props (boolean attribute = true, "false" = false); element text becomes the content prop.
 */
import { site } from '../config/site';
import { allCss } from '../codegen';
import { hasBehavior, runtime } from '../codegen/behavior';
import { components, templates, defaultsOf, type ComponentDef, type Node, type Props } from '../components';
import { themeToCss } from '../tokens/theme';

const SVG = new Set(['svg', 'path', 'line', 'circle', 'rect', 'polygon', 'animate', 'animateTransform']);
const NS = 'http://www.w3.org/2000/svg';

function toDom(node: Node | string): Node_ {
  if (typeof node === 'string') return document.createTextNode(node);
  const el = SVG.has(node.tag) ? document.createElementNS(NS, node.tag) : document.createElement(node.tag);
  if (node.cls?.length) el.setAttribute('class', node.cls.join(' '));
  for (const [k, v] of Object.entries(node.attrs ?? {})) el.setAttribute(k, v === true ? '' : v);
  const inputLike = node.tag === 'input' ? (el as HTMLInputElement) : null;
  if (inputLike && node.attrs?.value !== undefined) inputLike.value = String(node.attrs.value);
  for (const c of node.children ?? []) el.appendChild(toDom(c));
  if (node.tag === 'select') {
    const sel = (node.children ?? []).findIndex((c) => typeof c !== 'string' && c.attrs?.selected);
    if (sel >= 0) (el as HTMLSelectElement).selectedIndex = sel;
  }
  return el;
}
type Node_ = globalThis.Node;

function readProps(el: HTMLElement, def: ComponentDef, text: string): Props {
  const props = defaultsOf(def.props);
  for (const p of def.props) {
    const raw = el.getAttribute(p.name);
    if (raw === null) continue;
    props[p.name] = p.control.kind === 'boolean' ? raw !== 'false' : raw;
  }
  if (def.content && text) props[def.content] = text;
  return props;
}

function define(def: ComponentDef) {
  const tag = `${site.cssPrefix}-${def.id}`;
  if (customElements.get(tag)) return;
  customElements.define(tag, class extends HTMLElement {
    static observedAttributes = def.props.map((p) => p.name.toLowerCase());
    private text: string | null = null;
    private stop?: () => void;
    connectedCallback() { this.render(); }
    disconnectedCallback() { this.stop?.(); this.stop = undefined; }
    attributeChangedCallback() { if (this.text !== null) this.render(); }
    render() {
      if (this.text === null) this.text = (this.textContent ?? '').trim();
      const node = def.render(readProps(this, def, this.text));
      this.stop?.();
      this.replaceChildren(toDom(node));
      this.stop = hasBehavior(node) ? (new Function(`${runtime(node)}\nreturn initP8;`)() as (r: Element) => () => void)(this) : undefined;
    }
  });
}

function boot() {
  if (!document.querySelector('style[data-p8]')) {
    const style = document.createElement('style');
    style.setAttribute('data-p8', '');
    style.textContent = `${themeToCss()}\n${site.cssPrefix}-*{display:contents}\n${allCss()}`;
    document.head.prepend(style);
  }
  [...components, ...templates].forEach(define);
}
boot();
(window as unknown as { P8: unknown }).P8 = { components: [...components, ...templates].map((c) => c.id) };
