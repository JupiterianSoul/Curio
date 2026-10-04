window.CurioGif = (() => {
  function lzw(indices, minCode) {
    const clear = 1 << minCode, eoi = clear + 1;
    const out = [];
    let cur = 0, shift = 0, size = minCode + 1, next = eoi + 1;
    let table = new Map();
    const emit = (code) => {
      cur |= code << shift; shift += size;
      while (shift >= 8) { out.push(cur & 255); cur >>>= 8; shift -= 8; }
    };
    emit(clear);
    let prefix = indices[0];
    for (let i = 1; i < indices.length; i++) {
      const k = indices[i], key = (prefix << 8) | k, code = table.get(key);
      if (code !== undefined) { prefix = code; continue; }
      emit(prefix);
      if (next === 4096) { emit(clear); next = eoi + 1; size = minCode + 1; table = new Map(); }
      else { if (next >= (1 << size)) size++; table.set(key, next++); }
      prefix = k;
    }
    emit(prefix);
    emit(eoi);
    if (shift > 0) out.push(cur & 255);
    return out;
  }

  function nearestMapper(palette) {
    const cache = new Map();
    return (r, g, b) => {
      const key = (r << 16) | (g << 8) | b;
      let v = cache.get(key);
      if (v !== undefined) return v;
      let best = 0, bd = Infinity;
      for (let i = 0; i < palette.length; i++) {
        const p = palette[i], dr = p[0] - r, dg = p[1] - g, db = p[2] - b, d = dr * dr * 3 + dg * dg * 4 + db * db * 2;
        if (d < bd) { bd = d; best = i; if (d === 0) break; }
      }
      cache.set(key, best);
      return best;
    };
  }

  function encode({ width, height, frames, delays, palette, loop = true }) {
    const bytes = [];
    const w16 = (n) => { bytes.push(n & 255, (n >> 8) & 255); };
    const str = (s) => { for (const ch of s) bytes.push(ch.charCodeAt(0)); };
    const pal = palette.slice(0, 256);
    while (pal.length < 256) pal.push([0, 0, 0]);
    str('GIF89a'); w16(width); w16(height);
    bytes.push(0xf7, 0, 0);
    for (const [r, g, b] of pal) bytes.push(r, g, b);
    if (loop) { bytes.push(0x21, 0xff, 0x0b); str('NETSCAPE2.0'); bytes.push(3, 1); w16(0); bytes.push(0); }
    const map = nearestMapper(palette);
    frames.forEach((data, fi) => {
      const n = width * height, idx = new Uint8Array(n);
      for (let i = 0, o = 0; i < n; i++, o += 4) idx[i] = map(data[o], data[o + 1], data[o + 2]);
      bytes.push(0x21, 0xf9, 4, 0x04); w16(Math.max(2, Math.round(delays[fi] || 10))); bytes.push(0, 0);
      bytes.push(0x2c); w16(0); w16(0); w16(width); w16(height); bytes.push(0);
      bytes.push(8);
      const lz = lzw(idx, 8);
      for (let i = 0; i < lz.length; i += 255) {
        const chunk = lz.slice(i, i + 255);
        bytes.push(chunk.length); for (const c of chunk) bytes.push(c);
      }
      bytes.push(0);
    });
    bytes.push(0x3b);
    return new Uint8Array(bytes);
  }

  return { encode, lzw };
})();
