/** Behavior kinds for the app-level components (kit.ts, screens.ts). Merged into the runtime by behavior.ts. */
const SIG = '{ signal: ac.signal }';

export const KINDS2: Record<string, string> = {
  action: `
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="action"] [data-action]');
    if (!b || b.disabled) return;
    b.dispatchEvent(new CustomEvent('p8-action', { bubbles: true, detail: { action: b.getAttribute('data-action') } }));
  }, ${SIG});`,

  togglegroup: `
  function tgItems(g) { return Array.from(g.querySelectorAll('[data-value]')); }
  function tgSet(b, on) { b.setAttribute('aria-pressed', String(on)); b.classList.toggle('p8-togglegroup__item--on', on); }
  function tgEmit(g) { g.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { value: tgItems(g).filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; }).map(function (x) { return x.getAttribute('data-value'); }) } })); }
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="togglegroup"] [data-value]');
    if (!b || b.disabled) return;
    var g = b.closest('[data-p8~="togglegroup"]'), on = b.getAttribute('aria-pressed') !== 'true';
    if (g.getAttribute('data-type') === 'single') tgItems(g).forEach(function (x) { tgSet(x, false); });
    tgSet(b, on);
    tgItems(g).forEach(function (x) { x.tabIndex = x === b ? 0 : -1; });
    tgEmit(g);
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var b = cl(e, '[data-p8~="togglegroup"] [data-value]');
    if (!b) return;
    var list = tgItems(b.closest('[data-p8~="togglegroup"]')).filter(function (x) { return !x.disabled; }), i = list.indexOf(b), k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') i = (i + 1) % list.length;
    else if (k === 'ArrowLeft' || k === 'ArrowUp') i = (i - 1 + list.length) % list.length;
    else if (k === 'Home') i = 0;
    else if (k === 'End') i = list.length - 1;
    else return;
    e.preventDefault();
    list.forEach(function (x) { x.tabIndex = -1; });
    list[i].tabIndex = 0; list[i].focus();
  }, ${SIG});`,

  color: `
  function colHex(h, s, v) {
    var S = s / 100, V = v / 100;
    function f(n) { var k = (n + h / 60) % 6; return Math.round(255 * (V - V * S * Math.max(0, Math.min(k, 4 - k, 1)))); }
    return '#' + [f(5), f(3), f(1)].map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join('').toUpperCase();
  }
  function colParse(hex) {
    var m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
    if (!m) return null;
    var r = parseInt(m[1].slice(0, 2), 16) / 255, g = parseInt(m[1].slice(2, 4), 16) / 255, b = parseInt(m[1].slice(4, 6), 16) / 255;
    var mx = Math.max(r, g, b), d = mx - Math.min(r, g, b), h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [Math.round((h * 60 + 360) % 360), Math.round(mx ? (d / mx) * 100 : 0), Math.round(mx * 100)];
  }
  function colGet(c) { return [Number(c.getAttribute('data-h')), Number(c.getAttribute('data-s')), Number(c.getAttribute('data-v'))]; }
  function colPaint(c, skipHex) {
    var a = colGet(c), hex = colHex(a[0], a[1], a[2]), label = c.getAttribute('data-label') || 'Colour';
    var sv = c.querySelector('[data-thumb="sv"]'), hue = c.querySelector('[data-thumb="hue"]');
    c.querySelector('[data-area="sv"]').style.background = 'linear-gradient(to top, black, transparent), linear-gradient(to right, white, hsl(' + a[0] + ' 100% 50%))';
    sv.style.left = a[1] + '%'; sv.style.top = (100 - a[2]) + '%';
    sv.setAttribute('aria-valuenow', String(a[1])); sv.setAttribute('aria-valuetext', 'Saturation ' + a[1] + '%, brightness ' + a[2] + '%');
    hue.style.left = (a[0] / 360 * 100) + '%'; hue.setAttribute('aria-valuenow', String(a[0]));
    c.querySelector('[data-preview]').style.background = hex;
    c.querySelector('[data-readout]').textContent = hex;
    var tr = c.querySelector('[data-trigger]'); tr.style.background = hex; tr.setAttribute('aria-label', label + ': ' + hex);
    if (!skipHex) c.querySelector('[data-hex]').value = hex;
    return hex;
  }
  function colSet(c, h, s, v, skipHex) {
    c.setAttribute('data-h', String(Math.round(h))); c.setAttribute('data-s', String(Math.round(s))); c.setAttribute('data-v', String(Math.round(v)));
    var hex = colPaint(c, skipHex);
    c.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { value: hex } }));
  }
  function colPoint(area, e) {
    var r = area.getBoundingClientRect(), w = r.width || 1, h = r.height || 1;
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / w)), Math.min(1, Math.max(0, (e.clientY - r.top) / h))];
  }
  function colMove(c, area, e) {
    var p = colPoint(area, e), a = colGet(c);
    if (area.getAttribute('data-area') === 'sv') colSet(c, a[0], p[0] * 100, (1 - p[1]) * 100); else colSet(c, p[0] * 360, a[1], a[2]);
  }
  var colDrag = null;
  root.addEventListener('pointerdown', function (e) {
    var area = cl(e, '[data-p8~="color"] [data-area]');
    if (!area) return;
    e.preventDefault();
    colDrag = area;
    if (area.setPointerCapture && e.pointerId !== undefined) try { area.setPointerCapture(e.pointerId); } catch (err) { }
    colMove(area.closest('[data-p8~="color"]'), area, e);
    var th = area.querySelector('[data-thumb]'); if (th) th.focus();
  }, ${SIG});
  doc.addEventListener('pointermove', function (e) { if (colDrag) colMove(colDrag.closest('[data-p8~="color"]'), colDrag, e); }, ${SIG});
  doc.addEventListener('pointerup', function () { colDrag = null; }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var th = cl(e, '[data-p8~="color"] [data-thumb]');
    if (!th) return;
    var c = th.closest('[data-p8~="color"]'), a = colGet(c), step = e.shiftKey ? 10 : 1, k = e.key, kind = th.getAttribute('data-thumb');
    if (kind === 'sv') {
      if (k === 'ArrowRight') a[1] = Math.min(100, a[1] + step); else if (k === 'ArrowLeft') a[1] = Math.max(0, a[1] - step);
      else if (k === 'ArrowUp') a[2] = Math.min(100, a[2] + step); else if (k === 'ArrowDown') a[2] = Math.max(0, a[2] - step); else return;
    } else {
      if (k === 'ArrowRight' || k === 'ArrowUp') a[0] = Math.min(360, a[0] + step); else if (k === 'ArrowLeft' || k === 'ArrowDown') a[0] = Math.max(0, a[0] - step);
      else if (k === 'Home') a[0] = 0; else if (k === 'End') a[0] = 360; else return;
    }
    e.preventDefault();
    colSet(c, a[0], a[1], a[2]);
  }, ${SIG});
  root.addEventListener('input', function (e) {
    var hx = cl(e, '[data-p8~="color"] [data-hex]');
    if (!hx) return;
    var p = colParse(hx.value);
    if (p) colSet(hx.closest('[data-p8~="color"]'), p[0], p[1], p[2], true);
  }, ${SIG});
  root.addEventListener('change', function (e) {
    var hx = cl(e, '[data-p8~="color"] [data-hex]');
    if (hx) { var c = hx.closest('[data-p8~="color"]'); var a = colGet(c); hx.value = colHex(a[0], a[1], a[2]); }
  }, ${SIG});`,

  split: `
  root.addEventListener('click', function (e) {
    var s = cl(e, '[data-p8~="split"]');
    if (!s) return;
    var main = cl(e, '[data-p8~="split"] [data-main]'), item = cl(e, '[data-p8~="split"] [role="menuitem"]');
    if (main && !main.disabled) main.dispatchEvent(new CustomEvent('p8-action', { bubbles: true, detail: { action: main.textContent.trim() } }));
    else if (item) item.dispatchEvent(new CustomEvent('p8-action', { bubbles: true, detail: { action: (item.firstChild ? item.firstChild.textContent : item.textContent).trim() } }));
  }, ${SIG});`,

  taginput: `
  function tiEl(t, sel) { return t.querySelector(sel); }
  function tiTags(t) { return Array.from(t.querySelectorAll('[data-chips] [data-chip]')).map(function (c) { return c.getAttribute('data-chip'); }); }
  function tiSync(t) {
    var tags = tiTags(t), max = Number(t.getAttribute('data-max')) || 10, entry = tiEl(t, '[data-entry]');
    tiEl(t, '[data-value]').value = tags.join(',');
    tiEl(t, '[data-count]').textContent = tags.length + ' / ' + max;
    entry.placeholder = tags.length >= max ? 'Limit reached' : (t.getAttribute('data-placeholder') || '');
    t.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { tags: tags } }));
  }
  function tiAdd(t, raw) {
    var label = raw.replace(/,/g, '').trim(), max = Number(t.getAttribute('data-max')) || 10, tags = tiTags(t);
    if (!label || tags.length >= max || tags.some(function (x) { return x.toLowerCase() === label.toLowerCase(); })) return false;
    var tpl = tiEl(t, 'template[data-chip-template]');
    var src = (tpl.content && tpl.content.firstElementChild) || tpl.firstElementChild;
    var chip = src.cloneNode(true);
    chip.setAttribute('data-chip', label); chip.firstChild.textContent = label;
    chip.querySelector('[data-close]').setAttribute('aria-label', 'Remove ' + label);
    tiEl(t, '[data-chips]').appendChild(chip);
    return true;
  }
  root.addEventListener('keydown', function (e) {
    var en = cl(e, '[data-p8~="taginput"] [data-entry]');
    if (!en) return;
    var t = en.closest('[data-p8~="taginput"]');
    if ((e.key === 'Enter' || e.key === ',') && !e.isComposing) { e.preventDefault(); if (tiAdd(t, en.value)) { en.value = ''; tiSync(t); } else if (!en.value.trim()) return; else en.value = ''; }
    else if (e.key === 'Backspace' && !en.value) { var chips = t.querySelectorAll('[data-chips] [data-chip]'); if (chips.length) { chips[chips.length - 1].remove(); tiSync(t); } }
  }, ${SIG});
  root.addEventListener('paste', function (e) {
    var en = cl(e, '[data-p8~="taginput"] [data-entry]');
    if (!en) return;
    var text = (e.clipboardData && e.clipboardData.getData('text')) || '';
    if (text.indexOf(',') < 0 && text.indexOf('\\n') < 0) return;
    e.preventDefault();
    var t = en.closest('[data-p8~="taginput"]'), any = false;
    text.split(/[,\\n]/).forEach(function (x) { if (tiAdd(t, x)) any = true; });
    if (any) tiSync(t);
  }, ${SIG});
  root.addEventListener('focusout', function (e) {
    var en = cl(e, '[data-p8~="taginput"] [data-entry]');
    if (en && en.value.trim()) { var t = en.closest('[data-p8~="taginput"]'); if (tiAdd(t, en.value)) { en.value = ''; tiSync(t); } }
  }, ${SIG});
  root.addEventListener('click', function (e) {
    var t = cl(e, '[data-p8~="taginput"]');
    if (!t) return;
    var close = cl(e, '[data-p8~="taginput"] [data-chip] [data-close]');
    if (close) { close.closest('[data-chip]').remove(); tiSync(t); tiEl(t, '[data-entry]').focus(); return; }
    if (cl(e, '[data-p8~="taginput"] [data-chips]') === null) { var en = tiEl(t, '[data-entry]'); if (!en.disabled) en.focus(); }
  }, ${SIG});`,

  infinite: `
  function infRows(c) { return c.querySelectorAll('[data-list] [data-item]').length; }
  function infStatus(c, more) {
    var n = infRows(c), total = Number(c.getAttribute('data-total')), demo = c.getAttribute('data-demo') === 'true';
    c.querySelector('[data-status]').textContent = demo ? 'Showing ' + n + ' of ' + total : 'Showing ' + n;
    c.querySelector('[data-foot]').hidden = !more;
    c.querySelector('[data-end]').hidden = more;
  }
  function infAppend(c, items, more) {
    var tpl = c.querySelector('template[data-item-template]'), src = (tpl.content && tpl.content.firstElementChild) || tpl.firstElementChild, list = c.querySelector('[data-list]');
    items.forEach(function (it) { var li = src.cloneNode(true), sp = li.querySelectorAll('span'); sp[0].textContent = it.title; sp[1].textContent = it.meta || ''; list.appendChild(li); });
    c.__loading = false; c.removeAttribute('aria-busy');
    infStatus(c, more);
  }
  function infLoad(c) {
    if (c.__loading) return;
    var foot = c.querySelector('[data-foot]');
    if (foot.hidden) return;
    c.__loading = true; c.setAttribute('aria-busy', 'true');
    var page = Number(c.getAttribute('data-page')) + 1;
    c.setAttribute('data-page', String(page));
    var ev = new CustomEvent('p8-load-more', { bubbles: true, cancelable: true, detail: { page: page, append: function (items, more) { infAppend(c, items, more); } } });
    var handled = !c.dispatchEvent(ev);
    if (handled || c.getAttribute('data-demo') !== 'true') return;
    var size = Number(c.getAttribute('data-size')) || 10, total = Number(c.getAttribute('data-total')), have = infRows(c), items = [];
    for (var i = have; i < Math.min(total, have + size); i++) items.push({ title: 'Item ' + (i + 1), meta: 'Page ' + page });
    infAppend(c, items, have + items.length < total);
  }
  root.addEventListener('scroll', function (e) {
    var s = e.target;
    if (!s.matches || !s.matches('[data-scroller]')) return;
    if (s.scrollTop + s.clientHeight >= s.scrollHeight - 32) infLoad(s.closest('[data-p8~="infinite"]'));
  }, { signal: ac.signal, capture: true });
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="infinite"] [data-more]');
    if (b) infLoad(b.closest('[data-p8~="infinite"]'));
  }, ${SIG});`,

  monthcal: `
  var mcLong = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
  var mcMonth = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  function mcEvents(c) { try { return JSON.parse(c.getAttribute('data-events') || '{}'); } catch (err) { return {}; } }
  function mcCount(k) { return k ? k + ' event' + (k === 1 ? '' : 's') : 'No events'; }
  function mcIso(d) { return d.toISOString().slice(0, 10); }
  function mcYM(c) { var p = c.getAttribute('data-month').split('-'); return [Number(p[0]), Number(p[1]) - 1]; }
  function mcMk(c, i, text) { var tpl = c.querySelector('template[data-parts]'), kids = (tpl.content && tpl.content.children.length ? tpl.content : tpl).children; var s = kids[i].cloneNode(true); s.textContent = text; return s; }
  function mcPaint(c, focusIso) {
    var ym = mcYM(c), ws = Number(c.getAttribute('data-week')), ev = mcEvents(c), sel = c.getAttribute('data-selected'), today = mcIso(new Date());
    var off = (new Date(Date.UTC(ym[0], ym[1], 1)).getUTCDay() - ws + 7) % 7;
    var cells = Array.from(c.querySelectorAll('[data-grid] [data-date]'));
    var firstIn = null;
    cells.forEach(function (b, i) {
      var d = new Date(Date.UTC(ym[0], ym[1], 1 - off + i)), iso = mcIso(d), out = d.getUTCMonth() !== ym[1], list = ev[iso] || [];
      if (!out && !firstIn) firstIn = iso;
      b.classList.toggle('p8-mcal__cell--out', out); b.classList.toggle('p8-mcal__cell--on', iso === sel);
      b.setAttribute('data-date', iso); b.setAttribute('aria-pressed', String(iso === sel));
      b.setAttribute('aria-label', mcLong.format(d) + ', ' + mcCount(list.length).toLowerCase());
      b.textContent = '';
      var num = mcMk(c, 0, String(d.getUTCDate())); if (iso === today) num.setAttribute('data-today', ''); b.appendChild(num);
      list.slice(0, list.length > 2 ? 1 : 2).forEach(function (t) { b.appendChild(mcMk(c, 1, t)); });
      if (list.length > 2) b.appendChild(mcMk(c, 2, '+' + (list.length - 1) + ' more'));
    });
    var target = focusIso && cells.some(function (b) { return b.getAttribute('data-date') === focusIso; }) ? focusIso : (cells.some(function (b) { return b.getAttribute('data-date') === sel; }) ? sel : firstIn);
    cells.forEach(function (b) { b.tabIndex = b.getAttribute('data-date') === target ? 0 : -1; });
    c.querySelector('[data-label]').textContent = mcMonth.format(new Date(Date.UTC(ym[0], ym[1], 1)));
    var list2 = sel ? (ev[sel] || []) : [];
    c.querySelector('[data-agenda-head]').textContent = sel ? mcLong.format(new Date(sel + 'T00:00:00Z')) + ' · ' + mcCount(list2.length) : 'Select a day to see its events';
    var ul = c.querySelector('[data-agenda]'); ul.textContent = '';
    list2.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    return target;
  }
  function mcGoto(c, iso, focus) {
    c.setAttribute('data-month', iso.slice(0, 7));
    mcPaint(c, iso);
    if (focus) { var b = c.querySelector('[data-grid] [data-date="' + iso + '"]'); if (b) b.focus(); }
  }
  function mcSelect(c, iso) {
    c.setAttribute('data-selected', iso);
    mcPaint(c, iso);
    c.dispatchEvent(new CustomEvent('p8-select', { bubbles: true, detail: { date: iso, events: mcEvents(c)[iso] || [] } }));
  }
  function mcShift(c, months, keepDay) {
    var ym = mcYM(c), cur = c.querySelector('[data-grid] [tabindex="0"]'), day = cur ? Number(cur.getAttribute('data-date').slice(8)) : 1;
    var d = new Date(Date.UTC(ym[0], ym[1] + months, 1)), last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    return mcIso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), keepDay ? Math.min(day, last) : 1)));
  }
  root.addEventListener('click', function (e) {
    var c = cl(e, '[data-p8~="monthcal"]');
    if (!c) return;
    var dir = cl(e, '[data-p8~="monthcal"] [data-dir]'), day = cl(e, '[data-p8~="monthcal"] [data-date]'), td = cl(e, '[data-p8~="monthcal"] [data-today-btn]');
    if (dir) mcGoto(c, mcShift(c, Number(dir.getAttribute('data-dir')), true), false);
    else if (td) { var iso = mcIso(new Date()); mcGoto(c, iso, false); mcSelect(c, iso); var b = c.querySelector('[data-grid] [data-date="' + iso + '"]'); if (b) b.focus(); }
    else if (day) mcSelect(c, day.getAttribute('data-date'));
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var day = cl(e, '[data-p8~="monthcal"] [data-date]');
    if (!day) return;
    var c = day.closest('[data-p8~="monthcal"]'), iso = day.getAttribute('data-date'), d = new Date(iso + 'T00:00:00Z'), ws = Number(c.getAttribute('data-week')), k = e.key, n = null;
    var dow = (d.getUTCDay() - ws + 7) % 7;
    if (k === 'ArrowRight') n = 1; else if (k === 'ArrowLeft') n = -1; else if (k === 'ArrowDown') n = 7; else if (k === 'ArrowUp') n = -7;
    else if (k === 'Home') n = -dow; else if (k === 'End') n = 6 - dow;
    else if (k === 'PageDown' || k === 'PageUp') { e.preventDefault(); var ym = mcYM(c); var m = k === 'PageDown' ? 1 : -1; var t = new Date(Date.UTC(ym[0], ym[1] + m, Math.min(d.getUTCDate(), new Date(Date.UTC(ym[0], ym[1] + m + 1, 0)).getUTCDate()))); mcGoto(c, mcIso(t), true); return; }
    else return;
    e.preventDefault();
    mcGoto(c, mcIso(new Date(d.getTime() + n * 86400000)), true);
  }, ${SIG});`,

  chart: `
  var chColors = ['color-ink', 'color-ink-muted', 'color-placeholder'];
  function chData(c) { try { return JSON.parse(c.getAttribute('data-chart')); } catch (err) { return { labels: [], series: [] }; } }
  function chOff(c, i) { var g = c.querySelector('[data-series="' + i + '"]'); return !!(g && g.hasAttribute('data-off')); }
  function chShow(c, idx) {
    var d = chData(c), n = d.labels.length, band = c.querySelector('[data-band]'), tip = c.querySelector('[data-tip]'), live = c.querySelector('[data-live]');
    if (idx === null || idx < 0 || idx >= n) { band.removeAttribute('data-show'); tip.hidden = true; return; }
    c.__idx = idx;
    band.setAttribute('x', String(idx * 100)); band.setAttribute('data-show', '');
    tip.textContent = '';
    var h = document.createElement('strong'); h.textContent = d.labels[idx]; tip.appendChild(h);
    var spoken = [];
    d.series.forEach(function (s, i) {
      if (chOff(c, i)) return;
      var tpl = c.querySelector('template[data-row]'), row = ((tpl.content && tpl.content.firstElementChild) || tpl.firstElementChild).cloneNode(true);
      row.firstElementChild.style.background = 'var(--p8-' + chColors[i] + ')';
      row.lastElementChild.textContent = s.name + ': ' + s.values[idx];
      tip.appendChild(row); spoken.push(s.name + ' ' + s.values[idx]);
    });
    tip.hidden = false;
    var pct = (idx + 0.5) / n * 100;
    tip.style.left = pct + '%'; tip.style.translate = pct > 60 ? '-100% 0' : '0 0';
    live.textContent = d.labels[idx] + ': ' + spoken.join(', ');
  }
  function chIndex(plot, e) { var d = chData(plot.closest('[data-p8~="chart"]')), r = plot.getBoundingClientRect(); return Math.min(d.labels.length - 1, Math.max(0, Math.floor((e.clientX - r.left) / (r.width || 1) * d.labels.length))); }
  root.addEventListener('pointermove', function (e) {
    var plot = cl(e, '[data-p8~="chart"] [data-plot]');
    if (plot) chShow(plot.closest('[data-p8~="chart"]'), chIndex(plot, e));
  }, ${SIG});
  root.addEventListener('pointerleave', function (e) {
    var c = cl(e, '[data-p8~="chart"]');
    if (c && !c.contains(doc.activeElement)) chShow(c, null);
  }, { signal: ac.signal, capture: true });
  root.addEventListener('keydown', function (e) {
    var plot = cl(e, '[data-p8~="chart"] [data-plot]');
    if (!plot) return;
    var c = plot.closest('[data-p8~="chart"]'), n = chData(c).labels.length, i = c.__idx === undefined ? -1 : c.__idx;
    if (e.key === 'ArrowRight') i = Math.min(n - 1, i + 1); else if (e.key === 'ArrowLeft') i = Math.max(0, i < 0 ? 0 : i - 1);
    else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = n - 1;
    else if (e.key === 'Escape') { chShow(c, null); return; } else return;
    e.preventDefault();
    chShow(c, i);
  }, ${SIG});
  root.addEventListener('blur', function (e) { var c = cl(e, '[data-p8~="chart"]'); if (c && e.target.matches && e.target.matches('[data-plot]')) chShow(c, null); }, { signal: ac.signal, capture: true });
  root.addEventListener('click', function (e) {
    var k = cl(e, '[data-p8~="chart"] [data-key]');
    if (!k) return;
    var c = k.closest('[data-p8~="chart"]'), i = k.getAttribute('data-key'), g = c.querySelector('[data-series="' + i + '"]');
    var on = k.getAttribute('aria-pressed') === 'true';
    var visible = c.querySelectorAll('[data-key][aria-pressed="true"]').length;
    if (on && visible <= 1) return;
    k.setAttribute('aria-pressed', String(!on));
    if (on) g.setAttribute('data-off', ''); else g.removeAttribute('data-off');
    if (c.__idx !== undefined && !c.querySelector('[data-tip]').hidden) chShow(c, c.__idx);
  }, ${SIG});`,

  composer: `
  function cmpFit(t) { t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 160) + 'px'; }
  function cmpSync(f) {
    var t = f.querySelector('[data-input]'), send = f.querySelector('[data-send]');
    send.disabled = !t.value.trim() || t.disabled || f.getAttribute('data-busy') === 'true';
  }
  function cmpBusy(f, busy) {
    f.setAttribute('data-busy', String(busy));
    f.querySelector('[data-send]').hidden = busy; f.querySelector('[data-stop]').hidden = !busy;
    cmpSync(f);
  }
  function cmpSend(f) {
    var t = f.querySelector('[data-input]'), text = t.value.trim();
    if (!text || f.getAttribute('data-busy') === 'true' || t.disabled) return;
    f.dispatchEvent(new CustomEvent('p8-send', { bubbles: true, detail: { text: text } }));
    t.value = ''; cmpFit(t); cmpSync(f); t.focus();
  }
  root.addEventListener('input', function (e) { var f = cl(e, '[data-p8~="composer"]'); if (f && e.target.hasAttribute('data-input')) { cmpFit(e.target); cmpSync(f); } }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var f = cl(e, '[data-p8~="composer"]');
    if (!f || !e.target.hasAttribute('data-input')) return;
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); cmpSend(f); }
  }, ${SIG});
  root.addEventListener('submit', function (e) { var f = cl(e, '[data-p8~="composer"]'); if (f) { e.preventDefault(); cmpSend(f); } }, ${SIG});
  root.addEventListener('click', function (e) {
    var f = cl(e, '[data-p8~="composer"]');
    if (!f) return;
    if (cl(e, '[data-p8~="composer"] [data-stop]')) f.dispatchEvent(new CustomEvent('p8-stop', { bubbles: true }));
    else if (cl(e, '[data-p8~="composer"] [data-attach]')) f.querySelector('[data-file]').click();
  }, ${SIG});
  root.addEventListener('change', function (e) {
    var f = cl(e, '[data-p8~="composer"]');
    if (!f || !e.target.hasAttribute('data-file')) return;
    var files = Array.from(e.target.files || []);
    f.querySelector('[data-files]').textContent = files.length ? files.length + (files.length === 1 ? ' file' : ' files') : '';
    f.dispatchEvent(new CustomEvent('p8-attach', { bubbles: true, detail: { files: files } }));
  }, ${SIG});
  all('[data-p8~="composer"]').forEach(function (f) {
    var t = f.querySelector('[data-input]');
    if (t.value) cmpFit(t);
    cmpSync(f);
    f.addEventListener('p8-busy', function (e) { cmpBusy(f, !!(e.detail && e.detail.busy)); }, ${SIG});
  });`,

  form: `
  var frmEmail = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  function frmValue(el) { return el.getAttribute('role') === 'checkbox' ? el.getAttribute('aria-checked') === 'true' : el.value; }
  function frmCheck(el) {
    var label = el.getAttribute('data-field') || 'This field', v = frmValue(el), type = el.getAttribute('type'), min = Number(el.getAttribute('data-min')) || 0;
    var empty = v === false || (typeof v === 'string' && !v.trim());
    if (el.hasAttribute('required') && empty) return el.getAttribute('role') === 'checkbox' ? 'You must accept: ' + label : label + ' is required';
    if (empty) return '';
    if (type === 'email' && !frmEmail.test(v)) return 'Enter a valid email address';
    if (type === 'url') { try { new URL(v); } catch (err) { return 'Enter a full URL, like https://example.com'; } }
    if (type === 'number' && isNaN(Number(v))) return 'Enter a number';
    if (type === 'tel' && !/^[+\\d][\\d\\s().-]{5,}$/.test(v)) return 'Enter a valid phone number';
    if (min && typeof v === 'string' && v.length < min) return label + ' must be at least ' + min + ' characters';
    return '';
  }
  function frmShow(el, msg) {
    var err = el.id ? el.closest('form').querySelector('#' + el.id + '-error') : null;
    if (err) err.textContent = msg;
    if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
  }
  function frmFields(f) { return Array.from(f.querySelectorAll('[data-field]')); }
  function frmStatus(f, msg) { f.querySelector('[data-status]').textContent = msg; }
  root.addEventListener('submit', function (e) {
    var f = cl(e, '[data-p8~="form"]');
    if (!f) return;
    e.preventDefault();
    f.__tried = true;
    var bad = frmFields(f).filter(function (el) { var m = frmCheck(el); frmShow(el, m); return !!m; });
    if (bad.length) { frmStatus(f, bad.length + (bad.length === 1 ? ' field needs' : ' fields need') + ' attention'); bad[0].focus(); return; }
    var values = {};
    frmFields(f).forEach(function (el) { values[el.getAttribute('name') || el.id] = frmValue(el); });
    var btn = f.querySelector('[data-submit]');
    function done(r) {
      r = r || { ok: true };
      btn.disabled = false; btn.removeAttribute('aria-busy');
      if (r.errors) {
        var first = null;
        Object.keys(r.errors).forEach(function (k) { var el = f.querySelector('[name="' + k + '"]'); if (el) { frmShow(el, r.errors[k]); first = first || el; } });
        frmStatus(f, 'Could not save: fix the highlighted fields');
        if (first) first.focus();
      } else if (r.ok !== false) frmStatus(f, r.message || f.getAttribute('data-success') || 'Saved.');
      else frmStatus(f, r.message || 'Could not save.');
    }
    var ev = new CustomEvent('p8-submit', { bubbles: true, cancelable: true, detail: { values: values, done: done } });
    var handled = !f.dispatchEvent(ev);
    if (handled) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); frmStatus(f, 'Saving…'); } else done({ ok: true });
  }, ${SIG});
  function frmLive(e) {
    var f = cl(e, '[data-p8~="form"]');
    if (!f || !f.__tried || !e.target.hasAttribute || !e.target.hasAttribute('data-field')) return;
    frmShow(e.target, frmCheck(e.target));
  }
  root.addEventListener('input', frmLive, ${SIG});
  root.addEventListener('change', frmLive, ${SIG});
  root.addEventListener('click', function (e) { var cb = cl(e, '[data-p8~="form"] [role="checkbox"][data-field]'); if (cb) setTimeout(function () { frmLive({ target: cb }); }, 0); }, ${SIG});`,

  nav: `
  root.addEventListener('click', function (e) {
    var a = cl(e, '[data-p8~="nav"] [data-nav]');
    if (!a) return;
    e.preventDefault();
    var host = a.parentNode;
    Array.from(host.querySelectorAll('[data-nav]')).forEach(function (x) {
      var on = x === a;
      if (on) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current');
      ['p8-navbar__link', 'p8-shell__item'].forEach(function (b) { if (x.classList.contains(b)) x.classList.toggle(b + '--active', on); });
    });
    var label = a.lastElementChild && a.querySelector('svg') ? a.lastElementChild.textContent : a.textContent;
    a.dispatchEvent(new CustomEvent('p8-navigate', { bubbles: true, detail: { label: label.trim(), href: a.getAttribute('href') } }));
  }, ${SIG});`,

  mention: `
  function mnOpts(m) { return Array.from(m.querySelectorAll('[role="option"]')); }
  function mnVis(m) { return mnOpts(m).filter(function (x) { return !x.hidden; }); }
  function mnTA(m) { return m.querySelector('[data-input]'); }
  function mnToken(m) {
    var ta = mnTA(m), t = m.getAttribute('data-trigger'), caret = ta.selectionStart, before = ta.value.slice(0, caret), i = before.lastIndexOf(t);
    if (i < 0 || (i > 0 && !/\\s/.test(before.charAt(i - 1)))) return null;
    var q = before.slice(i + 1);
    if (/\\n/.test(q) || q.length > 30 || /\\s\\s/.test(q)) return null;
    return { start: i, query: q, end: caret };
  }
  function mnClose(m) { m.querySelector('[data-list]').hidden = true; var ta = mnTA(m); ta.setAttribute('aria-expanded', 'false'); ta.removeAttribute('aria-activedescendant'); }
  function mnMark(m, it) {
    mnOpts(m).forEach(function (x) { setOn(x, x === it); });
    var ta = mnTA(m); if (it) ta.setAttribute('aria-activedescendant', it.id); else ta.removeAttribute('aria-activedescendant');
    if (it && it.scrollIntoView) it.scrollIntoView({ block: 'nearest' });
  }
  function mnUpdate(m) {
    var tok = mnToken(m);
    if (!tok) { mnClose(m); return; }
    var q = tok.query.toLowerCase();
    mnOpts(m).forEach(function (x) { x.hidden = x.getAttribute('data-value').toLowerCase().indexOf(q) < 0; });
    var vis = mnVis(m);
    if (!vis.length) { mnClose(m); return; }
    m.querySelector('[data-list]').hidden = false; mnTA(m).setAttribute('aria-expanded', 'true');
    mnMark(m, vis[0]);
    m.querySelector('[data-live]').textContent = vis.length + (vis.length === 1 ? ' suggestion' : ' suggestions');
  }
  function mnInsert(m, it) {
    var tok = mnToken(m); if (!tok) return;
    var ta = mnTA(m), t = m.getAttribute('data-trigger'), name = it.getAttribute('data-value');
    ta.value = ta.value.slice(0, tok.start) + t + name + ' ' + ta.value.slice(tok.end);
    var pos = tok.start + t.length + name.length + 1;
    ta.setSelectionRange(pos, pos);
    mnClose(m);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    m.dispatchEvent(new CustomEvent('p8-mention', { bubbles: true, detail: { name: name, trigger: t } }));
    m.querySelector('[data-live]').textContent = name + ' mentioned';
    ta.focus();
  }
  root.addEventListener('input', function (e) { var m = cl(e, '[data-p8~="mention"]'); if (m && e.target.hasAttribute('data-input')) mnUpdate(m); }, ${SIG});
  root.addEventListener('keyup', function (e) { var m = cl(e, '[data-p8~="mention"]'); if (m && e.target.hasAttribute('data-input') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(e.key) >= 0) mnUpdate(m); }, ${SIG});
  root.addEventListener('click', function (e) {
    var it = cl(e, '[data-p8~="mention"] [role="option"]');
    if (it) { mnInsert(it.closest('[data-p8~="mention"]'), it); return; }
    var m = cl(e, '[data-p8~="mention"]');
    if (m && e.target.hasAttribute('data-input')) mnUpdate(m);
  }, ${SIG});
  root.addEventListener('mousedown', function (e) { if (cl(e, '[data-p8~="mention"] [role="option"]')) e.preventDefault(); }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var m = cl(e, '[data-p8~="mention"]');
    if (!m || !e.target.hasAttribute('data-input') || m.querySelector('[data-list]').hidden) return;
    var vis = mnVis(m), cur = vis.findIndex(function (x) { return x.classList.contains('p8-mention__option--active'); });
    if (e.key === 'ArrowDown') cur = (cur + 1) % vis.length;
    else if (e.key === 'ArrowUp') cur = (cur - 1 + vis.length) % vis.length;
    else if (e.key === 'Enter' || e.key === 'Tab') { if (vis[cur]) { e.preventDefault(); mnInsert(m, vis[cur]); } return; }
    else if (e.key === 'Escape') { e.preventDefault(); mnClose(m); return; }
    else return;
    e.preventDefault();
    mnMark(m, vis[cur]);
  }, ${SIG});
  root.addEventListener('focusout', function (e) { var m = cl(e, '[data-p8~="mention"]'); if (m && e.target.hasAttribute('data-input')) setTimeout(function () { if (!m.contains(doc.activeElement)) mnClose(m); }, 0); }, ${SIG});`,

  richtext: `
  function rtEd(r) { return r.querySelector('[data-editor]'); }
  function rtBtns(r) { return Array.from(r.querySelectorAll('[data-cmd]')); }
  function rtSel() { var w = doc.defaultView || window; return w.getSelection ? w.getSelection() : null; }
  function rtInside(r) { var s = rtSel(); return !!(s && s.rangeCount && s.anchorNode && rtEd(r).contains(s.anchorNode)); }
  function rtQ(c) { try { return typeof doc.queryCommandState === 'function' && doc.queryCommandState(c); } catch (err) { return false; } }
  function rtBlock() { try { return typeof doc.queryCommandValue === 'function' ? String(doc.queryCommandValue('formatBlock')).toLowerCase().replace(/[<>]/g, '') : ''; } catch (err) { return ''; } }
  function rtAnchor(r) { var s = rtSel(), n = s && s.anchorNode; while (n && n !== rtEd(r)) { if (n.nodeName === 'A') return n; n = n.parentNode; } return null; }
  function rtState(r) {
    if (!rtInside(r)) return;
    var b = rtBlock();
    var on = { bold: rtQ('bold'), italic: rtQ('italic'), underline: rtQ('underline'), ul: rtQ('insertUnorderedList'), ol: rtQ('insertOrderedList'), h2: b === 'h2', quote: b === 'blockquote', link: !!rtAnchor(r) };
    rtBtns(r).forEach(function (x) { var c = x.getAttribute('data-cmd'); if (c in on) { x.setAttribute('aria-pressed', String(on[c])); x.classList.toggle('p8-rich__btn--on', on[c]); } });
  }
  function rtChange(r) { var ed = rtEd(r); r.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { html: ed.innerHTML, text: ed.innerText || ed.textContent } })); }
  function rtRestore(r) { var s = rtSel(); if (r.__range && s && !rtInside(r)) { s.removeAllRanges(); s.addRange(r.__range); } }
  function rtEx(c, v) { return typeof doc.execCommand === 'function' ? doc.execCommand(c, false, v) : false; }
  function rtLinkOpen(r) {
    var s = rtSel(); if (s && rtInside(r)) r.__range = s.getRangeAt(0).cloneRange();
    var bar = r.querySelector('[data-linkbar]'), url = r.querySelector('[data-url]'), a = rtAnchor(r);
    bar.hidden = false; r.querySelector('[data-linkerr]').hidden = true; url.removeAttribute('aria-invalid'); url.value = a ? a.getAttribute('href') : '';
    url.focus();
  }
  function rtLinkClose(r) { r.querySelector('[data-linkbar]').hidden = true; r.querySelector('[data-linkerr]').hidden = true; rtEd(r).focus(); rtRestore(r); }
  function rtLinkApply(r) {
    var url = r.querySelector('[data-url]'), v = url.value.trim(), err = r.querySelector('[data-linkerr]');
    if (!/^(https?:\\/\\/|mailto:|\\/|#)/i.test(v)) { err.textContent = 'Enter an address that starts with https://, http://, mailto:, / or #.'; err.hidden = false; url.setAttribute('aria-invalid', 'true'); url.focus(); return; }
    err.hidden = true; url.removeAttribute('aria-invalid');
    rtEd(r).focus(); rtRestore(r);
    rtEx('createLink', v);
    Array.from(rtEd(r).querySelectorAll('a[href]')).forEach(function (a) { if (/^https?:/i.test(a.getAttribute('href'))) a.setAttribute('rel', 'noopener noreferrer'); });
    r.querySelector('[data-linkbar]').hidden = true;
    rtState(r); rtChange(r);
  }
  function rtRun(r, cmd) {
    var ed = rtEd(r);
    if (cmd === 'link') { rtLinkOpen(r); return; }
    ed.focus(); rtRestore(r);
    if (cmd === 'bold' || cmd === 'italic' || cmd === 'underline' || cmd === 'undo' || cmd === 'redo') rtEx(cmd);
    else if (cmd === 'h2') rtEx('formatBlock', rtBlock() === 'h2' ? 'p' : 'h2');
    else if (cmd === 'quote') rtEx('formatBlock', rtBlock() === 'blockquote' ? 'p' : 'blockquote');
    else if (cmd === 'ul') rtEx('insertUnorderedList');
    else if (cmd === 'ol') rtEx('insertOrderedList');
    rtState(r); rtChange(r);
    var b = r.querySelector('[data-cmd="' + cmd + '"]'); if (b) r.querySelector('[data-live]').textContent = b.getAttribute('aria-label') + (b.getAttribute('aria-pressed') === 'true' ? ' on' : ' off');
  }
  root.addEventListener('mousedown', function (e) { if (cl(e, '[data-p8~="richtext"] [data-cmd]')) e.preventDefault(); }, ${SIG});
  root.addEventListener('click', function (e) {
    var r = cl(e, '[data-p8~="richtext"]');
    if (!r) return;
    var b = cl(e, '[data-p8~="richtext"] [data-cmd]');
    if (b && !b.disabled) { rtRun(r, b.getAttribute('data-cmd')); return; }
    if (cl(e, '[data-p8~="richtext"] [data-link-apply]')) rtLinkApply(r);
    else if (cl(e, '[data-p8~="richtext"] [data-link-cancel]')) rtLinkClose(r);
  }, ${SIG});
  root.addEventListener('input', function (e) { var r = cl(e, '[data-p8~="richtext"]'); if (r && e.target.hasAttribute('data-editor')) rtChange(r); }, ${SIG});
  root.addEventListener('paste', function (e) {
    var r = cl(e, '[data-p8~="richtext"]');
    if (!r || !e.target.hasAttribute || !e.target.hasAttribute('data-editor')) return;
    e.preventDefault();
    var t = (e.clipboardData && e.clipboardData.getData('text/plain')) || '';
    if (t) { rtEx('insertText', t); rtChange(r); }
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var r = cl(e, '[data-p8~="richtext"]');
    if (!r) return;
    var t = e.target;
    if (t.hasAttribute && t.hasAttribute('data-editor') && (e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); rtLinkOpen(r); return; }
    if (t.hasAttribute && t.hasAttribute('data-url')) {
      if (e.key === 'Enter') { e.preventDefault(); rtLinkApply(r); } else if (e.key === 'Escape') { e.preventDefault(); rtLinkClose(r); }
      return;
    }
    var btns = rtBtns(r).filter(function (x) { return !x.disabled; }), i = btns.indexOf(t);
    if (i < 0) return;
    if (e.key === 'ArrowRight') i = (i + 1) % btns.length; else if (e.key === 'ArrowLeft') i = (i - 1 + btns.length) % btns.length;
    else if (e.key === 'Home') i = 0; else if (e.key === 'End') i = btns.length - 1; else return;
    e.preventDefault();
    btns.forEach(function (x) { x.tabIndex = -1; }); btns[i].tabIndex = 0; btns[i].focus();
  }, ${SIG});
  doc.addEventListener('selectionchange', function () { all('[data-p8~="richtext"]').forEach(rtState); }, ${SIG});`,

  mediatl: `
  var mtSteps = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
  function mtR(el) { return el.closest('[data-p8~="mediatl"]'); }
  function mtN(r, a, d) { var v = Number(r.getAttribute(a)); return isNaN(v) || !v ? d : v; }
  function mtFps(r) { return mtN(r, 'data-fps', 30); }
  function mtPPS(r) { return mtN(r, 'data-pps', 24); }
  function mtDur(r) { return mtN(r, 'data-duration', 30); }
  function mtTime(r) { return Number(r.getAttribute('data-time')) || 0; }
  function mtFrame(r, t) { var f = mtFps(r); return Math.round(t * f) / f; }
  function mtPad(n) { return (n < 10 ? '0' : '') + n; }
  function mtTC(r, t) { var fps = mtFps(r), f = Math.round(t * fps), s = Math.floor(f / fps); return mtPad(Math.floor(s / 3600)) + ':' + mtPad(Math.floor(s % 3600 / 60)) + ':' + mtPad(s % 60) + ':' + mtPad(f % fps); }
  function mtShort(t) { return Math.floor(t / 60) + ':' + mtPad(Math.round(t % 60)); }
  function mtPx(secs) { return 'calc(var(--p8-pps) * ' + secs + 'px)'; }
  function mtClips(r) { return Array.from(r.querySelectorAll('[data-clip]')); }
  function mtLanes(r) { return Array.from(r.querySelectorAll('[data-lane]')); }
  function mtStart(c) { return Number(c.getAttribute('data-start')); }
  function mtLen(c) { return Number(c.getAttribute('data-dur')); }
  function mtName(c) { return c.querySelector('[data-name]').textContent; }
  function mtSay(r, msg) { r.querySelector('[data-live]').textContent = msg; }
  function mtLabel(r, c) { c.setAttribute('aria-label', mtName(c) + ', ' + c.parentNode.getAttribute('data-track') + ', starts at ' + mtTC(r, mtStart(c)) + ', ' + (Math.round(mtLen(c) * 100) / 100) + ' seconds'); }
  function mtPlace(r, c) { c.style.left = mtPx(mtStart(c)); c.style.width = mtPx(mtLen(c)); mtLabel(r, c); }
  function mtInfo(c) { return { track: c.parentNode.getAttribute('data-track'), name: mtName(c), start: mtStart(c), duration: mtLen(c) }; }
  function mtChange(r) { r.dispatchEvent(new CustomEvent('p8-change', { bubbles: true, detail: { clips: mtClips(r).map(mtInfo) } })); }
  function mtReveal(r, t) { var sc = r.querySelector('[data-scroll]'), x = t * mtPPS(r); if (sc.clientWidth && (x < sc.scrollLeft || x > sc.scrollLeft + sc.clientWidth - 8)) sc.scrollLeft = Math.max(0, x - sc.clientWidth / 2); }
  function mtSeek(r, t, opt) {
    opt = opt || {};
    t = Math.max(0, Math.min(mtDur(r), mtFrame(r, t)));
    r.setAttribute('data-time', String(t));
    r.querySelector('[data-playhead]').style.left = mtPx(t);
    var ru = r.querySelector('[data-ruler]'), tc = mtTC(r, t);
    ru.setAttribute('aria-valuenow', String(Math.round(t * 100) / 100)); ru.setAttribute('aria-valuetext', tc);
    var out = r.querySelector('[data-timecode]'); if (out) out.textContent = tc;
    if (opt.say) mtSay(r, tc);
    if (opt.reveal) mtReveal(r, t);
    r.dispatchEvent(new CustomEvent('p8-seek', { bubbles: true, detail: { time: t, timecode: tc } }));
    return t;
  }
  function mtRuler(r) {
    var ru = r.querySelector('[data-ruler]'), pps = mtPPS(r), dur = mtDur(r), step = 1200;
    for (var i = 0; i < mtSteps.length; i++) if (mtSteps[i] * pps >= 72) { step = mtSteps[i]; break; }
    Array.from(ru.querySelectorAll('[data-tick]')).forEach(function (x) { x.remove(); });
    var tpl = r.querySelector('template[data-parts]'), src = (tpl.content && tpl.content.firstElementChild) || tpl.firstElementChild;
    for (var t = 0; t <= dur; t += step) { var l = src.cloneNode(true); l.textContent = mtShort(t); l.style.left = mtPx(t); ru.appendChild(l); }
  }
  function mtZoom(r, pps) {
    var old = mtPPS(r), sc = r.querySelector('[data-scroll]'), t = mtTime(r);
    pps = Math.max(4, Math.min(240, Math.round(pps)));
    var screenX = t * old - sc.scrollLeft;
    r.setAttribute('data-pps', String(pps)); r.style.setProperty('--p8-pps', String(pps));
    sc.scrollLeft = Math.max(0, t * pps - screenX);
    mtRuler(r);
    var z = r.querySelector('[data-zoomlabel]'); if (z) z.textContent = (Math.round(pps / 24 * 10) / 10) + '×';
    mtSay(r, 'Zoom ' + (Math.round(pps / 24 * 10) / 10) + '×');
  }
  function mtSnapOn(r) { return r.getAttribute('data-snap') === 'true'; }
  function mtSnap(r, t, skip) {
    if (!mtSnapOn(r)) return t;
    var best = t, bd = 8 / mtPPS(r), pts = [0, mtDur(r), mtTime(r)];
    mtClips(r).forEach(function (c) { if (c !== skip) pts.push(mtStart(c), mtStart(c) + mtLen(c)); });
    pts.forEach(function (p) { var d = Math.abs(p - t); if (d < bd) { bd = d; best = p; } });
    return best;
  }
  function mtFit(r, lane, c, start, len) {
    var d = mtDur(r), others = Array.from(lane.querySelectorAll('[data-clip]')).filter(function (o) { return o !== c; }).sort(function (a, b) { return mtStart(a) - mtStart(b); });
    start = Math.max(0, Math.min(d - len, start));
    var gaps = [], cur = 0;
    others.forEach(function (o) { var s = mtStart(o); if (s - cur >= len - 1e-6) gaps.push([cur, s]); cur = Math.max(cur, s + mtLen(o)); });
    if (d - cur >= len - 1e-6) gaps.push([cur, d]);
    var best = null, bd = Infinity;
    gaps.forEach(function (g) { var st = Math.max(g[0], Math.min(g[1] - len, start)), dist = Math.abs(st - start); if (dist < bd) { bd = dist; best = st; } });
    return best;
  }
  function mtSelect(r, c, focusIt) {
    mtClips(r).forEach(function (x) { var on = x === c; x.classList.toggle('p8-mt__clip--on', on); x.setAttribute('aria-pressed', String(on)); x.tabIndex = on ? 0 : -1; });
    if (!c) { var f = mtClips(r)[0]; if (f) f.tabIndex = 0; }
    r.__sel = c || null;
    if (c && focusIt) c.focus();
    r.dispatchEvent(new CustomEvent('p8-select', { bubbles: true, detail: { clip: c ? mtInfo(c) : null } }));
  }
  function mtSorted(lane) { return Array.from(lane.querySelectorAll('[data-clip]')).sort(function (a, b) { return mtStart(a) - mtStart(b); }); }
  function mtSplit(r) {
    var t = mtTime(r), ft = 1 / mtFps(r), sel = r.__sel;
    function covers(c) { return t - mtStart(c) >= ft - 1e-6 && mtStart(c) + mtLen(c) - t >= ft - 1e-6; }
    var targets = sel && covers(sel) ? [sel] : (sel ? [] : mtClips(r).filter(covers));
    if (!targets.length) { mtSay(r, 'Nothing to split at the playhead'); return; }
    targets.forEach(function (c) {
      var s = mtStart(c), len = mtLen(c), copy = c.cloneNode(true);
      c.setAttribute('data-dur', String(Math.round((t - s) * 1000) / 1000));
      copy.setAttribute('data-start', String(t)); copy.setAttribute('data-dur', String(Math.round((s + len - t) * 1000) / 1000));
      copy.classList.remove('p8-mt__clip--on'); copy.setAttribute('aria-pressed', 'false'); copy.tabIndex = -1;
      c.parentNode.insertBefore(copy, c.nextSibling);
      mtPlace(r, c); mtPlace(r, copy);
    });
    mtSay(r, 'Split at ' + mtTC(r, t)); mtChange(r);
  }
  function mtDelete(r) {
    var c = r.__sel;
    if (!c) { mtSay(r, 'Select a clip first'); return; }
    var list = mtSorted(c.parentNode), i = list.indexOf(c), next = list[i + 1] || list[i - 1] || null, name = mtName(c);
    c.remove(); mtSelect(r, next, true); mtSay(r, name + ' deleted'); mtChange(r);
  }
  function mtTrim(r, c, edge, t) {
    var s = mtStart(c), e = s + mtLen(c), ft = 1 / mtFps(r), sib = mtSorted(c.parentNode).filter(function (o) { return o !== c; });
    if (edge === 'start') {
      var lo = 0; sib.forEach(function (o) { var oe = mtStart(o) + mtLen(o); if (oe <= s + 1e-6 && oe > lo) lo = oe; });
      var ns = Math.max(lo, Math.min(e - ft, t));
      c.setAttribute('data-start', String(Math.round(ns * 1000) / 1000)); c.setAttribute('data-dur', String(Math.round((e - ns) * 1000) / 1000));
    } else {
      var hi = mtDur(r); sib.forEach(function (o) { var os = mtStart(o); if (os >= e - 1e-6 && os < hi) hi = os; });
      var ne = Math.min(hi, Math.max(s + ft, t));
      c.setAttribute('data-dur', String(Math.round((ne - s) * 1000) / 1000));
    }
    mtPlace(r, c);
  }
  function mtMoveTo(r, c, lane, start) {
    var len = mtLen(c), fit = mtFit(r, lane, c, start, len);
    if (fit === null) return false;
    if (c.parentNode !== lane) lane.appendChild(c);
    c.setAttribute('data-start', String(Math.round(fit * 1000) / 1000)); mtPlace(r, c);
    return true;
  }
  function mtPlay(r, on) {
    var btn = r.querySelector('[data-act="play"]');
    if (r.__iv) { clearInterval(r.__iv); r.__iv = null; }
    r.setAttribute('data-playing', String(on));
    if (btn) { btn.setAttribute('aria-pressed', String(on)); btn.setAttribute('aria-label', on ? 'Pause' : 'Play'); Array.from(btn.querySelectorAll('svg')).forEach(function (i, k) { setOn(i, on ? k === 1 : k === 0); }); }
    if (!on) return;
    if (mtTime(r) >= mtDur(r) - 1e-6) mtSeek(r, 0);
    var t0 = mtTime(r), w0 = Date.now();
    r.__iv = setInterval(function () {
      var t = t0 + (Date.now() - w0) / 1000;
      if (t >= mtDur(r)) { mtSeek(r, mtDur(r), { reveal: true }); mtPlay(r, false); mtSay(r, 'End of timeline'); return; }
      mtSeek(r, t, { reveal: true });
    }, 1000 / mtFps(r));
    timers.push(r.__iv);
  }
  function mtX(r, e) { var rect = r.querySelector('[data-canvas]').getBoundingClientRect(); return (e.clientX - rect.left) / mtPPS(r); }
  function mtLaneAt(r, e, cur) {
    var lanes = mtLanes(r), hit = lanes.find(function (l) { var b = l.getBoundingClientRect(); return b.height > 0 && e.clientY >= b.top && e.clientY < b.bottom; });
    return hit || cur;
  }
  var mtDrag = null;
  root.addEventListener('pointerdown', function (e) {
    var r = cl(e, '[data-p8~="mediatl"]');
    if (!r || (e.button !== undefined && e.button !== 0)) return;
    if (cl(e, '[data-p8~="mediatl"] [data-act]')) return;
    var handle = cl(e, '[data-p8~="mediatl"] [data-handle]'), clip = cl(e, '[data-p8~="mediatl"] [data-clip]');
    if (handle && clip) { mtSelect(r, clip, true); mtDrag = { r: r, mode: 'trim-' + handle.getAttribute('data-handle'), c: clip, changed: false }; e.preventDefault(); return; }
    if (clip) { mtSelect(r, clip, true); mtDrag = { r: r, mode: 'move', c: clip, x0: e.clientX, y0: e.clientY, s0: mtStart(clip), moved: false, changed: false }; e.preventDefault(); return; }
    if (cl(e, '[data-p8~="mediatl"] [data-ruler]') || cl(e, '[data-p8~="mediatl"] [data-lane]')) {
      if (!cl(e, '[data-p8~="mediatl"] [data-ruler]')) mtSelect(r, null, false);
      mtDrag = { r: r, mode: 'scrub' };
      if (r.__iv) mtPlay(r, false);
      mtSeek(r, mtSnap(r, mtX(r, e)), { say: true });
      var ru = r.querySelector('[data-ruler]'); if (ru) ru.focus();
      e.preventDefault();
    }
  }, ${SIG});
  doc.addEventListener('pointermove', function (e) {
    if (!mtDrag) return;
    var r = mtDrag.r, d = mtDrag, c = d.c;
    if (d.mode === 'scrub') { mtSeek(r, mtSnap(r, mtX(r, e))); return; }
    if (d.mode === 'move') {
      if (!d.moved && Math.abs(e.clientX - d.x0) < 3 && Math.abs(e.clientY - d.y0) < 6) return;
      d.moved = true;
      var raw = d.s0 + (e.clientX - d.x0) / mtPPS(r), len = mtLen(c), a = mtSnap(r, raw, c), b = mtSnap(r, raw + len, c) - len;
      var start = mtFrame(r, Math.abs(a - raw) <= Math.abs(b - raw) ? a : b);
      var lane = mtLaneAt(r, e, c.parentNode);
      if (mtMoveTo(r, c, lane, start)) d.changed = true;
      return;
    }
    var t = mtSnap(r, mtX(r, e), c);
    mtTrim(r, c, d.mode === 'trim-start' ? 'start' : 'end', mtFrame(r, t)); d.changed = true;
  }, ${SIG});
  doc.addEventListener('pointerup', function () {
    if (!mtDrag) return;
    var d = mtDrag; mtDrag = null;
    if (d.changed) { mtSay(d.r, mtName(d.c) + (d.mode === 'move' ? ' moved to ' + mtTC(d.r, mtStart(d.c)) : ' trimmed')); mtChange(d.r); }
  }, ${SIG});
  root.addEventListener('click', function (e) {
    var r = cl(e, '[data-p8~="mediatl"]');
    if (!r) return;
    var clipEl = cl(e, '[data-p8~="mediatl"] [data-clip]');
    if (clipEl) { if (r.__sel !== clipEl) mtSelect(r, clipEl, false); return; }
    var b = cl(e, '[data-p8~="mediatl"] [data-act]');
    if (!b || b.disabled) return;
    var a = b.getAttribute('data-act');
    if (a === 'play') mtPlay(r, !r.__iv);
    else if (a === 'start') mtSeek(r, 0, { say: true, reveal: true });
    else if (a === 'end') mtSeek(r, mtDur(r), { say: true, reveal: true });
    else if (a === 'split') mtSplit(r);
    else if (a === 'delete') mtDelete(r);
    else if (a === 'snap') { var on = !mtSnapOn(r); r.setAttribute('data-snap', String(on)); b.setAttribute('aria-pressed', String(on)); mtSay(r, 'Snapping ' + (on ? 'on' : 'off')); }
    else if (a === 'zoomin') mtZoom(r, mtPPS(r) * 1.5);
    else if (a === 'zoomout') mtZoom(r, mtPPS(r) / 1.5);
  }, ${SIG});
  root.addEventListener('wheel', function (e) {
    var r = cl(e, '[data-p8~="mediatl"] [data-scroll]') && mtR(e.target);
    if (!r || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    mtZoom(r, mtPPS(r) * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
  }, { signal: ac.signal, passive: false });
  root.addEventListener('keydown', function (e) {
    var r = cl(e, '[data-p8~="mediatl"]');
    if (!r) return;
    var t = e.target, k = e.key, fps = mtFps(r), step = e.shiftKey ? 1 : 1 / fps;
    if (t.hasAttribute && t.hasAttribute('data-ruler')) {
      var now = mtTime(r), to = null;
      if (k === 'ArrowRight') to = now + step; else if (k === 'ArrowLeft') to = now - step;
      else if (k === 'PageUp') to = now + 5; else if (k === 'PageDown') to = now - 5;
      else if (k === 'Home') to = 0; else if (k === 'End') to = mtDur(r);
      else if (k === ' ') { e.preventDefault(); mtPlay(r, !r.__iv); return; }
      if (to === null) return;
      e.preventDefault(); mtSeek(r, to, { say: true, reveal: true }); return;
    }
    if (!(t.hasAttribute && t.hasAttribute('data-clip'))) return;
    var lane = t.parentNode, list = mtSorted(lane), i = list.indexOf(t), lanes = mtLanes(r), li = lanes.indexOf(lane);
    if (k === 's' || k === 'S') { e.preventDefault(); mtSelect(r, t, false); mtSplit(r); return; }
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); mtSelect(r, t, false); mtDelete(r); return; }
    if (k === '[' || k === ']') {
      e.preventDefault(); var pt = mtTime(r), s0 = mtStart(t), e0 = s0 + mtLen(t);
      if (pt <= s0 || pt >= e0) { mtSay(r, 'Move the playhead inside the clip to trim'); return; }
      mtTrim(r, t, k === '[' ? 'start' : 'end', pt); mtSay(r, mtName(t) + ' trimmed'); mtChange(r); return;
    }
    if (e.altKey) {
      var moved = false;
      if (k === 'ArrowLeft') moved = mtMoveTo(r, t, lane, mtStart(t) - step);
      else if (k === 'ArrowRight') moved = mtMoveTo(r, t, lane, mtStart(t) + step);
      else if (k === 'ArrowUp' && lanes[li - 1]) moved = mtMoveTo(r, t, lanes[li - 1], mtStart(t));
      else if (k === 'ArrowDown' && lanes[li + 1]) moved = mtMoveTo(r, t, lanes[li + 1], mtStart(t));
      else return;
      e.preventDefault();
      if (moved) { t.focus(); mtSay(r, mtName(t) + ' moved to ' + mtTC(r, mtStart(t)) + ' on ' + t.parentNode.getAttribute('data-track')); mtChange(r); } else mtSay(r, 'No room there');
      return;
    }
    var target = null;
    if (k === 'ArrowLeft') target = list[i - 1]; else if (k === 'ArrowRight') target = list[i + 1];
    else if (k === 'ArrowUp' || k === 'ArrowDown') {
      var other = lanes[li + (k === 'ArrowUp' ? -1 : 1)];
      if (other) { var s = mtStart(t), cl2 = mtSorted(other); target = cl2.find(function (o) { return mtStart(o) + mtLen(o) > s; }) || cl2[cl2.length - 1]; }
    } else return;
    e.preventDefault();
    if (target) { t.tabIndex = -1; target.tabIndex = 0; target.focus(); }
  }, ${SIG});
  all('[data-p8~="mediatl"]').forEach(function (r) {
    mtClips(r).forEach(function (c) { mtLabel(r, c); });
    if (r.getAttribute('data-playing') === 'true') mtPlay(r, true);
  });`,

  listdetail: `
  function ldSelect(c, row) {
    Array.from(c.querySelectorAll('[data-target]')).forEach(function (x) {
      var on = x === row;
      if (on) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current');
      x.classList.toggle('p8-tpl-master-row--active', on); x.tabIndex = on ? 0 : -1;
    });
    Array.from(c.querySelectorAll('[data-detail]')).forEach(function (d) { d.hidden = d.id !== row.getAttribute('data-target'); });
    c.dispatchEvent(new CustomEvent('p8-select', { bubbles: true, detail: { id: row.getAttribute('data-target'), title: row.firstElementChild.textContent.trim() } }));
  }
  root.addEventListener('click', function (e) {
    var row = cl(e, '[data-p8~="listdetail"] [data-target]');
    if (row) ldSelect(row.closest('[data-p8~="listdetail"]'), row);
  }, ${SIG});
  root.addEventListener('keydown', function (e) {
    var row = cl(e, '[data-p8~="listdetail"] [data-target]');
    if (!row) return;
    var c = row.closest('[data-p8~="listdetail"]'), rows = Array.from(c.querySelectorAll('[data-target]')), i = rows.indexOf(row), k = e.key;
    if (k === 'ArrowDown') i = Math.min(rows.length - 1, i + 1); else if (k === 'ArrowUp') i = Math.max(0, i - 1);
    else if (k === 'Home') i = 0; else if (k === 'End') i = rows.length - 1; else return;
    e.preventDefault();
    rows[i].focus(); ldSelect(c, rows[i]);
  }, ${SIG});`,

  shell: `
  root.addEventListener('click', function (e) {
    var b = cl(e, '[data-p8~="shell"] [data-collapse]');
    if (!b) return;
    var sh = b.closest('[data-p8~="shell"]'), side = sh.querySelector('aside'), on = !side.classList.contains('p8-shell__side--on');
    side.classList.toggle('p8-shell__side--on', on);
    b.setAttribute('aria-expanded', String(!on)); b.setAttribute('aria-label', on ? 'Expand sidebar' : 'Collapse sidebar');
    Array.from(sh.querySelectorAll('[data-nav]')).forEach(function (a) {
      var l = a.lastElementChild;
      if (on && l) a.setAttribute('title', l.textContent.trim()); else a.removeAttribute('title');
    });
    sh.dispatchEvent(new CustomEvent('p8-toggle', { bubbles: true, detail: { collapsed: on } }));
  }, ${SIG});`,
};
