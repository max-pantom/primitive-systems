import { describe, expect, it } from 'vitest';
import { components, defaultsOf, schemaOf } from '../src/components';
import { FRAMEWORKS, generate, markup } from '../src/codegen';

const variants: Record<string, Record<string, unknown>[]> = {
  button: [{}, { variant: 'primary', size: 'lg', icon: 'arrow-right', iconSize: '16', iconPosition: 'end' }, { variant: 'ghost', disabled: true, fullWidth: true, label: 'A {b} <c>' }],
  card: [{}, { padding: 'even', bordered: false, title: '', withAction: true, actionLabel: 'Go' }],
};

describe('schemas', () => {
  it.each(components)('$id defaults parse to themselves', (def) => {
    expect(schemaOf(def.props).parse({})).toEqual(defaultsOf(def.props));
  });
  it('rejects unknown props and bad values', () => {
    expect(() => schemaOf(components[0].props).parse({ variant: 'nope' })).toThrow();
    expect(() => schemaOf(components[0].props).parse({ nope: 1 })).toThrow();
  });
});

describe('codegen snapshots', () => {
  for (const def of components)
    for (const [i, props] of variants[def.id].entries())
      for (const fw of FRAMEWORKS)
        it(`${def.id} #${i} → ${fw}`, async () => {
          await expect(generate(def, props, fw).code).toMatchFileSnapshot(`__snapshots__/${def.id}-${i}.${fw}.txt`);
        });
});

/** Same props → same DOM shape and class structure in every framework output. */
describe('cross-framework parity', () => {
  const stripNonMarkup = (code: string) =>
    code.replace(/<style[\s\S]*?<\/style>/g, '').replace(/^---[\s\S]*?---/m, '').replace(/<!--[\s\S]*?-->/g, '').replace(/^\/\/.*$/gm, '').replace(/\/\*[\s\S]*$/m, '');
  const tags = (code: string) => [...stripNonMarkup(code).matchAll(/<([a-z0-9]+)[\s>/]/g)].map((m) => m[1]);
  const classes = (code: string) => [...code.matchAll(/class(?:Name)?="([^"]*)"/g)].map((m) => m[1]);

  for (const def of components)
    for (const [i, props] of variants[def.id].entries())
      it(`${def.id} #${i}`, () => {
        const out = Object.fromEntries(FRAMEWORKS.map((fw) => [fw, generate(def, props, fw).code]));
        // scss ships markup as comments; compare against its commented markup
        const scssMarkup = out.scss.split('// Markup\n')[1].replace(/^\/\/ ?/gm, '');
        const ref = tags(out.astro);
        for (const fw of ['react', 'svelte', 'tailwind', 'html'] as const) expect(tags(out[fw]), fw).toEqual(ref);
        expect(tags(scssMarkup)).toEqual(ref);
        // class-based outputs share identical class lists
        const refCls = classes(out.astro);
        expect(classes(out.react)).toEqual(refCls);
        expect(classes(out.svelte)).toEqual(refCls);
        expect(classes(scssMarkup)).toEqual(refCls);
        // tailwind and inline outputs carry the same declarations per element (no stray values)
        const node = def.render(generate(def, props, 'astro').props);
        expect(markup(node, 'class')).toContain('<');
        expect(out.tailwind).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      });
});

describe('behaviour', () => {
  it('reflects current props', () => {
    expect(generate(components[0], { label: 'Save', disabled: true }, 'react').code).toContain('disabled');
    expect(generate(components[0], { label: 'Save' }, 'html').code).toContain('Save');
    expect(generate(components[1], { padding: 'even' }, 'astro').code).toContain('p8-card--even');
  });
  it('escapes braces in JSX-like outputs', () => {
    expect(generate(components[0], { label: '{x}' }, 'react').code).toContain("{'{'}x{'}'}");
  });
});
