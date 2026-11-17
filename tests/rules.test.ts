import { describe, expect, it } from 'vitest';
import { checkAll, checkNode, checkRules, contrast } from '../src/rules/check';
import { components } from '../src/components';
import { RULES } from '../src/rules/rulebook';

describe('rule book', () => {
  it('every component passes every rule', () => {
    expect(checkAll().map((v) => `[${v.rule}] ${v.target}: ${v.message}`)).toEqual([]);
  });
  it('every component has do/dont guidelines and a release marker', () => {
    for (const d of components) { expect(d.guidelines?.do.length, d.id).toBeGreaterThan(0); expect(d.guidelines?.dont.length, d.id).toBeGreaterThan(0); expect(d.since, d.id).toBeTruthy(); }
  });
  it('has the documented rules', () => {
    expect(RULES.map((r) => r.id)).toEqual(expect.arrayContaining(['grid', 'control-padding', 'surface-padding', 'gap', 'menu-item', 'tabs-spacing', 'hairline', 'focus', 'a11y']));
  });
  it('the checker really catches violations (toolbar-style icon button at 8px)', () => {
    const bad = { ...components.find((c) => c.id === 'icon-button')!, rules: [{ cls: 'p8-iconbtn', base: { 'padding-inline': 'var(--p8-space-8)', cursor: 'pointer' } }] };
    expect(checkRules(bad).map((v) => v.rule)).toContain('control-padding');
    const off = { ...bad, rules: [{ cls: 'p8-x', base: { padding: 'var(--p8-space-7)', gap: 'var(--p8-space-24)', color: '#fff' } }] };
    expect(checkRules(off).map((v) => v.rule)).toEqual(expect.arrayContaining(['tokens-only', 'gap']));
    const node = { tag: 'button', children: [], attrs: {} };
    expect(checkNode(bad, node, 't').map((v) => v.rule)).toContain('a11y');
  });
  it('contrast helper', () => { expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 0); });
});
