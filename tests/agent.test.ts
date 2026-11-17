import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { composeCode, getRules, getThemeBuild, lintCode, route, searchComponents } from '../src/api/handlers';
import { handleApi, handleMcp } from '../src/server/web';
import { lintSpacing } from '../src/lint/spacing';

describe('search', () => {
  it('finds the right component for a need', () => {
    expect(searchComponents('confirm a destructive action').results.map((r) => r.id)).toContain('dialog');
    expect(searchComponents('loading state').results.slice(0, 3).map((r) => r.id)).toEqual(expect.arrayContaining(['spinner']));
    expect(searchComponents('one-time code').results[0].id).toBe('otp-input');
    expect(searchComponents('nothingmatchesthis').results).toEqual([]);
  });
});

describe('compose', () => {
  it('composes several components into one output with one script', () => {
    const r = composeCode({ framework: 'html', items: [{ component: 'field', props: { label: 'Email' } }, { component: 'switch' }, { component: 'button', props: { variant: 'primary', label: 'Save' } }] });
    expect(r.code).toContain('Email');
    expect(r.code).toContain('role="switch"');
    expect(r.code).toContain('Save');
    expect(r.code.match(/<script>/g)).toHaveLength(1);
    expect(r.code).toContain('flex-direction: column');
  });
  it('composes in p8 form and rejects bad input', () => {
    expect(composeCode({ framework: 'p8', items: [{ component: 'button', props: { label: 'Go' } }] }).code).toContain('<p8-button>Go</p8-button>');
    expect(() => composeCode({ framework: 'html', items: [{ component: 'nope' }] })).toThrow();
    expect(() => composeCode({ framework: 'html', items: [{ component: 'button', props: { variant: 'x' } }] })).toThrow();
  });
});

describe('templates', () => {
  it('lists the five screens and returns whole-screen code with behavior', () => {
    const { templates } = route('GET', '/api/templates').body as { templates: { id: string }[] };
    expect(templates.map((t) => t.id).sort()).toEqual(['dashboard', 'empty-page', 'list-detail', 'settings', 'sign-in']);
    const r = route('POST', '/api/templates/code', { id: 'sign-in', framework: 'react' }).body as { code: { code: string }; uses: string[] };
    expect(r.code.code).toContain('useEffect');
    expect(r.code.code).toContain('Sign in');
    expect(r.uses).toContain('form');
  });
  it('rejects unknown templates and is found by search', () => {
    expect(route('GET', '/api/templates/nope').status).toBe(404);
    expect(searchComponents('login screen').results[0].id).toBe('sign-in');
    expect(searchComponents('analytics overview').results.map((r) => r.id)).toContain('dashboard');
  });
});

describe('versions: pinning and diff_component', () => {
  it('lists snapshots from real release history', () => {
    const { versions } = route('GET', '/api/versions').body as { versions: { version: string; components: number }[] };
    expect(versions.map((v) => v.version)).toEqual(expect.arrayContaining(['0.1.0', '0.5.0', '0.10.0', 'latest']));
    expect(versions.find((v) => v.version === '0.1.0')!.components).toBe(2);
  });
  it('diff_component reports props, options, defaults, classes and generated output', () => {
    const d = route('GET', '/api/diff', undefined, { id: 'badge', from: '0.5.0' }).body as { status: string; props: { name: string; kind: string }[]; style: string; migration: string[] };
    expect(d.status).toBe('changed');
    expect(d.props).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'font', kind: 'added' })]));
    expect(d.style).toBe('changed');
    expect(d.migration.join(' ')).toContain('get_code');
  });
  it('detects removed options as breaking with a replacement hint', () => {
    const d = route('GET', '/api/diff', undefined, { id: 'stack', from: '0.6.0' }).body as { breaking: boolean; props: { name: string; kind: string; what: string; from?: string; hint: string }[] };
    expect(d.props.find((p) => p.what === 'option' && p.kind === 'removed' && p.name === 'gap')).toMatchObject({ from: '16' });
    expect(d.breaking).toBe(true);
  });
  it('library-wide summary lists added components', () => {
    const d = route('GET', '/api/diff', undefined, { from: '0.9.0' }).body as { added: string[]; breaking: string[] };
    expect(d.added).toEqual(expect.arrayContaining(['form', 'chart', 'sign-in']));
  });
  it('get_component with version returns the old schema; unknown versions are rejected', () => {
    const old = route('GET', '/api/components/button', undefined, { version: '0.1.0' }).body as { pinned: boolean; version: string; props: { name: string }[] };
    expect(old.pinned).toBe(true);
    expect(old.version).toBe('0.1.0');
    expect(route('GET', '/api/components/badge', undefined, { version: '0.1.0' }).status).toBe(400);
    expect(route('GET', '/api/components/button', undefined, { version: '9.9.9' }).status).toBe(400);
    expect(route('GET', '/api/diff', undefined, { from: '0.10.0', to: '0.5.0' }).status).toBe(400);
  });
  it('get_code with version validates props against the pinned schema and reports whether output changed', () => {
    const ok = route('POST', '/api/code', { component: 'badge', framework: 'html', version: '0.5.0', props: { label: 'x', variant: 'outline' } }).body as { pin?: { outputChanged: boolean } };
    expect(ok.pin?.outputChanged).toBe(true);
    const bad = route('POST', '/api/code', { component: 'badge', framework: 'html', version: '0.5.0', props: { font: 'normal' } });
    expect(bad.status).toBe(400);
    expect((bad.body as { error: string }).error).toContain('unknown prop "font"');
  });
});

