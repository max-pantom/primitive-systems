import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { theme, themeToCss } from '../src/tokens/theme';
import { components } from '../src/components';

describe('tokens', () => {
  it('space and radius use multiples of 4/8 except the documented 2px and 6px', () => {
    for (const val of [...Object.values(theme.space), ...Object.values(theme.radius)].filter((x) => x !== '9999px')) {
      const n = parseInt(val);
      expect(n % 4 === 0 || n === 2 || n === 6, `${val}`).toBe(true);
    }
  });
  it('emits light and dark variables', () => {
    const css = themeToCss();
    expect(css).toContain('--p8-space-12: 12px');
    expect(css).toContain('[data-theme="dark"]');
  });
  it('component source has no raw hex/rgb', () => {
    for (const f of readdirSync('src/components')) {
      const src = readFileSync(`src/components/${f}`, 'utf8');
      expect(src, f).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
    }
  });
  it('rule values only reference tokens (or keywords)', () => {
    for (const r of components.flatMap((c) => c.rules))
      for (const d of [r.base, r.hover, r.focus, r.disabled])
        for (const val of Object.values(d ?? {})) expect(val, r.cls).not.toMatch(/\d+px/);
  });
});

describe('hard spacing rules', () => {
  const rule = (id: string, cls: string) => components.find((c) => c.id === id)!.rules.find((r) => r.cls === cls)!;
  it('controls: 12px left/right', () => expect(rule('button', 'p8-button').base['padding-inline']).toBe('var(--p8-space-12)'));
  it('card: 16 sides, 12 top/bottom; even is 16 all around', () => {
    expect(rule('card', 'p8-card').base['padding-inline']).toBe('var(--p8-space-16)');
    expect(rule('card', 'p8-card').base['padding-block']).toBe('var(--p8-space-12)');
    expect(rule('card', 'p8-card--even').base['padding-block']).toBe('var(--p8-space-16)');
  });
  it('menu items 6px sides / 4px top-bottom; tabs spaced 12px; data list gap 4 or 2', () => {
    expect(rule('menu', 'p8-menu__item').base['padding-inline']).toBe('var(--p8-space-6)');
    expect(rule('menu', 'p8-menu__item').base['padding-block']).toBe('var(--p8-space-4)');
    expect(rule('tabs', 'p8-tabs').base.gap).toBe('var(--p8-space-12)');
    expect(rule('data-list', 'p8-datalist').base.gap).toBe('var(--p8-space-4)');
    expect(rule('data-list', 'p8-datalist--gap2').base.gap).toBe('var(--p8-space-2)');
  });
  it('all controls have 12px left/right padding', () => {
    for (const [id, cls] of [['text-input', 'p8-input'], ['textarea', 'p8-textarea'], ['select', 'p8-select__control']]) expect(rule(id, cls).base['padding-inline']).toBe('var(--p8-space-12)');
  });
  it('default gap is 12px; stacked text gap is 4px', () => {
    expect(rule('card', 'p8-card').base.gap).toBe('var(--p8-space-12)');
    expect(rule('card', 'p8-card__text').base.gap).toBe('var(--p8-space-4)');
  });
});
