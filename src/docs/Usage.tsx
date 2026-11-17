import { useEffect, useState } from 'react';
import { site } from '../config/site';

interface Counts { id: string; count: number }
interface Summary { store: 'redis' | 'memory'; since: string; total: number; today: number; last7: number; days: { day: string; count: number }[]; components: Counts[]; tools: Counts[]; frameworks: Counts[]; clients: Counts[]; models: Counts[]; sources: Counts[] }
interface McpTool { name: string; description: string }

function Bars({ title, rows, empty, testid }: { title: string; rows: Counts[]; empty: string; testid?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section className="u-card" data-testid={testid}>
      <h2>{title}</h2>
      {rows.length === 0 && <p className="muted">{empty}</p>}
      <ol className="bars">
        {rows.slice(0, 10).map((r) => (
          <li key={r.id}>
            <span className="bar-label">{r.id}</span>
            <span className="bar-track"><span className="bar-fill" style={{ width: `${(r.count / max) * 100}%` }} /></span>
            <span className="bar-n">{r.count}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Usage() {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState('');
  const [tools, setTools] = useState<McpTool[] | null>(null);
  const [ping, setPing] = useState<{ ok: boolean; ms: number } | null>(null);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    fetch('/api/usage').then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status))))).then(setData).catch((e) => setErr(String(e.message ?? e)));
    const t0 = performance.now();
    fetch('/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) })
      .then((r) => r.json()).then((j) => { setTools(j.result.tools); setPing({ ok: true, ms: Math.round(performance.now() - t0) }); }).catch(() => setPing({ ok: false, ms: 0 }));
  }, []);

  const mcpUrl = `${site.url}/mcp`;
  const cmds = [
    ['Claude Code', `claude mcp add --transport http ${site.slug} ${mcpUrl}`],
    ['Tag your client and model (optional)', `${mcpUrl}?client=my-agent&model=claude-opus`],
    ['JSON config', JSON.stringify({ mcpServers: { [site.slug]: { type: 'http', url: mcpUrl } } })],
  ];
  const copy = async (k: string, text: string) => { await navigator.clipboard.writeText(text); setCopied(k); setTimeout(() => setCopied(''), 1200); };
  const max = Math.max(1, ...(data?.days.map((d) => d.count) ?? [1]));

  return (
    <main className="usage" data-testid="usage">
      <header>
        <a href="/" className="muted">← {site.name}</a>
        <h1>Usage</h1>
        <p className="muted">What agents pull from the public MCP and API. Aggregate counts only: no IPs, prompts, props or code are stored.</p>
      </header>

      {err && <p data-testid="usage-error">Could not load usage ({err}).</p>}

      <section className="u-stats" data-testid="usage-totals">
        {[['Calls', data?.total], ['Today', data?.today], ['Last 7 days', data?.last7], ['Components pulled', data ? data.components.length : undefined]].map(([k, v]) => (
          <div key={String(k)} className="u-stat"><span className="muted">{k}</span><strong>{v ?? '—'}</strong></div>
        ))}
      </section>

      {data?.store === 'memory' && (
        <p className="u-note" data-testid="usage-store">No durable store is connected, so these numbers are not reliable: each serverless function keeps its own memory, and it resets on every cold start. To count every MCP and API call, connect Upstash Redis to the Vercel project: <code>vercel integration add upstash</code>.</p>
      )}
      {data?.store === 'redis' && <p className="muted" data-testid="usage-store">Counting since {new Date(data.since).toLocaleDateString()} (Upstash Redis).</p>}

      <section className="u-card">
        <h2>Last 14 days</h2>
        <div className="days" role="img" aria-label="Calls per day for the last 14 days">
          {data?.days.map((d) => (
            <div key={d.day} className="day" title={`${d.day}: ${d.count}`}>
              <span className="day-bar" style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }} />
              <span className="day-l">{d.day.slice(8)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="u-grid">
        <Bars title="Most pulled components" rows={data?.components ?? []} empty="No component pulled yet." testid="usage-components" />
        <Bars title="Tools" rows={data?.tools ?? []} empty="No tool called yet." />
        <Bars title="Frameworks" rows={data?.frameworks ?? []} empty="No code requested yet." />
        <Bars title="Clients" rows={data?.clients ?? []} empty="No clients yet." />
        <Bars title="Models (self-reported)" rows={data?.models ?? []} empty="MCP does not send the model. Clients that add ?model=… to the URL or an x-p8-model header show up here." />
        <Bars title="Surface" rows={data?.sources ?? []} empty="—" />
      </div>

      <section className="u-card" data-testid="usage-mcp">
        <h2>Public MCP</h2>
        <p className="muted">Streamable HTTP, stateless, no auth. {ping ? (ping.ok ? `Online · ${tools?.length ?? 0} tools · ${ping.ms} ms` : 'Unreachable right now.') : 'Checking…'}</p>
        <code className="block">{mcpUrl}</code>
        <ul className="cmds">
          {cmds.map(([k, c]) => (
            <li key={k}><span>{k}</span><code>{c}</code><button className="tab solid" onClick={() => copy(k, c)}>{copied === k ? 'Copied' : 'Copy'}</button></li>
          ))}
        </ul>
        <h3>Tools</h3>
        <table className="props"><tbody>
          {(tools ?? []).map((t) => <tr key={t.name}><td><code>{t.name}</code></td><td className="muted">{t.description}</td></tr>)}
        </tbody></table>
      </section>
    </main>
  );
}
