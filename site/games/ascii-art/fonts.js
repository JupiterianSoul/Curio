window.TEXTART_FONTS = (() => {
  const BIG = {
    A: '.XXX. X...X X...X XXXXX X...X X...X X...X',
    B: 'XXXX. X...X X...X XXXX. X...X X...X XXXX.',
    C: '.XXX. X...X X.... X.... X.... X...X .XXX.',
    D: 'XXXX. X...X X...X X...X X...X X...X XXXX.',
    E: 'XXXXX X.... X.... XXXX. X.... X.... XXXXX',
    F: 'XXXXX X.... X.... XXXX. X.... X.... X....',
    G: '.XXX. X...X X.... X.XXX X...X X...X .XXXX',
    H: 'X...X X...X X...X XXXXX X...X X...X X...X',
    I: 'XXX .X. .X. .X. .X. .X. XXX',
    J: '..XXX ...X. ...X. ...X. X..X. X..X. .XX..',
    K: 'X...X X..X. X.X.. XX... X.X.. X..X. X...X',
    L: 'X.... X.... X.... X.... X.... X.... XXXXX',
    M: 'X...X XX.XX X.X.X X.X.X X...X X...X X...X',
    N: 'X...X XX..X X.X.X X..XX X...X X...X X...X',
    O: '.XXX. X...X X...X X...X X...X X...X .XXX.',
    P: 'XXXX. X...X X...X XXXX. X.... X.... X....',
    Q: '.XXX. X...X X...X X...X X.X.X X..X. .XX.X',
    R: 'XXXX. X...X X...X XXXX. X.X.. X..X. X...X',
    S: '.XXXX X.... X.... .XXX. ....X ....X XXXX.',
    T: 'XXXXX ..X.. ..X.. ..X.. ..X.. ..X.. ..X..',
    U: 'X...X X...X X...X X...X X...X X...X .XXX.',
    V: 'X...X X...X X...X X...X X...X .X.X. ..X..',
    W: 'X...X X...X X...X X.X.X X.X.X X.X.X .X.X.',
    X: 'X...X X...X .X.X. ..X.. .X.X. X...X X...X',
    Y: 'X...X X...X .X.X. ..X.. ..X.. ..X.. ..X..',
    Z: 'XXXXX ....X ...X. ..X.. .X... X.... XXXXX',
    0: '.XXX. X...X X..XX X.X.X XX..X X...X .XXX.',
    1: '.X. XX. .X. .X. .X. .X. XXX',
    2: '.XXX. X...X ....X ...X. ..X.. .X... XXXXX',
    3: 'XXXX. ....X ....X .XXX. ....X ....X XXXX.',
    4: '...X. ..XX. .X.X. X..X. XXXXX ...X. ...X.',
    5: 'XXXXX X.... XXXX. ....X ....X X...X .XXX.',
    6: '..XX. .X... X.... XXXX. X...X X...X .XXX.',
    7: 'XXXXX ....X ...X. ..X.. .X... .X... .X...',
    8: '.XXX. X...X X...X .XXX. X...X X...X .XXX.',
    9: '.XXX. X...X X...X .XXXX ....X ...X. .XX..',
    ' ': '... ... ... ... ... ... ...',
    '.': '. . . . . . X',
    ',': '.. .. .. .. .. .X X.',
    '!': 'X X X X X . X',
    '?': '.XXX. X...X ....X ...X. ..X.. ..... ..X..',
    "'": 'X X . . . . .',
    '"': 'X.X X.X ... ... ... ... ...',
    '-': '... ... ... XXX ... ... ...',
    '+': '..... ..X.. ..X.. XXXXX ..X.. ..X.. .....',
    '=': '.... .... XXXX .... XXXX .... ....',
    '/': '....X ...X. ...X. ..X.. .X... .X... X....',
    '(': '.X X. X. X. X. X. .X',
    ')': 'X. .X .X .X .X .X X.',
    ':': '. X . . . X .',
    ';': '.. .X .. .. .X .X X.',
    '_': '..... ..... ..... ..... ..... ..... XXXXX',
    '#': '.X.X. .X.X. XXXXX .X.X. XXXXX .X.X. .X.X.',
    '@': '.XXX. X...X X.XXX X.X.X X.XXX X.... .XXXX',
    '&': '.XX.. X..X. X.X.. .X... X.X.X X..X. .XX.X',
    '*': '..... X.X.X .XXX. XXXXX .XXX. X.X.X .....',
    '$': '..X.. .XXXX X.X.. .XXX. ..X.X XXXX. ..X..',
    '%': 'XX..X XX..X ...X. ..X.. .X... X..XX X..XX',
    '<': '...X ..X. .X.. X... .X.. ..X. ...X',
    '>': 'X... .X.. ..X. ...X ..X. .X.. X...',
    '♥': '.X.X. XXXXX XXXXX XXXXX .XXX. ..X.. .....'
  };
  const TINY = {
    A: '.X. X.X XXX X.X X.X', B: 'XX. X.X XX. X.X XX.', C: '.XX X.. X.. X.. .XX', D: 'XX. X.X X.X X.X XX.',
    E: 'XXX X.. XX. X.. XXX', F: 'XXX X.. XX. X.. X..', G: '.XX X.. X.X X.X .XX', H: 'X.X X.X XXX X.X X.X',
    I: 'XXX .X. .X. .X. XXX', J: '..X ..X ..X X.X .X.', K: 'X.X X.X XX. X.X X.X', L: 'X.. X.. X.. X.. XXX',
    M: 'X...X XX.XX X.X.X X...X X...X', N: 'X..X XX.X X.XX X..X X..X', O: '.X. X.X X.X X.X .X.',
    P: 'XX. X.X XX. X.. X..', Q: '.X. X.X X.X XX. .XX', R: 'XX. X.X XX. X.X X.X', S: '.XX X.. .X. ..X XX.',
    T: 'XXX .X. .X. .X. .X.', U: 'X.X X.X X.X X.X XXX', V: 'X.X X.X X.X X.X .X.', W: 'X...X X...X X.X.X XX.XX X...X',
    X: 'X.X X.X .X. X.X X.X', Y: 'X.X X.X .X. .X. .X.', Z: 'XXX ..X .X. X.. XXX',
    0: 'XXX X.X X.X X.X XXX', 1: '.X. XX. .X. .X. XXX', 2: 'XX. ..X .X. X.. XXX', 3: 'XX. ..X .X. ..X XX.',
    4: 'X.X X.X XXX ..X ..X', 5: 'XXX X.. XX. ..X XX.', 6: '.XX X.. XXX X.X XXX', 7: 'XXX ..X .X. .X. .X.',
    8: 'XXX X.X XXX X.X XXX', 9: 'XXX X.X XXX ..X XX.',
    ' ': '.. .. .. .. ..', '.': '. . . . X', ',': '. . . X X', '!': 'X X X . X', '?': 'XX. ..X .X. ... .X.',
    "'": 'X X . . .', '"': 'X.X X.X ... ... ...', '-': '... ... XXX ... ...', '+': '... .X. XXX .X. ...',
    '=': '... XXX ... XXX ...', '/': '..X ..X .X. X.. X..', '(': '.X X. X. X. .X', ')': 'X. .X .X .X X.',
    ':': '. X . X .', ';': '. X . X X', '_': '... ... ... ... XXX', '#': 'X.X XXX X.X XXX X.X',
    '@': '.X. X.X XXX X.. .XX', '&': '.X. X.X .X. X.X .XX', '*': 'X.X .X. X.X ... ...', '$': '.XX XX. .X. .XX XX.',
    '%': 'X.X ..X .X. X.. X.X', '<': '..X .X. X.. .X. ..X', '>': 'X.. .X. ..X .X. X..', '♥': 'X.X XXX XXX .X. ...'
  };
  const parse = (map) => {
    const out = {};
    for (const [k, v] of Object.entries(map)) out[k] = v.split(' ').map((r) => [...r].map((c) => c === 'X'));
    return out;
  };
  const big = parse(BIG), tiny = parse(TINY);

  function grid(text, map, h) {
    const rows = Array.from({ length: h }, () => []);
    const letters = [];
    [...text.toUpperCase()].forEach((ch, i) => {
      const gl = map[ch] || map['?'];
      if (i > 0) rows.forEach((r) => r.push(false));
      const start = rows[0].length;
      gl.forEach((r, y) => rows[y].push(...r));
      letters.push({ ch: map[ch] ? ch : '?', start, w: gl[0].length });
    });
    return { rows, letters, h, w: rows[0].length };
  }
  const at = (G, r, c) => r >= 0 && c >= 0 && r < G.h && c < G.w && G.rows[r][c];
  const letterAt = (G, c) => { for (const l of G.letters) if (c >= l.start && c < l.start + l.w) return l.ch; return '#'; };

  const BOX = {
    '1010': '│', '0101': '─', '0110': '╭', '0011': '╮', '1100': '╰', '1001': '╯',
    '1110': '├', '1011': '┤', '0111': '┬', '1101': '┴', '1111': '┼',
    '1000': '│', '0010': '│', '0100': '─', '0001': '─', '0000': ' '
  };

  const STYLES = {
    block: { name: 'Block', src: 'big', render: (G) => G.rows.map((r) => r.map((v) => v ? '██' : '  ').join('')) },
    shadow: { name: 'Shadow', src: 'big', render: (G) => {
      const out = [];
      for (let r = 0; r <= G.h; r++) {
        let s = '';
        for (let c = 0; c <= G.w * 2; c++) {
          const on = at(G, r, Math.floor(c / 2)) && c < G.w * 2;
          const sh = at(G, r - 1, Math.floor((c - 1) / 2)) && c >= 1;
          s += on ? '█' : sh ? '░' : ' ';
        }
        out.push(s);
      }
      return out;
    } },
    outline: { name: 'Outline', src: 'big', render: (G) => {
      const right = (i, j) => j < G.w && at(G, i - 1, j) !== at(G, i, j);
      const down = (i, j) => i < G.h && at(G, i, j - 1) !== at(G, i, j);
      const out = [];
      for (let i = 0; i <= G.h; i++) {
        let line = '', mid = '';
        for (let j = 0; j <= G.w; j++) {
          const u = i > 0 && down(i - 1, j), d = down(i, j), l = j > 0 && right(i, j - 1), rr = right(i, j);
          line += BOX[`${+u}${+rr}${+d}${+l}`];
          if (j < G.w) line += rr ? '──' : '  ';
          if (i < G.h) { mid += d ? '│' : ' '; if (j < G.w) mid += '  '; }
        }
        out.push(line); if (i < G.h) out.push(mid);
      }
      return out;
    } },
    fade: { name: 'Fade', src: 'big', render: (G) => {
      const ramp = ['█', '█', '▓', '▓', '▒', '▒', '░'];
      return G.rows.map((r, y) => r.map((v) => v ? ramp[y] + ramp[y] : '  ').join(''));
    } },
    banner: { name: 'Banner', src: 'big', render: (G) => G.rows.map((r) => r.map((v, c) => { const ch = letterAt(G, c); return v ? ch + ch : '  '; }).join('')) },
    italic: { name: 'Italic', src: 'big', render: (G) => G.rows.map((r, y) => ' '.repeat(G.h - 1 - y) + r.map((v) => v ? '██' : '  ').join('')) },
    stars: { name: 'Stars', src: 'big', render: (G) => G.rows.map((r) => r.map((v) => v ? '* ' : '  ').join('')) },
    threeD: { name: '3D', src: 'big', render: (G) => {
      const out = [];
      for (let r = 0; r <= G.h; r++) {
        let line = '';
        for (let c = 0; c <= G.w; c++) line += at(G, r, c) ? '██' : at(G, r - 1, c - 1) ? '▓▓' : '  ';
        out.push(line);
      }
      return out;
    } },
    hash: { name: 'Hash', src: 'big', render: (G) => G.rows.map((r) => r.map((v) => v ? '##' : '  ').join('')) },
    dots: { name: 'Dots', src: 'big', render: (G) => G.rows.map((r) => r.map((v) => v ? '● ' : '· ').join('')) },
    brick: { name: 'Bricks', src: 'big', render: (G) => G.rows.map((r) => r.map((v) => v ? '[]' : '  ').join('')) },
    lace: { name: 'Lace', src: 'big', render: (G) => G.rows.map((r, y) => r.map((v, c) => v ? ((y + c) % 2 ? '╳ ' : '○ ') : '  ').join('')) },
    pixel: { name: 'Pixel', src: 'tiny', render: (G) => G.rows.map((r) => r.map((v) => v ? '██' : '  ').join('')) },
    tiny: { name: 'Tiny', src: 'tiny', render: (G) => {
      const out = [];
      for (let y = 0; y < G.h; y += 2) out.push(G.rows[y].map((v, c) => { const b = y + 1 < G.h && G.rows[y + 1][c]; return v && b ? '█' : v ? '▀' : b ? '▄' : ' '; }).join(''));
      return out;
    } }
  };

  function render(text, styleKey) {
    const style = STYLES[styleKey] || STYLES.block;
    const map = style.src === 'tiny' ? tiny : big, h = style.src === 'tiny' ? 5 : 7;
    const blocks = text.split('\n').map((line) => {
      if (!line.trim()) return [''];
      return style.render(grid(line, map, h)).map((s) => s.replace(/\s+$/, ''));
    });
    return blocks.map((b) => b.join('\n')).join('\n\n');
  }
  const supported = new Set(Object.keys(BIG));
  return { STYLES, render, supported };
})();
