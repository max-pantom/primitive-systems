import { describe, expect, it } from 'vitest';
import { checkCopy, past, plural, singular, suggestCopy, VOICE } from '../src/copy/voice';
import { suggestForSituation } from '../src/lib/situation';
import { scanCode } from '../src/lint/scan';
import { searchComponents } from '../src/lib/search';
import { route } from '../src/api/handlers';
import { generate } from '../src/codegen';
import { getDef } from '../src/components';

describe('house voice', () => {
  it('inflects subjects', () => {
    expect([singular('projects'), singular('categories'), singular('boxes'), plural('project'), plural('category'), plural('box')]).toEqual(['project', 'category', 'box', 'projects', 'categories', 'boxes']);
    expect([past('save'), past('send'), past('archive'), past('rename')]).toEqual(['saved', 'sent', 'archived', 'renamed']);
  });
  it('writes empty states, errors, confirmations and buttons', () => {
    expect(suggestCopy({ kind: 'empty', subject: 'projects' }).variants[0]).toMatchObject({ title: 'No projects yet', action: 'New project' });
    expect(suggestCopy({ kind: 'empty', reason: 'no results', query: 'zebra' }).variants[0].title).toBe('No results for “zebra”');
    expect(suggestCopy({ kind: 'error', reason: 'network' }).variants[0].body).toContain('try again');
    const c = suggestCopy({ kind: 'confirm', subject: 'project', action: 'delete' }).variants[0];
    expect(c).toMatchObject({ title: 'Delete project?', confirmLabel: 'Delete project', cancelLabel: 'Cancel' });
    expect(c.body).toContain('can\'t undo');
    expect(suggestCopy({ kind: 'success', subject: 'invoice', action: 'send' }).variants[0].message).toBe('Invoice sent.');
    expect(suggestCopy({ kind: 'button', subject: 'project' }).variants[0].label).toBe('Create project');
  });
  it('everything it writes passes its own checker', () => {
    for (const k of ['empty', 'error', 'success', 'confirm', 'button'] as const) for (const v of suggestCopy({ kind: k, subject: 'project', action: 'delete' }).variants) for (const [key, text] of Object.entries(v)) {
      if (!text || ['icon', 'note'].includes(key)) continue;
      const kind = /label|action|secondary/i.test(key) ? 'button' : /title/.test(key) ? 'heading' : 'message';
      expect(checkCopy(text, kind).issues.filter((i) => i.severity === 'error'), `${k}.${key}: ${text}`).toEqual([]);
    }
  });
  it('flags copy that breaks the voice', () => {
    const rules = (t: string, k: Parameters<typeof checkCopy>[1]) => checkCopy(t, k).issues.map((i) => i.rule);
    expect(rules('Oops! Something went wrong!', 'message')).toEqual(expect.arrayContaining(['plain', 'say-what-and-how']));
    expect(rules('Submit', 'button')).toContain('verb-first');
    expect(rules('Create New Project', 'button')).toContain('sentence-case');
    expect(rules('Loading...', 'label')).toContain('punctuation');
    expect(rules('Please enter a valid email', 'message')).toContain('plain');
    expect(checkCopy('Save changes', 'button').ok).toBe(true);
    expect(VOICE.length).toBeGreaterThan(5);
  });
});

describe('situation → component', () => {
  const top = (s: string) => suggestForSituation(s).suggestions[0];
  it('picks Empty State with wording for a first-run list', () => {
    const s = top('user has no projects yet');
    expect(s.component).toBe('empty-state');
    expect(s.props).toMatchObject({ title: 'No projects yet', action: 'New project' });
  });
  it('picks the right pieces for common states', () => {
    expect(top('search returned no results').props).toMatchObject({ icon: 'search', action: 'Clear filters' });
    expect(top('confirm deleting a file').component).toBe('dialog');
    expect(top('saving the invoice failed').component).toBe('toast');
    expect(top('the dashboard section failed to load').component).toBe('alert');
    expect(top('the page is loading a list').component).toBe('skeleton');
    expect(top('the user needs to sign in').component).toBe('sign-in');
    expect(top('let the user pick a date').component).toBe('date-picker');
    expect(top('invoice was saved').props).toMatchObject({ message: 'Invoice saved.' });
    expect(top('show a shared url as a card').component).toBe('link-preview');
  });
  it('falls back to search and its props are valid for generation', () => {
    expect(suggestForSituation('something with a gauge').suggestions.length).toBeGreaterThan(0);
    for (const s of ['user has no tasks yet', 'delete the workspace', 'saving failed', 'a section failed to load']) for (const sg of suggestForSituation(s).suggestions) expect(() => generate(getDef(sg.component)!, sg.props, 'react'), `${s} → ${sg.component}`).not.toThrow();
  });
  it('is available over HTTP, brief mode returns only component, props and code', () => {
    const r = route('GET', '/api/situation', undefined, { q: 'user has no projects yet', framework: 'p8', brief: '1' }).body as { suggestions: { component: string; code: string; why?: string }[] };
    expect(r.suggestions[0].component).toBe('empty-state');
    expect(r.suggestions[0].code).toContain('<p8-empty-state');
    expect(r.suggestions[0].why).toBeUndefined();
  });
});

