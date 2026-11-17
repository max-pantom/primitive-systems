import { ruleMap } from '../components';
import type { Node } from '../components';

/** data-p8 kinds present in a node tree. */
export function kindsIn(node: Node | string, acc = new Set<string>()): Set<string> {
  if (typeof node === 'string') return acc;
  const k = node.attrs?.['data-p8'];
  if (typeof k === 'string') k.split(' ').forEach((x) => acc.add(x));
  node.children?.forEach((c) => kindsIn(c, acc));
  return acc;
}

const SIG = '{ signal: ac.signal }';

const KINDS: Record<string, string> = {
  toggle: `
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="toggle"] [role="checkbox"], [data-p8~="toggle"] [role="switch"]');
    if (!b || b.disabled) return;
    var on = b.getAttribute('aria-checked') !== 'true';
    b.setAttribute('aria-checked', String(on));
    [b].concat(Array.from(b.querySelectorAll('*'))).forEach(function (el) { setOn(el, on); });
  }, ${SIG});`,

  group: `
  var ITEM = '[data-p8~="group"] [role="tab"], [data-p8~="group"] [role="radio"]';
  function gItems(g) { return Array.from(g.querySelectorAll('[role="tab"], [role="radio"]')); }
  function gSelect(g, it) {
    gItems(g).forEach(function (x) {
      var on = x === it;
      x.setAttribute(x.getAttribute('role') === 'tab' ? 'aria-selected' : 'aria-checked', String(on));
      x.tabIndex = on ? 0 : -1;
      [x].concat(Array.from(x.querySelectorAll('*'))).forEach(function (el) { setOn(el, on); });
    });
  }
  root.addEventListener('click', function (e) {
    var it = cl(e, ITEM);
    if (it && !it.disabled) gSelect(it.closest('[data-p8~="group"]'), it);
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var it = cl(e, ITEM);
    if (!it) return;
    var g = it.closest('[data-p8~="group"]');
    var list = gItems(g).filter(function (x) { return !x.disabled; });
    var i = list.indexOf(it), k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') i = (i + 1) % list.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') i = (i - 1 + list.length) % list.length;
    else if (k === 'Home') i = 0;
    else if (k === 'End') i = list.length - 1;
    else return;
    e.preventDefault();
    gSelect(g, list[i]);
    list[i].focus();
  }, ${SIG});`,

  menu: `
  function mItems(m) { return Array.from(m.querySelectorAll('[role="menuitem"]')).filter(function (x) { return !x.disabled; }); }
  function mMark(m, it) { mItems(m).forEach(function (x) { setOn(x, x === it); }); }
  root.addEventListener('click', function (e) {
    var it = cl(e, '[data-p8~="menu"] [role="menuitem"]');
    if (it) mMark(it.closest('[data-p8~="menu"]'), it);
  }, ${SIG});
  root.addEventListener('focusin', function (e) {
    var it = cl(e, '[data-p8~="menu"] [role="menuitem"]');
    if (it) mMark(it.closest('[data-p8~="menu"]'), it);
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var m = cl(e, '[data-p8~="menu"]');
    if (!m) return;
    if (e.key === 'Escape') { m.dispatchEvent(new CustomEvent('p8-close', { bubbles: true })); return; }
    var list = mItems(m), i = list.indexOf(cl(e, '[role="menuitem"]')), k = e.key;
    if (k === 'ArrowDown') i = (i + 1) % list.length;
    else if (k === 'ArrowUp') i = (i - 1 + list.length) % list.length;
    else if (k === 'Home') i = 0;
    else if (k === 'End') i = list.length - 1;
    else return;
    e.preventDefault();
    list[i].focus();
  }, ${SIG});`,

  tooltip: `
  function place(e) {
    var t = cl(e, '[data-p8~="tooltip"]');
    if (!t) return;
    var b = t.querySelector('[role="tooltip"]');
    if (!b) return;
    var win = doc.defaultView || window;
    var pref = t.getAttribute('data-placement') || 'top';
    b.style.translate = '';
    b.classList.toggle('p8-tooltip__bubble--top', pref === 'top');
    b.classList.toggle('p8-tooltip__bubble--bottom', pref !== 'top');
    var r = b.getBoundingClientRect();
    if (pref === 'top' && r.top < 8 || pref !== 'top' && r.bottom > win.innerHeight - 8) {
      b.classList.toggle('p8-tooltip__bubble--top');
      b.classList.toggle('p8-tooltip__bubble--bottom');
    }
    r = b.getBoundingClientRect();
    var w = win.innerWidth, dx = r.left < 8 ? 8 - r.left : (r.right > w - 8 ? w - 8 - r.right : 0);
    if (dx) b.style.translate = 'calc(-50% + ' + dx + 'px) 0';
  }
  root.addEventListener('mouseover', place, ${SIG});
  root.addEventListener('focusin', place, ${SIG});`,

  popover: `
  function pSet(p, open) {
    var panel = p.querySelector('[data-panel]'), tr = p.querySelector('[data-trigger]');
    panel.hidden = !open;
    tr.setAttribute('aria-expanded', String(open));
    if (open) { var f = panel.querySelector('[role="menuitem"], button, input, [tabindex]'); if (f) f.focus(); }
  }
  function pAll() { return all('[data-p8~="popover"]'); }
  root.addEventListener('click', function (e) {
    var tr = cl(e, '[data-trigger]');
    var p = tr && tr.closest('[data-p8~="popover"]');
    if (p) { pSet(p, p.querySelector('[data-panel]').hidden); return; }
    var item = cl(e, '[data-select-closes] [role="menuitem"]');
    if (item) { var host = item.closest('[data-p8~="popover"]'); pSet(host, false); host.querySelector('[data-trigger]').focus(); }
  }, ${SIG});
  doc.addEventListener('click', function (e) {
    pAll().forEach(function (p) { if (!p.contains(e.target)) pSet(p, false); });
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    pAll().forEach(function (p) { if (!p.querySelector('[data-panel]').hidden) { pSet(p, false); p.querySelector('[data-trigger]').focus(); } });
  }, ${SIG});
  root.addEventListener('p8-close', function (e) {
    var p = cl(e, '[data-p8~="popover"]');
    if (p) { pSet(p, false); p.querySelector('[data-trigger]').focus(); }
  }, ${SIG});`,

  overlay: `
  function oClose(o) { o.hidden = true; o.dispatchEvent(new CustomEvent('p8-closed', { bubbles: true })); }
  function oOpen() { return all('[data-p8~="overlay"]').filter(function (o) { return !o.hidden; }); }
  root.addEventListener('click', function (e) {
    var o = cl(e, '[data-p8~="overlay"]');
    if (!o) return;
    if (e.target === o || cl(e, '[data-close]')) oClose(o);
  }, ${SIG});
  doc.addEventListener('keydown', function (e) {
    var open = oOpen();
    var o = open[open.length - 1];
    if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
      var hot = all('[data-p8~="overlay"][data-hotkey]')[0];
      if (hot) { e.preventDefault(); hot.hidden = !hot.hidden; if (!hot.hidden) { var i = hot.querySelector('input'); if (i) i.focus(); } }
      return;
    }
    if (!o) return;
    if (e.key === 'Escape') { oClose(o); return; }
    if (e.key !== 'Tab') return;
    var f = Array.from(o.querySelectorAll('button, input, [href], select, textarea, [tabindex]')).filter(function (x) { return !x.disabled && x.tabIndex >= 0; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1], act = doc.activeElement;
    if (!o.contains(act)) { e.preventDefault(); first.focus(); }
    else if (e.shiftKey && act === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
  }, ${SIG});`,

  palette: `
  function pOpts(p) { return Array.from(p.querySelectorAll('[role="option"]')).filter(function (x) { return !x.hidden; }); }
  function pMark(p, it) { Array.from(p.querySelectorAll('[role="option"]')).forEach(function (x) { setOn(x, x === it); }); }
  root.addEventListener('input', function (e) {
    var p = cl(e, '[data-p8~="palette"]');
    if (!p || e.target.tagName !== 'INPUT') return;
    var q = e.target.value.toLowerCase();
    Array.from(p.querySelectorAll('[role="option"]')).forEach(function (x) { x.hidden = x.textContent.toLowerCase().indexOf(q) < 0; });
    pMark(p, pOpts(p)[0]);
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var p = cl(e, '[data-p8~="palette"]');
    if (!p) return;
    var list = pOpts(p), cur = list.findIndex(function (x) { return x.classList.contains('p8-palette__item--active'); });
    if (e.key === 'ArrowDown') cur = (cur + 1) % list.length;
    else if (e.key === 'ArrowUp') cur = (cur - 1 + list.length) % list.length;
    else if (e.key === 'Enter') { if (list[cur]) { e.preventDefault(); list[cur].click(); } return; }
    else return;
    e.preventDefault();
    pMark(p, list[cur]);
  }, ${SIG});
  root.addEventListener('click', function (e) {
    var it = cl(e, '[data-p8~="palette"] [role="option"]');
    if (it) pMark(it.closest('[data-p8~="palette"]'), it);
  }, ${SIG});`,

  toast: `
  all('[data-p8~="toast"] [data-duration]').forEach(function (t) {
    var d = Number(t.getAttribute('data-duration'));
    if (d > 0 && !opts.noTimers) timers.push(setTimeout(function () { t.remove(); }, d));
  });
  root.addEventListener('click', function (e) {
    var c = cl(e, '[data-p8~="toast"] [data-close]');
    if (c) c.closest('[data-duration]').remove();
  }, ${SIG});`,

  pager: `
  function pgSet(nav, page) {
    Array.from(nav.querySelectorAll('[data-page]')).forEach(function (x) {
      var on = x === page;
      if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
      setOn(x, on);
    });
  }
  root.addEventListener('click', function (e) {
    var nav = cl(e, '[data-p8~="pager"]');
    if (!nav) return;
    var pages = Array.from(nav.querySelectorAll('[data-page]'));
    var page = cl(e, '[data-page]'), step = cl(e, '[data-step]');
    if (page) pgSet(nav, page);
    else if (step) {
      var cur = pages.findIndex(function (x) { return x.getAttribute('aria-current') === 'page'; });
      var next = Math.min(pages.length - 1, Math.max(0, cur + Number(step.getAttribute('data-step'))));
      pgSet(nav, pages[next]);
    }
  }, ${SIG});`,

  combobox: `
  function cbOpts(c) { return Array.from(c.querySelectorAll('[role="option"]')); }
  function cbVis(c) { return cbOpts(c).filter(function (x) { return !x.hidden; }); }
  function cbOpen(c, open) { c.querySelector('[role="listbox"]').hidden = !open; c.querySelector('[role="combobox"]').setAttribute('aria-expanded', String(open)); }
  function cbMark(c, it) { cbOpts(c).forEach(function (x) { setOn(x, x === it); }); }
  function cbPick(c, it) { var i = c.querySelector('input'); i.value = it.textContent; i.dispatchEvent(new Event('change', { bubbles: true })); cbOpen(c, false); cbMark(c, it); }
  root.addEventListener('focusin', function (e) { var c = cl(e, '[data-p8~="combobox"]'); if (c && e.target.tagName === 'INPUT') cbOpen(c, true); }, ${SIG});
  root.addEventListener('click', function (e) {
    var it = cl(e, '[data-p8~="combobox"] [role="option"]');
    if (it) { cbPick(it.closest('[data-p8~="combobox"]'), it); return; }
    var c = cl(e, '[data-p8~="combobox"]');
    if (c && e.target.tagName === 'INPUT') cbOpen(c, true);
  }, ${SIG});
  root.addEventListener('input', function (e) {
    var c = cl(e, '[data-p8~="combobox"]');
    if (!c) return;
    var q = e.target.value.toLowerCase();
    cbOpts(c).forEach(function (x) { x.hidden = x.textContent.toLowerCase().indexOf(q) < 0; });
    cbOpen(c, true);
    cbMark(c, cbVis(c)[0]);
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var c = cl(e, '[data-p8~="combobox"]');
    if (!c || e.target.tagName !== 'INPUT') return;
    var list = cbVis(c), cur = list.findIndex(function (x) { return x.classList.contains('p8-combobox__option--active'); });
    if (e.key === 'ArrowDown') { cbOpen(c, true); cur = (cur + 1) % list.length; }
    else if (e.key === 'ArrowUp') { cbOpen(c, true); cur = (cur - 1 + list.length) % list.length; }
    else if (e.key === 'Enter') { if (list[cur] && !c.querySelector('[role="listbox"]').hidden) { e.preventDefault(); cbPick(c, list[cur]); } return; }
    else if (e.key === 'Escape') { cbOpen(c, false); return; }
    else return;
    e.preventDefault();
    cbMark(c, list[cur]);
  }, ${SIG});
  doc.addEventListener('click', function (e) { all('[data-p8~="combobox"]').forEach(function (c) { if (!c.contains(e.target)) cbOpen(c, false); }); }, ${SIG});`,

  number: `
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="number"] [data-step]');
    if (!b || b.disabled) return;
    var inp = b.closest('[data-p8~="number"]').querySelector('input');
    if (Number(b.getAttribute('data-step')) > 0) inp.stepUp(); else inp.stepDown();
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }, ${SIG});`,

  otp: `
  function oCells(g) { return Array.from(g.querySelectorAll('input')); }
  root.addEventListener('input', function (e) {
    var g = cl(e, '[data-p8~="otp"]');
    if (!g) return;
    var t = e.target, cells = oCells(g);
    t.value = t.value.replace(/\D/g, '').slice(-1);
    var i = cells.indexOf(t);
    if (t.value && cells[i + 1]) cells[i + 1].focus();
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var g = cl(e, '[data-p8~="otp"]');
    if (!g) return;
    var cells = oCells(g), i = cells.indexOf(e.target);
    if (e.key === 'Backspace' && !e.target.value && cells[i - 1]) { cells[i - 1].value = ''; cells[i - 1].focus(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' && cells[i - 1]) { cells[i - 1].focus(); e.preventDefault(); }
    else if (e.key === 'ArrowRight' && cells[i + 1]) { cells[i + 1].focus(); e.preventDefault(); }
  }, ${SIG});
  root.addEventListener('paste', function (e) {
    var g = cl(e, '[data-p8~="otp"]');
    if (!g) return;
    var digits = ((e.clipboardData && e.clipboardData.getData('text')) || '').replace(/\D/g, '');
    if (!digits) return;
    e.preventDefault();
    var cells = oCells(g), i = Math.max(0, cells.indexOf(e.target));
    for (var k = 0; k < digits.length && cells[i + k]; k++) cells[i + k].value = digits[k];
    cells[Math.min(cells.length - 1, i + digits.length)].focus();
  }, ${SIG});`,

  rating: `
  function rSet(g, it) {
    var items = Array.from(g.querySelectorAll('[role="radio"]')), idx = items.indexOf(it);
    items.forEach(function (x, i) { x.setAttribute('aria-checked', String(i === idx)); x.tabIndex = i === idx ? 0 : -1; setOn(x, i <= idx); });
  }
  root.addEventListener('click', function (e) {
    var it = cl(e, '[data-p8~="rating"] [role="radio"]');
    if (it && !it.disabled) rSet(it.closest('[data-p8~="rating"]'), it);
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var it = cl(e, '[data-p8~="rating"] [role="radio"]');
    if (!it) return;
    var g = it.closest('[data-p8~="rating"]'), items = Array.from(g.querySelectorAll('[role="radio"]')), i = items.indexOf(it);
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') i = Math.min(items.length - 1, i + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') i = Math.max(0, i - 1);
    else return;
    e.preventDefault();
    rSet(g, items[i]);
    items[i].focus();
  }, ${SIG});`,

  dismiss: `
  root.addEventListener('click', function (e) {
    var c = cl(e, '[data-p8~="dismiss"] [data-close]');
    if (c) c.closest('[data-p8~="dismiss"]').remove();
  }, ${SIG});`,

  copy: `
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="copy"]');
    if (!b) return;
    var text = b.getAttribute('data-copy') || '';
    if (doc.defaultView && doc.defaultView.navigator && doc.defaultView.navigator.clipboard) doc.defaultView.navigator.clipboard.writeText(text);
    var icons = Array.from(b.querySelectorAll('svg'));
    icons.forEach(function (i) { setOn(i, !i.classList.contains('p8-copybtn__icon--on')); });
    timers.push(setTimeout(function () { icons.forEach(function (i) { setOn(i, !i.classList.contains('p8-copybtn__icon--on')); }); }, 1500));
  }, ${SIG});`,
};

