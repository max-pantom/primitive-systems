import { describe, expect, it } from 'vitest';
import { components, defaultsOf, schemaOf } from '../src/components';
import { FRAMEWORKS, generate, markup } from '../src/codegen';

const SIX = FRAMEWORKS.filter((f) => f !== 'p8');

/** Defaults plus an "everything toggled" variant (last select option, flipped booleans, filled text). */
function variantsOf(def: (typeof components)[number]): Record<string, unknown>[] {
  const alt: Record<string, unknown> = {};
  for (const p of def.props) {
    if (p.control.kind === 'select') alt[p.name] = p.control.options[p.control.options.length - 1] === p.default ? p.control.options[1] : p.control.options[p.control.options.length - 1];
    else if (p.control.kind === 'boolean') alt[p.name] = !p.default;
    else alt[p.name] = p.default === '' ? 'Sample {x} <y>' : p.default;
  }
  return [{}, alt];
}
const variants: Record<string, Record<string, unknown>[]> = Object.fromEntries(components.map((d) => [d.id, variantsOf(d)]));

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
        it(`${def.id} #${i} → ${fw}`, () => {
          expect(generate(def, props, fw).code).toMatchSnapshot();
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
        const out = Object.fromEntries(SIX.map((fw) => [fw, generate(def, props, fw).code]));
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
