/** Flags padding, margin, gap and radius values that are off the 4/8 grid in consumer code (CSS, SCSS, JSX styles, Tailwind arbitrary values). */
export interface LintIssue { line: number; property: string; value: string; severity: 'error' | 'warn'; message: string }

const PROP = '(padding|margin|gap|row-gap|column-gap|border-radius|border-(?:top|bottom)-(?:left|right)-radius|padding-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?|margin-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)';
const CAMEL = '(padding|margin|gap|rowGap|columnGap|borderRadius|padding(?:Top|Right|Bottom|Left|Inline|Block)|margin(?:Top|Right|Bottom|Left|Inline|Block))';

function judge(px: number): { severity: 'error' | 'warn'; message: string } | null {
  if (px === 0 || px % 4 === 0) return null;
  if (px === 2 || px === 6) return { severity: 'warn', message: `${px}px is only allowed for line gaps (2) and menu item sides (6)` };
  const near = Math.round(px / 4) * 4;
  return { severity: 'error', message: `${px}px is off the 4/8 grid — use ${near}px` };
}

export function lintSpacing(code: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = code.split('\n');
  const seen = new Set<string>();
  const push = (line: number, property: string, value: string, px: number) => {
    const j = judge(px);
    const key = `${line}|${property}|${px}`;
    if (j && !seen.has(key)) { seen.add(key); issues.push({ line, property, value, ...j }); }
  };
  lines.forEach((text, i) => {
    const line = i + 1;
    for (const m of text.matchAll(new RegExp(`\\b${PROP}\\s*:\\s*([^;}"'\`]+)`, 'g'))) {
      for (const v of m[2].matchAll(/(-?\d*\.?\d+)(px|rem)\b/g)) push(line, m[1], v[0], parseFloat(v[1]) * (v[2] === 'rem' ? 16 : 1));
    }
    for (const m of text.matchAll(new RegExp(`\\b${CAMEL}\\s*:\\s*['"]?(-?\\d*\\.?\\d+)(px|rem)?['"]?`, 'g'))) push(line, m[1], m[2] + (m[3] ?? ''), parseFloat(m[2]) * (m[3] === 'rem' ? 16 : 1));
    for (const m of text.matchAll(/\b(?:p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy]|rounded(?:-[a-z]{1,2})?)-\[(-?\d*\.?\d+)(px|rem)\]/g)) push(line, m[0].split('-[')[0], m[1] + m[2], parseFloat(m[1]) * (m[2] === 'rem' ? 16 : 1));
  });
  return issues;
}
