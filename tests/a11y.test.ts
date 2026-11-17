import { describe, expect, it } from 'vitest';
import { components, defaultsOf, getDef } from '../src/components';
import { a11yReport, contrastReport, keyboardReport, labelReport } from '../src/rules/a11y';

const report = (id: string, props: Record<string, unknown> = {}) => { const d = getDef(id)!; return a11yReport(d, d.render({ ...defaultsOf(d.props), ...props } as never)); };

describe('accessibility report', () => {
  it('resolves contrast through inherited backgrounds in both modes', () => {
    const rows = report('tabs').contrast;
    expect(rows.find((r) => r.fg === 'ink' && r.bg === 'control-strong')?.pass).toBe(true);
    expect(rows.every((r) => r.light > 1 && r.dark > 1)).toBe(true);
  });
  it('marks placeholders exempt, never silently passing', () => {
    const ph = report('text-input').contrast.find((r) => r.state === 'placeholder')!;
    expect(ph.exempt).toBeTruthy();
    expect(ph.pass).toBe(false);
  });
  it('lists keyboard support from the behavior it ships', () => {
    expect(report('switch').keyboard.map((k) => k.keys)).toContain('Space');
    expect(report('tabs').keyboard.map((k) => k.keys)).toContain('Home / End');
    expect(report('dialog').keyboard.map((k) => k.keys)).toEqual(expect.arrayContaining(['Esc', 'Tab / Shift+Tab']));
    expect(report('badge').keyboard[0].keys).toBe('—');
  });
  it('reports accessible names and where they come from', () => {
    const l = report('icon-button', { label: 'Add' }).labels[0];
    expect([l.role, l.name, l.source]).toEqual(['button', 'Add', 'aria-label']);
    expect(report('switch').labels[0].source).toBe('wrapping <label>');
    expect(report('field', { label: 'Email' }).labels[0]).toMatchObject({ role: 'textbox', name: 'Email', source: '<label for>' });
  });
  it('every component produces a complete report without throwing', () => {
    for (const d of components) {
      const node = d.render(defaultsOf(d.props));
      expect(contrastReport(node), d.id).toBeDefined();
      expect(keyboardReport(node).length, d.id).toBeGreaterThan(0);
      expect(labelReport(node), d.id).toBeDefined();
    }
  });
  it('is part of get_component for agents', async () => {
    const { getComponent } = await import('../src/api/handlers');
    expect((getComponent('button') as unknown as { a11y: { keyboard: unknown[] } }).a11y.keyboard.length).toBeGreaterThan(0);
  });
});
