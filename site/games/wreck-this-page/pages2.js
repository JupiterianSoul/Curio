(function () {
  const W = window.WTP;
  const chrome = (url, tab, icon) => `
  <div class="wc">
    <div class="wc-tabs"><span class="wc-dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span><span class="wc-tab">${icon} ${tab}</span><span class="wc-plus">+</span></div>
    <div class="wc-bar"><span class="wc-nav">&#8592; &#8594; &#8635;</span><span class="wc-url">&#128274; ${url}</span><span class="wc-menu">&#8942;</span></div>
  </div>`;

  const lasagnaSvg = `<svg viewBox="0 0 320 170" width="320" height="170" xmlns="http://www.w3.org/2000/svg">
    <rect width="320" height="170" fill="#f3e2c7"/>
    <path d="M0 0h320v20H0zM0 40h320v20H0zM0 80h320v20H0zM0 120h320v20H0z" fill="#ead3b0"/>
    <ellipse cx="160" cy="138" rx="140" ry="22" fill="#d9d1c4"/>
    <ellipse cx="160" cy="132" rx="128" ry="18" fill="#fffaf2"/>
    <path d="M80 70 l150 -14 l20 50 l-150 20 z" fill="#e8b04a"/>
    <path d="M80 70 l150 -14 l3 10 l-150 14 z" fill="#c4372b"/>
    <path d="M83 80 l150 -14 l3 9 l-150 14 z" fill="#f6efd8"/>
    <path d="M86 89 l150 -14 l3 10 l-150 14 z" fill="#a8452b"/>
    <path d="M89 99 l150 -14 l3 9 l-150 14 z" fill="#f2d67a"/>
    <path d="M92 108 l150 -14 l8 12 l-150 20 z" fill="#c4372b"/>
    <path d="M80 70 l150 -14 l-10 -6 l-146 12 z" fill="#d9542e"/>
    <circle cx="120" cy="64" r="4" fill="#3e8a3a"/><circle cx="170" cy="58" r="4" fill="#3e8a3a"/><circle cx="205" cy="57" r="3" fill="#3e8a3a"/>
    <path d="M250 30 q8 -14 0 -26 M262 32 q8 -14 0 -26 M238 32 q8 -14 0 -26" stroke="#c8b9a3" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`;

  const sunSvg = `<svg viewBox="0 0 200 140" width="200" height="140" xmlns="http://www.w3.org/2000/svg">
    <g stroke="#ffd34d" stroke-width="8" stroke-linecap="round"><path d="M70 10v14M70 106v14M15 65h14M111 65h14M31 26l10 10M99 94l10 10M31 104l10 -10M99 36l10 -10"/></g>
    <circle cx="70" cy="65" r="30" fill="#ffd34d"/>
    <circle cx="61" cy="60" r="3.5" fill="#6b4a12"/><circle cx="80" cy="60" r="3.5" fill="#6b4a12"/>
    <path d="M58 74 q12 8 24 0" stroke="#6b4a12" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M96 116 h84 a20 20 0 0 0 -8 -38 a28 28 0 0 0 -52 -6 a22 22 0 0 0 -24 44z" fill="#ffffff"/>
    <path d="M112 100 q4 -4 8 0 M138 100 q4 -4 8 0" stroke="#7d8aa6" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M124 108 q5 -3 10 0" stroke="#7d8aa6" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;

  const videoSvg = `<svg viewBox="0 0 640 300" width="640" height="300" xmlns="http://www.w3.org/2000/svg">
    <rect width="640" height="300" fill="#2b2140"/>
    <rect y="210" width="640" height="90" fill="#6a4a3a"/>
    <path d="M0 210h640" stroke="#4d3428" stroke-width="6"/>
    <rect x="430" y="60" width="150" height="110" rx="6" fill="#3d3260"/>
    <rect x="440" y="70" width="130" height="90" fill="#9fd3ec"/>
    <circle cx="530" cy="98" r="14" fill="#fff6c8"/>
    <path d="M440 160 l40 -30 l30 20 l25 -18 l35 28z" fill="#5fa86a"/>
    <rect x="80" y="150" width="210" height="64" rx="10" fill="#c46b4a"/>
    <rect x="70" y="140" width="230" height="20" rx="8" fill="#d98a62"/>
    <ellipse cx="190" cy="132" rx="58" ry="30" fill="#f29b4a"/>
    <path d="M144 112 l-8 -26 l26 14z M216 100 l20 -16 l-2 30z" fill="#f29b4a"/>
    <path d="M147 106 l-4 -12 l12 7z M220 99 l8 -7 l-1 13z" fill="#ffc9a8"/>
    <path d="M168 126 q6 -6 12 0 M202 126 q6 -6 12 0" stroke="#3a2418" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M186 138 l4 4 l4 -4z" fill="#d45a6a"/>
    <path d="M150 150 q-30 10 -60 -6" stroke="#f29b4a" stroke-width="12" fill="none" stroke-linecap="round"/>
    <path d="M220 120 l20 -4 l-20 12z" fill="#f2c94a"/>
    <path d="M250 110 q8 -10 20 -6 M256 96 q10 -8 22 -2" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
    <circle cx="320" cy="150" r="44" fill="#000000" opacity=".45"/>
    <path d="M306 128 l34 22 l-34 22z" fill="#ffffff"/>
  </svg>`;

  const constructionSvg = `<svg viewBox="0 0 220 60" width="220" height="60" xmlns="http://www.w3.org/2000/svg">
    <rect width="220" height="60" fill="#ffd400"/>
    <path d="M0 0h20L0 20zM30 0h20L0 50v-20zM60 0h20L20 60H0zM90 0h20L50 60H30zM120 0h20L80 60H60zM150 0h20l-60 60H90zM180 0h20l-60 60h-20zM210 0h10v10l-50 50h-20zM220 30v20l-10 10h-20z" fill="#1a1a1a"/>
    <rect x="44" y="16" width="132" height="28" fill="#ffd400" stroke="#1a1a1a" stroke-width="3"/>
    <path d="M60 36l10 -14l10 14z M150 22h14v14h-14z" fill="#e8401c"/>
    <path d="M90 30h44" stroke="#1a1a1a" stroke-width="5" stroke-linecap="round"/>
  </svg>`;

  const css = `
  .p-feed { background: #e9eef5; color: #0f1419; font-family: "Liberation Sans", Arial, sans-serif; }
  .f-top { display: flex; align-items: center; gap: 14px; background: #1d9bf0; color: #fff; padding: 12px 22px; }
  .f-logo { font-weight: 900; font-size: 24px; letter-spacing: -0.5px; }
  .f-srch { flex: 1; background: #fff; color: #536471; border-radius: 999px; padding: 7px 14px; font-size: 13px; }
  .f-me { width: 34px; height: 34px; border-radius: 50%; background: #ffd34d; display: flex; align-items: center; justify-content: center; font-size: 20px; }
  .f-wrap { display: flex; gap: 16px; padding: 16px; }
  .nw .f-wrap { display: block; padding: 10px; }
  .f-main { flex: 1; min-width: 0; }
  .f-compose { background: #fff; border-radius: 14px; padding: 14px; margin-bottom: 12px; display: flex; gap: 10px; align-items: center; color: #536471; font-size: 15px; border: 1px solid #cfd9e3; }
  .f-compose b { margin-left: auto; background: #1d9bf0; color: #fff; padding: 6px 16px; border-radius: 999px; font-size: 14px; }
  .f-post { background: #fff; border: 1px solid #cfd9e3; border-radius: 14px; padding: 14px; margin-bottom: 12px; display: flex; gap: 12px; }
  .f-av { width: 44px; height: 44px; flex: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .f-body { min-width: 0; flex: 1; }
  .f-name { font-size: 15px; }
  .f-name b { margin-right: 4px; }
  .f-name span { color: #536471; }
  .f-text { font-size: 15px; line-height: 1.45; margin: 4px 0 10px; }
  .f-tag { color: #1d9bf0; }
  .f-acts { display: flex; gap: 26px; color: #536471; font-size: 13px; }
  .f-acts .h { color: #f91880; font-weight: 700; }
  .f-card { border: 1px solid #cfd9e3; border-radius: 12px; overflow: hidden; margin-bottom: 10px; }
  .f-card-i { background: #ffe8a8; height: 120px; display: flex; align-items: center; justify-content: center; font-size: 64px; }
  .f-card-t { padding: 8px 12px; font-size: 13px; color: #536471; }
  .f-card-t b { display: block; color: #0f1419; font-size: 14px; }
  .f-poll div { position: relative; border-radius: 6px; padding: 6px 10px; margin-bottom: 6px; font-size: 14px; background: #eff3f4; }
  .f-poll div i { position: absolute; left: 0; top: 0; bottom: 0; background: #b9e0fb; border-radius: 6px; }
  .f-poll div span { position: relative; }
  .f-side { width: 220px; flex: none; }
  .nw .f-side { width: auto; }
  .f-box { background: #fff; border: 1px solid #cfd9e3; border-radius: 14px; padding: 12px 14px; margin-bottom: 12px; font-size: 14px; }
  .f-box h3 { font-size: 18px; margin-bottom: 8px; }
  .f-trend { padding: 6px 0; border-top: 1px solid #eff3f4; }
  .f-trend small { display: block; color: #536471; font-size: 12px; }
  .f-trend b { display: block; }
  .f-foot { text-align: center; color: #536471; font-size: 12px; padding: 4px 16px 20px; }

  .p-recipe { background: #fffaf2; color: #2e2a26; font-family: Georgia, "Liberation Serif", serif; }
  .r-top { display: flex; justify-content: space-between; align-items: center; padding: 14px 26px; border-bottom: 2px solid #2e2a26; font-family: "Liberation Sans", Arial, sans-serif; }
  .r-logo { font-family: Georgia, "Liberation Serif", serif; font-size: 26px; font-style: italic; font-weight: 700; color: #c4372b; }
  .r-nav { display: flex; gap: 16px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
  .nw .r-nav { display: none; }
  .r-body { padding: 22px 40px 10px; }
  .nw .r-body { padding: 16px 18px 6px; }
  .p-recipe h1 { font-size: 40px; line-height: 1.1; margin-bottom: 10px; }
  .nw.p-recipe h1 { font-size: 30px; }
  .r-meta { display: flex; gap: 14px; flex-wrap: wrap; font-family: "Liberation Sans", Arial, sans-serif; font-size: 13px; color: #6d655c; margin-bottom: 14px; }
  .r-meta span { color: #e2a400; }
  .r-jump { display: inline-block; background: #c4372b; color: #fff; padding: 8px 18px; border-radius: 999px; font-family: "Liberation Sans", Arial, sans-serif; font-weight: 700; font-size: 14px; margin-bottom: 18px; }
  .r-fig svg { width: 100%; height: auto; display: block; border-radius: 10px; }
  .r-cap { font-size: 13px; font-style: italic; color: #6d655c; margin: 6px 0 18px; }
  .p-recipe p { font-size: 17px; line-height: 1.65; }
  .r-ad { background: #e9f3ff; border: 2px solid #8bb6e8; border-radius: 10px; padding: 12px 16px; margin: 4px 0 20px; font-family: "Liberation Sans", Arial, sans-serif; display: flex; gap: 12px; align-items: center; }
  .r-ad small { display: block; font-size: 10px; letter-spacing: 2px; color: #5a7aa0; }
  .r-ad-e { font-size: 38px; }
  .r-ad b { font-size: 17px; }
  .r-card { border: 3px solid #2e2a26; border-radius: 14px; padding: 18px 22px; margin: 10px 0 22px; background: #fff; }
  .r-card h2 { font-size: 26px; margin-bottom: 4px; }
  .r-card-m { font-family: "Liberation Sans", Arial, sans-serif; font-size: 13px; color: #6d655c; margin-bottom: 12px; }
  .r-cols { display: flex; gap: 24px; }
  .nw .r-cols { display: block; }
  .r-cols > div { flex: 1; }
  .r-card h3 { font-size: 18px; color: #c4372b; margin: 6px 0; }
  .r-card ul, .r-card ol { margin: 0 0 10px; padding-left: 22px; font-size: 15px; line-height: 1.7; }
  .r-com { border-top: 2px solid #2e2a26; padding-top: 12px; margin-bottom: 18px; font-family: "Liberation Sans", Arial, sans-serif; }
  .r-com h3 { font-size: 20px; margin-bottom: 8px; font-family: Georgia, "Liberation Serif", serif; }
  .r-c { padding: 8px 0; border-bottom: 1px solid #eadfcd; font-size: 14px; }
  .r-c b { display: block; }
  .r-c span { color: #e2a400; }
  .r-foot { background: #2e2a26; color: #e9dcc4; text-align: center; font-size: 12px; padding: 16px; font-family: "Liberation Sans", Arial, sans-serif; }

  .p-weather { background: #f0f4fa; color: #10233d; font-family: "Liberation Sans", Arial, sans-serif; }
  .t-top { display: flex; align-items: center; gap: 12px; padding: 12px 22px; background: #10233d; color: #fff; }
  .t-logo { font-weight: 900; font-size: 20px; }
  .t-logo span { color: #ffd34d; }
  .t-loc { margin-left: auto; background: #24406a; padding: 5px 12px; border-radius: 999px; font-size: 13px; }
  .t-hero { background: #3b82d6; color: #fff; display: flex; align-items: center; gap: 18px; padding: 22px 30px; }
  .nw .t-hero { padding: 16px; gap: 8px; }
  .t-temp { font-size: 96px; font-weight: 900; line-height: 1; letter-spacing: -4px; }
  .nw .t-temp { font-size: 68px; }
  .t-cond { font-size: 22px; font-weight: 700; }
  .t-feel { font-size: 14px; opacity: .9; margin-top: 4px; }
  .t-art { margin-left: auto; }
  .nw .t-art svg { width: 130px; height: auto; }
  .t-alert { background: #ffcf3a; color: #3d2a00; padding: 10px 22px; font-weight: 700; font-size: 14px; }
  .t-sec { padding: 16px 22px 4px; }
  .t-sec h2 { font-size: 18px; margin-bottom: 10px; }
  .t-hours { display: flex; gap: 8px; }
  .nw .t-hours { flex-wrap: wrap; }
  .t-h { flex: 1; min-width: 60px; background: #fff; border: 1px solid #d3deec; border-radius: 12px; text-align: center; padding: 8px 4px; font-size: 13px; }
  .t-h i { display: block; font-style: normal; font-size: 24px; margin: 4px 0; }
  .t-h b { font-size: 16px; }
  .t-days { background: #fff; border: 1px solid #d3deec; border-radius: 14px; overflow: hidden; }
  .t-d { display: flex; align-items: center; gap: 12px; padding: 9px 14px; border-top: 1px solid #e6edf6; font-size: 14px; }
  .t-d:first-child { border-top: 0; }
  .t-d b { width: 46px; }
  .t-d i { font-style: normal; font-size: 22px; }
  .t-d span { flex: 1; color: #4a5d78; }
  .t-d em { font-style: normal; font-weight: 700; }
  .t-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .nw .t-grid { grid-template-columns: repeat(2, 1fr); }
  .t-g { background: #fff; border: 1px solid #d3deec; border-radius: 12px; padding: 10px 12px; font-size: 13px; color: #4a5d78; }
  .t-g b { display: block; font-size: 22px; color: #10233d; }
  .t-foot { text-align: center; font-size: 12px; color: #4a5d78; padding: 18px 16px 22px; }

  .p-inbox { background: #f6f8fc; color: #1f1f1f; font-family: "Liberation Sans", Arial, sans-serif; }
  .i-top { display: flex; align-items: center; gap: 14px; padding: 10px 18px; }
  .i-logo { font-size: 22px; font-weight: 700; color: #c5221f; display: flex; align-items: center; gap: 6px; }
  .i-srch { flex: 1; background: #e9eef6; border-radius: 999px; padding: 9px 16px; color: #5f6368; font-size: 14px; }
  .i-wrap { display: flex; gap: 10px; padding: 0 12px 12px; }
  .i-side { width: 170px; flex: none; font-size: 14px; }
  .nw .i-side { display: none; }
  .i-comp { display: inline-block; background: #c2e7ff; padding: 14px 20px; border-radius: 16px; font-weight: 700; margin-bottom: 12px; }
  .i-f { padding: 6px 14px; border-radius: 0 999px 999px 0; display: flex; justify-content: space-between; }
  .i-f.on { background: #d3e3fd; font-weight: 700; }
  .i-list { flex: 1; min-width: 0; background: #fff; border-radius: 16px; overflow: hidden; }
  .i-tabs { display: flex; border-bottom: 1px solid #e3e3e3; font-size: 14px; }
  .i-tabs span { padding: 12px 18px; color: #5f6368; }
  .i-tabs .on { color: #0b57d0; border-bottom: 3px solid #0b57d0; font-weight: 700; }
  .i-m { display: flex; gap: 10px; align-items: baseline; padding: 9px 16px; border-bottom: 1px solid #f1f1f1; font-size: 14px; }
  .nw .i-m { flex-wrap: wrap; gap: 2px 8px; }
  .i-m.u { font-weight: 700; background: #fff; }
  .i-m.r { background: #f2f6fc; color: #444; }
  .i-star { color: #f4b400; width: 16px; }
  .i-from { width: 150px; flex: none; white-space: nowrap; overflow: hidden; }
  .nw .i-from { width: auto; }
  .i-sub { flex: 1; min-width: 0; }
  .i-sub span { font-weight: 400; color: #5f6368; }
  .i-time { font-size: 12px; color: #5f6368; flex: none; }
  .i-lab { display: inline-block; font-size: 11px; padding: 1px 6px; border-radius: 4px; margin-right: 6px; font-weight: 700; }
  .i-foot { text-align: center; font-size: 12px; color: #5f6368; padding: 12px 16px 20px; }

  .p-retro { background: #000080; color: #ffff00; font-family: "Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive, sans-serif; text-align: center; }
  .x-head { background: #ff00ff; color: #00ffff; font-size: 44px; font-weight: 900; padding: 14px 10px; letter-spacing: 2px; border-bottom: 6px ridge #ffff00; }
  .nw .x-head { font-size: 30px; }
  .x-mq { background: #000; color: #00ff00; font-family: "Courier New", "Liberation Mono", monospace; font-size: 15px; padding: 6px; border-bottom: 3px solid #00ff00; white-space: nowrap; overflow: hidden; }
  .x-body { padding: 18px 26px 6px; }
  .nw .x-body { padding: 12px 12px 4px; }
  .x-art { margin: 6px 0 14px; }
  .x-wel { font-size: 24px; color: #ffffff; margin-bottom: 12px; }
  .x-wel b { color: #ff6600; }
  .p-retro p { font-size: 16px; color: #ffff00; }
  .x-tbl { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; border: 4px outset #c0c0c0; background: #c0c0c0; padding: 6px; margin: 14px 0; color: #000; font-size: 14px; }
  .nw .x-tbl { grid-template-columns: 1fr; }
  .x-tbl div { background: #ffffff; border: 2px inset #c0c0c0; padding: 8px; text-align: left; }
  .x-tbl b { color: #0000ff; text-decoration: underline; display: block; }
  .x-hits { display: inline-flex; gap: 2px; background: #000; padding: 4px; border: 3px ridge #c0c0c0; margin: 6px 0 14px; }
  .x-hits span { background: #222; color: #ff2020; font-family: "Courier New", "Liberation Mono", monospace; font-size: 24px; font-weight: 700; width: 22px; }
  .x-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 16px; font-size: 16px; margin-bottom: 14px; }
  .x-links span { color: #00ffff; text-decoration: underline; }
  .x-gb { background: #fff8dc; color: #4b2c00; border: 5px double #8b4513; padding: 12px 16px; text-align: left; margin-bottom: 14px; font-size: 14px; }
  .x-gb h3 { text-align: center; color: #8b0000; font-size: 22px; margin-bottom: 6px; }
  .x-gb div { border-top: 1px dashed #8b4513; padding: 6px 0; }
  .x-badges { display: flex; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .x-badges span { border: 2px solid #fff; background: #333; color: #fff; font-family: "Courier New", "Liberation Mono", monospace; font-size: 11px; padding: 4px 6px; }
  .x-foot { font-size: 13px; color: #c0c0c0; padding: 8px 10px 20px; }

  .p-video { background: #0f0f0f; color: #f1f1f1; font-family: "Liberation Sans", Arial, sans-serif; }
  .v-top { display: flex; align-items: center; gap: 14px; padding: 10px 18px; }
  .v-logo { font-weight: 900; font-size: 20px; display: flex; align-items: center; gap: 6px; letter-spacing: -0.5px; }
  .v-logo i { display: inline-block; background: #ff0033; color: #fff; font-style: normal; font-size: 13px; padding: 4px 9px; border-radius: 8px; }
  .v-srch { flex: 1; background: #121212; border: 1px solid #303030; border-radius: 999px; padding: 7px 16px; color: #aaa; font-size: 14px; }
  .v-player { position: relative; background: #000; }
  .v-player svg { width: 100%; height: auto; display: block; }
  .v-bar { height: 5px; background: #444; position: relative; }
  .v-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 37%; background: #ff0033; }
  .v-body { padding: 14px 18px; }
  .v-body h1 { font-size: 22px; line-height: 1.3; margin-bottom: 10px; }
  .v-ch { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
  .v-av { width: 40px; height: 40px; border-radius: 50%; background: #f29b4a; display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .v-ch b { display: block; font-size: 15px; }
  .v-ch small { color: #aaa; font-size: 12px; }
  .v-sub { background: #f1f1f1; color: #0f0f0f; font-weight: 700; padding: 8px 16px; border-radius: 999px; font-size: 14px; margin-left: 8px; }
  .v-likes { margin-left: auto; background: #272727; padding: 8px 16px; border-radius: 999px; font-size: 14px; font-weight: 700; }
  .nw .v-likes { margin-left: 0; }
  .v-desc { background: #272727; border-radius: 12px; padding: 12px 14px; font-size: 14px; line-height: 1.5; margin-bottom: 16px; }
  .v-desc b { display: block; margin-bottom: 4px; }
  .v-cols { display: flex; gap: 16px; }
  .nw .v-cols { display: block; }
  .v-com { flex: 1; min-width: 0; }
  .v-com h3 { font-size: 18px; margin-bottom: 10px; }
  .v-c { display: flex; gap: 10px; margin-bottom: 14px; font-size: 14px; line-height: 1.45; }
  .v-c-a { width: 34px; height: 34px; flex: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .v-c b { display: block; font-size: 13px; }
  .v-c small { color: #aaa; display: block; margin-top: 2px; }
  .v-next { width: 230px; flex: none; }
  .nw .v-next { width: auto; }
  .v-n { display: flex; gap: 8px; margin-bottom: 10px; font-size: 13px; }
  .v-n-t { width: 96px; height: 56px; flex: none; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
  .v-n b { display: block; font-size: 13px; line-height: 1.3; }
  .v-n small { color: #aaa; }
  .v-foot { text-align: center; color: #777; font-size: 12px; padding: 6px 16px 20px; }
  `;

  const post = (bg, av, name, handle, text, acts, extra = '') => `<div class="f-post"><div class="f-av" style="background:${bg}">${av}</div><div class="f-body"><div class="f-name"><b>${name}</b><span>@${handle}</span></div><div class="f-text">${text}</div>${extra}<div class="f-acts">${acts}</div></div></div>`;
  const mail = (cls, star, from, sub, prev, time, lab) => `<div class="i-m ${cls}"><span class="i-star">${star}</span><span class="i-from">${from}</span><span class="i-sub">${lab || ''}${sub} <span>- ${prev}</span></span><span class="i-time">${time}</span></div>`;
  const lab = (bg, fg, t) => `<i class="i-lab" style="background:${bg};color:${fg};font-style:normal">${t}</i>`;
  const vc = (bg, av, name, text, likes) => `<div class="v-c"><div class="v-c-a" style="background:${bg}">${av}</div><div><b>${name}</b>${text}<small>👍 ${likes} · Reply</small></div></div>`;
  const vn = (bg, e, t, ch) => `<div class="v-n"><div class="v-n-t" style="background:${bg}">${e}</div><div><b>${t}</b><small>${ch}</small></div></div>`;

  const extra = [
    {
      id: 'feed', emoji: '🐦', title: 'Chirper: Home', site: 'Chirper',
      blurb: 'A social feed with strong opinions.',
      html: `<div class="wp p-feed">${chrome('chirper.example/home', 'Home / Chirper', '🐦')}
      <div class="f-top"><span class="f-logo">chirper</span><span class="f-srch">🔍 Search Chirper</span><span class="f-me">🐥</span></div>
      <div class="f-wrap"><div class="f-main">
        <div class="f-compose"><span class="f-me">🐥</span>What's chirping?<b>Chirp</b></div>
        ${post('#ffd9c2', '🧑‍🍳', 'Chef Ramsbottom', 'ramsbottom', 'Hot take: cereal is a soup. Cold soup. Breakfast soup. I will not be taking questions. <span class="f-tag">#SoupDiscourse</span>', '<span>💬 3.1K</span><span>🔁 12K</span><span class="h">❤️ 48K</span><span>📊 2M</span>')}
        ${post('#d4f0d9', '🦆', 'Mapleford Duck Pond', 'duckpond_official', 'UPDATE: the pond will now close at 3pm. The ducks have been informed. The ducks are not happy. Please stop sending the ducks bread as a form of protest.', '<span>💬 812</span><span>🔁 4K</span><span class="h">❤️ 21K</span><span>📊 640K</span>', '<div class="f-card"><div class="f-card-i">🦆</div><div class="f-card-t"><b>Duck pond hours dispute enters 6th year</b>news.dailyharold.example</div></div>')}
        ${post('#e4ddff', '🤖', 'definitely a person', 'totally_human_42', 'Good morning fellow humans. I too enjoy the activity of breathing air and having elbows. What is everyone eating today? I will eat: food.', '<span>💬 90</span><span>🔁 210</span><span class="h">❤️ 1.2K</span><span>📊 33K</span>')}
        ${post('#ffe8a8', '🧓', 'Grandma Joan', 'joan_typing', 'HOW DO I MAKE THE LETTERS SMALL AGAIN. ALSO HAPPY BIRTHDAY KEVIN. I LOVE YOU. THIS IS GRANDMA. <span class="f-tag">#KEVIN</span>', '<span>💬 6K</span><span>🔁 31K</span><span class="h">❤️ 210K</span><span>📊 9M</span>')}
        ${post('#cfe9ff', '📊', 'Poll Person', 'pollperson', 'Settle this once and for all. Is a hot dog a sandwich?', '<span>💬 11K</span><span>🔁 2K</span><span class="h">❤️ 9K</span><span>📊 1M</span>', '<div class="f-poll"><div><i style="width:41%"></i><span>Yes, obviously (41%)</span></div><div><i style="width:47%"></i><span>No, and how dare you (47%)</span></div><div><i style="width:12%"></i><span>A hot dog is a taco (12%)</span></div></div>')}
        ${post('#ffd6e4', '🐈', 'Professor Whiskers', 'prof_whiskers', 'I have knocked the glass off the table. The glass is on the floor now. Gravity remains undefeated. More research is needed. Pushing the remote next.', '<span>💬 2K</span><span>🔁 8K</span><span class="h">❤️ 77K</span><span>📊 3M</span>')}
        ${post('#e0e0e0', '🧍', 'stick_dude', 'stick_dude', 'is anyone else\'s website being destroyed right now or is it just me', '<span>💬 1</span><span>🔁 0</span><span class="h">❤️ 2</span><span>📊 14</span>')}
      </div>
      <div class="f-side">
        <div class="f-box"><h3>Trending</h3>
          <div class="f-trend"><small>Food · Trending</small><b>#SoupDiscourse</b><small>48.2K chirps</small></div>
          <div class="f-trend"><small>Local · Trending</small><b>Stairs</b><small>The grape is still missing</small></div>
          <div class="f-trend"><small>Science</small><b>Gravity</b><small>Still working, say experts</small></div>
          <div class="f-trend"><small>Technology</small><b>Website On Fire</b><small>2,104 chirps</small></div>
        </div>
        <div class="f-box"><h3>Who to follow</h3>
          <div class="f-trend"><b>🫙 Gerald</b><small>@gerald_starter · blorp</small></div>
          <div class="f-trend"><b>🧔 Gary Plimsoll</b><small>@upstairs_gary</small></div>
        </div>
      </div></div>
      <div class="f-foot">Terms · Privacy · Cookies (eaten) · © Chirper Corp, a bird-adjacent company</div>
      </div>`
    },
    {
      id: 'recipe', emoji: '🍝', title: 'The Best Lasagna (With My Life Story)', site: 'Simmer Down',
      blurb: 'Nine paragraphs of feelings, then lasagna.',
      html: `<div class="wp p-recipe">${chrome('simmerdown.example/recipes/best-lasagna-ever', 'The Best Lasagna | Simmer Down', '🍝')}
      <div class="r-top"><span class="r-logo">Simmer Down</span><span class="r-nav"><span>Recipes</span><span>Dinners</span><span>Desserts</span><span>My Journey</span></span></div>
      <div class="r-body">
        <h1>The Best Lasagna You Will Ever Make (Eventually)</h1>
        <div class="r-meta"><span>★★★★★</span>4.9 from 2,318 reviews · Prep 30 min · Cook 1 hr · Scrolling 45 min</div>
        <span class="r-jump">⬇ Jump to recipe</span>
        <div class="r-fig">${lasagnaSvg}</div>
        <div class="r-cap">The lasagna, minutes before my cousin Paolo sat on it at the 2014 reunion.</div>
        <p>The first time I made lasagna, I was nine years old, the sky was a particular shade of Tuesday, and my Nonna looked at me and said, "Too much cheese." I have spent every day since then proving her wrong.</p>
        <p>But to understand the lasagna, you must understand the summer of 2003. We had just moved to a house with a very small oven. I would sit in front of that oven for hours, watching the little light, thinking about layers. Pasta. Sauce. Cheese. Life is also layers, if you think about it. I think about it a lot.</p>
        <div class="r-ad"><span class="r-ad-e">🧀</span><div><small>ADVERTISEMENT</small><b>Lonely? Try Cheese.</b><br>Cheese will never leave you. Cheese is always there.</div></div>
        <p>Some people ask if they can use cottage cheese instead of ricotta. You can. You can also use sand instead of flour. Both are technically choices.</p>
        <p>Anyway, after my divorce, my third move, and a brief but meaningful time as a beekeeper, I realised the secret to great lasagna is patience. You have to let it rest for twenty minutes after baking. I know that sounds hard. You have already scrolled this far. You can do twenty more minutes.</p>
        <div class="r-card"><h2>Best Lasagna Ever</h2><div class="r-card-m">Serves 8, or 1 if it has been a week · Calories: do not ask</div>
          <div class="r-cols"><div><h3>Ingredients</h3><ul><li>12 lasagna sheets</li><li>500 g beef mince</li><li>1 jar tomato passata</li><li>1 onion, chopped while crying</li><li>2 cloves garlic (or 9, I am not your Nonna)</li><li>250 g ricotta</li><li>200 g mozzarella</li><li>A handful of basil</li></ul></div>
          <div><h3>Method</h3><ol><li>Brown the mince with onion and garlic.</li><li>Add passata, simmer 20 minutes.</li><li>Layer sheets, sauce, ricotta, repeat.</li><li>Top with mozzarella.</li><li>Bake at 190°C for 45 minutes.</li><li>Rest 20 minutes. Think about 2003.</li></ol></div></div>
        </div>
        <div class="r-com"><h3>Reviews (2,318)</h3>
          <div class="r-c"><b>Linda K. <span>★★★★★</span></b>I didn't make it but I read the whole story and I am now emotionally invested in Paolo.</div>
          <div class="r-c"><b>BusyDad77 <span>★★★★☆</span></b>Replaced the beef with lentils, the pasta with zucchini, the cheese with yeast, and baked a cake. Turned out great.</div>
          <div class="r-c"><b>Nonna <span>★☆☆☆☆</span></b>Too much cheese.</div>
        </div>
      </div>
      <div class="r-foot">© Simmer Down · All feelings are original · Please do not sit on the lasagna</div>
      </div>`
    },
    {
      id: 'weather', emoji: '⛅', title: 'Weather or Not: 7-Day Forecast', site: 'Weather or Not',
      blurb: 'A forecast that is mostly vibes.',
      html: `<div class="wp p-weather">${chrome('weatherornot.example/forecast/mapleford', 'Mapleford Weather | Weather or Not', '⛅')}
      <div class="t-top"><span class="t-logo">Weather <span>or</span> Not</span><span class="t-loc">📍 Mapleford</span></div>
      <div class="t-hero"><div><div class="t-temp">17°</div><div class="t-cond">Partly smug</div><div class="t-feel">Feels like 17°, but more judgmental · High 19° Low 9°</div></div><div class="t-art">${sunSvg}</div></div>
      <div class="t-alert">⚠️ Weather Advisory: a small man with a rocket launcher has been spotted in the area. Expect scattered pixels.</div>
      <div class="t-sec"><h2>Hourly</h2><div class="t-hours">
        <div class="t-h">Now<i>⛅</i><b>17°</b></div><div class="t-h">2 PM<i>☀️</i><b>18°</b></div><div class="t-h">3 PM<i>☀️</i><b>19°</b></div><div class="t-h">4 PM<i>🌥️</i><b>18°</b></div><div class="t-h">5 PM<i>🌦️</i><b>16°</b></div><div class="t-h">6 PM<i>🌧️</i><b>14°</b></div><div class="t-h">7 PM<i>🌈</i><b>13°</b></div>
      </div></div>
      <div class="t-sec"><h2>7-day forecast</h2><div class="t-days">
        <div class="t-d"><b>Mon</b><i>☀️</i><span>Sunny. Unreasonably so.</span><em>19° / 9°</em></div>
        <div class="t-d"><b>Tue</b><i>🌧️</i><span>Rain, mostly sideways, aimed at you specifically</span><em>13° / 8°</em></div>
        <div class="t-d"><b>Wed</b><i>🌫️</i><span>Fog. You can't see the forecast either.</span><em>12° / 7°</em></div>
        <div class="t-d"><b>Thu</b><i>🌪️</i><span>A small tornado, but it seems polite</span><em>15° / 10°</em></div>
        <div class="t-d"><b>Fri</b><i>🐸</i><span>Light frogs. Bring an umbrella with a lid.</span><em>16° / 11°</em></div>
        <div class="t-d"><b>Sat</b><i>☁️</i><span>One extremely big cloud named Bernard</span><em>14° / 9°</em></div>
        <div class="t-d"><b>Sun</b><i>💥</i><span>Explosions likely, especially on this page</span><em>?? / ??</em></div>
      </div></div>
      <div class="t-sec"><h2>Today's details</h2><div class="t-grid">
        <div class="t-g">Humidity<b>64%</b>Hair: medium frizz</div>
        <div class="t-g">Wind<b>12 km/h</b>From the west, gossiping</div>
        <div class="t-g">UV index<b>5</b>Moderate. Wear a hat anyway.</div>
        <div class="t-g">Pressure<b>1013 hPa</b>Feels like a deadline</div>
        <div class="t-g">Visibility<b>10 km</b>Until the fog on Wed</div>
        <div class="t-g">Sunset<b>7:42 PM</b>Pretty, please look up</div>
      </div></div>
      <div class="t-foot">Forecast accuracy: 50%, which is also the chance of rain · © Weather or Not</div>
      </div>`
    },
    {
      id: 'inbox', emoji: '📬', title: 'Inbox (4,812 unread)', site: 'Snailmail',
      blurb: 'An inbox that needs zero. Get it to zero.',
      html: `<div class="wp p-inbox">${chrome('snailmail.example/inbox', 'Inbox (4,812) - Snailmail', '📬')}
      <div class="i-top"><span class="i-logo">🐌 Snailmail</span><span class="i-srch">🔍 Search mail</span></div>
      <div class="i-wrap"><div class="i-side"><span class="i-comp">✏️ Compose</span>
        <div class="i-f on"><span>📥 Inbox</span><b>4,812</b></div><div class="i-f"><span>⭐ Starred</span></div><div class="i-f"><span>🕒 Snoozed</span><span>forever</span></div><div class="i-f"><span>📤 Sent</span></div><div class="i-f"><span>📝 Drafts</span><span>91</span></div><div class="i-f"><span>🗑️ Bin</span></div><div class="i-f"><span>🧠 Things I'll Read Later</span></div>
      </div>
      <div class="i-list"><div class="i-tabs"><span class="on">Primary</span><span>Promotions</span><span>Social</span><span>Guilt</span></div>
        ${mail('u', '☆', 'Boss', 'Quick question', 'Do you have a minute? Not urgent. Well, a bit urgent. Call me.', '9:41 AM', lab('#fde2e1', '#c5221f', 'URGENT'))}
        ${mail('u', '★', 'Mum', 'Re: Re: Re: Fwd: FW: funny', 'Did you get my last email? I sent it to you twice. Also this one.', '9:12 AM')}
        ${mail('u', '☆', 'MegaMart', 'Your Left Sock has shipped! 🧦', 'Your right sock is now available for pre-order.', '8:50 AM', lab('#e6f4ea', '#137333', 'SHOPPING'))}
        ${mail('u', '☆', 'Prince Bartholomew', 'A modest business proposal', 'Dear friend, I have 40 million gold coins and need only your password.', '8:02 AM', lab('#fef7e0', '#b06000', 'SPAM'))}
        ${mail('r', '☆', 'Dentist', 'Time for your check-up!', 'It has been 3 years. We miss you. Your teeth miss us.', 'Yesterday')}
        ${mail('u', '☆', 'Calendar', 'Meeting: Meeting about meetings', 'Agenda: discuss whether this could have been an email.', 'Yesterday', lab('#e8f0fe', '#1a73e8', 'WORK'))}
        ${mail('r', '★', 'Gerald', 'blorp', 'blorp blorp. blorp? (sent from my jar)', 'Mon')}
        ${mail('u', '☆', 'Chirper', 'You have 1 new follower', 'definitely a person (@totally_human_42) followed you.', 'Mon', lab('#f3e8fd', '#8430ce', 'SOCIAL'))}
        ${mail('r', '☆', 'Past You', 'Things to do this year', '1. Inbox zero. 2. Learn guitar. 3. See item 1.', 'Jan 1')}
        ${mail('u', '☆', 'Newsletter you never signed up for', 'Our 47th newsletter this week!', 'Click here to unsubscribe from unsubscribing.', 'Jan 1', lab('#fef7e0', '#b06000', 'PROMO'))}
        ${mail('r', '☆', 'IT Department', 'Password expires in 0 days', 'Your new password must contain a haiku and a dinosaur.', 'Dec 30')}
        ${mail('u', '☆', 'Weather or Not', 'Light frogs expected Friday', 'Bring an umbrella with a lid.', 'Dec 29')}
        ${mail('r', '☆', 'Library', 'Overdue: How to Read (Hardcover)', 'Total fees: $412. We also want the book back.', 'Dec 12')}
        ${mail('u', '★', 'Yourself', 'note to self', 'remember the thing', 'Nov 3')}
      </div></div>
      <div class="i-foot">Using 14.9 GB of 15 GB · Last activity: you, avoiding this · Program Policies</div>
      </div>`
    },
    {
      id: 'retro', emoji: '🌈', title: "Dave's Totally Rad Homepage", site: "Dave's Cool Zone",
      blurb: 'A 1998 homepage. Under construction forever.',
      html: `<div class="wp p-retro">${chrome('members.geobits.example/~dave/cool_zone.htm', "~*~ Dave's Cool Zone ~*~", '🌈')}
      <div class="x-head">~*~ DAVE'S COOL ZONE ~*~</div>
      <div class="x-mq">*** WELCOME 2 MY HOMEPAGE *** BEST VIEWED IN 800x600 *** SIGN MY GUESTBOOK *** NO RIGHT CLICKING ***</div>
      <div class="x-body">
        <div class="x-art">${constructionSvg}</div>
        <div class="x-wel">Welcome to my <b>TOTALLY RAD</b> corner of the information superhighway!!!</div>
        <p>Hi!! My name is Dave and this is my homepage. I made it myself in Notepad. It took 3 weeks and my mom needed the phone line the whole time. I like computers, skateboarding, and my dog Pixel (he is a good boy).</p>
        <p>This page is <b>UNDER CONSTRUCTION</b>. Soon there will be a page about my favourite cheats and a page about Pixel. Check back soon!!!</p>
        <div>You are visitor number:</div>
        <div class="x-hits"><span>0</span><span>0</span><span>0</span><span>4</span><span>2</span><span>7</span></div>
        <div class="x-tbl">
          <div><b>🐕 Pixel's Page</b>Coming soon (Pixel is camera shy)</div>
          <div><b>🎮 Cheat Codes</b>Up up down down. I forget the rest.</div>
          <div><b>🛹 Skate Pics</b>1 pic. It is blurry. It was a sick kickflip though.</div>
          <div><b>💾 Downloads</b>dave_screensaver.exe (do not open)</div>
          <div><b>🔗 Cool Links</b>My friend Kev's page (it's worse than mine)</div>
          <div><b>📧 E-Mail Me</b>dave_rulez_98@coolmail.example</div>
        </div>
        <div class="x-links"><span>Home</span><span>About Me</span><span>Webring ⇦</span><span>Webring ⇨</span><span>Random Site</span></div>
        <div class="x-gb"><h3>📖 Guestbook</h3>
          <div><b>Kev:</b> nice page dave!!! u should add more gifs</div>
          <div><b>xX_ShadowNinja_Xx:</b> first!!!!!!!!</div>
          <div><b>Dave's Mom:</b> Dinner is ready. Please get off the computer.</div>
          <div><b>stick_dude:</b> sorry in advance</div>
        </div>
        <div class="x-badges"><span>MADE WITH NOTEPAD</span><span>NETSCAPE NOW!</span><span>Y2K READY?</span><span>800x600</span></div>
      </div>
      <div class="x-foot">© 1998 Dave. All rights reserved. Do not steal my background.</div>
      </div>`
    },
    {
      id: 'video', emoji: '📺', title: 'Cat Knocks Everything Off Table (10 Hours)', site: 'WeTube',
      blurb: 'A video page. Skip the ads with force.',
      html: `<div class="wp p-video">${chrome('wetube.example/watch?v=c4t0nt4bl3', 'Cat Knocks Everything Off Table (10 Hours) - WeTube', '📺')}
      <div class="v-top"><span class="v-logo"><i>▶</i>WeTube</span><span class="v-srch">Search</span></div>
      <div class="v-player">${videoSvg}<div class="v-bar"><i></i></div></div>
      <div class="v-body">
        <h1>Cat Knocks Everything Off Table (10 Hours, No Ads*)</h1>
        <div class="v-ch"><span class="v-av">🐈</span><div><b>Professor Whiskers</b><small>2.4M subscribers</small></div><span class="v-sub">Subscribe</span><span class="v-likes">👍 412K | 👎</span></div>
        <div class="v-desc"><b>18M views · 3 years ago</b>Ten uninterrupted hours of Professor Whiskers conducting important gravity research. No objects were harmed except all of them. *There are 41 ads.<br>0:00 Glass<br>1:12:30 Remote<br>4:00:00 A whole lamp somehow<br>9:59:58 The camera</div>
        <div class="v-cols"><div class="v-com"><h3>8,104 Comments</h3>
          ${vc('#ffd9c2', '🧓', '@grandma_joan', 'IS THIS LIVE. SOMEONE STOP THE CAT', '22K')}
          ${vc('#d4f0d9', '🧑‍🔬', '@actual_physicist', 'As a physicist I can confirm all objects fell at the expected rate. Great work, Professor.', '9.1K')}
          ${vc('#e4ddff', '⏱️', '@timestamp_hero', '6:14:02 the cat looks directly at the camera and pushes a mug. Chills.', '5.5K')}
          ${vc('#cfe9ff', '🧍', '@stick_dude', 'i am going to do this to the whole website', '3')}
        </div>
        <div class="v-next">
          ${vn('#3d3260', '🐕', 'Dog Sees Mirror For First Time (Panics)', 'Good Boys Daily · 9M views')}
          ${vn('#5a2b2b', '🍝', 'Lasagna ASMR (90 min of layering)', 'Simmer Down · 1M views')}
          ${vn('#23445a', '🐸', 'Light Frogs: A Weather Documentary', 'Weather or Not · 380K views')}
          ${vn('#2b4a2b', '🦆', 'Duck Pond Closing Ceremony LIVE', 'Mapleford · 41K watching')}
        </div></div>
      </div>
      <div class="v-foot">About · Press · Creators · © WeTube, broadcasting cats since forever</div>
      </div>`
    }
  ];

  W.pages.push(...extra);
  W.css += css;
})();
