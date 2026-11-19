import { button } from './button';
import { card } from './card';
import { divider, input, textarea, select, checkbox, switchC } from './forms';
import { menu, tabs, disclosure, dataList, badge, tooltip, dialog, toast, avatar } from './display';
import { radioGroup, field, search, segmented, slider } from './forms2';
import { spinner, skeleton, progress, alert, segmentedProgress } from './feedback';
import { sidebarNav, breadcrumbs, pagination, commandPalette } from './nav';
import { listRow, table, keyValue, stack, toolbar } from './data';
import { popover, dropdown, sheet } from './overlay';
import { iconButton, kbd, tag, copyButton } from './bits';
import { combobox, numberInput, otpInput, stepper, rating, accordion, statCard, avatarGroup, progressRing, banner } from './more';
import { treeView, scrollArea, timer, inlineEdit, codeBlock } from './extras';
import { datePicker, timePicker, multiSelect, fileUpload, swatchPicker } from './pickers';
import { carousel, timeline, contextMenu, hoverCard } from './extras2';
import { passwordInput, dataTable, dateRangePicker, resizablePanels, sortableList, filterBar, notificationList, imageViewer } from './apps';
import { toggleGroup, link, heading, textC, colorPicker, tagInput, infiniteList, splitButton } from './kit';
import { emptyState, form, calendar, chart, sparkline, chatMessage, chatComposer, navbar, appShell } from './screens';
import { linkPreview } from './linkpreview';
import { mentionInput, richText } from './editor';
import { mediaTimeline } from './mediatl';
import { templates } from './templates';
import type { ComponentDef, Node, Rule } from './types';

export const components: ComponentDef[] = [button, card, input, textarea, divider, menu, tabs, disclosure, dataList, select, checkbox, switchC, badge, tooltip, dialog, toast, avatar,
  radioGroup, field, search, segmented, slider, spinner, skeleton, progress, alert, sidebarNav, breadcrumbs, pagination, commandPalette,
  listRow, table, keyValue, stack, toolbar, popover, dropdown, sheet, iconButton, kbd, tag, copyButton,
  combobox, numberInput, otpInput, stepper, rating, accordion, statCard, avatarGroup, progressRing, banner,
  treeView, scrollArea, timer, inlineEdit, codeBlock,
  datePicker, timePicker, multiSelect, fileUpload, swatchPicker, carousel, timeline, contextMenu, hoverCard,
  passwordInput, dataTable, dateRangePicker, resizablePanels, sortableList, filterBar, notificationList, imageViewer,
  toggleGroup, link, heading, textC, colorPicker, tagInput, infiniteList, splitButton,
  emptyState, form, calendar, chart, sparkline, chatMessage, chatComposer, navbar, appShell,
  linkPreview, segmentedProgress, mentionInput, richText, mediaTimeline];
import { GUIDELINES, MARKS } from './guidelines';
for (const c of [...components, ...templates]) { c.guidelines = GUIDELINES[c.id]; c.since = MARKS[c.id]?.since ?? '0.6.0'; c.mark = MARKS[c.id]?.mark; }
export const getDef = (id: string) => components.find((c) => c.id === id) ?? templates.find((c) => c.id === id);

/** Every rule across the library, keyed by class (first definition wins; button rules are reused by card). */
export const ruleMap: Map<string, Rule> = new Map([...components, ...templates].flatMap((c) => c.rules).map((r) => [r.cls, r]));
export { templates };
export const getTemplate = (id: string) => templates.find((t) => t.id === id);

export function usedClasses(node: Node | string, acc: string[] = []): string[] {
  if (typeof node === 'string') return acc;
  for (const k of node.cls ?? []) if (!acc.includes(k)) acc.push(k);
  node.children?.forEach((ch) => usedClasses(ch, acc));
  return acc;
}
export * from './types';
