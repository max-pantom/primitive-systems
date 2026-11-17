/** Tiny code highlighter: greys only (syntax-1..4 tokens). Covers tsx/astro/svelte/html/css/scss. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const RULES: [RegExp, string][] = [
  [/<!--[\s\S]*?-->|\/\*[\s\S]*?\*\/|\/\/[^\n]*/y, 'c'], // comments
  [/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/y, 's'], // strings
  [/<\/?[A-Za-z][\w.-]*/y, 't'], // tags
  [/--[\w-]+/y, 'v'], // css custom properties / tokens
  [/\b(?:import|export|function|return|from|const)\b/y, 'k'], // js keywords
  [/[\w:@-]+(?==)/y, 'a'], // attributes
  [/[.#]?[\w-]+(?=\s*:)/y, 'a'], // css properties and selectors with pseudo
  [/\b\d+(?:\.\d+)?(?:px|%|rem|em)?\b/y, 'v'],
  [/[{}()[\];,=<>/&:]+/y, 'p'], // punctuation
];

export type Token = { cls: string; text: string };
/** Split code into [{cls, text}] (cls '' = plain). Shared by the docs and the Code Block component. */
export function tokenize(code: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  let plain = '';
  const flush = () => { if (plain) { out.push({ cls: '', text: plain }); plain = ''; } };
  while (i < code.length) {
    let hit = false;
    for (const [re, cls] of RULES) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m[0].length) {
        flush();
        out.push({ cls, text: m[0] });
        i += m[0].length;
        hit = true;
        break;
      }
    }
    if (!hit) plain += code[i++];
  }
  flush();
  return out;
}

export const highlight = (code: string): string => tokenize(code).map((t) => (t.cls ? `<span class="hl-${t.cls}">${esc(t.text)}</span>` : esc(t.text))).join('');
