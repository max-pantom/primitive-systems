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
      control: '#EEEEEE',
      'control-strong': '#E5E5E5',
      ink: '#000000',
      'ink-inverse': '#FFFFFF',
      'ink-muted': '#707070',
      placeholder: '#C0C0C0',
      ring: '#91919140',
      'ring-focus': '#9191914D',
      'syntax-1': '#000000',
      'syntax-2': '#4A4A4A',
      'syntax-3': '#7A7A7A',
      'syntax-4': '#A8A8A8',
    },
    dark: {
      canvas: '#1D1D1D',
      surface: '#1D1D1D',
      control: '#2A2A2A',
      'control-strong': '#373737',
      ink: '#E1E1E1',
      'ink-inverse': '#1D1D1D',
      'ink-muted': '#9A9A9A',
      placeholder: '#C0C0C0',
      ring: '#7A7A7A40',
      'ring-focus': '#7A7A7A4D',
      'syntax-1': '#F2F2F2',
      'syntax-2': '#BDBDBD',
      'syntax-3': '#8C8C8C',
      'syntax-4': '#5E5E5E',
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
    '32': '32px',
  },
  radius: { '4': '4px', '8': '8px', '12': '12px', '16': '16px', full: '9999px' },
  size: { '16': '16px', '20': '20px', '24': '24px', '28': '28px', '32': '32px', '40': '40px', '48': '48px', '320': '320px', '400': '400px', '500': '500px' },
  border: { hairline: '0.5px', focus: '2px', 'focus-offset': '2px' },
  type: {
    family: '"Inter", system-ui, sans-serif',
    mono: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    'tracking-mono': '-0.02em',
    'tracking-normal': 'normal',
    'size-sm': '14px',
    'line-sm': '18px',
    'size-md': '16px',
    'line-md': '20px',
    weight: '400',
    'weight-strong': '500',
  },
  opacity: { disabled: '0.5', hover: '0.8' },
  icon: { sm: '14px', md: '16px' },
  motion: { fast: '150ms', ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
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
    ...vars(theme.size, 'size-'),
    ...vars(theme.border, 'border-'),
    ...vars(theme.type, 'type-'),
    ...vars(theme.opacity, 'opacity-'),
    ...vars(theme.icon, 'icon-'),
    ...vars(theme.motion, 'motion-'),
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
    size: theme.size,
    border: theme.border,
    type: theme.type,
    opacity: theme.opacity,
    icon: theme.icon,
    motion: theme.motion,
  };
}
