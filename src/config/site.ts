/** The ONLY place the product name, tagline and branding live. Rename here. */
export const site = {
  name: 'Primitive Systems',
  slug: 'primitive-systems',
  /** Public docs + API + MCP origin. */
  url: 'https://primitive-systems.vercel.app',
  cli: 'primitive',
  tagline: 'Agentic components for Primitive 8 apps.',
  description:
    'Everyday UI pieces that stay consistent across every project, pulled by agents through MCP or HTTP.',
  /** CSS custom-property prefix used by tokens and generated code. */
  cssPrefix: 'p8',
} as const;
