(() => {
  const R = Math.PI / 180;
  const sin = (d) => Math.sin(d * R), cos = (d) => Math.cos(d * R);
  const norm = (d) => ((d % 360) + 360) % 360;
  const SYN = 29.530588861;
  const jdFromMs = (ms) => ms / 864e5 + 2440587.5;
  const msFromJd = (jd) => (jd - 2440587.5) * 864e5;

  function deltaT(year) {
    const t = year - 2000;
    if (year < 1900) return -2.79 + 1.494119 * (year - 1800) - 0.0598939 * (year - 1800) ** 2;
    if (year < 1920) { const u = year - 1900; return -2.79 + 1.494119 * u - 0.0598939 * u * u + 0.0061966 * u ** 3 - 0.000197 * u ** 4; }
    if (year < 1941) { const u = year - 1920; return 21.20 + 0.84493 * u - 0.076100 * u * u + 0.0020936 * u ** 3; }
    if (year < 1961) { const u = year - 1950; return 29.07 + 0.407 * u - u * u / 233 + u ** 3 / 2547; }
    if (year < 1986) { const u = year - 1975; return 45.45 + 1.067 * u - u * u / 260 - u ** 3 / 718; }
    if (year < 2005) return 63.86 + 0.3345 * t - 0.060374 * t * t + 0.0017275 * t ** 3 + 0.000651814 * t ** 4 + 0.00002373599 * t ** 5;
    if (year < 2050) return 62.92 + 0.32217 * t + 0.005589 * t * t;
    if (year < 2150) return -20 + 32 * ((year - 1820) / 100) ** 2 - 0.5628 * (2150 - year);
    return -20 + 32 * ((year - 1820) / 100) ** 2;
  }

  const SMALL = [[-0.00007, 1, 2, 0, 0], [0.00004, 0, 2, 0, -2], [0.00004, 3, 0, 0, 0]];
  function truePhase(k) {
    const T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    let jde = 2451550.09766 + SYN * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
    const E = 1 - 0.002516 * T - 0.0000074 * T2;
    const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3;
    const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
    const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
    const O = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;
    const frac = Math.round((k - Math.floor(k)) * 4) % 4;
    let c = 0;
    if (frac === 0 || frac === 2) {
      const full = frac === 2;
      c += (full ? -0.40614 : -0.40720) * sin(Mp);
      c += (full ? 0.17302 : 0.17241) * E * sin(M);
      c += (full ? 0.01614 : 0.01608) * sin(2 * Mp);
      c += (full ? 0.01043 : 0.01039) * sin(2 * F);
      c += (full ? 0.00734 : 0.00739) * E * sin(Mp - M);
      c += (full ? -0.00515 : -0.00514) * E * sin(Mp + M);
      c += (full ? 0.00209 : 0.00208) * E * E * sin(2 * M);
      c += -0.00111 * sin(Mp - 2 * F);
      c += -0.00057 * sin(Mp + 2 * F);
      c += 0.00056 * E * sin(2 * Mp + M);
      c += -0.00042 * sin(3 * Mp);
      c += 0.00042 * E * sin(M + 2 * F);
      c += 0.00038 * E * sin(M - 2 * F);
      c += -0.00024 * E * sin(2 * Mp - M);
      c += -0.00017 * sin(O);
      c += -0.00007 * sin(Mp + 2 * M);
      c += 0.00004 * sin(2 * Mp - 2 * F);
      c += 0.00004 * sin(3 * M);
      c += 0.00003 * sin(Mp + M - 2 * F);
      c += 0.00003 * sin(2 * Mp + 2 * F);
      c += -0.00003 * sin(Mp + M + 2 * F);
      c += 0.00003 * sin(Mp - M + 2 * F);
      c += -0.00002 * sin(Mp - M - 2 * F);
      c += -0.00002 * sin(3 * Mp + M);
      c += 0.00002 * sin(4 * Mp);
    } else {
      c += -0.62801 * sin(Mp);
      c += 0.17172 * E * sin(M);
      c += -0.01183 * E * sin(Mp + M);
      c += 0.00862 * sin(2 * Mp);
      c += 0.00804 * sin(2 * F);
      c += 0.00454 * E * sin(Mp - M);
      c += 0.00204 * E * E * sin(2 * M);
      c += -0.0018 * sin(Mp - 2 * F);
      c += -0.0007 * sin(Mp + 2 * F);
      c += -0.0004 * sin(3 * Mp);
      c += -0.00034 * E * sin(2 * Mp - M);
      c += 0.00032 * E * sin(M + 2 * F);
      c += 0.00032 * E * sin(M - 2 * F);
      c += -0.00028 * E * E * sin(Mp + 2 * M);
      c += 0.00027 * E * sin(2 * Mp + M);
      c += -0.00017 * sin(O);
      c += -0.00005 * sin(Mp - M - 2 * F);
      c += 0.00004 * sin(2 * Mp + 2 * F);
      c += -0.00004 * sin(Mp + M + 2 * F);
      c += 0.00004 * sin(Mp - 2 * M);
      c += 0.00003 * sin(Mp + M - 2 * F);
      c += 0.00003 * sin(3 * M);
      c += 0.00002 * sin(2 * Mp - 2 * F);
      c += 0.00002 * sin(Mp - M + 2 * F);
      c += -0.00002 * sin(3 * Mp + M);
      const W = 0.00306 - 0.00038 * E * cos(M) + 0.00026 * cos(Mp) - 0.00002 * cos(Mp - M) + 0.00002 * cos(Mp + M) + 0.00002 * cos(2 * F);
      c += frac === 1 ? W : -W;
    }
    const A = [[299.77, 0.107408, 0.000325], [251.88, 0.016321, 0.000165], [251.83, 26.651886, 0.000164], [349.42, 36.412478, 0.000126], [84.66, 18.206239, 0.00011], [141.74, 53.303771, 0.000062], [207.14, 2.453732, 0.00006], [154.84, 7.30686, 0.000056], [34.52, 27.261239, 0.000047], [207.19, 0.121824, 0.000042], [291.34, 1.844379, 0.00004], [161.72, 24.198154, 0.000037], [239.56, 25.513099, 0.000035], [331.55, 3.592518, 0.000023]];
    A.forEach(([a, b, amp], i) => { c += amp * sin(a + b * k - (i === 0 ? 0.009173 * T2 : 0)); });
    jde += c;
    const year = 2000 + k / 12.3685;
    return msFromJd(jde - deltaT(year) / 86400);
  }

  function phasesAround(ms) {
    const y = 2000 + (ms - Date.UTC(2000, 0, 1)) / (365.25 * 864e5);
    const k0 = Math.floor((y - 2000) * 12.3685) - 2;
    const list = [];
    for (let k = k0; k < k0 + 6; k++) for (let q = 0; q < 4; q++) list.push({ type: q, t: truePhase(k + q / 4) });
    list.sort((a, b) => a.t - b.t);
    return list;
  }

  function fundamentals(ms) {
    const jd = jdFromMs(ms);
    const T = (jd + deltaT(new Date(ms).getUTCFullYear()) / 86400 - 2451545) / 36525;
    const D = norm(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T ** 3 / 545868);
    const M = norm(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
    const Mp = norm(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T ** 3 / 69699);
    const F = norm(93.272095 + 483202.0175233 * T - 0.0036539 * T * T);
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    return { D, M, Mp, F, E };
  }

  const DIST = [[0, 0, 1, 0, -20905355], [2, 0, -1, 0, -3699111], [2, 0, 0, 0, -2955968], [0, 0, 2, 0, -569925], [0, 1, 0, 0, 48888], [0, 0, 0, 2, -3149], [2, 0, -2, 0, 246158], [2, -1, -1, 0, -152138], [2, 0, 1, 0, -170733], [2, -1, 0, 0, -204586], [0, 1, -1, 0, -129620], [1, 0, 0, 0, 108743], [0, 1, 1, 0, 104755], [2, 0, 0, -2, 10321], [0, 0, 1, -2, 79661], [4, 0, -1, 0, -34782], [0, 0, 3, 0, -23210], [4, 0, -2, 0, -21636], [2, 1, -1, 0, 24208], [2, 1, 0, 0, 30824], [1, 0, -1, 0, -8379], [1, 1, 0, 0, -16675], [2, -1, 1, 0, -12831], [2, 0, 2, 0, -10445], [4, 0, 0, 0, -11650], [2, 0, -3, 0, 14403], [0, 1, -2, 0, -7003], [2, -1, -2, 0, 10056], [1, 0, 1, 0, 6322], [2, -2, 0, 0, -9884]];

  function state(ms) {
    const { D, M, Mp, F, E } = fundamentals(ms);
    const i = norm(180 - D - 6.289 * sin(Mp) + 2.1 * sin(M) - 1.274 * sin(2 * D - Mp) - 0.658 * sin(2 * D) - 0.214 * sin(2 * Mp) - 0.11 * sin(D));
    const illum = (1 + cos(i)) / 2;
    let r = 0;
    for (const [d, m, mp, f, c] of DIST) {
      const e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
      r += c * e * cos(d * D + m * M + mp * Mp + f * F);
    }
    const dist = 385000.56 + r / 1000;
    const list = phasesAround(ms);
    let prevNew = null, prev = null, next = {};
    for (const p of list) {
      if (p.t <= ms) { prev = p; if (p.type === 0) prevNew = p.t; }
      else if (next[p.type] == null) next[p.type] = p.t;
    }
    const age = (ms - prevNew) / 864e5;
    return { phaseAngle: i, illum, dist, age, prevNew, prev, next, waxing: next[2] < next[0] };
  }

  window.MoonCalc = { state, truePhase, phasesAround, SYN };
})();
