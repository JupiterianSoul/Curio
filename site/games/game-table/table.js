(() => {
  const CFG = window.TABLE_CFG;
  const C = window.Curio;
  const list = CFG.games;
  const ids = list.map((g) => g.id);
  const q = new URLSearchParams(location.search).get('g');
  let id = ids.includes(q) ? q : C.store.get(CFG.key, list[0].id);
  if (!ids.includes(id)) id = list[0].id;
  C.store.set(CFG.key, id);
  const game = list.find((g) => g.id === id);
  document.body.dataset.sub = id;
  if (game.table) document.body.dataset.table = game.table;
  document.title = `${game.name} · ${CFG.name} · Zoble`;

  const store = C.store;
  C.best = (key, score, higher = true) => {
    const k = `best:${id}:${key}`, prev = store.get(k, null);
    const isNew = prev == null || (higher ? score > prev : score < prev);
    if (isNew) store.set(k, score);
    return { best: isNew ? score : prev, isNew };
  };
  C.getBest = (key) => store.get(`best:${id}:${key}`, null);
  window.TABLE = { id, name: game.name, simple: C.simple, advanced: C.advanced };

  const pick = document.getElementById('table-pick');
  for (const g of list) {
    const a = document.createElement('a');
    a.className = 'tp-game';
    a.href = `?g=${g.id}`;
    a.dataset.id = g.id;
    a.style.setProperty('--tp', g.color);
    if (g.id === id) a.setAttribute('aria-current', 'page');
    a.innerHTML = `<span class="tp-art" aria-hidden="true">${g.art}</span><span class="tp-name">${g.name}</span><span class="tp-short">${g.short || g.name}</span>`;
    a.addEventListener('click', (e) => {
      if (g.id === id) { e.preventDefault(); return; }
      window.Cafe?.sound(CFG.pickSound || 'wood', 0.7);
      store.set(CFG.key, g.id);
    });
    pick.append(a);
  }
  const tools = document.getElementById('table-tools');
  if (tools && window.Cafe) tools.append(window.Cafe.button());

  const stage = document.getElementById('table-stage');
  const tpl = document.getElementById(`v-${id}`);
  stage.append(tpl.content.cloneNode(true));
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${id}/style.css`;
  const go = () => {
    const next = (i) => {
      if (i >= game.scripts.length) { stage.classList.add('is-ready'); window.dispatchEvent(new CustomEvent('table:ready', { detail: id })); return; }
      const s = document.createElement('script');
      s.src = `${id}/${game.scripts[i]}`;
      s.onload = () => next(i + 1);
      s.onerror = () => next(i + 1);
      document.body.append(s);
    };
    next(0);
  };
  link.onload = go;
  link.onerror = go;
  document.head.append(link);
})();