describe('theme builder', () => {
  it('derives a contrast-safe theme', () => {
    const r = getThemeBuild({ light: { ink: '#1a1a2e', canvas: '#FAFAF7' }, dark: { ink: '#E8E8F0', canvas: '#101018' }, radius: '12' });
    expect(r.passes).toBe(true);
    expect(r.css).toContain('--p8-radius-8: 12px');
    expect(r.css).toContain('[data-theme="dark"]');
  });
  it('rejects bad colors', () => {
    expect(() => getThemeBuild({ light: { ink: 'red' } })).toThrow(/hex/);
    expect(() => getThemeBuild({ radius: '7' })).toThrow(/radius/);
  });
  it('the default theme reproduces the seeds closely', () => {
    const r = getThemeBuild({ light: { ink: '#000000', canvas: '#FFFFFF' }, dark: { ink: '#E1E1E1', canvas: '#1D1D1D' } });
    expect(r.tokens.light.surface).toBe('#F0F0F0');
    expect(r.tokens.dark.surface).toBe('#1D1D1D');
  });
});

describe('spacing lint', () => {
  it('flags off-grid values in css, jsx and tailwind', () => {
    const issues = lintSpacing('.a{padding:13px 12px;border-radius:5px}\n<div className="p-[10px]" style={{ margin: 7 }} />');
    expect(issues.map((i) => i.value).sort()).toEqual(['10px', '13px', '5px', '7'].sort());
    expect(lintCode({ code: '.a{padding:12px;gap:8px;margin:0}' }).ok).toBe(true);
    expect(lintCode({ code: '.a{padding:13px}' }).ok).toBe(false);
  });
});

