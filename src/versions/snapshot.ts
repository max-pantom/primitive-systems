/** A compact, comparable fingerprint of a component at one release. No imports: it also runs against old checkouts. */
export type PropSnap = [name: string, type: string, def: string | boolean, options: string[] | null];
export interface Snap { name: string; props: PropSnap[]; cls: string[]; rules: string; html: string }

/** FNV-1a, 32-bit, hex. Same everywhere (browser, node, old checkouts). */
export function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const normalize = (code: string) => code.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/\/\/ ---behavior---[\s\S]*$/, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function snapshotOf(def: any, generate: (def: any, props: any, fw: string) => { code: string }): Snap {
  const props: PropSnap[] = (def.props ?? []).map((p: any) => [p.name, p.type, p.default, p.control?.options ?? null]);
  const defaults = Object.fromEntries((def.props ?? []).map((p: any) => [p.name, p.default]));
  let html = '';
  try { html = fnv(normalize(generate(def, defaults, 'html').code)); } catch { html = 'error'; }
  return { name: def.name, props, cls: (def.rules ?? []).map((r: any) => r.cls), rules: fnv(JSON.stringify(def.rules ?? [])), html };
}
