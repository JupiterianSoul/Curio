(function (root) {
  const N = 10;
  const FLEET = [
    { id: 'carrier', name: 'Carrier', len: 5 },
    { id: 'battleship', name: 'Battleship', len: 4 },
    { id: 'cruiser', name: 'Cruiser', len: 3 },
    { id: 'submarine', name: 'Submarine', len: 3 },
    { id: 'destroyer', name: 'Destroyer', len: 2 }
  ];
  const UNKNOWN = 0, MISS = 1, HIT = 2, SUNK = 3;

  const cellsOf = (s) => Array.from({ length: s.len }, (_, k) => (s.dir ? (s.r + k) * N + s.c : s.r * N + s.c + k));

  function fits(ships, s, ignoreId) {
    if (s.r == null || s.r < 0 || s.c < 0) return false;
    if (s.dir ? s.r + s.len > N : s.c + s.len > N) return false;
    const occ = new Set();
    for (const o of ships) if (o.id !== ignoreId && o.r != null) for (const x of cellsOf(o)) occ.add(x);
    return cellsOf(s).every((x) => !occ.has(x));
  }

  function randomFleet(rand = Math.random) {
    const ships = [];
    for (const f of FLEET) {
      let s;
      do s = { ...f, dir: rand() < 0.5 ? 0 : 1, r: Math.floor(rand() * N), c: Math.floor(rand() * N) };
      while (!fits(ships, s));
      ships.push(s);
    }
    return ships;
  }

  function shipAt(ships, i) { return ships.find((s) => s.r != null && cellsOf(s).includes(i)) || null; }

  function density(shots, lens) {
    const heat = new Array(N * N).fill(0);
    const hasHits = shots.some((v) => v === HIT);
    for (const len of lens) {
      for (let dir = 0; dir < 2; dir++) {
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          if (dir ? r + len > N : c + len > N) continue;
          const cells = cellsOf({ r, c, dir, len });
          if (cells.some((x) => shots[x] === MISS || shots[x] === SUNK)) continue;
          const covered = cells.reduce((n, x) => n + (shots[x] === HIT ? 1 : 0), 0);
          if (hasHits && !covered) continue;
          const w = hasHits ? covered * covered * 10 : 1;
          for (const x of cells) if (shots[x] === UNKNOWN) heat[x] += w;
        }
      }
    }
    return heat;
  }

  function neighbours(i) {
    const r = Math.floor(i / N), c = i % N, out = [];
    if (r > 0) out.push(i - N);
    if (r < N - 1) out.push(i + N);
    if (c > 0) out.push(i - 1);
    if (c < N - 1) out.push(i + 1);
    return out;
  }

  function aiShot(shots, lens, level, rand = Math.random) {
    const open = [];
    for (let i = 0; i < N * N; i++) if (shots[i] === UNKNOWN) open.push(i);
    if (!open.length) return -1;
    if (level === 'easy') {
      const hits = [];
      for (let i = 0; i < N * N; i++) if (shots[i] === HIT) hits.push(i);
      const near = [...new Set(hits.flatMap(neighbours))].filter((x) => shots[x] === UNKNOWN);
      const pool = near.length && rand() < 0.75 ? near : open;
      return pool[Math.floor(rand() * pool.length)];
    }
    let heat = density(shots, lens);
    if (!heat.some((h) => h > 0)) heat = density(shots.map((v) => (v === HIT ? SUNK : v)), lens);
    let best = -1, bestVal = -1, ties = 0;
    for (const i of open) {
      const v = heat[i] + (shots.some((x) => x === HIT) ? 0 : ((Math.floor(i / N) + i) % 2 === 0 ? 0.5 : 0));
      if (v > bestVal) { bestVal = v; best = i; ties = 1; }
      else if (v === bestVal && rand() < 1 / ++ties) best = i;
    }
    return best;
  }

  root.Battleship = { N, FLEET, UNKNOWN, MISS, HIT, SUNK, cellsOf, fits, randomFleet, shipAt, density, aiShot };
})(typeof window !== 'undefined' ? window : globalThis);
