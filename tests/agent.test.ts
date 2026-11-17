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
    expect(list.result.tools.map((t: { name: string }) => t.name)).toEqual(expect.arrayContaining(['list_components', 'get_code', 'get_rules', 'search_components', 'compose_code', 'build_theme', 'lint_code', 'get_tokens', 'get_install']));
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
