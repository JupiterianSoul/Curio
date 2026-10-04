(function () {
  const WTPx = window.WTP;
  const chrome = (url, tab, icon) => `
  <div class="wc">
    <div class="wc-tabs"><span class="wc-dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span><span class="wc-tab">${icon} ${tab}</span><span class="wc-plus">+</span></div>
    <div class="wc-bar"><span class="wc-nav">&#8592; &#8594; &#8635;</span><span class="wc-url">&#128274; ${url}</span><span class="wc-menu">&#8942;</span></div>
  </div>`;

  const cab = (col, title, score) => `<div class="ar-cab" style="background:${col}"><div class="ar-marq">${title}</div><div class="ar-screen"><svg viewBox="0 0 60 44" width="60" height="44" xmlns="http://www.w3.org/2000/svg"><rect width="60" height="44" fill="#0b0b1a"/><rect x="8" y="30" width="44" height="3" fill="#4aa3ff"/><circle cx="20" cy="18" r="5" fill="#ffe066"/><rect x="36" y="12" width="8" height="8" fill="#ff5fa2"/><rect x="28" y="6" width="2" height="2" fill="#fff"/></svg></div><div class="ar-ctrl"><i></i><b></b><b></b></div><div class="ar-hs">HI ${score}</div></div>`;
  const tower = `<svg viewBox="0 0 120 520" width="120" height="520" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="520" fill="#bfe3f5"/>
    <rect x="20" y="40" width="80" height="480" fill="#5c6f86"/>
    <rect x="30" y="20" width="60" height="22" fill="#4a5b70"/>
    <rect x="56" y="0" width="8" height="22" fill="#2b3442"/>
    ${Array.from({ length: 22 }, (_, r) => Array.from({ length: 4 }, (_, c) => `<rect x="${28 + c * 18}" y="${52 + r * 21}" width="12" height="13" fill="${(r * 5 + c * 3) % 7 === 0 ? '#ffe066' : '#9fd3ec'}"/>`).join('')).join('')}
    <rect x="44" y="490" width="32" height="30" fill="#2b3442"/>
  </svg>`;
  const plan = `<svg viewBox="0 0 220 140" width="220" height="140" xmlns="http://www.w3.org/2000/svg"><rect width="220" height="140" fill="#fbf7ef"/><path d="M10 10 H210 V130 H10 Z M90 10 V80 M90 100 V130 M10 70 H60 M80 70 H90 M150 10 V60 M150 80 V130 M150 70 H210" stroke="#2b3442" stroke-width="5" fill="none"/><text x="40" y="45" font-size="12" font-family="Arial" fill="#5c6f86">Bed</text><text x="110" y="45" font-size="12" font-family="Arial" fill="#5c6f86">Loft</text><text x="170" y="110" font-size="12" font-family="Arial" fill="#5c6f86">Moat</text></svg>`;
  const art = (a, b, c, shape) => `<div class="mz-frame"><svg viewBox="0 0 100 80" width="100" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="80" fill="${a}"/>${shape === 0 ? `<circle cx="50" cy="40" r="22" fill="${b}"/><rect x="20" y="58" width="60" height="10" fill="${c}"/>` : shape === 1 ? `<path d="M0 60 L30 25 L55 50 L75 30 L100 60 V80 H0Z" fill="${b}"/><circle cx="78" cy="16" r="9" fill="${c}"/>` : shape === 2 ? `<rect x="15" y="15" width="30" height="30" fill="${b}"/><rect x="50" y="35" width="35" height="30" fill="${c}"/><rect x="30" y="50" width="12" height="20" fill="#1a1226"/>` : `<path d="M50 8 L62 34 L92 36 L68 54 L76 76 L50 62 L24 76 L32 54 L8 36 L38 34Z" fill="${b}"/><circle cx="50" cy="44" r="6" fill="${c}"/>`}</svg></div>`;
  const rocket = `<svg viewBox="0 0 90 300" width="90" height="300" xmlns="http://www.w3.org/2000/svg">
    <path d="M45 0 C62 30 66 60 66 100 V230 H24 V100 C24 60 28 30 45 0Z" fill="#f4f6fa"/>
    <path d="M45 0 C55 18 60 34 62 50 H28 C30 34 35 18 45 0Z" fill="#e8484f"/>
    <circle cx="45" cy="92" r="11" fill="#4aa3ff" stroke="#2b3442" stroke-width="4"/>
    <rect x="24" y="150" width="42" height="10" fill="#2b3442"/>
    <text x="45" y="200" font-size="14" font-family="Arial" font-weight="700" text-anchor="middle" fill="#2b3442">WTP</text>
    <path d="M24 190 L4 250 H24Z M66 190 L86 250 H66Z" fill="#e8484f"/>
    <rect x="30" y="230" width="30" height="16" fill="#5c6f86"/>
    <path d="M32 246 L45 296 L58 246Z" fill="#ffb347"/>
  </svg>`;
  const car = (body, roof, label) => `<svg viewBox="0 0 160 70" width="160" height="70" xmlns="http://www.w3.org/2000/svg"><rect width="160" height="70" fill="#eef6ff"/><rect x="0" y="58" width="160" height="12" fill="#9aa3b5"/><path d="M14 46 Q16 30 40 28 L58 14 H106 L126 28 Q148 30 148 46 V52 H14Z" fill="${body}"/><path d="M64 18 H102 L116 28 H54Z" fill="${roof}"/><rect x="18" y="38" width="10" height="5" fill="#ffe066"/><circle cx="46" cy="52" r="10" fill="#1a1226"/><circle cx="46" cy="52" r="4" fill="#b9b0c4"/><circle cx="118" cy="52" r="10" fill="#1a1226"/><circle cx="118" cy="52" r="4" fill="#b9b0c4"/><text x="80" y="44" font-size="9" font-family="Arial" font-weight="700" text-anchor="middle" fill="#fff">${label}</text></svg>`;

  const css = `
  .p-arcade { background: #120b24; color: #fff; }
  .ar-top { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: #2a1650; border-bottom: 4px solid #ff5fa2; }
  .ar-logo { font-family: "Courier New", monospace; font-weight: 700; font-size: 26px; color: #ffe066; letter-spacing: 2px; }
  .ar-coin { background: #ffe066; color: #2a1650; font-weight: 700; padding: 6px 14px; border-radius: 6px; }
  .ar-hero { text-align: center; padding: 26px 16px 12px; }
  .ar-hero h1 { font-family: "Courier New", monospace; font-size: 34px; color: #8fe3ff; }
  .ar-hero p { color: #d07bff; margin: 6px 0 0; }
  .ar-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 22px 18px; padding: 18px 12px 30px; align-items: flex-end; }
  .ar-cab { width: 120px; height: 210px; border-radius: 10px 10px 4px 4px; padding: 8px; display: flex; flex-direction: column; align-items: center; gap: 8px; border: 4px solid #1a1226; }
  .ar-cab:nth-child(2n) { height: 250px; }
  .ar-marq { background: #1a1226; color: #ffe066; font-family: "Courier New", monospace; font-weight: 700; font-size: 13px; width: 100%; text-align: center; padding: 4px 0; }
  .ar-screen { background: #000; padding: 6px; border: 3px solid #1a1226; }
  .ar-ctrl { display: flex; gap: 8px; align-items: center; background: #1a1226; padding: 6px 10px; border-radius: 6px; }
  .ar-ctrl i { width: 12px; height: 12px; border-radius: 50%; background: #e8484f; display: block; }
  .ar-ctrl b { width: 10px; height: 10px; border-radius: 50%; background: #6fcf5a; display: block; }
  .ar-hs { font-family: "Courier New", monospace; font-size: 12px; color: #1a1226; font-weight: 700; margin-top: auto; }
  .ar-scores { margin: 0 24px 24px; background: #000; border: 4px solid #4aa3ff; padding: 14px 18px; font-family: "Courier New", monospace; }
  .ar-scores h2 { color: #ff5fa2; font-size: 20px; margin-bottom: 8px; }
  .ar-scores div { display: flex; justify-content: space-between; color: #fff; padding: 2px 0; }
  .ar-scores div:nth-child(2) { color: #ffe066; }
  .ar-btns { display: flex; justify-content: center; gap: 14px; padding: 0 0 26px; }
  .ar-btn { background: #ff5fa2; color: #fff; font-weight: 700; padding: 12px 22px; border-radius: 8px; border-bottom: 5px solid #a8303f; }
  .ar-btn.alt { background: #4aa3ff; border-bottom-color: #2f5bb7; }
  .ar-foot { text-align: center; color: #8a809a; font-size: 12px; padding: 12px; border-top: 2px dashed #3f3550; }

  .p-realty { background: #f6f4ee; color: #2b3442; }
  .re-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 22px; background: #fff; border-bottom: 1px solid #ddd6c6; }
  .re-logo { font-family: Georgia, serif; font-size: 24px; font-weight: 700; color: #b8862b; }
  .re-wrap { display: flex; gap: 22px; padding: 22px; }
  .nw .re-wrap { flex-direction: column; }
  .re-tower { flex: 0 0 120px; }
  .re-main { flex: 1; }
  .re-main h1 { font-family: Georgia, serif; font-size: 30px; line-height: 1.15; }
  .re-price { font-size: 28px; font-weight: 700; color: #b8862b; margin: 10px 0; }
  .re-facts { display: flex; flex-wrap: wrap; gap: 10px; margin: 12px 0 18px; }
  .re-facts span { background: #fff; border: 1px solid #ddd6c6; padding: 8px 12px; border-radius: 8px; font-size: 13px; }
  .re-plan { background: #fff; border: 1px solid #ddd6c6; padding: 10px; display: inline-block; margin-bottom: 16px; }
  .re-desc p { margin-bottom: 10px; }
  .re-agent { display: flex; gap: 12px; align-items: center; background: #2b3442; color: #fff; padding: 14px; border-radius: 10px; margin: 16px 0; }
  .re-av { width: 46px; height: 46px; border-radius: 50%; background: #ffb347; }
  .re-btn { display: inline-block; background: #b8862b; color: #fff; padding: 12px 20px; border-radius: 8px; font-weight: 700; margin-right: 10px; }
  .re-floors { margin: 6px 22px 26px; }
  .re-fl { display: flex; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid #ddd6c6; background: #fff; }
  .re-fl:nth-child(2n) { background: #fbf9f3; }
  .re-foot { text-align: center; font-size: 12px; color: #8a8270; padding: 16px; }

  .p-museum { background: #efe6d6; color: #3a2a1a; }
  .mz-top { text-align: center; padding: 20px 10px 14px; background: #d9cbb0; border-bottom: 6px double #8a6b45; }
  .mz-top h1 { font-family: Georgia, serif; font-size: 34px; letter-spacing: 3px; }
  .mz-top p { font-style: italic; color: #6b5535; }
  .mz-hall { display: flex; gap: 18px; padding: 24px 16px; justify-content: center; align-items: flex-start; flex-wrap: wrap; }
  .mz-col { width: 26px; height: 300px; background: #f7f1e3; border: 3px solid #c9b996; border-radius: 4px; }
  .nw .mz-col { display: none; }
  .mz-wall { display: grid; grid-template-columns: repeat(2, auto); gap: 24px 26px; }
  .mz-frame { padding: 10px; background: #8a5a3a; border: 4px solid #4a2c22; box-shadow: inset 0 0 0 3px #c98a5a; }
  .mz-card { font-family: Georgia, serif; font-size: 12px; color: #6b5535; text-align: center; margin-top: 6px; }
  .mz-piece { display: flex; flex-direction: column; align-items: center; }
  .mz-info { margin: 0 26px 18px; background: #fffaf0; border: 2px solid #c9b996; padding: 16px; font-family: Georgia, serif; }
  .mz-info h2 { font-size: 22px; margin-bottom: 8px; }
  .mz-btns { display: flex; justify-content: center; gap: 12px; padding-bottom: 20px; }
  .mz-btn { background: #4a2c22; color: #f7f1e3; padding: 11px 18px; font-family: Georgia, serif; border-radius: 4px; }
  .mz-rope { height: 10px; margin: 0 30px 24px; background: repeating-linear-gradient(90deg, #a8303f 0 18px, #5e1f2e 18px 22px); border-radius: 6px; }
  .mz-foot { text-align: center; font-size: 12px; padding: 14px; color: #8a6b45; border-top: 1px solid #c9b996; }

  .p-launch { background: #0d1424; color: #d9e6ff; }
  .lc-top { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; background: #16213a; border-bottom: 3px solid #4aa3ff; font-family: "Courier New", monospace; }
  .lc-top b { color: #8fe3ff; font-size: 20px; }
  .lc-wrap { display: flex; gap: 20px; padding: 20px; align-items: flex-start; }
  .nw .lc-wrap { gap: 10px; padding: 12px; }
  .lc-pad { flex: 0 0 auto; display: flex; flex-direction: column; align-items: center; }
  .lc-rocket { padding: 0 4px; }
  .lc-gantry { width: 130px; height: 26px; background: repeating-linear-gradient(90deg, #5c6f86 0 8px, #2b3442 8px 12px); }
  .lc-side { flex: 1; display: flex; flex-direction: column; gap: 14px; }
  .lc-count { font-family: "Courier New", monospace; font-size: 46px; font-weight: 700; color: #ffe066; text-align: center; background: #000; border: 3px solid #3f3550; padding: 8px; }
  .nw .lc-count { font-size: 30px; }
  .lc-panel { background: #16213a; border: 2px solid #2f5bb7; padding: 12px; font-family: "Courier New", monospace; font-size: 13px; }
  .lc-panel div { display: flex; justify-content: space-between; padding: 2px 0; }
  .lc-ok { color: #6fcf5a; }
  .lc-bad { color: #e8484f; }
  .lc-btn { background: #e8484f; color: #fff; font-weight: 700; text-align: center; padding: 14px; border-radius: 10px; border-bottom: 6px solid #5e1f2e; font-size: 18px; }
  .lc-log { margin: 0 20px 22px; background: #000; color: #6fcf5a; font-family: "Courier New", monospace; font-size: 12px; padding: 12px; border: 2px solid #2f8a4f; }
  .lc-foot { text-align: center; font-size: 12px; color: #5c6f86; padding: 12px; }

  .p-cars { background: #fff; color: #1d2b5e; }
  .ca-top { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; background: #e8484f; color: #fff; }
  .ca-logo { font-weight: 800; font-size: 26px; font-style: italic; }
  .ca-search { background: #fff; color: #555; padding: 6px 14px; border-radius: 999px; font-size: 13px; }
  .ca-hero { padding: 18px 20px 6px; }
  .ca-hero h1 { font-size: 28px; }
  .ca-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 14px 20px; }
  .nw .ca-grid { grid-template-columns: 1fr; }
  .ca-ad { border: 2px solid #dfe3e8; border-radius: 10px; padding: 10px; background: #fafbfd; }
  .ca-ad b { display: block; font-size: 16px; margin-top: 6px; }
  .ca-ad small { color: #e8484f; font-weight: 700; font-size: 16px; }
  .ca-ad p { font-size: 12px; color: #555; margin: 4px 0 8px; }
  .ca-btn { display: inline-block; background: #1d2b5e; color: #fff; padding: 7px 14px; border-radius: 6px; font-size: 13px; }
  .ca-lot { margin: 10px 20px 24px; background: #9aa3b5; height: 70px; border-radius: 6px; background-image: repeating-linear-gradient(90deg, #9aa3b5 0 40px, #fff 40px 44px); }
  .ca-foot { text-align: center; font-size: 12px; color: #8a809a; padding: 12px; border-top: 1px solid #dfe3e8; }
  `;

  const extra = [
    {
      id: 'arcade', emoji: '🕹️', title: 'PixelPlex: Insert Coin to Continue', site: 'PixelPlex Arcade', theme: '#ff5fa2',
      blurb: 'Cabinets, high scores and a lot of breakable plastic.',
      html: `<div class="wp p-arcade">${chrome('pixelplex.example/arcade', 'PixelPlex Arcade', '🕹️')}
      <div class="ar-top"><span class="ar-logo">PIXELPLEX</span><span class="ar-coin">CREDITS: 0</span></div>
      <div class="ar-hero"><h1>INSERT COIN</h1><p>Fourteen cabinets. One working joystick. Zero refunds.</p></div>
      <div class="ar-row">${cab('#ff7f3f', 'BLASTEROIDS', '99,950')}${cab('#4aa3ff', 'PAC-PAGE', '12,040')}${cab('#6fcf5a', 'STREET WRECKER', '88,800')}${cab('#d07bff', 'GALAGAGA', '40,410')}</div>
      <div class="ar-scores"><h2>HALL OF FAME</h2><div><span>1. AAA</span><span>999,999</span></div><div><span>2. WRK</span><span>404,404</span></div><div><span>3. DAV</span><span>120,000</span></div><div><span>4. ???</span><span>3</span></div></div>
      <div class="ar-btns"><span class="ar-btn">Play now</span><span class="ar-btn alt">Buy tokens</span></div>
      <div class="ar-row">${cab('#ffe066', 'TETRIX', '31,337')}${cab('#e8484f', 'DONKEY PONG', '9,001')}${cab('#20a39e', 'DIG DUG DEEP', '76,000')}</div>
      <div class="ar-foot">Please do not shake the claw machine · Tokens have no cash value · Neither do you</div>
      </div>`
    },
    {
      id: 'realty', emoji: '🏙️', title: 'SkyHigh Realty: Penthouse, 112th Floor', site: 'SkyHigh Realty', theme: '#b8862b',
      blurb: 'A very tall listing. Mind the stairs.',
      html: `<div class="wp p-realty">${chrome('skyhigh.example/listing/112', 'Penthouse 112F', '🏙️')}
      <div class="re-top"><span class="re-logo">SkyHigh Realty</span><span>Buy · Rent · Fall</span></div>
      <div class="re-wrap"><div class="re-tower">${tower}</div>
      <div class="re-main"><h1>Luxury penthouse with a view of other penthouses</h1><div class="re-price">$41,000,000</div>
      <div class="re-facts"><span>4 bed</span><span>6 bath</span><span>1 moat</span><span>112th floor</span><span>Elevator: soon</span></div>
      <div class="re-plan">${plan}</div>
      <div class="re-desc"><p>Wake up above the clouds. Literally: the clouds are below you and the elevator is under construction until 2031. Enjoy floor-to-ceiling windows on every side, including the floor.</p><p>The open-plan loft features hand-scraped oak, a sunken conversation pit, and a second, deeper conversation pit for when the first one gets awkward.</p><p>Comes with a reserved parking space on the ground, which is a nine hour walk. Pets welcome. Pigeons included.</p></div>
      <div class="re-agent"><span class="re-av"></span><div><b>Brenda Skyward</b><br>Top agent 3 years running. Mostly running up stairs.</div></div>
      <span class="re-btn">Schedule a tour</span><span class="re-btn">Make an offer</span></div></div>
      <div class="re-floors">${['112 Penthouse', '111 Gym nobody uses', '110 Indoor pool (empty)', '109 Storage for more storage', '108 Floor of mirrors', '107 Pigeon sanctuary', '106 Executive lounge', '105 Mystery floor'].map((f) => `<div class="re-fl"><span>${f}</span><span>View</span></div>`).join('')}</div>
      <div class="re-foot">Listing photos are artist impressions · The artist was afraid of heights</div>
      </div>`
    },
    {
      id: 'museum', emoji: '🖼️', title: 'Museum of Internet Art: Main Hall', site: 'Museum of Internet Art', theme: '#8a5a3a',
      blurb: 'Priceless pixel art. Please do not touch. Please.',
      html: `<div class="wp p-museum">${chrome('moia.example/hall', 'Main Hall', '🖼️')}
      <div class="mz-top"><h1>MUSEUM OF INTERNET ART</h1><p>Est. 1997 · Free entry · Expensive exit</p></div>
      <div class="mz-hall"><div class="mz-col"></div>
      <div class="mz-wall">
        <div class="mz-piece">${art('#ffe066', '#e8484f', '#2f5bb7', 0)}<div class="mz-card">Sunset.jpg (2003)</div></div>
        <div class="mz-piece">${art('#bfe3f5', '#2f8a4f', '#ffe066', 1)}<div class="mz-card">Default Wallpaper</div></div>
        <div class="mz-piece">${art('#fff8f0', '#ff5fa2', '#4aa3ff', 2)}<div class="mz-card">Untitled Layout #4</div></div>
        <div class="mz-piece">${art('#1a1226', '#ffe066', '#ff7f3f', 3)}<div class="mz-card">Rating: 5 Stars</div></div>
        <div class="mz-piece">${art('#d07bff', '#fff8f0', '#1a1226', 0)}<div class="mz-card">Loading Icon at Rest</div></div>
        <div class="mz-piece">${art('#6fcf5a', '#20a39e', '#fff8f0', 1)}<div class="mz-card">Hills, Uncompressed</div></div>
      </div><div class="mz-col"></div></div>
      <div class="mz-rope"></div>
      <div class="mz-info"><h2>About the collection</h2><p>Our permanent collection holds over two thousand GIFs, four hundred unfinished personal homepages and the very first spinning globe. Every piece is irreplaceable. We cannot stress this enough. There are no backups.</p></div>
      <div class="mz-btns"><span class="mz-btn">Donate</span><span class="mz-btn">Gift shop</span><span class="mz-btn">Audio guide</span></div>
      <div class="mz-foot">Flash photography is forbidden · So is whatever you are about to do</div>
      </div>`
    },
    {
      id: 'launch', emoji: '🚀', title: 'Mission Control: Launch Countdown', site: 'Space Agency', theme: '#4aa3ff',
      blurb: 'A rocket on the pad. Hit it and see what happens.',
      html: `<div class="wp p-launch">${chrome('mission.space.example/live', 'LIVE: Launch', '🚀')}
      <div class="lc-top"><b>MISSION CONTROL</b><span>MISSION: WTP-1</span></div>
      <div class="lc-wrap"><div class="lc-pad"><div class="lc-rocket">${rocket}</div><div class="lc-gantry"></div></div>
      <div class="lc-side"><div class="lc-count">T-00:10</div>
      <div class="lc-panel"><div><span>FUEL</span><span class="lc-ok">GO</span></div><div><span>GUIDANCE</span><span class="lc-ok">GO</span></div><div><span>WEATHER</span><span class="lc-ok">GO</span></div><div><span>INTERN</span><span class="lc-bad">NO GO</span></div><div><span>SNACKS</span><span class="lc-ok">GO</span></div></div>
      <div class="lc-panel"><div><span>ALTITUDE</span><span>0 km</span></div><div><span>VELOCITY</span><span>0 km/h</span></div><div><span>MOOD</span><span>tense</span></div></div>
      <div class="lc-btn">LAUNCH</div><div class="lc-btn" style="background:#2f5bb7;border-bottom-color:#1d2b5e">Abort</div></div></div>
      <div class="lc-log">&gt; T-60 all stations report ready<br>&gt; T-45 someone opened a page about stairs<br>&gt; T-30 the page is being destroyed<br>&gt; T-20 please stop destroying the page<br>&gt; T-10 hold, hold, HOLD</div>
      <div class="lc-foot">Live stream may contain explosions · All explosions are scheduled</div>
      </div>`
    },
    {
      id: 'cars', emoji: '🚗', title: 'AutoDeals: Used Cars, Barely Driven', site: 'AutoDeals', theme: '#e8484f',
      blurb: 'Every ad has a car in it. Every car wants out.',
      html: `<div class="wp p-cars">${chrome('autodeals.example/used', 'AutoDeals', '🚗')}
      <div class="ca-top"><span class="ca-logo">AutoDeals!</span><span class="ca-search">Search 4 cars</span></div>
      <div class="ca-hero"><h1>Used cars. Barely driven. Mostly.</h1><p>Hit any car to test drive it. Test drives are final.</p></div>
      <div class="ca-grid">
        <div class="ca-ad"><div class="ca-car">${car('#e8484f', '#a8303f', 'ZOOM')}</div><b>2009 Hatchback Deluxe</b><small>$3,999</small><p>One owner. The owner was a raccoon. Smells fine now.</p><span class="ca-btn">Contact seller</span></div>
        <div class="ca-ad"><div class="ca-car">${car('#4aa3ff', '#2f5bb7', 'TURBO')}</div><b>Sport Coupe, Very Blue</b><small>$12,500</small><p>Goes fast. Stops eventually. Price includes the dent.</p><span class="ca-btn">Contact seller</span></div>
        <div class="ca-ad"><div class="ca-car">${car('#6fcf5a', '#2f8a4f', 'ECO')}</div><b>Eco Box 3000</b><small>$800</small><p>Runs on hope. Range: the end of the driveway.</p><span class="ca-btn">Buy now</span></div>
        <div class="ca-ad"><div class="ca-car">${car('#ffe066', '#ffb347', 'TAXI')}</div><b>Former Taxi</b><small>$2,200</small><p>Meter still running. You owe $41,000.</p><span class="ca-btn">Buy now</span></div>
      </div>
      <div class="ca-lot"></div>
      <div class="ca-foot">AutoDeals is not responsible for cars leaving the page · All sales final</div>
      </div>`
    }
  ];

  WTPx.pages.push(...extra);
  WTPx.css += css;
})();
