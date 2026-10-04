(function () {
  const WTPx = window.WTP;
  const chrome = (url, tab, icon) => `
  <div class="wc">
    <div class="wc-tabs"><span class="wc-dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span><span class="wc-tab">${icon} ${tab}</span><span class="wc-plus">+</span></div>
    <div class="wc-bar"><span class="wc-nav">&#8592; &#8594; &#8635;</span><span class="wc-url">&#128274; ${url}</span><span class="wc-menu">&#8942;</span></div>
  </div>`;

  const mapSvg = `<svg viewBox="0 0 420 260" width="420" height="260" xmlns="http://www.w3.org/2000/svg">
    <rect width="420" height="260" fill="#e8efe0"/>
    <path d="M0 180 C80 160 120 210 200 190 S330 150 420 170 V260 H0Z" fill="#9fd3ec"/>
    <rect x="30" y="30" width="90" height="60" fill="#c8e6b0"/><rect x="250" y="20" width="120" height="70" fill="#c8e6b0"/>
    <path d="M0 120 H420 M140 0 V260 M300 0 V180" stroke="#fff" stroke-width="12"/>
    <path d="M0 120 H420 M140 0 V260 M300 0 V180" stroke="#ffd34d" stroke-width="3"/>
    <path d="M60 230 L140 120 L300 120 L360 40" stroke="#4aa3ff" stroke-width="6" fill="none" stroke-dasharray="10 6"/>
    <circle cx="60" cy="230" r="9" fill="#2f8a4f"/><path d="M360 22 C350 22 344 30 344 38 C344 50 360 62 360 62 C360 62 376 50 376 38 C376 30 370 22 360 22Z" fill="#e8484f"/>
    <circle cx="360" cy="38" r="5" fill="#fff"/>
    <text x="70" y="62" font-size="13" font-family="Arial" fill="#2f8a4f">Park</text><text x="280" y="58" font-size="13" font-family="Arial" fill="#2f8a4f">Big Park</text>
    <text x="190" y="230" font-size="13" font-family="Arial" fill="#2f5bb7">Lake Probably</text>
  </svg>`;
  const plane = `<svg viewBox="0 0 120 50" width="120" height="50" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="50" fill="#eaf4ff"/><path d="M10 28 L80 24 Q104 24 108 28 Q104 32 80 32 L10 30Z" fill="#fff" stroke="#2f5bb7" stroke-width="2"/><path d="M50 26 L36 6 H46 L70 26Z M50 31 L36 46 H46 L70 31Z" fill="#4aa3ff"/><path d="M14 28 L8 16 H16 L24 28Z" fill="#e8484f"/></svg>`;
  const pet = (body, ear, kind) => `<svg viewBox="0 0 120 90" width="120" height="90" xmlns="http://www.w3.org/2000/svg"><rect width="120" height="90" fill="#fff4e0"/>${kind === 'cat' ? `<path d="M36 34 L44 14 L54 30Z M84 34 L76 14 L66 30Z" fill="${ear}"/>` : kind === 'dog' ? `<ellipse cx="38" cy="40" rx="9" ry="18" fill="${ear}"/><ellipse cx="82" cy="40" rx="9" ry="18" fill="${ear}"/>` : `<ellipse cx="50" cy="16" rx="6" ry="16" fill="${ear}"/><ellipse cx="70" cy="16" rx="6" ry="16" fill="${ear}"/>`}<circle cx="60" cy="46" r="26" fill="${body}"/><circle cx="50" cy="42" r="4" fill="#1a1226"/><circle cx="70" cy="42" r="4" fill="#1a1226"/><ellipse cx="60" cy="54" rx="5" ry="3.5" fill="#ff5fa2"/><path d="M52 60 Q60 66 68 60" stroke="#1a1226" stroke-width="2.5" fill="none"/><rect x="0" y="78" width="120" height="12" fill="#c98a5a"/></svg>`;
  const chart = `<svg viewBox="0 0 440 180" width="440" height="180" xmlns="http://www.w3.org/2000/svg"><rect width="440" height="180" fill="#0f1420"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M0 ${30 * i + 10} H440" stroke="#1f2a3d" stroke-width="1"/>`).join('')}
    <path d="M0 140 L40 120 L70 130 L110 60 L140 80 L170 30 L200 40 L230 20 L260 120 L290 150 L320 140 L350 160 L380 150 L410 168 L440 170" stroke="#e8484f" stroke-width="4" fill="none"/>
    <path d="M0 140 L40 120 L70 130 L110 60 L140 80 L170 30 L200 40 L230 20" stroke="#6fcf5a" stroke-width="4" fill="none"/>
    <circle cx="230" cy="20" r="6" fill="#ffe066"/><text x="238" y="16" font-size="12" font-family="Arial" fill="#ffe066">you bought here</text>
  </svg>`;
  const seat = (r, c) => { const taken = ((r * 7 + c * 3) % 5) === 0; const prem = r < 2; return `<span data-btn class="sk-seat${taken ? ' is-t' : ''}${prem ? ' is-p' : ''}">${taken ? 'X' : r + 1}${'ABCDEF'[c]}</span>`; };

  const css = `
  .p-maps { background: #f3f5f2; color: #1f2b24; font-family: Arial, "Liberation Sans", sans-serif; }
  .mp-top { display: flex; align-items: center; gap: 12px; padding: 12px 18px; background: #fff; border-bottom: 1px solid #d8dfd6; }
  .mp-logo { font-weight: 700; font-size: 22px; color: #2f8a4f; }
  .mp-search { flex: 1; border: 2px solid #c9d3c6; border-radius: 999px; padding: 8px 14px; color: #7a857a; background: #fff; }
  .mp-wrap { display: flex; gap: 16px; padding: 16px; }
  .nw .mp-wrap { flex-direction: column; }
  .mp-map { position: relative; border: 3px solid #fff; box-shadow: 0 2px 0 #c9d3c6; }
  .mp-map svg { display: block; max-width: 100%; height: auto; }
  .mp-zoom { position: absolute; right: 8px; top: 8px; display: flex; flex-direction: column; gap: 4px; }
  .mp-zbtn { background: #fff; border: 1px solid #c9d3c6; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: 700; border-radius: 6px; }
  .mp-side { flex: 1; min-width: 0; }
  .mp-side h2 { font-size: 18px; margin: 0 0 8px; }
  .mp-eta { background: #2f8a4f; color: #fff; padding: 10px 12px; border-radius: 8px; font-weight: 700; margin-bottom: 10px; }
  .mp-step { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px dashed #c9d3c6; font-size: 14px; }
  .mp-step b { color: #2f5bb7; min-width: 18px; }
  .mp-btns { display: flex; gap: 10px; padding: 0 16px 16px; flex-wrap: wrap; }
  .mp-btn { background: #2f5bb7; color: #fff; padding: 10px 18px; border-radius: 999px; font-weight: 700; }
  .mp-btn.alt { background: #fff; color: #2f5bb7; border: 2px solid #2f5bb7; }
  .mp-rev { margin: 0 16px 16px; background: #fff; padding: 12px 14px; border-left: 5px solid #ffd34d; font-size: 14px; }
  .mp-foot { text-align: center; color: #7a857a; font-size: 12px; padding: 12px; }

  .p-sky { background: #eef5ff; color: #12224a; font-family: "Trebuchet MS", "DejaVu Sans", Arial, sans-serif; }
  .sk-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #12224a; color: #fff; }
  .sk-logo { font-weight: 700; font-size: 22px; color: #ffe066; }
  .sk-hero { display: flex; align-items: center; gap: 16px; padding: 16px 20px; background: linear-gradient(90deg, #4aa3ff, #8fe3ff); color: #12224a; }
  .sk-hero h1 { font-size: 26px; margin: 0; }
  .sk-flights { padding: 14px 20px; display: flex; flex-direction: column; gap: 10px; }
  .sk-f { display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #fff; border-radius: 10px; padding: 12px 14px; border: 2px solid #cfe0f5; flex-wrap: wrap; }
  .sk-f b { font-size: 18px; }
  .sk-price { color: #e8484f; font-weight: 700; font-size: 20px; }
  .sk-fee { color: #8a809a; font-size: 12px; }
  .sk-pick { background: #ffb347; color: #12224a; font-weight: 700; padding: 8px 14px; border-radius: 8px; }
  .sk-map { margin: 6px 20px 16px; background: #fff; border-radius: 40px 40px 10px 10px; padding: 18px 16px 12px; border: 3px solid #cfe0f5; }
  .sk-map h2 { text-align: center; font-size: 16px; margin: 0 0 10px; }
  .sk-row { display: flex; justify-content: center; gap: 6px; margin-bottom: 6px; }
  .sk-row .gap { width: 18px; }
  .sk-seat { width: 34px; height: 26px; border-radius: 6px 6px 3px 3px; background: #4aa3ff; color: #fff; font-size: 11px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
  .nw .sk-seat { width: 26px; font-size: 9px; }
  .sk-seat.is-p { background: #9a4dff; }
  .sk-seat.is-t { background: #b9b0c4; color: #5c5270; }
  .sk-cta { margin: 0 20px 18px; background: #e8484f; color: #fff; text-align: center; padding: 14px; border-radius: 10px; font-weight: 700; font-size: 18px; }
  .sk-foot { text-align: center; color: #5c6f86; font-size: 12px; padding: 12px; }

  .p-pets { background: #fff9ef; color: #4a2c22; font-family: "Comic Sans MS", "Trebuchet MS", Arial, sans-serif; }
  .pt-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #ffb347; }
  .pt-logo { font-weight: 700; font-size: 22px; color: #4a2c22; }
  .pt-hero { text-align: center; padding: 18px; }
  .pt-hero h1 { font-size: 28px; margin: 0 0 4px; }
  .pt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 0 18px 18px; }
  .nw .pt-grid { grid-template-columns: repeat(2, 1fr); }
  .pt-card { background: #fff; border-radius: 14px; border: 3px solid #f0dcc0; padding: 10px; text-align: center; }
  .pt-card svg { max-width: 100%; height: auto; }
  .pt-card b { display: block; font-size: 17px; }
  .pt-card small { display: block; color: #8a5a3a; font-size: 12px; margin: 2px 0 8px; }
  .pt-adopt { display: inline-block; background: #ff5fa2; color: #fff; padding: 6px 14px; border-radius: 999px; font-weight: 700; font-size: 13px; }
  .pt-banner { margin: 0 18px 18px; background: #6fcf5a; color: #1f4a3a; padding: 14px; border-radius: 12px; font-weight: 700; text-align: center; }
  .pt-foot { text-align: center; color: #8a5a3a; font-size: 12px; padding: 12px; }

  .p-crypto { background: #0b0f18; color: #e6e8f0; font-family: "Liberation Mono", "Courier New", monospace; }
  .cr-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 18px; border-bottom: 2px solid #1f2a3d; }
  .cr-logo { font-weight: 700; font-size: 22px; color: #ffe066; }
  .cr-tick { display: flex; gap: 18px; padding: 8px 18px; background: #121a2a; font-size: 13px; overflow: hidden; white-space: nowrap; }
  .cr-tick .up { color: #6fcf5a; } .cr-tick .dn { color: #e8484f; }
  .cr-main { padding: 16px 18px; }
  .cr-main h1 { font-size: 24px; margin: 0 0 4px; }
  .cr-big { font-size: 34px; color: #e8484f; font-weight: 700; }
  .cr-chart { margin: 12px 0; border: 2px solid #1f2a3d; }
  .cr-chart svg { display: block; max-width: 100%; height: auto; }
  .cr-btns { display: flex; gap: 12px; }
  .cr-buy { background: #6fcf5a; color: #0b0f18; padding: 12px 24px; font-weight: 700; border-radius: 6px; }
  .cr-sell { background: #e8484f; color: #fff; padding: 12px 24px; font-weight: 700; border-radius: 6px; }
  .cr-book { margin: 0 18px 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; font-size: 13px; background: #121a2a; padding: 12px; }
  .cr-book .a { color: #e8484f; } .cr-book .b { color: #6fcf5a; text-align: right; }
  .cr-warn { margin: 0 18px 16px; background: #3a1a1a; border: 2px dashed #e8484f; padding: 12px; color: #ffb3b3; font-size: 13px; }
  .cr-foot { text-align: center; color: #5c6f86; font-size: 12px; padding: 12px; }
  `;

  const extra = [
    {
      id: 'maps', emoji: '🗺️', title: 'Wayfinder: Directions to the Nearest Exit', site: 'Wayfinder Maps', theme: '#2f8a4f',
      blurb: 'Turn by turn directions. Turn the map into rubble.',
      html: `<div class="wp p-maps">${chrome('wayfinder.example/dir/here/there', 'Directions', '🗺️')}
      <div class="mp-top"><span class="mp-logo">Wayfinder</span><span class="mp-search">From: here · To: somewhere better</span></div>
      <div class="mp-wrap"><div class="mp-map">${mapSvg}<div class="mp-zoom"><span class="mp-zbtn">+</span><span class="mp-zbtn">-</span></div></div>
      <div class="mp-side"><h2>Fastest route</h2><div class="mp-eta">14 min (3 min of it is a lake)</div>
      <div class="mp-step"><b>1</b><span>Head north until you feel judged</span></div>
      <div class="mp-step"><b>2</b><span>Turn left at the park that is mostly a parking lot</span></div>
      <div class="mp-step"><b>3</b><span>Continue straight through the lake</span></div>
      <div class="mp-step"><b>4</b><span>Recalculating</span></div>
      <div class="mp-step"><b>5</b><span>You have arrived. Probably.</span></div></div></div>
      <div class="mp-btns"><span class="mp-btn">Start navigation</span><span class="mp-btn alt">Avoid tolls</span><span class="mp-btn alt">Avoid lakes</span></div>
      <div class="mp-rev"><b>Lake Probably</b> · 4.1 stars · "Wet. Would drive through again." · 2,031 reviews</div>
      <div class="mp-foot">Map data may be imaginary · Do not follow directions into water</div>
      </div>`
    },
    {
      id: 'airline', emoji: '✈️', title: 'SkyCheap: Pick Your Seat (Fees Apply)', site: 'SkyCheap Airlines', theme: '#4aa3ff',
      blurb: 'A seat map made of thirty buttons. Upgrade them all to rubble.',
      html: `<div class="wp p-sky">${chrome('skycheap.example/booking/seat', 'Choose a seat', '✈️')}
      <div class="sk-top"><span class="sk-logo">SkyCheap</span><span>Flights · Hotels · Regret</span></div>
      <div class="sk-hero"><div>${plane}</div><h1>Nowhere to Elsewhere</h1></div>
      <div class="sk-flights">
        <div class="sk-f"><div><b>06:05 to 21:40</b><div class="sk-fee">3 stops · 1 of them is a field</div></div><div class="sk-price">$19</div><span class="sk-pick">Select</span></div>
        <div class="sk-f"><div><b>09:30 to 11:00</b><div class="sk-fee">Nonstop · seat costs extra</div></div><div class="sk-price">$480</div><span class="sk-pick">Select</span></div>
        <div class="sk-f"><div><b>23:55 to ???</b><div class="sk-fee">Mystery flight · bring snacks</div></div><div class="sk-price">$4</div><span class="sk-pick">Select</span></div>
      </div>
      <div class="sk-map"><h2>Pick your seat</h2>${Array.from({ length: 6 }, (_, r) => `<div class="sk-row">${seat(r, 0)}${seat(r, 1)}${seat(r, 2)}<span class="gap"></span>${seat(r, 3)}${seat(r, 4)}${seat(r, 5)}</div>`).join('')}</div>
      <div class="sk-cta">Continue to payment (+$62 seat fee, +$9 breathing fee)</div>
      <div class="sk-foot">Carry on bags must fit in your pocket · Pockets sold separately</div>
      </div>`
    },
    {
      id: 'pets', emoji: '🐾', title: 'Adopt a Pixel: Pets Looking for Homes', site: 'Adopt a Pixel', theme: '#ff5fa2',
      blurb: 'Very good boys and girls. Wreck around them, monster.',
      html: `<div class="wp p-pets">${chrome('adoptapixel.example/pets', 'Adopt a Pixel', '🐾')}
      <div class="pt-top"><span class="pt-logo">Adopt a Pixel</span><span>Dogs · Cats · Other</span></div>
      <div class="pt-hero"><h1>Find your new best friend</h1><p>Every pet comes vaccinated, house trained, and slightly judgemental.</p></div>
      <div class="pt-grid">
        <div class="pt-card">${pet('#c98a5a', '#8a5a3a', 'dog')}<b>Biscuit</b><small>3 years · eats socks</small><span data-btn class="pt-adopt">Adopt</span></div>
        <div class="pt-card">${pet('#b9b0c4', '#8a809a', 'cat')}<b>Professor Whiskers</b><small>11 years · has opinions</small><span data-btn class="pt-adopt">Adopt</span></div>
        <div class="pt-card">${pet('#fff8f0', '#ffb3d9', 'bun')}<b>Sir Hops</b><small>1 year · will chew cables</small><span data-btn class="pt-adopt">Adopt</span></div>
        <div class="pt-card">${pet('#ffb347', '#ff7f3f', 'cat')}<b>Lasagna</b><small>6 years · orange, enough said</small><span data-btn class="pt-adopt">Adopt</span></div>
        <div class="pt-card">${pet('#4a2c22', '#1a1226', 'dog')}<b>Gerald II</b><small>2 years · not the bread</small><span data-btn class="pt-adopt">Adopt</span></div>
        <div class="pt-card">${pet('#e2dcea', '#b9b0c4', 'bun')}<b>Cloud</b><small>4 years · professional loaf</small><span data-btn class="pt-adopt">Adopt</span></div>
      </div>
      <div class="pt-banner">Adoption fees waived this weekend. Furniture damage not included.</div>
      <div class="pt-foot">No pixels were harmed in the making of this page · yet</div>
      </div>`
    },
    {
      id: 'crypto', emoji: '📉', title: 'CoinFlop: The Only Way Is Down', site: 'CoinFlop Exchange', theme: '#ffe066',
      blurb: 'A market in free fall. Help it along.',
      html: `<div class="wp p-crypto">${chrome('coinflop.example/trade/FLOP', 'FLOP / USD', '📉')}
      <div class="cr-top"><span class="cr-logo">CoinFlop</span><span>Wallet: 0.0003 FLOP</span></div>
      <div class="cr-tick"><span class="dn">FLOP -88%</span><span class="dn">DOGE2 -41%</span><span class="up">ROCK +2%</span><span class="dn">MOON -99%</span><span class="up">SOUP +12%</span></div>
      <div class="cr-main"><h1>FLOP / USD</h1><div class="cr-big">$0.0004</div><div class="cr-chart">${chart}</div>
      <div class="cr-btns"><span class="cr-buy">Buy the dip</span><span class="cr-sell">Sell everything</span></div></div>
      <div class="cr-book"><span class="a">ASK 0.0005 x 9,000,000</span><span class="b">BID 0.0001 x 3</span><span class="a">ASK 0.0006 x 4,200,000</span><span class="b">BID 0.00009 x 1</span><span class="a">ASK 0.0009 x 777,777</span><span class="b">BID a sandwich</span></div>
      <div class="cr-warn">Warning: past performance is not indicative of future performance. Future performance is also not indicative of anything.</div>
      <div class="cr-foot">CoinFlop is not a bank · or a coin · or, legally, a company</div>
      </div>`
    }
  ];

  WTPx.pages.push(...extra);
  WTPx.css += css;
})();
