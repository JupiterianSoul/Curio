(function () {
  let uid = 0;
  const bands = (cols, h) => cols.map((c, i) => `<rect x="0" y="${i * h}" width="400" height="${h + .5}" fill="${c}"/>`).join('');
  const craters = (n, col, seed) => {
    let s = seed, out = '';
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < n; i++) {
      const x = r() * 200, y = 10 + r() * 80, rad = 2 + r() * 7;
      out += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${col}" opacity=".55"/><circle cx="${x + 200}" cy="${y}" r="${rad}" fill="${col}" opacity=".55"/><circle cx="${x - rad * .25}" cy="${y - rad * .25}" r="${rad * .6}" fill="#fff" opacity=".12"/><circle cx="${x + 200 - rad * .25}" cy="${y - rad * .25}" r="${rad * .6}" fill="#fff" opacity=".12"/>`;
    }
    return out;
  };
  const blob = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 0c8-6 20-4 24 4s-2 16 4 22-6 14-16 10-18-6-20-16 2-14 8-20z" fill="${c}"/>`;
  const SURF = {
    Mercury: { base: '#9d978f', feat: craters(26, '#6f6a63', 7), speed: 60 },
    Venus: { base: '#e8c27a', feat: `${bands(['#f1d395', '#e2b66a', '#f4dca4', '#d9a95c', '#ecc884', '#e0b46a', '#f3d79c', '#dcae63', '#eac27c', '#f1d395'], 10)}<path d="M0 30q50-14 100 0t100 0 100 0 100 0M0 62q50 12 100 0t100 0 100 0 100 0" stroke="#fff3cf" stroke-width="5" fill="none" opacity=".5"/>`, speed: 40 },
    Earth: { base: '#2a6fd6', feat: `${blob(20, 20, 1.3, '#3f9b4f')}${blob(70, 50, 1.6, '#4caa55')}${blob(130, 18, 1.1, '#c9a861')}${blob(150, 55, 1.2, '#3f9b4f')}${blob(220, 20, 1.3, '#3f9b4f')}${blob(270, 50, 1.6, '#4caa55')}${blob(330, 18, 1.1, '#c9a861')}${blob(350, 55, 1.2, '#3f9b4f')}<rect x="0" y="0" width="400" height="7" fill="#f4f8ff"/><rect x="0" y="94" width="400" height="6" fill="#f4f8ff"/><path d="M0 40q30-10 60 0t60 0 80 0 60 0 60 0 80 0M20 72q30-8 60 0t70 0 50 0 60 0 70 0 50 0" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".75"/>`, speed: 24 },
    Moon: { base: '#c9c9c6', feat: `${craters(22, '#8e8e8a', 3)}<ellipse cx="60" cy="40" rx="26" ry="16" fill="#9a9a96" opacity=".6"/><ellipse cx="260" cy="40" rx="26" ry="16" fill="#9a9a96" opacity=".6"/>`, speed: 80 },
    Mars: { base: '#c9583a', feat: `${blob(30, 30, 1.6, '#9c3f27')}${blob(120, 55, 1.2, '#a8482d')}${blob(230, 30, 1.6, '#9c3f27')}${blob(320, 55, 1.2, '#a8482d')}<rect x="0" y="0" width="400" height="8" fill="#fbeee6"/><rect x="0" y="95" width="400" height="5" fill="#fbeee6"/><path d="M40 52h70M240 52h70" stroke="#7e3220" stroke-width="3" opacity=".6"/>`, speed: 26 },
    Ceres: { base: '#8f8a83', feat: `${craters(18, '#6a655f', 11)}<circle cx="80" cy="45" r="3" fill="#fff"/><circle cx="280" cy="45" r="3" fill="#fff"/>`, speed: 30 },
    Vesta: { base: '#a39885', feat: craters(16, '#776d5e', 5), speed: 30 },
    Jupiter: { base: '#e6c9a0', feat: `${bands(['#f0dcc0', '#d9b48a', '#c98d5a', '#f2e2c8', '#b9794a', '#ead2b0', '#c98d5a', '#f0dcc0', '#d6ae80', '#e6c9a0'], 10)}<path d="M0 34q25 4 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0M0 66q25-4 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0" stroke="#fff" stroke-width="2" fill="none" opacity=".35"/><ellipse cx="70" cy="62" rx="14" ry="8" fill="#c0482c"/><ellipse cx="70" cy="62" rx="9" ry="4.5" fill="#d9663f"/><ellipse cx="270" cy="62" rx="14" ry="8" fill="#c0482c"/><ellipse cx="270" cy="62" rx="9" ry="4.5" fill="#d9663f"/>`, speed: 14 },
    Saturn: { base: '#e8cf94', feat: `${bands(['#f2dca6', '#e2c385', '#f5e4b8', '#d9b87a', '#efd59c', '#e6c98d', '#f2dca6', '#d9b87a', '#ecd29a', '#f2dca6'], 10)}`, speed: 16 },
    Uranus: { base: '#9fe3ea', feat: `${bands(['#c4f3f7', '#b3edf2', '#a7e7ee', '#9fe3ea', '#9fe3ea', '#9fe3ea', '#a2e2e9', '#a9e6ec', '#b6ecf1', '#c4f3f7'], 10)}`, speed: 20 },
    Neptune: { base: '#3d63e0', feat: `${bands(['#5b82f0', '#4a72e8', '#3d63e0', '#3558d4', '#3d63e0', '#4468e2', '#3a5fd8', '#3d63e0', '#4a72e8', '#5b82f0'], 10)}<ellipse cx="80" cy="40" rx="12" ry="6" fill="#1f3c9e"/><ellipse cx="280" cy="40" rx="12" ry="6" fill="#1f3c9e"/><path d="M90 50h30M290 50h30M30 70h24M230 70h24" stroke="#e8f0ff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`, speed: 18 },
    Pluto: { base: '#cdb49a', feat: `<path d="M60 40c6-10 22-10 22 2 0-12 16-12 22-2 6 12-10 26-22 34-12-8-28-22-22-34z" fill="#f5ead9"/><path d="M260 40c6-10 22-10 22 2 0-12 16-12 22-2 6 12-10 26-22 34-12-8-28-22-22-34z" fill="#f5ead9"/><ellipse cx="150" cy="62" rx="30" ry="10" fill="#7a4d36" opacity=".7"/><ellipse cx="350" cy="62" rx="30" ry="10" fill="#7a4d36" opacity=".7"/>`, speed: 40 },
    Charon: { base: '#a9a29a', feat: `<rect x="0" y="0" width="400" height="16" fill="#6b4a3e" opacity=".7"/>${craters(10, '#7e776f', 2)}`, speed: 40 }
  };
  function planet(name, size = 160) {
    const id = `p${uid++}`;
    if (name === 'Sun') {
      return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="The Sun"><defs><radialGradient id="${id}g" cx=".45" cy=".42"><stop offset="0" stop-color="#fff6c9"/><stop offset=".4" stop-color="#ffd23f"/><stop offset=".8" stop-color="#ff9d1c"/><stop offset="1" stop-color="#f2621f"/></radialGradient><radialGradient id="${id}c"><stop offset=".6" stop-color="#ffb43c" stop-opacity=".6"/><stop offset="1" stop-color="#ff8a1c" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="50" r="50" fill="url(#${id}c)" class="pa-pulse"/><circle cx="50" cy="50" r="36" fill="url(#${id}g)"/><g opacity=".25" fill="#fff"><circle cx="38" cy="40" r="3"/><circle cx="58" cy="56" r="2"/><circle cx="46" cy="62" r="2.5"/><circle cx="62" cy="38" r="1.6"/></g><g fill="#a3420f" opacity=".6"><circle cx="58" cy="44" r="1.6"/><circle cx="60.5" cy="45" r="1"/></g></svg>`;
    }
    const s = SURF[name] || SURF.Moon;
    const rings = name === 'Saturn' ? 1 : name === 'Uranus' ? 2 : 0;
    const vb = rings ? '-30 -30 160 160' : '0 0 100 100';
    const tilt = name === 'Uranus' ? 'rotate(82 50 50)' : name === 'Saturn' ? 'rotate(-18 50 50)' : 'rotate(-12 50 50)';
    const ringBack = rings === 1 ? `<g transform="${tilt}"><path d="M-22 50a72 18 0 0 1 144 0" fill="none" stroke="#d9c08a" stroke-width="9" opacity=".85"/><path d="M-22 50a72 18 0 0 1 144 0" fill="none" stroke="#f2e0b4" stroke-width="3" opacity=".9"/></g>` : rings === 2 ? `<g transform="${tilt}"><path d="M-6 50a56 12 0 0 1 112 0" fill="none" stroke="#d6f6f9" stroke-width="1.4" opacity=".7"/></g>` : '';
    const ringFront = rings === 1 ? `<g transform="${tilt}"><path d="M122 50a72 18 0 0 1-144 0" fill="none" stroke="#c9ab6e" stroke-width="9" opacity=".95"/><path d="M122 50a72 18 0 0 1-144 0" fill="none" stroke="#f5e6bf" stroke-width="3"/><path d="M122 50a72 18 0 0 1-144 0" fill="none" stroke="#5b4a2c" stroke-width=".8" transform="translate(0 0) scale(1)" opacity=".5"/></g>` : rings === 2 ? `<g transform="${tilt}"><path d="M106 50a56 12 0 0 1-112 0" fill="none" stroke="#d6f6f9" stroke-width="1.4" opacity=".8"/></g>` : '';
    return `<svg viewBox="${vb}" width="${size}" height="${size}" role="img" aria-label="${name}"><defs><clipPath id="${id}k"><circle cx="50" cy="50" r="46"/></clipPath><radialGradient id="${id}s" cx=".32" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient><radialGradient id="${id}a"><stop offset=".86" stop-color="${s.base}" stop-opacity=".0"/><stop offset=".92" stop-color="${s.base}" stop-opacity=".5"/><stop offset="1" stop-color="${s.base}" stop-opacity="0"/></radialGradient></defs>${ringBack}<circle cx="50" cy="50" r="54" fill="url(#${id}a)"/><g clip-path="url(#${id}k)" transform="${tilt}"><rect x="0" y="0" width="100" height="100" fill="${s.base}"/><g class="pa-spin" style="animation-duration:${s.speed}s"><g transform="translate(0 0)">${s.feat}</g></g></g><circle cx="50" cy="50" r="46" fill="url(#${id}s)"/>${ringFront}</svg>`;
  }
  window.PlanetArt = { planet };
})();
