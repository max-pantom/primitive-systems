# DESIGN SEEDS

The two hand-designed components from metagravity (Paper) are the visual source of truth.
`seeds.tsx` holds them (condensed, same values) (light + dark). Every component derives radius, stroke,
type scale, color usage and density from these.

Status: **applied** (2 of 2).

Derived values (see `src/tokens/theme.ts`):
- Radius 8, hairline ring 0.5px (`ring`), Inter.
- Row / card: 16/20 type, 12 vertical / 16 horizontal padding, `surface` fill + ring.
- Control: 14/18 type, 8 vertical / 12 horizontal padding, `control` fill (`control-strong` for hover/pressed).
- Light: surface #F0F0F0, control #F4F4F4, strong #E5E5E5, ink #000. Dark: #1D1D1D / #2A2A2A / #373737, ink #E1E1E1.
- Hover, focus and disabled are NOT in the seeds; they are derived (strong fill, 2px ink outline, 50% opacity) and should be confirmed.
