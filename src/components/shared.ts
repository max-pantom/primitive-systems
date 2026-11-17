import { site } from '../config/site';
import { v } from '../tokens/theme';
import type { Decls, Node, Rule } from './types';

export const p = site.cssPrefix;
export const ring = `0 0 0 ${v('border-hairline')} ${v('color-ring')}`;
/** Focus is the same hairline stroke as the seeds, only a little stronger. No outline rings. */
export const focus: Decls = { outline: 'none', 'box-shadow': `0 0 0 ${v('border-focus')} ${v('color-ring-focus')}` };
export const motion = `${v('motion-fast')} ${v('motion-ease')}`;
export const text = (size: 'sm' | 'md'): Decls => ({
  'font-family': v('type-family'), 'font-size': v(`type-size-${size}`), 'line-height': v(`type-line-${size}`), 'font-weight': v('type-weight'),
});
/** Seed control surface: 14/18 type, 8/12 padding, control fill, strong on hover. */
export const controlBase: Decls = {
  'box-sizing': 'border-box', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'),
  border: 'none', 'box-shadow': 'none', background: v('color-control'), color: v('color-ink'), ...text('sm'),
};
export const lines = (s: unknown) => String(s).split('\n').map((l) => l.trim()).filter(Boolean);
export const n = (tag: string, cls: string[], children?: (Node | string)[], attrs?: Node['attrs']): Node => ({ tag, cls, attrs, children });
export type { Rule };
