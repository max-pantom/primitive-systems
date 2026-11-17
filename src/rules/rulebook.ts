/**
 * THE RULE BOOK. Every design rule of the system as data: the statement agents read,
 * the allowed values the checker enforces, and every documented exception with its reason.
 * Changing a rule here changes `get_rules`, RULEBOOK.md and the automated check at once.
 */
export interface Exception { rule: string; target: string; reason: string }
export interface RuleDoc { id: string; title: string; statement: string; why?: string }

export const GRID_SPACE = ['space-4', 'space-6', 'space-8', 'space-12', 'space-16', 'space-20', 'space-24', 'space-32'] as const;
export const RADII = ['radius-4', 'radius-8', 'radius-12', 'radius-16', 'radius-full'] as const;
export const GAPS = ['space-4', 'space-8', 'space-12'] as const;

export const RULES: RuleDoc[] = [
  { id: 'tokens-only', title: 'Named tokens only', statement: 'Component styles never contain raw hex, rgb, px or rem values. Everything references a named token (var(--p8-…)). Changing the theme file changes every app.' },
  { id: 'grid', title: '4 / 8 grid', statement: 'padding, margin and gap use space-4, 8, 12, 16, 20, 24 or 32 (plus space-6 for menu items only). Radius is 4, 8, 12, 16 or full. space-2 exists only for insets (top/left) and is never used for padding, margin or gap.' },
  { id: 'control-padding', title: 'Controls: 12px left and right', statement: 'Every clickable control with horizontal padding (button, input, textarea, select, icon button, tab, segment, page button, list row…) uses padding-inline: space-12. Top and bottom are space-8 (md) or space-12 (lg).' },
  { id: 'surface-padding', title: 'Cards and panels: 16 / 12', statement: 'Surfaces drawn with the hairline (card, dialog, sheet, popover panel, alert, toast, disclosure, stat card, banner) use 16px left/right and 12px top/bottom, or 16px all around.' },
  { id: 'gap', title: 'Default gap 12', statement: 'The gap between items is space-12. Only three other gaps exist: space-4 for stacked text lines and dense groups, space-8 for an icon next to its label inside a control, and 12 again for tabs. Nothing else.' },
  { id: 'menu-item', title: 'Menu items: 6 / 4', statement: 'Menu item horizontal padding is space-6 and vertical is space-4 — the single documented exception to the 4/8 grid.' },
  { id: 'tabs-spacing', title: 'Tabs: 12 spacing', statement: 'Tabs are spaced with space-12 between them.' },
  { id: 'type-scale', title: 'Two type sizes', statement: 'Text is 14/18 (size-sm/line-sm) or 16/20 (size-md/line-md) with weight 400 or 500, always via type tokens. Mono (Geist Mono, -0.02em) is only for badges, kbd and code.' },
  { id: 'hairline', title: 'One stroke', statement: 'The only stroke is the seed hairline (0.5px, ring color), drawn as an inset outline or border so it is complete on all four sides. Never box-shadow rings.' },
  { id: 'focus', title: 'Dim focus', statement: 'Focus is a dim 2px stroke (ring-focus) via box-shadow, or for text fields the same fill as hover. No solid outline rings.' },
  { id: 'disabled', title: 'Disabled', statement: 'Disabled is opacity-disabled and a not-allowed cursor, nothing else.' },
  { id: 'icons', title: 'Primitive8 icons only', statement: 'Icons come from the Primitive8 Icon Factory pack, 14 or 16px, outline, stroke 1.5. Loaders and charts (spinner, skeleton, progress ring) are drawings, not icons, and are exempt.' },
  { id: 'a11y', title: 'Accessible by default', statement: 'Every button has text or aria-label; every field has a label; images have alt; roles carry their state (aria-checked, aria-selected, aria-expanded); ids are unique; no interactive element is nested in another; text contrast is at least 4.5:1 in light and dark.' },
  { id: 'guidelines', title: 'Every component ships do/don\'t guidelines', statement: 'Each component documents how to use it well (for example: one primary Button per view). Agents read these through get_component and get_rules.' },
  { id: 'no-brand', title: 'No hardcoded brand', statement: 'The product name, tagline and branding live only in src/config/site.ts.' },
];

export const EXCEPTIONS: Exception[] = [
  { rule: 'grid', target: 'space-2 inset', reason: 'Switch thumb inset (top/left) is 2px so the thumb sits centered in the track.' },
  { rule: 'surface-padding', target: 'p8-toolbar', reason: 'Wrapper around controls: its 4px inset is the gap to its own children, which carry the 12px control padding.' },
  { rule: 'surface-padding', target: 'p8-menu', reason: 'Wrapper around menu items: 4px inset around items that carry their own 6/4 padding.' },
  { rule: 'surface-padding', target: 'p8-palette', reason: 'Wrapper around an input and options that carry their own control padding.' },
  { rule: 'surface-padding', target: 'p8-combobox__list', reason: 'Option list wrapper: 4px inset around options that carry their own 12px control padding.' },
  { rule: 'surface-padding', target: 'p8-multi__list', reason: 'Option list wrapper: 4px inset around options that carry their own 12px control padding.' },
  { rule: 'control-padding', target: 'p8-mcal__cell', reason: 'Month-grid cell: a fixed-height cell holding a day number and up to two event labels; the 4px inset keeps labels inside the cell lines.' },
  { rule: 'control-padding', target: 'p8-cal__day', reason: 'Fixed 32px calendar cell with no padding; digits are centered in the square.' },
  { rule: 'control-padding', target: 'p8-swatch', reason: 'Fixed 24px colour swatch with no padding.' },
  { rule: 'control-padding', target: 'p8-rating__star', reason: 'Fixed 24px star target with no padding.' },
  { rule: 'surface-padding', target: 'p8-sheet', reason: 'Full-height drawer uses 16px on all sides.' },
  { rule: 'control-padding', target: 'p8-menu__item', reason: 'Menu item exception: 6px left/right, 4px top/bottom.' },
  { rule: 'control-padding', target: 'p8-pager__btn', reason: 'Fixed-width page number button; 12px side padding inside a 32px minimum width.' },
  { rule: 'icons', target: 'p8-spinner', reason: 'Loader drawing, not an icon.' },
  { rule: 'icons', target: 'p8-skeleton', reason: 'Placeholder drawing, not an icon.' },
  { rule: 'icons', target: 'p8-progress-ring', reason: 'Chart drawing, not an icon.' },
  { rule: 'a11y', target: 'placeholder text', reason: 'Placeholder color is the seed #C0C0C0 (about 1.8:1). Placeholders never carry required information; labels do.' },
];

/** Classes whose horizontal padding must equal space-12 even without cursor:pointer (text fields). */
export const FIELD_CLASSES = ['p8-input', 'p8-textarea', 'p8-select__control', 'p8-search__input', 'p8-palette__input', 'p8-combobox__input', 'p8-number__input'];
