(() => {
  const SKIN = ['#f1c7a2', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#d4a07a'];
  const HAIR = ['#2b1d12', '#6b4423', '#d9a441', '#1a1a1a', '#a0522d', '#7b7b7b', '#c0392b'];
  const SHIRT = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

  function person(shirt, acc = '', seed = 0, you = false) {
    const skin = SKIN[seed % SKIN.length], hair = acc === 'gran' ? '#dcdcdc' : HAIR[(seed * 3) % HAIR.length];
    const sh = shirt || SHIRT[seed % SHIRT.length];
    const tall = acc === 'tall';
    const mime = acc === 'mime';
    const pants = acc === 'lab' ? '#2c3e50' : acc === 'mime' ? '#111' : '#334155';
    const shoes = acc === 'crocs' ? `<ellipse cx="-4.5" cy="-1.5" rx="5" ry="2.6" fill="#2ecc71"/><ellipse cx="4.5" cy="-1.5" rx="5" ry="2.6" fill="#2ecc71"/><circle cx="-5" cy="-2" r=".7" fill="#1e8449"/><circle cx="4" cy="-2" r=".7" fill="#1e8449"/>` : `<ellipse cx="-4.5" cy="-1.5" rx="4.4" ry="2.2" fill="#1f2937"/><ellipse cx="4.5" cy="-1.5" rx="4.4" ry="2.2" fill="#1f2937"/>`;
    let shirtFill = sh;
    if (mime) shirtFill = 'url(#trMime)';
    const coat = acc === 'lab' ? '<path d="M-10 -34 h20 l2 24 h-24Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1"/><path d="M0 -34 v20" stroke="#cbd5e1"/>' : '';
    const tie = acc === 'tie' || acc === 'rich' ? '<path d="M0 -33 l-2 3 l2 10 l2 -10Z" fill="#b91c1c"/>' : '';
    const heart = acc === 'heart' ? '<path d="M0 -21 l-4 -4 a2.3 2.3 0 0 1 4 -2.5 a2.3 2.3 0 0 1 4 2.5Z" fill="#fff"/>' : '';
    const face = mime ? '#fafafa' : skin;
    const eyes = acc === 'stare' ? '<circle cx="-3.2" cy="-43" r="2.6" fill="#fff" stroke="#111" stroke-width=".6"/><circle cx="3.2" cy="-43" r="2.6" fill="#fff" stroke="#111" stroke-width=".6"/><circle cx="-3.2" cy="-43" r="1.2" fill="#111"/><circle cx="3.2" cy="-43" r="1.2" fill="#111"/>' : '<circle cx="-3" cy="-43" r="1.2" fill="#111"/><circle cx="3" cy="-43" r="1.2" fill="#111"/>';
    const mouth = acc === 'frown' ? '<path d="M-3 -37.5 q3 -2.5 6 0" stroke="#111" stroke-width="1.2" fill="none"/>' : you ? '<path d="M-3.5 -39 q3.5 3.5 7 0" stroke="#111" stroke-width="1.2" fill="none"/>' : '<path d="M-2.5 -38.5 q2.5 2 5 0" stroke="#111" stroke-width="1.1" fill="none"/>';
    const brows = acc === 'frown' ? '<path d="M-5.5 -47.5 l4 1.5 M5.5 -47.5 l-4 1.5" stroke="#111" stroke-width="1.2"/>' : '';
    let hairSvg = seed % 3 === 0 ? `<path d="M-9 -44 q0 -10 9 -10 q9 0 9 10 q-3 -5 -9 -5 q-6 0 -9 5Z" fill="${hair}"/>` : seed % 3 === 1 ? `<path d="M-9.5 -42 q-1 -12 9.5 -12 q10.5 0 9.5 12 l-2 6 v-8 q-7 -4 -15 0 v8Z" fill="${hair}"/>` : `<path d="M-9 -45 q2 -9 9 -9 q7 0 9 9 q-4 -3 -9 -3 q-5 0 -9 3Z" fill="${hair}"/><circle cx="-7" cy="-50" r="3" fill="${hair}"/>`;
    if (acc === 'gran') hairSvg = `<path d="M-9 -44 q0 -10 9 -10 q9 0 9 10 q-4 -4 -9 -4 q-5 0 -9 4Z" fill="${hair}"/><circle cx="0" cy="-55" r="4.5" fill="${hair}"/>`;
    if (mime) hairSvg = '<path d="M-9 -49 q9 -8 18 0 q-9 -3 -18 0Z" fill="#111"/><circle cx="6" cy="-53" r="1.6" fill="#111"/>';
    let hat = '';
    if (acc === 'tophat' || acc === 'rich') hat = '<rect x="-7" y="-64" width="14" height="12" rx="1" fill="#111"/><rect x="-10" y="-53" width="20" height="2.5" rx="1" fill="#111"/><rect x="-7" y="-56" width="14" height="2" fill="#b91c1c"/>';
    if (acc === 'cap') hat = `<path d="M-9 -47 q0 -9 9 -9 q9 0 9 9Z" fill="${sh}"/><path d="M5 -48 h9 q0 2 -2 2.5 h-7Z" fill="${sh}"/>`;
    const glasses = acc === 'glasses' || acc === 'gran' || acc === 'lab' ? '<circle cx="-3" cy="-43" r="2.8" fill="none" stroke="#111" stroke-width=".9"/><circle cx="3" cy="-43" r="2.8" fill="none" stroke="#111" stroke-width=".9"/><path d="M-.2 -43 h.4" stroke="#111"/>' : '';
    const monocle = acc === 'monocle' || acc === 'rich' ? '<circle cx="3" cy="-43" r="3" fill="none" stroke="#d4af37" stroke-width="1"/><path d="M6 -42 q2 6 0 10" stroke="#d4af37" stroke-width=".6" fill="none"/>' : '';
    const mimeFace = mime ? '<path d="M-3 -46 v-2 M3 -46 v-2" stroke="#111" stroke-width=".8"/><path d="M-2 -38 h4" stroke="#c0392b" stroke-width="1.5"/>' : '';
    const armL = acc === 'phone' ? '<path d="M-8 -31 q-4 -6 -2 -14" stroke="' + sh + '" stroke-width="4" stroke-linecap="round" fill="none"/><rect x="-14" y="-52" width="6" height="10" rx="1.5" fill="#111"/><rect x="-13" y="-51" width="4" height="7" fill="#7dd3fc"/>' : '<path d="M-8 -31 l-4 12" stroke="' + sh + '" stroke-width="4" stroke-linecap="round"/><circle cx="-12.5" cy="-18" r="2.2" fill="' + face + '"/>';
    const armR = acc === 'rich' ? '<path d="M8 -31 l4 12" stroke="' + sh + '" stroke-width="4" stroke-linecap="round"/><path d="M8 -20 q5 -4 10 0 l2 9 h-14Z" fill="#a16207"/><text x="15" y="-12" font-size="6" text-anchor="middle" fill="#fde68a" font-weight="900">$</text>' : '<path d="M8 -31 l4 12" stroke="' + sh + '" stroke-width="4" stroke-linecap="round"/><circle cx="12.5" cy="-18" r="2.2" fill="' + face + '"/>';
    const youTag = you ? '<g transform="translate(0 -72)"><rect x="-14" y="-9" width="28" height="13" rx="6.5" fill="#ff5a36"/><text y="1" font-size="8.5" font-weight="900" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif">YOU</text></g>' : '';
    const body = `<g ${tall ? 'transform="scale(1 1.25)"' : ''}>${shoes}<rect x="-6" y="-17" width="5" height="16" rx="2" fill="${pants}"/><rect x="1" y="-17" width="5" height="16" rx="2" fill="${pants}"/><rect x="-9" y="-35" width="18" height="21" rx="6" fill="${shirtFill}"/>${coat}${tie}${heart}${armL}${armR}<circle cx="0" cy="-43" r="9.5" fill="${face}"/>${hairSvg}${eyes}${brows}${mouth}${glasses}${monocle}${mimeFace}${hat}</g>${youTag}`;
    return body;
  }

  const S = {
    lobster: () => '<ellipse cx="0" cy="-8" rx="12" ry="7" fill="#dc2626"/><path d="M-12 -8 l-6 -3 l2 6Z M12 -8 q8 -10 12 -4 q-2 4 -8 4Z" fill="#b91c1c"/><path d="M-6 -14 q-8 -12 -14 -10 q2 6 10 6 M6 -14 q8 -12 14 -10 q-2 6 -10 6" fill="#ef4444"/><circle cx="-3" cy="-13" r="1.5" fill="#111"/><circle cx="3" cy="-13" r="1.5" fill="#111"/><path d="M-8 -2 l-3 3 M-3 -1 l-1 3 M3 -1 l1 3 M8 -2 l3 3" stroke="#991b1b" stroke-width="1.5"/>',
    cat: () => '<path d="M-10 0 q-2 -18 10 -20 q12 2 10 20Z" fill="#f59e0b"/><circle cx="0" cy="-24" r="9" fill="#f59e0b"/><path d="M-8 -29 l1 -9 l6 6Z M8 -29 l-1 -9 l-6 6Z" fill="#f59e0b"/><path d="M-6.5 -31 l1 -4 l3 3Z M6.5 -31 l-1 -4 l-3 3Z" fill="#fda4af"/><path d="M-4 -25 q1.5 -1.5 3 0 M1 -25 q1.5 -1.5 3 0" stroke="#111" stroke-width="1.1" fill="none"/><path d="M-1 -21 h2 l-1 1.5Z" fill="#db2777"/><path d="M10 -4 q10 -2 8 -14" stroke="#f59e0b" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M-6 -14 h4 M-6 -10 h3 M3 -14 h3" stroke="#b45309" stroke-width="1.2"/>',
    dog: () => '<ellipse cx="2" cy="-12" rx="14" ry="8" fill="#d6a46b"/><circle cx="-12" cy="-22" r="8" fill="#d6a46b"/><ellipse cx="-17" cy="-20" rx="3.5" ry="7" fill="#8b5a2b"/><circle cx="-13" cy="-24" r="1.4" fill="#111"/><circle cx="-19" cy="-21" r="1.8" fill="#111"/><path d="M-14 -17 q2 3 4 0" stroke="#111" fill="none"/><path d="M-6 -14 q-4 0 -6 -2" fill="#ef4444"/><path d="M-8 -5 v5 M-2 -5 v5 M8 -5 v5 M13 -5 v5" stroke="#d6a46b" stroke-width="3.5" stroke-linecap="round"/><path d="M15 -15 q7 -6 6 -12" stroke="#d6a46b" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="-14" y="-16" width="8" height="2.5" rx="1" fill="#2563eb"/>',
    shrimp: () => '<path d="M-10 -4 q-4 -16 10 -18 q14 0 12 12 q-4 -6 -10 -6 q-8 0 -6 10Z" fill="#fb7185"/><path d="M-6 -14 h4 M-2 -18 v4 M4 -18 v5" stroke="#e11d48" stroke-width="1.2"/><circle cx="8" cy="-14" r="1.4" fill="#111"/><path d="M10 -16 q8 -10 14 -8 M10 -15 q6 -12 10 -14" stroke="#e11d48" stroke-width=".8" fill="none"/><path d="M-10 -4 l-5 2 l3 -6Z" fill="#e11d48"/>',
    ant: () => '<circle cx="-8" cy="-5" r="4.5" fill="#111"/><circle cx="0" cy="-6" r="3" fill="#111"/><circle cx="7" cy="-8" r="4" fill="#111"/><path d="M-9 -2 l-3 3 M-1 -3 l0 4 M3 -4 l3 4 M-5 -2 l2 3" stroke="#111" stroke-width="1"/><path d="M9 -11 q3 -6 6 -6 M8 -12 q0 -6 3 -8" stroke="#111" stroke-width=".9" fill="none"/><circle cx="9" cy="-9" r=".8" fill="#fff"/>',
    duck: () => '<ellipse cx="0" cy="-8" rx="11" ry="8" fill="#fde047"/><circle cx="-7" cy="-18" r="6" fill="#fde047"/><path d="M-13 -18 l-6 1 l6 2Z" fill="#f97316"/><circle cx="-8" cy="-19.5" r="1.2" fill="#111"/><path d="M2 -10 q5 -3 9 0" stroke="#eab308" stroke-width="2" fill="none"/><path d="M-3 0 v-1 M3 0 v-1" stroke="#f97316" stroke-width="2"/>',
    rubberduck: () => '<path d="M-14 -2 q0 -12 12 -12 q10 0 14 6 q-2 8 -14 8Z" fill="#facc15"/><circle cx="-6" cy="-18" r="7" fill="#facc15"/><path d="M-13 -17 l-7 2 l7 2Z" fill="#fb923c"/><circle cx="-7" cy="-20" r="1.3" fill="#111"/><path d="M-20 0 h40" stroke="#38bdf8" stroke-width="3"/>',
    bee: () => '<ellipse cx="0" cy="-12" rx="9" ry="6.5" fill="#facc15"/><path d="M-3 -18 v12 M3 -18 v12" stroke="#111" stroke-width="2.6"/><ellipse cx="-3" cy="-21" rx="5" ry="3.5" fill="#e0f2fe" opacity=".9"/><ellipse cx="4" cy="-21" rx="5" ry="3.5" fill="#e0f2fe" opacity=".9"/><circle cx="-8" cy="-13" r="1.1" fill="#111"/><path d="M9 -12 l4 0" stroke="#111" stroke-width="1.5"/><path d="M0 -5 v5" stroke="#111" stroke-dasharray="1 2"/>',
    penguin: () => '<ellipse cx="0" cy="-14" rx="9" ry="14" fill="#1e293b"/><ellipse cx="0" cy="-11" rx="6" ry="10" fill="#f8fafc"/><circle cx="0" cy="-28" r="7" fill="#1e293b"/><circle cx="-2.5" cy="-29" r="1.4" fill="#fff"/><circle cx="2.5" cy="-29" r="1.4" fill="#fff"/><path d="M-2 -26 l2 3 l2 -3Z" fill="#f97316"/><path d="M-4 0 h3 M1 0 h3" stroke="#f97316" stroke-width="2"/>',
    bear: () => '<ellipse cx="0" cy="-14" rx="18" ry="12" fill="#f1f5f9" stroke="#cbd5e1"/><circle cx="-16" cy="-24" r="9" fill="#f1f5f9" stroke="#cbd5e1"/><circle cx="-20" cy="-31" r="3" fill="#f1f5f9" stroke="#cbd5e1"/><circle cx="-12" cy="-32" r="3" fill="#f1f5f9" stroke="#cbd5e1"/><circle cx="-18" cy="-25" r="1.3" fill="#111"/><circle cx="-23" cy="-22" r="1.8" fill="#111"/><path d="M-12 -4 v4 M-4 -4 v4 M6 -4 v4 M12 -4 v4" stroke="#e2e8f0" stroke-width="5" stroke-linecap="round"/>',
    mona: () => '<rect x="-14" y="-40" width="28" height="36" fill="#a16207" stroke="#713f12" stroke-width="2"/><rect x="-10" y="-36" width="20" height="28" fill="#65a30d"/><rect x="-10" y="-36" width="20" height="12" fill="#a3c48a"/><path d="M-7 -8 q0 -10 7 -11 q7 1 7 11Z" fill="#3f2a14"/><ellipse cx="0" cy="-24" rx="4.5" ry="5.5" fill="#e7c08a"/><path d="M-5 -24 q0 -8 5 -8 q5 0 5 8 l-1 6 v-6 q-4 -4 -8 0 v6Z" fill="#2b1d12"/><path d="M-1.5 -21 q1.5 1 3 0" stroke="#7a4a24" stroke-width=".7" fill="none"/><path d="M-6 -4 v4 M6 -4 v4" stroke="#713f12" stroke-width="2"/>',
    package: () => '<rect x="-14" y="-24" width="28" height="24" rx="2" fill="#c08a4f" stroke="#8b5a2b"/><path d="M-14 -16 h28 M0 -24 v24" stroke="#8b5a2b"/><rect x="-6" y="-24" width="12" height="6" fill="#e9d5a1"/><path d="M4 -9 l3 3 l5 -6" stroke="#111" stroke-width="1.2" fill="none"/><text x="-8" y="-4" font-size="5" fill="#5b3a1a" font-weight="900">FRAGILE</text>',
    robot: () => '<rect x="-9" y="-26" width="18" height="18" rx="3" fill="#94a3b8" stroke="#475569"/><rect x="-7" y="-40" width="14" height="12" rx="3" fill="#cbd5e1" stroke="#475569"/><circle cx="-3" cy="-34" r="2" fill="#22d3ee"/><circle cx="3" cy="-34" r="2" fill="#22d3ee"/><path d="M0 -40 v-5" stroke="#475569"/><circle cx="0" cy="-46" r="2" fill="#ef4444"/><path d="M-5 -8 v8 M5 -8 v8" stroke="#475569" stroke-width="3"/><path d="M-9 -22 l-5 7 M9 -22 l5 7" stroke="#475569" stroke-width="2.5"/><path d="M-4 -18 h8 M-4 -15 h5" stroke="#f8fafc" stroke-width="1"/><path d="M8 -46 q4 -4 6 0 q-3 3 -6 0" fill="#ec4899"/>',
    robovac: () => '<ellipse cx="0" cy="-5" rx="15" ry="5" fill="#334155"/><ellipse cx="0" cy="-8" rx="15" ry="5" fill="#64748b"/><circle cx="0" cy="-9" r="3" fill="#22d3ee"/><path d="M-4 -20 q-4 -6 0 -7 q2 0 2 2 q0 -2 2 -2 q4 1 0 7 l-2 2Z" fill="#ef4444"/>',
    wifi: () => '<rect x="-14" y="-10" width="28" height="10" rx="3" fill="#e2e8f0" stroke="#64748b"/><circle cx="-8" cy="-5" r="1.3" fill="#22c55e"/><circle cx="-4" cy="-5" r="1.3" fill="#22c55e"/><path d="M-9 -10 l-3 -10 M9 -10 l3 -10" stroke="#475569" stroke-width="2"/><path d="M-8 -26 q8 -8 16 0 M-5 -22 q5 -5 10 0" stroke="#3b82f6" stroke-width="2" fill="none"/><circle cx="0" cy="-18" r="1.6" fill="#3b82f6"/>',
    disc: () => '<circle cx="0" cy="-16" r="15" fill="url(#trDisc)" stroke="#94a3b8"/><circle cx="0" cy="-16" r="4" fill="#f8fafc" stroke="#94a3b8"/><path d="M-6 -26 q8 -4 14 2" stroke="#fff" stroke-width="1.5" fill="none" opacity=".8"/>',
    coffee: () => '<path d="M-7 -16 h14 l-2 16 h-10Z" fill="#f8fafc" stroke="#94a3b8"/><rect x="-8" y="-19" width="16" height="4" rx="1.5" fill="#78350f"/><path d="M-6 -10 h12" stroke="#16a34a" stroke-width="3"/><path d="M-2 -24 q-2 -3 0 -5 M2 -24 q-2 -3 0 -5" stroke="#cbd5e1" stroke-width="1.2" fill="none"/>',
    loop: () => '<path d="M-10 -18 a12 12 0 1 1 6 10" stroke="#f97316" stroke-width="4" fill="none"/><path d="M-12 -4 l2 -9 l7 5Z" fill="#f97316"/>',
    tunnel: () => '<path d="M-22 0 v-26 q22 -22 44 0 v26Z" fill="#57534e"/><path d="M-14 0 v-20 q14 -14 28 0 v20Z" fill="#0c0a09"/><text x="0" y="-9" font-size="16" font-weight="900" text-anchor="middle" fill="#fde047" font-family="system-ui,sans-serif">?</text>',
    stop: () => '<path d="M0 0 v-22" stroke="#64748b" stroke-width="3"/><path d="M-7 -40 h14 l5 5 v14 l-5 5 h-14 l-5 -5 v-14Z" fill="#dc2626" stroke="#fff" stroke-width="1.5"/><text x="0" y="-25" font-size="6.5" font-weight="900" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif">STOP</text>',
    minitrolley: () => '<rect x="-16" y="-22" width="32" height="17" rx="3" fill="#60a5fa" stroke="#1d4ed8"/><rect x="-12" y="-19" width="7" height="6" fill="#e0f2fe"/><rect x="-3" y="-19" width="7" height="6" fill="#e0f2fe"/><rect x="6" y="-19" width="7" height="6" fill="#e0f2fe"/><circle cx="-9" cy="-3" r="3" fill="#1e293b"/><circle cx="9" cy="-3" r="3" fill="#1e293b"/>',
    ginger: () => '<path d="M-16 0 v-18 l16 -12 l16 12 v18Z" fill="#b45309"/><path d="M-19 -17 l19 -15 l19 15" stroke="#fff" stroke-width="3" fill="none" stroke-linejoin="round"/><rect x="-4" y="-12" width="8" height="12" rx="4" fill="#78350f"/><circle cx="-9" cy="-14" r="2.5" fill="#ef4444"/><circle cx="9" cy="-14" r="2.5" fill="#22c55e"/><path d="M-14 -4 q2 -2 4 0 M10 -4 q2 -2 4 0" stroke="#fff" fill="none"/>',
    snowman: () => '<circle cx="0" cy="-10" r="10" fill="#f8fafc" stroke="#cbd5e1"/><circle cx="0" cy="-26" r="7.5" fill="#f8fafc" stroke="#cbd5e1"/><circle cx="-2.5" cy="-28" r="1.1" fill="#111"/><circle cx="2.5" cy="-28" r="1.1" fill="#111"/><path d="M0 -26 l7 1.5 l-7 1Z" fill="#f97316"/><path d="M-7 -20 h14" stroke="#dc2626" stroke-width="3"/><rect x="-5" y="-40" width="10" height="7" fill="#111"/><rect x="-7.5" y="-34" width="15" height="2" fill="#111"/><circle cx="0" cy="-13" r="1.1" fill="#111"/><circle cx="0" cy="-8" r="1.1" fill="#111"/><path d="M-9 -16 l-8 -6 M9 -16 l8 -6" stroke="#78350f" stroke-width="1.5"/>',
    pizza: () => '<path d="M-14 -24 l14 24 l14 -24 q-14 -6 -28 0Z" fill="#fcd34d" stroke="#d97706" stroke-width="1.5"/><path d="M-14 -24 q14 -6 28 0 l-1.5 3 q-12.5 -5 -25 0Z" fill="#b45309"/><circle cx="-4" cy="-16" r="2.5" fill="#dc2626"/><circle cx="4" cy="-14" r="2.5" fill="#dc2626"/><circle cx="0" cy="-7" r="2.2" fill="#dc2626"/>',
    yarn: () => '<circle cx="0" cy="-18" r="18" fill="#ec4899"/><path d="M-16 -24 q16 8 32 0 M-17 -14 q17 8 34 0 M-10 -32 q6 18 20 30 M-2 -36 q10 20 14 34" stroke="#be185d" stroke-width="1.6" fill="none"/><path d="M14 -6 q10 6 16 4" stroke="#ec4899" stroke-width="2" fill="none"/>',
    sandcastle: () => '<path d="M-18 0 v-14 h6 v4 h4 v-4 h6 v-8 h4 v4 h4 v-4 h4 v8 h6 v4 h4 v-4 h4 v14Z" fill="#fcd34d" stroke="#d97706"/><path d="M0 -26 v-8" stroke="#64748b"/><path d="M0 -34 l7 2 l-7 2Z" fill="#ef4444"/><rect x="-3" y="-8" width="6" height="8" rx="3" fill="#b45309"/><path d="M-24 0 h48" stroke="#38bdf8" stroke-width="3"/>',
    wave: () => '<path d="M-22 0 q0 -24 18 -26 q12 0 12 10 q-8 -6 -12 2 q-2 6 6 6 h20 v8Z" fill="#38bdf8"/><path d="M-6 -24 q8 -4 12 2" stroke="#f0f9ff" stroke-width="3" fill="none"/>',
    phone: () => '<rect x="-8" y="-28" width="16" height="28" rx="3" fill="#111"/><rect x="-6" y="-25" width="12" height="20" rx="1" fill="#7dd3fc"/><rect x="-4" y="-22" width="7" height="3" fill="#ef4444"/><rect x="-4" y="-22" width="1.5" height="3" fill="#fff"/>',
    laptop: () => '<rect x="-14" y="-24" width="28" height="18" rx="2" fill="#334155"/><rect x="-12" y="-22" width="24" height="14" fill="#93c5fd"/><path d="M-10 -19 h14 M-10 -16 h10 M-10 -13 h16" stroke="#1e3a8a" stroke-width="1"/><path d="M-18 -4 h36 l-3 4 h-30Z" fill="#94a3b8"/>',
    capsule: () => '<rect x="-10" y="-30" width="20" height="30" rx="4" fill="#94a3b8" stroke="#475569"/><rect x="-12" y="-32" width="24" height="6" rx="2" fill="#64748b"/><text x="0" y="-12" font-size="7" font-weight="900" text-anchor="middle" fill="#1e293b" font-family="system-ui,sans-serif">1999</text>',
    lever: () => '<rect x="-8" y="-6" width="16" height="6" rx="1" fill="#334155"/><path d="M0 -4 l-8 -16" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/><circle cx="-8" cy="-20" r="3" fill="#ef4444"/><rect x="10" y="-6" width="10" height="6" rx="1" fill="#334155"/><path d="M15 -4 l-5 -12" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/><text x="22" y="-10" font-size="9" fill="#ef4444" font-weight="900">...</text>',
    bed: () => `<rect x="-24" y="-14" width="48" height="10" rx="3" fill="#f8fafc" stroke="#cbd5e1"/><path d="M-24 -20 v20 M24 -14 v14" stroke="#92400e" stroke-width="4"/><rect x="-22" y="-20" width="12" height="7" rx="3" fill="#fff" stroke="#e2e8f0"/><circle cx="-14" cy="-21" r="6" fill="#f1c7a2"/><path d="M-20 -22 q6 -8 12 0" fill="#6b4423"/><path d="M-16 -21 h2 M-12 -21 h2" stroke="#111"/><path d="M-10 -16 h32 v6 h-32Z" fill="#60a5fa"/><text x="4" y="-26" font-size="8" fill="#64748b" font-weight="900">z z</text><g transform="translate(0 -40)"><rect x="-14" y="-9" width="28" height="13" rx="6.5" fill="#ff5a36"/><text y="1" font-size="8.5" font-weight="900" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif">YOU</text></g>`,
    question: () => '<circle cx="0" cy="-18" r="16" fill="#a78bfa" opacity=".85"/><text x="0" y="-11" font-size="22" font-weight="900" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif">?</text>',
    mic: () => '<path d="M0 0 v-22 M-8 0 h16" stroke="#475569" stroke-width="2.5"/><rect x="-4" y="-34" width="8" height="12" rx="4" fill="#1f2937"/><path d="M-3 -31 h6 M-3 -28 h6" stroke="#9ca3af" stroke-width=".8"/>',
    plant: () => '<path d="M-9 -12 h18 l-3 12 h-12Z" fill="#c2410c"/><path d="M0 -12 q-2 -12 -12 -16 q4 10 12 16 M0 -12 q2 -16 12 -20 q-2 12 -12 20 M0 -12 q0 -14 2 -24" stroke="#16a34a" stroke-width="3" fill="#22c55e"/>',
    trophy: () => '<path d="M-9 -30 h18 v6 q0 10 -9 12 q-9 -2 -9 -12Z" fill="#facc15" stroke="#ca8a04"/><path d="M-9 -27 q-6 0 -5 5 q1 4 6 4 M9 -27 q6 0 5 5 q-1 4 -6 4" stroke="#ca8a04" stroke-width="1.5" fill="none"/><rect x="-2" y="-12" width="4" height="6" fill="#ca8a04"/><rect x="-8" y="-6" width="16" height="6" rx="1" fill="#78350f"/>',
    you: (seed) => person('#ff5a36', '', seed, true),
    gran: (seed) => person('#a855f7', 'gran', seed),
    rich: (seed) => person('#1f2937', 'rich', seed)
  };

  function sprite(tok, seed = 0) {
    if (tok === 'p' || tok.startsWith('p:')) {
      const [, sh, acc] = tok.split(':');
      return person(sh && sh !== 'tall' ? sh : null, acc || (sh === 'tall' ? 'tall' : ''), seed);
    }
    const f = S[tok];
    return f ? f(seed) : S.question();
  }
  const isCreature = (tok) => tok === 'p' || tok.startsWith('p:') || ['you', 'gran', 'rich', 'lobster', 'cat', 'dog', 'shrimp', 'ant', 'duck', 'bee', 'penguin', 'bear', 'bed'].includes(tok);

  function trolley() {
    return `<g class="tr-car">
      <path d="M0 -62 l18 -18 M18 -80 l14 0" stroke="#475569" stroke-width="2.5" fill="none"/>
      <rect x="-54" y="-60" width="108" height="46" rx="10" fill="url(#trBody)" stroke="#7c2d12" stroke-width="2"/>
      <rect x="-56" y="-64" width="112" height="9" rx="4" fill="#b91c1c"/>
      <rect x="-54" y="-24" width="108" height="8" fill="#7c2d12" opacity=".35"/>
      ${[-44, -20, 4].map((x) => `<rect x="${x}" y="-52" width="20" height="18" rx="3" fill="#bae6fd" stroke="#7c2d12" stroke-width="1.2"/>`).join('')}
      <circle cx="-34" cy="-40" r="4" fill="#475569"/><circle cx="-10" cy="-41" r="4" fill="#92400e"/>
      <rect x="30" y="-52" width="18" height="30" rx="3" fill="#bae6fd" stroke="#7c2d12" stroke-width="1.2"/>
      <circle cx="39" cy="-42" r="5" fill="#f1c7a2"/><path d="M34 -45 h10 v-3 h-10Z" fill="#1e3a8a"/>
      <circle cx="52" cy="-26" r="4" fill="#fef9c3" stroke="#a16207"/>
      <text x="-14" y="-17" font-size="7" font-weight="900" fill="#fff7ed" font-family="system-ui,sans-serif">LINE 1</text>
      ${[-34, 34].map((x) => `<g transform="translate(${x} -10)"><circle r="10" fill="#1f2937"/><g class="tr-wheel"><circle r="6" fill="#9ca3af"/><path d="M-6 0 h12 M0 -6 v12" stroke="#4b5563" stroke-width="2"/></g></g>`).join('')}
    </g>`;
  }

  function defs() {
    return `<defs>
      <linearGradient id="trSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--tr-sky1)"/><stop offset="1" stop-color="var(--tr-sky2)"/></linearGradient>
      <linearGradient id="trBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde047"/><stop offset="1" stop-color="#f59e0b"/></linearGradient>
      <linearGradient id="trGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--tr-grass1)"/><stop offset="1" stop-color="var(--tr-grass2)"/></linearGradient>
      <radialGradient id="trDisc" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#f0f9ff"/><stop offset=".5" stop-color="#c4b5fd"/><stop offset="1" stop-color="#5eead4"/></radialGradient>
      <radialGradient id="trLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fef9c3" stop-opacity=".9"/><stop offset="1" stop-color="#fef9c3" stop-opacity="0"/></radialGradient>
      <pattern id="trMime" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="3" fill="#111"/><rect y="3" width="6" height="3" fill="#fff"/></pattern>
    </defs>`;
  }

  function cloud(x, y, s, d) {
    return `<g class="tr-cloud" style="animation-duration:${d}s;animation-delay:-${(x / 7) | 0}s"><g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="26" ry="12" fill="var(--tr-cloud)"/><ellipse cx="-14" cy="4" rx="16" ry="9" fill="var(--tr-cloud)"/><ellipse cx="16" cy="4" rx="18" ry="9" fill="var(--tr-cloud)"/></g></g>`;
  }

  window.TrolleyArt = { sprite, isCreature, trolley, defs, cloud, person };
})();
