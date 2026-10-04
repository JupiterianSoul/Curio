(function () {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const el = (tag, cls = '', inner = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (inner) e.innerHTML = inner; return e; };
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const PICK_LINES = [
    'I played this one three times before breakfast.',
    'Trust me on this one. I have one eye and it is very good.',
    'This is today\'s favourite. Tomorrow I will change my mind.',
    'I put this one on the fridge.',
    'If you only play one thing today, play this. Then play another one.',
    'Gerald the plant likes this one too.',
    'Warning: may cause "just one more go".'
  ];
  const HELLO = (h) => (h < 5 ? 'Up late? Me too.' : h < 11 ? 'Morning! What shall we play?' : h < 17 ? 'Hi! What shall we play?' : h < 21 ? 'Evening! Pick something fun.' : 'One more before bed?');

  window.ZobleExplorer = function (api) {
    const { C, games } = api;
    const today = new Date();
    const dayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const pick = () => games[hash(`zob:${dayKey}`) % games.length];
    const pickLine = PICK_LINES[hash(`line:${dayKey}`) % PICK_LINES.length];

    function card(g, size = 'normal') {
      const played = api.played();
      const favs = api.favs();
      const c = el('div', `zx2-card zx2-card--${size}${api.isNew(g) ? ' is-new' : ''}${played[g.slug] ? ' is-played' : ''}`);
      c.dataset.slug = g.slug;
      c.style.setProperty('--tint', g.color || '#888');
      c.innerHTML = `<button type="button" class="zx2-play" aria-label="Play ${esc(g.title)}. ${esc(g.blurb)}"><span class="zx2-thumb"><img alt="" loading="lazy" decoding="async" draggable="false" src="games/${g.slug}/thumb.svg"></span><span class="zx2-name">${esc(g.title)}</span><span class="zx2-blurb">${esc(g.blurb)}</span></button>${api.isNew(g) ? '<span class="zx2-sticker" aria-hidden="true">new!</span>' : ''}${played[g.slug] ? '<span class="zx2-tick" aria-hidden="true" title="Played"></span>' : ''}<button type="button" class="zx2-fav" aria-pressed="${!!favs[g.slug]}" aria-label="${favs[g.slug] ? 'Remove from' : 'Add to'} favourites: ${esc(g.title)}" title="Favourite"></button>`;
      return c;
    }

    function build(root, opts = {}) {
      const phone = !!opts.phone;
      root.classList.add('zx2');
      root.classList.toggle('zx2--phone', phone);
      const tabs = [['home', 'Home'], ['new', 'New'], ['favs', 'Favourites'], ['recent', 'Recent'], ...api.TAGS.map((t) => [`tag:${t}`, api.fname(t)])];
      root.innerHTML = `<div class="zx2-top">${phone ? '' : `<div class="zx2-hello"><img class="zx2-hello__zob z-px" alt="" width="32" height="32" src="${C.px('zob', 32)}"><div><b>${esc(HELLO(today.getHours()))}</b><span>${games.length} games and toys on Zob's computer. Pick one, or let the die decide.</span></div></div>`}<label class="zx2-search"><img alt="" width="16" height="16" class="z-px" src="${C.px('find', 16)}"><span class="sr">Search games</span><input type="search" placeholder="Search ${games.length} games..." autocomplete="off" spellcheck="false"></label><button type="button" class="zx2-roll"><img alt="" width="16" height="16" class="z-px" src="${C.px('die', 16)}"><span>Surprise me</span></button></div><div class="zx2-tabs" role="tablist" aria-label="Kinds of games">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="false">${k.startsWith('tag:') ? `<img alt="" class="z-px" width="16" height="16" src="${C.folderIcon(k.slice(4), 16)}">` : ''}<span>${esc(l)}</span></button>`).join('')}</div><div class="zx2-scroll" tabindex="-1"><div class="zx2-body"></div></div>`;
      const input = root.querySelector('input');
      const body = root.querySelector('.zx2-body');
      const scroller = root.querySelector('.zx2-scroll');
      const tabRow = root.querySelector('.zx2-tabs');
      let tab = opts.tab || 'home', q = '';

      function section(title, list, cls = '', more = '') {
        const s = el('section', `zx2-sec ${cls}`);
        s.innerHTML = `<h2 class="zx2-h"><span>${esc(title)}</span>${more ? `<button type="button" class="zx2-more" data-go="${more}">See all</button>` : ''}</h2>`;
        const box = el('div', cls.includes('is-row') ? 'zx2-row' : 'zx2-grid');
        list.forEach((g) => box.append(card(g, cls.includes('is-row') ? 'row' : 'normal')));
        s.append(box);
        return s;
      }
      function hero() {
        const g = pick();
        const h = el('section', 'zx2-hero');
        h.style.setProperty('--tint', g.color || '#888');
        h.innerHTML = `<button type="button" class="zx2-hero__art" data-slug="${g.slug}" aria-label="Play ${esc(g.title)}"><img alt="" src="games/${g.slug}/thumb.svg"></button><div class="zx2-hero__text"><span class="zx2-hero__kicker">Zob's pick of the day</span><b>${esc(g.title)}</b><p>${esc(g.blurb)}.</p><p class="zx2-hero__note">"${esc(pickLine)}"<i>- Zob</i></p><div class="zx2-hero__btns"><button type="button" class="c-btn" data-slug="${g.slug}">Play ${esc(g.title)}</button><span class="zx2-hero__tag">${esc(api.fname(g.tag))}</span></div></div>`;
        return h;
      }
      function render(keepScroll) {
        api.refreshData();
        const played = api.played(), favs = api.favs();
        const top = scroller.scrollTop;
        body.replaceChildren();
        tabRow.querySelectorAll('[role=tab]').forEach((b) => b.setAttribute('aria-selected', String(!q && b.dataset.tab === tab)));
        const sorted = (list) => list.slice();
        if (q) {
          const words = q.toLowerCase().split(/\s+/).filter(Boolean);
          const hits = games.map((g) => {
            const t = g.title.toLowerCase(), all = `${t} ${g.blurb.toLowerCase()} ${api.fname(g.tag).toLowerCase()} ${g.slug}`;
            const sc = t === q.toLowerCase() ? 100 : t.startsWith(q.toLowerCase()) ? 90 : t.includes(q.toLowerCase()) ? 70 : words.every((w) => all.includes(w)) ? 40 : 0;
            return [g, sc];
          }).filter((x) => x[1]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
          if (/^(42|zob|secret|secrets)$/.test(q.trim().toLowerCase())) api.searchEgg?.(q.trim().toLowerCase());
          body.append(hits.length ? section(`${hits.length} match${hits.length === 1 ? '' : 'es'} for "${q}"`, hits) : Object.assign(el('div', 'zx2-empty'), { innerHTML: `<img alt="" class="z-px" width="32" height="32" src="${C.px('zob', 32)}"><p>Zob looked under every icon. Nothing called "${esc(q)}".</p><button type="button" class="c-btn c-btn--ghost zx2-clear">Clear the search</button>` }));
        } else if (tab === 'home') {
          body.append(hero());
          const fresh = games.filter(api.isNew);
          const newList = fresh.length ? fresh : games.slice(-12).reverse();
          body.append(section('New on Zob\'s computer', newList.slice(0, 14), 'is-row', 'new'));
          const rec = games.filter((g) => played[g.slug]).sort((a, b) => played[b.slug] - played[a.slug]).slice(0, 14);
          if (rec.length) body.append(section('Pick up where you left off', rec, 'is-row', 'recent'));
          const fav = games.filter((g) => favs[g.slug]).sort((a, b) => favs[b.slug] - favs[a.slug]);
          if (fav.length) body.append(section('Your favourites', fav, 'is-row', 'favs'));
          body.append(section(`Everything (${games.length})`, sorted(games), 'is-all'));
        } else if (tab === 'new') {
          const fresh = games.filter(api.isNew);
          body.append(section('New arrivals', fresh.length ? fresh : games.slice(-12).reverse()));
        } else if (tab === 'favs') {
          const fav = games.filter((g) => favs[g.slug]).sort((a, b) => favs[b.slug] - favs[a.slug]);
          body.append(fav.length ? section('Your favourites', fav) : Object.assign(el('div', 'zx2-empty'), { innerHTML: `<img alt="" class="z-px" width="32" height="32" src="${C.px('favs', 32)}"><p>No favourites yet. Press the star on any game and it lands here.</p>` }));
        } else if (tab === 'recent') {
          const rec = games.filter((g) => played[g.slug]).sort((a, b) => played[b.slug] - played[a.slug]);
          body.append(rec.length ? section('Recently played', rec) : Object.assign(el('div', 'zx2-empty'), { innerHTML: `<img alt="" class="z-px" width="32" height="32" src="${C.px('recent', 32)}"><p>Nothing played yet. Everything you open shows up here.</p>` }));
        } else if (tab.startsWith('tag:')) {
          const t = tab.slice(4);
          const list = games.filter((g) => g.tag === t);
          const done = list.filter((g) => played[g.slug]).length;
          body.append(section(`${api.fname(t)}: ${list.length} games, ${done} played`, list));
        }
        if (keepScroll) scroller.scrollTop = top; else scroller.scrollTop = 0;
        opts.onStatus?.(statusText());
      }
      function statusText() {
        const played = api.played(), favs = api.favs();
        const n = games.filter((g) => played[g.slug]).length;
        return [`${games.length} games`, `${n} played, ${Object.keys(favs).filter((k) => api.bySlug(k)).length} favourites`];
      }
      function setTab(k, focusTab) {
        tab = k; q = ''; input.value = '';
        C.sfx('click');
        render();
        if (focusTab) tabRow.querySelector(`[data-tab="${CSS.escape(k)}"]`)?.focus();
        const b = tabRow.querySelector(`[data-tab="${CSS.escape(k)}"]`);
        b?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      }
      tabRow.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) setTab(b.dataset.tab); });
      tabRow.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const all = [...tabRow.querySelectorAll('[data-tab]')];
        const i = all.findIndex((b) => b.dataset.tab === tab);
        setTab(all[(i + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length].dataset.tab, true);
      });
      let t = 0;
      input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { q = input.value.trim(); render(); }, 110); });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { const first = body.querySelector('.zx2-play'); if (first && q) { e.preventDefault(); first.click(); } }
        if (e.key === 'Escape' && input.value) { e.preventDefault(); e.stopPropagation(); input.value = ''; q = ''; render(); }
      });
      root.querySelector('.zx2-roll').addEventListener('click', () => api.rollGame());
      body.addEventListener('click', (e) => {
        const fav = e.target.closest('.zx2-fav');
        if (fav) {
          const slug = fav.closest('[data-slug]').dataset.slug;
          api.toggleFav(slug);
          const on = !!api.favs()[slug];
          root.querySelectorAll(`.zx2-card[data-slug="${slug}"] .zx2-fav`).forEach((b) => { b.setAttribute('aria-pressed', String(on)); b.classList.remove('is-pop'); void b.offsetWidth; b.classList.add('is-pop'); });
          return;
        }
        if (e.target.closest('.zx2-clear')) { input.value = ''; q = ''; render(); input.focus(); return; }
        const more = e.target.closest('[data-go]');
        if (more) { setTab(more.dataset.go); return; }
        const hit = e.target.closest('[data-slug]');
        if (!hit) return;
        const slug = hit.dataset.slug;
        const img = hit.querySelector('img') || hit.closest('.zx2-card')?.querySelector('img');
        C.sfx('click');
        api.openGame(slug, { from: img?.getBoundingClientRect() });
      });
      render();
      return {
        root, render, setTab,
        search(text = '') { input.value = text; q = text.trim(); render(); setTimeout(() => input.focus(), 30); },
        focusSearch() { input.focus(); input.select(); },
        get tab() { return tab; },
        status: statusText
      };
    }

    let win = null, view = null;
    function open(opts = {}) {
      if (win && api.isOpen(win)) { api.raise(win); if (opts.tab) view.setTab(opts.tab); if (opts.search != null) view.search(opts.search); return win; }
      const A = api.deskArea();
      win = api.openWindow({
        key: 'explorer', kind: 'explorer', title: 'Zoble Explorer', icon: C.px('globe', 16), w: Math.min(980, A.w - 30), h: Math.min(680, A.h - 20), minW: 320, minH: 260, status: true, max: opts.max ?? true, from: opts.from, minimized: opts.minimized, rect: opts.rect, cls: 'zw-explorer', bodyCls: 'zw-explorer__body',
        menus: (w) => [
          { label: '&File', items: () => [
            { label: '&Play the pick of the day', icon: C.px('star', 16), action: () => api.openGame(pick().slug) },
            { label: '&Surprise me', icon: C.px('die', 16), action: () => api.rollGame() },
            { sep: true },
            { label: '&Close', accel: 'Alt+X', action: () => w.close() }
          ] },
          { label: '&View', items: () => [
            { label: '&Home', radio: true, checked: view.tab === 'home', action: () => view.setTab('home') },
            { label: '&New', radio: true, checked: view.tab === 'new', action: () => view.setTab('new') },
            { label: '&Favourites', radio: true, checked: view.tab === 'favs', action: () => view.setTab('favs') },
            { label: '&Recent', radio: true, checked: view.tab === 'recent', action: () => view.setTab('recent') },
            { label: '&Kinds', sub: () => api.TAGS.map((t) => ({ label: api.fname(t).replace(/&/g, '&&'), icon: C.folderIcon(t, 16), radio: true, checked: view.tab === `tag:${t}`, action: () => view.setTab(`tag:${t}`) })) },
            { sep: true },
            { label: '&Big pictures', checked: !w.el.classList.contains('is-small'), action: () => { w.el.classList.toggle('is-small'); C.store.set('hub:xsmall', w.el.classList.contains('is-small')); } },
            { label: 'Open &My Games folder', icon: C.px('folder', 16), action: () => api.openFolder('games') }
          ] },
          { label: '&Help', items: () => [
            { label: '&Help Topics', icon: C.px('help', 16), action: () => api.openHelp('welcome') },
            { label: '&About ZobOS', action: () => api.about() }
          ] }
        ],
        build: (w) => {
          const box = el('div', 'zx2-host');
          w.body.append(box);
          view = build(box, { onStatus: (st) => w.setStatus(...st), tab: opts.tab });
          w.refresh = () => view.render(true);
          w.focusTarget = () => box.querySelector('input');
          if (C.store.get('hub:xsmall', false)) w.el.classList.add('is-small');
        },
        onClose: () => { win = null; view = null; }
      });
      win.restoreKind = 'explorer';
      win.setStatus(...view.status());
      if (opts.search != null) view.search(opts.search);
      return win;
    }
    function mountPhone(host, opts = {}) {
      return build(host, { phone: true, ...opts });
    }
    return { open, mountPhone, card, get view() { return view; }, get win() { return win; }, pick };
  };
})();
