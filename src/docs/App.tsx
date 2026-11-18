import { Fragment, createElement, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Agentation } from 'agentation';
import { site } from '../config/site';
import { FRAMEWORKS, FRAMEWORK_LABELS, generate, type Framework } from '../codegen';
import { reactAttrName, reactify, styleToObject } from '../codegen/react-node';
import { hasBehavior, runtime } from '../codegen/behavior';
import { components, defaultsOf, type ComponentDef, type Node, type Props } from '../components';
import { iconElements } from '../icons/icons';
import { highlight } from './highlight';
import DocsSearch from './DocsSearch';
import { a11yReport } from '../rules/a11y';

const camel = reactAttrName;

/** Render the framework-agnostic node tree as live React. Behavior comes from the same generated runtime the code output ships. */
function toReact(node: Node | string, key?: number): ReactNode {
  if (typeof node === 'string') return node;
  const r = reactify(node);
  const attrs: Record<string, unknown> = { key };
  if (r.cls?.length) attrs.className = r.cls.join(' ');
  for (const [k, v] of Object.entries(r.attrs ?? {})) attrs[camel(k)] = k === 'style' && typeof v === 'string' ? styleToObject(v) : v;
  if (r.tag === 'a') attrs.onClick = (e: { preventDefault(): void }) => e.preventDefault();
  return createElement(r.tag, attrs, ...(r.children ?? []).map((c, i) => toReact(c, i)));
}

function Icon({ name }: { name: 'moon' | 'sun' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconElements(name, 16).map(([tag, a], i) => (tag === 'path' ? <path key={i} {...a} /> : tag === 'circle' ? <circle key={i} {...a} /> : <line key={i} {...a} />))}
    </svg>
  );
}

