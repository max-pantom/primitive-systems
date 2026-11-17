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
    if (p && !tr.disabled) { pSet(p, p.querySelector('[data-panel]').hidden); return; }
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

  tree: `
  function tItems(t) { return Array.from(t.querySelectorAll('[role="treeitem"]')).filter(function (x) { return !x.closest('[role="group"][hidden]'); }); }
  function tGroup(it) { var g = it.nextElementSibling; return g && g.getAttribute('role') === 'group' ? g : null; }
  function tOpen(it, open) { var g = tGroup(it); if (!g) return; g.hidden = !open; it.setAttribute('aria-expanded', String(open)); it.classList.toggle('p8-tree__item--on', open); }
  function tSelect(t, it) { Array.from(t.querySelectorAll('[role="treeitem"]')).forEach(function (x) { x.classList.toggle('p8-tree__item--active', x === it); x.tabIndex = x === it ? 0 : -1; }); }
  root.addEventListener('click', function (e) {
    var it = cl(e, '[data-p8~="tree"] [role="treeitem"]');
    if (!it) return;
    if (tGroup(it)) tOpen(it, it.getAttribute('aria-expanded') !== 'true');
    tSelect(it.closest('[data-p8~="tree"]'), it);
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var it = cl(e, '[data-p8~="tree"] [role="treeitem"]');
    if (!it) return;
    var t = it.closest('[data-p8~="tree"]'), list = tItems(t), i = list.indexOf(it), k = e.key, g = tGroup(it), open = it.getAttribute('aria-expanded') === 'true';
    if (k === 'ArrowDown') i = Math.min(list.length - 1, i + 1);
    else if (k === 'ArrowUp') i = Math.max(0, i - 1);
    else if (k === 'Home') i = 0;
    else if (k === 'End') i = list.length - 1;
    else if (k === 'ArrowRight') { if (g && !open) { tOpen(it, true); e.preventDefault(); return; } if (g && open) i = i + 1; else return; }
    else if (k === 'ArrowLeft') { if (g && open) { tOpen(it, false); e.preventDefault(); return; } var par = it.closest('[role="group"]'); if (par && par.previousElementSibling) i = list.indexOf(par.previousElementSibling); else return; }
    else return;
    e.preventDefault();
    if (list[i]) { list[i].focus(); tSelect(t, list[i]); }
  }, ${SIG});`,

  timer: `
  function tFmt(s) { var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; var pad = function (n) { return (n < 10 ? '0' : '') + n; }; return h > 0 ? h + ':' + pad(m) + ':' + pad(x) : pad(m) + ':' + pad(x); }
  all('[data-p8~="timer"]').forEach(function (t) {
    var down = t.getAttribute('data-mode') !== 'stopwatch', start = Number(t.getAttribute('data-seconds')) || 0;
    var cur = down ? start : 0, run = false, id = null, el = t.querySelector('[data-time]'), btn = t.querySelector('[data-timer="toggle"]');
    function paint() { el.textContent = tFmt(cur); t.classList.toggle('p8-timer--done', down && cur === 0); }
    function stop() { run = false; clearInterval(id); if (btn) btn.textContent = 'Start'; }
    function tick() {
      if (down) { cur = Math.max(0, cur - 1); if (cur === 0) { stop(); t.dispatchEvent(new CustomEvent('p8-timer-done', { bubbles: true })); } } else cur++;
      paint();
    }
    function go() { if (run || (down && cur === 0)) return; run = true; id = setInterval(tick, 1000); timers.push(id); if (btn) btn.textContent = 'Pause'; }
    t.__p8 = { toggle: function () { run ? stop() : go(); }, reset: function () { stop(); cur = down ? start : 0; paint(); } };
    paint();
    if (t.hasAttribute('data-autostart')) go();
  });
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="timer"] [data-timer]');
    if (!b) return;
    var t = b.closest('[data-p8~="timer"]');
    if (t.__p8) t.__p8[b.getAttribute('data-timer')]();
  }, ${SIG});`,

  inline: `
  function iDone(w, save) {
    var inp = w.querySelector('[data-edit]'), view = w.querySelector('[data-view]');
    if (inp.hidden) return;
    var label = inp.getAttribute('aria-label'), ph = inp.getAttribute('placeholder') || '';
    if (save) {
      var val = inp.value.trim();
      view.firstChild.textContent = val || ph;
      view.classList.toggle('p8-inline__view--empty', !val);
      view.setAttribute('aria-label', label + ': ' + (val || ph) + '. Edit');
      w.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { value: val } }));
    } else inp.value = inp.getAttribute('data-old') || '';
    inp.hidden = true; view.hidden = false; view.focus();
  }
  root.addEventListener('click', function (e) {
    var v = cl(e, '[data-p8~="inline"] [data-view]');
    if (!v) return;
    var w = v.closest('[data-p8~="inline"]'), inp = w.querySelector('[data-edit]');
    inp.setAttribute('data-old', inp.value);
    v.hidden = true; inp.hidden = false; inp.focus(); inp.select();
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var inp = cl(e, '[data-p8~="inline"] [data-edit]');
    if (!inp) return;
    if (e.key === 'Enter') { e.preventDefault(); iDone(inp.closest('[data-p8~="inline"]'), true); }
    else if (e.key === 'Escape') { e.preventDefault(); iDone(inp.closest('[data-p8~="inline"]'), false); }
  }, ${SIG});
  root.addEventListener('focusout', function (e) {
    var inp = cl(e, '[data-p8~="inline"] [data-edit]');
    if (inp) iDone(inp.closest('[data-p8~="inline"]'), true);
  }, ${SIG});`,

  calendar: `
  var CFMT = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  function cCells(y, m, ws) {
    var off = (new Date(Date.UTC(y, m, 1)).getUTCDay() - ws + 7) % 7, out = [];
    for (var i = 0; i < 42; i++) { var d = new Date(Date.UTC(y, m, 1 - off + i)); out.push({ iso: d.toISOString().slice(0, 10), n: d.getUTCDate(), out: d.getUTCMonth() !== m }); }
    return out;
  }
  function cYM(c) { var p = c.getAttribute('data-month').split('-'); return [Number(p[0]), Number(p[1]) - 1]; }
  function cPaint(c) {
    var ym = cYM(c), cells = cCells(ym[0], ym[1], Number(c.getAttribute('data-week')));
    var sel = c.querySelector('[data-input]').value;
    Array.from(c.querySelectorAll('[data-grid] [data-date]')).forEach(function (b, i) {
      var x = cells[i], on = x.iso === sel;
      b.setAttribute('data-date', x.iso); b.setAttribute('aria-label', x.iso); b.textContent = String(x.n);
      b.classList.toggle('p8-cal__day--out', x.out); b.classList.toggle('p8-cal__day--on', on); b.setAttribute('aria-pressed', String(on));
    });
    c.querySelector('[data-label]').textContent = CFMT.format(new Date(Date.UTC(ym[0], ym[1], 1)));
  }
  function cShift(c, d) {
    var ym = cYM(c), dt = new Date(Date.UTC(ym[0], ym[1] + d, 1));
    c.setAttribute('data-month', dt.getUTCFullYear() + '-' + ('0' + (dt.getUTCMonth() + 1)).slice(-2));
    cPaint(c);
  }
  root.addEventListener('click', function (e) {
    var c = cl(e, '[data-p8~="calendar"]');
    if (!c || c.querySelector('[data-input]').disabled) return;
    var dir = cl(e, '[data-p8~="calendar"] [data-dir]'), day = cl(e, '[data-p8~="calendar"] [data-date]');
    if (dir) { cShift(c, Number(dir.getAttribute('data-dir'))); return; }
    if (day) {
      var inp = c.querySelector('[data-input]');
      inp.value = day.getAttribute('data-date');
      inp.dispatchEvent(new Event('change', { bubbles: true }));
      cPaint(c);
      c.dispatchEvent(new CustomEvent('p8-close', { bubbles: true }));
    }
  }, ${SIG});
  root.addEventListener('input', function (e) {
    var c = cl(e, '[data-p8~="calendar"]');
    if (!c || !e.target.hasAttribute('data-input')) return;
    var v = e.target.value;
    if (/^\\d{4}-\\d{2}-\\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v) { c.setAttribute('data-month', v.slice(0, 7)); cPaint(c); }
  }, ${SIG});`,

  multi: `
  all('[data-p8~="multi"]').forEach(function (m) {
    var id = 'p8-multi-' + crypto.randomUUID(), list = m.querySelector('[role="listbox"]');
    list.id = id; m.querySelector('input').setAttribute('aria-controls', id);
    Array.from(list.children).forEach(function (opt, i) { opt.id = id + '-' + i; });
  });
  function mOpts(m) { return Array.from(m.querySelectorAll('[role="option"]')); }
  function mVis(m) { return mOpts(m).filter(function (x) { return !x.hidden; }); }
  function mOpen(m, o) { if (m.querySelector('input').disabled) o = false; m.querySelector('[role="listbox"]').hidden = !o; m.querySelector('[role="combobox"]').setAttribute('aria-expanded', String(o)); }
  function mLabel(opt) { return opt.firstChild.textContent.trim(); }
  function mMark(m, it) { mOpts(m).forEach(function (x) { setOn(x, x === it); }); var input = m.querySelector('input'); if (it) input.setAttribute('aria-activedescendant', it.id); else input.removeAttribute('aria-activedescendant'); }
  function mChip(m, label) {
    var tpl = m.querySelector('template[data-chip-template]');
    var src = (tpl.content && tpl.content.firstElementChild) || tpl.firstElementChild;
    var chip = src.cloneNode(true);
    chip.setAttribute('data-chip', label);
    chip.firstChild.textContent = label;
    chip.querySelector('[data-close]').setAttribute('aria-label', 'Remove ' + label);
    m.querySelector('[data-chips]').appendChild(chip);
  }
  function mUnchip(m, label) { Array.from(m.querySelectorAll('[data-chips] [data-chip]')).forEach(function (c) { if (c.getAttribute('data-chip') === label) c.remove(); }); }
  function mSet(m, opt, on) {
    opt.setAttribute('aria-selected', String(on));
    var label = mLabel(opt);
    mUnchip(m, label);
    if (on) mChip(m, label);
    m.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { value: Array.from(m.querySelectorAll('[data-chips] [data-chip]')).map(function (c) { return c.getAttribute('data-chip'); }) } }));
  }
  root.addEventListener('focusin', function (e) { var m = cl(e, '[data-p8~="multi"]'); if (m && e.target.tagName === 'INPUT') mOpen(m, true); }, ${SIG});
  root.addEventListener('click', function (e) {
    var m = cl(e, '[data-p8~="multi"]');
    if (!m || m.querySelector('input').disabled) return;
    var opt = cl(e, '[data-p8~="multi"] [role="option"]'), close = cl(e, '[data-p8~="multi"] [data-chip] [data-close]');
    if (opt) { mSet(m, opt, opt.getAttribute('aria-selected') !== 'true'); m.querySelector('input').focus(); return; }
    if (close) { var chip = close.closest('[data-chip]'), label = chip.getAttribute('data-chip'); mOpts(m).forEach(function (o) { if (mLabel(o) === label) o.setAttribute('aria-selected', 'false'); }); mUnchip(m, label); m.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { value: Array.from(m.querySelectorAll('[data-chips] [data-chip]')).map(function (c) { return c.getAttribute('data-chip'); }) } })); return; }
    if (e.target.tagName === 'INPUT' || e.target.closest('[data-chips]') === null) mOpen(m, true);
  }, ${SIG});
  root.addEventListener('input', function (e) {
    var m = cl(e, '[data-p8~="multi"]');
    if (!m) return;
    var q = e.target.value.toLowerCase();
    mOpts(m).forEach(function (x) { x.hidden = mLabel(x).toLowerCase().indexOf(q) < 0; });
    mOpen(m, true);
    mMark(m, mVis(m)[0]);
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var m = cl(e, '[data-p8~="multi"]');
    if (!m || e.target.disabled || e.target.tagName !== 'INPUT') return;
    var list = mVis(m), cur = list.findIndex(function (x) { return x.classList.contains('p8-multi__option--active'); });
    if (e.key === 'ArrowDown') { mOpen(m, true); cur = (cur + 1) % list.length; }
    else if (e.key === 'ArrowUp') { mOpen(m, true); cur = (cur - 1 + list.length) % list.length; }
    else if (e.key === 'Enter') { if (list[cur]) { e.preventDefault(); mSet(m, list[cur], list[cur].getAttribute('aria-selected') !== 'true'); } return; }
    else if (e.key === 'Escape') { mOpen(m, false); return; }
    else if (e.key === 'Backspace' && !e.target.value) { var chips = m.querySelectorAll('[data-chips] [data-chip]'), last = chips[chips.length - 1]; if (last) last.querySelector('[data-close]').click(); return; }
    else return;
    e.preventDefault();
    mMark(m, list[cur]);
  }, ${SIG});
  doc.addEventListener('click', function (e) { all('[data-p8~="multi"]').forEach(function (m) { if (!m.contains(e.target)) mOpen(m, false); }); }, ${SIG});`,

  upload: `
  function uSize(n) { return n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
  function uFiles(u) { return u.__files || Array.from(u.querySelector('input[type="file"]').files || []); }
  function uRender(u) {
    var list = u.querySelector('[data-files]'), tpl = u.querySelector('template[data-file-template]');
    var src = (tpl.content && tpl.content.firstElementChild) || tpl.firstElementChild;
    list.textContent = '';
    uFiles(u).forEach(function (f, i) {
      var li = src.cloneNode(true), spans = li.querySelectorAll('span');
      spans[0].textContent = f.name; spans[1].textContent = uSize(f.size);
      var b = li.querySelector('[data-remove]'); b.setAttribute('data-index', String(i)); b.setAttribute('aria-label', 'Remove ' + f.name);
      list.appendChild(li);
    });
  }
  root.addEventListener('change', function (e) {
    var u = cl(e, '[data-p8~="upload"]');
    if (!u || e.target.type !== 'file') return;
    u.__files = null; uRender(u);
  }, ${SIG});
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="upload"] [data-remove]');
    if (!b) return;
    var u = b.closest('[data-p8~="upload"]'), idx = Number(b.getAttribute('data-index'));
    u.__files = uFiles(u).filter(function (f, i) { return i !== idx; });
    try { var dt = new DataTransfer(); u.__files.forEach(function (f) { dt.items.add(f); }); u.querySelector('input[type="file"]').files = dt.files; } catch (err) { }
    uRender(u);
  }, ${SIG});
  ['dragenter', 'dragover'].forEach(function (t) { root.addEventListener(t, function (e) {
    var z = cl(e, '[data-p8~="upload"] [data-zone]');
    if (!z) return;
    e.preventDefault();
    if (!z.querySelector('input').disabled) z.classList.add('p8-upload__zone--over');
  }, ${SIG}); });
  root.addEventListener('dragleave', function (e) { var z = cl(e, '[data-p8~="upload"] [data-zone]'); if (z && !z.contains(e.relatedTarget)) z.classList.remove('p8-upload__zone--over'); }, ${SIG});
  root.addEventListener('drop', function (e) {
    var z = cl(e, '[data-p8~="upload"] [data-zone]');
    if (!z) return;
    e.preventDefault(); z.classList.remove('p8-upload__zone--over');
    var inp = z.querySelector('input');
    if (inp.disabled || !e.dataTransfer) return;
    var files = Array.from(e.dataTransfer.files), accept = inp.accept.toLowerCase().split(',').map(function (v) { return v.trim(); }).filter(Boolean);
    files = files.filter(function (f) { return !accept.length || accept.some(function (a) { return a[0] === '.' ? f.name.toLowerCase().endsWith(a) : a.endsWith('/*') ? f.type.toLowerCase().startsWith(a.slice(0, -1)) : f.type.toLowerCase() === a; }); });
    if (!inp.multiple) files = files.slice(0, 1);
    var dt = new DataTransfer(); files.forEach(function (f) { dt.items.add(f); }); inp.files = dt.files;
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }, ${SIG});`,

  carousel: `
  all('[data-p8~="carousel"]').forEach(function (c) {
    var tr = c.querySelector('[data-track]'), prev = c.querySelector('[data-dir="-1"]'), next = c.querySelector('[data-dir="1"]');
    function upd() { prev.disabled = tr.scrollLeft <= 1; next.disabled = tr.scrollLeft + tr.clientWidth >= tr.scrollWidth - 1; }
    tr.addEventListener('scroll', upd, ${SIG});
    upd();
  });
  function cGo(c, dir) { var tr = c.querySelector('[data-track]'); if (tr.scrollBy) tr.scrollBy({ left: dir * tr.clientWidth, behavior: 'smooth' }); else tr.scrollLeft += dir * tr.clientWidth; }
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="carousel"] [data-dir]');
    if (b && !b.disabled) cGo(b.closest('[data-p8~="carousel"]'), Number(b.getAttribute('data-dir')));
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var tr = cl(e, '[data-p8~="carousel"] [data-track]');
    if (!tr || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    cGo(tr.closest('[data-p8~="carousel"]'), e.key === 'ArrowRight' ? 1 : -1);
  }, ${SIG});`,

  context: `
  function xPanel(c) { return c.querySelector('[data-panel]'); }
  function xClose(c) { xPanel(c).hidden = true; c.querySelector('[data-area]').setAttribute('aria-expanded', 'false'); }
  function xOpen(c, x, y) {
    var p = xPanel(c), r = c.getBoundingClientRect();
    p.style.left = (x - r.left) + 'px'; p.style.top = (y - r.top) + 'px'; p.hidden = false; c.querySelector('[data-area]').setAttribute('aria-expanded', 'true');
    var f = p.querySelector('[role="menuitem"]'); if (f) f.focus();
  }
  root.addEventListener('contextmenu', function (e) {
    var a = cl(e, '[data-p8~="context"] [data-area]');
    if (!a) return;
    e.preventDefault();
    xOpen(a.closest('[data-p8~="context"]'), e.clientX, e.clientY);
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var a = cl(e, '[data-p8~="context"] [data-area]');
    if (!a || !(e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) return;
    e.preventDefault();
    var r = a.getBoundingClientRect();
    xOpen(a.closest('[data-p8~="context"]'), r.left + r.width / 2, r.top + r.height / 2);
  }, ${SIG});
  root.addEventListener('p8-close', function (e) {
    var c = cl(e, '[data-p8~="context"]');
    if (c) { xClose(c); c.querySelector('[data-area]').focus(); }
  }, ${SIG});
  root.addEventListener('click', function (e) {
    var item = cl(e, '[data-p8~="context"] [role="menuitem"]');
    if (item) xClose(item.closest('[data-p8~="context"]'));
  }, ${SIG});
  doc.addEventListener('click', function (e) { all('[data-p8~="context"]').forEach(function (c) { if (!c.contains(e.target)) xClose(c); }); }, ${SIG});`,

  password: `
  var PWT = { number: /\\d/, upper: /[A-Z]/, lower: /[a-z]/, symbol: /[^A-Za-z0-9\\s]/ };
  function pwCheck(w) {
    var v = w.querySelector('[data-password]').value, ok = true;
    Array.from(w.querySelectorAll('[data-rule]')).forEach(function (li) {
      var r = li.getAttribute('data-rule'), met = r.indexOf('length:') === 0 ? v.length >= Number(r.slice(7)) : PWT[r] ? PWT[r].test(v) : true;
      li.classList.toggle('p8-password__rule--on', met); if (!met) ok = false;
    });
    w.setAttribute('data-valid', String(ok));
    return ok;
  }
  all('[data-p8~="password"]').forEach(pwCheck);
  root.addEventListener('input', function (e) {
    var w = cl(e, '[data-p8~="password"]');
    if (!w || !e.target.hasAttribute('data-password')) return;
    var ok = pwCheck(w);
    w.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { valid: ok } }));
  }, ${SIG});
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="password"] [data-reveal]');
    if (!b || b.disabled) return;
    var w = b.closest('[data-p8~="password"]'), i = w.querySelector('[data-password]'), show = i.type === 'password';
    i.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    b.classList.toggle('p8-password__toggle--on', show);
  }, ${SIG});`,

  datatable: `
  function dtBox(b, state) {
    b.setAttribute('aria-checked', state === 'mixed' ? 'mixed' : String(state));
    b.classList.toggle('p8-check__box--on', state !== false);
    var icons = b.querySelectorAll('svg');
    icons[0].classList.toggle('p8-check__icon--on', state === true);
    if (icons[1]) icons[1].classList.toggle('p8-dtable__minus--on', state === 'mixed');
  }
  function dtPicked(t) { return Array.from(t.querySelectorAll('tbody [data-pick]')).filter(function (b) { return b.getAttribute('aria-checked') === 'true'; }); }
  function dtSync(t) {
    var picks = t.querySelectorAll('tbody [data-pick]'), on = dtPicked(t), head = t.querySelector('[data-all]');
    if (head) dtBox(head, !on.length ? false : on.length === picks.length ? true : 'mixed');
    Array.from(picks).forEach(function (b) { b.closest('tr').classList.toggle('p8-dtable__row--on', b.getAttribute('aria-checked') === 'true'); });
    var c = t.querySelector('[data-count]'); if (c && head) c.textContent = on.length + ' selected';
    Array.from(t.querySelectorAll('[data-action]')).forEach(function (a) { a.disabled = !on.length; });
  }
  function dtKey(s) { var x = s.trim(); return x !== '' && !isNaN(Number(x)) ? Number(x) : x; }
  function dtSort(t, col) {
    var th = t.querySelector('th[data-col="' + col + '"]'), dir = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
    Array.from(t.querySelectorAll('th[data-col]')).forEach(function (h) { h.setAttribute('aria-sort', h === th ? dir : 'none'); });
    var body = t.querySelector('tbody'), rows = Array.from(body.rows);
    rows.sort(function (a, b) {
      var x = dtKey(a.querySelector('td[data-col="' + col + '"]').textContent), y = dtKey(b.querySelector('td[data-col="' + col + '"]').textContent);
      var r = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: 'base' });
      return (dir === 'ascending' ? r : -r) || Number(a.getAttribute('data-row')) - Number(b.getAttribute('data-row'));
    });
    rows.forEach(function (r) { body.appendChild(r); });
    t.dispatchEvent(new CustomEvent('p8-sort', { bubbles: true, detail: { column: Number(col), direction: dir } }));
  }
  root.addEventListener('click', function (e) {
    var t = cl(e, '[data-p8~="datatable"]');
    if (!t) return;
    var s = cl(e, '[data-sort]'), pick = cl(e, '[data-pick]'), allB = cl(e, '[data-all]'), act = cl(e, '[data-action]'), col = cl(e, '[data-col][role="checkbox"]');
    if (s) { dtSort(t, s.getAttribute('data-sort')); return; }
    if (pick) { dtBox(pick, pick.getAttribute('aria-checked') !== 'true'); dtSync(t); return; }
    if (allB) { var to = allB.getAttribute('aria-checked') !== 'true'; Array.from(t.querySelectorAll('tbody [data-pick]')).forEach(function (b) { dtBox(b, to); }); dtSync(t); return; }
    if (act && !act.disabled) { t.dispatchEvent(new CustomEvent('p8-action', { bubbles: true, detail: { action: act.getAttribute('data-action'), rows: dtPicked(t).map(function (b) { return Number(b.closest('tr').getAttribute('data-row')); }).sort(function (a, b) { return a - b; }) } })); return; }
    if (col) {
      var shown = Array.from(t.querySelectorAll('[role="checkbox"][data-col]')).filter(function (b) { return b.getAttribute('aria-checked') === 'true'; });
      var show = col.getAttribute('aria-checked') !== 'true';
      if (!show && shown.length <= 1) return;
      dtBox(col, show);
      Array.from(t.querySelectorAll('th[data-col="' + col.getAttribute('data-col') + '"], td[data-col="' + col.getAttribute('data-col') + '"]')).forEach(function (c) { c.hidden = !show; });
    }
  }, ${SIG});`,

  range: `
  var RFMT = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  function drOk(v) { return /^\\d{4}-\\d{2}-\\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v; }
  function drCells(y, m, ws) {
    var off = (new Date(Date.UTC(y, m, 1)).getUTCDay() - ws + 7) % 7, out = [];
    for (var i = 0; i < 42; i++) { var d = new Date(Date.UTC(y, m, 1 - off + i)); out.push({ iso: d.toISOString().slice(0, 10), n: d.getUTCDate(), out: d.getUTCMonth() !== m }); }
    return out;
  }
  function drVals(c) { var s = c.querySelector('[data-start]').value, e = c.querySelector('[data-end]').value; s = drOk(s) ? s : ''; e = drOk(e) && s ? e : ''; return [s, e]; }
  function drPaint(c) {
    var p = c.getAttribute('data-month').split('-'), y = Number(p[0]), m = Number(p[1]) - 1, cells = drCells(y, m, Number(c.getAttribute('data-week'))), v = drVals(c);
    Array.from(c.querySelectorAll('[data-grid] [data-date]')).forEach(function (b, i) {
      var x = cells[i], end = x.iso === v[0] || x.iso === v[1], mid = !!(v[0] && v[1] && x.iso > v[0] && x.iso < v[1]);
      b.setAttribute('data-date', x.iso); b.setAttribute('aria-label', x.iso); b.textContent = String(x.n);
      b.classList.toggle('p8-cal__day--out', x.out); b.classList.toggle('p8-cal__day--on', end); b.classList.toggle('p8-cal__day--active', mid); b.setAttribute('aria-pressed', String(end || mid));
    });
    c.querySelector('[data-label]').textContent = RFMT.format(new Date(Date.UTC(y, m, 1)));
    var n = v[0] && v[1] ? Math.round((Date.parse(v[1]) - Date.parse(v[0])) / 86400000) + 1 : 0;
    c.querySelector('[data-hint]').textContent = !v[0] ? 'Pick a start date' : !v[1] ? 'Pick an end date' : n + (n === 1 ? ' day' : ' days') + ' selected';
  }
  function drEmit(c) { var v = drVals(c); c.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { start: v[0], end: v[1] } })); }
  root.addEventListener('click', function (e) {
    var c = cl(e, '[data-p8~="range"]');
    if (!c || c.querySelector('[data-start]').disabled) return;
    var dir = cl(e, '[data-p8~="range"] [data-dir]'), day = cl(e, '[data-p8~="range"] [data-date]');
    if (dir) { var p = c.getAttribute('data-month').split('-'), d = new Date(Date.UTC(Number(p[0]), Number(p[1]) - 1 + Number(dir.getAttribute('data-dir')), 1)); c.setAttribute('data-month', d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2)); drPaint(c); return; }
    if (!day) return;
    var s = c.querySelector('[data-start]'), en = c.querySelector('[data-end]'), v = drVals(c), iso = day.getAttribute('data-date'), done = false;
    if (!v[0] || v[1]) { s.value = iso; en.value = ''; }
    else if (iso < v[0]) s.value = iso;
    else { en.value = iso; done = true; }
    drPaint(c); drEmit(c);
    if (done) c.dispatchEvent(new CustomEvent('p8-close', { bubbles: true }));
  }, ${SIG});
  root.addEventListener('input', function (e) {
    var c = cl(e, '[data-p8~="range"]');
    if (!c || !(e.target.hasAttribute('data-start') || e.target.hasAttribute('data-end'))) return;
    if (drOk(e.target.value)) c.setAttribute('data-month', e.target.value.slice(0, 7));
    drPaint(c);
  }, ${SIG});
  root.addEventListener('change', function (e) {
    var c = cl(e, '[data-p8~="range"]');
    if (!c || !(e.target.hasAttribute('data-start') || e.target.hasAttribute('data-end'))) return;
    var s = c.querySelector('[data-start]'), en = c.querySelector('[data-end]');
    if (drOk(s.value) && drOk(en.value) && en.value < s.value) { var t = s.value; s.value = en.value; en.value = t; }
    drPaint(c); drEmit(c);
  }, ${SIG});`,

  resize: `
  function rzSet(h, pct) {
    var min = Number(h.getAttribute('aria-valuemin')), max = Number(h.getAttribute('aria-valuemax'));
    pct = Math.round(Math.min(max, Math.max(min, pct)));
    h.setAttribute('aria-valuenow', String(pct));
    h.previousElementSibling.style.flexBasis = pct + '%';
    h.dispatchEvent(new CustomEvent('p8-resize', { bubbles: true, detail: { size: pct } }));
  }
  function rzVert(h) { return h.getAttribute('aria-orientation') === 'horizontal'; }
  root.addEventListener('keydown', function (e) {
    var h = cl(e, '[data-p8~="resize"] [data-handle]');
    if (!h) return;
    var now = Number(h.getAttribute('aria-valuenow')), k = e.key, vert = rzVert(h);
    if (k === (vert ? 'ArrowUp' : 'ArrowLeft')) rzSet(h, now - 5);
    else if (k === (vert ? 'ArrowDown' : 'ArrowRight')) rzSet(h, now + 5);
    else if (k === 'Home') rzSet(h, 0);
    else if (k === 'End') rzSet(h, 100);
    else return;
    e.preventDefault();
  }, ${SIG});
  root.addEventListener('pointerdown', function (e) {
    var h = cl(e, '[data-p8~="resize"] [data-handle]');
    if (!h || e.button !== 0) return;
    e.preventDefault(); h.focus();
    var box = h.parentElement, vert = rzVert(h);
    if (h.setPointerCapture) try { h.setPointerCapture(e.pointerId); } catch (err) { }
    function move(ev) { var r = box.getBoundingClientRect(); rzSet(h, vert ? (ev.clientY - r.top) / r.height * 100 : (ev.clientX - r.left) / r.width * 100); }
    function up() { h.removeEventListener('pointermove', move); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); }
    h.addEventListener('pointermove', move, ${SIG}); h.addEventListener('pointerup', up, ${SIG}); h.addEventListener('pointercancel', up, ${SIG});
  }, ${SIG});`,

  sortable: `
  function soItems(l) { return Array.from(l.querySelectorAll('[data-item]')); }
  function soDone(w, li, announce) {
    var items = soItems(w), i = items.indexOf(li), name = li.getAttribute('data-item');
    items.forEach(function (x, j) { x.querySelector('[data-handle]').setAttribute('aria-label', 'Move ' + x.getAttribute('data-item') + ', position ' + (j + 1) + ' of ' + items.length); });
    if (announce) w.querySelector('[data-status]').textContent = name + ' moved to position ' + (i + 1) + ' of ' + items.length;
    w.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { order: items.map(function (x) { return x.getAttribute('data-item'); }) } }));
  }
  root.addEventListener('keydown', function (e) {
    var h = cl(e, '[data-p8~="sortable"] [data-handle]');
    if (!h) return;
    var w = h.closest('[data-p8~="sortable"]'), li = h.closest('[data-item]'), list = li.parentElement, k = e.key;
    if (k === 'ArrowUp' && li.previousElementSibling) list.insertBefore(li, li.previousElementSibling);
    else if (k === 'ArrowDown' && li.nextElementSibling) list.insertBefore(li.nextElementSibling, li);
    else if (k === 'Home' && li.previousElementSibling) list.insertBefore(li, list.firstElementChild);
    else if (k === 'End' && li.nextElementSibling) list.appendChild(li);
    else { if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'Home' || k === 'End') e.preventDefault(); return; }
    e.preventDefault(); h.focus(); soDone(w, li, true);
  }, ${SIG});
  root.addEventListener('pointerdown', function (e) {
    var h = cl(e, '[data-p8~="sortable"] [data-handle]');
    if (!h || e.button !== 0) return;
    var w = h.closest('[data-p8~="sortable"]'), li = h.closest('[data-item]'), list = li.parentElement, moved = false;
    e.preventDefault();
    li.classList.add('p8-sortable__item--active');
    function move(ev) {
      var sibs = soItems(list).filter(function (x) { return x !== li; }), before = null;
      for (var i = 0; i < sibs.length; i++) { var r = sibs[i].getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { before = sibs[i]; break; } }
      if (before !== li.nextElementSibling || (!before && li !== list.lastElementChild)) { list.insertBefore(li, before); moved = true; }
    }
    function up() {
      li.classList.remove('p8-sortable__item--active');
      doc.removeEventListener('pointermove', move); doc.removeEventListener('pointerup', up); doc.removeEventListener('pointercancel', up);
      h.focus();
      if (moved) soDone(w, li, true);
    }
    // Listen on the document: moving the item in the DOM would drop pointer capture on the handle.
    doc.addEventListener('pointermove', move, ${SIG}); doc.addEventListener('pointerup', up, ${SIG}); doc.addEventListener('pointercancel', up, ${SIG});
  }, ${SIG});`,

  filters: `
  function fbData(b) { try { return JSON.parse(b.getAttribute('data-fields') || '{}'); } catch (err) { return {}; } }
  function fbChips(b) { return Array.from(b.querySelectorAll('[data-chips] [data-chip]')); }
  function fbSync(b) {
    var chips = fbChips(b), off = b.querySelector('[data-add]').disabled;
    b.querySelector('[data-empty]').hidden = chips.length > 0;
    b.querySelector('[data-clear]').disabled = off || !chips.length;
    b.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { filters: chips.map(function (c) { var t = c.getAttribute('data-chip'), i = t.indexOf(': '); return { field: t.slice(0, i), value: t.slice(i + 2) }; }) } }));
  }
  root.addEventListener('change', function (e) {
    var b = cl(e, '[data-p8~="filters"]');
    if (!b || !e.target.hasAttribute('data-field')) return;
    var vs = fbData(b)[e.target.value] || [], sel = b.querySelector('[data-value]');
    sel.textContent = '';
    vs.forEach(function (v) { var o = doc.createElement('option'); o.value = v; o.textContent = v; sel.appendChild(o); });
  }, ${SIG});
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="filters"]');
    if (!b) return;
    var add = cl(e, '[data-add]'), clear = cl(e, '[data-clear]'), x = cl(e, '[data-chip] [data-close]');
    if (add && !add.disabled) {
      var label = b.querySelector('[data-field]').value + ': ' + b.querySelector('[data-value]').value;
      if (fbChips(b).some(function (c) { return c.getAttribute('data-chip') === label; })) return;
      var tpl = b.querySelector('template[data-chip-template]'), src = (tpl.content && tpl.content.firstElementChild) || tpl.firstElementChild, chip = src.cloneNode(true);
      chip.setAttribute('data-chip', label); chip.firstChild.textContent = label; chip.querySelector('[data-close]').setAttribute('aria-label', 'Remove ' + label);
      b.querySelector('[data-chips]').insertBefore(chip, b.querySelector('[data-empty]'));
      fbSync(b); return;
    }
    if (x) { x.closest('[data-chip]').remove(); fbSync(b); b.querySelector('[data-add]').focus(); return; }
    if (clear && !clear.disabled) { fbChips(b).forEach(function (c) { c.remove(); }); fbSync(b); b.querySelector('[data-field]').focus(); }
  }, ${SIG});`,

  notify: `
  function ntSync(w) {
    var n = w.querySelectorAll('[data-unread="true"]').length;
    w.querySelector('[data-count]').textContent = n ? n + ' unread' : 'All caught up';
    w.querySelector('[data-all]').disabled = !n;
    return n;
  }
  root.addEventListener('click', function (e) {
    var w = cl(e, '[data-p8~="notify"]');
    if (!w) return;
    var one = cl(e, '[data-read]'), allB = cl(e, '[data-all]');
    if (one) {
      var li = one.closest('[data-unread]');
      li.setAttribute('data-unread', 'false'); one.disabled = true;
      var left = ntSync(w), next = w.querySelector('[data-unread="true"] [data-read]');
      (next || (left ? w.querySelector('[data-all]') : w)).focus();
      w.dispatchEvent(new CustomEvent('p8-read', { bubbles: true, detail: { index: Number(li.getAttribute('data-index')) } }));
      return;
    }
    if (allB && !allB.disabled) {
      Array.from(w.querySelectorAll('[data-unread="true"]')).forEach(function (li) { li.setAttribute('data-unread', 'false'); li.querySelector('[data-read]').disabled = true; });
      ntSync(w); w.focus();
      w.dispatchEvent(new CustomEvent('p8-read', { bubbles: true, detail: { all: true } }));
    }
  }, ${SIG});
  all('[data-p8~="notify"]').forEach(function (w) { Array.from(w.querySelectorAll('[data-unread="false"] [data-read]')).forEach(function (b) { b.disabled = true; }); });`,

  lightbox: `
  function lbThumbs(g) { return Array.from(g.querySelectorAll('[data-open]')); }
  function lbShow(g, i) {
    var t = lbThumbs(g), n = t.length; i = (i + n) % n;
    var o = g.querySelector('[data-lightbox]'), img = o.querySelector('[data-full]'), th = t[i];
    img.src = th.querySelector('img').getAttribute('src'); img.alt = th.getAttribute('data-caption');
    o.querySelector('[data-caption]').textContent = th.getAttribute('data-caption');
    o.querySelector('[data-counter]').textContent = (i + 1) + ' / ' + n;
    g.setAttribute('data-index', String(i));
  }
  root.addEventListener('click', function (e) {
    var g = cl(e, '[data-p8~="lightbox"]');
    if (!g) return;
    var th = cl(e, '[data-open]'), dir = cl(e, '[data-lightbox] [data-dir]');
    if (th) { g.__opener = th; lbShow(g, Number(th.getAttribute('data-open'))); var o = g.querySelector('[data-lightbox]'); o.hidden = false; o.querySelector('[data-close]').focus(); return; }
    if (dir && !dir.disabled) lbShow(g, Number(g.getAttribute('data-index') || 0) + Number(dir.getAttribute('data-dir')));
  }, ${SIG});
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    all('[data-p8~="lightbox"]').forEach(function (g) {
      if (g.querySelector('[data-lightbox]').hidden || lbThumbs(g).length < 2) return;
      e.preventDefault();
      lbShow(g, Number(g.getAttribute('data-index') || 0) + (e.key === 'ArrowRight' ? 1 : -1));
    });
  }, ${SIG});
  root.addEventListener('p8-closed', function (e) {
    var g = cl(e, '[data-p8~="lightbox"]');
    if (g && g.__opener) g.__opener.focus();
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
  const needsPairs = ['toggle', 'group', 'menu', 'palette', 'pager', 'copy', 'combobox', 'rating', 'multi'].some((k) => used.has(k));
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
  return function () { ac.abort(); timers.forEach(function (x) { clearTimeout(x); clearInterval(x); }); };
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
