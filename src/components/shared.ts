import { site } from '../config/site';
import { v } from '../tokens/theme';
import type { Decls, Node, PropMeta, Rule } from './types';

export const p = site.cssPrefix;
/** The seed hairline, drawn as an inset outline: pixel-snapped on every side, no layout impact. */
export const ringDecl: Decls = { outline: `${v('border-hairline')} solid ${v('color-ring')}`, 'outline-offset': `calc(-1 * ${v('border-hairline')})` };
export const noRing: Decls = { outline: 'none' };
/** Focus is the same hairline stroke as the seeds, only a little stronger. No outline rings. */
export const focus: Decls = { 'box-shadow': `0 0 0 ${v('border-focus')} ${v('color-ring-focus')}` };
/** Text fields: focus looks exactly like hover (same fill), no ring. */
export const fieldFocus: Decls = { background: v('color-control-strong') };
export const motion = `${v('motion-fast')} ${v('motion-ease')}`;
export const text = (size: 'sm' | 'md'): Decls => ({
  'font-family': v('type-family'), 'font-size': v(`type-size-${size}`), 'line-height': v(`type-line-${size}`), 'font-weight': v('type-weight'),
});
/** Seed control surface: 14/18 type, 8/12 padding, control fill, strong on hover. */
export const controlBase: Decls = {
  'box-sizing': 'border-box', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'),
  border: 'none', background: v('color-control'), color: v('color-ink'), ...text('sm'),
};
export const lines = (s: unknown) => String(s).split('\n').map((l) => l.trim()).filter(Boolean);
export const n = (tag: string, cls: string[], children?: (Node | string)[], attrs?: Node['attrs']): Node => ({ tag, cls, attrs, children });
export type { Rule };

/** Prop declaration helpers. */
const q = (o: string[]) => o.map((x) => `'${x}'`).join(' | ');
export const P = {
  text: (name: string, def: string, description: string): PropMeta => ({ name, type: 'string', default: def, description, control: { kind: 'text' } }),
  area: (name: string, def: string, description: string, type = 'string'): PropMeta => ({ name, type, default: def, description, control: { kind: 'textarea' } }),
  bool: (name: string, def: boolean, description: string): PropMeta => ({ name, type: 'boolean', default: def, description, control: { kind: 'boolean' } }),
  select: (name: string, options: string[], def: string, description: string): PropMeta => ({ name, type: q(options), default: def, description, control: { kind: 'select', options } }),
};
/** Decls for an absolutely positioned overlay root that fills the viewport (and the docs preview). */
export const overlayBase: Decls = { position: 'fixed', inset: '0', display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'z-index': '50', background: v('color-backdrop'), 'box-sizing': 'border-box', padding: v('space-24') };
export const hiddenRule = { sel: '[hidden]', decls: { display: 'none' } };
