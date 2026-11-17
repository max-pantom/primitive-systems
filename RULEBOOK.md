# Primitive Systems rule book

Generated from `src/rules/rulebook.ts`. Do not edit by hand. Every rule below is checked automatically (see CHECKBOOK.md).

### Named tokens only `tokens-only`

Component styles never contain raw hex, rgb, px or rem values. Everything references a named token (var(--p8-…)). Changing the theme file changes every app.


### 4 / 8 grid `grid`

padding, margin and gap use space-4, 8, 12, 16, 20, 24 or 32 (plus space-6 for menu items only). Radius is 4, 8, 12, 16 or full. space-2 exists only for insets (top/left) and is never used for padding, margin or gap.

- **Exception — `space-2 inset`:** Switch thumb inset (top/left) is 2px so the thumb sits centered in the track.

### Controls: 12px left and right `control-padding`

Every clickable control with horizontal padding (button, input, textarea, select, icon button, tab, segment, page button, list row…) uses padding-inline: space-12. Top and bottom are space-8 (md) or space-12 (lg).

- **Exception — `p8-cal__day`:** Fixed 32px calendar cell with no padding; digits are centered in the square.
- **Exception — `p8-swatch`:** Fixed 24px colour swatch with no padding.
- **Exception — `p8-rating__star`:** Fixed 24px star target with no padding.
- **Exception — `p8-menu__item`:** Menu item exception: 6px left/right, 4px top/bottom.
- **Exception — `p8-pager__btn`:** Fixed-width page number button; 12px side padding inside a 32px minimum width.

### Cards and panels: 16 / 12 `surface-padding`

Surfaces drawn with the hairline (card, dialog, sheet, popover panel, alert, toast, disclosure, stat card, banner) use 16px left/right and 12px top/bottom, or 16px all around.

- **Exception — `p8-toolbar`:** Wrapper around controls: its 4px inset is the gap to its own children, which carry the 12px control padding.
- **Exception — `p8-menu`:** Wrapper around menu items: 4px inset around items that carry their own 6/4 padding.
- **Exception — `p8-palette`:** Wrapper around an input and options that carry their own control padding.
- **Exception — `p8-combobox__list`:** Option list wrapper: 4px inset around options that carry their own 12px control padding.
- **Exception — `p8-multi__list`:** Option list wrapper: 4px inset around options that carry their own 12px control padding.
- **Exception — `p8-sheet`:** Full-height drawer uses 16px on all sides.

### Default gap 12 `gap`

The gap between items is space-12. Only three other gaps exist: space-4 for stacked text lines and dense groups, space-8 for an icon next to its label inside a control, and 12 again for tabs. Nothing else.


### Menu items: 6 / 4 `menu-item`

Menu item horizontal padding is space-6 and vertical is space-4 — the single documented exception to the 4/8 grid.


### Tabs: 12 spacing `tabs-spacing`

Tabs are spaced with space-12 between them.


### Two type sizes `type-scale`

Text is 14/18 (size-sm/line-sm) or 16/20 (size-md/line-md) with weight 400 or 500, always via type tokens. Mono (Geist Mono, -0.02em) is only for badges, kbd and code.


### One stroke `hairline`

The only stroke is the seed hairline (0.5px, ring color), drawn as an inset outline or border so it is complete on all four sides. Never box-shadow rings.


### Dim focus `focus`

Focus is a dim 2px stroke (ring-focus) via box-shadow, or for text fields the same fill as hover. No solid outline rings.


### Disabled `disabled`

Disabled is opacity-disabled and a not-allowed cursor, nothing else.


### Primitive8 icons only `icons`

Icons come from the Primitive8 Icon Factory pack, 14 or 16px, outline, stroke 1.5. Loaders and charts (spinner, skeleton, progress ring) are drawings, not icons, and are exempt.

- **Exception — `p8-spinner`:** Loader drawing, not an icon.
- **Exception — `p8-skeleton`:** Placeholder drawing, not an icon.
- **Exception — `p8-progress-ring`:** Chart drawing, not an icon.

### Accessible by default `a11y`

Every button has text or aria-label; every field has a label; images have alt; roles carry their state (aria-checked, aria-selected, aria-expanded); ids are unique; no interactive element is nested in another; text contrast is at least 4.5:1 in light and dark.

- **Exception — `placeholder text`:** Placeholder color is the seed #C0C0C0 (about 1.8:1). Placeholders never carry required information; labels do.

### Every component ships do/don't guidelines `guidelines`

Each component documents how to use it well (for example: one primary Button per view). Agents read these through get_component and get_rules.


### No hardcoded brand `no-brand`

The product name, tagline and branding live only in src/config/site.ts.

