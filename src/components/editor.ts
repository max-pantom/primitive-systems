import { v } from '../tokens/theme';
import { iconNode, iconRule } from './button';
import { f, i as inp } from './forms';
import { P, focus, hiddenRule, lines, motion, n, p, ringDecl, text } from './shared';
import { srOnly } from './kit';
import type { ComponentDef, Node, Props } from './types';

/* ---------- Mention input ---------- */
const mn = { root: `${p}-mention`, input: `${p}-mention__input`, list: `${p}-mention__list`, opt: `${p}-mention__option`, on: `${p}-mention__option--active`, sr: `${p}-mention__sr`, hint: `${p}-mention__hint` };
export const mentionInput: ComponentDef = {
  id: 'mention-input', name: 'Mention Input', description: 'A textarea that suggests people or commands when you type @, # or /.', tags: ['control', 'form', 'ai'], status: 'stable',
  usage: 'Type the trigger character at the start of a word to open the list; keep typing to filter, ↑ ↓ to move, Enter or Tab to insert, Escape to close. The chosen name replaces the typed text ("@Ada Lovelace ") and fires p8-mention with { name, trigger }. Works for @people, #topics and /commands: set trigger and list the suggestions.',
  composition: 'A Textarea with a Combobox-style list under it.',
  props: [
    P.text('label', '', 'Visible label. Empty to use an aria-label.'),
    P.text('placeholder', 'Write a comment. Type @ to mention someone.', 'Placeholder.'),
    P.area('value', '', 'Initial text.'),
    P.area('people', 'Ada Lovelace\nAlan Turing\nGrace Hopper\nMargaret Hamilton', 'Suggestions, one per line.', 'string (one per line)'),
    P.select('trigger', ['@', '#', '/'], '@', 'Character that opens the list.'),
    P.select('rows', ['3', '4', '6'], '3', 'Visible rows.'),
    P.bool('disabled', false, 'Disables the field.'),
  ],
  rules: [
    { cls: mn.root, base: { position: 'relative', display: 'flex', 'flex-direction': 'column', gap: v('space-4'), width: v('size-500'), 'max-width': '100%' } },
    { cls: mn.input, base: { resize: 'vertical' } },
    { cls: mn.list, base: { position: 'absolute', top: '100%', left: '0', right: '0', 'margin-top': v('space-4'), 'z-index': '40', display: 'flex', 'flex-direction': 'column', gap: v('space-4'), 'box-sizing': 'border-box', padding: v('space-4'), 'border-radius': v('radius-8'), background: v('color-canvas'), color: v('color-ink'), 'max-height': v('size-240'), 'overflow-y': 'auto', ...ringDecl }, nested: [hiddenRule] },
    { cls: mn.opt, base: { display: 'flex', 'justify-content': 'space-between', gap: v('space-12'), 'text-align': 'left', 'padding-block': v('space-8'), 'padding-inline': v('space-12'), border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink'), cursor: 'pointer', ...text('sm') }, hover: { background: v('color-control') }, focus, nested: [{ sel: '[hidden]', decls: { display: 'none' } }] },
    { cls: mn.on, base: { background: v('color-control-strong') } },
    { cls: mn.hint, base: { color: v('color-ink-muted'), ...text('sm') } },
    { cls: mn.sr, base: srOnly },
  ],
  render(pr: Props): Node {
    const names = [...new Set(lines(pr.people))];
    const trig = pr.trigger as string;
    const attrs: Node['attrs'] = { id: 'mention-input', rows: pr.rows as string, placeholder: pr.placeholder as string, role: 'combobox', 'aria-expanded': 'false', 'aria-autocomplete': 'list', 'aria-controls': 'mention-list', 'aria-haspopup': 'listbox', 'data-input': true };
    if (!pr.label) attrs['aria-label'] = (pr.placeholder as string) || 'Message';
    if (pr.disabled) attrs.disabled = true;
    return n('div', [mn.root], [
      ...(pr.label ? [n('label', [f.label], [pr.label as string], { for: 'mention-input' })] : []),
      n('textarea', [inp.root, mn.input], pr.value ? [pr.value as string] : [], attrs),
      n('div', [mn.list], names.map((nm, k) => n('button', [mn.opt], [nm], { type: 'button', role: 'option', id: `mention-opt-${k}`, tabindex: '-1', 'data-value': nm })), { role: 'listbox', id: 'mention-list', 'aria-label': trig === '@' ? 'People' : trig === '#' ? 'Topics' : 'Commands', hidden: true, 'data-list': true }),
      n('p', [mn.sr], [], { role: 'status', 'aria-live': 'polite', 'data-live': true }),
    ], { 'data-p8': 'mention', 'data-trigger': trig });
  },
};

/* ---------- Rich text ---------- */
const rt = { root: `${p}-rich`, bar: `${p}-rich__bar`, btn: `${p}-rich__btn`, on: `${p}-rich__btn--on`, sep: `${p}-rich__sep`, editor: `${p}-rich__editor`, link: `${p}-rich__link`, err: `${p}-rich__error`, live: `${p}-rich__sr`, bold: `${p}-rich__btn--bold`, ital: `${p}-rich__btn--italic`, under: `${p}-rich__btn--underline` };
const TOOLS: Record<string, { label: string; cmd: string; text?: string; icon?: 'list' | 'link'; cls?: string }> = {
  bold: { label: 'Bold', cmd: 'bold', text: 'B', cls: rt.bold }, italic: { label: 'Italic', cmd: 'italic', text: 'I', cls: rt.ital }, underline: { label: 'Underline', cmd: 'underline', text: 'U', cls: rt.under },
  h2: { label: 'Heading', cmd: 'h2', text: 'H' }, quote: { label: 'Quote', cmd: 'quote', text: '“' }, ul: { label: 'Bulleted list', cmd: 'ul', icon: 'list' }, ol: { label: 'Numbered list', cmd: 'ol', text: '1.' },
  link: { label: 'Link', cmd: 'link', icon: 'link' }, undo: { label: 'Undo', cmd: 'undo', text: 'Undo' }, redo: { label: 'Redo', cmd: 'redo', text: 'Redo' },
};
export const richText: ComponentDef = {
  id: 'rich-text', name: 'Rich Text', description: 'A text editor with a formatting toolbar: bold, italic, underline, headings, quotes, lists and links.', tags: ['control', 'form', 'content'], status: 'stable',
  usage: 'Select text and use the toolbar or the usual shortcuts (⌘/Ctrl + B, I, U, K for a link). Pasting keeps plain text only. The link field accepts https, http, mailto, relative and # addresses and rejects everything else (no javascript:). p8-change fires with { html, text }. Treat the html as untrusted input and sanitize it on the server before you store or render it.',
  composition: 'A toolbar of icon and text buttons above an editable region.',
  props: [
    P.text('label', 'Notes', 'Accessible name of the editor.'),
    P.area('value', 'Write something worth reading.\n\nSelect some text to format it.', 'Initial text; a blank line starts a new paragraph.'),
    P.text('placeholder', 'Start writing…', 'Shown when the editor is empty.'),
    P.text('tools', 'bold italic underline | h2 quote | ul ol | link | undo redo', 'Toolbar tools in order; "|" is a separator. Choose from: ' + Object.keys(TOOLS).join(', ') + '.'),
    P.select('height', ['4', '8', '12'], '8', 'Editor height in rows (96, 160 or 240).'),
    P.bool('disabled', false, 'Read only.'),
  ],
  rules: [
    { cls: rt.root, base: { position: 'relative', display: 'flex', 'flex-direction': 'column', gap: v('space-8'), width: v('size-500'), 'max-width': '100%', color: v('color-ink'), ...text('sm') } },
    { cls: rt.bar, base: { display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', gap: v('space-4'), 'box-sizing': 'border-box', padding: v('space-4'), 'border-radius': v('radius-8'), background: v('color-control') } },
    { cls: rt.btn, base: { display: 'inline-flex', 'align-items': 'center', 'justify-content': 'center', 'min-width': v('size-32'), height: v('size-32'), 'box-sizing': 'border-box', 'padding-inline': v('space-12'), 'padding-block': '0', border: 'none', 'border-radius': v('radius-8'), background: 'transparent', color: v('color-ink-muted'), cursor: 'pointer', transition: `background ${motion}, color ${motion}`, ...text('sm') }, hover: { background: v('color-control-strong'), color: v('color-ink') }, focus, disabled: { opacity: v('opacity-disabled'), cursor: 'not-allowed' } },
    { cls: rt.on, base: { background: v('color-canvas'), color: v('color-ink'), ...ringDecl } },
    { cls: rt.bold, base: { 'font-weight': v('type-weight-strong') } },
    { cls: rt.ital, base: { 'font-style': 'italic' } },
    { cls: rt.under, base: { 'text-decoration': 'underline' } },
    { cls: rt.sep, base: { width: '0', height: v('size-16'), 'margin-inline': v('space-4'), 'border-left': `${v('border-hairline')} solid ${v('color-ring')}` } },
    { cls: rt.editor, base: { 'box-sizing': 'border-box', 'overflow-y': 'auto', 'padding-block': v('space-12'), 'padding-inline': v('space-12'), 'border-radius': v('radius-8'), background: v('color-control'), color: v('color-ink'), outline: 'none', transition: `background ${motion}`, ...text('sm') },
      hover: { background: v('color-control-strong') }, focus: { background: v('color-control-strong') },
      nested: [{ sel: ':empty::before', decls: { content: 'attr(data-placeholder)', color: v('color-placeholder'), 'pointer-events': 'none' } }, { sel: ' h2', decls: { margin: `0 0 ${v('space-8')}`, 'font-size': v('type-size-md'), 'line-height': v('type-line-md'), 'font-weight': v('type-weight-strong') } }, { sel: ' p', decls: { margin: `0 0 ${v('space-8')}` } }, { sel: ' blockquote', decls: { margin: `0 0 ${v('space-8')}`, 'padding-inline-start': v('space-12'), 'border-left': `${v('border-hairline')} solid ${v('color-ring')}`, color: v('color-ink-muted') } }, { sel: ' ul', decls: { margin: `0 0 ${v('space-8')}`, 'padding-inline-start': v('space-24') } }, { sel: ' ol', decls: { margin: `0 0 ${v('space-8')}`, 'padding-inline-start': v('space-24') } }, { sel: ' a', decls: { color: v('color-ink'), 'text-decoration': 'underline' } }, { sel: ' > :last-child', decls: { 'margin-bottom': '0' } }] },
    { cls: `${rt.editor}--h4`, base: { 'min-height': v('size-96') } },
    { cls: `${rt.editor}--h8`, base: { 'min-height': v('size-160') } },
    { cls: `${rt.editor}--h12`, base: { 'min-height': v('size-240') } },
    { cls: rt.link, base: { position: 'absolute', top: v('size-40'), left: '0', right: '0', 'z-index': '20', display: 'flex', 'flex-wrap': 'wrap', 'align-items': 'center', gap: v('space-8'), 'box-sizing': 'border-box', 'padding-block': v('space-12'), 'padding-inline': v('space-16'), 'border-radius': v('radius-8'), background: v('color-canvas'), ...ringDecl }, nested: [hiddenRule] },
    { cls: `${rt.link}-field`, base: { flex: '1 1 auto', 'min-width': v('size-160') } },
    { cls: rt.err, base: { margin: '0', 'flex-basis': '100%', color: v('color-ink'), 'font-weight': v('type-weight-strong'), ...text('sm') }, nested: [hiddenRule] },
    { cls: rt.live, base: srOnly },
    iconRule,
  ],
  render(pr: Props): Node {
    const tokens = String(pr.tools).split(/\s+/).filter(Boolean);
    const first = tokens.find((t) => TOOLS[t]);
    const off: Node['attrs'] = pr.disabled ? { disabled: true } : {};
    const bar: Node[] = tokens.map((t, k) => {
      if (t === '|') return n('span', [rt.sep], [], { role: 'separator', 'aria-orientation': 'vertical' });
      const tool = TOOLS[t];
      if (!tool) return null;
      return n('button', tool.cls ? [rt.btn, tool.cls] : [rt.btn], [tool.icon ? iconNode(tool.icon, 16) : tool.text!], { type: 'button', 'data-cmd': tool.cmd, 'aria-label': tool.label, 'aria-pressed': 'false', tabindex: t === first && k >= 0 ? '0' : '-1', ...off });
    }).filter((x): x is Node => x !== null);
    const paras = String(pr.value).split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
    const apply = n('button', [rt.btn], ['Apply'], { type: 'button', 'data-link-apply': true });
    const cancel = n('button', [rt.btn], ['Cancel'], { type: 'button', 'data-link-cancel': true });
    return n('div', [rt.root], [
      n('div', [rt.bar], bar, { role: 'toolbar', 'aria-label': `${(pr.label as string) || 'Editor'} formatting`, 'aria-controls': 'rich-editor' }),
      n('div', [rt.link], [n('input', [inp.root, `${rt.link}-field`], undefined, { type: 'url', placeholder: 'https://', 'aria-label': 'Link address', 'data-url': true }), apply, cancel, n('p', [rt.err], [], { role: 'alert', 'data-linkerr': true, hidden: true })], { 'data-linkbar': true, role: 'group', 'aria-label': 'Add link', hidden: true }),
      n('div', [rt.editor, `${rt.editor}--h${pr.height}`], paras.map((x) => n('p', [], [x])), { id: 'rich-editor', role: 'textbox', 'aria-multiline': 'true', 'aria-label': (pr.label as string) || 'Editor', 'data-placeholder': pr.placeholder as string, tabindex: '0', contenteditable: pr.disabled ? 'false' : 'true', 'data-editor': true, ...(pr.disabled ? { 'aria-readonly': 'true' } : {}) }),
      n('p', [rt.live], [], { role: 'status', 'aria-live': 'polite', 'data-live': true }),
    ], { 'data-p8': 'richtext' });
  },
};
