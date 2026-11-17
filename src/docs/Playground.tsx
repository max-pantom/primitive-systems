import { createElement, useMemo, useState, type ReactNode } from 'react';
import { FRAMEWORKS, FRAMEWORK_LABELS, generate, type Framework } from '../codegen';
import { defaultsOf, getDef, type Node, type Props } from '../components';

const camel = (k: string) => (/^(aria|data)-/.test(k) ? k : k.replace(/-(\w)/g, (_, c) => c.toUpperCase()));

/** Render the framework-agnostic node tree as live React. Styles come from the same rules the codegen uses. */
function toReact(node: Node | string, key?: number): ReactNode {
  if (typeof node === 'string') return node;
  const attrs: Record<string, unknown> = { key };
  if (node.cls?.length) attrs.className = node.cls.join(' ');
  for (const [k, v] of Object.entries(node.attrs ?? {})) attrs[camel(k)] = v;
  if (node.tag === 'button') attrs.onClick = (e: { preventDefault(): void }) => e.preventDefault();
  return createElement(node.tag, attrs, ...(node.children ?? []).map((c, i) => toReact(c, i)));
}

export default function Playground({ id }: { id: string }) {
  const def = getDef(id)!;
  const [props, setProps] = useState<Props>(() => defaultsOf(def.props));
  const [fw, setFw] = useState<Framework>('astro');
  const [copied, setCopied] = useState(false);
  const set = (name: string, value: string | boolean) => setProps((p) => ({ ...p, [name]: value }));
  const result = useMemo(() => generate(def, props, fw), [def, props, fw]);
  const tree = useMemo(() => def.render(props), [def, props]);

  const copy = async () => {
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = FRAMEWORKS.indexOf(fw);
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (n === null) return;
    setFw(FRAMEWORKS[(n + FRAMEWORKS.length) % FRAMEWORKS.length]);
  };

  return (
    <div>
      <h1 className="m-0 text-xl font-medium">{def.name}</h1>
      <p className="muted mt-2 mb-8">{def.description}</p>
      <div className="grid gap-8" style={{ gridTemplateColumns: 'minmax(0,1fr) 280px' }}>
        <div className="flex flex-col gap-4 min-w-0">
          <div data-testid="preview" className="hairline rounded-lg flex items-center justify-center p-12 min-h-[240px]" style={{ background: 'var(--p8-color-canvas)' }}>
            <div style={{ width: props.fullWidth ? '100%' : undefined, maxWidth: 400 }}>{toReact(tree)}</div>
          </div>
          <div className="hairline rounded-lg overflow-hidden">
            <div className="flex items-center gap-1 p-2" role="tablist" aria-label="Framework" onKeyDown={onTabKey}>
              {FRAMEWORKS.map((f) => (
                <button key={f} role="tab" className="tab" aria-selected={f === fw} tabIndex={f === fw ? 0 : -1} onClick={() => setFw(f)} data-testid={`tab-${f}`}>
                  {FRAMEWORK_LABELS[f]}
                </button>
              ))}
              <button className="tab solid ml-auto" onClick={copy} data-testid="copy">
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="code" data-testid="code" role="tabpanel"><code>{result.code}</code></pre>
          </div>
        </div>

        <aside className="hairline rounded-lg p-4 flex flex-col gap-4 self-start" aria-label="Props" data-testid="panel">
          {def.props.map((p) => {
            const label = <label htmlFor={`prop-${p.name}`} className="font-medium">{p.name}</label>;
            const c = p.control;
            return (
              <div key={p.name} className="flex flex-col gap-1">
                {c.kind === 'boolean' ? (
                  <label className="flex items-center gap-2 font-medium">
                    <input id={`prop-${p.name}`} type="checkbox" checked={props[p.name] as boolean} onChange={(e) => set(p.name, e.target.checked)} />
                    {p.name}
                  </label>
                ) : (
                  label
                )}
                {c.kind === 'select' && (
                  <select id={`prop-${p.name}`} className="field" value={props[p.name] as string} onChange={(e) => set(p.name, e.target.value)}>
                    {c.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                )}
                {c.kind === 'text' && <input id={`prop-${p.name}`} className="field" value={props[p.name] as string} onChange={(e) => set(p.name, e.target.value)} />}
                {c.kind === 'textarea' && <textarea id={`prop-${p.name}`} className="field" rows={3} value={props[p.name] as string} onChange={(e) => set(p.name, e.target.value)} />}
              </div>
            );
          })}
          <button className="tab solid" onClick={() => setProps(defaultsOf(def.props))}>Reset</button>
        </aside>
      </div>

      <section className="mt-12 flex flex-col gap-4">
        <h2 className="m-0 font-medium">Props</h2>
        <table className="props" data-testid="props-table">
          <thead><tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
          <tbody>
            {def.props.map((p) => (
              <tr key={p.name}>
                <td><code>{p.name}</code></td>
                <td><code>{p.type}</code></td>
                <td><code>{String(p.default)}</code></td>
                <td>{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2 className="m-0 mt-4 font-medium">Usage</h2>
        <p className="m-0">{def.usage}</p>
        {def.composition && (<><h2 className="m-0 mt-4 font-medium">Composition</h2><p className="m-0">{def.composition}</p></>)}
      </section>
    </div>
  );
}