function Chevron() {
  return (
    <svg className="chev" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconElements('chevron-down', 16).map(([tag, a], i) => createElement(tag, { key: i, ...a }))}
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

function Docs({ def, tree }: { def: ComponentDef; tree: Node }) {
  const a11y = useMemo(() => a11yReport(def, tree), [def, tree]);
  return (
    <div className="docs" data-testid="docs">
      <details className="fold" data-testid="usage">
        <summary><h2>Usage</h2><Chevron /></summary>
        <p>{def.usage}</p>
      </details>
      {def.guidelines && (
        <section data-testid="guidelines">
          <h2>Guidelines</h2>
          <ul className="rules do">{def.guidelines.do.map((t) => <li key={t}><span className="tick">Do</span>{t}</li>)}</ul>
          <ul className="rules dont">{def.guidelines.dont.map((t) => <li key={t}><span className="tick">Don't</span>{t}</li>)}</ul>
        </section>
      )}
      {def.composition && <section><h2>Composition</h2><p>{def.composition}</p></section>}
      {/* Collapsed for people; the content stays in the DOM, and agents get the same report from get_component / GET /api/components/:id. */}
      <details className="fold" data-testid="a11y">
        <summary><h2>Accessibility</h2><Chevron /></summary>
        <h3>Contrast <span className="muted">(WCAG AA, 4.5:1)</span></h3>
        <table className="props a11y" data-testid="a11y-contrast">
          <thead><tr><th>Text</th><th>Light</th><th>Dark</th></tr></thead>
          <tbody>
            {a11y.contrast.map((r) => (
              <tr key={`${r.fg}${r.bg}${r.state}`} className={r.pass ? '' : 'fail'}>
                <td><code>{r.fg}</code> on <code>{r.bg}</code>{r.state !== 'default' && <span className="muted"> · {r.state}</span>}{r.exempt && <div className="muted">Exempt: placeholder</div>}</td>
                <td className="nowrap">{r.light}:1 {r.light >= 4.5 ? '✓' : '✗'}</td>
                <td className="nowrap">{r.dark}:1 {r.dark >= 4.5 ? '✓' : '✗'}</td>
              </tr>
            ))}
            {!a11y.contrast.length && <tr><td colSpan={3} className="muted">No text in this component.</td></tr>}
          </tbody>
        </table>
        <h3>Keyboard</h3>
        <ul className="keys" data-testid="a11y-keyboard">
          {a11y.keyboard.map((k) => <li key={k.keys + k.does}><kbd>{k.keys}</kbd><span>{k.does}</span></li>)}
        </ul>
        <h3>Labels and roles</h3>
        <table className="props a11y" data-testid="a11y-labels">
          <thead><tr><th>Role</th><th>Name</th></tr></thead>
          <tbody>
            {a11y.labels.map((l, i) => (
              <tr key={i}><td><code>{l.role}</code>{l.state && <div className="muted">{l.state}</div>}</td><td>{l.name}<div className="muted">{l.source}</div></td></tr>
            ))}
            {!a11y.labels.length && <tr><td colSpan={2} className="muted">Presentational: no interactive roles.</td></tr>}
          </tbody>
        </table>
      </details>
      <section data-testid="install">
        <h2>Install</h2>
        <code className="block">npx {site.cli} add {def.id} -f react</code>
        <code className="block">&lt;{site.cssPrefix}-{def.id}&gt;</code>
        <p className="muted">Add <code>{'<script src="' + site.url + '/p8.js">'}</code> once and the tag works anywhere.</p>
      </section>
      <section>
        <h2>Props</h2>
        <ul className="proplist" data-testid="props-table">
          {def.props.map((p) => (
            <li key={p.name}>
              <div className="prop-head"><code className="prop-name">{p.name}</code><span className="prop-type">{p.type.replace(/ \(.*\)$/, '')}</span></div>
              <p>{p.description}</p>
              <div className="prop-default"><span className="muted">Default</span><code>{JSON.stringify(p.default)}</code></div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Workbench({ def }: { def: ComponentDef }) {
  const [props, setProps] = useState<Props>(() => defaultsOf(def.props));
  const [fw, setFw] = useState<Framework>('p8');
  const [copied, setCopied] = useState(false);
  const set = (name: string, value: string | boolean) => setProps((p) => ({ ...p, [name]: value }));
  const result = useMemo(() => generate(def, props, fw), [def, props, fw]);
  const tree = useMemo(() => def.render(props), [def, props]);
  const html = useMemo(() => highlight(result.code), [result]);
  const previewRef = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(props);
  useEffect(() => {
    if (!previewRef.current || !hasBehavior(tree)) return;
    const init = new Function(`${runtime(tree)}\nreturn initP8;`)() as (root: Element, opts?: object) => () => void;
    return init(previewRef.current, { noTimers: true });
  }, [key, tree]);

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
          <p className="muted since" data-testid="since">Since {def.since}{def.mark ? ` · ${def.mark === 'new' ? 'New' : 'Refined'}` : ''}</p>
        </header>
        <div data-testid="preview" className="preview">
          <div key={key} ref={previewRef} style={{ width: props.fullWidth ? '100%' : undefined }}>{toReact(tree)}</div>
        </div>
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
        <div className="panel-head"><h2>Controls</h2><button className="link" onClick={() => setProps(defaultsOf(def.props))}>Reset</button></div>
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
        <Docs def={def} tree={tree} />
      </aside>
    </>
  );
}

export default function App({ defs = components, section = 'Components' }: { defs?: ComponentDef[]; section?: string } = {}) {
  const [hash, go] = useHash();
  const def = defs.find((c) => c.id === hash) ?? defs[0];
  const [theme, setTheme] = useState('light');
  useEffect(() => { document.querySelector('.nav a[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' }); }, [hash]);
  const [left, setLeft] = useState(220);
  const [right, setRight] = useState(360);
  useEffect(() => {
    const l = Number(localStorage.getItem('leftWidth'));
    const r = Number(localStorage.getItem('rightWidth'));
    if (l) setLeft(l);
    if (r) setRight(r);
  }, []);
  const startResize = (side: 'left' | 'right') => (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const calc = (x: number) => (side === 'left' ? Math.min(480, Math.max(180, x)) : Math.min(560, Math.max(280, window.innerWidth - x)));
    const apply = side === 'left' ? setLeft : setRight;
    const move = (ev: PointerEvent) => apply(calc(ev.clientX));
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      localStorage.setItem(side === 'left' ? 'leftWidth' : 'rightWidth', String(calc(ev.clientX)));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  return (
    <div className="app" style={{ gridTemplateColumns: `${left}px minmax(0, 1fr) ${right}px` }}>
      <aside className="left">
        <div>
          <div className="brand">{site.name}</div>
          <div className="muted">{site.tagline}</div>
        </div>
        <DocsSearch />
        <nav className="nav" aria-label={section}>
          {defs.map((c) => (
            <a key={c.id} href={`#${c.id}`} aria-current={c.id === def.id ? 'page' : undefined} onClick={(e) => { e.preventDefault(); go(c.id); }}>{c.name}{c.mark === 'new' && <span className="mark">New</span>}</a>
          ))}
        </nav>
        <a className="link" href={section === 'Templates' ? '/' : '/templates'} data-testid="switch-link">{section === 'Templates' ? 'Components' : 'Templates'}</a>
        <a className="link" href="/usage" data-testid="usage-link">Usage</a>
        <a className="link" href="/changelog" data-testid="changelog-link">Changelog</a>
        <button className="link theme" onClick={toggle} aria-label="Toggle dark mode" data-testid="theme-toggle">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          {theme === 'dark' ? 'Light' : 'Dark'} mode
        </button>
      </aside>
      <div className="resize" style={{ left: left - 4 }} onPointerDown={startResize('left')} role="separator" aria-orientation="vertical" aria-label="Resize left sidebar" data-testid="resize" />
      <div className="resize" style={{ right: right - 4 }} onPointerDown={startResize('right')} role="separator" aria-orientation="vertical" aria-label="Resize right sidebar" data-testid="resize-right" />
      <Workbench key={def.id} def={def} />
      {import.meta.env.DEV && <Agentation />}
    </div>
  );
}
