import { createElement, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Agentation } from 'agentation';
import { site } from '../config/site';
import { FRAMEWORKS, FRAMEWORK_LABELS, generate, type Framework } from '../codegen';
import { reactify } from '../codegen/react-node';
import { components, defaultsOf, type ComponentDef, type Node, type Props } from '../components';
import { iconElements } from '../icons/icons';
import { highlight } from './highlight';

const camel = (k: string) => (k === 'for' ? 'htmlFor' : /^(aria|data)-/.test(k) ? k : k.replace(/-(\w)/g, (_, c) => c.toUpperCase()));

/** Render the framework-agnostic node tree as live React. Styles come from the same rules the codegen uses. */
function toReact(node: Node | string, key?: number): ReactNode {
  if (typeof node === 'string') return node;
  const r = reactify(node);
  const attrs: Record<string, unknown> = { key };
  if (r.cls?.length) attrs.className = r.cls.join(' ');
  for (const [k, v] of Object.entries(r.attrs ?? {})) attrs[camel(k)] = v;
  if (r.tag === 'button') attrs.onClick = (e: { preventDefault(): void }) => e.preventDefault();
  if (r.tag === 'details') { attrs.key = `${key}-${attrs.open}`; }
  return createElement(r.tag, attrs, ...(r.children ?? []).map((c, i) => toReact(c, i)));
}

function Icon({ name }: { name: 'moon' | 'sun' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconElements(name, 16).map(([tag, a], i) => (tag === 'path' ? <path key={i} {...a} /> : tag === 'circle' ? <circle key={i} {...a} /> : <line key={i} {...a} />))}
    </svg>
  );
}

function useHash(): [string, (id: string) => void] {
  const read = () => decodeURIComponent(location.hash.slice(1));
  const [h, setH] = useState(read);
  useEffect(() => {
    const on = () => setH(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [h, (id) => { location.hash = id; }];
}

function Workbench({ def }: { def: ComponentDef }) {
  const [props, setProps] = useState<Props>(() => defaultsOf(def.props));
  const [fw, setFw] = useState<Framework>('astro');
  const [copied, setCopied] = useState(false);
  const set = (name: string, value: string | boolean) => setProps((p) => ({ ...p, [name]: value }));
  const result = useMemo(() => generate(def, props, fw), [def, props, fw]);
  const tree = useMemo(() => def.render(props), [def, props]);
  const html = useMemo(() => highlight(result.code), [result]);

  const copy = async () => {
    await navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const onTabKey = (e: React.KeyboardEvent) => {
    const i = FRAMEWORKS.indexOf(fw);
    const nx = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (nx !== null) setFw(FRAMEWORKS[(nx + FRAMEWORKS.length) % FRAMEWORKS.length]);
  };

  return (
    <>
      <section className="center" data-testid="center">
        <header>
          <h1>{def.name}</h1>
          <p className="muted">{def.description}</p>
        </header>
        <div data-testid="preview" className="preview">
          <div key={JSON.stringify(props)} style={{ width: props.fullWidth ? '100%' : undefined }}>{toReact(tree)}</div>
        </div>

        <h2>Usage</h2>
        <p>{def.usage}</p>
        {def.composition && (<><h2>Composition</h2><p>{def.composition}</p></>)}

        <h2>Props</h2>
        <div className="table-wrap">
          <table className="props" data-testid="props-table">
            <thead><tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr></thead>
            <tbody>
              {def.props.map((p) => (
                <tr key={p.name}>
                  <td><code>{p.name}</code></td>
                  <td><code>{p.type}</code></td>
                  <td><code>{JSON.stringify(p.default)}</code></td>
                  <td>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2>Code</h2>
        <div className="codebox">
          <div className="tabs" role="tablist" aria-label="Framework" onKeyDown={onTabKey}>
            {FRAMEWORKS.map((f) => (
              <button key={f} role="tab" className="tab" aria-selected={f === fw} tabIndex={f === fw ? 0 : -1} onClick={() => setFw(f)} data-testid={`tab-${f}`}>
                {FRAMEWORK_LABELS[f]}
              </button>
            ))}
            <button className="tab copy" onClick={copy} data-testid="copy">{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <pre className="code" data-testid="code" role="tabpanel"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
        </div>
      </section>

      <aside className="right" aria-label="Props" data-testid="panel">
        <div className="panel-head"><h2>Props</h2><button className="link" onClick={() => setProps(defaultsOf(def.props))}>Reset</button></div>
        {def.props.map((p) => {
          const c = p.control;
          const id = `prop-${p.name}`;
          return (
            <div key={p.name} className="control">
              {c.kind === 'boolean' ? (
                <label className="check"><input id={id} type="checkbox" checked={props[p.name] as boolean} onChange={(e) => set(p.name, e.target.checked)} />{p.name}</label>
              ) : (
                <label htmlFor={id}>{p.name}</label>
              )}
              {c.kind === 'select' && <select id={id} className="field" value={props[p.name] as string} onChange={(e) => set(p.name, e.target.value)}>{c.options.map((o) => <option key={o}>{o}</option>)}</select>}
              {c.kind === 'text' && <input id={id} className="field" value={props[p.name] as string} onChange={(e) => set(p.name, e.target.value)} />}
              {c.kind === 'textarea' && <textarea id={id} className="field" rows={3} value={props[p.name] as string} onChange={(e) => set(p.name, e.target.value)} />}
            </div>
          );
        })}
      </aside>
    </>
  );
}

export default function App() {
  const [hash, go] = useHash();
  const def = components.find((c) => c.id === hash) ?? components[0];
  const [theme, setTheme] = useState('light');
  useEffect(() => setTheme(document.documentElement.dataset.theme ?? 'light'), []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <div className="app">
      <aside className="left">
        <div>
          <div className="brand">{site.name}</div>
          <div className="muted">{site.tagline}</div>
        </div>
        <nav className="nav" aria-label="Components">
          {components.map((c) => (
            <a key={c.id} href={`#${c.id}`} aria-current={c.id === def.id ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go(c.id); }}>{c.name}</a>
          ))}
        </nav>
        <button className="link theme" onClick={toggle} aria-label="Toggle dark mode" data-testid="theme-toggle">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          {theme === 'dark' ? 'Light' : 'Dark'} mode
        </button>
      </aside>
      <Workbench key={def.id} def={def} />
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}
