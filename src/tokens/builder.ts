import { contrast } from '../rules/check';
import { theme } from './theme';

export interface ThemeInput { light?: { ink?: string; canvas?: string }; dark?: { ink?: string; canvas?: string }; radius?: string }
const HEX = /^#[0-9a-fA-F]{6}$/;
const toRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
/** t=0 → a, t=1 → b */
const mix = (a: string, b: string, t: number) => toHex(toRgb(a).map((x, i) => x + (toRgb(b)[i] - x) * t));

function derive(ink: string, canvas: string, mode: 'light' | 'dark') {
  const dark = mode === 'dark';
  const strong = mix(canvas, ink, dark ? 0.13 : 0.1);
  let t = 0.4;
  let muted = mix(ink, canvas, t);
  while (contrast(muted, strong) < 4.5 && t > 0) { t -= 0.02; muted = mix(ink, canvas, Math.max(0, t)); }
  return {
    canvas, surface: dark ? canvas : mix(canvas, ink, 0.06), control: mix(canvas, ink, dark ? 0.066 : 0.067), 'control-strong': strong,
    ink, 'ink-inverse': canvas, 'ink-muted': muted, placeholder: mix(ink, canvas, 0.75),
    backdrop: dark ? '#00000080' : '#00000033', ring: `${mix(ink, canvas, dark ? 0.5 : 0.57)}40`, 'ring-focus': `${mix(ink, canvas, dark ? 0.5 : 0.57)}4D`,
    'syntax-1': ink, 'syntax-2': mix(ink, canvas, 0.3), 'syntax-3': mix(ink, canvas, 0.52), 'syntax-4': mix(ink, canvas, 0.67),
  };
}

export function buildTheme(input: ThemeInput = {}) {
  const errors: string[] = [];
  const pick = (v: string | undefined, fallback: string, label: string) => { if (v === undefined) return fallback; if (!HEX.test(v)) { errors.push(`${label} must be a #RRGGBB hex color`); return fallback; } return v; };
  const L = { ink: pick(input.light?.ink, theme.color.light.ink, 'light.ink'), canvas: pick(input.light?.canvas, theme.color.light.canvas, 'light.canvas') };
  const D = { ink: pick(input.dark?.ink, theme.color.dark.ink, 'dark.ink'), canvas: pick(input.dark?.canvas, theme.color.dark.canvas, 'dark.canvas') };
  const radius = input.radius ?? '8';
  if (!['4', '8', '12', '16'].includes(radius)) errors.push('radius must be 4, 8, 12 or 16');
  if (errors.length) return { ok: false as const, errors };
  const light = derive(L.ink, L.canvas, 'light');
  const dark = derive(D.ink, D.canvas, 'dark');
  const block = (sel: string, o: Record<string, string>) => `${sel} {\n${Object.entries(o).map(([k, v]) => `  --p8-color-${k}: ${v};`).join('\n')}\n}`;
  const r = Number(radius);
  const css = [
    block(':root', light).replace(/\n}$/, `\n  --p8-radius-8: ${r}px;\n  --p8-radius-12: ${r + 4}px;\n  --p8-radius-16: ${r + 8}px;\n}`),
    block('[data-theme="dark"]', dark),
  ].join('\n\n');
  const checks = (['light', 'dark'] as const).flatMap((m) => {
    const c = m === 'light' ? light : dark;
    return (['ink', 'ink-muted'] as const).flatMap((fg) => (['canvas', 'surface', 'control', 'control-strong'] as const).map((bg) => ({ mode: m, fg, bg, ratio: Math.round(contrast(c[fg], c[bg]) * 100) / 100 })));
  });
  return { ok: true as const, css, tokens: { light, dark, radius }, contrast: checks, passes: checks.every((c) => c.ratio >= 4.5) };
}
