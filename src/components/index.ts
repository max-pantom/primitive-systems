import { button } from './button';
import { card } from './card';
import { divider, input, textarea, select, checkbox, switchC } from './forms';
import { menu, tabs, disclosure, dataList, badge, tooltip, dialog, toast, avatar, emptyState } from './display';
import type { ComponentDef, Node, Rule } from './types';

export const components: ComponentDef[] = [button, card, input, textarea, divider, menu, tabs, disclosure, dataList, select, checkbox, switchC, badge, tooltip, dialog, toast, avatar, emptyState];
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
