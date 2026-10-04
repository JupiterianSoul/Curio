(() => {
  const $ = (id) => document.getElementById(id);
  const D = window.NAME_DATA;
  const Q = window.NAME_QUIZ;
  let rnd = Math.random;
  const P = (a) => a[Math.floor(rnd() * a.length)];
  const chance = (p) => rnd() < p;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const an = (w) => (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w;
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function seeded(str) { let a = hash(str) || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function chain(seeds, order = 2) {
    const m = new Map(), set = new Set(seeds.map((s) => s.toLowerCase()));
    for (const w of seeds) {
      const s = '^'.repeat(order) + w.toLowerCase() + '$';
      for (let i = 0; i + order < s.length; i++) { const k = s.slice(i, i + order); if (!m.has(k)) m.set(k, []); m.get(k).push(s[i + order]); }
    }
    return (min = 4, max = 10) => {
      for (let t = 0; t < 80; t++) {
        let k = '^'.repeat(order), out = '';
        for (;;) { const c = P(m.get(k) || ['$']); if (c === '$' || out.length > max) break; out += c; k = (k + c).slice(-order); }
        if (out.length >= min && out.length <= max && !set.has(out) && !/(.)\1\1/.test(out)) return out.split(' ').map(cap).join(' ');
      }
      return cap(P(seeds));
    };
  }
  const elfF = chain(D.elf.fem), elfM = chain(D.elf.masc), elfAll = chain(D.elf.fem.concat(D.elf.masc));
  const planetGen = chain(D.planet.seeds.filter((s) => !s.includes(' ')));
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'IX', 'XII'];

  const CATS = {
    elf: { label: 'Elf', icon: '🧝', c: '#2fbf7f', art: 'shield', tag: 'Graceful, ancient, faintly smug about it.', gender: true, gen(g) {
      const first = g === 'fem' ? elfF(5, 10) : g === 'masc' ? elfM(4, 9) : elfAll(4, 10);
      return { name: `${first} ${P(D.elf.sur1)}${P(D.elf.sur2)}`, flavor: P(D.elf.flavor) };
    } },
    dwarf: { label: 'Dwarf', icon: '⛏️', c: '#a8672f', art: 'shield', tag: 'Beards, ale, and a deep respect for rocks.', gender: true, gen(g) {
      const fem = g === 'fem' || (g === 'any' && chance(.5));
      const first = P(D.dwarf.start) + P(fem ? D.dwarf.fem : D.dwarf.masc);
      const clan = P(D.dwarf.clan1) + P(D.dwarf.clan2);
      const name = chance(.3) ? `${first}, ${fem ? 'daughter' : 'son'} of ${P(D.dwarf.start)}${P(D.dwarf.masc)}` : `${first} ${clan}`;
      return { name, flavor: `${P(D.dwarf.flavor)}. Clan ${clan}.` };
    } },
    orc: { label: 'Orc', icon: '👹', c: '#5c8f2f', art: 'shield', tag: 'Loud, proud and surprisingly good at poetry.', gender: true, gen(g) {
      const fem = g === 'fem' || (g === 'any' && chance(.4));
      let first = P(D.orc.start) + P(D.orc.end); if (fem && !/[ah]$/.test(first)) first += P(['a', 'ka', 'sha', 'ra']);
      const name = chance(.5) ? `${first} ${P(D.orc.epi1)}${P(D.orc.epi2)}` : `${first} the ${P(D.orc.adj)}`;
      return { name, flavor: P(D.orc.flavor) };
    } },
    wizard: { label: 'Wizard', icon: '🧙', c: '#6c5ce7', art: 'shield', tag: 'Pointy hats and questionable spell safety.', fresh: true, gen() {
      const w = D.wizard;
      return { name: `${P(w.first)} ${P(w.title)}`, flavor: `Master of ${P(w.school)}. ${P(w.flavor)}.` };
    } },
    dragon: { label: 'Dragon', icon: '🐉', c: '#c0392b', art: 'shield', tag: 'Hoarders of gold and also, weirdly, teapots.', fresh: true, gen() {
      const d = D.dragon, nm = P(d.start) + P(d.end);
      return { name: chance(.7) ? `${nm} ${P(d.epi)}` : nm, flavor: `A ${P(d.colour)} dragon, ${ri(200, 3000)} years old. Hoards ${P(d.hoard)}.` };
    } },
    pirate: { label: 'Pirate', icon: '🏴‍☠️', c: '#2d3436', art: 'shield', tag: 'Arr. Also: please return my parrot.', fresh: true, gen() {
      const p = D.pirate, n = rnd();
      const name = n < .4 ? `${P(p.first)} "${P(p.nick)}" ${P(p.last)}` : n < .75 ? `Captain ${P(p.first)} ${P(p.last)}` : `${P(p.first)} ${P(p.nick)}`;
      return { name, flavor: `Captain of the ${P(p.ships)}. ${P(p.flavor)}.` };
    } },
    planet: { label: 'Planet', icon: '🪐', c: '#3d7cff', art: 'planet', tag: 'Worlds nobody has visited yet. Pack a jumper.', gen() {
      const r = rnd();
      let name = planetGen(4, 9);
      if (r < .2) name = `${P(D.planet.cats)}-${ri(10, 9999)} ${P(['b', 'c', 'd', 'e', 'f'])}`;
      else if (r < .45) name += ' ' + P(roman);
      else if (r < .58) name = `${P(D.planet.greek)} ${name}`;
      const moons = chance(.2) ? 'no moons' : (() => { const n = ri(1, 9); return `${n} moon${n > 1 ? 's' : ''}`; })();
      return { name, flavor: `${cap(P(D.planet.types))} · ${moons} · a day lasts ${ri(4, 300)} hours · famous for ${P(D.planet.famous)}` };
    } },
    ship: { label: 'Spaceship', icon: '🚀', c: '#00a8c6', art: 'shield', tag: 'Fuelled by coffee and wishful thinking.', fresh: true, gen() {
      const s = D.ship;
      const name = chance(.6) ? `${P(s.pre)} ${P(s.adj)} ${P(s.noun)}` : `The ${P(s.adj)} ${P(s.noun)}`;
      return { name, flavor: `${cap(P(s.cls))}, crew of ${ri(1, 400)}. Rumour says ${P(s.flavor)}.` };
    } },
    robot: { label: 'Robot', icon: '🤖', c: '#7f8c8d', art: 'shield', tag: 'Beep boop, but make it personal.', fresh: true, gen() {
      const r = D.robot, n = rnd();
      const name = n < .4 ? `${P(r.pre)}-${ri(1, 999)}` : n < .75 ? `${P(r.names)} ${P(r.pre)}${ri(1, 99)}` : `${P(r.names)}bot`;
      return { name, flavor: `A ${P(r.jobs)} that ${P(r.quirk)}.` };
    } },
    villain: { label: 'Villain', icon: '🦹', c: '#8e44ad', art: 'shield', tag: 'Evil laugh sold separately.', fresh: true, gen() {
      const v = D.villain;
      return { name: `${P(v.title)} ${P(v.name)}`, flavor: `Plans to ${P(v.plan)}. Lives in ${P(v.lair)}.` };
    } },
    hero: { label: 'Superhero', icon: '🦸', c: '#d64545', art: 'shield', tag: 'Capes optional, puns mandatory.', gen() {
      const h = D.hero, n = rnd();
      let name;
      if (n < .35) name = `${P(h.core)}${P(h.suf)}`;
      else if (n < .6) name = `${P(h.pre)} ${P(h.core)}`;
      else if (n < .8) name = `The ${P(h.core)} ${cap(P(h.suf))}`;
      else name = `${P(h.pre)} ${P(h.silly)}`;
      return { name, flavor: `Power: ${P(h.powers)}. Weakness: ${P(h.weak)}.` };
    } },
    wrestler: { label: 'Wrestler', icon: '🤼', c: '#ffb300', art: 'shield', tag: 'Ladies and gentlemen, in the red corner...', gen() {
      const w = D.wrestler, n = rnd();
      let name;
      if (n < .3) name = `${P(w.adj)} ${P(w.first)} ${P(w.last)}`;
      else if (n < .5) name = `The ${P(w.adj)} ${P(w.nouns)}`;
      else if (n < .7) name = `${P(w.first)} "${P(w.nick)}" ${P(w.last)}`;
      else if (n < .85) name = `${P(w.adj)} ${P(w.nouns)}`;
      else name = `${P(w.first)} the ${P(w.nouns)}`;
      return { name, flavor: `Hails from ${P(w.from)}. Finisher: the ${P(w.mv1)} ${P(w.mv2)} ${P(w.mv3)}.` };
    } },
    band: { label: 'Band', icon: '🎸', c: '#e84393', art: 'record', tag: 'Tonight only, at a garage near you.', gen() {
      const b = D.band, n = rnd();
      let name;
      if (n < .25) name = `The ${P(b.adj)} ${P(b.plural)}`;
      else if (n < .4) { const a = P(b.noun); let c = P(b.noun); while (c === a) c = P(b.noun); name = `${a} ${c}`; }
      else if (n < .52) name = `${P(b.adj)} ${P(b.noun)}`;
      else if (n < .62) name = `${P(b.plural)} of ${P(b.noun)}`;
      else if (n < .72) name = `${P(b.names)} and the ${P(b.plural)}`;
      else if (n < .8) name = `${P(['Two', 'Three', 'Seven', 'Twelve', 'Forty', 'A Thousand', 'Ninety-Nine'])} ${P(b.plural)}`;
      else if (n < .9) name = `${P(b.verbs)} ${P(b.plural)}`;
      else name = `${P(b.noun)}${P(['', 's'])} ${P(['Club', 'Society', 'Machine', 'Collective', 'Orchestra', 'Department', 'Situation'])}`;
      return { name, flavor: `${cap(P(b.genres))} · debut album "${P(b.adj)} ${P(b.noun)}"` };
    } },
    pet: { label: 'Pet', icon: '🐶', c: '#ff9f43', art: 'shield', tag: 'For good boys, good girls and grumpy cats.', gen() {
      const p = D.pet, n = rnd();
      let name;
      if (n < .35) name = P(p.names);
      else if (n < .6) name = `${P(p.titles)} ${P(p.names)}`;
      else if (n < .85) name = `${P(p.names)} ${P(p.surnames)}`;
      else name = `${P(p.titles)} ${P(p.names)} ${P(p.surnames)}`;
      return { name, flavor: `Perfect for ${an(P(p.animals))} who ${P(p.traits)}` };
    } },
    horse: { label: 'Racehorse', icon: '🐎', c: '#b5651d', art: 'shield', tag: 'And they are off! Well, most of them.', fresh: true, gen() {
      const h = D.horse;
      const name = chance(.18) ? P(h.silly) : `${P(h.a)} ${P(h.b)}`;
      return { name, flavor: `${ri(2, 9)}-year-old, odds ${ri(2, 40)} to 1. ${P(h.flavor)}.` };
    } },
    tavern: { label: 'Tavern', icon: '🍺', c: '#d35400', art: 'shield', tag: 'Where every quest begins and most of them end.', fresh: true, gen() {
      const t = D.tavern;
      const name = chance(.75) ? `The ${P(t.adj)} ${P(t.noun)}` : `The ${P(t.noun)} and ${P(t.noun)}`;
      return { name, flavor: `Famous for ${P(t.special)}. ${P(t.flavor)}.` };
    } },
    town: { label: 'Town', icon: '🏰', c: '#16a085', art: 'shield', tag: 'Fantasy map, sold separately.', fresh: true, gen() {
      const t = D.town, name = P(t.pre) + P(t.suf);
      return { name: chance(.15) ? `${name}-on-${P(['Sea', 'Marsh', 'the Hill', 'Wold', 'Water'])}` : name, flavor: `A ${P(t.size)} of ${Curio.fmt(ri(40, 90000))} souls, known for ${P(t.known)}.` };
    } },
    potion: { label: 'Potion', icon: '🧪', c: '#e056fd', art: 'potion', tag: 'Shake well. Do not drink near cats.', fresh: true, gen() {
      const p = D.potion;
      return { name: `${P(p.adj)} ${P(p.noun)} of ${P(p.of)}`, flavor: `Tastes like ${P(p.taste)}. Side effects: ${P(p.side)}.` };
    } },
    cafe: { label: 'Café', icon: '☕', c: '#8d6e63', art: 'app', tag: 'Oat milk? Of course. Wi-Fi? Sort of.', fresh: true, gen() {
      const c = D.cafe;
      const name = chance(.3) ? P(c.pun) : `${P(c.a)} ${P(c.b)}`;
      return { name, flavor: `Known for ${P(c.known)}.` };
    } },
    startup: { label: 'Startup', icon: '💡', c: '#8e5cff', art: 'app', tag: 'Disrupting things that were fine, actually.', gen() {
      const s = D.startup, n = rnd();
      let name;
      if (n < .35) name = cap(P(s.syl) + P(s.syl) + (chance(.5) ? P(s.suffix) : ''));
      else if (n < .6) name = P(s.words) + P(s.suffix);
      else if (n < .75) name = `${P(s.words)} ${P(['Labs', 'HQ', 'Works', 'Collective', 'Technologies', 'Systems'])}`;
      else if (n < .9) name = `${P(s.words)}${P(s.words)}`;
      else name = `${cap(P(s.syl))}.${P(['ai', 'io', 'ly', 'app', 'co', 'so'])}`;
      const raised = (rnd() * 40 + .5).toFixed(1);
      return { name, flavor: `${cap(P(s.pitches).replace('{t}', P(s.things)))}. Raised $${raised}M in ${P(s.rounds)} funding.` };
    } }
  };
  const CAT_KEYS = Object.keys(CATS);
  const GENDER = { any: 'Any', fem: 'Feminine', masc: 'Masculine' };
  const st = Object.assign({ v: 2, cat: 'elf', gender: 'any', made: 0, deck: 'bands', tried: [] }, Curio.store.get('namegen', {}) || {});
  if (!CATS[st.cat]) st.cat = 'elf';
  if (!GENDER[st.gender]) st.gender = 'any';
  if (!Array.isArray(st.tried)) st.tried = [];
  if (!Q[st.deck]) st.deck = 'bands';
  let favs = (Curio.store.get('namegen-favs', []) || []).filter((f) => f && typeof f.name === 'string');
  const quizBest = Curio.store.get('namegen-quiz', {}) || {};
  let badges = Curio.store.get('namegen-badges', []) || [];
  let current = [], hero = null;
  const save = () => Curio.store.set('namegen', st);

  const BADGES = [
    { id: 'n100', icon: '✍️', name: 'Christener', d: 'Invent 100 names' },
    { id: 'n1000', icon: '📜', name: 'Name factory', d: 'Invent 1,000 names' },
    { id: 'all', icon: '🗺️', name: 'World builder', d: 'Try every kind of name' },
    { id: 'fav', icon: '❤️', name: 'Keeper', d: 'Favourite a name' },
    { id: 'fav25', icon: '📚', name: 'Name hoarder', d: 'Keep 25 favourites' },
    { id: 'mine', icon: '🔮', name: 'Alter ego', d: 'Make your own version' },
    { id: 'card', icon: '🃏', name: 'Card shark', d: 'Save a name card' },
    { id: 'quiz', icon: '🕵️', name: 'Detective', d: 'Finish a Real or Fake round' },
    { id: 'quiz8', icon: '🔍', name: 'Sharp eye', d: 'Score 8+ in Real or Fake' },
    { id: 'quiz10', icon: '🏆', name: 'Lie detector', d: 'Score a perfect 10' },
    { id: 'streak', icon: '🔥', name: 'On fire', d: 'Get 15 right in a row' }
  ];
  function badge(id) {
    if (badges.includes(id)) return;
    badges.push(id); Curio.store.set('namegen-badges', badges);
    const b = BADGES.find((x) => x.id === id);
    if (b) { Curio.toast(`${b.icon} Badge: ${b.name}`, 2400); [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, .1, 'triangle', .06), i * 80)); }
    renderBadges();
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; } else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  }
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const initials = (name) => name.replace(/["',.]/g, '').split(/\s+/).filter((w) => /^[A-Z0-9]/.test(w) && !['The', 'Of', 'And'].includes(w)).slice(0, 2).map((w) => w[0]).join('') || name[0].toUpperCase();
  let uid = 0;
  function art(catKey, name) {
    const c = CATS[catKey], h = hash(name + catKey), u = 'a' + (++uid);
    const hue = (h % 360);
    const base = c.c, alt = `hsl(${hue} 70% 62%)`, dark = shade(base, -.35), light = shade(base, .55);
    if (c.art === 'planet') {
      const ring = h % 3 === 0, moons = (h >>> 3) % 3;
      let bands = '';
      for (let i = 0; i < 6; i++) bands += `<rect x="0" y="${22 + i * 10 + ((h >>> i) % 4)}" width="100" height="${3 + ((h >>> (i + 2)) % 5)}" fill="${i % 2 ? light : dark}" opacity=".5"/>`;
      return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="${u}" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="${shade(alt, 0)}"/><stop offset="1" stop-color="${base}"/></radialGradient><clipPath id="${u}c"><circle cx="50" cy="50" r="30"/></clipPath></defs><rect width="100" height="100" rx="22" fill="#14123a"/>${[[14, 18], [84, 24], [20, 80], [78, 84], [60, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="#fff" opacity=".8"/>`).join('')}${ring ? `<ellipse cx="50" cy="52" rx="46" ry="11" fill="none" stroke="${light}" stroke-width="4" opacity=".6" transform="rotate(-18 50 52)"/>` : ''}<circle cx="50" cy="50" r="30" fill="url(#${u})"/><g clip-path="url(#${u}c)">${bands}</g><circle cx="50" cy="50" r="30" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/>${ring ? `<path d="M6 63 Q50 76 94 41" fill="none" stroke="${light}" stroke-width="4" opacity=".85" transform="rotate(0)"/>` : ''}${Array.from({ length: moons }, (_, i) => `<circle cx="${18 + i * 64}" cy="${36 + i * 30}" r="${4 + i}" fill="#ddd"/>`).join('')}</svg>`;
    }
    if (c.art === 'record') {
      return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="${alt}"/><circle cx="56" cy="50" r="40" fill="#151515"/>${[34, 28, 22].map((r) => `<circle cx="56" cy="50" r="${r}" fill="none" stroke="#2c2c2c" stroke-width="1.5"/>`).join('')}<circle cx="56" cy="50" r="15" fill="${base}"/><circle cx="56" cy="50" r="2.5" fill="#151515"/><text x="56" y="47" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="8" fill="#fff">${esc(initials(name))}</text><rect x="6" y="10" width="40" height="80" rx="4" fill="${shade(alt, -.15)}" opacity=".85"/><text x="26" y="56" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#fff">${esc(initials(name))}</text></svg>`;
    }
    if (c.art === 'potion') {
      return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22" fill="${light}"/><path d="M42 14 H58 V34 C74 40 80 52 80 64 C80 80 66 90 50 90 C34 90 20 80 20 64 C20 52 26 40 42 34Z" fill="#fff" fill-opacity=".55" stroke="${dark}" stroke-width="3"/><path d="M22 62 C34 56 46 68 58 62 C66 58 74 60 78 62 C78 78 66 88 50 88 C34 88 22 78 22 62Z" fill="${alt}"/><rect x="39" y="8" width="22" height="9" rx="3" fill="#a0522d"/><g fill="#fff" opacity=".8"><circle cx="42" cy="72" r="3"/><circle cx="56" cy="66" r="2"/><circle cx="62" cy="78" r="2.5"/></g><path d="M30 50 Q32 44 38 42" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>`;
    }
    if (c.art === 'app') {
      return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${alt}"/><stop offset="1" stop-color="${base}"/></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(#${u})"/><circle cx="${30 + h % 40}" cy="${30 + (h >>> 4) % 40}" r="${16 + h % 14}" fill="#fff" opacity=".18"/><text x="50" y="66" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="44" fill="#fff">${esc(initials(name)[0])}</text></svg>`;
    }
    const div = h % 5;
    const patterns = [
      '',
      `<path d="M50 6 V96" stroke="${light}" stroke-width="0"/><path d="M50 8 L86 16 V50 C86 74 70 88 50 96Z" fill="${light}" opacity=".55"/>`,
      `<path d="M14 58 L50 34 L86 58 L86 70 L50 46 L14 70Z" fill="${light}" opacity=".7"/>`,
      `<path d="M14 16 L86 70 L86 84 L14 30Z" fill="${light}" opacity=".6"/>`,
      `<path d="M50 8 L86 16 V50 H50Z M14 50 H50 V96 C30 88 14 74 14 50Z" fill="${light}" opacity=".55"/>`
    ];
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(base, .15)}"/><stop offset="1" stop-color="${shade(base, -.2)}"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="${shade(base, .78)}"/><path d="M50 8 L86 16 V50 C86 74 70 88 50 96 C30 88 14 74 14 50 V16Z" fill="url(#${u})" stroke="${dark}" stroke-width="3"/>${patterns[div]}<circle cx="50" cy="50" r="17" fill="#fff" opacity=".9"/><text x="50" y="58" text-anchor="middle" font-size="22">${c.icon}</text><path d="M20 80 Q50 90 80 80 L76 92 Q50 100 24 92Z" fill="${alt}" stroke="${dark}" stroke-width="2"/><text x="50" y="93" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="8" fill="#fff">${esc(initials(name))}</text></svg>`;
  }

  CAT_KEYS.forEach((k) => {
    const c = CATS[k];
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ng-cat'; b.dataset.k = k; b.style.setProperty('--c', c.c);
    b.innerHTML = `<i aria-hidden="true">${c.icon}</i>${c.label}${c.fresh ? '<span class="new">NEW</span>' : ''}`;
    b.addEventListener('click', () => pickCat(k));
    $('cats').append(b);
  });
  function pickCat(k) {
    if (st.cat === k) { generate(); return; }
    st.cat = k; hero = null; save(); paintCats(true); generate();
  }
  function paintCats(swap) {
    const c = CATS[st.cat];
    $('cats').querySelectorAll('.ng-cat').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === st.cat)));
    $('gender').style.display = c.gender ? '' : 'none';
    document.body.style.setProperty('--c', c.c);
    $('stage').style.setProperty('--c', c.c);
    $('big').textContent = c.icon;
    if (swap) { $('big').classList.remove('swap'); void $('big').offsetWidth; $('big').classList.add('swap'); }
    $('stageTitle').textContent = `${c.label} names`;
    $('stageTag').textContent = c.tag;
    $('mineIn').placeholder = `Your name, as ${an(c.label.toLowerCase())}`;
  }
  Object.entries(GENDER).forEach(([k, label]) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.dataset.g = k;
    b.addEventListener('click', () => { st.gender = k; save(); paintGender(); generate(); });
    $('gender').append(b);
  });
  function paintGender() { $('gender').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === st.gender))); }

  const isFav = (n) => favs.some((f) => f.name === n);
  function generate() {
    rnd = Math.random;
    const c = CATS[st.cat], seen = new Set();
    current = [];
    for (let t = 0; current.length < 8 && t < 60; t++) { const r = c.gen(st.gender); if (!seen.has(r.name)) { seen.add(r.name); current.push(r); } }
    st.made += current.length;
    if (!st.tried.includes(st.cat)) st.tried.push(st.cat);
    save();
    renderList();
    if (!Curio.muted) [0, 1, 2].forEach((i) => setTimeout(() => Curio.beep(520 + i * 140 + Math.random() * 40, .05, 'triangle', .05), i * 50));
    if (st.made >= 100) badge('n100');
    if (st.made >= 1000) badge('n1000');
    if (st.tried.length >= CAT_KEYS.length) badge('all');
  }
  $('mine').addEventListener('submit', (e) => {
    e.preventDefault();
    const who = $('mineIn').value.trim();
    if (!who) { $('mineIn').focus(); Curio.toast('Type a name first'); return; }
    rnd = seeded(who.toLowerCase() + '|' + st.cat + '|' + st.gender);
    const r = CATS[st.cat].gen(st.gender);
    rnd = Math.random;
    hero = Object.assign({ who }, r);
    renderList();
    badge('mine');
    [392, 523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, .12, 'sine', .07), i * 90));
    Curio.confetti(60);
  });

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  function scramble(el, text, delay) {
    if (reduce) { el.textContent = text; return; }
    const start = performance.now() + delay, dur = 420;
    el.textContent = text.replace(/[A-Za-z]/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
    (function tick(now) {
      const t = Math.max(0, (now - start) / dur);
      if (t >= 1 || !el.isConnected) { el.textContent = text; return; }
      const keep = Math.floor(text.length * t);
      el.textContent = text.slice(0, keep) + text.slice(keep).replace(/[A-Za-z]/g, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
      requestAnimationFrame(tick);
    })(performance.now());
  }
  function card(r, i, isHero) {
    const c = CATS[st.cat];
    const el = document.createElement('div'); el.className = 'ng-card' + (isHero ? ' hero' : ''); el.style.setProperty('--c', c.c); el.style.animationDelay = (i * 45) + 'ms';
    const a = document.createElement('button'); a.type = 'button'; a.className = 'ng-art'; a.innerHTML = art(st.cat, r.name); a.setAttribute('aria-label', 'Open name card for ' + r.name);
    a.addEventListener('click', () => openCard(r, st.cat));
    const txt = document.createElement('div'); txt.className = 'ng-txt';
    if (isHero) { const k = document.createElement('div'); k.className = 'ng-kicker'; k.textContent = `${r.who}, as ${an(c.label.toLowerCase())}`; txt.append(k); }
    const nm = document.createElement('button'); nm.type = 'button'; nm.className = 'ng-name'; nm.title = 'Copy';
    scramble(nm, r.name, i * 45);
    nm.addEventListener('click', () => copy(r.name, `"${r.name}" copied`));
    const fl = document.createElement('div'); fl.className = 'ng-fl'; fl.textContent = r.flavor;
    txt.append(nm, fl);
    const h = document.createElement('button'); h.type = 'button'; h.className = 'ng-heart';
    const paintH = () => { const on = isFav(r.name); h.textContent = on ? '❤️' : '🤍'; h.setAttribute('aria-label', (on ? 'Remove ' : 'Favourite ') + r.name); h.setAttribute('aria-pressed', String(on)); };
    paintH();
    h.addEventListener('click', () => { toggleFav({ name: r.name, flavor: r.flavor, cat: st.cat }); paintH(); h.classList.remove('beat'); void h.offsetWidth; h.classList.add('beat'); });
    el.append(a, txt, h);
    return el;
  }
  function renderList() {
    const list = $('list'); list.innerHTML = '';
    if (hero) list.append(card(hero, 0, true));
    current.forEach((r, i) => list.append(card(r, i + (hero ? 1 : 0), false)));
    $('count').textContent = `${Curio.fmt(st.made)} names invented on this device so far`;
  }
  async function openCard(r, cat) {
    const c = CATS[cat];
    const box = document.createElement('div'); box.className = 'ng-cardbig';
    box.innerHTML = art(cat, r.name) + `<b></b><span class="c-muted" style="text-align:center"></span>`;
    box.querySelector('b').textContent = r.name; box.querySelector('span').textContent = r.flavor;
    Curio.beep(660, .06, 'sine', .06);
    const v = await Curio.modal({ emoji: c.icon, title: `${c.label} name card`, body: box, buttons: [{ label: '🖼️ Save card', value: 'save' }, { label: 'Copy name', value: 'copy' }, { label: 'Close', value: 'x' }] });
    if (v === 'copy') copy(r.name, `"${r.name}" copied`);
    if (v === 'save') saveCard(r, cat);
  }
  function wrap(g, text, x, y, maxW, lh) {
    const words = text.split(' '); let line = '', yy = y;
    for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, yy); line = w; yy += lh; } else line = t; }
    if (line) g.fillText(line, x, yy);
    return yy;
  }
  function saveCard(r, cat) {
    const c = CATS[cat], W = 800, H = 1000;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    const grd = g.createLinearGradient(0, 0, W, H); grd.addColorStop(0, shade(c.c, .7)); grd.addColorStop(1, shade(c.c, .25));
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); if (g.roundRect) g.roundRect(50, 50, W - 100, H - 100, 40); else g.rect(50, 50, W - 100, H - 100); g.fill();
    const img = new Image();
    const url = URL.createObjectURL(new Blob([art(cat, r.name).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" ')], { type: 'image/svg+xml' }));
    img.onload = () => {
      g.drawImage(img, 220, 110, 360, 360); URL.revokeObjectURL(url);
      g.textAlign = 'center'; g.fillStyle = shade(c.c, -.4); g.font = '900 26px system-ui, sans-serif';
      g.fillText(c.label.toUpperCase() + ' NAME', W / 2, 540);
      g.fillStyle = '#1d1b19'; g.font = '900 56px system-ui, sans-serif';
      const y = wrap(g, r.name, W / 2, 620, W - 180, 64);
      g.fillStyle = '#5d5750'; g.font = '600 30px system-ui, sans-serif';
      wrap(g, r.flavor, W / 2, y + 70, W - 200, 40);
      g.fillStyle = '#948c82'; g.font = '800 22px system-ui, sans-serif'; g.fillText('Zoble Name Generator', W / 2, H - 90);
      cv.toBlob((b) => {
        if (!b) return;
        const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'curio-' + r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.png';
        document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        Curio.toast('Name card saved 🃏'); badge('card');
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); Curio.toast('Could not draw the card'); };
    img.src = url;
  }
  function toggleFav(r) {
    const i = favs.findIndex((f) => f.name === r.name);
    if (i >= 0) favs.splice(i, 1);
    else {
      favs.unshift(r); favs = favs.slice(0, 150);
      Curio.beep(784, .06, 'sine', .08); setTimeout(() => Curio.beep(1175, .08, 'sine', .07), 60);
      if (navigator.vibrate) try { navigator.vibrate(10); } catch {}
      if (favs.length === 1 || favs.length % 10 === 0) { Curio.confetti(60); Curio.toast(favs.length === 1 ? 'First favourite! ❤️' : `${favs.length} favourites, what a collection`); }
      badge('fav'); if (favs.length >= 25) badge('fav25');
    }
    Curio.store.set('namegen-favs', favs); renderFavs();
  }
  function renderFavs() {
    const el = $('favs'); el.innerHTML = '';
    $('copyFavs').hidden = !favs.length;
    if (!favs.length) { el.innerHTML = '<p class="c-muted" style="margin:0">Tap a 🤍 to keep a name here. They stay on this device.</p>'; return; }
    favs.forEach((f) => {
      const row = document.createElement('div'); row.className = 'ng-fav';
      const icon = document.createElement('span'); icon.textContent = (CATS[f.cat] || {}).icon || '⭐'; icon.setAttribute('aria-hidden', 'true');
      const b = document.createElement('b'); b.textContent = f.name; b.title = f.flavor || '';
      const cd = document.createElement('button'); cd.type = 'button'; cd.textContent = '🃏'; cd.setAttribute('aria-label', 'Name card for ' + f.name);
      cd.addEventListener('click', () => openCard(f, CATS[f.cat] ? f.cat : 'elf'));
      const cp = document.createElement('button'); cp.type = 'button'; cp.textContent = 'Copy'; cp.addEventListener('click', () => copy(f.name, `"${f.name}" copied`));
      const x = document.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'Remove ' + f.name);
      x.addEventListener('click', () => { toggleFav(f); renderList(); });
      row.append(icon, b, cd, cp, x); el.append(row);
    });
  }
  async function copy(text, msg) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch {} ta.remove();
    }
    Curio.toast(ok ? msg : 'Copy failed');
    if (ok) Curio.beep(990, .04, 'sine', .05);
    return ok;
  }
  $('copyFavs').addEventListener('click', () => copy(favs.map((f) => f.name).join('\n'), `${favs.length} names copied`));
  $('go').addEventListener('click', () => { hero = null; generate(); });

  let qz = null;
  Object.entries(Q).forEach(([k, d]) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.d = k; b.textContent = `${d.icon} ${d.label}`;
    b.addEventListener('click', () => { st.deck = k; save(); quizStart(); });
    $('decks').append(b);
  });
  function fakeFor(deck) {
    const realSet = new Set(Q[deck].real.map((x) => x.toLowerCase()));
    for (let t = 0; t < 40; t++) {
      rnd = Math.random;
      let n = deck === 'bands' ? CATS.band.gen().name : deck === 'startups' ? CATS.startup.gen().name : elfAll(5, 10);
      if (deck === 'startups' && / /.test(n) && chance(.6)) continue;
      if (!realSet.has(n.toLowerCase())) return n;
    }
    return 'Glorbnax';
  }
  function quizStart() {
    $('decks').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.d === st.deck)));
    const reals = Curio.shuffle(Q[st.deck].real.slice());
    const items = [];
    for (let i = 0; i < 10; i++) items.push(Math.random() < .5 ? { name: reals[i], real: true } : { name: fakeFor(st.deck), real: false });
    qz = { items, i: 0, score: 0, results: [], streak: 0, locked: false };
    $('qReal').disabled = $('qFake').disabled = false;
    $('qFake').textContent = '🤖 Fake';
    quizShow();
  }
  function quizShow() {
    const it = qz.items[qz.i];
    const el = $('qname'); el.className = 'ng-qname'; el.textContent = it.name;
    $('qinfo').textContent = Q[st.deck].note || `Round ${qz.i + 1} of 10`;
    $('qdots').innerHTML = qz.items.map((_, i) => `<i class="${qz.results[i] === true ? 'g' : qz.results[i] === false ? 'b' : ''}${i === qz.i ? ' c' : ''}"></i>`).join('');
    const best = quizBest[st.deck] || 0;
    $('qmeta').innerHTML = `<div class="c-stat"><b>${qz.score}</b><span>Score</span></div><div class="c-stat"><b>${qz.streak}</b><span>Streak</span></div><div class="c-stat"><b>${best}/10</b><span>Best</span></div>`;
    qz.locked = false;
  }
  let bigStreak = 0;
  function quizAnswer(saysReal) {
    if (!qz || qz.locked) return;
    if (qz.i >= 10) { quizStart(); return; }
    qz.locked = true;
    const it = qz.items[qz.i], ok = saysReal === it.real;
    qz.results[qz.i] = ok;
    if (ok) { qz.score++; qz.streak++; bigStreak++; Curio.beep(660 + qz.streak * 40, .08, 'triangle', .07); setTimeout(() => Curio.beep(990 + qz.streak * 40, .1, 'triangle', .06), 70); }
    else { qz.streak = 0; bigStreak = 0; Curio.beep(180, .25, 'sawtooth', .05); if (navigator.vibrate) try { navigator.vibrate(60); } catch {} }
    if (bigStreak >= 15) badge('streak');
    $('qname').className = 'ng-qname ' + (ok ? 'good' : 'bad');
    $('qinfo').textContent = `${ok ? 'Yes!' : 'Nope!'} That one is ${it.real ? 'real' : 'made up by this page'}.`;
    setTimeout(() => {
      qz.i++;
      if (qz.i >= 10) quizEnd(); else quizShow();
    }, 1100);
  }
  function quizEnd() {
    const prev = quizBest[st.deck] || 0;
    if (qz.score > prev) { quizBest[st.deck] = qz.score; Curio.store.set('namegen-quiz', quizBest); }
    badge('quiz'); if (qz.score >= 8) badge('quiz8'); if (qz.score === 10) badge('quiz10');
    if (qz.score >= 8) Curio.confetti(120);
    const verdict = qz.score === 10 ? 'Flawless. Are you a robot?' : qz.score >= 8 ? 'Sharp as a tack' : qz.score >= 6 ? 'Pretty good instincts' : qz.score >= 4 ? 'The names fooled you a bit' : 'The machines are winning';
    $('qname').className = 'ng-qname'; $('qname').textContent = `${qz.score}/10`;
    $('qinfo').textContent = verdict + (qz.score > prev ? ' · new best!' : '');
    $('qdots').innerHTML = qz.results.map((r) => `<i class="${r ? 'g' : 'b'}"></i>`).join('');
    $('qmeta').innerHTML = `<div class="c-stat"><b>${quizBest[st.deck] || 0}/10</b><span>Best</span></div><button class="c-btn c-btn--ghost" id="qShare" type="button">📋 Share</button>`;
    $('qShare').addEventListener('click', () => copy(`🕵️ Zoble Real or Fake (${Q[st.deck].label}): ${qz.score}/10\n${qz.results.map((r) => (r ? '🟩' : '🟥')).join('')}`, 'Result copied 📋'));
    $('qFake').textContent = '🔁 Play again';
    $('qReal').disabled = true;
    qz.locked = false;
    [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, .12, 'sine', .07), i * 100));
  }
  $('qReal').addEventListener('click', () => quizAnswer(true));
  $('qFake').addEventListener('click', () => { if (qz && qz.i >= 10) { $('qReal').disabled = false; quizStart(); } else quizAnswer(false); });

  function renderBadges() {
    const el = $('badges'); el.innerHTML = '';
    BADGES.forEach((b) => {
      const d = document.createElement('div'); d.className = 'ng-badge' + (badges.includes(b.id) ? ' got' : '');
      d.innerHTML = `<i aria-hidden="true">${b.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d;
      el.append(d);
    });
    $('badgeCount').textContent = `${badges.length}/${BADGES.length} · ${st.tried.length}/${CAT_KEYS.length} kinds tried`;
  }

  addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select, button') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('.curio-modal')) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hero = null; generate(); }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const i = CAT_KEYS.indexOf(st.cat);
      pickCat(CAT_KEYS[(i + (e.key === 'ArrowRight' ? 1 : CAT_KEYS.length - 1)) % CAT_KEYS.length]);
    }
  });
  paintCats(); paintGender(); generate(); renderFavs(); renderBadges(); quizStart();
})();
