import { suggestCopy, plural, type CopyKind } from '../copy/voice';
import { searchComponents } from './search';

export interface Suggestion { component: string; kind: 'component' | 'template'; why: string; props: Record<string, unknown>; copy?: { kind: CopyKind; variants: Record<string, string>[] } }

const grab = (s: string, re: RegExp) => re.exec(s)?.[1];
/** The thing the situation is about: "no projects yet" → projects. */
function subjectOf(s: string): string {
  return grab(s, /\b(?:the |a |an |your )?([a-z][a-z-]{2,})\s+(?:was|were|has been|have been|is now|got)\s+(?:saved|created|sent|published|deleted|updated|invited|uploaded|removed|archived)\b/i)
    ?? grab(s, /(?:no|any|zero|empty|haven'?t (?:got |created |added )?(?:any )?|hasn'?t (?:got |created |added )?(?:any )?|don'?t have (?:any )?)\s*([a-z][a-z-]{2,})/i)
    ?? grab(s, /(?:delete|remove|discard|archive|save|saving|send|sending|publish|load|loading|upload|create|invite)(?:ing)?\s+(?:the |a |an |this |your |that )?([a-z][a-z-]{2,})/i)
    ?? grab(s, /(?:list of|many|thousands of|lots of|long list of)\s+([a-z][a-z-]{2,})/i)
    ?? 'item';
}
const verbOf = (s: string) => grab(s, /\b(delete|remove|discard|destroy|archive|save|send|sent|publish|create|invite|upload|sign out|log out|disconnect|revoke|cancel)\w*\b/i)?.split(' ')[0].toLowerCase().replace(/^sent$/, 'send');

type Rule = { re: RegExp; build: (s: string) => Suggestion[] };
const empty = (title: string, description: string, action: string, icon: string, why: string, copy: ReturnType<typeof suggestCopy>): Suggestion => ({ component: 'empty-state', kind: 'component', why, props: { icon, title, description, action, secondary: '', variant: 'plain' }, copy });

const RULES: Rule[] = [
  { re: /\b(no results?|nothing found|no matches|search .*(nothing|empty))\b/i, build: (s) => { const c = suggestCopy({ kind: 'empty', reason: 'no results' }); const v = c.variants[0]; return [empty(v.title, v.description, v.action, 'search', 'Nothing matched a search or filter: explain and offer to clear it.', c)]; } },
  { re: /\b(no|zero|empty|haven'?t|hasn'?t|don'?t have|nothing)\b.*\b(yet|first|empty|any|created|added)\b|\bempty (state|list|inbox|table)\b/i, build: (s) => { const subj = subjectOf(s); const c = suggestCopy({ kind: 'empty', subject: subj }); const v = c.variants[0]; return [empty(v.title, v.description, v.action, v.icon, `A first-run screen with no ${plural(subj)}: say what will appear and give one action.`, c)]; } },
  { re: /\b(delete|remove|discard|destroy|erase|revoke|disconnect|archive|sign out|log out|permanent|irreversible|are you sure|confirm)\b/i, build: (s) => { const verb = verbOf(s) ?? 'delete'; const subj = subjectOf(s); const c = suggestCopy({ kind: 'confirm', subject: subj, action: verb }); const v = c.variants[0]; return [{ component: 'dialog', kind: 'component', why: 'A destructive or hard-to-undo action needs a confirmation that names it.', props: { title: v.title, body: v.body, confirmLabel: v.confirmLabel, cancelLabel: v.cancelLabel, backdrop: true }, copy: c }]; } },
  { re: /\b(fail|failed|couldn'?t|could not|can'?t|unable|error|went wrong|offline|network|timed? out)\b/i, build: (s) => { const reason = /network|offline|connect|time/.test(s) ? 'network' : /permission|access|denied/.test(s) ? 'permission' : /not found|404/.test(s) ? 'not found' : ''; const verb = verbOf(s) ?? 'save'; const c = suggestCopy({ kind: 'error', subject: subjectOf(s), action: verb, reason }); const v = c.variants[0]; const section = /page|screen|section|panel|list|table/.test(s); return [{ component: section ? 'alert' : 'toast', kind: 'component', why: section ? 'A problem with a region of the page stays visible until fixed: use an Alert there.' : 'A failed action is transient feedback: a Toast, with the next step.', props: section ? { title: v.title, body: v.body, tone: 'warning', dismissible: false } : { message: `${v.title}. ${v.body}`, variant: 'default', action: v.action, dismissible: true, duration: '0', count: '1', position: 'bottom-right' }, copy: c }]; } },
  { re: /\b(saved|created|sent|published|deleted|updated|invited|uploaded|success|succeeded|completed|done)\b/i, build: (s) => { const verb = verbOf(s) ?? 'save'; const c = suggestCopy({ kind: 'success', subject: subjectOf(s), action: verb }); return [{ component: 'toast', kind: 'component', why: 'Confirm what just happened without blocking: a short Toast in past tense.', props: { message: c.variants[0].message, variant: 'default', action: '', dismissible: true, duration: '4000', count: '1', position: 'bottom-right' }, copy: c }]; } },
  { re: /\b(loading|fetching|waiting|processing|in progress|pending|spinner|skeleton)\b/i, build: (s) => /percent|%|progress|upload|steps?/.test(s) ? [{ component: 'progress', kind: 'component', why: 'The amount done is known: show it.', props: { value: '40', max: '100', label: 'Progress' } }] : /list|table|page|card|content|feed|dashboard/.test(s) ? [{ component: 'skeleton', kind: 'component', why: 'Content is loading: hold its shape with a Skeleton.', props: { lines: '3' }, copy: suggestCopy({ kind: 'loading', subject: subjectOf(s) }) }] : [{ component: 'spinner', kind: 'component', why: 'A short wait with no known end: a Spinner.', props: { size: '20' } }] },
  { re: /\b(infinite|endless|thousands|very long|long list|load more|many (items|rows|results))\b/i, build: () => [{ component: 'infinite-list', kind: 'component', why: 'A long list that keeps loading as you scroll, with a Load more button for keyboards.', props: {} }, { component: 'data-table', kind: 'component', why: 'If people need to sort, filter and select rows, use a Data Table.', props: {} }] },
  { re: /\b(sign.?in|log.?in|login|authenticate)\b/i, build: () => [{ component: 'sign-in', kind: 'template', why: 'A whole sign-in screen: email, password, SSO and sign-up line.', props: {} }] },
  { re: /\b(settings?|preferences|account page|profile page)\b/i, build: () => [{ component: 'settings', kind: 'template', why: 'A settings page with a profile form, switches and a danger zone.', props: {} }] },
  { re: /\b(dashboard|overview|analytics|metrics|kpi)\b/i, build: () => [{ component: 'dashboard', kind: 'template', why: 'A dashboard: header, three stat cards, a chart and recent activity.', props: {} }] },
  { re: /\b(master.?detail|list.?(to|and).?detail|inbox|choose .* see (its )?details?)\b/i, build: () => [{ component: 'list-detail', kind: 'template', why: 'A list on the left that shows the chosen item on the right.', props: {} }] },
  { re: /\b(pick|choose|select)\b.*\b(date|day)\b|\bdate (of|range)\b/i, build: (s) => [{ component: /range|between|from .* to/.test(s) ? 'date-range-picker' : 'date-picker', kind: 'component', why: 'Choosing a date: a field with a calendar.', props: {} }] },
  { re: /\b(pick|choose|select)\b.*\b(time|hour)\b/i, build: () => [{ component: 'time-picker', kind: 'component', why: 'Choosing a time of day.', props: {} }] },
  { re: /\b(pick|choose|select)\b.*\b(colou?r)\b/i, build: () => [{ component: 'color-picker', kind: 'component', why: 'Any colour; use Swatch Picker for a fixed palette.', props: {} }] },
  { re: /\b(upload|attach|drop)\b.*\b(files?|images?|documents?)\b|\bfile upload\b/i, build: () => [{ component: 'file-upload', kind: 'component', why: 'A dropzone with a list of chosen files.', props: {} }] },
  { re: /\b(several|multiple|many)\b.*\b(tags?|options|people|choices)\b|\bmulti.?select\b/i, build: () => [{ component: 'multi-select', kind: 'component', why: 'Several picks from a known list, shown as chips.', props: {} }, { component: 'tag-input', kind: 'component', why: 'If people can type their own, use Tag Input.', props: {} }] },
  { re: /\b(one of (two|three|few)|either|toggle between|switch between views?)\b/i, build: () => [{ component: 'segmented-control', kind: 'component', why: 'A few exclusive views that switch instantly.', props: {} }, { component: 'radio-group', kind: 'component', why: 'Or a Radio Group when it is a form answer.', props: {} }] },
  { re: /\b(steps?|wizard|onboarding|checkout|multi.?step)\b/i, build: () => [{ component: 'stepper', kind: 'component', why: 'Show where someone is in a sequence of steps.', props: {} }] },
  { re: /\b(announce|announcement|new feature|maintenance|banner)\b/i, build: () => [{ component: 'banner', kind: 'component', why: 'A full-width message above the page.', props: {} }] },
  { re: /\b(unsaved|leave without saving|dirty|discard changes)\b/i, build: () => { const c = suggestCopy({ kind: 'confirm', subject: 'changes', action: 'discard' }); const v = c.variants[0]; return [{ component: 'dialog', kind: 'component', why: 'Leaving with unsaved work needs a confirmation that names what is lost.', props: { title: 'Leave without saving?', body: 'Your changes will be lost. You can\'t get them back.', confirmLabel: 'Leave without saving', cancelLabel: 'Keep editing', backdrop: true }, copy: { kind: c.kind, variants: [{ title: 'Leave without saving?', body: 'Your changes will be lost. You can\'t get them back.', confirmLabel: 'Leave without saving', cancelLabel: 'Keep editing' }] } }]; } },
  { re: /\b(chat|assistant|ai is|typing|streaming|message from)\b/i, build: () => [{ component: 'chat-message', kind: 'component', why: 'One message, with a typing state while streaming.', props: {} }, { component: 'chat-composer', kind: 'component', why: 'The message box with send and stop.', props: {} }] },
  { re: /\b(link|url)\b.*\b(preview|card|unfurl)\b|\bunfurl\b|\bbookmark\b/i, build: () => [{ component: 'link-preview', kind: 'component', why: 'A shared URL shown as a card: image, title, description and site.', props: {} }] },
];

/** "user has no projects yet" → Empty State with the right props and wording. */
export function suggestForSituation(situation: string, limit = 3): { situation: string; suggestions: Suggestion[] } {
  const s = situation.trim();
  const out: Suggestion[] = [];
  for (const r of RULES) if (r.re.test(s)) for (const x of r.build(s)) if (!out.some((o) => o.component === x.component)) out.push(x);
  if (!out.length) for (const r of searchComponents(s, limit).results) out.push({ component: r.id, kind: r.kind as 'component' | 'template', why: `Closest match by search (${r.why.slice(0, 3).join(', ')}).`, props: {} });
  return { situation: s, suggestions: out.slice(0, limit) };
}