describe('repo scan', () => {
  const files = [
    { path: 'src/Form.tsx', code: `import { Button, TextField } from '@mui/material';\nexport const F = () => (<div className="card">\n  <input type="email" placeholder="Work email" />\n  <input type="password" />\n  <button className="btn-primary" disabled>Save changes</button>\n  <button><svg/></button>\n  <TextField label="x" /><Button>Go</Button>\n  <select><option>a</option></select>\n  <p8-button>ok</p8-button>\n</div>);` },
    { path: 'index.html', code: '<textarea rows="4" placeholder="Notes"></textarea><table><tr><td>1</td></tr></table><dialog open></dialog><details><summary>x</summary></details>' },
  ];
  it('finds raw elements, library components and hand-rolled cards with a swap each', () => {
    const r = scanCode(files);
    const swaps = r.findings.map((f) => f.swap.component);
    expect(swaps).toEqual(expect.arrayContaining(['card', 'text-input', 'password-input', 'button', 'icon-button', 'select', 'textarea', 'table', 'dialog', 'disclosure']));
    expect(r.libraries).toEqual([{ name: 'MUI', files: ['src/Form.tsx'] }]);
    expect(r.findings.filter((f) => f.element === 'Button' || f.element === 'TextField')).toHaveLength(2);
    expect(r.adopted).toBeGreaterThan(0);
    expect(r.adoption).toBeLessThan(50);
  });
  it('takes props from the markup and builds a command', () => {
    const r = scanCode(files);
    const btn = r.findings.find((f) => f.element === 'button' && f.swap.component === 'button')!;
    expect(btn.swap.props).toMatchObject({ label: 'Save changes', variant: 'primary', disabled: true });
    expect(btn.command).toContain('npx primitive add button -f react');
    expect(r.findings.find((f) => f.swap.component === 'text-input')!.swap.props).toMatchObject({ placeholder: 'Work email', type: 'email' });
    expect(r.findings.find((f) => f.swap.component === 'icon-button')).toBeTruthy();
  });
  it('ignores Primitive elements and works through the API', () => {
    const r = scanCode([{ path: 'a.html', code: '<button class="p8-button">Save</button><p8-card></p8-card>' }]);
    expect(r.raw).toBe(0);
    expect(r.adoption).toBe(100);
    expect(route('POST', '/api/scan', { files }).status).toBe(200);
    expect(route('POST', '/api/scan', { files: [] }).status).toBe(400);
  });
});

describe('brief mode and discovery', () => {
  it('returns only props and one snippet', () => {
    const b = route('GET', '/api/components/button', undefined, { brief: '1' }).body as Record<string, unknown>;
    expect(Object.keys(b).sort()).toEqual(['description', 'id', 'name', 'props', 'snippet']);
    expect(b.snippet).toContain('<p8-button');
    const full = JSON.stringify(route('GET', '/api/components/button').body).length;
    expect(JSON.stringify(b).length).toBeLessThan(full / 2);
    expect(route('POST', '/api/code', { component: 'button', framework: 'html', brief: true }).body).toEqual({ framework: 'html', code: expect.any(String) });
    expect((route('GET', '/api/components', undefined, { brief: '1' }).body as { components: unknown[][] }).components[0]).toEqual(['button', 'Button']);
  });
  it('finds the lightbox and the link preview', () => {
    expect(searchComponents('lightbox').results[0].id).toBe('image-viewer');
    expect(searchComponents('unfurl a url').results[0].id).toBe('link-preview');
  });
  it('voice rules ship with get_rules; copy endpoints work', () => {
    expect((route('GET', '/api/rules').body as { voice: unknown[] }).voice.length).toBeGreaterThan(5);
    expect((route('POST', '/api/copy', { kind: 'empty', subject: 'tasks' }).body as { variants: { title: string }[] }).variants[0].title).toBe('No tasks yet');
    expect(route('POST', '/api/copy', { kind: 'nope' }).status).toBe(400);
    expect((route('POST', '/api/copy/check', { text: 'Click here!', kind: 'button' }).body as { ok: boolean }).ok).toBe(false);
  });
});
