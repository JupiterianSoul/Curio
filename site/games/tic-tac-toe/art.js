(function () {
  const eyes = (x1, x2, y, r, c = '#2b2118') => `<g class="blink"><ellipse cx="${x1}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="${c}"/><ellipse cx="${x2}" cy="${y}" rx="${r}" ry="${r * 1.15}" fill="${c}"/><circle cx="${x1 + r * .35}" cy="${y - r * .4}" r="${r * .35}" fill="#fff"/><circle cx="${x2 + r * .35}" cy="${y - r * .4}" r="${r * .35}" fill="#fff"/></g>`;

  const SKINS = {
    classic: {
      name: 'Pencil', colors: ['var(--tx)', 'var(--to)'],
      X: `<g class="pc-pencil"><path class="sh" d="M26 28 L76 78 M76 26 L26 78"/><path class="ln x" pathLength="1" d="M24 24 L76 76"/><path class="ln x ln2" pathLength="1" d="M76 24 L24 76"/></g>`,
      O: `<g class="pc-pencil"><circle class="sh" cx="52" cy="53" r="28"/><path class="ln o" pathLength="1" d="M50 22 A28 28 0 1 1 49.9 22"/></g>`,
      sound: 'pencil'
    },
    critters: {
      name: 'Cat vs Pup', colors: ['#f2994a', '#a1724e'],
      X: `<g class="bob"><path d="M18 46 L22 12 L46 30 Z" fill="#e8873a"/><path d="M82 46 L78 12 L54 30 Z" fill="#e8873a"/><path d="M25 36 L26 20 L39 30 Z" fill="#ffc4a3"/><path d="M75 36 L74 20 L61 30 Z" fill="#ffc4a3"/><ellipse cx="50" cy="56" rx="35" ry="30" fill="#f2994a"/><path d="M41 28 q9 7 18 0 M44 34 q6 4 12 0" stroke="#d6762b" stroke-width="3.5" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="66" rx="17" ry="12" fill="#ffe2cc"/>${eyes(38, 62, 52, 5)}<path d="M46 62 h8 l-4 5z" fill="#e8577a"/><path d="M50 67 q-5 6 -10 2 M50 67 q5 6 10 2" stroke="#2b2118" fill="none" stroke-width="2.4" stroke-linecap="round"/><path d="M14 58 l16 2 M14 66 l16 -1 M86 58 l-16 2 M86 66 l-16 -1" stroke="#2b2118" stroke-width="1.6" stroke-linecap="round" opacity=".6"/></g>`,
      O: `<g class="bob bob2"><ellipse cx="18" cy="52" rx="11" ry="22" fill="#6d4a33" transform="rotate(18 18 52)"/><ellipse cx="82" cy="52" rx="11" ry="22" fill="#6d4a33" transform="rotate(-18 82 52)"/><ellipse cx="50" cy="52" rx="32" ry="31" fill="#c69466"/><ellipse cx="62" cy="40" rx="11" ry="10" fill="#f1e2cf" opacity=".9"/><ellipse cx="50" cy="66" rx="18" ry="13" fill="#f1e2cf"/>${eyes(39, 61, 48, 4.6)}<ellipse cx="50" cy="60" rx="6.5" ry="4.8" fill="#2b2118"/><path d="M50 64 v4 M50 68 q-5 4 -9 1 M50 68 q5 4 9 1" stroke="#2b2118" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M53 70 q3 9 -3 10 q-5 -1 -3 -9z" fill="#ff7d93"/></g>`,
      sound: 'critter'
    },
    space: {
      name: 'Star vs Planet', colors: ['#ffb300', '#7c4dff'],
      X: `<g class="spin"><path d="M50 10 L61 37 L90 39 L67 57 L75 86 L50 70 L25 86 L33 57 L10 39 L39 37 Z" fill="url(#tg-gold)" stroke="#e08600" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 22 L56 39" stroke="#fff8d0" stroke-width="3" stroke-linecap="round" opacity=".8"/></g><circle class="twinkle" cx="84" cy="16" r="3" fill="#fff6c2"/>`,
      O: `<g class="tilt"><path d="M12 58 Q50 40 88 46" stroke="#ffd58a" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/><circle cx="50" cy="52" r="27" fill="url(#tg-planet)"/><path d="M28 44 q22 -6 44 2" stroke="#b39dff" stroke-width="4" fill="none" opacity=".6"/><path d="M27 58 q24 6 46 -2" stroke="#4a2aa8" stroke-width="3.5" fill="none" opacity=".5"/><path d="M8 62 Q50 72 92 50" stroke="#ffd58a" stroke-width="7" fill="none" stroke-linecap="round"/></g>`,
      sound: 'zap'
    },
    fruit: {
      name: 'Berry vs Orange', colors: ['#e53935', '#ff9800'],
      X: `<g class="bob"><path d="M50 88 C24 76 14 52 22 36 C30 24 70 24 78 36 C86 52 76 76 50 88 Z" fill="url(#tg-berry)"/><g fill="#ffe082"><ellipse cx="36" cy="44" rx="2" ry="3"/><ellipse cx="50" cy="42" rx="2" ry="3"/><ellipse cx="64" cy="44" rx="2" ry="3"/><ellipse cx="42" cy="56" rx="2" ry="3"/><ellipse cx="58" cy="56" rx="2" ry="3"/><ellipse cx="34" cy="60" rx="2" ry="3"/><ellipse cx="66" cy="60" rx="2" ry="3"/><ellipse cx="50" cy="68" rx="2" ry="3"/><ellipse cx="44" cy="78" rx="2" ry="3"/><ellipse cx="56" cy="78" rx="2" ry="3"/></g><path d="M50 32 L36 20 L46 30 L40 12 L50 28 L60 12 L54 30 L64 20 Z" fill="#43a047" stroke="#2e7d32" stroke-width="2" stroke-linejoin="round"/><ellipse cx="34" cy="38" rx="5" ry="3" fill="#fff" opacity=".45" transform="rotate(-30 34 38)"/></g>`,
      O: `<g class="spin slow"><circle cx="50" cy="50" r="36" fill="#f57c00"/><circle cx="50" cy="50" r="31" fill="#fff4dc"/><circle cx="50" cy="50" r="28" fill="url(#tg-orange)"/><g stroke="#fff4dc" stroke-width="2.6" stroke-linecap="round"><path d="M50 50 L50 23"/><path d="M50 50 L73 36"/><path d="M50 50 L73 64"/><path d="M50 50 L50 77"/><path d="M50 50 L27 64"/><path d="M50 50 L27 36"/></g><circle cx="50" cy="50" r="3.5" fill="#fff4dc"/></g>`,
      sound: 'pop'
    },
    monsters: {
      name: 'Monster vs Slime', colors: ['#9c4dcc', '#43a047'],
      X: `<g class="bob"><path d="M28 30 L22 10 L38 24 Z M72 30 L78 10 L62 24 Z" fill="#fff3e0" stroke="#5e1f8a" stroke-width="2"/><path d="M16 84 C10 50 22 22 50 22 C78 22 90 50 84 84 L74 78 L64 86 L54 78 L46 86 L36 78 L26 86 Z" fill="url(#tg-monster)"/><g class="blink"><circle cx="50" cy="48" r="15" fill="#fff"/><circle class="look" cx="52" cy="50" r="7" fill="#2b1840"/><circle cx="55" cy="46" r="2.4" fill="#fff"/></g><path d="M34 68 Q50 78 66 68 Z" fill="#2b1840"/><path d="M40 69 l3 5 l3 -4 M54 71 l3 4 l3 -5" fill="#fff"/></g>`,
      O: `<g class="wobble"><path d="M50 14 C64 30 84 44 84 64 C84 80 70 88 50 88 C30 88 16 80 16 64 C16 44 36 30 50 14 Z" fill="url(#tg-slime)"/>${eyes(40, 60, 60, 5.5, '#123d18')}<path d="M44 74 q6 5 12 0" stroke="#123d18" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="33" cy="48" rx="6" ry="9" fill="#fff" opacity=".4" transform="rotate(25 33 48)"/></g>`,
      sound: 'blub'
    }
  };

  const mouths = (idle, happy, sad, shock) => `<g class="md md-idle">${idle}</g><g class="md md-happy">${happy}</g><g class="md md-sad">${sad}</g><g class="md md-shock">${shock}</g>`;

  const AVATARS = {
    pip: `<svg viewBox="0 0 120 120" class="av"><ellipse cx="60" cy="112" rx="30" ry="5" fill="#000" opacity=".12"/><g class="av-body"><path d="M52 22 q-4 -12 6 -14 M60 22 q2 -14 12 -10" stroke="#f5a400" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="60" cy="66" r="42" fill="#ffd23f"/><ellipse cx="60" cy="82" rx="26" ry="20" fill="#fff0a6"/><ellipse cx="20" cy="74" rx="9" ry="16" fill="#f5b800" transform="rotate(25 20 74)" class="wing-l"/><ellipse cx="100" cy="74" rx="9" ry="16" fill="#f5b800" transform="rotate(-25 100 74)" class="wing-r"/><circle cx="36" cy="70" r="7" fill="#ff9aa8" opacity=".6"/><circle cx="84" cy="70" r="7" fill="#ff9aa8" opacity=".6"/>${mouths(
      '<g class="pupils"><circle cx="45" cy="56" r="6" fill="#2b2118"/><circle cx="75" cy="56" r="6" fill="#2b2118"/><circle cx="47" cy="54" r="2" fill="#fff"/><circle cx="77" cy="54" r="2" fill="#fff"/></g><path d="M52 66 L68 66 L60 76 Z" fill="#ff8a1f"/>',
      '<path d="M38 58 q7 -9 14 0 M68 58 q7 -9 14 0" stroke="#2b2118" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M50 66 L70 66 L60 80 Z" fill="#ff8a1f"/><path d="M53 70 L67 70 L60 78 Z" fill="#c2410c"/>',
      '<path d="M38 58 q7 5 14 0 M68 58 q7 5 14 0" stroke="#2b2118" stroke-width="4" fill="none" stroke-linecap="round"/><path class="tear" d="M40 64 q-3 6 0 8 q3 -2 0 -8z" fill="#5ab6ff"/><path d="M53 70 L67 70 L60 76 Z" fill="#ff8a1f"/>',
      '<circle cx="45" cy="55" r="8" fill="#fff" stroke="#2b2118" stroke-width="3"/><circle cx="75" cy="55" r="8" fill="#fff" stroke="#2b2118" stroke-width="3"/><circle cx="45" cy="55" r="3" fill="#2b2118"/><circle cx="75" cy="55" r="3" fill="#2b2118"/><path d="M52 66 L68 66 L60 72 Z M52 74 L68 74 L60 82 Z" fill="#ff8a1f"/>')}</g></svg>`,
    hoot: `<svg viewBox="0 0 120 120" class="av"><ellipse cx="60" cy="113" rx="32" ry="5" fill="#000" opacity=".12"/><g class="av-body"><path d="M24 30 L30 8 L46 24 Z M96 30 L90 8 L74 24 Z" fill="#7a4e2d"/><ellipse cx="60" cy="66" rx="42" ry="46" fill="#9a6a41"/><ellipse cx="60" cy="84" rx="26" ry="24" fill="#f4dfc0"/><path d="M48 78 q4 4 8 0 M64 78 q4 4 8 0 M54 90 q4 4 8 0 M44 92 q3 3 6 0 M70 92 q3 3 6 0" stroke="#c49a6c" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M18 70 q-6 20 12 34 q-2 -18 2 -30z M102 70 q6 20 -12 34 q2 -18 -2 -30z" fill="#7a4e2d"/><circle cx="42" cy="50" r="17" fill="#f6b73c"/><circle cx="78" cy="50" r="17" fill="#f6b73c"/><circle cx="42" cy="50" r="13" fill="#fff"/><circle cx="78" cy="50" r="13" fill="#fff"/>${mouths(
      '<g class="pupils"><circle cx="43" cy="51" r="7" fill="#2b2118"/><circle cx="77" cy="51" r="7" fill="#2b2118"/><circle cx="45" cy="48" r="2.4" fill="#fff"/><circle cx="79" cy="48" r="2.4" fill="#fff"/></g><path d="M54 60 L66 60 L60 72 Z" fill="#f08a00"/>',
      '<path d="M32 52 q10 -10 20 0 M68 52 q10 -10 20 0" stroke="#2b2118" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M54 60 L66 60 L60 72 Z" fill="#f08a00"/>',
      '<path d="M30 42 L54 48 M90 42 L66 48" stroke="#7a4e2d" stroke-width="7" stroke-linecap="round"/><circle cx="43" cy="54" r="6" fill="#2b2118"/><circle cx="77" cy="54" r="6" fill="#2b2118"/><path d="M54 62 L66 62 L60 70 Z" fill="#f08a00"/>',
      '<circle cx="42" cy="50" r="4" fill="#2b2118"/><circle cx="78" cy="50" r="4" fill="#2b2118"/><path d="M53 60 L67 60 L60 66 Z M54 68 L66 68 L60 76 Z" fill="#f08a00"/>')}<path class="specs" d="M25 50 h-6 M95 50 h6" stroke="#2b2118" stroke-width="2"/></g></svg>`,
    unit: `<svg viewBox="0 0 120 120" class="av"><ellipse cx="60" cy="113" rx="32" ry="5" fill="#000" opacity=".12"/><g class="av-body"><path d="M60 22 V8" stroke="#7d8ea3" stroke-width="4"/><circle class="antenna" cx="60" cy="8" r="6" fill="#ff5252"/><rect x="14" y="22" width="92" height="76" rx="22" fill="url(#tg-metal)" stroke="#5c6b7f" stroke-width="3"/><rect x="6" y="48" width="10" height="24" rx="4" fill="#5c6b7f"/><rect x="104" y="48" width="10" height="24" rx="4" fill="#5c6b7f"/><rect x="24" y="34" width="72" height="50" rx="12" fill="#13202e"/><circle cx="30" cy="92" r="3" fill="#5c6b7f"/><circle cx="90" cy="92" r="3" fill="#5c6b7f"/>${mouths(
      '<g class="pupils"><rect x="36" y="44" width="16" height="14" rx="4" fill="#40e0ff"/><rect x="68" y="44" width="16" height="14" rx="4" fill="#40e0ff"/></g><g class="eq" fill="#40e0ff"><rect x="44" y="68" width="5" height="6" rx="2"/><rect x="51" y="66" width="5" height="10" rx="2"/><rect x="58" y="68" width="5" height="6" rx="2"/><rect x="65" y="66" width="5" height="10" rx="2"/><rect x="72" y="68" width="5" height="6" rx="2"/></g>',
      '<path d="M36 56 q8 -12 16 0 M68 56 q8 -12 16 0" stroke="#7dffb0" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M44 68 q16 12 32 0" stroke="#7dffb0" stroke-width="5" fill="none" stroke-linecap="round"/>',
      '<path d="M37 45 l14 12 M51 45 l-14 12 M69 45 l14 12 M83 45 l-14 12" stroke="#ff6b6b" stroke-width="4.5" stroke-linecap="round"/><path d="M44 76 q16 -10 32 0" stroke="#ff6b6b" stroke-width="5" fill="none" stroke-linecap="round"/>',
      '<circle cx="44" cy="51" r="8" fill="none" stroke="#ffd54f" stroke-width="4"/><circle cx="76" cy="51" r="8" fill="none" stroke="#ffd54f" stroke-width="4"/><rect x="52" y="66" width="16" height="12" rx="5" fill="#ffd54f"/>')}</g></svg>`,
    friend: `<svg viewBox="0 0 120 120" class="av"><ellipse cx="60" cy="113" rx="32" ry="5" fill="#000" opacity=".12"/><g class="av-body"><path d="M20 108 C14 60 28 18 60 18 C92 18 106 60 100 108 Z" fill="#4fc3f7"/><path d="M34 30 q26 -20 52 0" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>${mouths(
      '<g class="pupils"><circle cx="46" cy="56" r="6" fill="#0d2b3e"/><circle cx="74" cy="56" r="6" fill="#0d2b3e"/></g><path d="M48 74 q12 8 24 0" stroke="#0d2b3e" stroke-width="4" fill="none" stroke-linecap="round"/>',
      '<path d="M40 58 q6 -8 12 0 M68 58 q6 -8 12 0" stroke="#0d2b3e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M44 70 q16 16 32 0 z" fill="#0d2b3e"/>',
      '<circle cx="46" cy="58" r="5" fill="#0d2b3e"/><circle cx="74" cy="58" r="5" fill="#0d2b3e"/><path d="M48 80 q12 -8 24 0" stroke="#0d2b3e" stroke-width="4" fill="none" stroke-linecap="round"/>',
      '<circle cx="46" cy="56" r="7" fill="#fff" stroke="#0d2b3e" stroke-width="3"/><circle cx="74" cy="56" r="7" fill="#fff" stroke="#0d2b3e" stroke-width="3"/><ellipse cx="60" cy="78" rx="7" ry="9" fill="#0d2b3e"/>')}</g></svg>`
  };

  const QUIPS = {
    pip: {
      hello: ['Peep! Let\'s play!', 'I practised! On a napkin!', 'Cheep cheep, ready!', 'I brought snacks. Seeds, mostly.'],
      think: ['Hmm... this one looks shiny.', 'Eeny, meeny...', 'Pecking...', 'Ooh, a square!'],
      win: ['I WON? Mum! MUM!', 'Peep peep hooray!', 'Beginner\'s luck counts!', 'Did I do that?'],
      lose: ['Aww. Good game!', 'You\'re so clever.', 'Can we play again?', 'I was distracted by a worm.'],
      draw: ['Nobody lost! Yay!', 'A tie! I love ties.', 'We both win, kind of.'],
      oops: ['Oh no, I see it now.', 'Uh oh.']
    },
    hoot: {
      hello: ['Shall we? I\'ve read the books.', 'Center first. Always center.', 'Hoo, a challenger.', 'Let us begin, scholar.'],
      think: ['Consulting my notes...', 'Hoo hoo, interesting.', 'Calculating... mostly.', 'Let me squint at this.'],
      win: ['As the textbooks predicted.', 'Elementary, my dear human.', 'A fine lesson for you.', 'Hoo-ray!'],
      lose: ['Most irregular!', 'I must update my notes.', 'Well played, truly.', 'You have studied!'],
      draw: ['A respectable stalemate.', 'Balanced, as theory says.', 'Hoo. A draw.'],
      oops: ['Hmm, I may have erred.', 'That was... a test.']
    },
    unit: {
      hello: ['UNIT-9 ONLINE. RESISTANCE IS DRAWISH.', 'I have simulated this game 362,880 times.', 'GREETINGS, CARBON UNIT.', 'PROBABILITY OF YOUR VICTORY: LOW.'],
      think: ['COMPUTING...', 'SEARCHING ALL FUTURES.', 'BEEP. BOOP. OPTIMAL.', 'PROCESSING...'],
      win: ['OUTCOME: PREDICTED.', 'HUMANS: 0. MACHINES: 1.', 'AS CALCULATED.', 'ERROR: OPPONENT NOT FOUND.'],
      lose: ['DOES NOT COMPUTE.', 'RECALIBRATING... IMPRESSIVE.', 'PLEASE REPORT THIS BUG.', 'I WILL REMEMBER THIS.'],
      draw: ['EQUILIBRIUM ACHIEVED.', 'DRAW. AS EXPECTED.', 'ADEQUATE PERFORMANCE, HUMAN.'],
      oops: ['UNEXPECTED INPUT.', 'HMM.']
    },
    friend: {
      hello: ['Pass the device, take turns.', 'Two humans, one board.'],
      think: ['Your turn...'], win: ['Victory dance!'], lose: ['Next time!'], draw: ['Honours even.'], oops: ['Hmm.']
    }
  };

  window.TTT_ART = { SKINS, AVATARS, QUIPS };
})();
