import { site } from '../config/site';
import { v } from '../tokens/theme';
import { ICON_NAMES, iconElements, type IconName, type IconSize } from '../icons/icons';
import type { ComponentDef, Node, Props, Rule } from './types';

const p = site.cssPrefix;
export const c = {
  root: `${p}-button`,
  primary: `${p}-button--primary`,
  ghost: `${p}-button--ghost`,
  lg: `${p}-button--lg`,
  block: `${p}-button--block`,
  icon: `${p}-icon`,
};

const ring = `0 0 0 ${v('border-hairline')} ${v('color-ring')}`;
const focus = { outline: `${v('border-focus')} solid ${v('color-ink')}`, 'outline-offset': v('border-focus-offset') };

export const iconRule: Rule = { cls: c.icon, base: { 'flex-shrink': '0' } };

export function iconNode(name: IconName, size: IconSize): Node {
  return {
    tag: 'svg',
    cls: [c.icon],
    attrs: {
      width: `${size}`, height: `${size}`, viewBox: `0 0 ${size} ${size}`, fill: 'none',
      stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      'aria-hidden': 'true',
    },
    children: iconElements(name, size).map(([tag, attrs]) => ({ tag, attrs })),
  };
}

export const button: ComponentDef = {
  id: 'button',
  name: 'Button',
  description: 'Triggers an action. Control surface from the design seeds, with optional icon.',
  tags: ['control', 'action', 'form'],
  status: 'stable',
  usage: 'Use primary once per view for the main action. Use ghost for low-emphasis actions on a surface. Icons come from the Primitive8 Icon Factory pack.',
  props: [
    { name: 'label', type: 'string', default: 'Button', description: 'Visible text.', control: { kind: 'text' } },
    { name: 'variant', type: "'default' | 'primary' | 'ghost'", default: 'default', description: 'Visual emphasis.', control: { kind: 'select', options: ['default', 'primary', 'ghost'] } },
    { name: 'size', type: "'md' | 'lg'", default: 'md', description: 'md is 14/18 type, lg is 16/20 type. Horizontal padding is always 12px.', control: { kind: 'select', options: ['md', 'lg'] } },
    { name: 'icon', type: 'IconName | "none"', default: 'none', description: 'Icon from the Primitive8 pack.', control: { kind: 'select', options: ['none', ...ICON_NAMES] } },
    { name: 'iconSize', type: "'14' | '16'", default: '14', description: 'Icon size in px.', control: { kind: 'select', options: ['14', '16'] } },
    { name: 'iconPosition', type: "'start' | 'end'", default: 'start', description: 'Which side of the label the icon sits on.', control: { kind: 'select', options: ['start', 'end'] } },
    { name: 'fullWidth', type: 'boolean', default: false, description: 'Stretch to the width of the container.', control: { kind: 'boolean' } },
    { name: 'disabled', type: 'boolean', default: false, description: 'Disables interaction and dims the button.', control: { kind: 'boolean' } },
  ],
  rules: [
    {
      cls: c.root,
      base: {
        display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', gap: v('space-8'),
        'padding-block': v('space-8'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'),
        border: 'none', 'box-shadow': 'none', background: v('color-control'), color: v('color-ink'),
        'font-family': v('type-family'), 'font-size': v('type-size-sm'), 'line-height': v('type-line-sm'),
        'font-weight': v('type-weight'), cursor: 'pointer',
      },
      hover: { background: v('color-control-strong') },
      focus,
      disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' },
    },
    { cls: c.primary, base: { background: v('color-ink'), color: v('color-ink-inverse') }, hover: { background: v('color-ink'), opacity: v('opacity-hover') } },
    { cls: c.ghost, base: { background: 'transparent', 'box-shadow': ring }, hover: { background: v('color-control') } },
    { cls: c.lg, base: { 'padding-block': v('space-12'), 'font-size': v('type-size-md'), 'line-height': v('type-line-md') } },
    { cls: c.block, base: { display: 'flex', width: '100%' } },
    iconRule,
  ],
  render(props: Props): Node {
    const cls = [c.root];
    if (props.variant === 'primary') cls.push(c.primary);
    if (props.variant === 'ghost') cls.push(c.ghost);
    if (props.size === 'lg') cls.push(c.lg);
    if (props.fullWidth) cls.push(c.block);
    const attrs: Node['attrs'] = { type: 'button' };
    if (props.disabled) attrs.disabled = true;
    const children: Node['children'] = [props.label as string];
    if (props.icon !== 'none') {
      const icon = iconNode(props.icon as IconName, Number(props.iconSize) as IconSize);
      if (props.iconPosition === 'end') children.push(icon);
      else children.unshift(icon);
    }
    return { tag: 'button', cls, attrs, children };
  },
};
