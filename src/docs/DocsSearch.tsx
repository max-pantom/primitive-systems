import { useEffect, useMemo, useRef, useState } from 'react';
import { searchComponents } from '../lib/search';
import { components, templates } from '../components';

interface Item { key: string; label: string; hint: string; href: string }
const PAGES: Item[] = [
  { key: 'p:components', label: 'Components', hint: 'Page', href: '/' },
  { key: 'p:templates', label: 'Templates', hint: 'Page', href: '/templates' },
  { key: 'p:usage', label: 'Usage', hint: 'Page', href: '/usage' },
  { key: 'p:changelog', label: 'Changelog', hint: 'Page', href: '/changelog' },
];
const hrefFor = (id: string) => (templates.some((t) => t.id === id) ? `/templates#${id}` : `/#${id}`);

/** ⌘K / Ctrl+K search over components, templates and pages. Same engine agents use (search_components). */
export default function DocsSearch({ trigger = true }: { trigger?: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const returnTo = useRef<Element | null>(null);

  const items = useMemo<Item[]>(() => {
    const query = q.trim();
    if (!query) return [...PAGES, ...components.slice(0, 8).map((c) => ({ key: c.id, label: c.name, hint: 'Component', href: hrefFor(c.id) }))];
    const pages = PAGES.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()));
    const found = searchComponents(query, 12).results.map((r) => ({ key: r.id, label: r.name, hint: r.kind === 'template' ? 'Template' : 'Component', href: hrefFor(r.id) }));
    return [...found, ...pages];
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement)?.tagName ?? '') || (e.target as HTMLElement)?.isContentEditable;
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); returnTo.current = document.activeElement; setOpen((o) => !o); setQ(''); setI(0); }
      else if (e.key === '/' && !typing && !open) { e.preventDefault(); returnTo.current = document.activeElement; setOpen(true); setQ(''); setI(0); }
    };
    const onOpen = () => { returnTo.current = document.activeElement; setOpen(true); setQ(''); setI(0); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('p8-docs-search', onOpen);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('p8-docs-search', onOpen); };
  }, [open]);
  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  useEffect(() => setI(0), [q]);

  const close = () => { setOpen(false); (returnTo.current as HTMLElement | null)?.focus?.(); };
  const go = (it: Item) => {
    setOpen(false);
    const here = location.pathname.replace(/\/$/, '') || '/';
    const [path, hash] = it.href.split('#');
    if ((path || '/') === here && hash) location.hash = hash;
    else location.href = it.href;
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setI((x) => Math.min(items.length - 1, x + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setI((x) => Math.max(0, x - 1)); }
    else if (e.key === 'Enter' && items[i]) { e.preventDefault(); go(items[i]); }
    else if (e.key === 'Tab') e.preventDefault();
  };

  return (
    <>
      {trigger && <button type="button" className="link dsearch-trigger" onClick={() => window.dispatchEvent(new Event('p8-docs-search'))} data-testid="search-open" aria-keyshortcuts="Meta+K Control+K">Search <kbd>⌘K</kbd></button>}
      {open && (
        <div className="dsearch-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }} data-testid="search-backdrop">
          <div className="dsearch" role="dialog" aria-modal="true" aria-label="Search components and templates" onKeyDown={onKeyDown}>
            <input ref={input} role="combobox" aria-expanded="true" aria-controls="dsearch-list" aria-activedescendant={items[i] ? `dsearch-${items[i].key}` : undefined} aria-label="Search" placeholder="Search components, templates, pages…" value={q} onChange={(e) => setQ(e.target.value)} className="field" data-testid="search-input" />
            <ul id="dsearch-list" role="listbox" className="dsearch-list" aria-label="Results">
              {items.map((it, idx) => (
                <li key={it.key} id={`dsearch-${it.key}`} role="option" aria-selected={idx === i} className={idx === i ? 'on' : ''} onMouseMove={() => setI(idx)} onClick={() => go(it)}>
                  <span>{it.label}</span><span className="muted">{it.hint}</span>
                </li>
              ))}
              {!items.length && <li className="muted empty" role="presentation">Nothing matches “{q}”.</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
