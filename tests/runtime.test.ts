// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

beforeAll(() => {
  execSync('pnpm exec tsx scripts/build-runtime.ts', { stdio: 'ignore' });
  document.body.innerHTML = '<p8-button variant="primary" icon="plus">Save</p8-button><p8-switch label="Dark" checked="false"></p8-switch><p8-badge>New</p8-badge><p8-tabs tabs="A\nB" active="A"></p8-tabs><p8-sign-in title="Log in"></p8-sign-in>';
  new Function(readFileSync('public/p8.js', 'utf8'))();
});

describe('<p8-*> runtime', () => {
  it('registers every component', () => {
    expect((window as unknown as { P8: { components: string[] } }).P8.components.length).toBeGreaterThanOrEqual(50);
    expect(customElements.get('p8-button')).toBeTruthy();
  });
  it('renders attributes as props and text as content', () => {
    const b = document.querySelector('p8-button button')!;
    expect(b.textContent).toContain('Save');
    expect(b.className).toContain('p8-button--primary');
    expect(b.querySelector('svg')).toBeTruthy();
  });
  it('injects the theme and component CSS once', () => {
    expect(document.querySelectorAll('style[data-p8]')).toHaveLength(1);
    expect(document.head.innerHTML).toContain('--p8-space-12');
  });
  it('wires behavior', () => {
    const sw = document.querySelector('p8-switch [role=switch]') as HTMLElement;
    expect(sw.getAttribute('aria-checked')).toBe('false');
    sw.click();
    expect(sw.getAttribute('aria-checked')).toBe('true');
    const tabs = [...document.querySelectorAll('p8-tabs [role=tab]')] as HTMLElement[];
    tabs[1].click();
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
  });
  it('renders whole templates as tags too', () => {
    expect(document.querySelector('p8-sign-in h1')!.textContent).toBe('Log in');
    expect(document.querySelectorAll('p8-sign-in input').length).toBeGreaterThanOrEqual(2);
  });
  it('re-renders when attributes change', () => {
    const el = document.querySelector('p8-button')!;
    el.setAttribute('variant', 'ghost');
    expect(el.querySelector('button')!.className).toContain('p8-button--ghost');
  });
});
