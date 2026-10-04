(function () {
  const C = window.Curio;
  const games = (window.CURIO_READY || []).slice();
  const tags = window.CURIO_TAGS || {};
  const $ = (id) => document.getElementById(id);
  const store = C.store;
  const html = document.documentElement;
  const body = document.body;
  const now = Date.now();
  const calm = () => C.calm;
  const phone = () => innerWidth <= 640;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = (tag, cls = '', inner = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (inner) e.innerHTML = inner; return e; };
  const px = C.px;
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const bySlug = (s) => games.find((g) => g.slug === s);
  const TAGS = [...new Set([...Object.keys(tags), ...games.map((g) => g.tag)])].filter((t) => games.some((g) => g.tag === t));
  const tagName = (t) => tags[t] || t;
  const ORDER = ['classic', 'gym', 'puzzle', 'brain', 'toy', 'make', 'draw', 'explore', 'life', 'absurd', 'skill', 'arcade', 'versus'];
  TAGS.sort((a, b) => (ORDER.indexOf(a) + 99) % 99 - (ORDER.indexOf(b) + 99) % 99);

  window.ZobleDesktop = { version: 'zobos' };

  let played = store.get('played', {});
  let favs = store.get('hub:favs', {});
  let seen = null;
  function loadSeen() {
    seen = store.get('hub:seen', null);
    if (!seen) { seen = {}; games.forEach((g, i) => { seen[g.slug] = i >= games.length - 12 ? now : 0; }); }
    else games.forEach((g) => { if (!(g.slug in seen)) seen[g.slug] = now; });
    store.set('hub:seen', seen);
  }
  loadSeen();
  const isNew = (g) => !!seen[g.slug] && now - seen[g.slug] < 14 * 864e5;
  const refreshData = () => { played = store.get('played', {}); favs = store.get('hub:favs', {}); };
  const bestOf = (slug) => {
    let out = null;
    try {
      const pre = `curio:best:${slug}:`;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(pre)) continue;
        const v = JSON.parse(localStorage.getItem(k));
        if (typeof v === 'number' && isFinite(v) && (out == null || v > out)) out = v;
      }
    } catch {}
    return out;
  };
  function ago(t) {
    if (!t) return '';
    const s = (Date.now() - t) / 1000;
    if (s < 90) return 'Just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    const d = Math.round(s / 86400);
    return d === 1 ? 'Yesterday' : `${d} days ago`;
  }
  function toggleFav(slug) {
    refreshData();
    const g = bySlug(slug); if (!g) return;
    if (favs[slug]) delete favs[slug]; else favs[slug] = Date.now();
    store.set('hub:favs', favs);
    C.sfx(favs[slug] ? 'pop' : 'unpop');
    C.balloon(favs[slug] ? `${g.title} was added to Favourites.` : `${g.title} was removed from Favourites.`, { ms: 1800 });
    refreshAll();
  }

  const tbEl = $('taskbar');
  const tbH = () => (phone() ? 0 : tbEl.offsetHeight);
  const screenEl = $('screen');
  const room = $('room');
  const desk = $('desktop');
  C.setStage({ mount: screenEl, bounds: () => screenEl.getBoundingClientRect() });
  const layer = $('windows');
  const tasks = $('tasks');

  const H = new Date().getHours(), M = new Date().getMonth(), D = new Date().getDate(), W = new Date().getDay();

  let zTop = 20, wins = [], active = null, cascade = 0, uid = 0;
  const dragging = (on) => desk.classList.toggle('is-dragging', on);

  function deskArea() { return { w: screenEl.clientWidth, h: Math.max(200, screenEl.clientHeight - tbH()) }; }
  function zoom(from, to, done) {
    if (calm() || !from || !to) { done?.(); return; }
    const z = el('div', 'zw-zoom');
    z.setAttribute('aria-hidden', 'true');
    document.body.append(z);
    let i = 0; const N = 7;
    const step = () => {
      i++;
      const t = i / N;
      const x = from.left + (to.left - from.left) * t, y = from.top + (to.top - from.top) * t;
      const w = from.width + (to.width - from.width) * t, h = from.height + (to.height - from.height) * t;
      Object.assign(z.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
      if (i < N) requestAnimationFrame(step); else { z.remove(); done?.(); }
    };
    requestAnimationFrame(step);
  }

  function setRect(w, r) {
    const A = deskArea();
    r.w = Math.max(w.minW, Math.min(r.w, A.w));
    r.h = Math.max(w.minH, Math.min(r.h, A.h));
    r.x = Math.max(-r.w + 80, Math.min(r.x, A.w - 60));
    r.y = Math.max(0, Math.min(r.y, A.h - 22));
    w.rect = r;
    if (w.state === 'normal') Object.assign(w.el.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  }
  function layoutMax(w) {
    const A = deskArea();
    Object.assign(w.el.style, { left: '0px', top: '0px', width: `${A.w}px`, height: `${A.h}px` });
  }

  function openWindow(o) {
    if (o.key) {
      const ex = wins.find((w) => w.key === o.key);
      if (ex) { if (ex.state === 'min') restore(ex); focus(ex); ex.onReopen?.(o); return ex; }
    }
    const w = { id: `w${++uid}`, key: o.key || '', kind: o.kind || 'app', title: o.title, icon: o.icon || px('app', 16), state: 'normal', minW: o.minW || 220, minH: o.minH || 150, resizable: o.resizable !== false, data: o.data || {} };
    const node = el('section', `window zw${o.cls ? ` ${o.cls}` : ''}`);
    node.setAttribute('role', 'dialog');
    node.setAttribute('aria-modal', 'false');
    node.setAttribute('aria-labelledby', `${w.id}t`);
    node.setAttribute('aria-label', o.title);
    node.tabIndex = -1;
    node.innerHTML = `<div class="title-bar"><div class="title-bar-text"><img class="zw-ico" alt="" width="16" height="16"><span id="${w.id}t"></span></div><div class="title-bar-controls">${o.help ? '<button type="button" class="help" aria-label="Help"></button>' : ''}${o.noMin ? '' : '<button type="button" class="minimize" aria-label="Minimize"></button>'}${w.resizable ? '<button type="button" class="maximize" aria-label="Maximize"></button>' : ''}<button type="button" class="close" aria-label="Close"></button></div></div>`;
    w.el = node;
    w.titleEl = node.querySelector(`#${w.id}t`);
    w.iconEl = node.querySelector('.zw-ico');
    w.titleEl.textContent = o.title;
    w.iconEl.src = w.icon;
    if (o.menus) { const mrow = el('div', 'zw-menu'); node.append(mrow); w.menuDefs = o.menus(w); w.mb = C.menubar(mrow, w.menuDefs, { label: `${o.title} menu`, reserve: 0 }); }
    const backB = el('button', 'zw-back');
    backB.type = 'button';
    backB.setAttribute('aria-label', 'Back');
    backB.innerHTML = '<i aria-hidden="true"></i>';
    backB.addEventListener('click', () => closeWin(w));
    backB.addEventListener('pointerdown', (e) => e.stopPropagation());
    node.querySelector('.title-bar').prepend(backB);
    if (w.menuDefs) {
      const moreB = el('button', 'zw-more');
      moreB.type = 'button';
      moreB.setAttribute('aria-label', 'Menu');
      moreB.innerHTML = '<i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i>';
      moreB.addEventListener('click', () => { C.sfx('menu'); C.menu.open(w.menuDefs.map((m) => ({ label: m.label.replace('&', ''), sub: m.items })), { anchor: moreB.getBoundingClientRect(), opener: moreB, label: 'Menu' }); });
      node.querySelector('.title-bar-controls').prepend(moreB);
    }
    w.body = el('div', `zw-body${o.bodyCls ? ` ${o.bodyCls}` : ''}`);
    node.append(w.body);
    if (o.status) { w.statusEl = el('div', 'status-bar'); node.append(w.statusEl); }
    if (w.resizable) {
      ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach((d) => { const h = el('div', `zw-h zw-h--${d}`); h.dataset.dir = d; h.setAttribute('aria-hidden', 'true'); node.append(h); resizer(w, h, d); });
      if (o.status) { const g = el('div', 'zw-grip'); g.setAttribute('aria-hidden', 'true'); w.statusEl.append(g); resizer(w, g, 'se'); }
    }
    w.setTitle = (t) => { w.title = t; w.titleEl.textContent = t; w.task.querySelector('span').textContent = t; w.task.title = t; node.setAttribute('aria-label', t); };
    w.setIcon = (u) => { w.icon = u; w.iconEl.src = u; w.task.querySelector('img').src = u; };
    w.setStatus = (...fields) => { if (!w.statusEl) return; const g = w.statusEl.querySelector('.zw-grip'); w.statusEl.replaceChildren(...fields.map((f) => { const p = el('p', 'status-bar-field'); p.textContent = f; return p; })); if (g) w.statusEl.append(g); };
    w.close = () => closeWin(w);
    o.build?.(w);
    layer.append(node);
    const A = deskArea();
    const ww = Math.min(o.w || 600, A.w - 16), hh = Math.min(o.h || 420, A.h - 16);
    const step = (cascade++ % 8) * 26;
    let x = o.x ?? Math.max(8, Math.round((A.w - ww) / 2) - 120 + step), y = o.y ?? Math.max(6, Math.round((A.h - hh) / 2) - 60 + step);
    if (o.rect) ({ x, y } = o.rect);
    else { x = Math.max(0, Math.min(x, A.w - ww)); y = Math.max(0, Math.min(y, A.h - hh)); }
    setRect(w, { x, y, w: o.rect?.w || ww, h: o.rect?.h || hh });
    const task = el('button', 'zt');
    task.type = 'button';
    task.innerHTML = '<img alt="" width="16" height="16"><span></span>';
    task.querySelector('img').src = w.icon;
    task.querySelector('span').textContent = o.title;
    task.title = o.title;
    task.addEventListener('click', () => {
      C.sfx('click');
      if (w.state === 'min') { restore(w); focus(w); }
      else if (active === w) minimize(w);
      else focus(w);
    });
    task.addEventListener('contextmenu', (e) => { e.preventDefault(); winMenu(w, { x: e.clientX, y: e.clientY }); });
    w.task = task;
    tasks.append(task);
    node.addEventListener('pointerdown', () => focus(w), true);
    node.addEventListener('focusin', () => { if (active !== w) focus(w); });
    const tb = node.querySelector('.title-bar');
    tb.addEventListener('dblclick', (e) => { if (!e.target.closest('button') && w.resizable && !phone()) toggleMax(w); });
    tb.addEventListener('contextmenu', (e) => { e.preventDefault(); winMenu(w, { x: e.clientX, y: e.clientY }); });
    node.querySelector('.zw-ico').addEventListener('click', (e) => { const r = e.target.getBoundingClientRect(); winMenu(w, { x: r.left, y: r.bottom }); });
    node.querySelectorAll('.title-bar-controls button').forEach((b) => b.addEventListener('pointerdown', (e) => e.stopPropagation()));
    node.querySelector('.title-bar-controls .minimize')?.addEventListener('click', () => minimize(w));
    node.querySelector('.title-bar-controls .maximize')?.addEventListener('click', () => toggleMax(w));
    node.querySelector('.title-bar-controls .close').addEventListener('click', () => closeWin(w));
    node.querySelector('.title-bar-controls .help')?.addEventListener('click', () => o.help?.(w));
    mover(w, tb);
    wins.push(w);
    w.onClose = o.onClose;
    w.onReopen = o.onReopen;
    w.restoreKind = o.restoreKind || null;
    if (phone() || o.max) maximize(w, true);
    if (o.minimized) { w.state = 'min'; node.hidden = true; paintTasks(); }
    else {
      focus(w);
      C.sfx('open');
      if (o.from && !calm()) { node.style.visibility = 'hidden'; zoom(o.from, node.getBoundingClientRect(), () => { node.style.visibility = ''; if (active === w) { try { (w.focusTarget?.() || node).focus({ preventScroll: true }); } catch {} } }); }
    }
    if (wins.length >= 5) setTimeout(() => C.unlock('juggler'), 300);
    saveSession();
    return w;
  }

  function mover(w, handle) {
    let sx = 0, sy = 0, ox = 0, oy = 0, last = [];
    C.drag(handle, {
      start: (p) => {
        if (phone() || w.state === 'max') { sx = null; return; }
        sx = p.clientX; sy = p.clientY; ox = w.rect.x; oy = w.rect.y; last = [[performance.now(), p.clientX, p.clientY]];
        dragging(true);
      },
      move: (p) => {
        if (sx == null) return;
        setRect(w, { ...w.rect, x: ox + p.clientX - sx, y: oy + p.clientY - sy });
        last.push([performance.now(), p.clientX, p.clientY]); if (last.length > 6) last.shift();
      },
      end: () => {
        dragging(false);
        if (sx == null) return;
        if (last.length > 2) {
          const a = last[0], b = last[last.length - 1];
          const v = Math.hypot(b[1] - a[1], b[2] - a[2]) / Math.max(1, b[0] - a[0]);
          if (v > 3.2 && b[0] - a[0] < 160) C.unlock('whoosh');
        }
        saveSession();
      }
    });
  }
  function resizer(w, h, dir) {
    let s = null;
    C.drag(h, {
      start: (p) => { if (phone() || w.state !== 'normal') { s = null; return; } s = { x: p.clientX, y: p.clientY, r: { ...w.rect } }; dragging(true); focus(w); },
      move: (p) => {
        if (!s) return;
        const dx = p.clientX - s.x, dy = p.clientY - s.y, r = { ...s.r };
        if (dir.includes('e')) r.w = Math.max(w.minW, s.r.w + dx);
        if (dir.includes('s')) r.h = Math.max(w.minH, s.r.h + dy);
        if (dir.includes('w')) { const nw = Math.max(w.minW, s.r.w - dx); r.x = s.r.x + s.r.w - nw; r.w = nw; }
        if (dir.includes('n')) { const nh = Math.max(w.minH, s.r.h - dy); r.y = s.r.y + s.r.h - nh; r.h = nh; }
        setRect(w, r);
      },
      end: () => { dragging(false); if (s) { s = null; saveSession(); w.onResize?.(); } }
    });
  }

  function focus(w) {
    if (!w || w.state === 'min') return;
    if (active === w && w.el.style.zIndex == zTop) return;
    active = w;
    w.el.style.zIndex = String(++zTop);
    wins.forEach((x) => { x.el.classList.toggle('is-active', x === w); x.el.querySelector('.title-bar').classList.toggle('inactive', x !== w); });
    paintTasks();
    if (!w.el.contains(document.activeElement)) {
      const f = w.focusTarget?.() || w.el;
      try { f.focus({ preventScroll: true }); } catch {}
    }
  }
  function blurAll() {
    active = null;
    wins.forEach((x) => { x.el.classList.remove('is-active'); x.el.querySelector('.title-bar').classList.add('inactive'); });
    paintTasks();
  }
  function relayout() {
    wins.forEach((w) => {
      if (phone() && w.state === 'normal') maximize(w, true);
      if (w.state === 'max') layoutMax(w);
      else if (w.state === 'normal') setRect(w, w.rect);
      w.onResize?.();
    });
    layoutIcons();
  }
  function paintTasks() {
    const app = phone() && wins.some((x) => x.state !== 'min');
    if (room.classList.contains('has-app') !== app) { room.classList.toggle('has-app', app); relayout(); }
    wins.forEach((x) => x.task.setAttribute('aria-pressed', String(x === active && x.state !== 'min')));
    tasks.classList.toggle('is-crowded', wins.length > 4);
  }
  function topOther(except) {
    return wins.filter((x) => x !== except && x.state !== 'min').sort((a, b) => b.el.style.zIndex - a.el.style.zIndex)[0] || null;
  }
  function minimize(w) {
    if (w.state === 'min') return;
    const from = w.el.getBoundingClientRect();
    w.prevState = w.state;
    w.state = 'min';
    w.el.hidden = true;
    C.sfx('min');
    zoom(from, w.task.getBoundingClientRect());
    if (active === w) { const n = topOther(w); if (n) focus(n); else blurAll(); }
    paintTasks();
    saveSession();
  }
  function restore(w) {
    if (w.state !== 'min') return;
    w.state = w.prevState === 'max' || phone() ? 'max' : 'normal';
    w.el.hidden = false;
    if (w.state === 'max') layoutMax(w); else setRect(w, w.rect);
    w.onShow?.();
    C.sfx('restore');
    const to = w.el.getBoundingClientRect();
    w.el.style.visibility = 'hidden';
    zoom(w.task.getBoundingClientRect(), to, () => { w.el.style.visibility = ''; if (active === w) { try { (w.focusTarget?.() || w.el).focus({ preventScroll: true }); } catch {} } });
    saveSession();
  }
  function maximize(w, quiet) {
    w.state = 'max';
    w.el.classList.add('is-max');
    layoutMax(w);
    const b = w.el.querySelector('.title-bar-controls .maximize');
    if (b) { b.classList.add('restore'); b.setAttribute('aria-label', 'Restore'); }
    if (!quiet) { C.sfx('max'); w.onResize?.(); }
  }
  function toggleMax(w) {
    if (phone()) return;
    if (w.state === 'max') {
      w.state = 'normal';
      w.el.classList.remove('is-max');
      setRect(w, w.rect);
      const b = w.el.querySelector('.title-bar-controls .maximize');
      if (b) { b.classList.remove('restore'); b.setAttribute('aria-label', 'Maximize'); }
      C.sfx('restore');
      w.onResize?.();
    } else maximize(w);
    saveSession();
  }
  function closeWin(w) {
    if (w.onBeforeClose && w.onBeforeClose() === false) return;
    const from = w.el.getBoundingClientRect();
    w.el.remove();
    w.task.remove();
    wins = wins.filter((x) => x !== w);
    C.sfx('close');
    if (!calm() && w.state !== 'min') zoom(from, { left: from.left + from.width / 2, top: from.top + from.height / 2, width: 0, height: 0 });
    w.onClose?.();
    if (active === w) { active = null; const n = topOther(w); if (n) focus(n); else { blurAll(); $('icons').querySelector('.di.is-sel, .di')?.focus({ preventScroll: true }); } }
    paintTasks();
    saveSession();
  }
  function winMenu(w, at) {
    C.menu.open([
      { label: '&Restore', disabled: w.state === 'normal', action: () => { if (w.state === 'min') { restore(w); focus(w); } else if (w.state === 'max') toggleMax(w); } },
      { label: '&Minimize', disabled: w.state === 'min', action: () => minimize(w) },
      { label: 'Ma&ximize', disabled: w.state === 'max' || !w.resizable || phone(), action: () => { if (w.state === 'min') restore(w); maximize(w); focus(w); } },
      { sep: true },
      { label: '&Close', accel: 'Alt+X', action: () => closeWin(w) }
    ], { x: at.x, y: at.y, reserve: tbH() });
  }
  window.addEventListener('resize', () => relayout());

  function saveSession() {
    if (!C.prefs.restore) return;
    clearTimeout(saveSession.t);
    saveSession.t = setTimeout(() => {
      const list = wins.filter((w) => w.restoreKind).map((w) => ({ k: w.restoreKind, r: w.rect, s: w.state === 'min' ? 'min' : w.state, a: active === w }));
      store.set('hub:session', list);
    }, 200);
  }
  function restoreSession() {
    if (!C.prefs.restore) return;
    const list = store.get('hub:session', []);
    if (!Array.isArray(list)) return;
    let act = null;
    list.slice(0, 8).forEach((s) => {
      const [kind, arg] = String(s.k || '').split(':');
      const opts = { rect: s.r, minimized: s.s === 'min', max: s.s === 'max' };
      let w = null;
      if (kind === 'game' && bySlug(arg)) w = openGame(arg, opts);
      else if (kind === 'folder') w = openFolder(arg, opts);
      else if (kind === 'readme') w = openReadme(opts);
      else if (kind === 'explorer') w = openExplorer(opts);
      else if (kind === 'page') w = openPage(arg, opts);
      if (s.a) act = w;
    });
    if (act && act.state !== 'min') focus(act);
  }

  const FOLDER = { classic: 'Arcade Classics', gym: 'Noggin Gym' };
  const fname = (t) => FOLDER[t] || tagName(t);
  const FS = {
    desktop: { name: 'Desktop', addr: 'Desktop', icon: 'computer' },
    games: { name: 'My Games', addr: 'C:\\My Games', icon: 'computer', parent: 'desktop' },
    'games/unplayed': { name: 'Not Played Yet', addr: 'C:\\My Games\\Not Played Yet', icon: 'folder', emb: 'eye', parent: 'games' },
    'games/new': { name: 'New Arrivals', addr: 'C:\\My Games\\New Arrivals', icon: 'folder', emb: 'fresh', parent: 'games' },
    favs: { name: 'Favourites', addr: 'C:\\Favourites', icon: 'favs', parent: 'desktop' },
    recent: { name: 'Recently Played', addr: 'C:\\Recent', icon: 'recent', parent: 'desktop' },
    bin: { name: 'Recycle Bin', addr: 'C:\\Recycled', icon: 'bin', parent: 'desktop' },
    control: { name: 'Control Panel', addr: 'Control Panel', icon: 'control', parent: 'desktop' }
  };
  TAGS.forEach((t) => { FS[`games/${t}`] = { name: fname(t), addr: `C:\\My Games\\${fname(t)}`, icon: 'folder', emb: t, parent: 'games', tag: t }; });
  const folderIcon = (path, size = 32) => {
    const f = FS[path];
    if (!f) return px('folder', size);
    if (f.tag) return C.folderIcon(f.tag, size);
    if (f.emb) return px('folder', size, { emb: f.emb });
    if (f.icon === 'bin') return px('bin', size, { full: binItems().length > 0 });
    return px(f.icon, size);
  };

  const BIN_DEFAULT = [
    { id: 'diet', name: 'Zob\'s diet plan.txt', type: 'Text Document', size: '1 KB', text: 'ZOB\'S DIET PLAN\r\n\r\nMonday: one pixel. a nice teal one.\r\nTuesday: half a byte. the crunchy half.\r\nWednesday: nothing. it is a fasting day.\r\nThursday: three crumbs from the Recycle Bin.\r\nFriday: cake (it is somebody\'s birthday somewhere).\r\nSaturday: cake.\r\nSunday: rest. and also cake.\r\n\r\nNOTE TO SELF: this plan is going in the bin.' },
    { id: 'homework', name: 'homework_FINAL_final_v3.txt', type: 'Text Document', size: '2 KB', text: 'My Summer Holiday\r\nby Zob\r\n\r\nThis summer I went to the beach. I did not go in the water because I am mostly made of electricity.\r\n\r\nThe end.\r\n\r\n(teacher\'s note: 3/10. please write more than four sentences. also you cannot be made of electricity.)' },
    { id: 'scores', name: 'old_high_scores.dat', type: 'DAT File', size: '0 KB', text: 'ZOB ...... 999999\r\nZOB ...... 999998\r\nZOB ...... 999997\r\nYOU ...... 12\r\n\r\n(the file seems to have been edited by hand)' },
    { id: 'point', name: 'The point.txt', type: 'Text Document', size: '1 KB', text: 'You have found the point.\r\n\r\nIt was lost during a conversation in 2021. It is quite small. Please do not lose it again.' },
    { id: 'tuesday', name: 'A jar of Tuesday.jar', type: 'Jar File', size: '24 KB', text: 'It is still a bit Tuesday-ish in here.\r\n\r\nDo not open on a Monday.' },
    { id: 'backroom', name: 'Staff only.lnk', type: 'Shortcut', size: '1 KB', link: 'backroom.html' },
    { id: 'lost', name: 'Lost and found.lnk', type: 'Shortcut', size: '1 KB', link: 'lost.html' }
  ];
  const binItems = () => { const gone = store.get('hub:bin', {}); return BIN_DEFAULT.filter((b) => !gone[b.id]); };

  function gameItem(g) {
    return { id: `g:${g.slug}`, kind: 'game', slug: g.slug, name: g.title, type: `${fname(g.tag)} game`, blurb: g.blurb, tag: g.tag, icon32: () => C.gameIcon(g.slug, 32), icon16: () => C.gameIcon(g.slug, 16), open: (from) => openGame(g.slug, { from }) };
  }
  function folderItem(path) {
    const f = FS[path];
    return { id: `f:${path}`, kind: 'folder', path, name: f.name, type: 'File Folder', blurb: `${listFor(path).length} objects`, icon32: () => folderIcon(path, 32), icon16: () => folderIcon(path, 16), open: (from, w) => (w ? w.go(path) : openFolder(path, { from })) };
  }
  const APPLETS = [
    { id: 'display', name: 'Display', icon: 'display', tab: 'display', blurb: 'Colour schemes and comfort settings.' },
    { id: 'desktop', name: 'Desktop', icon: 'wallpaper', tab: 'desk', blurb: 'Wallpaper, screen saver and what to remember.' },
    { id: 'sound', name: 'Sounds', icon: 'sound', tab: 'sound', blurb: 'Game sounds, system sounds and volume.' },
    { id: 'mouse', name: 'Mouse', icon: 'mouse', tab: 'mouse', blurb: 'Touchpad mode, pointers and clicking.' },
    { id: 'games', name: 'Games', icon: 'gamepad', tab: 'games', blurb: 'Simple or Advanced for new games.' },
    { id: 'secrets', name: 'Secrets', icon: 'trophy', blurb: 'The ones you found, and hints for the rest.' },
    { id: 'datetime', name: 'Date/Time', icon: 'clock', blurb: 'The clock in the corner, but bigger.' },
    { id: 'data', name: 'Data', icon: 'warn', tab: 'data', blurb: 'Start fresh.' }
  ];
  function listFor(path) {
    refreshData();
    if (path === 'desktop') return deskItems().filter((x) => x.kind !== 'sys');
    if (path === 'games') return [...TAGS.map((t) => folderItem(`games/${t}`)), folderItem('games/unplayed'), folderItem('games/new'), ...games.slice().sort((a, b) => a.title.localeCompare(b.title)).map(gameItem)];
    if (path === 'games/unplayed') return games.filter((g) => !played[g.slug]).map(gameItem);
    if (path === 'games/new') return games.filter(isNew).map(gameItem);
    if (path.startsWith('games/')) return games.filter((g) => g.tag === path.slice(6)).map(gameItem);
    if (path === 'favs') return games.filter((g) => favs[g.slug]).sort((a, b) => favs[b.slug] - favs[a.slug]).map(gameItem);
    if (path === 'recent') return games.filter((g) => played[g.slug]).sort((a, b) => played[b.slug] - played[a.slug]).map(gameItem);
    if (path === 'bin') return binItems().map((b) => ({ id: `b:${b.id}`, kind: 'binfile', name: b.name, type: b.type, blurb: `${b.type}, ${b.size}`, size: b.size, bin: b, icon32: () => (b.link ? C.overlayShortcut(px(b.id === 'lost' ? 'box' : 'door', 32), 32) : px(b.type === 'Text Document' ? 'doc' : 'doc', 32, b.type === 'Text Document' ? {} : { ink: '#808080' })), icon16: () => (b.link ? px(b.id === 'lost' ? 'box' : 'door', 16) : px('doc', 16)), open: () => openBinFile(b) }));
    if (path === 'control') return APPLETS.map((a) => ({ id: `a:${a.id}`, kind: 'applet', name: a.name, type: 'Control Panel applet', blurb: a.blurb, icon32: () => px(a.icon, 32), icon16: () => px(a.icon, 16), open: () => openApplet(a) }));
    return [];
  }
  function openApplet(a) {
    if (a.id === 'secrets') return C.secretsWindow();
    if (a.id === 'datetime') return openClock();
    C.settings(null, { tab: a.tab });
  }

  const VIEWS = ['large', 'list', 'details'];
  let view = store.get('hub:folderview', 'large');
  if (!VIEWS.includes(view)) view = 'large';

  function iconImg(item, size) {
    const img = new Image(size, size);
    img.alt = '';
    img.className = 'z-px';
    img.draggable = false;
    const v = size >= 32 ? item.icon32?.() : item.icon16?.();
    if (v && typeof v.then === 'function') { img.src = px('app', size); v.then((u) => { img.src = u; }); }
    else img.src = v || px('app', size);
    return img;
  }

  function openFolder(path, opts = {}) {
    if (!FS[path]) path = 'games';
    const existing = wins.find((w) => w.kind === 'folder' && w.data.path === path);
    if (existing) { if (existing.state === 'min') restore(existing); focus(existing); return existing; }
    let w;
    const hist = [path], fwd = [];
    let sel = null, sortKey = 'name', sortDir = 1, coin = { n: 0, t: 0, credit: store.get('hub:credits', 0) }, reps = 0;
    const st = {};
    w = openWindow({
      kind: 'folder', title: FS[path].name, icon: folderIcon(path, 16), w: 640, h: 440, minW: 260, minH: 200, status: true, from: opts.from, rect: opts.rect, minimized: opts.minimized, max: opts.max, data: { path },
      bodyCls: 'zx',
      menus: () => [
        { label: '&File', items: () => [
          { label: '&Open', disabled: !sel, action: () => sel && openItem(sel) },
          ...(sel?.kind === 'game' ? [{ label: favs[sel.slug] ? 'Remove from &Favourites' : 'Add to &Favourites', icon: px('star', 16), action: () => toggleFav(sel.slug) }, { label: 'Open in its own &tab', action: () => { location.href = `games/${sel.slug}/index.html`; } }] : []),
          ...(w.data.path === 'bin' ? [{ sep: true }, { label: 'Empty Recycle &Bin', icon: px('bin', 16), disabled: !binItems().length, action: emptyBin }, { label: '&Restore everything', action: restoreBin }] : []),
          { sep: true },
          { label: 'P&roperties', disabled: !sel, action: () => sel && props(sel) },
          { sep: true },
          { label: '&Close', action: () => closeWin(w) }
        ] },
        { label: '&Edit', items: () => [
          { label: '&Select first item', accel: 'Home', action: () => { const b = st.list.querySelector('.zi'); b?.focus(); b?.click(); } },
          { label: '&Find a game...', accel: 'Ctrl+F', icon: px('find', 16), action: () => openFind() }
        ] },
        { label: '&View', items: () => [
          { label: 'Lar&ge Icons', radio: true, checked: view === 'large', action: () => setView('large') },
          { label: '&List', radio: true, checked: view === 'list', action: () => setView('list') },
          { label: '&Details', radio: true, checked: view === 'details', action: () => setView('details') },
          { sep: true },
          { label: 'Arrange &Icons', sub: () => [['name', 'by &Name'], ['type', 'by &Type'], ['date', 'by &Last played']].map(([k, l]) => ({ label: l, radio: true, checked: sortKey === k, action: () => { sortKey = k; sortDir = 1; render(); } })) },
          { label: '&Folder tree', checked: !st.noTree, action: () => { st.noTree = !st.noTree; render(); } },
          { sep: true },
          { label: '&Refresh', accel: 'F5', action: () => render() }
        ] },
        { label: '&Go', items: () => [
          { label: '&Back', disabled: hist.length < 2, accel: 'Alt+Left', action: back },
          { label: '&Forward', disabled: !fwd.length, action: forward },
          { label: '&Up One Level', disabled: !FS[w.data.path].parent, accel: 'Backspace', action: up },
          { sep: true },
          { label: '&My Games', icon: px('computer', 16), action: () => go('games') },
          { label: '&Favourites', icon: px('favs', 16), action: () => go('favs') },
          { label: '&Recently Played', icon: px('recent', 16), action: () => go('recent') },
          { label: 'Recycle &Bin', icon: px('bin', 16), action: () => go('bin') }
        ] },
        { label: '&Help', items: () => [
          { label: '&Help Topics', icon: px('help', 16), action: () => openHelp('desktop') },
          { label: '&About ZobOS', action: aboutZoble }
        ] }
      ],
      build: (win) => {
        const bar = el('div', 'zx-tools');
        bar.innerHTML = `<button type="button" class="zx-tb" data-t="back" title="Back"><img alt="" src="${px('back', 16)}"><span>Back</span></button><button type="button" class="zx-tb" data-t="fwd" title="Forward"><img alt="" src="${px('fwd', 16)}"><span>Forward</span></button><button type="button" class="zx-tb" data-t="up" title="Up one level"><img alt="" src="${px('upf', 16)}"><span>Up</span></button><span class="zx-sep"></span><button type="button" class="zx-tb" data-t="views" title="Views" aria-haspopup="menu"><img alt="" src="${px('views', 16)}"><span>Views</span></button><button type="button" class="zx-tb" data-t="fav" title="Add the selected game to Favourites"><img alt="" src="${px('star', 16)}"><span>Favourite</span></button><button type="button" class="zx-tb" data-t="roll" title="Open a random game from this folder"><img alt="" src="${px('die', 16)}"><span>Surprise me</span></button><span class="zx-extra"></span>`;
        const addr = el('div', 'zx-addr');
        addr.innerHTML = `<label for="${win.id}a">Address</label><span class="zx-addr__box"><img alt="" width="16" height="16"><input id="${win.id}a" type="text" spellcheck="false" autocomplete="off"></span><button type="button" class="zx-go">Go</button>`;
        const main = el('div', 'zx-main');
        const tree = el('div', 'zx-tree');
        const list = el('div', 'zx-list sunken-panel');
        list.tabIndex = -1;
        main.append(tree, list);
        win.body.append(bar, addr, main);
        Object.assign(st, { bar, addr, tree, list, input: addr.querySelector('input'), addrIco: addr.querySelector('img') });
        bar.addEventListener('click', (e) => {
          const b = e.target.closest('[data-t]'); if (!b) return;
          C.sfx('click');
          const t = b.dataset.t;
          if (t === 'back') back(); else if (t === 'fwd') forward(); else if (t === 'up') up();
          else if (t === 'views') { const r = b.getBoundingClientRect(); C.menu.open(VIEWS.map((v) => ({ label: { large: 'Lar&ge Icons', list: '&List', details: '&Details' }[v], radio: true, checked: view === v, action: () => setView(v) })), { anchor: r, opener: b }); }
          else if (t === 'fav') { if (sel?.kind === 'game') toggleFav(sel.slug); else C.balloon('Select a game first, then press Favourite.', { ms: 2200 }); }
          else if (t === 'roll') { const pool = listFor(w.data.path).filter((x) => x.kind === 'game'); if (pool.length) rollGame(pool.map((x) => bySlug(x.slug))); else rollGame(); }
          else if (t === 'coin') insertCoin(b);
          else if (t === 'lift') lift(b);
        });
        const goAddr = () => {
          const v = st.input.value.trim().toLowerCase().replace(/\//g, '\\');
          const hit = Object.entries(FS).find(([k, f]) => f.addr.toLowerCase() === v || f.name.toLowerCase() === v || k === v || f.addr.toLowerCase().endsWith(`\\${v}`));
          if (hit) { go(hit[0]); return; }
          if (/backroom|staff/.test(v)) { openPage('backroom'); return; }
          const g = findGame(v);
          if (g) { openGame(g.slug); return; }
          C.modal({ icon: 'error', caption: FS[w.data.path].name, title: '', body: `Cannot find '${st.input.value}'. Make sure the path is correct and try again.`, buttons: [{ label: 'OK', value: 'ok' }] });
        };
        st.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); goAddr(); } });
        addr.querySelector('.zx-go').addEventListener('click', goAddr);
        list.addEventListener('scroll', () => { if (list.scrollHeight > list.clientHeight + 300 && list.scrollTop + list.clientHeight >= list.scrollHeight - 4) C.unlock('bottom'); }, { passive: true });
        list.addEventListener('keydown', listKeys);
        list.addEventListener('contextmenu', (e) => {
          const b = e.target.closest('.zi');
          e.preventDefault();
          if (b) { select(b); itemMenu(b._item, { x: e.clientX, y: e.clientY }, w); }
          else C.menu.open([{ label: 'View', sub: () => VIEWS.map((v) => ({ label: { large: 'Lar&ge Icons', list: '&List', details: '&Details' }[v], radio: true, checked: view === v, action: () => setView(v) })) }, { label: '&Refresh', action: () => render() }, { sep: true }, { label: 'P&roperties', action: () => props(folderItem(w.data.path)) }], { x: e.clientX, y: e.clientY });
        });
        list.addEventListener('pointerdown', (e) => { if (e.target === list || e.target.classList.contains('zx-grid')) { sel = null; list.querySelectorAll('.zi.is-sel').forEach((x) => x.classList.remove('is-sel')); status(); } });
        win.go = go;
        win.focusTarget = () => list.querySelector('.zi.is-sel') || list.querySelector('.zi') || list;
        win.onResize = () => paintTree();
        win.refresh = () => render(true);
      }
    });
    function setView(v) { view = v; store.set('hub:folderview', v); wins.filter((x) => x.kind === 'folder').forEach((x) => x.refresh?.()); }
    function go(p, keep) {
      if (!FS[p]) return;
      if (!keep) { if (hist[hist.length - 1] !== p) hist.push(p); fwd.length = 0; }
      w.data.path = p;
      w.key = `folder:${p}`;
      w.restoreKind = `folder:${p}`;
      sel = null;
      w.setTitle(FS[p].name);
      w.setIcon(folderIcon(p, 16));
      render();
      st.list.scrollTop = 0;
      if (active === w && !/^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement?.tagName || '')) st.list.querySelector('.zi')?.focus({ preventScroll: true });
      if (p.startsWith('games/') && FS[p].tag) {
        refreshData();
        const all = games.filter((g) => g.tag === FS[p].tag);
        if (all.length >= 2 && all.every((g) => played[g.slug])) setTimeout(() => C.unlock('drawer'), 600);
      }
      saveSession();
    }
    function back() { if (hist.length < 2) return; fwd.push(hist.pop()); go(hist[hist.length - 1], true); }
    function forward() { if (!fwd.length) return; const p = fwd.pop(); hist.push(p); go(p, true); }
    function up() { const par = FS[w.data.path].parent; if (par === 'desktop') { focusDesktop(); return; } if (par) go(par); }
    function status() {
      const items = st.items || [];
      const n = items.length;
      if (sel) w.setStatus(`${sel.name}`, sel.kind === 'game' ? `${sel.blurb}${played[sel.slug] ? `  (played ${ago(played[sel.slug]).toLowerCase()})` : ''}` : sel.blurb || sel.type);
      else w.setStatus(`${n} object${n === 1 ? '' : 's'}`, extraStatus());
    }
    function extraStatus() {
      const p = w.data.path;
      if (p === 'games/classic') return `CREDIT ${String(coin.credit % 100).padStart(2, '0')}  HI-SCORE ZOB 999999`;
      if (p === 'games/gym') return reps ? `${reps} rep${reps === 1 ? '' : 's'}. Keep going!` : 'Today\'s workout: one test, then another.';
      if (p === 'bin') return 'Things you deleted. Or Zob did.';
      if (p === 'favs') return 'Your starred games, newest first.';
      if (p === 'recent') return 'Most recent first.';
      if (p === 'control') return 'Pick an applet to change a setting.';
      const list = st.items || [];
      const done = list.filter((x) => x.kind === 'game' && played[x.slug]).length;
      const g = list.filter((x) => x.kind === 'game').length;
      return g ? `${done} of ${g} played` : '';
    }
    function sortItems(items) {
      if (w.data.path === 'favs' || w.data.path === 'recent' || w.data.path === 'control' || w.data.path === 'bin') { if (sortKey === 'name' && sortDir === 1) return items; }
      const val = (x) => (sortKey === 'type' ? x.type : sortKey === 'date' ? -(played[x.slug] || 0) : sortKey === 'best' ? -(bestOf(x.slug) ?? -1e12) : x.name.toLowerCase());
      return items.slice().sort((a, b) => {
        if ((a.kind === 'folder') !== (b.kind === 'folder')) return a.kind === 'folder' ? -1 : 1;
        const A = val(a), B = val(b);
        return (A < B ? -1 : A > B ? 1 : 0) * sortDir;
      });
    }
    function render(soft) {
      if (!w || !st.list) return;
      refreshData();
      const p = w.data.path;
      st.input.value = FS[p].addr;
      st.addrIco.src = folderIcon(p, 16);
      st.bar.querySelector('[data-t="back"]').disabled = hist.length < 2;
      st.bar.querySelector('[data-t="fwd"]').disabled = !fwd.length;
      st.bar.querySelector('[data-t="up"]').disabled = !FS[p].parent;
      const extra = st.bar.querySelector('.zx-extra');
      extra.innerHTML = p === 'games/classic' ? `<span class="zx-sep"></span><button type="button" class="zx-tb" data-t="coin" title="Insert coin"><img alt="" src="${px('coin', 16)}"><span>Insert Coin</span></button>` : p === 'games/gym' ? `<span class="zx-sep"></span><button type="button" class="zx-tb" data-t="lift" title="Lift the dumbbell"><img alt="" src="${px('dumbbell', 16)}"><span>Lift</span></button>` : p === 'bin' ? '<span class="zx-sep"></span><button type="button" class="zx-tb" data-t="empty"><span>Empty Bin</span></button>' : '';
      extra.querySelector('[data-t="empty"]')?.addEventListener('click', emptyBin);
      const items = sortItems(listFor(p));
      st.items = items;
      const selId = soft && sel ? sel.id : null;
      st.list.className = `zx-list sunken-panel is-${view}`;
      st.list.replaceChildren();
      if (!items.length) {
        const msg = { favs: 'No favourites yet. Select a game and press Favourite on the toolbar.', recent: 'Nothing played yet. Games you open show up here.', bin: 'The Recycle Bin is empty. Zob is very proud.', 'games/unplayed': 'You have played everything. Zob is genuinely impressed.', 'games/new': 'Nothing new right now.' }[p] || 'This folder is empty.';
        st.list.append(el('p', 'zx-empty', esc(msg)));
      } else if (view === 'details') {
        const t = el('table', 'zx-table');
        t.setAttribute('role', 'grid');
        const cols = p === 'control' ? [['name', 'Name'], ['type', 'Description']] : p === 'bin' ? [['name', 'Name'], ['type', 'Type'], ['size', 'Size']] : [['name', 'Name'], ['type', 'Folder'], ['date', 'Last played'], ['best', 'Best']];
        t.innerHTML = `<thead><tr>${cols.map(([k, l]) => `<th scope="col"><button type="button" data-sort="${k}">${l}${sortKey === k ? (sortDir === 1 ? ' \u25b2' : ' \u25bc') : ''}</button></th>`).join('')}</tr></thead><tbody></tbody>`;
        const tb = t.querySelector('tbody');
        items.forEach((it) => {
          const tr = el('tr');
          const td = el('td');
          const b = itemButton(it, 16);
          td.append(b); tr.append(td);
          const vals = p === 'control' ? [it.blurb] : p === 'bin' ? [it.type, it.size] : [it.kind === 'folder' ? 'File Folder' : fname(it.tag), it.kind === 'game' ? ago(played[it.slug]) : '', it.kind === 'game' ? (() => { const v = bestOf(it.slug); return v == null ? '' : C.fmt(v, v % 1 ? 2 : 0); })() : ''];
          vals.forEach((v) => { const c = el('td'); c.textContent = v; tr.append(c); });
          tb.append(tr);
        });
        t.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.sort; if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = 1; } C.sfx('click'); render(true); }));
        st.list.append(t);
      } else {
        const grid = el('div', 'zx-grid');
        grid.setAttribute('role', 'group');
        items.forEach((it) => grid.append(itemButton(it, view === 'large' ? 32 : 16)));
        st.list.append(grid);
      }
      const all = [...st.list.querySelectorAll('.zi')];
      all.forEach((b, i) => { b.tabIndex = i === 0 ? 0 : -1; });
      if (selId) { const b = all.find((x) => x._item.id === selId); if (b) select(b, true); }
      st.main = st.list.parentElement;
      paintTree();
      status();
    }
    function itemButton(it, size) {
      const b = el('button', `zi${it.kind === 'game' && isNew(bySlug(it.slug)) ? ' is-new' : ''}${it.kind === 'game' && favs[it.slug] ? ' is-fav' : ''}`);
      b.type = 'button';
      b._item = it;
      b.append(iconImg(it, size));
      const s = el('span', 'zi-label'); s.textContent = it.name; b.append(s);
      b.setAttribute('aria-label', `${it.name}${it.kind === 'game' ? `. ${it.blurb}` : `. ${it.type}`}`);
      b.addEventListener('click', (e) => {
        if (C.prefs.clicks === 'double' && e.detail < 2 && e.pointerType !== 'touch') { select(b); return; }
        select(b); openItem(it, b);
      });
      b.addEventListener('dblclick', () => { if (C.prefs.clicks === 'double') openItem(it, b); });
      b.addEventListener('focus', () => { if (sel?.id !== it.id) select(b, true); });
      if (it.kind === 'game') C.tooltip(b, () => `${it.name}: ${it.blurb}`);
      return b;
    }
    function select(b, quiet) {
      st.list.querySelectorAll('.zi.is-sel').forEach((x) => { x.classList.remove('is-sel'); x.tabIndex = -1; });
      b.classList.add('is-sel'); b.tabIndex = 0;
      sel = b._item;
      if (!quiet) b.focus({ preventScroll: false });
      status();
    }
    function openItem(it, b) {
      C.sfx('click');
      const from = b?.querySelector('img')?.getBoundingClientRect();
      if (it.kind === 'folder') { go(it.path); return; }
      it.open(from, w);
    }
    function listKeys(e) {
      const all = [...st.list.querySelectorAll('.zi')];
      const cur = document.activeElement?.closest?.('.zi');
      const i = all.indexOf(cur);
      if (e.key === 'Backspace') { e.preventDefault(); up(); return; }
      if (e.key === 'F5') { e.preventDefault(); render(true); return; }
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); back(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') { e.preventDefault(); openFind(); return; }
      if (!all.length) return;
      if (e.key === 'Enter') { e.preventDefault(); if (cur) openItem(cur._item, cur); return; }
      if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') { e.preventDefault(); if (cur) { const r = cur.getBoundingClientRect(); itemMenu(cur._item, { x: r.left + 10, y: r.bottom }, w); } return; }
      let j = i < 0 ? 0 : i;
      const cols = (() => { if (view === 'details') return 1; const top = all[0].offsetTop; let c = 0; for (const x of all) { if (x.offsetTop !== top) break; c++; } return Math.max(1, c); })();
      const rowsInCol = (() => { if (view !== 'list') return 0; const left = all[0].offsetLeft; let c = 0; for (const x of all) { if (x.offsetLeft !== left) break; c++; } return c; })();
      if (e.key === 'ArrowRight') j = view === 'list' && rowsInCol > 1 && cols === 1 ? j + rowsInCol : j + 1;
      else if (e.key === 'ArrowLeft') j = view === 'list' && rowsInCol > 1 && cols === 1 ? j - rowsInCol : j - 1;
      else if (e.key === 'ArrowDown') j += cols;
      else if (e.key === 'ArrowUp') j -= cols;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = all.length - 1;
      else if (e.key.length === 1 && /[a-z0-9]/i.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const k = e.key.toLowerCase();
        const order = [...all.slice(j + 1), ...all.slice(0, j + 1)];
        const hit = order.find((x) => x._item.name.toLowerCase().startsWith(k));
        if (hit) { e.preventDefault(); select(hit); hit.scrollIntoView({ block: 'nearest' }); }
        return;
      } else return;
      e.preventDefault();
      j = Math.max(0, Math.min(all.length - 1, j));
      select(all[j]);
      all[j].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    function paintTree() {
      const wide = !phone() && w.el.offsetWidth >= 560 && !st.noTree;
      st.tree.hidden = !wide;
      if (!wide) return;
      const p = w.data.path;
      const node = (path, depth, kids) => {
        const f = FS[path];
        return `<li><button type="button" class="zx-node${path === p ? ' is-sel' : ''}" data-path="${path}" style="--d:${depth}"><img alt="" src="${folderIcon(path, 16)}"><span>${esc(f.name)}</span></button>${kids ? `<ul>${kids}</ul>` : ''}</li>`;
      };
      const cats = [...TAGS.map((t) => `games/${t}`), 'games/unplayed', 'games/new'].map((x) => node(x, 2)).join('');
      st.tree.innerHTML = `<ul class="tree-view zx-tv"><li><button type="button" class="zx-node${p === 'desktop' ? ' is-sel' : ''}" data-path="desktop" style="--d:0"><img alt="" src="${px('computer', 16)}"><span>Desktop</span></button><ul>${node('games', 1, cats)}${node('favs', 1)}${node('recent', 1)}${node('bin', 1)}${node('control', 1)}</ul></li></ul>`;
      st.tree.querySelectorAll('.zx-node').forEach((b) => b.addEventListener('click', () => { C.sfx('click'); if (b.dataset.path === 'desktop') focusDesktop(); else go(b.dataset.path); }));
    }
    function insertCoin(b) {
      coin.credit = store.get('hub:credits', 0) + 1;
      store.set('hub:credits', coin.credit);
      C.sfx('coin');
      b.classList.remove('is-drop'); void b.offsetWidth; b.classList.add('is-drop');
      const t = performance.now();
      coin.n = t - coin.t < 2500 ? coin.n + 1 : 1; coin.t = t;
      if (coin.n >= 3) { coin.n = 0; C.unlock('coin'); C.balloon(C.pick(['Ready player one.', 'Three credits! The arcade is very excited.', 'Player one has entered the game.']), { ms: 2400 }); }
      status();
    }
    function lift() {
      reps++;
      store.set('hub:lifts', store.get('hub:lifts', 0) + 1);
      C.sfx('lift');
      if (reps === 10) { C.unlock('gains'); C.balloon('Ten reps! Your brain is visibly bigger.', { ms: 2400 }); C.confetti(60); }
      if (reps === 25) C.balloon('Ok, that\'s enough. The dumbbell is tired.', { ms: 2200 });
      status();
    }
    go(path, true);
    return w;
  }

  function itemMenu(it, at, w) {
    const items = [{ label: '&Open', action: () => (it.kind === 'folder' ? (w ? w.go(it.path) : openFolder(it.path)) : it.open()) }];
    if (it.kind === 'game') items.push({ label: favs[it.slug] ? 'Remove from &Favourites' : 'Add to &Favourites', action: () => toggleFav(it.slug) }, { label: 'Open in its own &tab', action: () => { location.href = `games/${it.slug}/index.html`; } });
    if (it.kind === 'binfile') items.push({ label: '&Restore', action: () => restoreBinItem(it.bin) });
    items.push({ sep: true }, { label: 'P&roperties', action: () => props(it) });
    C.menu.open(items, { x: at.x, y: at.y, reserve: tbH() });
  }
  function props(it) {
    const box = el('div', 'zp');
    const img = iconImg(it, 32);
    const rows = [['Type', it.type]];
    if (it.kind === 'game') {
      const g = bySlug(it.slug);
      rows.push(['Location', `C:\\My Games\\${fname(g.tag)}`], ['About', g.blurb], ['Last played', played[g.slug] ? new Date(played[g.slug]).toLocaleString() : 'Never'], ['Best score', (() => { const v = bestOf(g.slug); return v == null ? 'None yet' : C.fmt(v, v % 1 ? 2 : 0); })()], ['Mode', (store.get(`mode:${g.slug}`, null) || store.get('modeDefault', 'simple')) === 'advanced' ? 'Advanced' : 'Simple'], ['Favourite', favs[g.slug] ? 'Yes' : 'No']);
    } else if (it.kind === 'folder') rows.push(['Contains', `${listFor(it.path).length} objects`], ['Location', FS[it.path].addr]);
    else if (it.blurb) rows.push(['Details', it.blurb]);
    box.innerHTML = '<div class="zp-head"></div><hr><dl class="zp-rows"></dl>';
    box.querySelector('.zp-head').append(img, Object.assign(el('b'), { textContent: it.name }));
    rows.forEach(([k, v]) => { box.querySelector('dl').insertAdjacentHTML('beforeend', `<dt>${esc(k)}:</dt><dd>${esc(v)}</dd>`); });
    C.modal({ icon: 'info', caption: `${it.name} Properties`, title: '', body: box, buttons: it.kind === 'game' ? [{ label: 'OK', value: 'ok' }, { label: 'Play', value: 'play' }] : [{ label: 'OK', value: 'ok' }] }).then((v) => { if (v === 'play') openGame(it.slug); });
  }

  function findGame(q) {
    q = String(q || '').toLowerCase().trim().replace(/\.exe$/, '');
    if (!q) return null;
    const n = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const nq = n(q);
    return games.find((g) => g.slug === q || n(g.title) === nq) || games.find((g) => n(g.title).startsWith(nq)) || games.find((g) => n(g.title).includes(nq) || g.slug.includes(q.replace(/\s+/g, '-')));
  }

  const QUIPS = {
    classic: ['ooh, a classic. I hold the high score. probably.', 'blow on the cartridge first', 'one more go. just one more.'],
    gym: ['stretch first!', 'feel the burn. the brain burn.', 'I can do this one with my eye closed. I only have one.'],
    explore: ['bring a jumper, it gets cold out there', 'pack a sandwich'],
    life: ['this one does maths about you', 'numbers! my favourite snack'],
    absurd: ['I still don\'t understand this one', 'trust me. just click it.'],
    skill: ['steady hands now', 'I have no hands. I still try.'],
    brain: ['wrinkly brain time', 'thinking cap on'],
    arcade: ['high score or bust', 'pew pew'],
    puzzle: ['take your time, the puzzle will wait', 'I solved it once. by accident.'],
    toy: ['no rules in the toy box', 'squish it. go on.'],
    make: ['make something weird', 'I would like a portrait, please'],
    draw: ['draw me! I\'m mostly a circle', 'mind the paper']
  };

  function openGame(slug, opts = {}) {
    const g = bySlug(slug);
    if (!g) return null;
    const existing = wins.find((w) => w.key === `game:${slug}`);
    if (existing) { if (existing.state === 'min') restore(existing); focus(existing); return existing; }
    let frame, info = { modes: false, mode: C.store.get(`mode:${slug}`, null) || C.store.get('modeDefault', 'simple') };
    const A = deskArea();
    const w = openWindow({
      key: `game:${slug}`, kind: 'game', title: g.title, icon: C.px('app', 16), w: Math.min(860, A.w - 40), h: Math.min(640, A.h - 30), minW: 280, minH: 220, status: true, from: opts.from, rect: opts.rect, minimized: opts.minimized, max: opts.max ?? (C.prefs.gameWindow !== 'window'), cls: 'zw-game',
      help: () => post('help'),
      menus: (win) => [
        { label: '&Game', items: () => [
          { label: '&Restart', accel: 'F5', action: () => post('restart') },
          { label: 'Random &game', icon: px('die', 16), action: () => rollGame() },
          { sep: true },
          { label: favs[slug] ? 'Remove from &Favourites' : 'Add to &Favourites', icon: px('star', 16), action: () => toggleFav(slug) },
          { label: 'Open in its own &tab', action: () => { location.href = `games/${slug}/index.html`; } },
          { label: 'P&roperties', action: () => props(gameItem(g)) },
          { sep: true },
          { label: '&Close', accel: 'Alt+X', action: () => closeWin(win) }
        ] },
        { label: '&View', items: () => [
          ...(info.modes ? [{ label: '&Simple', radio: true, checked: info.mode === 'simple', action: () => setMode('simple') }, { label: '&Advanced', radio: true, checked: info.mode === 'advanced', action: () => setMode('advanced') }, { sep: true }] : [{ label: 'One size fits all', disabled: true }, { sep: true }]),
          { label: '&Colour scheme', sub: C.schemeItems },
          { label: '&Touchpad mode', checked: C.touchpad, action: () => { C.setTouchpad(!C.touchpad); C.balloon(C.touchpad ? 'Touchpad mode on: click to grab, click again to let go.' : 'Touchpad mode off.', { ms: 2200 }); } },
          { label: 'S&ound', checked: !C.muted, action: () => C.setMuted(!C.muted) },
          { sep: true },
          { label: win.state === 'max' ? 'Res&tore window' : 'Ma&ximize window', disabled: phone(), action: () => toggleMax(win) }
        ] },
        { label: '&Help', items: () => [
          { label: '&How to play', icon: px('help', 16), action: () => post('help') },
          { label: `&About ${g.title.replace(/&/g, '&&')}`, action: () => post('about') }
        ] }
      ],
      build: (win) => {
        const wrap = el('div', 'zw-frame');
        frame = el('iframe');
        frame.title = g.title;
        frame.setAttribute('allow', 'fullscreen; autoplay; clipboard-write');
        frame.setAttribute('allowfullscreen', '');
        wrap.append(frame);
        win.body.append(wrap);
        win.frame = frame;
        win.focusTarget = () => frame;
        const load = () => {
          if (frame.src) return;
          win.el.classList.add('is-loading');
          html.classList.add('z-wait');
          win.setStatus('Loading...', g.blurb);
          frame.src = `games/${slug}/index.html`;
        };
        frame.addEventListener('load', () => {
          if (!frame.getAttribute('src')) return;
          win.el.classList.remove('is-loading');
          if (!wins.some((x) => x.el.classList.contains('is-loading'))) html.classList.remove('z-wait');
          paintStatus();
          try { frame.contentWindow.focus(); } catch {}
        });
        win.onShow = load;
        win.load = load;
      }
    });
    w.restoreKind = `game:${slug}`;
    const modeBox = el('div', 'curio-mode');
    modeBox.setAttribute('role', 'group');
    modeBox.setAttribute('aria-label', 'Game mode');
    modeBox.hidden = true;
    modeBox.innerHTML = '<button type="button" data-mode="simple" title="Simple: quick and easy">Simple</button><button type="button" data-mode="advanced" title="Advanced: more content, longer games">Advanced</button>';
    modeBox.addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) setMode(b.dataset.mode); });
    modeBox.addEventListener('pointerdown', (e) => e.stopPropagation());
    modeBox.addEventListener('dblclick', (e) => e.stopPropagation());
    w.el.querySelector('.title-bar-controls').before(modeBox);
    C.gameIcon(slug, 16).then((u) => w.setIcon(u));
    if (w.state !== 'min') w.load();
    function post(cmd, extra = {}) { try { frame.contentWindow.postMessage({ zoble: cmd, ...extra }, location.origin); } catch {} }
    function setMode(m) { if (m === info.mode) return; C.sfx('click'); info.mode = m; post('setMode', { mode: m }); paintStatus(); }
    function paintStatus() {
      modeBox.hidden = !info.modes;
      modeBox.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.mode === info.mode)));
      w.setStatus(info.modes ? `${info.mode === 'advanced' ? 'Advanced' : 'Simple'} mode` : 'Ready', g.blurb);
    }
    w.onMessage = (d) => {
      if (d.zoble === 'hello') { info = { ...info, ...d }; paintStatus(); }
      else if (d.zoble === 'mode') { info.mode = d.mode; paintStatus(); }
    };
    refreshData();
    played[slug] = played[slug] || Date.now();
    if (!opts.minimized && !opts.quiet && Math.random() < 0.6) zobSay(C.pick(QUIPS[g.tag] || ['good pick', 'ooh, that one']), 2600);
    setTimeout(refreshAll, 1500);
    return w;
  }

  function openPage(name, opts = {}) {
    const PAGES = { backroom: ['The back room', 'backroom.html', 'door'], lost: ['Lost and found', 'lost.html', 'box'] };
    const p = PAGES[name];
    if (!p) return null;
    const w = openWindow({
      key: `page:${name}`, kind: 'page', title: p[0], icon: px(p[2], 16), w: 760, h: 560, status: false, rect: opts.rect, minimized: opts.minimized, max: opts.max, from: opts.from,
      build: (win) => {
        const wrap = el('div', 'zw-frame');
        const f = el('iframe'); f.title = p[0]; f.src = p[1];
        wrap.append(f); win.body.append(wrap); win.frame = f; win.focusTarget = () => f;
      }
    });
    w.restoreKind = `page:${name}`;
    return w;
  }

  window.addEventListener('message', (e) => {
    if (e.origin !== location.origin || !e.data || typeof e.data !== 'object' || !e.data.zoble) return;
    const w = wins.find((x) => x.frame && x.frame.contentWindow === e.source);
    const d = e.data;
    if (d.zoble === 'activate') { if (w) focus(w); bumpIdle(); Menus().closeAll(); return; }
    if (d.zoble === 'activity') { bumpIdle(); return; }
    if (d.zoble === 'balloon') { C.sfx('success'); C.balloon(d.text, { title: d.title, icon: d.icon, ms: 4200 }); return; }
    if (d.zoble === 'key') {
      if (d.key === 'start') toggleStart(undefined, true);
      else if (d.key === 'close' && w) closeWin(w);
      return;
    }
    w?.onMessage?.(d);
  });
  const Menus = () => C.menu;

  function openNotepad(title, text, opts = {}) {
    let ta, wrap = true;
    const w = openWindow({
      key: opts.key, kind: 'notepad', title: `${title} - Notepad`, icon: px('notepad', 16), w: 560, h: 420, minW: 240, minH: 160, rect: opts.rect, minimized: opts.minimized, max: opts.max, from: opts.from,
      menus: (win) => [
        { label: '&File', items: () => [
          { label: '&New', action: () => { ta.value = ''; ta.focus(); } },
          { label: '&Save', accel: 'Ctrl+S', action: save },
          { sep: true },
          { label: 'E&xit', action: () => closeWin(win) }
        ] },
        { label: '&Edit', items: () => [
          { label: 'Select &All', accel: 'Ctrl+A', action: () => { ta.focus(); ta.select(); } },
          { label: 'Time/&Date', accel: 'F5', action: stamp }
        ] },
        { label: '&Search', items: () => [{ label: '&Find a game...', action: () => openFind() }] },
        { label: '&Help', items: () => [{ label: '&About Notepad', action: () => C.modal({ icon: 'info', caption: 'About Notepad', title: 'Zoble Notepad', body: 'Writes words. Does not keep them. Perfect for secrets.', buttons: [{ label: 'OK', value: 'ok' }] }) }] }
      ],
      build: (win) => {
        ta = el('textarea', 'zn');
        ta.value = text;
        ta.spellcheck = false;
        ta.setAttribute('aria-label', title);
        win.body.append(ta);
        win.focusTarget = () => ta;
        ta.addEventListener('keydown', (e) => {
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
          if (e.key === 'F5') { e.preventDefault(); stamp(); }
        });
      }
    });
    function save() { C.modal({ icon: 'warn', caption: 'Notepad', title: '', body: `Saving is for people with floppy disks.\n\nYour words will stay here until you close the window. Treasure them.`, buttons: [{ label: 'OK', value: 'ok' }] }); }
    function stamp() { const s = new Date().toLocaleString(); const a = ta.selectionStart; ta.setRangeText(s, a, ta.selectionEnd, 'end'); ta.focus(); }
    void wrap;
    return w;
  }
  const README = () => `ZOBOS README\r\n============\r\n\r\nHello! You are sitting at Zob's desk, and this is Zob's computer.\r\nIt runs ZobOS. There are ${games.length} games, toys and odd corners on it.\r\nEverything is free. Nothing to sign up for. No ads.\r\n\r\nGETTING STARTED\r\n---------------\r\n* Zoble Explorer shows every game with a picture. Search it,\r\n  browse by kind, or press Surprise me.\r\n* The Zob button (bottom left of the screen) has every game sorted\r\n  by folder, plus Run, Find, Help and the Control Panel.\r\n* Games fill the screen. Open a few at once and switch between\r\n  them on the taskbar. Double-click a title bar to put a game in\r\n  a window you can move (Control Panel, Games makes it the default).\r\n* Every game has a Simple and an Advanced version. Simple is\r\n  quick fun. Advanced has everything.\r\n\r\nTHE DESK\r\n--------\r\nThe desk is real too (well, as real as Zob). Click the lamp, the\r\nmug, the plant, the sticky notes, the drawer, the window...\r\n\r\nTOUCHPAD?\r\n---------\r\nTurn on Touchpad mode (the little pad in the corner of the\r\ntaskbar). Then every drag becomes click to grab, click to drop.\r\n\r\nKEYBOARD\r\n--------\r\nCtrl+Esc      Zob menu\r\nAlt+X         Close the window you are in\r\nArrows        Move between icons\r\nEnter         Open\r\nEsc           Close menus\r\nF10           The menu bar of the active window\r\n/             Find a game\r\n\r\nPRIVACY\r\n-------\r\nScores, favourites and settings live in this browser only.\r\nNo cookies, no tracking, no accounts. Zob checked.\r\n\r\nSECRETS\r\n-------\r\nThere are ${C.secrets.length} of them, on the screen and on the desk.\r\nZob will not tell you where. (The drawer might.)\r\n`;
  function openReadme(opts = {}) { const w = openNotepad('Readme.txt', README(), { key: 'readme', ...opts }); w.restoreKind = 'readme'; return w; }

  function openBinFile(b) {
    if (b.link) { openPage(b.id === 'lost' ? 'lost' : 'backroom'); return; }
    openNotepad(b.name, b.text, { key: `bin:${b.id}` });
  }
  function restoreBinItem(b) {
    C.modal({ icon: 'question', caption: 'Restore', title: '', body: `Restore '${b.name}' to... where it was?\n\nNobody remembers where it was. Zob put it back in the bin.`, buttons: [{ label: 'OK', value: 'ok' }] });
  }
  function restoreBin() { store.remove('hub:bin'); refreshAll(); C.balloon('Everything crawled back into the bin.', { ms: 2000 }); }
  async function emptyBin() {
    const items = binItems();
    if (!items.length) return;
    const v = await C.modal({ icon: 'question', caption: 'Confirm Multiple File Delete', title: '', body: `Are you sure you want to delete '${items[0].name}' and the other ${items.length - 1} items?`, buttons: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] });
    if (v !== 'yes') return;
    C.unlock('bin');
    C.sfx('crumple');
    const box = el('div', 'zdel');
    box.innerHTML = `<div class="zdel-anim" aria-hidden="true"><img alt="" src="${px('folder', 32)}"><i></i><img alt="" src="${px('bin', 32, { full: true })}"></div><p>Deleting...</p><div class="progress-indicator segmented"><span class="progress-indicator-bar" style="width:0%"></span></div>`;
    const bar = box.querySelector('.progress-indicator-bar');
    const pr = C.modal({ icon: 'info', caption: 'Deleting...', title: '', body: box, buttons: [{ label: 'Cancel', value: 'cancel' }] });
    let pct = 0, cancelled = false;
    pr.then(() => { cancelled = true; });
    await new Promise((res) => { const iv = setInterval(() => { pct = Math.min(99, pct + 7 + Math.random() * 9); bar.style.width = `${pct}%`; box.querySelector('p').textContent = `Deleting ${C.pick(items).name}...`; if (pct >= 99 || cancelled) { clearInterval(iv); res(); } }, calm() ? 40 : 160); });
    if (cancelled) return;
    document.querySelector('.curio-modal')?.remove();
    await C.modal({ icon: 'error', caption: 'Error Deleting File', title: '', body: `Cannot delete ${items[0].name}: Zob is still reading it.\n\nZob jumped in after the rest and pulled them out. Everything is back where it was.`, buttons: [{ label: 'OK', value: 'ok' }] });
    zobSay('I can\'t let you delete my diet plan. I\'m still on Tuesday.', 3600);
  }

  function openFind(q = '') {
    const ex = wins.find((x) => x.key === 'find');
    if (ex) { if (ex.state === 'min') restore(ex); focus(ex); return ex; }
    let input, scope, out, w;
    const run = () => {
      const raw = input.value.trim(), qq = raw.toLowerCase();
      const res = el('div');
      if (!qq) { out.replaceChildren(el('p', 'zx-empty', 'Type a name, or part of one, then press Find Now.')); w.setStatus('Ready'); return; }
      if (qq === '42') { C.unlock('answer'); out.replaceChildren(el('p', 'zx-empty', 'The answer, yes. Forty-two. But what was the question? Zob has been thinking about it since breakfast.')); w.setStatus('1 answer found'); return; }
      if (/^(secret|secrets|easter eggs?)$/.test(qq)) { out.replaceChildren(el('p', 'zx-empty', `Secrets are not searchable. That is what makes them secrets. There are ${C.secrets.length} of them, though.`)); w.setStatus('0 secrets found'); return; }
      if (qq === 'konami') { out.replaceChildren(el('p', 'zx-empty', 'Up, up, down, down... You know the rest. Not in here though. Try it on the desktop.')); return; }
      if (/^(zob|zoble|clippy|helper)$/.test(qq)) zobSay('you were looking for me? I\'m right here!', 2600);
      if (/^(lost|lost and found|found)$/.test(qq)) {
        C.unlock('lost');
        const b = el('button', 'zi'); b.type = 'button';
        b.append(Object.assign(new Image(16, 16), { src: px('box', 16), alt: '', className: 'z-px' }), Object.assign(el('span', 'zi-label'), { textContent: 'Lost and found' }));
        b.addEventListener('click', () => openPage('lost'));
        out.replaceChildren(b); w.setStatus('1 file found'); return;
      }
      const words = qq.split(/\s+/);
      const hits = games.filter((g) => (scope.value === 'all' || g.tag === scope.value)).map((g) => {
        const t = g.title.toLowerCase(), all = `${t} ${g.blurb.toLowerCase()} ${fname(g.tag).toLowerCase()} ${g.slug}`;
        const s = t === qq ? 100 : t.startsWith(qq) ? 90 : t.includes(qq) ? 70 : words.every((x) => all.includes(x)) ? 40 : 0;
        return [g, s];
      }).filter((x) => x[1]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
      const t = el('table', 'zx-table');
      t.innerHTML = '<thead><tr><th scope="col">Name</th><th scope="col">In Folder</th><th scope="col">About</th></tr></thead><tbody></tbody>';
      hits.forEach((g) => {
        const tr = el('tr');
        const td = el('td');
        const b = el('button', 'zi'); b.type = 'button';
        b.append(iconImg(gameItem(g), 16), Object.assign(el('span', 'zi-label'), { textContent: g.title }));
        b.addEventListener('click', () => openGame(g.slug));
        td.append(b); tr.append(td);
        tr.insertAdjacentHTML('beforeend', `<td>${esc(fname(g.tag))}</td><td>${esc(g.blurb)}</td>`);
        t.querySelector('tbody').append(tr);
      });
      out.replaceChildren(hits.length ? t : el('p', 'zx-empty', `Zob looked everywhere. Nothing matches "${esc(raw)}".`));
      void res;
      w.setStatus(`${hits.length} file${hits.length === 1 ? '' : 's'} found`);
    };
    w = openWindow({
      key: 'find', kind: 'find', title: 'Find: Games', icon: px('find', 16), w: 560, h: 400, minW: 300, minH: 260, status: true,
      menus: (win) => [
        { label: '&File', items: () => [{ label: '&Close', action: () => closeWin(win) }] },
        { label: '&Options', items: () => [{ label: '&Clear search', action: () => { input.value = ''; run(); input.focus(); } }] },
        { label: '&Help', items: () => [{ label: '&Help Topics', action: () => openHelp('find') }] }
      ],
      build: (win) => {
        const f = el('div', 'zf');
        f.innerHTML = `<div class="zf-top"><fieldset class="zf-q"><legend>Name &amp; Location</legend><div class="field-row-stacked"><label for="${win.id}q">Named:</label><input id="${win.id}q" type="search" autocomplete="off" spellcheck="false"></div><div class="field-row-stacked"><label for="${win.id}s">Look in:</label><span class="z-select"><select id="${win.id}s"><option value="all">My Games (all folders)</option>${TAGS.map((t) => `<option value="${t}">${esc(fname(t))}</option>`).join('')}</select></span></div></fieldset><div class="zf-btns"><button type="button" class="default" data-f="go">Find Now</button><button type="button" data-f="new">New Search</button><img alt="" src="${px('find', 32)}" class="z-px zf-anim"></div></div><div class="zf-out sunken-panel"></div>`;
        win.body.append(f);
        input = f.querySelector('input'); scope = f.querySelector('select'); out = f.querySelector('.zf-out');
        let t = 0;
        input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 120); });
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } });
        scope.addEventListener('change', run);
        f.querySelector('[data-f="go"]').addEventListener('click', run);
        f.querySelector('[data-f="new"]').addEventListener('click', () => { input.value = ''; run(); input.focus(); });
        win.focusTarget = () => input;
      }
    });
    if (q) input.value = q;
    run();
    setTimeout(() => input.focus(), 30);
    return w;
  }

  function openRun() {
    const wrap = el('div', 'zr');
    wrap.innerHTML = `<div class="zr-top"><img alt="" src="${px('run', 32)}" class="z-px"><p>Type the name of a game, folder or document, and Zoble will open it for you.</p></div><div class="field-row"><label for="zrun">Open:</label><input id="zrun" type="text" list="zrun-l" autocomplete="off" spellcheck="false" style="flex:1"></div><datalist id="zrun-l">${games.map((g) => `<option value="${esc(g.title)}">`).join('')}<option value="Readme.txt"><option value="Control Panel"><option value="Zoble Prompt"></datalist>`;
    const input = wrap.querySelector('input');
    input.value = store.get('hub:lastrun', '');
    setTimeout(() => { input.focus(); input.select(); }, 40);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); document.querySelector('.curio-modal .default')?.click(); } });
    C.modal({ icon: 'info', caption: 'Run', title: '', body: wrap, buttons: [{ label: 'OK', value: 'ok' }, { label: 'Cancel', value: 'cancel' }, { label: 'Browse...', value: 'browse' }] }).then((v) => {
      if (v === 'browse') { openFolder('games'); return; }
      if (v !== 'ok') return;
      const q = input.value.trim();
      if (!q) return;
      store.set('hub:lastrun', q);
      runCommand(q);
    });
  }
  function runCommand(q) {
    const s = q.toLowerCase().trim();
    if (/^(format|del|deltree|rm)\b/.test(s)) { C.modal({ icon: 'error', caption: 'ZobOS', title: '', body: 'Nice try.\n\nZob has hidden the hard drive under his bed.', buttons: [{ label: 'OK', value: 'ok' }] }); return true; }
    if (/^(cmd|command|prompt|dos|zoble prompt|terminal|shell)(\.exe|\.com)?$/.test(s)) { openPrompt(); return true; }
    if (/^(readme|readme\.txt|notepad)/.test(s)) { openReadme(); return true; }
    if (/^(control|control panel|settings)$/.test(s)) { openFolder('control'); return true; }
    if (/^(find|search)$/.test(s)) { openFind(); return true; }
    if (/^(help|winhelp|zoblehelp)$/.test(s)) { openHelp(); return true; }
    if (/^(secrets?|easter eggs?)$/.test(s)) { C.secretsWindow(); return true; }
    if (/^(backroom|back room|staff|staff only)$/.test(s)) { openPage('backroom'); return true; }
    if (/^(lost|lost and found)$/.test(s)) { C.unlock('lost'); openPage('lost'); return true; }
    if (/^(zob|zob\.exe|clippy)$/.test(s)) { showZob(true); zobSay('you rang?', 2400); return true; }
    if (/^(shutdown|shut down|exit|quit)$/.test(s)) { shutDown(); return true; }
    if (/^(random|surprise|dice|roll)$/.test(s)) { rollGame(); return true; }
    if (s === 'konami') { party(); return true; }
    if (/^(nothing|nothing\.exe)$/.test(s)) { runNothing(); return true; }
    if (/^(bin|recycle bin|recycled|trash)$/.test(s)) { openFolder('bin'); return true; }
    const f = Object.entries(FS).find(([, x]) => x.name.toLowerCase() === s || x.addr.toLowerCase() === s);
    if (f) { if (f[0] === 'desktop') focusDesktop(); else openFolder(f[0]); return true; }
    const g = findGame(s);
    if (g) { openGame(g.slug); return true; }
    C.modal({ icon: 'error', caption: q, title: '', body: `Cannot find the file '${q}' (or one of its components). Make sure the name is correct, then try again. To search for a game, open Start, then Find.`, buttons: [{ label: 'OK', value: 'ok' }] });
    return false;
  }

  function openPrompt() {
    const ex = wins.find((x) => x.key === 'prompt');
    if (ex) { if (ex.state === 'min') restore(ex); focus(ex); return ex; }
    let out, inp, cwd = 'C:\\';
    const lines = [];
    const print = (t = '') => { lines.push(...String(t).split('\n')); while (lines.length > 400) lines.shift(); out.textContent = lines.join('\n'); out.scrollTop = out.scrollHeight; };
    const w = openWindow({
      key: 'prompt', kind: 'prompt', title: 'Zoble Prompt', icon: px('prompt', 16), w: 600, h: 380, minW: 280, minH: 180, cls: 'zw-prompt',
      build: (win) => {
        const box = el('div', 'zc');
        out = el('pre', 'zc-out');
        out.setAttribute('aria-live', 'polite');
        const row = el('label', 'zc-row');
        row.innerHTML = '<span class="zc-ps"></span>';
        inp = el('input', 'zc-in');
        inp.type = 'text'; inp.autocomplete = 'off'; inp.spellcheck = false; inp.setAttribute('aria-label', 'Command');
        row.append(inp);
        box.append(out, row);
        win.body.append(box);
        win.focusTarget = () => inp;
        box.addEventListener('pointerdown', (e) => { if (e.target !== inp) setTimeout(() => inp.focus(), 0); });
        const ps = () => { row.querySelector('.zc-ps').textContent = `${cwd}>`; };
        ps();
        const hist = []; let hi = 0;
        inp.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowUp') { e.preventDefault(); if (hist.length) { hi = Math.max(0, hi - 1); inp.value = hist[hi]; } return; }
          if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || ''; return; }
          if (e.key !== 'Enter') return;
          e.preventDefault();
          const cmd = inp.value; inp.value = ''; hist.push(cmd); hi = hist.length;
          print(`${cwd}>${cmd}`);
          exec(cmd.trim());
          ps();
        });
        win.data.ps = ps;
      }
    });
    function exec(c) {
      if (!c) return;
      const [head, ...rest] = c.split(/\s+/);
      const h = head.toLowerCase(), arg = rest.join(' ');
      C.unlock('prompt');
      if (h === 'help' || h === '?') print('Commands:\n  DIR            list the games in this folder\n  CD <folder>    change folder (CD .. to go up)\n  PLAY <game>    open a game\n  RANDOM         open a random game\n  CLS            clear the screen\n  VER            show the version\n  DATE, TIME     what it says\n  ZOB            say hello\n  SECRETS        how many you found\n  EXIT           close this window');
      else if (h === 'cls') { lines.length = 0; out.textContent = ''; }
      else if (h === 'ver') print('\nZobOS [Version 2.0, Zob\'s edition]\n');
      else if (h === 'date') print(`The current date is: ${new Date().toDateString()}`);
      else if (h === 'time') print(`The current time is: ${new Date().toLocaleTimeString()}`);
      else if (h === 'zob') print('  (o)  hi! I live in here too. Mind the cables.');
      else if (h === 'secrets') print(`${Object.keys(C.found()).length} of ${C.secrets.length} secrets found.`);
      else if (h === 'exit') closeWin(w);
      else if (h === 'echo') print(arg);
      else if (h === 'random') { print('Rolling the die...'); rollGame(); }
      else if (h === 'cd' || h === 'chdir') {
        if (!arg || arg === '\\') cwd = 'C:\\';
        else if (arg === '..') cwd = cwd.split('\\').slice(0, -2).join('\\') + '\\' || 'C:\\';
        else {
          const target = arg.toLowerCase().replace(/[\\/]$/, '');
          const t = cwd === 'C:\\' ? (target === 'my games' || target === 'mygames' || target === 'games' ? 'C:\\My Games\\' : null) : TAGS.map((x) => fname(x)).find((n) => n.toLowerCase() === target || n.toLowerCase().replace(/\s+/g, '') === target.replace(/\s+/g, '')) ? `C:\\My Games\\${TAGS.map((x) => fname(x)).find((n) => n.toLowerCase() === target || n.toLowerCase().replace(/\s+/g, '') === target.replace(/\s+/g, ''))}\\` : null;
          if (t) cwd = t; else print('Invalid directory');
        }
        if (cwd === 'C:') cwd = 'C:\\';
      } else if (h === 'dir' || h === 'ls') {
        const parts = cwd.split('\\').filter(Boolean);
        let rows = [];
        if (parts.length === 1) rows = ['MY GAMES     <DIR>', 'RECYCLED     <DIR>', 'README   TXT      2,048', 'NOTHING  EXE          0'];
        else if (parts.length === 2) rows = TAGS.map((t) => `${fname(t).toUpperCase().padEnd(16)} <DIR>`);
        else { const tag = TAGS.find((t) => fname(t) === parts[2]); rows = games.filter((g) => g.tag === tag).map((g) => `${g.slug.toUpperCase().slice(0, 8).padEnd(9)}EXE   ${g.title}`); }
        print(` Volume in drive C is ZOBS DISK\n Directory of ${cwd}\n\n${rows.join('\n')}\n       ${rows.length} file(s)`);
      } else if (h === 'play' || h === 'start' || h === 'run') {
        const g = findGame(arg);
        if (g) { print(`Starting ${g.title}...`); openGame(g.slug); } else print(`Bad command or file name: ${arg}`);
      } else if (/^(format|del|deltree|rm)$/.test(h)) print('Nice try. Zob has hidden the hard drive under his bed.');
      else {
        const g = findGame(c);
        if (g) { print(`Starting ${g.title}...`); openGame(g.slug); }
        else print('Bad command or file name');
      }
    }
    if (!out.textContent) print('ZobOS Prompt\n(C) Zob, all rights reserved. Type HELP for a list of commands.\n');
    setTimeout(() => w.focusTarget?.()?.focus(), 40);
    return w;
  }

  const HELP = {
    welcome: ['Welcome to ZobOS', `ZobOS runs on Zob\'s computer, the one on the desk. There are ${games.length} games and toys on it. Everything is free, there are no accounts and no ads.\n\nStart with Zoble Explorer: every game with its picture, a pick of the day, search and kinds. Or press the Zob button and open Programs.`],
    desktop: ['Using the desktop', 'Click an icon to open it. (You can switch to double-click in Control Panel, Mouse.)\n\nDrag a window by its title bar, resize it from its edges and corners, minimize it to the taskbar or maximize it to fill the screen. Double-click a title bar to maximize it.\n\nRight-click works too, but everything it does is also in the menus.'],
    games: ['Playing games', 'Games fill Zob\'s screen. You can have several open at once and switch on the taskbar. Double-click the title bar (or press the middle button) to put a game in a window you can move and resize. Control Panel, Games makes windows the default.\n\nThe Game menu restarts a game, picks a random one or adds it to your Favourites. Want a game to fill the whole browser? Choose Game, Open in its own tab.'],
    modes: ['Simple and Advanced', 'Every game has two versions. Simple is quick and easy to pick up. Advanced has every mode, stat and setting.\n\nSwitch in a game window from View, Simple or Advanced. Pick what new games start in from Control Panel, Games.'],
    touchpad: ['Touchpad mode', 'Turn on Touchpad mode from the little pad icon in the taskbar, or Control Panel, Mouse.\n\nThen any drag works as click to grab, move, click to drop. Window title bars and edges work that way too. Esc lets go.'],
    keys: ['Keyboard shortcuts', 'Ctrl+Esc: open the Zob menu\nAlt+X: close the active window\nF10: the menu bar of the active window\nArrows and Enter: move between icons and open them\nBackspace: up one folder\nEsc: close a menu'],
    find: ['Finding a game', 'Open Start, then Find. Type part of a name or a word like "space", "draw" or "puzzle". Results appear as you type.\n\nYou can also use Run and type a game name.'],
    secrets: ['Secrets', `There are ${C.secrets.length} secrets hidden on Zob\'s screen and around his desk. Open the desk drawer, or Control Panel, Secrets, to see the ones you found and a hint for each of the rest.`],
    privacy: ['Privacy', 'Scores, favourites, settings and secrets are kept in this browser only. Nothing is sent anywhere. Clearing your browser data, or Control Panel, Data, wipes it.']
  };
  function openHelp(topic = 'welcome') {
    const ex = wins.find((x) => x.key === 'help');
    if (ex) { if (ex.state === 'min') restore(ex); focus(ex); ex.showTopic?.(topic); return ex; }
    let cur = HELP[topic] ? topic : 'welcome', text;
    const w = openWindow({
      key: 'help', kind: 'help', title: 'Zoble Help', icon: px('help', 16), w: 600, h: 420, minW: 300, minH: 220,
      build: (win) => {
        const box = el('div', 'zh');
        const nav = el('ul', 'tree-view zh-nav');
        nav.innerHTML = Object.entries(HELP).map(([k, [t]]) => `<li><button type="button" data-k="${k}"><img alt="" src="${px('help', 16)}"><span>${esc(t)}</span></button></li>`).join('');
        text = el('div', 'zh-text sunken-panel');
        box.append(nav, text);
        win.body.append(box);
        nav.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { C.sfx('click'); show(b.dataset.k); } });
        win.focusTarget = () => nav.querySelector('.is-sel') || nav.querySelector('button');
      },
      onReopen: (o) => { void o; }
    });
    function show(k) {
      cur = k;
      const [t, b] = HELP[k];
      text.innerHTML = `<h2>${esc(t)}</h2>${b.split('\n\n').map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('')}`;
      w.el.querySelectorAll('.zh-nav button').forEach((x) => x.classList.toggle('is-sel', x.dataset.k === k));
    }
    show(cur);
    w.showTopic = show;
    return w;
  }

  function openClock() {
    let raf = 0, cv;
    const w = openWindow({
      key: 'clock', kind: 'clock', title: 'Date/Time Properties', icon: px('clock', 16), w: 420, h: 320, minW: 300, minH: 260, resizable: true,
      build: (win) => {
        const box = el('div', 'zt-clock');
        const d = new Date();
        const first = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
        const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        let cells = '';
        for (let i = 0; i < first; i++) cells += '<td></td>';
        for (let i = 1; i <= days; i++) { cells += `<td${i === d.getDate() ? ' class="is-today"' : ''}>${i}</td>`; if ((first + i) % 7 === 0) cells += '</tr><tr>'; }
        box.innerHTML = `<fieldset><legend>Date</legend><p><b>${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}</b></p><table class="zt-cal"><thead><tr>${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((x) => `<th>${x}</th>`).join('')}</tr></thead><tbody><tr>${cells}</tr></tbody></table></fieldset><fieldset><legend>Time</legend><canvas width="96" height="96" aria-label="Clock"></canvas><p class="zt-now"></p></fieldset>`;
        win.body.append(box);
        cv = box.querySelector('canvas');
        const g = cv.getContext('2d');
        const tick = () => {
          const t = new Date();
          g.fillStyle = getComputedStyle(html).getPropertyValue('--z-win') || '#fff';
          g.fillRect(0, 0, 96, 96);
          for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.fillStyle = i % 3 ? '#808080' : '#008080'; g.fillRect(Math.round(48 + Math.sin(a) * 40) - (i % 3 ? 1 : 2), Math.round(48 - Math.cos(a) * 40) - (i % 3 ? 1 : 2), i % 3 ? 2 : 4, i % 3 ? 2 : 4); }
          const hand = (a, len, col, wd) => { for (let r = 0; r < len; r++) { g.fillStyle = col; g.fillRect(Math.round(48 + Math.sin(a) * r) - (wd >> 1), Math.round(48 - Math.cos(a) * r) - (wd >> 1), wd, wd); } };
          hand((t.getHours() % 12 + t.getMinutes() / 60) * Math.PI / 6, 22, '#000080', 3);
          hand((t.getMinutes() + t.getSeconds() / 60) * Math.PI / 30, 32, '#000080', 2);
          hand(t.getSeconds() * Math.PI / 30, 36, '#e00000', 1);
          box.querySelector('.zt-now').textContent = t.toLocaleTimeString();
          raf = setTimeout(tick, 1000);
        };
        tick();
      },
      onClose: () => clearTimeout(raf)
    });
    void cv;
    return w;
  }

  function aboutZoble() {
    const n = Object.keys(C.found()).length;
    C.modal({ icon: 'info', caption: 'About ZobOS', title: 'ZobOS', body: `Version 2.0, Zob\'s edition\n\n${games.length} games and toys, ${TAGS.length} folders, one Zob.\n${n} of ${C.secrets.length} secrets found.\n\nMade by hand. No ads, no accounts, no tracking. This product is licensed to: you.`, buttons: [{ label: 'OK', value: 'ok' }] });
  }

  async function zobleUpdate() {
    const box = el('div');
    box.innerHTML = '<p>Connecting to the Zoble Update server...</p><div class="progress-indicator"><span class="progress-indicator-bar" style="width:0%"></span></div>';
    const bar = box.querySelector('.progress-indicator-bar');
    let done = false;
    const pr = C.modal({ icon: 'info', caption: 'Zoble Update', title: '', body: box, buttons: [{ label: 'Cancel', value: 'cancel' }] });
    pr.then(() => { done = true; });
    for (let i = 0; i <= 20 && !done; i++) { bar.style.width = `${i * 5}%`; if (i === 8) box.querySelector('p').textContent = 'Checking for updates...'; if (i === 15) box.querySelector('p').textContent = 'Asking Zob...'; await new Promise((r) => setTimeout(r, calm() ? 20 : 110)); }
    if (done) return;
    document.querySelector('.curio-modal')?.remove();
    C.modal({ icon: 'info', caption: 'Zoble Update', title: 'ZobOS is up to date.', body: 'It has been up to date since Zob last dusted it. New games arrive in the New Arrivals folder all by themselves.', buttons: [{ label: 'OK', value: 'ok' }] });
  }

  let rolling = false;
  function rollGame(pool) {
    if (rolling) return;
    refreshData();
    pool = (pool && pool.length ? pool : games).filter(Boolean);
    const fresh = pool.filter((g) => !played[g.slug]);
    const g = C.pick(fresh.length ? fresh : pool);
    const rolls = store.get('hub:rolls', 0) + 1;
    store.set('hub:rolls', rolls);
    if (rolls >= 5) C.unlock('roller');
    rolling = true;
    C.sfx('roll');
    const box = el('div', 'zroll');
    box.innerHTML = `<img class="z-px zroll-ico" alt="" src="${px('die', 32)}"><div><b>Rolling the die...</b><p></p></div>`;
    const pr = C.modal({ icon: 'info', caption: 'Surprise me', title: '', body: box, buttons: [{ label: 'Play', value: 'go' }, { label: 'Roll again', value: 'again' }, { label: 'Cancel', value: 'cancel' }] });
    let k = 0;
    const names = C.shuffle(pool).slice(0, 10);
    const iv = setInterval(() => { box.querySelector('b').textContent = names[k++ % names.length].title; C.sfx('blip', k); }, calm() ? 10 : 80);
    setTimeout(() => {
      clearInterval(iv);
      box.querySelector('b').textContent = g.title;
      box.querySelector('p').textContent = g.blurb;
      C.gameIcon(g.slug, 32).then((u) => { box.querySelector('img').src = u; });
      C.sfx('stamp');
      rolling = false;
    }, calm() ? 20 : 820);
    pr.then((v) => { clearInterval(iv); rolling = false; if (v === 'go') openGame(g.slug); else if (v === 'again') setTimeout(() => rollGame(pool.length === games.length ? null : pool), 60); });
  }

  let nothingN = 0;
  function runNothing() {
    nothingN++;
    const words = ['Nothing.exe has started successfully.\n\nIt is now doing nothing.', 'Nothing.exe is already running. It is doing nothing very well.', 'Still nothing.', 'Nope. Nothing.', 'You are very persistent.', 'Fine. Have a secret.'];
    C.modal({ icon: nothingN >= 5 ? 'info' : 'info', caption: 'Nothing.exe', title: '', body: words[Math.min(nothingN - 1, words.length - 1)], buttons: [{ label: 'OK', value: 'ok' }] });
    if (nothingN >= 5) C.unlock('nothing');
  }

  function deskItems() {
    const sys = [
      { id: 'd:explorer', name: 'Zoble Explorer', kind: 'app', icon: () => px('globe', 32), icon16: () => px('globe', 16), open: (f) => openExplorer({ from: f }) },
      { id: 'd:games', name: 'My Games', kind: 'folder', path: 'games', icon: () => px('computer', 32), icon16: () => px('computer', 16), open: (f) => openFolder('games', { from: f }) },
      { id: 'd:favs', name: 'Favourites', kind: 'folder', path: 'favs', icon: () => px('favs', 32), icon16: () => px('favs', 16), open: (f) => openFolder('favs', { from: f }) },
      { id: 'd:recent', name: 'Recently Played', kind: 'folder', path: 'recent', icon: () => px('recent', 32), icon16: () => px('recent', 16), open: (f) => openFolder('recent', { from: f }) },
      { id: 'd:bin', name: 'Recycle Bin', kind: 'folder', path: 'bin', icon: () => folderIcon('bin', 32), icon16: () => folderIcon('bin', 16), open: (f) => openFolder('bin', { from: f }) },
      { id: 'd:readme', name: 'Readme.txt', kind: 'file', icon: () => px('notepad', 32), icon16: () => px('notepad', 16), open: (f) => openReadme({ from: f }) },
      { id: 'd:control', name: 'Control Panel', kind: 'folder', path: 'control', icon: () => px('control', 32), icon16: () => px('control', 16), open: (f) => openFolder('control', { from: f }) },
      { id: 'd:secrets', name: 'Secrets', kind: 'app', icon: () => px('trophy', 32), icon16: () => px('trophy', 16), open: () => C.secretsWindow() },
      { id: 'd:roll', name: 'Surprise Me', kind: 'app', icon: () => px('die', 32), icon16: () => px('die', 16), open: () => rollGame() },
      { id: 'd:zob', name: 'Zob', kind: 'app', icon: () => px('zob', 32), icon16: () => px('zob', 16), open: () => { showZob(true); zobPoke(); } },
      { id: 'd:prompt', name: 'Zoble Prompt', kind: 'app', icon: () => C.overlayShortcut(px('prompt', 32), 32), icon16: () => px('prompt', 16), open: () => openPrompt() },
      { id: 'd:nothing', name: 'Nothing.exe', kind: 'app', icon: () => px('nothing', 32), icon16: () => px('nothing', 16), open: runNothing }
    ];
    const cats = TAGS.map((t) => ({ id: `d:${t}`, name: fname(t), kind: 'folder', path: `games/${t}`, icon: () => C.folderIcon(t, 32), icon16: () => C.folderIcon(t, 16), open: (f) => openFolder(`games/${t}`, { from: f }) }));
    return [...sys, ...cats];
  }

  const iconsEl = $('icons');
  let deskSel = null;
  function renderDesk() {
    iconsEl.replaceChildren();
    deskItems().forEach((it, i) => {
      const b = el('button', 'di');
      b.type = 'button';
      b.dataset.id = it.id;
      b.tabIndex = i === 0 ? 0 : -1;
      b._item = it;
      const img = new Image(32, 32);
      img.alt = ''; img.className = 'z-px'; img.draggable = false;
      const v = it.icon();
      if (v && v.then) { img.src = px('app', 32); v.then((u) => { img.src = u; }); } else img.src = v;
      const s = el('span', 'di-label'); s.textContent = it.name;
      b.append(img, s);
      b.setAttribute('aria-label', it.name);
      b.addEventListener('click', (e) => {
        if (C.prefs.clicks === 'double' && e.detail < 2 && e.pointerType !== 'touch') { selectDesk(b); return; }
        selectDesk(b); openDesk(b);
      });
      b.addEventListener('dblclick', () => { if (C.prefs.clicks === 'double') openDesk(b); });
      b.addEventListener('focus', () => selectDesk(b, true));
      b.addEventListener('contextmenu', (e) => {
        e.preventDefault(); e.stopPropagation(); selectDesk(b);
        C.menu.open([{ label: '&Open', action: () => openDesk(b) }, ...(it.kind === 'folder' ? [{ label: '&Explore', action: () => openFolder(it.path) }] : []), { sep: true }, { label: 'P&roperties', action: () => props(it.path ? folderItem(it.path) : { name: it.name, type: it.kind === 'file' ? 'Text Document' : 'Program', blurb: it.id === 'd:nothing' ? 'Does nothing. Very well.' : '', icon32: it.icon, icon16: it.icon16 }) }], { x: e.clientX, y: e.clientY, reserve: tbH() });
      });
      iconsEl.append(b);
    });
    layoutIcons();
  }
  function openDesk(b) {
    C.sfx('click');
    const r = b.querySelector('img').getBoundingClientRect();
    b._item.open(r);
  }
  function selectDesk(b, quiet) {
    iconsEl.querySelectorAll('.di.is-sel').forEach((x) => { x.classList.remove('is-sel'); x.tabIndex = -1; });
    b.classList.add('is-sel'); b.tabIndex = 0; deskSel = b;
    if (!quiet) b.focus({ preventScroll: true });
  }
  function layoutIcons() {
    const h = screenEl.clientHeight - tbH() - 16;
    const row = html.dataset.skin === 'classic' ? 78 : 86;
    iconsEl.style.setProperty('--rows', String(Math.max(3, Math.floor(h / row))));
  }
  iconsEl.addEventListener('keydown', (e) => {
    const all = [...iconsEl.querySelectorAll('.di')];
    const i = all.indexOf(document.activeElement);
    if (i < 0) return;
    const colMajor = getComputedStyle(iconsEl).gridAutoFlow.startsWith('column');
    const rows = colMajor ? parseInt(iconsEl.style.getPropertyValue('--rows'), 10) || 8 : 1;
    const perRow = colMajor ? 1 : Math.max(1, Math.round(iconsEl.clientWidth / (all[0].offsetWidth || 76)));
    let j = i;
    if (e.key === 'ArrowDown') j = colMajor ? i + 1 : i + perRow;
    else if (e.key === 'ArrowUp') j = colMajor ? i - 1 : i - perRow;
    else if (e.key === 'ArrowRight') j = colMajor ? i + rows : i + 1;
    else if (e.key === 'ArrowLeft') j = colMajor ? i - rows : i - 1;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = all.length - 1;
    else if (e.key === 'Enter') { e.preventDefault(); openDesk(all[i]); return; }
    else if ((e.shiftKey && e.key === 'F10') || e.key === 'ContextMenu') { e.preventDefault(); all[i].dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: all[i].getBoundingClientRect().left + 20, clientY: all[i].getBoundingClientRect().bottom })); return; }
    else if (e.key.length === 1 && /[a-z]/i.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) { const order = [...all.slice(i + 1), ...all.slice(0, i + 1)]; const hit = order.find((x) => x._item.name.toLowerCase().startsWith(e.key.toLowerCase())); if (hit) { e.preventDefault(); selectDesk(hit); } return; }
    else return;
    e.preventDefault();
    j = Math.max(0, Math.min(all.length - 1, j));
    selectDesk(all[j]);
  });
  function focusDesktop() {
    wins.filter((w) => w.state !== 'min').forEach((w) => minimize(w));
    blurAll();
    (deskSel || iconsEl.querySelector('.di'))?.focus({ preventScroll: true });
  }
  desk.addEventListener('pointerdown', (e) => {
    if (e.target === desk || e.target.id === 'deskbg' || e.target === iconsEl || e.target === layer) {
      iconsEl.querySelectorAll('.di.is-sel').forEach((x) => x.classList.remove('is-sel'));
      blurAll();
    }
  });
  desk.addEventListener('contextmenu', (e) => {
    if (!(e.target === desk || e.target.id === 'deskbg' || e.target === iconsEl || e.target === layer)) return;
    e.preventDefault();
    C.menu.open([
      { label: 'Arrange &Icons', sub: () => [{ label: 'by &Name', action: () => { arrange('name'); } }, { label: 'by &Type', action: () => arrange('type') }] },
      { label: 'Line &up Icons', action: () => renderDesk() },
      { sep: true },
      { label: '&Refresh', accel: 'F5', action: () => refreshAll() },
      { sep: true },
      { label: 'Ne&w', sub: () => [{ label: '&Folder', icon: px('folder', 16), action: () => C.modal({ icon: 'warn', caption: 'New Folder', title: '', body: 'Zob tried to make a new folder here once. It ended up full of crumbs. Folders are made by hand in ZobOS.', buttons: [{ label: 'OK', value: 'ok' }] }) }, { label: '&Text Document', icon: px('doc', 16), action: () => openNotepad('New Text Document.txt', '') }] },
      { sep: true },
      { label: 'P&roperties', action: () => C.settings(null, { tab: 'desk' }) }
    ], { x: e.clientX, y: e.clientY, reserve: tbH() });
  });
  function arrange(by) {
    const all = [...iconsEl.querySelectorAll('.di')];
    all.sort((a, b) => (by === 'type' ? (a._item.kind + a._item.name).localeCompare(b._item.kind + b._item.name) : a._item.name.localeCompare(b._item.name)));
    iconsEl.append(...all);
    C.sfx('paper');
  }

  function refreshAll() {
    refreshData();
    wins.forEach((w) => w.refresh?.());
    const bin = iconsEl.querySelector('[data-id="d:bin"] img');
    if (bin) bin.src = folderIcon('bin', 32);
  }

  const startBtn = $('start');
  $('startlogo').src = px('start', 16);
  if (M === 3 && D === 1) { $('startword').textContent = 'Boz'; }
  let startOpen = false;
  function startItems() {
    refreshData();
    const gameList = (list) => list.map((g) => ({ label: g.title.replace(/&/g, '&&'), icon: px('app', 16), iconAsync: C.gameIcon(g.slug, 16), title: g.blurb, action: () => openGame(g.slug) }));
    const recent = games.filter((g) => played[g.slug]).sort((a, b) => played[b.slug] - played[a.slug]).slice(0, 15);
    const favList = games.filter((g) => favs[g.slug]).sort((a, b) => favs[b.slug] - favs[a.slug]);
    const def = store.get('modeDefault', 'simple') === 'advanced' ? 'advanced' : 'simple';
    return [
      { label: 'Zoble &Explorer', icon: px('globe', 32), action: () => openExplorer() },
      { label: 'Zoble &Update', icon: px('star', 32), action: zobleUpdate },
      { sep: true },
      { label: '&Programs', icon: px('programs', 32), sub: () => [
        ...TAGS.map((t) => ({ label: fname(t).replace(/&/g, '&&'), icon: C.folderIcon(t, 16), sub: () => gameList(games.filter((g) => g.tag === t).sort((a, b) => a.title.localeCompare(b.title))) })),
        { sep: true },
        { label: 'Accessories', icon: px('folder', 16), sub: () => [
          { label: 'Notepad', icon: px('notepad', 16), action: () => openNotepad('Untitled', '') },
          { label: 'Zoble Prompt', icon: px('prompt', 16), action: openPrompt },
          { label: 'Date and Time', icon: px('clock', 16), action: openClock },
          { label: 'Nothing.exe', icon: px('nothing', 16), action: runNothing }
        ] },
        { label: 'Zob', icon: px('zob', 16), action: () => { showZob(true); zobPoke(); } }
      ] },
      { label: '&Favourites', icon: px('favs', 32), sub: () => (favList.length ? [...gameList(favList), { sep: true }, { label: 'Open Favourites folder', icon: px('favs', 16), action: () => openFolder('favs') }] : [{ label: '(Empty: add some from a game\'s menu)', disabled: true }]) },
      { label: '&Documents', icon: px('documents', 32), sub: () => [{ label: 'Readme.txt', icon: px('notepad', 16), action: () => openReadme() }, { sep: true }, ...(recent.length ? gameList(recent) : [{ label: '(Nothing played yet)', disabled: true }])] },
      { label: '&Settings', icon: px('settings', 32), sub: () => [
        { label: '&Control Panel', icon: px('control', 16), action: () => openFolder('control') },
        { label: '&Display', icon: px('display', 16), action: () => C.settings(null, { tab: 'display' }) },
        { label: 'Des&ktop', icon: px('wallpaper', 16), action: () => C.settings(null, { tab: 'desk' }) },
        { label: '&Sound', icon: px('sound', 16), action: () => C.settings(null, { tab: 'sound' }) },
        { label: '&Mouse and touchpad', icon: px('mouse', 16), action: () => C.settings(null, { tab: 'mouse' }) },
        { sep: true },
        { label: 'New games start in', icon: px('gamepad', 16), sub: () => [
          { label: '&Simple', radio: true, checked: def === 'simple', action: () => { store.set('modeDefault', 'simple'); C.balloon('New games will open in Simple mode: quick and easy.', { ms: 2200 }); } },
          { label: '&Advanced', radio: true, checked: def === 'advanced', action: () => { store.set('modeDefault', 'advanced'); C.balloon('New games will open in Advanced mode: every mode, stat and setting.', { ms: 2200 }); } }
        ] },
        { label: 'Colour &scheme', icon: px('display', 16), sub: C.schemeItems }
      ] },
      { label: 'F&ind', icon: px('find', 32), sub: () => [
        { label: '&Games...', icon: px('find', 16), action: () => openFind() },
        { label: '&Secrets...', icon: px('trophy', 16), action: () => C.secretsWindow() },
        { label: '&Lost things...', icon: px('box', 16), action: () => { C.unlock('lost'); openPage('lost'); } }
      ] },
      { label: '&Help', icon: px('help', 32), action: () => openHelp() },
      { label: '&Run...', icon: px('run', 32), action: openRun },
      { sep: true },
      { label: 'Sh&ut Down...', icon: px('shutdown', 32), action: shutDown }
    ];
  }
  let tune = [];
  function toggleStart(force, kb, from) {
    const want = force ?? !startOpen;
    if (!want) { C.menu.closeAll(); return; }
    startOpen = true;
    startBtn.setAttribute('aria-expanded', 'true');
    startBtn.classList.add('is-on');
    C.sfx('menu');
    const rec = C.menu.open(startItems(), {
      anchor: (from || startBtn).getBoundingClientRect(), side: 'up', opener: from || startBtn, big: true, label: 'Zob menu', focus: !!kb,
      banner: 'Zoble<b>OS</b>', className: 'z-start', reserve: tbH(),
      onClose: () => { startOpen = false; startBtn.setAttribute('aria-expanded', 'false'); startBtn.classList.remove('is-on'); }
    });
    const ban = rec.el.querySelector('.z-menu__banner span');
    if (ban) {
      ban.innerHTML = '<i>Z</i><i>o</i><i>b</i><i>l</i><i>e</i><b>OS</b>';
      ban.parentElement.removeAttribute('aria-hidden');
      ban.parentElement.setAttribute('role', 'presentation');
      ban.querySelectorAll('i').forEach((s, i) => {
        s.addEventListener('pointerenter', () => C.sfx('note', i + 3));
        s.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          C.sfx('note', i + 5);
          s.classList.remove('boing'); void s.offsetWidth; s.classList.add('boing');
          tune = tune.concat(i).slice(-5);
          if (tune.join('') === '01234') { tune = []; C.unlock('composer'); C.confetti(80); zobSay('bravo! encore!', 2400); }
        });
      });
    }
  }
  startBtn.addEventListener('pointerdown', (e) => { if (startOpen) { e.stopPropagation(); } });
  startBtn.addEventListener('click', () => { if (startOpen) { C.menu.closeAll(); } else toggleStart(true); });

  const quick = $('quick');
  [['computer', 'Show Desktop', focusDesktop], ['globe', 'Zoble Explorer', () => openExplorer()], ['die', 'Surprise me', () => rollGame()]].forEach(([ic, label, fn]) => {
    const b = el('button', 'qb');
    b.type = 'button';
    b.innerHTML = `<img alt="" width="16" height="16" src="${px(ic, 16)}">`;
    b.setAttribute('aria-label', label);
    C.tooltip(b, label);
    b.addEventListener('click', () => { C.sfx('click'); fn(); });
    quick.append(b);
  });

  const tray = $('tray');
  tray.innerHTML = '<button type="button" class="tr-b" data-t="zob"><img alt="" width="16" height="16"></button><button type="button" class="tr-b" data-t="pad"><img alt="" width="16" height="16"></button><button type="button" class="tr-b" data-t="vol"><img alt="" width="16" height="16"></button><button type="button" class="tr-clock" data-t="clock"></button>';
  const trZob = tray.querySelector('[data-t="zob"]'), trPad = tray.querySelector('[data-t="pad"]'), trVol = tray.querySelector('[data-t="vol"]'), clock = tray.querySelector('[data-t="clock"]');
  trZob.querySelector('img').src = px('zob', 16);
  function paintTray() {
    trVol.querySelector('img').src = px('sound', 16, { muted: C.muted });
    trVol.setAttribute('aria-label', C.muted ? 'Volume: muted' : 'Volume');
    trPad.querySelector('img').src = px('touchpad', 16, { on: C.touchpad });
    trPad.setAttribute('aria-pressed', String(C.touchpad));
    trPad.setAttribute('aria-label', 'Touchpad mode');
    trZob.setAttribute('aria-pressed', String(C.prefs.zob !== false));
    trZob.setAttribute('aria-label', 'Zob the helper');
  }
  paintTray();
  C.tooltip(trVol, () => (C.muted ? 'Sound is off' : 'Volume'));
  C.tooltip(trPad, () => (C.touchpad ? 'Touchpad mode is on: click to grab, click to drop' : 'Touchpad mode is off'));
  C.tooltip(trZob, () => (C.prefs.zob !== false ? 'Hide Zob' : 'Show Zob'));
  C.tooltip(clock, () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  window.addEventListener('curio:sound', paintTray);
  window.addEventListener('curio:touchpad', paintTray);
  window.addEventListener('curio:prefs', () => { paintTray(); applyDesk(); syncZob(); });
  trPad.addEventListener('click', () => { C.setTouchpad(!C.touchpad); C.sfx(C.touchpad ? 'on' : 'off'); C.balloon(C.touchpad ? 'Touchpad mode on: click a title bar to grab a window, click again to drop it.' : 'Touchpad mode off.', { title: 'Touchpad', icon: 'touchpad', ms: 3000 }); });
  trZob.addEventListener('click', () => { C.sfx('click'); showZob(C.prefs.zob === false); });
  trVol.addEventListener('click', () => {
    const r = trVol.getBoundingClientRect();
    const pop = el('div', 'zvol z98 window');
    pop.innerHTML = `<p>Volume</p><input type="range" min="0" max="100" step="5" aria-label="Volume" class="zvol-r"><span class="curio-opt"><input type="checkbox" id="zvolm"><label for="zvolm">Mute</label></span>`;
    const rng = pop.querySelector('input[type=range]'), mute = pop.querySelector('#zvolm');
    rng.value = Math.round(C.prefs.volume * 100); mute.checked = C.muted;
    rng.addEventListener('input', () => C.setPref('volume', rng.value / 100));
    rng.addEventListener('change', () => { if (C.muted) C.setMuted(false); mute.checked = C.muted; C.sfx('ding'); });
    mute.addEventListener('change', () => { C.setMuted(mute.checked); if (!mute.checked) C.sfx('ding'); });
    document.body.append(pop);
    const pr = pop.getBoundingClientRect();
    pop.style.left = `${Math.max(4, Math.min(innerWidth - pr.width - 4, r.left + r.width / 2 - pr.width / 2))}px`;
    pop.style.top = `${r.top - pr.height - 4}px`;
    rng.focus();
    const off = (e) => { if (!pop.contains(e.target) && e.target !== trVol) { pop.remove(); document.removeEventListener('pointerdown', off, true); document.removeEventListener('keydown', esc2, true); } };
    const esc2 = (e) => { if (e.key === 'Escape') { pop.remove(); document.removeEventListener('pointerdown', off, true); document.removeEventListener('keydown', esc2, true); trVol.focus(); } };
    setTimeout(() => { document.addEventListener('pointerdown', off, true); document.addEventListener('keydown', esc2, true); }, 0);
  });
  let warp = 0;
  function paintClock() {
    if (warp > Date.now()) return;
    clock.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  paintClock();
  setInterval(paintClock, 10000);
  clock.addEventListener('click', (e) => {
    if (e.detail === 3) {
      clearTimeout(clock._t);
      warp = Date.now() + 3200;
      clock.textContent = C.pick(['25:61 PM', '13:99 AM', '00:00 ZM', '88:88']);
      clock.classList.add('is-warp');
      C.sfx('stamp');
      C.balloon('Somebody bumped the clock. Time is a bit loose today.', { ms: 2600 });
      C.unlock('misprint');
      setTimeout(() => { clock.classList.remove('is-warp'); warp = 0; paintClock(); }, 3200);
    } else if (e.detail === 2) { clearTimeout(clock._t); clock._t = setTimeout(openClock, 320); }
  });
  clock.addEventListener('pointerdown', (e) => { if (e.detail >= 3) clearTimeout(clock._t); });

  const deskBg = $('deskbg');
  const WALLS = [
    ['none', '(None)'], ['sprinkles', 'Sprinkles'], ['doodles', 'Zob Doodles'], ['zigzag', 'Zig Zag'], ['bricks', 'Bricks'], ['checks', 'Checkers'], ['weave', 'Weave'], ['dots', 'Polka'], ['zobs', 'Zob Tiles'], ['stars', 'Starry Night'], ['waves', 'Waves'], ['clouds', 'Puffy Clouds']
  ];
  function wallpaper(id, desk0) {
    const c = document.createElement('canvas');
    const shade = (hex, f) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; r = Math.max(0, Math.min(255, Math.round(r * f))); g = Math.max(0, Math.min(255, Math.round(g * f))); b = Math.max(0, Math.min(255, Math.round(b * f))); return `rgb(${r},${g},${b})`; };
    const dk = shade(desk0, 0.78), lt = shade(desk0, 1.22);
    const sz = { sprinkles: 48, doodles: 96, zigzag: 16, bricks: 16, checks: 16, weave: 8, dots: 12, zobs: 48, stars: 96, waves: 32, clouds: 128 }[id] || 8;
    c.width = c.height = sz;
    const g = c.getContext('2d');
    g.fillStyle = desk0; g.fillRect(0, 0, sz, sz);
    const p = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    if (id === 'sprinkles') {
      const cols = ['#ff86b2', '#ffcf3a', '#7fd9b0', '#ffffff', '#9ab0ff'];
      [[6, 8, 0], [30, 4, 1], [18, 22, 2], [40, 28, 3], [8, 38, 4], [26, 40, 0], [44, 14, 2], [14, 30, 1]].forEach(([x, y, c], i) => { g.fillStyle = cols[c]; g.globalAlpha = 0.75; if (i % 2) { g.fillRect(x, y, 4, 2); g.fillRect(x + 1, y + 1, 4, 2); } else { g.fillRect(x, y, 2, 4); g.fillRect(x + 1, y + 1, 2, 4); } });
      g.globalAlpha = 1;
    }
    else if (id === 'doodles') {
      g.strokeStyle = lt; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.arc(24, 24, 9, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(24, 25, 3, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(24, 15); g.lineTo(28, 8); g.stroke();
      g.beginPath(); g.moveTo(62, 64); g.lineTo(70, 72); g.moveTo(70, 64); g.lineTo(62, 72); g.stroke();
      g.beginPath(); g.moveTo(10, 76); for (let x = 0; x < 30; x += 6) g.lineTo(10 + x + 3, 76 + (x % 12 ? -4 : 4)); g.stroke();
      g.beginPath(); g.moveTo(70, 18); g.lineTo(74, 26); g.lineTo(82, 27); g.lineTo(76, 32); g.lineTo(78, 40); g.lineTo(70, 36); g.lineTo(62, 40); g.lineTo(64, 32); g.lineTo(58, 27); g.lineTo(66, 26); g.closePath(); g.stroke();
    }
    else if (id === 'zigzag') for (let x = 0; x < 16; x++) { const y = x < 8 ? x : 15 - x; p(x, y, dk); p(x, y + 8 > 15 ? y - 8 : y + 8, lt); }
    else if (id === 'bricks') { g.fillStyle = dk; g.fillRect(0, 7, 16, 1); g.fillRect(0, 15, 16, 1); g.fillRect(7, 0, 1, 7); g.fillRect(15, 8, 1, 7); g.fillStyle = lt; g.fillRect(0, 0, 7, 1); g.fillRect(8, 8, 7, 1); }
    else if (id === 'checks') { g.fillStyle = dk; g.fillRect(0, 0, 8, 8); g.fillRect(8, 8, 8, 8); }
    else if (id === 'weave') { [[0, 0], [1, 1], [2, 2], [3, 3], [4, 0], [5, 7], [6, 6], [7, 5]].forEach(([x, y]) => p(x, y, dk)); [[0, 4], [1, 5], [2, 6], [3, 7]].forEach(([x, y]) => p(x, y, lt)); }
    else if (id === 'dots') { g.fillStyle = lt; g.fillRect(2, 2, 2, 2); g.fillStyle = dk; g.fillRect(8, 8, 2, 2); }
    else if (id === 'zobs') { g.globalAlpha = 0.35; C.zobDraw(g, 12, 10); g.globalAlpha = 1; }
    else if (id === 'stars') { for (let i = 0; i < 26; i++) p((i * 37 + 11) % 96, (i * 53 + 7) % 96, i % 5 ? lt : '#ffffff'); p(40, 40, '#ffffff'); p(39, 40, lt); p(41, 40, lt); p(40, 39, lt); p(40, 41, lt); }
    else if (id === 'waves') for (let x = 0; x < 32; x++) { const y = Math.round(8 + Math.sin(x / 32 * Math.PI * 2) * 4); p(x, y, lt); p(x, y + 16, dk); }
    else if (id === 'clouds') {
      const cloud = (cx, cy, s) => { g.fillStyle = lt; [[0, 0, 10], [9, -4, 9], [18, 0, 10], [8, 4, 10]].forEach(([dx, dy, r]) => { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r * s) g.fillRect(cx + dx + x, cy + dy + y, 1, 1); }); };
      cloud(20, 30, 1); cloud(80, 90, 0.8);
    }
    return c.toDataURL();
  }
  function applyDesk() {
    const look = C.looks.find((l) => l.id === C.look) || C.looks[0];
    const id = C.prefs.wallpaper || 'none';
    deskBg.style.backgroundImage = id === 'none' ? '' : `url("${wallpaper(id, look.pal.desk)}")`;
    deskBg.dataset.wall = id;
  }
  window.addEventListener('curio:theme', () => { applyDesk(); layoutIcons(); wins.forEach((w) => w.refresh?.()); });
  applyDesk();

  const SAVERS = [['none', '(None)'], ['zobs', 'Flying Zobs'], ['pipes', 'Pixel Pipes'], ['marquee', 'Marquee'], ['stars', 'Starfield']];
  C.settingsTabs.push({
    id: 'desk', label: 'Desktop', before: true,
    render: () => {
      const p = C.prefs;
      const opt = (name, v, l, on) => { const id = `d${Math.random().toString(36).slice(2, 7)}`; return `<span class="curio-opt"><input type="radio" id="${id}" name="${name}" value="${v}" ${on ? 'checked' : ''}><label for="${id}">${l}</label></span>`; };
      const chk = (k, l, on, hint = '') => { const id = `d${Math.random().toString(36).slice(2, 7)}`; return `<span class="curio-opt"><input type="checkbox" id="${id}" data-dk="${k}" ${on ? 'checked' : ''}><label for="${id}">${l}</label>${hint ? `<small>${hint}</small>` : ''}</span>`; };
      return `<div class="zdp"><div class="zdp-mon" aria-hidden="true"><div class="zdp-scr"></div></div></div>
        <fieldset><legend>Wallpaper</legend><span class="z-select"><select data-dsel="wallpaper" aria-label="Wallpaper">${WALLS.map(([v, l]) => `<option value="${v}" ${p.wallpaper === v ? 'selected' : ''}>${l}</option>`).join('')}</select></span></fieldset>
        <fieldset><legend>Screen saver</legend><div class="field-row"><span class="z-select"><select data-dsel="saver" aria-label="Screen saver">${SAVERS.map(([v, l]) => `<option value="${v}" ${p.saver === v ? 'selected' : ''}>${l}</option>`).join('')}</select></span><button type="button" data-dact="preview">Preview</button></div><div class="field-row" style="margin-top:6px"><label for="dwait">Wait:</label><input id="dwait" type="number" min="1" max="60" value="${p.saverWait || 3}" data-dnum="saverWait" style="width:56px"><label for="dwait">minutes</label></div></fieldset>
        <fieldset><legend>Desktop</legend>${chk('restore', 'Remember open windows', p.restore, 'Whatever you leave open comes back next time.')}${chk('zob', 'Show Zob, the desktop helper', p.zob !== false)}${chk('welcome', 'Open Zoble Explorer at start-up', p.welcome !== false)}</fieldset>`;
    },
    mount: (panel) => {
      const scr = panel.querySelector('.zdp-scr');
      const look = C.looks.find((l) => l.id === C.look) || C.looks[0];
      const paintMon = () => { scr.style.backgroundColor = look.pal.desk; scr.style.backgroundImage = C.prefs.wallpaper === 'none' ? '' : `url("${wallpaper(C.prefs.wallpaper, look.pal.desk)}")`; };
      paintMon();
      panel.querySelectorAll('[data-dsel]').forEach((s) => s.addEventListener('change', () => { C.setPref(s.dataset.dsel, s.value); C.sfx('click'); paintMon(); }));
      panel.querySelectorAll('[data-dk]').forEach((c) => c.addEventListener('change', () => { C.setPref(c.dataset.dk, c.checked); if (c.dataset.dk === 'restore') saveSession(); C.sfx(c.checked ? 'on' : 'off'); }));
      panel.querySelector('[data-dnum]').addEventListener('change', (e) => { C.setPref('saverWait', Math.max(1, Math.min(60, +e.target.value || 3))); bumpIdle(); });
      panel.querySelector('[data-dact="preview"]').addEventListener('click', () => { C.closeSettings(); setTimeout(() => startSaver(true), 150); });
    }
  });

  let idleT = 0, saverOn = false;
  function bumpIdle() {
    clearTimeout(idleT);
    if (saverOn) return;
    const mins = +C.prefs.saverWait || 3;
    if (C.prefs.saver === 'none') return;
    idleT = setTimeout(() => { if (!document.hidden && !document.querySelector('.curio-modal, .curio-sheet')) startSaver(); else bumpIdle(); }, mins * 60000);
  }
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((t) => window.addEventListener(t, () => { if (!saverOn) bumpIdle(); }, { passive: true }));
  function startSaver(preview) {
    if (saverOn) return;
    const kind = C.prefs.saver === 'none' ? 'zobs' : C.prefs.saver;
    saverOn = true;
    C.unlock('saver');
    zobSleep(true);
    const cv = el('canvas', 'zsaver');
    cv.setAttribute('aria-label', 'Screen saver. Move the mouse or press a key to return.');
    cv.setAttribute('role', 'img');
    screenEl.append(cv);
    room.classList.add('is-saver');
    const S = 4;
    const resize = () => { cv.width = Math.ceil(screenEl.clientWidth / S); cv.height = Math.ceil(screenEl.clientHeight / S); };
    resize();
    const g = cv.getContext('2d');
    const W = () => cv.width, Hh = () => cv.height;
    let raf = 0, t0 = performance.now();
    const still = calm();
    const zobs = Array.from({ length: 26 }, () => ({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: Math.random() * 1 + 0.1 }));
    const zc = document.createElement('canvas'); zc.width = 24; zc.height = 28; C.zobDraw(zc.getContext('2d'), 0, 0);
    const pipes = { x: 0, y: 0, d: 0, col: '#ff0000', n: 0 };
    const stars = Array.from({ length: 160 }, () => ({ x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: Math.random() }));
    g.fillStyle = '#000'; g.fillRect(0, 0, W(), Hh());
    let mx = 0, my = 0;
    const frame = (t) => {
      const dt = Math.min(50, t - t0); t0 = t;
      if (still) {
        g.fillStyle = '#000'; g.fillRect(0, 0, W(), Hh());
        const k = Math.floor(t / 5000);
        g.fillStyle = '#c0c0c0'; g.font = '700 12px "Zoble 98", monospace';
        g.fillText('ZobOS', 10 + (k * 53) % Math.max(10, W() - 70), 20 + (k * 31) % Math.max(10, Hh() - 30));
      } else if (kind === 'zobs') {
        g.fillStyle = '#000'; g.fillRect(0, 0, W(), Hh());
        zobs.sort((a, b) => b.z - a.z).forEach((z) => {
          z.z -= dt * 0.00018;
          if (z.z <= 0.05) { z.z = 1.1; z.x = (Math.random() - 0.5) * 2; z.y = (Math.random() - 0.5) * 2; }
          const s = Math.max(1, Math.round(0.6 / z.z));
          const x = W() / 2 + z.x / z.z * W() * 0.35, y = Hh() / 2 + z.y / z.z * Hh() * 0.35;
          g.imageSmoothingEnabled = false;
          g.drawImage(zc, Math.round(x - 12 * s / 2), Math.round(y - 14 * s / 2), 24 * s / 2, 28 * s / 2);
        });
      } else if (kind === 'stars') {
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, W(), Hh());
        stars.forEach((s) => { s.z -= dt * 0.00035; if (s.z <= 0.02) { s.z = 1; s.x = (Math.random() - 0.5) * 2; s.y = (Math.random() - 0.5) * 2; } const x = W() / 2 + s.x / s.z * W() * 0.3, y = Hh() / 2 + s.y / s.z * Hh() * 0.3; g.fillStyle = s.z < 0.3 ? '#fff' : '#808080'; g.fillRect(Math.round(x), Math.round(y), s.z < 0.2 ? 2 : 1, s.z < 0.2 ? 2 : 1); });
      } else if (kind === 'marquee') {
        g.fillStyle = '#000'; g.fillRect(0, 0, W(), Hh());
        g.font = '700 24px "Zoble 98 Display", monospace';
        const msg = 'ZobOS  *  Zob is having a little nap  *  Move the mouse to wake him';
        const tw = g.measureText(msg).width;
        mx = (mx - dt * 0.03); if (mx < -tw) mx = W();
        const cols = ['#ff0', '#0ff', '#f0f', '#0f0'];
        g.fillStyle = cols[Math.floor(t / 2000) % cols.length];
        g.fillText(msg, Math.round(mx), Math.round(Hh() / 2 + Math.sin(t / 1500) * Hh() * 0.25));
        void my;
      } else if (kind === 'pipes') {
        const COLS = ['#ff4040', '#40ff40', '#4080ff', '#ffff40', '#ff40ff', '#40ffff', '#ffffff'];
        for (let k = 0; k < 3; k++) {
          if (pipes.n <= 0 || pipes.x < 1 || pipes.y < 1 || pipes.x > W() - 2 || pipes.y > Hh() - 2) {
            if (pipes.n <= 0 || Math.random() < 0.3) { pipes.x = Math.floor(Math.random() * W()); pipes.y = Math.floor(Math.random() * Hh()); pipes.col = C.pick(COLS); }
            pipes.d = Math.floor(Math.random() * 4); pipes.n = 10 + Math.floor(Math.random() * 40);
            g.fillStyle = '#fff'; g.fillRect(pipes.x - 1, pipes.y - 1, 3, 3);
          }
          const [dx, dy] = [[1, 0], [0, 1], [-1, 0], [0, -1]][pipes.d];
          pipes.x += dx; pipes.y += dy; pipes.n--;
          g.fillStyle = pipes.col; g.fillRect(pipes.x - 1, pipes.y - 1, 3, 3);
          g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(pipes.x - (dy ? 1 : 0), pipes.y - (dx ? 1 : 0), dy ? 1 : 1, 1);
          g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(pipes.x + (dy ? 1 : 0), pipes.y + (dx ? 1 : 0), 1, 1);
        }
        if (t % 30000 < 20) { g.fillStyle = '#000'; g.fillRect(0, 0, W(), Hh()); }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const start = performance.now();
    let sx = null, sy = null;
    const stop = (e) => {
      if (performance.now() - start < 600) return;
      if (e.type === 'pointermove') { if (sx == null) { sx = e.clientX; sy = e.clientY; return; } if (Math.hypot(e.clientX - sx, e.clientY - sy) < 8) return; }
      cancelAnimationFrame(raf);
      cv.remove();
      room.classList.remove('is-saver');
      saverOn = false;
      ['pointermove', 'pointerdown', 'keydown', 'wheel'].forEach((t) => window.removeEventListener(t, stop, true));
      window.removeEventListener('resize', resize);
      if (e.type === 'keydown' || e.type === 'pointerdown') { e.preventDefault?.(); e.stopPropagation?.(); }
      zobSleep(false);
      bumpIdle();
    };
    ['pointermove', 'pointerdown', 'keydown', 'wheel'].forEach((t) => window.addEventListener(t, stop, true));
    window.addEventListener('resize', resize);
    void preview;
  }

  let offWake = null;
  async function shutDown() {
    const box = el('div', 'zsd');
    box.innerHTML = `<div class="zsd-row"><img alt="" src="${px('shutdown', 32)}" class="z-px"><div><p>What do you want Zoble to do?</p><span class="curio-opt"><input type="radio" id="sd1" name="sd" value="off" checked><label for="sd1">Shut down</label></span><span class="curio-opt"><input type="radio" id="sd2" name="sd" value="restart"><label for="sd2">Restart</label></span><span class="curio-opt"><input type="radio" id="sd3" name="sd" value="nap"><label for="sd3">Stand by (Zob takes a nap)</label></span></div></div>`;
    const v = await C.modal({ icon: 'question', caption: 'Shut Down Zoble', title: '', body: box, buttons: [{ label: 'OK', value: 'ok' }, { label: 'Cancel', value: 'cancel' }, { label: 'Help', value: 'help' }] });
    if (v === 'help') { openHelp('welcome'); return; }
    if (v !== 'ok') return;
    const what = box.querySelector('input:checked')?.value || 'off';
    C.menu.closeAll();
    if (what === 'nap') { startSaver(); return; }
    desk.classList.add('is-fading');
    C.sfx('shutdown');
    await new Promise((r) => setTimeout(r, calm() ? 200 : 1300));
    const scr = el('div', 'zboot zboot--down');
    scr.innerHTML = splashHTML(what === 'restart' ? 'ZobOS is restarting...' : 'ZobOS is shutting down...');
    screenEl.append(scr);
    await new Promise((r) => setTimeout(r, calm() ? 400 : 1800));
    if (what === 'restart') { sessionStorage.removeItem('zoble:booted'); location.reload(); return; }
    scr.className = 'zboot zboot--safe';
    scr.innerHTML = '<p>It is now safe to turn off<br>Zob\'s computer.</p><small>(click anywhere, or press the power button, to start ZobOS again)</small>';
    room.classList.add('is-off');
    scr.tabIndex = 0;
    scr.focus();
    C.unlock('shutdown');
    const wake = () => { offWake = null; room.classList.remove('is-off'); scr.removeEventListener('click', wake); scr.removeEventListener('keydown', wake); scr.className = 'zboot'; scr.innerHTML = splashHTML('Starting ZobOS...'); C.sfx('startup'); setTimeout(() => { scr.remove(); desk.classList.remove('is-fading'); }, calm() ? 300 : 2200); };
    offWake = wake;
    setTimeout(() => { scr.addEventListener('click', wake); scr.addEventListener('keydown', wake); }, 600);
  }
  function splashHTML(msg) {
    return `<div class="zboot-sky" aria-hidden="true"></div><div class="zboot-logo"><span class="zboot-zob">${C.pim('pim--boot')}</span><b>Zob<i>OS</i></b></div><p class="zboot-msg">${esc(msg)}</p><div class="zboot-bar" aria-hidden="true"><i></i></div>`;
  }

  const zobEl = el('div', 'zob');
  zobEl.innerHTML = `<div class="zob-bubble" role="status" aria-live="polite" hidden><p></p><div class="zob-btns"></div><button type="button" class="zob-x" aria-label="Close the tip"></button></div><button type="button" class="zob-body" aria-label="Zob, who owns this computer. Click to poke.">${window.ZobleArt.zob()}<span class="zob-zzz" aria-hidden="true">z<i>z</i><b>z</b></span></button>`;
  ($('zobhome') || room).append(zobEl);
  const zobBody = zobEl.querySelector('.zob-body'), zobSvg = zobEl.querySelector('.zobv'), bub = zobEl.querySelector('.zob-bubble');
  let zobT = 0, sleeping = false, pokes = store.get('hub:pokes', 0), pokeTimes = [];
  function zobSay(text, ms = 3000, buttons = []) {
    if (C.prefs.zob === false || saverOn) return;
    wakeZob(true);
    bub.hidden = false;
    bub.querySelector('p').textContent = text;
    const row = bub.querySelector('.zob-btns');
    row.replaceChildren(...buttons.map(([label, fn]) => { const b = el('button'); b.type = 'button'; b.textContent = label; b.addEventListener('click', () => { hideBubble(); fn(); }); return b; }));
    row.hidden = !buttons.length;
    clearTimeout(zobT);
    if (ms) zobT = setTimeout(hideBubble, ms);
  }
  function hideBubble() { bub.hidden = true; clearTimeout(zobT); }
  bub.querySelector('.zob-x').addEventListener('click', () => { C.sfx('click'); hideBubble(); });
  function showZob(on) {
    C.setPref('zob', !!on);
    syncZob();
    if (on) zobSay(C.pick(['hello again! I was behind the monitor.', 'ta-da! I\'m back.', 'did you miss me?']), 2600);
  }
  function syncZob() { zobEl.hidden = C.prefs.zob === false; paintTray(); }
  syncZob();
  const LINES = ['hi! I\'m Zob. this is my computer. you can borrow it.', 'that tickles', 'have you tried the one with the sand?', 'I\'ve played every single one. twice.', 'boop. right back at you.', 'I am made of felt-tip pen and one eye', 'psst. there are secrets everywhere.', 'my favourite is the button. obviously.', 'is it lunch yet? it feels like lunch.', 'careful with the mug. it is my favourite mug.', 'the plant is called Gerald', 'I dusted the Arcade Classics folder this morning', 'ok, ok, that\'s plenty of poking'];
  const greet = H >= 22 || H < 5 ? 'it\'s late. shouldn\'t you be asleep?' : H < 11 ? 'morning! I made coffee. well, I looked at it.' : 'oh hello! I\'m Zob. welcome to my desk.';
  function zobPoke() {
    wakeZob();
    pokes++; store.set('hub:pokes', pokes);
    C.unlock('poke');
    const t = performance.now();
    pokeTimes = pokeTimes.filter((x) => t - x < 5000).concat(t);
    zobEl.classList.remove('is-squish'); void zobEl.offsetWidth; zobEl.classList.add('is-squish');
    if (pokeTimes.length >= 8) {
      pokeTimes = [];
      zobEl.classList.remove('is-dizzy'); void zobEl.offsetWidth; zobEl.classList.add('is-dizzy');
      C.sfx('whoosh');
      zobSay('wheeeee... the desktop is spinning', 2600);
      C.unlock('dizzy');
      return;
    }
    C.sfx('squeak');
    zobSay(pokes === 1 ? greet : LINES[pokes % LINES.length], 2800);
  }
  zobEl.addEventListener('animationend', () => zobEl.classList.remove('is-squish', 'is-dizzy', 'is-wave', 'is-giggle'));
  zobBody.addEventListener('click', () => zobPoke());
  let tickleT = 0;
  zobBody.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    clearTimeout(tickleT);
    tickleT = setTimeout(() => {
      wakeZob();
      zobEl.classList.add('is-giggle');
      C.sfx('squeak');
      zobSay(C.pick(['hee hee hee! stop, that tickles!', 'ha! ha! no! not the tummy!', 'hehehe. ok. ok. I give up.']), 2400);
      C.unlock('tickle');
    }, 2600);
  });
  zobBody.addEventListener('pointerleave', () => clearTimeout(tickleT));
  let zobIdle = 0;
  function zobSleep(on) {
    if (on === sleeping) return;
    sleeping = on;
    zobSvg.classList.toggle('is-sleep', on);
    zobEl.classList.toggle('is-sleeping', on);
    if (on) { hideBubble(); if (C.prefs.zob !== false && !zobEl.hidden) { C.sfx('snore'); C.unlock('sleepy'); } }
  }
  function wakeZob(quiet) {
    clearTimeout(zobIdle);
    zobIdle = setTimeout(() => { if (!document.hidden) zobSleep(true); }, 60000);
    if (!sleeping) return;
    zobSleep(false);
    if (!quiet) zobSay(C.pick(['huh? I wasn\'t sleeping. I was resting my eye.', 'mmh? oh. hello again.', 'I was dreaming about pixels']), 2400);
  }
  ['pointermove', 'keydown', 'pointerdown'].forEach((t) => window.addEventListener(t, () => { if (sleeping && !saverOn) wakeZob(); else if (!sleeping) { clearTimeout(zobIdle); zobIdle = setTimeout(() => { if (!document.hidden) zobSleep(true); }, 60000); } }, { passive: true }));
  wakeZob(true);
  const TIPS = [
    ['It looks like you\'re trying to have fun. Would you like help with that?', [['Surprise me', () => rollGame()], ['No thanks', () => {}]]],
    ['Tip: Ctrl+Esc opens my menu. So does the button with my face on it. I prefer the face.', []],
    ['Tip: every game has a Simple and an Advanced version. The switch is in the game\'s title strip.', []],
    ['Tip: on a touchpad? Turn on Touchpad mode in the taskbar. Click to grab, click to drop.', [['Turn it on', () => { C.setTouchpad(true); }]]],
    ['The Recycle Bin is not empty. It is never empty. I have checked.', [['Have a look', () => openFolder('bin')]]],
    ['You can have lots of games open at once. I usually have nine.', []],
    ['Did you know? There are secrets hidden all over this desktop.', [['Show me the list', () => C.secretsWindow()]]],
    ['Bored of blueberry? Right-click the desktop, Properties, Wallpaper. Or click my lamp.', [['Open Desktop settings', () => C.settings(null, { tab: 'desk' })]]]
  ];
  let tipN = 0;
  setInterval(() => {
    if (document.hidden || saverOn || sleeping || C.prefs.zob === false || document.querySelector('.curio-modal, .curio-sheet, .z-menu')) return;
    if (wins.some((w) => w.kind === 'game' && w.state !== 'min' && w === active)) return;
    const [t, b] = TIPS[tipN++ % TIPS.length];
    zobSay(t, b.length ? 9000 : 6000, b);
  }, 95000);

  let peeked = false;
  function peek() {
    if (peeked || store.get('hub:peeked', 0) > now - 6e4 || C.prefs.zob === false) return;
    const icons = [...iconsEl.querySelectorAll('.di')];
    if (icons.length < 6) return;
    const t = icons[3 + Math.floor(Math.random() * (icons.length - 3))];
    const b = el('button', 'zpeek');
    b.type = 'button';
    b.setAttribute('aria-label', 'Something is hiding behind this icon');
    b.innerHTML = `<img alt="" src="${px('zob', 16)}" width="16" height="16">`;
    b.addEventListener('click', (e) => { e.stopPropagation(); b.classList.add('is-found'); C.sfx('squeak'); C.balloon('You found me! Ok, now you count to ten and I hide again.', { ms: 2800 }); C.unlock('peek'); store.set('hub:peeked', Date.now()); setTimeout(() => b.remove(), 600); });
    t.append(b);
    peeked = true;
    setTimeout(() => b.remove(), 45000);
  }

  function party() {
    desk.classList.add('is-party');
    room.classList.add('is-party');
    zobSvg.classList.add('hat-party');
    zobEl.classList.add('is-wave');
    C.sfx('success');
    C.confetti(200);
    C.balloon('Bonus round! Everything is dancing.', { title: 'Party mode', icon: 'star', ms: 3000 });
    zobSay('it\'s a party and I didn\'t even bring snacks', 3600);
    C.unlock('konami');
    setTimeout(() => { desk.classList.remove('is-party'); room.classList.remove('is-party'); if (!hats.includes('hat-party')) zobSvg.classList.remove('hat-party'); }, 6500);
  }
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let keys = [], typed = '', metaAlone = false;
  document.addEventListener('keyup', (e) => { if ((e.key === 'Meta' || e.key === 'OS') && metaAlone) { metaAlone = false; toggleStart(undefined, true); } });
  document.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys = keys.concat(k).slice(-KONAMI.length);
    if (keys.join() === KONAMI.join()) { keys = []; party(); }
    metaAlone = e.key === 'Meta' || e.key === 'OS';
    if (e.ctrlKey && e.key === 'Escape') { e.preventDefault(); toggleStart(undefined, true); return; }
    if (e.altKey && !e.ctrlKey && (e.key === 'F4' || e.key.toLowerCase() === 'x')) { if (active) { e.preventDefault(); closeWin(active); } return; }
    if (e.altKey && !e.ctrlKey && !e.metaKey && e.key.length === 1 && active?.mb && active.mb.open(e.key.toLowerCase())) { e.preventDefault(); return; }
    if (e.key === 'F10' && !e.shiftKey && active?.mb) { e.preventDefault(); active.mb.focus(); return; }
    const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
    if (inField || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/' && !document.querySelector('.curio-modal')) { e.preventDefault(); if (phone() && launcher) launcher.view.focusSearch(); else if (active?.kind === 'explorer' && explorer.view) explorer.view.focusSearch(); else openFind(); return; }
    if (e.key === '?' && !document.querySelector('.curio-modal')) { openHelp('keys'); return; }
    if (k.length === 1 && /[a-z]/.test(k)) {
      typed = (typed + k).slice(-8);
      if (typed.endsWith('zob')) { zobEl.classList.add('is-wave'); zobSay('that\'s me! that\'s my name!', 2400); C.sfx('squeak'); typed = ''; }
      if (typed.endsWith('hello')) { zobEl.classList.add('is-wave'); zobSay('hello hello hello!', 2400); typed = ''; }
    }
  });

  const hats = [];
  if (M === 0 && D === 1) { hats.push('hat-party'); setTimeout(() => { C.confetti(160); zobSay('happy new year! fresh pixels for everyone.', 4000); }, 2500); }
  else if (M === 2 && D === 14) { hats.push('hat-party'); setTimeout(() => zobSay('it\'s my birthday today! I would like a high score as a present.', 4500), 3000); }
  else if (M === 9 && D >= 24) { hats.push('hat-witch'); setTimeout(() => zobSay(D === 31 ? 'happy Halloween! I dressed up as a slightly different Zob.' : 'something is rustling in the Recycle Bin...', 4000), 3000); }
  else if (M === 11) hats.push('hat-scarf');
  else if (H >= 22 || H < 5) hats.push('hat-night');
  hats.forEach((h) => zobSvg.classList.add(h));
  if (M === 9) {
    const bats = el('div', 'zbats');
    bats.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i++) { const b = el('i'); b.style.top = `${10 + i * 22}%`; b.style.animationDelay = `${i * 4.5}s`; bats.append(b); }
    desk.append(bats);
  }
  if (M === 11 || (M === 0 && D < 8)) {
    const snow = el('div', 'zsnow');
    snow.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 30; i++) { const f = el('i'); f.style.left = `${Math.random() * 100}%`; f.style.animationDuration = `${7 + Math.random() * 7}s`; f.style.animationDelay = `${-Math.random() * 12}s`; snow.append(f); }
    desk.append(snow);
  }
  if (W === 5 && D === 13) {
    const cat = el('div', 'zcat');
    cat.setAttribute('aria-hidden', 'true');
    cat.title = 'A black cat. Do not make eye contact.';
    tbEl.append(cat);
  }
  if (M === 3 && D === 1) setTimeout(() => C.balloon('Everything is perfectly normal today. Nothing to see here.', { title: 'April 1', icon: 'info', ms: 4000 }), 3000);

  let visits = store.get('hub:visits', 0);
  const booted = sessionStorage.getItem('zoble:booted');
  if (!booted) { visits++; store.set('hub:visits', visits); }
  if (visits >= 10) setTimeout(() => C.unlock('regular'), 2500);
  if (H < 5) setTimeout(() => C.unlock('night'), 2000);
  else if (H < 7) setTimeout(() => C.unlock('early'), 2000);

  let away = 0;
  const docTitle = document.title;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { away = Date.now(); document.title = 'Zob misses you - ZobOS'; }
    else {
      document.title = docTitle;
      if (away && Date.now() - away > 8000) { C.unlock('missed'); zobSay('you\'re back! I kept your seat warm.', 2600); }
      away = 0;
      refreshAll();
    }
  });
  window.addEventListener('curio:reset', () => { loadSeen(); refreshAll(); renderDesk(); });
  window.addEventListener('curio:secret', () => refreshAll());
  window.addEventListener('pageshow', (e) => { if (e.persisted) refreshAll(); });

  let chimed = false;
  function chime() {
    if (chimed || C.muted || !C.prefs.ui) return;
    chimed = true;
    C.sfx('startup');
  }

  const api = {
    C, games, tags, TAGS, fname, bySlug, isNew, phone, deskArea, refreshData,
    played: () => played, favs: () => favs,
    openGame: (slug, o) => openGame(slug, o || {}), openFolder: (p, o) => openFolder(p, o || {}), openWindow, openHelp, openReadme, rollGame, toggleFav,
    about: () => aboutZoble(), zobSay: (t, ms, b) => zobSay(t, ms, b), zobWave: () => { zobEl.classList.add('is-wave'); C.sfx('squeak'); },
    isOpen: (w) => wins.includes(w), raise: (w) => { if (w.state === 'min') restore(w); focus(w); },
    powerOn: () => { if (offWake) offWake(); },
    searchEgg: (q) => { if (q === '42') { C.unlock('answer'); zobSay('forty-two! but what was the question?', 2600); } else if (q === 'zob') zobSay('you were looking for me? I\'m right here!', 2400); }
  };
  const explorer = window.ZobleExplorer(api);
  api.explorer = explorer;
  const deskScene = window.ZobleDesk(api);
  function openExplorer(o = {}) { return explorer.open(o); }

  let launcher = null;
  function buildLauncher() {
    if (launcher) return launcher;
    const box = el('div', 'pocket');
    box.id = 'launcher';
    const host = el('div', 'pocket-home');
    const dock = el('nav', 'pocket-dock');
    dock.setAttribute('aria-label', 'Dock');
    const D = [['home', 'Home', 'computer'], ['kinds', 'Kinds', 'folder'], ['search', 'Search', 'find'], ['roll', 'Surprise', 'die'], ['zob', 'Zob', 'zob']];
    dock.innerHTML = D.map(([k, l, ic]) => `<button type="button" data-d="${k}"><img alt="" class="z-px" width="32" height="32" src="${px(ic, 32)}"><span>${l}</span></button>`).join('');
    box.append(host, dock);
    screenEl.insertBefore(box, tbEl);
    const view = explorer.mountPhone(host);
    dock.addEventListener('click', (e) => {
      const b = e.target.closest('[data-d]'); if (!b) return;
      C.sfx('click');
      const k = b.dataset.d;
      if (k === 'home') view.setTab('home');
      else if (k === 'search') view.focusSearch();
      else if (k === 'roll') rollGame();
      else if (k === 'kinds') C.menu.open(TAGS.map((t) => ({ label: fname(t).replace(/&/g, '&&'), icon: C.folderIcon(t, 16), action: () => view.setTab(`tag:${t}`) })).concat([{ sep: true }, { label: '&Favourites', icon: px('favs', 16), action: () => view.setTab('favs') }, { label: '&Recent', icon: px('recent', 16), action: () => view.setTab('recent') }, { label: '&New', icon: px('star', 16), action: () => view.setTab('new') }]), { anchor: b.getBoundingClientRect(), side: 'up', opener: b, label: 'Kinds' });
      else if (k === 'zob') toggleStart(true, false, b);
    });
    launcher = { box, view };
    return launcher;
  }
  function syncPhone() {
    const on = phone();
    room.classList.toggle('is-phone', on);
    if (on) buildLauncher();
    room.classList.toggle('has-app', on && wins.some((w) => w.state !== 'min'));
  }
  window.addEventListener('resize', syncPhone);

  function tipOnce() {
    if (store.get('hub:tip1', 0)) return;
    store.set('hub:tip1', Date.now());
    setTimeout(() => zobSay(phone() ? 'hi! this is my pocket computer. tap a game to play. the dock has kinds, search and my menu.' : 'hi, I\'m Zob! this is my computer. pick any game, or close the Explorer to see my desktop. my desk has secrets too...', 7000), 1600);
  }

  function boot() {
    renderDesk();
    const hashOpen = (location.hash.match(/open=([\w-]+)/) || [])[1];
    if (hashOpen) history.replaceState(null, '', location.pathname);
    const finish = () => {
      html.classList.remove('z-wait');
      restoreSession();
      if (hashOpen && bySlug(hashOpen) && !wins.some((w) => w.key === `game:${hashOpen}`)) openGame(hashOpen, { minimized: true, quiet: true });
      syncPhone();
      if (!phone() && C.prefs.welcome !== false && !wins.some((w) => w.state !== 'min')) openExplorer({ max: true });
      syncPhone();
      tipOnce();
      bumpIdle();
      setTimeout(peek, 20000 + Math.random() * 20000);
      setTimeout(() => { if (!sleeping && bub.hidden && Date.now() - store.get('hub:tip1', 0) > 15000) zobSay(greet, 3200); }, 2400);
      const unlockChime = () => { chime(); window.removeEventListener('pointerdown', unlockChime, true); window.removeEventListener('keydown', unlockChime, true); };
      if (!booted) {
        try { const ac = C.audioContext(); if (ac && ac.state === 'running') chime(); } catch {}
        if (!chimed) { window.addEventListener('pointerdown', unlockChime, true); window.addEventListener('keydown', unlockChime, true); setTimeout(() => { window.removeEventListener('pointerdown', unlockChime, true); window.removeEventListener('keydown', unlockChime, true); }, 20000); }
      }
      sessionStorage.setItem('zoble:booted', '1');
      if (!wins.length && !phone()) iconsEl.querySelector('.di')?.focus({ preventScroll: true });
    };
    if (!booted && !calm()) { $('crt').classList.add('is-boot'); setTimeout(() => $('crt').classList.remove('is-boot'), 900); }
    finish();
  }
  boot();
  console.log('%cZobOS%c  booted. Psst: type zob() and press enter.', 'font: 700 16px monospace; color:#fff; background:#000080; padding:2px 6px', 'color:#888');
})();
