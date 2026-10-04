const maps = {
  arrow: [
    'B..........', 'BB.........', 'BWB........', 'BWWB.......', 'BWWWB......', 'BWWWWB.....', 'BWWWWWB....', 'BWWWWWWB...', 'BWWWWWWWB..', 'BWWWWWWWWB.',
    'BWWWWWBBBBB', 'BWWBWWB....', 'BWB.BWWB...', 'BB..BWWB...', 'B....BWWB..', '.....BWWB..', '......BWWB.', '......BWWB.', '.......BB..'],
  hand: [
    '.....BB.........', '....BWWB........', '....BWWB........', '....BWWB........', '....BWWBBB......', '....BWWBWWBBB...', '....BWWBWWBWWBB.', '.BB.BWWBWWBWWBWB',
    'BWWBBWWWWWWWWBWB', 'BWWWBWWWWWWWWWWB', '.BWWBWWWWWWWWWWB', '..BWWWWWWWWWWWWB', '..BWWWWWWWWWWWB.', '...BWWWWWWWWWWB.', '....BWWWWWWWWB..', '....BWWWWWWWWB..', '....BBBBBBBBBB..'],
  wait: [
    'BBBBBBBBBBBBB', 'BWWWWWWWWWWWB', 'BBBBBBBBBBBBB', '.BWWWWWWWWWB.', '.BWYYYYYYYWB.', '.BWWYYYYYWWB.', '..BWWYYYWWB..', '...BWWYWWB...', '....BWYWB....', '....BWYWB....',
    '...BWWYWWB...', '..BWWWYWWWB..', '.BWWWWYWWWWB.', '.BWWWYYYWWWB.', '.BWYYYYYYYWB.', 'BBBBBBBBBBBBB', 'BWWWWWWWWWWWB', 'BBBBBBBBBBBBB'],
  min: ['......', '......', '......', '......', '......', '......', 'BBBBBB', 'BBBBBB'],
  max: ['BBBBBBBBB', 'BBBBBBBBB', 'B.......B', 'B.......B', 'B.......B', 'B.......B', 'B.......B', 'B.......B', 'BBBBBBBBB'],
  restore: ['..BBBBBB', '..BBBBBB', '..B....B', 'BBBBBB.B', 'BBBBBB.B', 'B....BBB', 'B....B..', 'B....B..', 'BBBBBB..'],
  close: ['BB....BB', '.BB..BB.', '..BBBB..', '...BB...', '..BBBB..', '.BB..BB.', 'BB....BB'],
  help: ['..BBBB..', '.BB..BB.', '.....BB.', '....BB..', '...BB...', '...BB...', '........', '...BB...', '...BB...'],
  up: ['...B...', '..BBB..', '.BBBBB.', 'BBBBBBB'],
  down: ['BBBBBBB', '.BBBBB.', '..BBB..', '...B...'],
  left: ['...B', '..BB', '.BBB', 'BBBB', '.BBB', '..BB', '...B'],
  right: ['B...', 'BB..', 'BBB.', 'BBBB', 'BBB.', 'BB..', 'B...'],
  check: ['......B', '.....BB', 'B...BBB', 'BB.BBB.', 'BBBBB..', '.BBB...', '..B....'],
  sub: ['B...', 'BB..', 'BBB.', 'BBBB', 'BBB.', 'BB..', 'B...'],
  dot: ['.BB.', 'BBBB', 'BBBB', '.BB.']
};
const colors = (ink) => ({ B: ink, W: '#fff', Y: '#c09030' });
function svg(rows, ink) {
  const h = rows.length, w = rows[0].length, col = colors(ink);
  const d = {};
  rows.forEach((r, y) => { let x = 0; while (x < w) { const c = r[x]; if (c === '.') { x++; continue; } let x1 = x; while (x1 < w && r[x1] === c) x1++; d[c] = (d[c] || '') + `M${x} ${y}h${x1 - x}v1h-${x1 - x}z`; x = x1; } });
  const rects = Object.entries(d).map(([c, v]) => `<path fill='${col[c]}' d='${v}'/>`).join('');
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' shape-rendering='crispEdges'>${rects}</svg>`;
  return `url("data:image/svg+xml,${s.replace(/</g, '%3C').replace(/>/g, '%3E').replace(/#/g, '%23')}")`;
}
const out = [];
out.push(`--z-cur-arrow: ${svg(maps.arrow, '#000')} 0 0, default;`);
  out.push(`--z-cur-arrow-img: ${svg(maps.arrow, '#000')};`);
out.push(`--z-cur-hand: ${svg(maps.hand, '#000')} 5 0, pointer;`);
out.push(`--z-cur-wait: ${svg(maps.wait, '#000')} 6 9, wait;`);
for (const k of ['min', 'max', 'restore', 'close', 'help', 'up', 'down', 'left', 'right', 'check', 'sub', 'dot']) {
  out.push(`--zg-${k}: ${svg(maps[k], '#000')};`);
  out.push(`--zg-${k}-w: ${svg(maps[k], '#fff')};`);
  if (['max', 'up', 'down', 'left', 'right', 'check', 'sub'].includes(k)) out.push(`--zg-${k}-g: ${svg(maps[k], '#808080')};`);
}
console.log(out.join('\n'));
