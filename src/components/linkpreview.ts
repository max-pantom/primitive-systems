import { v } from '../tokens/theme';
import { iconNode, iconRule } from './button';
import { P, focus, motion, n, p, ringDecl, text } from './shared';
import type { ComponentDef, Node, Props } from './types';

const lp = { root: `${p}-linkcard`, vertical: `${p}-linkcard--vertical`, media: `${p}-linkcard__media`, img: `${p}-linkcard__img`, ph: `${p}-linkcard__ph`, body: `${p}-linkcard__body`, site: `${p}-linkcard__site`, title: `${p}-linkcard__title`, desc: `${p}-linkcard__desc`, url: `${p}-linkcard__url`, skel: `${p}-linkcard__skel` };
const host = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url.replace(/^https?:\/\//, '').split('/')[0]; } };

export const linkPreview: ComponentDef = {
  id: 'link-preview', name: 'Link Preview', description: 'A shared URL unfurled into a card: image, site, title and description.', tags: ['content', 'navigation'], status: 'stable',
  usage: 'Pass the metadata you unfurled on your server (title, description, image, site); the component only draws it, it never fetches the page. The whole card is one link that opens in a new tab with rel="noopener noreferrer". Use loading while you fetch and error when the page has no usable metadata (it falls back to the bare address). Fetch metadata server-side and never inline untrusted HTML.',
  composition: 'One link; an optional image, a site line, a Heading-style title and muted text.',
  props: [
    P.text('url', 'https://example.com/field-notes', 'The address. Also used to show the site name when none is given.'),
    P.text('title', 'Field notes on building calm interfaces', 'Page title (og:title).'),
    P.area('description', 'A short write-up on spacing, type and the two sizes that carry an entire product.', 'Page description (og:description). Shown on up to two lines.'),
    P.text('site', '', 'Site name (og:site_name). Empty uses the address host.'),
    P.text('image', '', 'Image URL (og:image). Empty shows a placeholder tile.'),
    P.select('layout', ['horizontal', 'vertical'], 'horizontal', 'Image beside the text, or above it.'),
    P.select('state', ['ready', 'loading', 'error'], 'ready', 'ready shows the metadata; loading shows placeholders; error shows only the address.'),
    P.bool('external', true, 'Open in a new tab.'),
  ],
  rules: [
    { cls: lp.root, base: { display: 'flex', 'box-sizing': 'border-box', width: v('size-500'), 'max-width': '100%', overflow: 'hidden', padding: '0', 'border-radius': v('radius-12'), background: v('color-surface'), color: v('color-ink'), 'text-decoration': 'none', cursor: 'pointer', transition: `background ${motion}`, ...ringDecl, ...text('sm') }, hover: { background: v('color-control') }, focus },
    { cls: lp.vertical, base: { 'flex-direction': 'column' } },
    { cls: lp.media, base: { display: 'flex', 'align-items': 'center', 'justify-content': 'center', 'flex-shrink': '0', width: v('size-160'), 'min-height': v('size-96'), background: v('color-control'), color: v('color-ink-muted') } },
    { cls: `${lp.media}--vertical`, base: { width: '100%', 'aspect-ratio': '16 / 9' } },
    { cls: lp.img, base: { display: 'block', width: '100%', height: '100%', 'object-fit': 'cover' } },
    { cls: lp.ph, base: { display: 'inline-flex' } },
    { cls: lp.body, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'min-width': '0', 'padding-block': v('space-12'), 'padding-inline': v('space-16') } },
    { cls: lp.site, base: { color: v('color-ink-muted'), 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono') } },
    { cls: lp.title, base: { margin: '0', 'font-weight': v('type-weight-strong'), display: '-webkit-box', '-webkit-line-clamp': '2', '-webkit-box-orient': 'vertical', overflow: 'hidden' } },
    { cls: lp.desc, base: { margin: '0', color: v('color-ink-muted'), display: '-webkit-box', '-webkit-line-clamp': '2', '-webkit-box-orient': 'vertical', overflow: 'hidden' } },
    { cls: lp.url, base: { overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap', color: v('color-ink-muted') } },
    { cls: lp.skel, base: { height: v('space-12'), 'border-radius': v('radius-4'), background: v('color-control-strong') } },
    iconRule,
  ],
  render(pr: Props): Node {
    const url = (pr.url as string) || '#';
    const site = (pr.site as string) || host(url);
    const vertical = pr.layout === 'vertical';
    const state = pr.state as string;
    const attrs: Node['attrs'] = { href: url };
    if (pr.external) { attrs.target = '_blank'; attrs.rel = 'noopener noreferrer'; }
    const media = (children: Node[]): Node => n('span', vertical ? [lp.media, `${lp.media}--vertical`] : [lp.media], children, { 'aria-hidden': 'true' });
    const cls = vertical ? [lp.root, lp.vertical] : [lp.root];
    if (state === 'loading') {
      return n('a', cls, [media([]), n('span', [lp.body], [n('span', [lp.skel], [], { style: 'width: 30%' }), n('span', [lp.skel], [], { style: 'width: 80%' }), n('span', [lp.skel], [], { style: 'width: 60%' }), n('span', [], ['Loading preview…'], { role: 'status', style: 'position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%)' })])], { ...attrs, 'aria-busy': 'true', 'aria-label': `Loading preview of ${site}` });
    }
    if (state === 'error') {
      return n('a', cls, [media([n('span', [lp.ph], [iconNode('link', 16)])]), n('span', [lp.body], [n('span', [lp.site], [site]), n('span', [lp.url], [url]), n('span', [lp.desc], ['Preview unavailable.'])])], attrs);
    }
    const img = pr.image ? [n('img', [lp.img], undefined, { src: pr.image as string, alt: '', loading: 'lazy' })] : [n('span', [lp.ph], [iconNode('link', 16)])];
    return n('a', cls, [
      media(img),
      n('span', [lp.body], [
        n('span', [lp.site], [site]),
        n('span', [lp.title], [(pr.title as string) || url]),
        ...(pr.description ? [n('span', [lp.desc], [pr.description as string])] : []),
      ]),
    ], attrs);
  },
};
