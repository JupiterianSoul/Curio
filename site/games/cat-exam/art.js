window.CX_ART = (() => {
  const INK = '#3a2418';
  const FUR = '#f4a259';
  const FUR2 = '#d9822b';
  const CREAM = '#ffe2c2';
  const eyes = (m) => {
    if (m === 'happy') return `<path d="M-16 -94q5-7 10 0M6 -94q5-7 10 0" fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>`;
    if (m === 'cross') return `<path d="M-17 -100l11 5M17 -100l-11 5" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/><ellipse cx="-11" cy="-90" rx="3.4" ry="3" fill="${INK}"/><ellipse cx="11" cy="-90" rx="3.4" ry="3" fill="${INK}"/>`;
    if (m === 'shock') return `<circle cx="-11" cy="-94" r="7" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="11" cy="-94" r="7" fill="#fff" stroke="${INK}" stroke-width="2.5"/><circle cx="-11" cy="-94" r="2.4" fill="${INK}"/><circle cx="11" cy="-94" r="2.4" fill="${INK}"/>`;
    if (m === 'sleep') return `<path d="M-16 -92q5 4 10 0M6 -92q5 4 10 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    return `<ellipse cx="-11" cy="-94" rx="4.2" ry="6.4" fill="${INK}"/><ellipse cx="11" cy="-94" rx="4.2" ry="6.4" fill="${INK}"/><circle cx="-10" cy="-97" r="1.5" fill="#fff"/><circle cx="12" cy="-97" r="1.5" fill="#fff"/>`;
  };
  function cat(mood = 'ok', opts = {}) {
    const fur = opts.fur || FUR;
    const tail = opts.noTail ? '' : `<path class="cx-tail" d="M28 -14C70 -18 74 -66 50 -82" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path class="cx-tail" d="M28 -14C70 -18 74 -66 50 -82" fill="none" stroke="${fur}" stroke-width="10" stroke-linecap="round"/>`;
    return `<g class="cx-cat">${tail}
      <ellipse cx="0" cy="-40" rx="38" ry="42" fill="${fur}" stroke="${INK}" stroke-width="3"/>
      <path d="M-30 -52q8 4 6 12M30 -52q-8 4-6 12" stroke="${FUR2}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="0" cy="-30" rx="20" ry="26" fill="${CREAM}"/>
      <ellipse cx="-14" cy="-4" rx="11" ry="7" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>
      <ellipse cx="14" cy="-4" rx="11" ry="7" fill="${CREAM}" stroke="${INK}" stroke-width="3"/>
      <path d="M-27 -104L-24 -134L-4 -118Z" fill="${fur}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M27 -104L24 -134L4 -118Z" fill="${fur}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-22 -112L-21 -126L-11 -117Z M22 -112L21 -126L11 -117Z" fill="#ff9fb4"/>
      <circle cx="0" cy="-92" r="30" fill="${fur}" stroke="${INK}" stroke-width="3"/>
      <path d="M-6 -121l2 9M0 -122v10M6 -121l-2 9" stroke="${FUR2}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="0" cy="-80" rx="12" ry="8" fill="${CREAM}"/>
      ${eyes(mood)}
      <path d="M-3.5 -86h7l-3.5 4z" fill="#ff7aa2" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"/>
      ${mood === 'shock' || mood === 'cross' ? `<ellipse cx="0" cy="-75" rx="4" ry="${mood === 'shock' ? 5 : 2}" fill="${INK}"/>` : `<path d="M-6 -78q3 3 6 0q3 3 6 0" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`}
      <path d="M-14 -82l-20-3M-14 -79l-20 3M14 -82l20-3M14 -79l20 3" stroke="${INK}" stroke-width="1.4" opacity=".55"/>
      <circle cx="-20" cy="-82" r="4" fill="#ff7aa2" opacity=".35"/><circle cx="20" cy="-82" r="4" fill="#ff7aa2" opacity=".35"/>
    </g>`;
  }
  const paw = (cls = '') => `<g class="cx-paw ${cls}"><rect x="-18" y="-120" width="36" height="120" rx="18" fill="${FUR}" stroke="${INK}" stroke-width="3"/><ellipse cx="0" cy="-10" rx="18" ry="14" fill="${CREAM}" stroke="${INK}" stroke-width="3"/><ellipse cx="0" cy="-6" rx="7" ry="5" fill="#ff9fb4"/><circle cx="-9" cy="-17" r="3.4" fill="#ff9fb4"/><circle cx="0" cy="-20" r="3.4" fill="#ff9fb4"/><circle cx="9" cy="-17" r="3.4" fill="#ff9fb4"/></g>`;
  const room = (wall = '#ffe3c7', floor = '#e8b98a', y = 220) => `<rect width="400" height="${y}" fill="${wall}"/><rect y="${y}" width="400" height="${300 - y}" fill="${floor}"/><path d="M0 ${y}h400" stroke="${INK}" stroke-width="3" opacity=".25"/><g opacity=".12" stroke="${INK}" stroke-width="2"><path d="M0 ${y + 26}h400M0 ${y + 56}h400"/></g>`;
  const human = (look = 'front', mood = 'ok') => {
    const skin = '#f2c9a0';
    const face = look === 'back'
      ? `<circle cx="0" cy="-120" r="34" fill="#5a3b2a" stroke="${INK}" stroke-width="3"/><path d="M-30 -110q30 14 60 0" stroke="#3e281b" stroke-width="4" fill="none"/>`
      : `<circle cx="0" cy="-120" r="34" fill="${skin}" stroke="${INK}" stroke-width="3"/><path d="M-34 -124c0-26 16-38 34-38s34 12 34 38c-10-12-20-16-34-16s-24 4-34 16z" fill="#5a3b2a" stroke="${INK}" stroke-width="3"/>${mood === 'sleep' ? `<path d="M-18 -116q6 5 12 0M6 -116q6 5 12 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>` : mood === 'shock' ? `<circle cx="-12" cy="-118" r="6" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="12" cy="-118" r="6" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="-12" cy="-118" r="2" fill="${INK}"/><circle cx="12" cy="-118" r="2" fill="${INK}"/>` : `<circle cx="-12" cy="-118" r="4" fill="${INK}"/><circle cx="12" cy="-118" r="4" fill="${INK}"/>`}<path d="${mood === 'shock' ? 'M-6 -100h12' : 'M-10 -102q10 8 20 0'}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    return `<g class="cx-human"><path d="M-56 0c4-50 24-78 56-78s52 28 56 78z" fill="#5b8bd9" stroke="${INK}" stroke-width="3"/>${face}</g>`;
  };
  const bubble = (x, y, text, w = 170) => `<g class="cx-bubble" transform="translate(${x} ${y})"><rect x="${-w / 2}" y="-24" width="${w}" height="40" rx="18" fill="#fff" stroke="${INK}" stroke-width="2.6"/><path d="M-10 15l-6 16 18-16" fill="#fff" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><rect x="${-w / 2 + 2}" y="10" width="${w - 4}" height="4" fill="#fff"/><text x="0" y="2" text-anchor="middle" class="cx-btext">${text}</text></g>`;
  return { cat, paw, room, human, bubble, INK, FUR, FUR2, CREAM };
})();
