import pack from './pack.json';

/** Icons vendored from the Primitive8 Icon Factory (factory.primitive8.cc/icons). Outline, 1.5 stroke. */
export type IconName = keyof typeof pack;
export type IconSize = 14 | 16;
export const ICON_NAMES = Object.keys(pack) as IconName[];

type El = { d?: string; line?: number[]; circle?: number[]; rect?: number[]; poly?: number[][]; role?: string };

export function iconElements(name: IconName, size: IconSize): [string, Record<string, string>][] {
  const els = ((pack as Record<string, Record<string, El[]>>)[name][String(size)] ?? []) as El[];
  return els.map((e) => {
    if (e.d) return ['path', { d: e.d }];
    if (e.line) return ['line', { x1: `${e.line[0]}`, y1: `${e.line[1]}`, x2: `${e.line[2]}`, y2: `${e.line[3]}` }];
    if (e.poly) return ['polygon', { points: e.poly.map((pt) => pt.join(',')).join(' ') }];
    if (e.circle) return ['circle', { cx: `${e.circle[0]}`, cy: `${e.circle[1]}`, r: `${e.circle[2]}`, ...(e.role === 'dot' ? { fill: 'currentColor', stroke: 'none' } : {}) }];
    const [x, y, w, h, r] = e.rect!;
    return ['rect', { x: `${x}`, y: `${y}`, width: `${w}`, height: `${h}`, rx: `${r}` }];
  });
}