/** Class pairs (base, modifier) the runtime may toggle: every rule named X--on / X--active. */
function pairs(): [string, string][] {
  const out: [string, string][] = [];
  for (const k of ruleMap.keys()) for (const mod of ['--on', '--active']) if (k.endsWith(mod)) out.push([k.slice(0, -mod.length), mod]);
  return out;
}

export function hasBehavior(node: Node): boolean {
  return kindsIn(node).size > 0;
}

/** Self-contained `initP8(root, opts)` source for the kinds used. Returns a cleanup function. */
export function runtime(node: Node): string {
  const kinds = [...kindsIn(node)].filter((k) => KINDS[k]);
  const used = new Set(kinds);
  const needsPairs = ['toggle', 'group', 'menu', 'palette', 'pager', 'copy', 'combobox', 'rating'].some((k) => used.has(k));
  const body = kinds.map((k) => KINDS[k]).join('\n');
  return `function initP8(root, opts) {
  opts = opts || {};
  var ac = new AbortController(), timers = [];
  var doc = root.ownerDocument || root;
  function cl(e, sel) { var t = e.target; return t && t.closest ? t.closest(sel) : null; }
  function all(sel) { return Array.from(root.querySelectorAll(sel)).concat(root.matches && root.matches(sel) ? [root] : []); }
${needsPairs ? `  var PAIRS = ${JSON.stringify(pairs().filter(([b]) => ruleMapHasAny(b, node)))};
  function setOn(el, on) { PAIRS.forEach(function (p) { if (el.classList && el.classList.contains(p[0])) el.classList.toggle(p[0] + p[1], on); }); }` : ''}
${body}
  return function () { ac.abort(); timers.forEach(clearTimeout); };
}`;
}

function ruleMapHasAny(base: string, node: Node): boolean {
  // keep the PAIRS list short: only bases that appear in this tree
  const seen = new Set<string>();
  (function walk(n: Node | string) {
    if (typeof n === 'string') return;
    n.cls?.forEach((c) => seen.add(c));
    n.children?.forEach(walk);
  })(node);
  return seen.has(base);
}
