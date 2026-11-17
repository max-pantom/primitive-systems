import { site } from '../config/site';
import { v } from '../tokens/theme';
import { button } from './button';
import type { ComponentDef, Node, Props } from './types';

const p = site.cssPrefix;
export const c = {
  root: `${p}-card`,
  even: `${p}-card--even`,
  flat: `${p}-card--flat`,
  text: `${p}-card__text`,
  title: `${p}-card__title`,
  body: `${p}-card__body`,
  actions: `${p}-card__actions`,
};

export const card: ComponentDef = {
  id: 'card',
  name: 'Card',
  description: 'A surface that groups related content. 16px sides, 12px top/bottom by default.',
  tags: ['container', 'surface', 'layout'],
  status: 'stable',
  usage: 'Use for self-contained blocks of content. Default padding is 16 left/right and 12 top/bottom; set padding to "even" for 16 all around.',
  composition: 'A card may contain a Button (withAction). The button keeps its own tokens and variants; the card only positions it with a 12px gap.',
  props: [
    { name: 'title', type: 'string', default: 'Card title', description: 'Heading line. Empty to omit.', control: { kind: 'text' } },
    { name: 'body', type: 'string', default: 'Supporting text for the card.', description: 'Body text. Empty to omit.', control: { kind: 'textarea' } },
    { name: 'padding', type: "'default' | 'even'", default: 'default', description: "'default' is 16/12 (sides/top-bottom). 'even' is 16 on all sides.", control: { kind: 'select', options: ['default', 'even'] } },
    { name: 'bordered', type: 'boolean', default: true, description: 'Draws the hairline ring from the design seeds.', control: { kind: 'boolean' } },
    { name: 'withAction', type: 'boolean', default: false, description: 'Adds a Button below the text (composition).', control: { kind: 'boolean' } },
    { name: 'actionLabel', type: 'string', default: 'Continue', description: 'Label for the action button.', control: { kind: 'text' } },
  ],
  rules: [
    {
      cls: c.root,
      base: {
        display: 'flex', 'flex-direction': 'column', gap: v('space-12'),
        'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'),
        background: v('color-surface'), color: v('color-ink'), 'box-shadow': `0 0 0 ${v('border-hairline')} ${v('color-ring')}`,
        'font-family': v('type-family'),
      },
    },
    { cls: c.even, base: { 'padding-block': v('space-16') } },
    { cls: c.flat, base: { 'box-shadow': 'none' } },
    { cls: c.text, base: { display: 'flex', 'flex-direction': 'column', gap: v('space-4') } },
    { cls: c.title, base: { 'font-size': v('type-size-md'), 'line-height': v('type-line-md'), 'font-weight': v('type-weight-strong') } },
    { cls: c.body, base: { 'font-size': v('type-size-sm'), 'line-height': v('type-line-sm'), 'font-weight': v('type-weight') } },
    { cls: c.actions, base: { display: 'flex', gap: v('space-12') } },
  ],
  render(props: Props): Node {
    const cls = [c.root];
    if (props.padding === 'even') cls.push(c.even);
    if (!props.bordered) cls.push(c.flat);
    const text: Node[] = [];
    if (props.title) text.push({ tag: 'div', cls: [c.title], children: [props.title as string] });
    if (props.body) text.push({ tag: 'p', cls: [c.body], children: [props.body as string] });
    const children: Node[] = [];
    if (text.length) children.push({ tag: 'div', cls: [c.text], children: text });
    if (props.withAction) {
      children.push({
        tag: 'div', cls: [c.actions],
        children: [button.render({ label: props.actionLabel as string, variant: 'default', size: 'md', icon: 'none', iconSize: '14', iconPosition: 'start', fullWidth: false, disabled: false })],
      });
    }
    return { tag: 'div', cls, children };
  },
};
