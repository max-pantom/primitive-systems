/**
 * HOUSE VOICE: how Primitive 8 apps write. Rules are data (shown by get_rules), the generator
 * (suggest_copy) writes in them, and the checker (check_copy) flags text that breaks them.
 */
export interface VoiceRule { id: string; title: string; statement: string; good: string; bad: string }

export const VOICE: VoiceRule[] = [
  { id: 'sentence-case', title: 'Sentence case', statement: 'Capitalize the first word and proper nouns only. Never Title Case a button, label or heading.', good: 'Create project', bad: 'Create New Project' },
  { id: 'verb-first', title: 'Buttons start with a verb', statement: 'A button says what it does: a verb and its object, two or three words. Never "Submit", "OK", "Yes" or "Click here".', good: 'Save changes', bad: 'Submit' },
  { id: 'say-what-and-how', title: 'Errors say what happened and how to fix it', statement: 'First what happened, then what to do next. No blame, no "Oops", no exclamation marks, no raw codes.', good: 'Couldn\'t save the project. Your changes are still here. Try again.', bad: 'Oops! Invalid input!' },
  { id: 'plain', title: 'Plain and calm', statement: 'No exclamation marks, no "please", no apologies, no jargon. Talk to the person as "you".', good: 'Your session ended. Sign in again to continue.', bad: 'Please note that your session has expired!' },
  { id: 'empty', title: 'Empty states teach', statement: 'Title: "No {things} yet". Description: what will appear and how to start. One action: "New {thing}".', good: 'No projects yet', bad: 'Nothing to see here' },
  { id: 'past-tense', title: 'Confirmations use past tense', statement: 'Say what just happened, in past tense, with a full stop.', good: 'Project saved.', bad: 'Saving project successful!' },
  { id: 'destructive', title: 'Name the destructive action', statement: 'Confirm dialogs ask a question naming the thing, say what is lost, and the confirm button repeats the verb.', good: 'Delete project? / This removes the project and its files. You can\'t undo this. / Delete project', bad: 'Are you sure? / Yes' },
  { id: 'length', title: 'Short', statement: 'Buttons up to 3 words, headings up to 60 characters, messages up to 140 characters.', good: 'Invite people', bad: 'Click here to invite more people to your workspace' },
  { id: 'punctuation', title: 'Punctuation', statement: 'No full stop on buttons, labels, headings or titles. Full stops on sentences. Use the ellipsis character (…) not three dots.', good: 'Loading…', bad: 'Loading...' },
];

