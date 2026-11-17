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
