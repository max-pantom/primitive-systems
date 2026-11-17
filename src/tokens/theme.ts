import { site } from '../config/site';

/**
 * THE theme file. Components reference tokens by name only (see `v()`),
 * never raw hex / px. Colors derive from the two design seeds (seeds/seeds.tsx).
 * Space / radius use multiples of 4 and 8; 2px and 6px are the documented exceptions.
 */
export const theme = {
  color: {
    light: {
      canvas: '#FFFFFF',
      surface: '#F0F0F0',
      control: '#F4F4F4',
      'control-strong': '#E5E5E5',
      ink: '#000000',
      'ink-inverse': '#FFFFFF',
      placeholder: '#C0C0C0',
      ring: '#91919140',
    },
    dark: {
      canvas: '#1D1D1D',
      surface: '#1D1D1D',
      control: '#2A2A2A',
      'control-strong': '#373737',
      ink: '#E1E1E1',
      'ink-inverse': '#1D1D1D',
      placeholder: '#C0C0C0',
      ring: '#7A7A7A40',
    },
  },
  space: {
    '2': '2px', // data-list line gap (allowed)
    '4': '4px',
    '6': '6px', // menu item horizontal padding (explicit exception)
    '8': '8px',
    '12': '12px',
    '16': '16px',
    '20': '20px',
    '24': '24px',
  },
  radius: { '8': '8px', '12': '12px', '16': '16px' },
  border: { hairline: '0.5px', focus: '2px', 'focus-offset': '2px' },
  type: {
    family: '"Inter", system-ui, sans-serif',
    'size-sm': '14px',
    'line-sm': '18px',
    'size-md': '16px',
    'line-md': '20px',
    weight: '400',
    'weight-strong': '500',
  },
  opacity: { disabled: '0.5', hover: '0.8' },
  icon: { sm: '14px', md: '16px' },
} as const;

/** Named-token reference, e.g. v('space-12') -> var(--p8-space-12) */
export const v = (name: string) => `var(--${site.cssPrefix}-${name})`;

type Group = Record<string, string>;
function vars(group: Group, prefix: string): string[] {
  return Object.entries(group).map(([k, val]) => `--${site.cssPrefix}-${prefix}${k}: ${val};`);
}

function base(): string[] {
  return [
    ...vars(theme.space, 'space-'),
    ...vars(theme.radius, 'radius-'),
    ...vars(theme.border, 'border-'),
    ...vars(theme.type, 'type-'),
    ...vars(theme.opacity, 'opacity-'),
    ...vars(theme.icon, 'icon-'),
  ];
}

/** Emit the theme as CSS variables (light on :root, dark on [data-theme="dark"]). */
export function themeToCss(): string {
  const block = (sel: string, lines: string[]) => `${sel} {\n  ${lines.join('\n  ')}\n}`;
  return [
    block(':root', [...base(), ...vars(theme.color.light, 'color-')]),
    block('[data-theme="dark"]', vars(theme.color.dark, 'color-')),
  ].join('\n\n');
}

export function flatTokens() {
  return {
    color: theme.color,
    space: theme.space,
    radius: theme.radius,
    border: theme.border,
    type: theme.type,
    opacity: theme.opacity,
    icon: theme.icon,
  };
}