/* ---------- words ---------- */
const IRREGULAR: Record<string, string> = { send: 'sent', create: 'created', save: 'saved', delete: 'deleted', remove: 'removed', update: 'updated', invite: 'invited', publish: 'published', add: 'added', upload: 'uploaded', archive: 'archived', approve: 'approved', cancel: 'canceled', copy: 'copied', share: 'shared', sign: 'signed', export: 'exported', import: 'imported', restore: 'restored', rename: 'renamed', move: 'moved', pay: 'paid', set: 'set', submit: 'sent', connect: 'connected', disconnect: 'disconnected' };
export const past = (verb: string) => IRREGULAR[verb.toLowerCase()] ?? (verb.endsWith('e') ? `${verb}d` : `${verb}ed`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export function singular(w: string): string {
  const s = w.trim().toLowerCase();
  if (/ies$/.test(s)) return s.replace(/ies$/, 'y');
  if (/(sses|xes|ches|shes)$/.test(s)) return s.replace(/es$/, '');
  if (/s$/.test(s) && !/ss$/.test(s)) return s.slice(0, -1);
  return s;
}
export function plural(w: string): string {
  const s = singular(w);
  if (/[^aeiou]y$/.test(s)) return s.replace(/y$/, 'ies');
  if (/(s|x|ch|sh)$/.test(s)) return `${s}es`;
  return `${s}s`;
}
const DESTRUCTIVE = /^(delete|remove|discard|destroy|erase|clear|revoke|disconnect|cancel|archive)$/i;

/* ---------- generator ---------- */
export type CopyKind = 'button' | 'empty' | 'error' | 'success' | 'confirm' | 'loading';
export interface CopyRequest { kind: CopyKind; subject?: string; action?: string; reason?: string; query?: string }
export interface Copy { kind: CopyKind; variants: Record<string, string>[]; voice: string[] }

export function suggestCopy(req: CopyRequest): Copy {
  const subject = (req.subject ?? '').trim() || 'item';
  const one = singular(subject), many = plural(subject);
  const verb = (req.action ?? '').trim().split(/\s+/)[0].toLowerCase();
  const reason = (req.reason ?? '').toLowerCase();
  switch (req.kind) {
    case 'button': {
      const v = verb || 'create';
      return { kind: 'button', voice: ['verb-first', 'sentence-case', 'length'], variants: [{ label: `${cap(v)} ${one}` }, ...(v === 'create' ? [{ label: `New ${one}` }, { label: `Add ${one}` }] : []), { secondary: 'Cancel' }] };
    }
    case 'empty': {
      if (/result|match|search|filter/.test(reason)) return { kind: 'empty', voice: ['empty', 'plain'], variants: [{ title: req.query ? `No results for “${req.query}”` : 'No results', description: 'Try a different word, or clear the filters.', action: 'Clear filters', icon: 'search' }] };
      if (/clear|done|caught|zero|inbox/.test(reason)) return { kind: 'empty', voice: ['empty', 'plain'], variants: [{ title: 'You\'re all caught up', description: `New ${many} will show up here.`, action: '', icon: 'check-circle' }] };
      return { kind: 'empty', voice: ['empty', 'plain', 'sentence-case'], variants: [{ title: `No ${many} yet`, description: `${cap(many)} you create will show up here. Start with your first one.`, action: `New ${one}`, icon: 'folder' }, { title: `No ${many} yet`, description: `When someone adds a ${one}, you'll see it here.`, action: '', icon: 'inbox' }] };
    }
    case 'error': {
      const e = ((): { title: string; body: string; action: string } => {
        if (/network|offline|connect|internet/.test(reason)) return { title: 'Can\'t connect', body: 'Check your internet connection and try again.', action: 'Try again' };
        if (/permission|access|forbidden|denied|auth/.test(reason)) return { title: 'You don\'t have access', body: 'Ask an admin to give you access, or switch accounts.', action: 'Switch account' };
        if (/not.?found|missing|404|gone/.test(reason)) return { title: `${cap(one)} not found`, body: 'The link may be old, or it may have been moved or deleted.', action: 'Go back' };
        if (/valid|required|format|empty/.test(reason)) return { title: `${cap(subject)} is required`, body: `Enter ${/^[aeiou]/i.test(one) ? 'an' : 'a'} ${one} to continue.`, action: '' };
        if (/server|500|unknown|wrong/.test(reason)) return { title: 'Something went wrong on our side', body: 'We\'re looking into it. Try again in a minute.', action: 'Try again' };
        return { title: `Couldn't ${verb || 'save'} the ${one}`, body: 'Your changes are still here. Try again.', action: 'Try again' };
      })();
      return { kind: 'error', voice: ['say-what-and-how', 'plain'], variants: [e] };
    }
    case 'success': {
      const v = verb || 'save';
      return { kind: 'success', voice: ['past-tense', 'plain'], variants: [{ message: `${cap(one)} ${past(v)}.` }, { message: `${cap(one)} ${past(v)}. Undo`, note: 'Toast with an Undo action' }] };
    }
    case 'confirm': {
      const v = verb || 'delete';
      const bad = DESTRUCTIVE.test(v);
      return { kind: 'confirm', voice: ['destructive', 'sentence-case', 'verb-first'], variants: [{ title: `${cap(v)} ${one}?`, body: bad ? `This removes the ${one} and everything in it. You can't undo this.` : `This ${one} will be ${past(v)} right away.`, confirmLabel: `${cap(v)} ${one}`, cancelLabel: 'Cancel' }] };
    }
    case 'loading':
      return { kind: 'loading', voice: ['punctuation'], variants: [{ message: `Loading ${many}…` }, { message: `${cap(verb ? past(verb) : 'saved')}…`.replace(/ed…$/, 'ing…') }] };
  }
}

/* ---------- checker ---------- */
export interface CopyIssue { rule: string; severity: 'error' | 'warn'; message: string; suggestion?: string }
const BAD_BUTTONS = /^(submit|ok|okay|yes|no|go|click here|here|continue to next|done)$/i;
const titleCase = (t: string) => { const w = t.split(/\s+/).filter((x) => /^[A-Za-z]{2,}$/.test(x)); if (w.length < 3) return false; const caps = w.slice(1).filter((x) => /^[A-Z][a-z]+$/.test(x)).length; return caps / (w.length - 1) >= 0.6; };

export function checkCopy(text: string, kind: 'button' | 'heading' | 'message' | 'label' = 'message'): { ok: boolean; issues: CopyIssue[] } {
  const t = text.trim();
  const issues: CopyIssue[] = [];
  const add = (rule: string, severity: CopyIssue['severity'], message: string, suggestion?: string) => issues.push({ rule, severity, message, suggestion });
  if (!t) return { ok: false, issues: [{ rule: 'length', severity: 'error', message: 'empty text' }] };
  if (/!/.test(t)) add('plain', 'error', 'No exclamation marks.', t.replace(/!+/g, kind === 'message' ? '.' : ''));
  if (/\bplease\b/i.test(t)) add('plain', 'warn', 'Drop "please": say what to do.', t.replace(/\bplease,?\s*/i, ''));
  if (/\b(oops|whoops|uh[- ]oh|sorry)\b/i.test(t)) add('say-what-and-how', 'error', 'No "Oops" or apologies: say what happened and how to fix it.');
  if (/^(error|warning)\s*:/i.test(t)) add('say-what-and-how', 'warn', 'Drop the "Error:" prefix; the component already shows it is an error.', t.replace(/^(error|warning)\s*:\s*/i, ''));
  if (/\b(invalid|illegal|bad)\b/i.test(t) && kind === 'message') add('say-what-and-how', 'warn', 'Say what to fix instead of calling the input invalid.');
  if (/\.\.\./.test(t)) add('punctuation', 'warn', 'Use the ellipsis character (…).', t.replace(/\.\.\./g, '…'));
  if (kind !== 'message' && /\.$/.test(t)) add('punctuation', 'warn', 'No full stop on buttons, labels and headings.', t.replace(/\.$/, ''));
  if (kind !== 'message' && titleCase(t)) add('sentence-case', 'warn', 'Use sentence case, not Title Case.', cap(t.toLowerCase()));
  if (kind === 'button') {
    if (BAD_BUTTONS.test(t)) add('verb-first', 'error', `"${t}" does not say what happens. Start with a verb and name the thing (Save changes, Delete project).`);
    if (t.split(/\s+/).length > 4) add('length', 'warn', 'Keep buttons to three words or fewer.');
  }
  if (kind === 'heading' && t.length > 60) add('length', 'warn', 'Keep headings under 60 characters.');
  if (kind === 'message' && t.length > 140) add('length', 'warn', 'Keep messages under 140 characters.');
  return { ok: !issues.some((i) => i.severity === 'error'), issues };
}