describe('lint --fix', () => {
  const sample = '.a{padding:13px;gap:16px;border-radius:5px;background:#f7f7f7;color:#333}\n<input placeholder="Search" /><img src="a.png" /><button><svg></svg></button>';
  it('reports grid, gap, colour and label problems', () => {
    const r = lintCode({ code: sample });
    expect(r.ok).toBe(false);
    expect(new Set(r.issues.map((i) => i.rule))).toEqual(new Set(['grid', 'gap', 'color', 'label']));
  });
  it('fixes what is safe, lists every change, leaves the rest', () => {
    const r = lintCode({ code: sample, fix: true }) as { fixed: string; fixes: { rule: string }[]; issues: { rule: string; message: string }[] };
    expect(r.fixed).toContain('padding:12px');
    expect(r.fixed).toContain('gap:12px');
    expect(r.fixed).toContain('border-radius:4px');
    expect(r.fixed).toContain('background:var(--p8-color-surface)');
    expect(r.fixed).toContain('aria-label="Search"');
    expect(r.fixed).toContain('alt=""');
    expect(r.fixed).toContain('color:#333');
    expect(r.fixes.map((f) => f.rule).sort()).toEqual(['color', 'gap', 'grid', 'grid', 'label', 'label']);
    expect(r.issues.map((i) => i.rule).sort()).toEqual(['color', 'label']);
  });
  it('is idempotent and leaves clean code alone', () => {
    const once = lintCode({ code: sample, fix: true }) as { fixed: string };
    const twice = lintCode({ code: once.fixed, fix: true }) as { fixed: string; fixes: unknown[] };
    expect(twice.fixed).toBe(once.fixed);
    expect(twice.fixes).toEqual([]);
  });
  it('does not touch anchors, url() references or components that spread props', () => {
    const code = '<a href="#top">x</a><svg fill="url(#g)"/><input {...props} /><div style={{ gap: 8 }} />';
    expect((lintCode({ code, fix: true }) as { fixed: string }).fixed).toBe(code);
  });
  it('CLI --fix rewrites files', () => {
    const f = join(mkdtempSync(join(tmpdir(), 'p8-')), 'a.css');
    writeFileSync(f, '.a{padding:13px;gap:20px}');
    execFileSync('pnpm', ['exec', 'tsx', 'scripts/build-cli.ts'], { stdio: 'ignore' });
    const out = execFileSync('node', ['bin/primitive.mjs', 'lint', f, '--fix'], { encoding: 'utf8' });
    expect(readFileSync(f, 'utf8')).toBe('.a{padding:12px;gap:12px}');
    expect(out).toContain('2 fixed');
  });
});

describe('rules endpoint and web handlers', () => {
  it('serves rules, search and install', () => {
    expect(getRules().rules.length).toBeGreaterThan(10);
    expect(route('GET', '/api/search', undefined, { q: 'toggle' }).status).toBe(200);
    expect(route('GET', '/api/install').status).toBe(200);
  });
  it('handleApi works with the Vercel rewrite form and plain paths', async () => {
    for (const url of ['https://x.test/api/index?p=components', 'https://x.test/api/components']) {
      const r = await handleApi(new Request(url));
      expect(r.status).toBe(200);
      expect((await r.json()).components.length).toBeGreaterThan(40);
    }
    const post = await handleApi(new Request('https://x.test/api/index?p=code', { method: 'POST', body: JSON.stringify({ component: 'button', framework: 'p8', props: { label: 'Hi' } }) }));
    expect((await post.json()).code).toContain('Hi');
    expect((await handleApi(new Request('https://x.test/api/index?p=search&q=modal'))).status).toBe(200);
    expect((await handleApi(new Request('https://x.test/api/nope'))).status).toBe(404);
  });
  it('remote MCP answers tools/list and tools/call over plain HTTP', async () => {
    const call = async (body: unknown) => {
      const r = await handleMcp(new Request('https://x.test/mcp', { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' }, body: JSON.stringify(body) }));
      return r.json();
    };
    const list = await call({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    expect(list.result.tools.map((t: { name: string }) => t.name)).toEqual(expect.arrayContaining(['get_changelog', 'list_components', 'get_code', 'get_rules', 'search_components', 'compose_code', 'build_theme', 'lint_code', 'get_tokens', 'get_install']));
    const out = await call({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'get_code', arguments: { component: 'switch', framework: 'react' } } });
    expect(JSON.parse(out.result.content[0].text).code).toContain('useEffect');
  });
});

describe('cli', () => {
  const bin = (...a: string[]) => execFileSync('node', ['bin/primitive.mjs', ...a], { encoding: 'utf8' });
  it('adds components to a project', () => {
    execFileSync('pnpm', ['exec', 'tsx', 'scripts/build-cli.ts'], { stdio: 'ignore' });
    const dir = mkdtempSync(join(tmpdir(), 'p8-'));
    bin('add', 'button', 'tabs', '-f', 'svelte', '--out', dir);
    expect(readFileSync(join(dir, 'Button.svelte'), 'utf8')).toContain('p8-button');
    expect(readFileSync(join(dir, 'Tabs.svelte'), 'utf8')).toContain('onMount');
  });
  it('lints and fails on errors', () => {
    const f = join(mkdtempSync(join(tmpdir(), 'p8-')), 'a.css');
    writeFileSync(f, '.a{padding:13px}');
    expect(() => bin('lint', f)).toThrow();
    writeFileSync(f, '.a{padding:12px}');
    expect(bin('lint', f)).toContain('0 errors');
  });
});
