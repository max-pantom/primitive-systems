import { button } from './button';
import { card } from './card';
import { divider, input, textarea, select, checkbox, switchC } from './forms';
import { menu, tabs, disclosure, dataList, badge, tooltip, dialog, toast, avatar } from './display';
import { radioGroup, field, search, segmented, slider } from './forms2';
import { spinner, skeleton, progress, alert } from './feedback';
import { sidebarNav, breadcrumbs, pagination, commandPalette } from './nav';
import { listRow, table, keyValue, stack, toolbar } from './data';
import { popover, dropdown, sheet } from './overlay';
import { iconButton, kbd, tag, copyButton } from './bits';
import { combobox, numberInput, otpInput, stepper, rating, accordion, statCard, avatarGroup, progressRing, banner } from './more';
import type { ComponentDef, Node, Rule } from './types';

export const components: ComponentDef[] = [button, card, input, textarea, divider, menu, tabs, disclosure, dataList, select, checkbox, switchC, badge, tooltip, dialog, toast, avatar,
  radioGroup, field, search, segmented, slider, spinner, skeleton, progress, alert, sidebarNav, breadcrumbs, pagination, commandPalette,
  listRow, table, keyValue, stack, toolbar, popover, dropdown, sheet, iconButton, kbd, tag, copyButton,
  combobox, numberInput, otpInput, stepper, rating, accordion, statCard, avatarGroup, progressRing, banner];
import { GUIDELINES, MARKS } from './guidelines';
for (const c of components) { c.guidelines = GUIDELINES[c.id]; c.since = MARKS[c.id]?.since ?? '0.6.0'; c.mark = MARKS[c.id]?.mark; }
export const getDef = (id: string) => components.find((c) => c.id === id);

/** Every rule across the library, keyed by class (first definition wins; button rules are reused by card). */
export const ruleMap: Map<string, Rule> = new Map(components.flatMap((c) => c.rules).map((r) => [r.cls, r]));

export function usedClasses(node: Node | string, acc: string[] = []): string[] {
  if (typeof node === 'string') return acc;
  for (const k of node.cls ?? []) if (!acc.includes(k)) acc.push(k);
  node.children?.forEach((ch) => usedClasses(ch, acc));
  return acc;
}
export * from './types';
