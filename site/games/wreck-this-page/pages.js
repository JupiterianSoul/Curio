(function () {
  const chrome = (url, tab, icon) => `
  <div class="wc">
    <div class="wc-tabs"><span class="wc-dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span><span class="wc-tab">${icon} ${tab}</span><span class="wc-plus">+</span></div>
    <div class="wc-bar"><span class="wc-nav">&#8592; &#8594; &#8635;</span><span class="wc-url">&#128274; ${url}</span><span class="wc-menu">&#8942;</span></div>
  </div>`;

  const stairsSvg = `<svg viewBox="0 0 320 180" width="320" height="180" xmlns="http://www.w3.org/2000/svg">
    <rect width="320" height="180" fill="#bfe3f5"/>
    <rect y="150" width="320" height="30" fill="#8bc47a"/>
    <rect x="20" y="40" width="70" height="110" fill="#f4e3c3"/>
    <rect x="30" y="52" width="22" height="22" fill="#9fd3ec" stroke="#6d5a40" stroke-width="3"/>
    <rect x="58" y="52" width="22" height="22" fill="#9fd3ec" stroke="#6d5a40" stroke-width="3"/>
    <path d="M110 150 h40 v-18 h30 v-18 h30 v-18 h30 v-18 h30 v-18 h30 V150 Z" fill="#a0673a"/>
    <path d="M110 150 h40 v-18 h30 v-18 h30 v-18 h30 v-18 h30 v-18 h30" fill="none" stroke="#6e4322" stroke-width="4"/>
    <circle cx="268" cy="28" r="9" fill="none" stroke="#1d1b19" stroke-width="4"/>
    <path d="M268 37 v22 M268 59 l-9 17 M268 59 l9 17 M268 44 l-14 -14 M268 44 l14 -14" stroke="#1d1b19" stroke-width="4" stroke-linecap="round" fill="none"/>
    <circle cx="128" cy="144" r="5" fill="#7b3fa0"/>
    <circle cx="48" cy="20" r="12" fill="#ffd34d"/>
  </svg>`;

  const stickSvg = `<svg viewBox="0 0 160 150" width="160" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="160" height="150" fill="#f8f9fa"/>
    <circle cx="80" cy="34" r="17" fill="none" stroke="#202122" stroke-width="5"/>
    <path d="M80 51 v46 M80 97 l-20 36 M80 97 l20 36 M80 66 l-26 18 M80 66 l26 -16" stroke="#202122" stroke-width="5" stroke-linecap="round" fill="none"/>
    <circle cx="74" cy="31" r="2.5" fill="#202122"/><circle cx="86" cy="31" r="2.5" fill="#202122"/>
    <path d="M73 41 q7 4 14 0" stroke="#202122" stroke-width="2.5" fill="none"/>
  </svg>`;

  const jarSvg = `<svg viewBox="0 0 300 170" width="300" height="170" xmlns="http://www.w3.org/2000/svg">
    <rect width="300" height="170" fill="#f6e6d4"/>
    <rect y="132" width="300" height="38" fill="#c99a6b"/>
    <rect x="102" y="22" width="96" height="16" rx="4" fill="#8a8f98"/>
    <rect x="96" y="36" width="108" height="108" rx="18" fill="#e9f4f7" stroke="#9fb4bd" stroke-width="4"/>
    <rect x="102" y="70" width="96" height="68" rx="12" fill="#f3ead6"/>
    <circle cx="125" cy="92" r="6" fill="#fffaf0"/><circle cx="170" cy="110" r="8" fill="#fffaf0"/><circle cx="150" cy="84" r="4" fill="#fffaf0"/>
    <circle cx="132" cy="112" r="4" fill="#3a2a1a"/><circle cx="160" cy="112" r="4" fill="#3a2a1a"/>
    <path d="M134 126 q12 -8 24 0" stroke="#3a2a1a" stroke-width="3" fill="none"/>
    <path d="M124 104 l12 4 M168 104 l-12 4" stroke="#3a2a1a" stroke-width="3"/>
    <rect x="222" y="96" width="44" height="40" rx="6" fill="#ffe08a"/>
    <path d="M226 104 h36" stroke="#e6b94a" stroke-width="3"/>
  </svg>`;

  const ufoSvg = `<svg viewBox="0 0 260 150" width="260" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="260" height="150" fill="#12131a"/>
    <circle cx="30" cy="20" r="2" fill="#fff"/><circle cx="210" cy="30" r="2" fill="#fff"/><circle cx="240" cy="110" r="2" fill="#fff"/><circle cx="20" cy="120" r="2" fill="#fff"/>
    <path d="M110 54 L80 140 H180 L150 54 Z" fill="#7cf6c4" opacity=".35"/>
    <ellipse cx="130" cy="48" rx="66" ry="16" fill="#9aa3b5"/>
    <ellipse cx="130" cy="38" rx="30" ry="20" fill="#7cf6c4"/>
    <circle cx="96" cy="50" r="4" fill="#ff4fa3"/><circle cx="130" cy="54" r="4" fill="#ffd34d"/><circle cx="164" cy="50" r="4" fill="#ff4fa3"/>
    <rect x="112" y="96" width="36" height="44" fill="#ffffff" transform="rotate(-12 130 118)"/>
    <path d="M118 108 h22 M118 116 h18 M118 124 h22" stroke="#9aa3b5" stroke-width="3" transform="rotate(-12 130 118)"/>
  </svg>`;

  const css = `
  .wp { font-family: Arial, "Liberation Sans", Helvetica, sans-serif; color: #222; background: #fff; line-height: 1.5; font-size: 15px; text-align: left; }
  .wp * { box-sizing: border-box; }
  .wp p { margin: 0 0 14px; }
  .wp h1, .wp h2, .wp h3 { margin: 0; }
  .wp a { color: inherit; }
  .wc { background: #dfe3e8; padding: 8px 10px 8px; font-family: Arial, "Liberation Sans", sans-serif; }
  .wc-tabs { display: flex; align-items: center; gap: 10px; }
  .wc-dots { display: flex; gap: 6px; }
  .wc-dots i { width: 12px; height: 12px; border-radius: 50%; display: block; }
  .wc-tab { background: #fff; padding: 6px 14px; border-radius: 8px 8px 0 0; font-size: 12px; color: #333; max-width: 60%; white-space: nowrap; overflow: hidden; }
  .wc-plus { color: #555; font-size: 16px; }
  .wc-bar { display: flex; align-items: center; gap: 10px; background: #fff; padding: 6px 10px; border-radius: 0 8px 8px 8px; }
  .wc-nav { color: #666; font-size: 14px; white-space: nowrap; }
  .wc-url { flex: 1; background: #eef1f4; border-radius: 999px; padding: 4px 12px; font-size: 12px; color: #333; white-space: nowrap; overflow: hidden; }
  .wc-menu { color: #666; }

  .p-news { background: #fbf8f1; color: #1c1c1c; }
  .n-top { display: flex; justify-content: space-between; font-size: 12px; color: #666; padding: 8px 24px; border-bottom: 1px solid #ddd5c4; }
  .n-mast { font-family: Georgia, "Liberation Serif", "Times New Roman", serif; font-weight: 700; font-size: 54px; text-align: center; padding: 14px 10px 0; letter-spacing: -1px; }
  .nw .n-mast { font-size: 38px; }
  .n-tag { text-align: center; font-style: italic; color: #6b6255; font-family: Georgia, "Liberation Serif", serif; padding-bottom: 12px; font-size: 14px; }
  .n-nav { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 20px; background: #b3261e; color: #fff; font-weight: 700; padding: 9px 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
  .n-body { padding: 26px 40px 10px; }
  .nw .n-body { padding: 20px 18px 6px; }
  .n-kick { color: #b3261e; font-weight: 700; font-size: 12px; letter-spacing: 2px; margin-bottom: 8px; }
  .p-news h1 { font-family: Georgia, "Liberation Serif", serif; font-size: 44px; line-height: 1.08; margin-bottom: 12px; }
  .nw.p-news h1 { font-size: 34px; }
  .n-dek { font-family: Georgia, "Liberation Serif", serif; font-size: 19px; color: #4a453e; }
  .n-by { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; border-top: 1px solid #ddd5c4; border-bottom: 1px solid #ddd5c4; padding: 8px 0; margin-bottom: 18px; }
  .n-av { width: 28px; height: 28px; border-radius: 50%; background: #e8dcc4; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; }
  .n-fig svg { width: 100%; height: auto; display: block; }
  .n-cap { font-size: 12px; color: #6b6255; padding: 6px 0 18px; font-style: italic; }
  .p-news .n-copy p { font-family: Georgia, "Liberation Serif", serif; font-size: 17px; line-height: 1.6; }
  .n-q { margin: 6px 0 20px; padding: 6px 0 6px 18px; border-left: 5px solid #b3261e; font-family: Georgia, "Liberation Serif", serif; font-size: 23px; font-style: italic; line-height: 1.35; color: #3a342c; }
  .n-ad { border: 1px dashed #b9ae97; background: #fff3c4; padding: 14px 16px; margin: 6px 0 22px; display: flex; gap: 14px; align-items: center; }
  .n-ad small { display: block; font-size: 10px; letter-spacing: 2px; color: #8a7d60; }
  .n-ad b { font-size: 18px; }
  .n-ad-e { font-size: 40px; }
  .n-btn { display: inline-block; margin-top: 6px; background: #1c1c1c; color: #fff; padding: 5px 12px; border-radius: 4px; font-size: 13px; font-weight: 700; }
  .p-news h2 { font-family: Georgia, "Liberation Serif", serif; font-size: 22px; border-top: 3px solid #1c1c1c; padding-top: 8px; margin-bottom: 12px; }
  .n-rel { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 22px; }
  .nw .n-rel { grid-template-columns: 1fr; gap: 10px; }
  .n-card { background: #fff; border: 1px solid #ddd5c4; padding: 12px; font-family: Georgia, "Liberation Serif", serif; font-weight: 700; font-size: 15px; line-height: 1.3; }
  .n-card span { display: block; font-size: 30px; margin-bottom: 4px; }
  .n-foot { background: #1c1c1c; color: #cfc6b5; text-align: center; font-size: 12px; padding: 16px; }

  .p-wiki { background: #f6f6f6; color: #202122; font-family: "Liberation Sans", Arial, sans-serif; }
  .w-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 22px; flex-wrap: wrap; }
  .w-logo { display: flex; align-items: center; gap: 10px; font-family: "Liberation Serif", Georgia, serif; }
  .w-logo b { font-size: 22px; font-weight: 400; letter-spacing: 1px; display: block; line-height: 1.1; }
  .w-logo small { font-size: 11px; color: #54595d; display: block; }
  .w-globe { font-size: 34px; }
  .w-search { border: 1px solid #a2a9b1; background: #fff; padding: 6px 10px; color: #72777d; font-size: 14px; width: 230px; border-radius: 2px; }
  .nw .w-search { width: 100%; }
  .w-tabs { display: flex; gap: 2px 16px; padding: 0 22px; font-size: 13px; color: #36c; border-bottom: 1px solid #a7d7f9; flex-wrap: wrap; }
  .w-tabs span { padding: 6px 2px; }
  .w-tabs .on { color: #202122; border-bottom: 2px solid #36c; }
  .w-main { background: #fff; margin: 0 14px; border: 1px solid #a7d7f9; border-top: 0; padding: 18px 24px 10px; font-size: 14px; line-height: 1.6; }
  .nw .w-main { margin: 0; padding: 14px 14px 8px; border-left: 0; border-right: 0; }
  .p-wiki h1 { font-family: "Liberation Serif", Georgia, serif; font-weight: 400; font-size: 30px; border-bottom: 1px solid #a2a9b1; margin-bottom: 4px; }
  .w-from { font-size: 12px; color: #54595d; margin-bottom: 8px; }
  .w-hat { font-style: italic; padding-left: 22px; margin-bottom: 12px; font-size: 13px; }
  .w-hat a, .p-wiki a { color: #36c; text-decoration: none; }
  .w-info { float: right; width: 230px; margin: 0 0 12px 18px; border: 1px solid #a2a9b1; background: #f8f9fa; font-size: 12px; padding: 4px; }
  .nw .w-info { float: none; width: 100%; margin: 0 0 14px; }
  .w-info-t { background: #e0d9a6; text-align: center; font-weight: 700; font-size: 14px; padding: 4px; }
  .w-info-img { text-align: center; padding: 6px 0; }
  .w-info-img svg { width: 140px; height: auto; }
  .w-row { display: flex; gap: 8px; padding: 3px 4px; border-top: 1px solid #eaecf0; }
  .w-row b { width: 82px; flex: none; }
  .w-toc { display: inline-block; border: 1px solid #a2a9b1; background: #f8f9fa; padding: 8px 14px; margin-bottom: 14px; font-size: 13px; }
  .w-toc b { display: block; text-align: center; margin-bottom: 4px; }
  .w-toc div { color: #36c; }
  .p-wiki h2 { font-family: "Liberation Serif", Georgia, serif; font-weight: 400; font-size: 23px; border-bottom: 1px solid #a2a9b1; margin: 18px 0 8px; }
  .p-wiki sup { color: #36c; font-size: 10px; }
  .w-cn { color: #36c; font-style: italic; font-size: 11px; }
  .p-wiki ul, .p-wiki ol { margin: 0 0 14px; padding-left: 26px; }
  .w-see { display: flex; flex-wrap: wrap; gap: 6px 18px; color: #36c; margin-bottom: 10px; }
  .w-refs { font-size: 12px; }
  .w-cat { border: 1px solid #a2a9b1; background: #f8f9fa; padding: 6px 10px; font-size: 12px; margin: 16px 0 6px; }
  .w-foot { font-size: 11px; color: #54595d; padding: 14px 22px 18px; }

  .p-shop { background: #eef0f3; color: #1f2329; font-family: "Liberation Sans", Arial, sans-serif; }
  .s-promo { background: #111; color: #ffd400; text-align: center; font-size: 12px; font-weight: 700; padding: 6px 10px; }
  .s-head { display: flex; align-items: center; gap: 16px; background: #1f3a93; padding: 14px 20px; flex-wrap: wrap; }
  .s-logo { font-size: 28px; color: #fff; font-weight: 400; letter-spacing: -1px; }
  .s-logo b { color: #ffd400; font-weight: 900; }
  .s-search { flex: 1; min-width: 180px; background: #fff; color: #7a808a; border-radius: 6px; padding: 8px 12px; font-size: 14px; }
  .s-cart { color: #fff; font-size: 20px; }
  .s-cart b { background: #ff5a36; font-size: 12px; border-radius: 999px; padding: 1px 7px; }
  .s-cats { display: flex; gap: 4px 22px; flex-wrap: wrap; background: #2b4cb3; color: #dfe6ff; font-size: 13px; padding: 8px 20px; font-weight: 700; }
  .s-hero { margin: 18px 20px; background: #ffd400; border-radius: 14px; padding: 22px 26px; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
  .s-hero-k { font-size: 12px; font-weight: 900; letter-spacing: 2px; color: #7a5a00; }
  .s-hero-t { font-size: 36px; font-weight: 900; line-height: 1.05; letter-spacing: -1px; }
  .nw .s-hero-t { font-size: 28px; }
  .s-hero-s { font-size: 15px; margin: 6px 0 12px; }
  .s-hero-e { font-size: 76px; line-height: 1; }
  .s-btn { display: inline-block; background: #1f2329; color: #fff; border-radius: 999px; padding: 8px 18px; font-weight: 700; font-size: 14px; }
  .p-shop h2 { font-size: 22px; padding: 4px 20px 10px; }
  .s-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 0 20px 20px; }
  .nw .s-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 0 14px 16px; }
  .s-card { background: #fff; border-radius: 10px; padding: 10px; border: 1px solid #d9dde3; }
  .s-img { height: 96px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 50px; margin-bottom: 8px; }
  .s-name { font-weight: 700; font-size: 14px; line-height: 1.25; }
  .s-sub { font-size: 12px; color: #6a717c; line-height: 1.3; margin: 2px 0 4px; }
  .s-stars { color: #f5a300; font-size: 13px; }
  .s-stars span { color: #6a717c; font-size: 11px; }
  .s-price { font-size: 19px; font-weight: 900; margin: 2px 0 8px; }
  .s-price s { font-size: 12px; color: #8a919c; font-weight: 400; }
  .s-add { display: block; text-align: center; background: #ffd400; border-radius: 999px; padding: 6px; font-size: 13px; font-weight: 700; }
  .s-revs { background: #fff; margin: 0 20px 20px; border-radius: 12px; padding: 16px 18px; border: 1px solid #d9dde3; }
  .nw .s-revs { margin: 0 14px 16px; }
  .s-revs h3 { font-size: 18px; margin-bottom: 10px; }
  .s-rev { border-top: 1px solid #e5e8ec; padding: 10px 0; font-size: 14px; }
  .s-rev .s-stars { display: block; }
  .s-foot { background: #1f2329; color: #aab1bc; font-size: 12px; padding: 18px 20px; display: flex; flex-wrap: wrap; gap: 6px 24px; }

  .p-blog { background: #fdf3ec; color: #3b2f2a; font-family: Georgia, "Liberation Serif", serif; }
  .b-head { display: flex; align-items: center; gap: 16px; padding: 24px 28px 14px; }
  .b-av { width: 64px; height: 64px; border-radius: 50%; background: #f2c9a6; display: flex; align-items: center; justify-content: center; font-size: 34px; border: 3px solid #d8835a; flex: none; }
  .b-name { font-size: 30px; font-weight: 700; color: #b3542c; line-height: 1.1; }
  .b-tagline { font-size: 14px; font-style: italic; color: #7a6458; }
  .b-nav { display: flex; gap: 6px 20px; flex-wrap: wrap; padding: 8px 28px; border-top: 2px dotted #d8b9a5; border-bottom: 2px dotted #d8b9a5; font-family: "Courier New", "Liberation Mono", monospace; font-size: 14px; color: #8c4a2c; }
  .b-wrap { display: flex; gap: 22px; padding: 22px 28px; align-items: flex-start; }
  .nw .b-wrap { flex-direction: column; padding: 18px 16px; }
  .b-post { flex: 1; min-width: 0; }
  .b-date { font-family: "Courier New", "Liberation Mono", monospace; font-size: 12px; color: #a07f6d; letter-spacing: 1px; }
  .p-blog h1 { font-size: 32px; line-height: 1.15; color: #3b2f2a; margin: 6px 0 10px; }
  .b-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
  .b-tags span { background: #f6d7c3; color: #8c4a2c; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-family: Arial, "Liberation Sans", sans-serif; font-weight: 700; }
  .p-blog .b-post p { font-size: 16px; line-height: 1.7; }
  .b-fig { margin: 4px 0 18px; border: 6px solid #fff; box-shadow: 0 2px 0 #e7cdbd; }
  .b-fig svg { width: 100%; height: auto; display: block; }
  .b-recipe { background: #fff; border: 2px dashed #d8835a; border-radius: 10px; padding: 12px 16px; margin: 4px 0 20px; font-size: 15px; }
  .b-recipe b { color: #b3542c; display: block; margin-bottom: 4px; }
  .b-comm h3 { font-size: 20px; margin: 4px 0 10px; }
  .b-c { display: flex; gap: 10px; background: #fff; border-radius: 10px; padding: 10px 12px; margin-bottom: 10px; font-size: 14px; line-height: 1.45; }
  .b-c-a { font-size: 22px; }
  .b-c b { color: #b3542c; display: block; font-family: Arial, "Liberation Sans", sans-serif; font-size: 13px; }
  .b-side { width: 200px; flex: none; }
  .nw .b-side { width: 100%; }
  .b-box { background: #fff; border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; font-size: 13px; line-height: 1.5; border-top: 4px solid #d8835a; }
  .b-box h4 { margin: 0 0 6px; font-size: 15px; color: #b3542c; }
  .b-box div { padding: 3px 0; border-bottom: 1px dotted #e3c9b8; }
  .b-mood { font-size: 30px; text-align: center; }
  .b-foot { text-align: center; font-size: 12px; color: #a07f6d; padding: 4px 16px 20px; font-style: italic; }

  .p-search { background: #fff; color: #202124; font-family: Arial, "Liberation Sans", sans-serif; }
  .q-head { display: flex; align-items: center; gap: 20px; padding: 18px 24px 10px; flex-wrap: wrap; }
  .q-logo { font-size: 30px; font-weight: 700; letter-spacing: -1px; }
  .q-box { flex: 1; min-width: 200px; display: flex; justify-content: space-between; border: 1px solid #dfe1e5; border-radius: 999px; padding: 10px 18px; font-size: 15px; background: #fff; }
  .q-tabs { display: flex; gap: 4px 22px; padding: 0 24px 0 24px; font-size: 13px; color: #5f6368; border-bottom: 1px solid #ebebeb; flex-wrap: wrap; }
  .q-tabs span { padding: 8px 0; }
  .q-tabs .on { color: #1a0dab; border-bottom: 3px solid #1a0dab; }
  .q-main { padding: 12px 24px 4px; max-width: 640px; }
  .nw .q-main { padding: 10px 16px 4px; }
  .q-count { font-size: 13px; color: #70757a; margin-bottom: 18px; }
  .q-r { margin-bottom: 24px; }
  .q-url { font-size: 13px; color: #202124; display: flex; align-items: center; gap: 8px; }
  .q-fav { width: 22px; height: 22px; border-radius: 50%; background: #eef0f3; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; }
  .q-t { font-size: 20px; color: #1a0dab; line-height: 1.3; margin: 3px 0 3px; }
  .q-s { font-size: 14px; color: #4d5156; line-height: 1.55; }
  .q-s b { color: #202124; }
  .q-paa { border: 1px solid #dadce0; border-radius: 10px; margin-bottom: 26px; }
  .q-paa h3 { font-size: 19px; font-weight: 400; padding: 12px 16px 6px; }
  .q-paa div { border-top: 1px solid #dadce0; padding: 11px 16px; font-size: 15px; display: flex; justify-content: space-between; }
  .q-pg { display: flex; align-items: flex-end; gap: 2px; justify-content: center; padding: 12px 0 8px; font-size: 26px; font-weight: 700; flex-wrap: wrap; }
  .q-pg-n { display: flex; justify-content: center; gap: 16px; font-size: 14px; color: #1a0dab; padding-bottom: 16px; }
  .q-foot { background: #f2f2f2; color: #70757a; font-size: 13px; padding: 14px 24px; border-top: 1px solid #dadce0; }

  .p-404 { background: #12131a; color: #e6e8f0; font-family: "Liberation Mono", "Courier New", monospace; }
  .e-top { display: flex; gap: 20px; padding: 14px 24px; color: #8a90a6; font-size: 14px; border-bottom: 1px solid #262838; }
  .e-logo { color: #7cf6c4; font-weight: 700; margin-right: auto; }
  .e-hero { position: relative; height: 210px; margin-top: 20px; }
  .nw .e-hero { height: 150px; }
  .e-big { position: absolute; left: 0; right: 0; top: 0; text-align: center; font-family: Arial, "Liberation Sans", sans-serif; font-weight: 900; font-size: 190px; line-height: 1; letter-spacing: -6px; }
  .nw .e-big { font-size: 130px; }
  .e-b1 { color: #ff4fa3; transform: translate(-7px, 4px); }
  .e-b2 { color: #3ad7ff; transform: translate(7px, -3px); }
  .e-b3 { color: #ffffff; }
  .e-t { text-align: center; font-family: Arial, "Liberation Sans", sans-serif; font-size: 30px; font-weight: 700; padding: 0 16px; }
  .e-s { text-align: center; color: #9aa0b8; max-width: 520px; margin: 8px auto 18px !important; padding: 0 16px; font-size: 14px; line-height: 1.6; }
  .e-art { text-align: center; }
  .e-art svg { width: 260px; height: auto; }
  .e-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; padding: 14px 16px 24px; font-family: Arial, "Liberation Sans", sans-serif; }
  .e-btn1 { background: #7cf6c4; color: #10221a; padding: 10px 22px; border-radius: 999px; font-weight: 700; }
  .e-btn2 { border: 2px solid #3d4157; color: #e6e8f0; padding: 8px 20px; border-radius: 999px; }
  .e-box { margin: 0 24px 18px; border: 1px solid #2f3245; background: #1a1c27; border-radius: 10px; padding: 14px 18px; font-size: 13px; line-height: 1.8; }
  .nw .e-box { margin: 0 14px 16px; }
  .e-box b { color: #ffd34d; }
  .e-box ul { margin: 6px 0 0; padding-left: 20px; color: #3ad7ff; }
  .e-err { margin: 0 24px 22px; color: #ff6b6b; font-size: 12px; background: #221419; border-left: 4px solid #ff6b6b; padding: 10px 14px; line-height: 1.6; }
  .nw .e-err { margin: 0 14px 18px; }
  .e-foot { text-align: center; color: #5d6380; font-size: 12px; padding: 14px; border-top: 1px solid #262838; }

  .p-own { background: #f4f1ea; color: #222; font-family: Georgia, "Liberation Serif", serif; }
  .o-head { background: #2d6a4f; color: #fff; padding: 16px 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; font-family: Arial, "Liberation Sans", sans-serif; }
  .o-head b { font-size: 22px; }
  .o-head span { font-size: 13px; opacity: .85; }
  .o-art { background: #fff; margin: 22px 28px; padding: 26px 30px 12px; border-radius: 6px; border: 1px solid #ddd6c8; }
  .nw .o-art { margin: 14px 12px; padding: 18px 16px 8px; }
  .p-own h1 { font-size: 36px; line-height: 1.15; margin-bottom: 8px; }
  .o-meta { font-family: Arial, "Liberation Sans", sans-serif; font-size: 13px; color: #777; margin-bottom: 18px; }
  .p-own .o-art p { font-size: 17px; line-height: 1.65; word-wrap: break-word; overflow-wrap: anywhere; }
  .o-foot { text-align: center; font-size: 12px; color: #888; padding: 4px 16px 22px; font-family: Arial, "Liberation Sans", sans-serif; }
  `;

  const product = (e, bg, name, sub, stars, n, price, old) => `<div class="s-card"><div class="s-img" style="background:${bg}">${e}</div><div class="s-name">${name}</div><div class="s-sub">${sub}</div><div class="s-stars">${stars} <span>(${n})</span></div><div class="s-price">${price} <s>${old}</s></div><span class="s-add">Add to cart</span></div>`;
  const result = (fav, url, title, snip) => `<div class="q-r"><div class="q-url"><span class="q-fav">${fav}</span>${url}</div><div class="q-t">${title}</div><div class="q-s">${snip}</div></div>`;

  const pages = [
    {
      id: 'news', emoji: '📰', title: 'Local Man Discovers Stairs', site: 'The Daily Harold',
      blurb: 'A newspaper with a very big scoop.',
      html: `<div class="wp p-news">${chrome('news.dailyharold.example/local/man-discovers-stairs', 'Local Man Discovers Stairs', '📰')}
      <div class="n-top"><span>Tuesday, probably</span><span>Weather: 🌤️ some</span></div>
      <div class="n-mast">The Daily Harold</div>
      <div class="n-tag">All the news that fits, and some that doesn't</div>
      <div class="n-nav"><span>Home</span><span>Local</span><span>Stairs</span><span>Weather</span><span>Opinion</span><span>Puzzles</span></div>
      <div class="n-body">
        <div class="n-kick">BREAKING · LOCAL</div>
        <h1>Local Man Discovers Stairs</h1>
        <p class="n-dek">"I just kept going up," says area resident, 41, who has lived in a two-storey house since 2009.</p>
        <div class="n-by"><span class="n-av">🧔</span><span>By <b>Pat Ledger</b>, Senior Stairs Correspondent · 6 min read</span></div>
        <div class="n-fig">${stairsSvg}</div>
        <div class="n-cap">Gary Plimsoll, photographed moments after reaching what he calls "the upstairs."</div>
        <div class="n-copy">
          <p>MAPLEFORD - Gary Plimsoll, 41, confirmed on Monday that he had discovered a previously unknown set of stairs in his own home, ending what neighbours describe as "fifteen quiet years on the ground floor."</p>
          <p>Plimsoll says the discovery happened by accident. "I dropped a grape and it rolled behind the coat rack," he told the Harold. "I followed the grape. The grape went up. Then I went up. There was a whole other house up there."</p>
          <p>The upstairs, which Plimsoll estimates is "about the same size as the downstairs, but higher," contains three bedrooms, a bathroom and a cardboard box labelled MISC that he says he is "not ready to open."</p>
          <div class="n-q">"Each step is a little floor. Somebody put a little floor on top of another little floor. Who does that?"</div>
          <p>Experts were quick to weigh in. "Stairs are one of humanity's oldest technologies," said Dr. Hana Ostrowski of the Mapleford Institute of Vertical Studies. "They are essentially a ramp that has been folded very carefully. We see this more than you'd think."</p>
          <p>Plimsoll's wife, Denise, said she had been using the stairs daily since 2009. "I assumed he knew," she said. "Where did he think I was going at night? Where did he think the bed was?" Plimsoll declined to answer, citing the ongoing grape situation.</p>
          <div class="n-ad"><span class="n-ad-e">🛗</span><div><small>ADVERTISEMENT</small><b>Tired of stairs? Try Elevators.</b><br>Like stairs, but a box. Your legs will never know.<br><span class="n-btn">Learn more</span></div></div>
          <p>Not everyone is convinced. Councillor Brent Vasquez called the stairs "a solution in search of a problem" and promised to raise the matter at the next meeting, alongside the long-running dispute over the duck pond's opening hours.</p>
          <p>For now, Plimsoll is taking things one step at a time. "Sometimes two," he said. "When I'm feeling brave." He plans to investigate a small door in the upstairs ceiling next, which Denise has asked reporters to stop calling "the attic."</p>
          <p>The grape has not been recovered.</p>
        </div>
        <h2>More from Local</h2>
        <div class="n-rel">
          <div class="n-card"><span>🦆</span>Duck pond to close at 3pm, ducks reportedly furious</div>
          <div class="n-card"><span>🍞</span>Bakery accidentally invents bread for the second time</div>
          <div class="n-card"><span>🚪</span>Second man finds door, refuses to elaborate</div>
        </div>
      </div>
      <div class="n-foot">© The Daily Harold · Printed on 100% recycled opinions · Corrections: none, we are always right</div>
      </div>`
    },
    {
      id: 'wiki', emoji: '📚', title: 'Stick figure', site: 'Wikipedant',
      blurb: 'An encyclopedia entry about you, sort of.',
      html: `<div class="wp p-wiki">${chrome('wikipedant.example/wiki/Stick_figure', 'Stick figure - Wikipedant', '📚')}
      <div class="w-head"><div class="w-logo"><span class="w-globe">🧩</span><div><b>WIKIPEDANT</b><small>The Free Encyclopedia, Probably</small></div></div><div class="w-search">Search Wikipedant</div></div>
      <div class="w-tabs"><span class="on">Article</span><span>Talk (3,402)</span><span>Read</span><span>Edit</span><span>View history</span></div>
      <div class="w-main" data-back>
        <h1>Stick figure</h1>
        <div class="w-from">From Wikipedant, the free encyclopedia that is pretty sure about most of this</div>
        <div class="w-hat">This article is about the lifeform. For the drawing technique, see <a>Lazy art</a>.</div>
        <div class="w-info">
          <div class="w-info-t">Stick figure</div>
          <div class="w-info-img">${stickSvg}</div>
          <div class="w-row"><b>Kingdom</b><span>Doodlia</span></div>
          <div class="w-row"><b>Head</b><span>1 (circle, rarely closed)</span></div>
          <div class="w-row"><b>Limbs</b><span>4, or 5 if holding a stick</span></div>
          <div class="w-row"><b>Habitat</b><span>Margins, whiteboards, safety manuals</span></div>
          <div class="w-row"><b>Diet</b><span>Ink</span></div>
          <div class="w-row"><b>Lifespan</b><span>Until erased</span></div>
          <div class="w-row"><b>Status</b><span>Least concern</span></div>
        </div>
        <p>A <b>stick figure</b> (<i>Homo lineolus</i>) is a minimalist humanoid composed of one circle and between four and six lines. Stick figures are found on every continent and most whiteboards, and are the most common species in the margins of school notebooks.<sup>[1]</sup></p>
        <p>Despite having no muscles, organs or depth, stick figures are capable of running, jumping and, according to recent reports, operating heavy weaponry.<span class="w-cn">[citation needed]</span></p>
        <div class="w-toc"><b>Contents</b><div>1 Anatomy</div><div>2 History</div><div>3 Behaviour</div><div>4 In popular culture</div><div>5 See also</div><div>6 References</div></div>
        <h2>Anatomy</h2>
        <p>The typical stick figure has a round head, a single-line torso, two arms and two legs. Hands and feet are optional and are usually omitted to save ink. Advanced specimens may develop a smile, a hat or, in rare cases, a sword.<sup>[2]</sup></p>
        <ul><li><b>Head:</b> one circle, frequently not quite closed</li><li><b>Spine:</b> perfectly straight, which explains the posture</li><li><b>Knees:</b> theoretical</li><li><b>Internal organs:</b> none observed<span class="w-cn">[citation needed]</span></li></ul>
        <h2>History</h2>
        <p>The earliest known stick figure was found on a cave wall in southern France and dates to roughly 30,000 BC. Scholars note it already looked mildly concerned.<sup>[3]</sup></p>
        <p>Stick figures flourished in the Middle Ages as placeholders in manuscripts, drawn by monks while they waited for the real artist to arrive. The real artist did not arrive. The invention of the sticky note in the 20th century gave the species a stable, if temporary, habitat.</p>
        <h2>Behaviour</h2>
        <p>Stick figures are social and are most often seen in pairs: one explaining something, the other looking confused. They communicate through speech bubbles and arrows. When threatened, a stick figure will freeze in place for the rest of its existence.</p>
        <p>They have no natural predators apart from the eraser and the phrase "can you draw it properly this time."</p>
        <h2>In popular culture</h2>
        <p>Stick figures star in countless safety leaflets, in which they slip on wet floors and get their hands caught in machinery with remarkable calm. Most recently, a stick figure was observed destroying an entire web page with a rocket launcher. The incident is under review.<span class="w-cn">[citation needed]</span></p>
        <h2>See also</h2>
        <div class="w-see"><a>Smiley face</a><a>Doodle</a><a>Matchstick (distant cousin)</a><a>Snowman (two circles, considered showy)</a></div>
        <h2>References</h2>
        <ol class="w-refs"><li>Pencil, H. B. (1998). <i>Margins and the Creatures Within</i>. Eraser Press.</li><li>"Do stick figures have elbows?" <i>Journal of Questionable Anatomy</i> 12 (4).</li><li>Ug (c. 30,000 BC). <i>Untitled wall</i>. A cave, France.</li></ol>
        <div class="w-cat">Categories: Lines · Circles · Things drawn during meetings · Articles that need more legs</div>
      </div>
      <div class="w-foot">This page was last edited 4 minutes ago by someone who should be working. Text is available under the Pretty Please License.</div>
      </div>`
    },
    {
      id: 'shop', emoji: '🛒', title: 'MegaMart Everything Sale', site: 'MegaMart',
      blurb: 'An online shop full of things nobody needs.',
      html: `<div class="wp p-shop">${chrome('megamart.example/deals/everything', 'MegaMart: Everything Sale', '🛒')}
      <div class="s-promo">🚚 FREE SHIPPING on orders over $9,999 · Returns accepted if you ask nicely</div>
      <div class="s-head"><div class="s-logo">Mega<b>Mart</b></div><div class="s-search">🔍 Search 40 million things you don't need</div><div class="s-cart">🛒 <b>3</b></div></div>
      <div class="s-cats"><span>Deals</span><span>Gadgets</span><span>Home</span><span>Socks</span><span>Air</span><span>Mystery</span></div>
      <div class="s-hero"><div><div class="s-hero-k">THIS WEEK ONLY</div><div class="s-hero-t">The Everything Sale</div><div class="s-hero-s">Up to 0% off absolutely everything.</div><span class="s-btn">Shop now</span></div><div class="s-hero-e">🛍️</div></div>
      <h2>Bestsellers</h2>
      <div class="s-grid">
        ${product('🧦', '#ffe3d1', 'Left Sock (Single)', 'Right sock sold separately', '★★★★☆', '2,301', '$12.99', '$13.00')}
        ${product('🫙', '#dff3ff', 'Jar of Pre-Owned Air', 'Breathed once, gently', '★★★★★', '88', '$24.00', '$24.01')}
        ${product('🕶️', '#e8e1ff', 'Night Vision Sunglasses', 'Total darkness, guaranteed', '★★☆☆☆', '412', '$39.99', '$40.00')}
        ${product('🪵', '#efe4d2', 'USB Stick', 'It is a stick. No USB.', '★★★☆☆', '9,120', '$7.49', '$7.50')}
        ${product('🎯', '#ffe0e6', 'Inflatable Dartboard', 'Lasts one throw', '★☆☆☆☆', '57', '$18.00', '$18.50')}
        ${product('🎳', '#e2f6e7', 'Square Bowling Ball', 'Will never roll away', '★★★★☆', '640', '$64.99', '$65.00')}
        ${product('🫖', '#f6e7d8', 'Chocolate Teapot', 'Holds tea for 4 seconds', '★★★☆☆', '1,003', '$11.50', '$12.00')}
        ${product('📕', '#ffe9b8', 'How to Read (Hardcover)', 'Reviews are mixed', '★★☆☆☆', '3', '$29.95', '$30.00')}
      </div>
      <div class="s-revs"><h3>What customers are saying</h3>
        <div class="s-rev"><span class="s-stars">★☆☆☆☆</span>The sock was left. As promised. I am furious. <b>- Dale</b></div>
        <div class="s-rev"><span class="s-stars">★★★★★</span>The air was exactly as described. I opened it and now it's gone. Would buy again. <b>- Mira</b></div>
        <div class="s-rev"><span class="s-stars">★★★☆☆</span>Square bowling ball makes a great doorstop and a terrible bowling ball. <b>- Coach Ron</b></div>
      </div>
      <div class="s-foot"><span>About MegaMart</span><span>Careers in Warehousing Air</span><span>Help</span><span>© MegaMart, we sell things</span></div>
      </div>`
    },
    {
      id: 'blog', emoji: '🍞', title: 'Gerald Has Learned to Open the Fridge', site: 'Crumbs & Thoughts',
      blurb: 'A sourdough blog that is not okay.',
      html: `<div class="wp p-blog">${chrome('crumbs-and-thoughts.example/day-412', 'Day 412 | Crumbs &amp; Thoughts', '🍞')}
      <div class="b-head"><div class="b-av">🍞</div><div><div class="b-name">Crumbs &amp; Thoughts</div><div class="b-tagline">A blog about my sourdough starter, Gerald, and our journey together</div></div></div>
      <div class="b-nav"><span>Home</span><span>About Gerald</span><span>Recipes (0)</span><span>Contact</span></div>
      <div class="b-wrap"><div class="b-post">
        <div class="b-date">MARCH 14 · 9 MIN READ · 1 MIN OF RECIPE</div>
        <h1>Day 412: Gerald Has Learned to Open the Fridge</h1>
        <div class="b-tags"><span>#sourdough</span><span>#gerald</span><span>#help</span></div>
        <p>Before we get to the recipe, I need to tell you about my grandmother's kitchen in the autumn of 1987. It smelled of cinnamon. That's it, that's the story. Anyway.</p>
        <p>As many of you know, Gerald is my sourdough starter. I have fed him flour and water twice a day for 412 days. In that time he has doubled in size, doubled again, and started making a low humming noise at night that the vet says is "not a vet thing."</p>
        <p>On Tuesday I came downstairs and the fridge door was open. The butter was gone. A trail of flour led back to Gerald's jar, which was sealed and slightly warmer than usual. He did not look at me. Starters can't look at things. And yet.</p>
        <div class="b-fig">${jarSvg}</div>
        <p>I have since installed a childproof latch. Gerald has since learned to open childproof latches. I am writing this from the garden shed, where I have the wifi password and a granola bar.</p>
        <p>People keep asking for the recipe. Honestly, it's simple. Mix flour and water, wait, and let nature take its course. Nature took its course. Nature apparently has a key to the shed now, because I can hear the door.</p>
        <div class="b-recipe"><b>The Recipe</b>1. Flour. 2. Water. 3. Do not make eye contact. 4. Run.</div>
        <p><i>Update:</i> Gerald has made a loaf. It is mostly the butter. It is honestly not bad.</p>
        <div class="b-comm"><h3>Comments (3)</h3>
          <div class="b-c"><span class="b-c-a">👩‍🍳</span><div><b>Mel_Bakes</b>I skipped to the recipe and it is just the word flour. Five stars.</div></div>
          <div class="b-c"><span class="b-c-a">👨</span><div><b>dad_of_three</b>Has Gerald tried rye? My starter Kevin loved rye. Kevin is at college now.</div></div>
          <div class="b-c"><span class="b-c-a">🫙</span><div><b>Gerald</b>blorp</div></div>
        </div>
      </div>
      <div class="b-side">
        <div class="b-box"><h4>About me</h4>Hi! I'm Brenda. I like bread, long walks, and not being followed by bread.</div>
        <div class="b-box"><h4>Gerald's mood</h4><div class="b-mood">😤</div>Bubbly. Possibly scheming.</div>
        <div class="b-box"><h4>Archive</h4><div>Day 411: Gerald is quiet today</div><div>Day 380: Gerald's 1st birthday (he ate the cake)</div><div>Day 201: Is it normal for a starter to have a pulse?</div><div>Day 1: Hello world, hello Gerald!</div></div>
      </div></div>
      <div class="b-foot">Made with love, flour and a growing sense of unease.</div>
      </div>`
    },
    {
      id: 'search', emoji: '🔎', title: 'how to stop a website from exploding', site: 'Searchly',
      blurb: 'Search results with very specific answers.',
      html: `<div class="wp p-search">${chrome('searchly.example/search?q=how+to+stop+a+website+from+exploding', 'how to stop a website from exploding', '🔎')}
      <div class="q-head"><div class="q-logo"><span style="color:#4285f4">S</span><span style="color:#ea4335">e</span><span style="color:#fbbc05">a</span><span style="color:#4285f4">r</span><span style="color:#34a853">c</span><span style="color:#ea4335">h</span><span style="color:#fbbc05">l</span><span style="color:#34a853">y</span></div><div class="q-box"><span>how to stop a website from exploding</span><span>🔍</span></div></div>
      <div class="q-tabs"><span class="on">All</span><span>Images</span><span>News</span><span>Shopping</span><span>Panic</span></div>
      <div class="q-main">
        <div class="q-count">About 4,280,000 results (0.31 seconds, plus 2 seconds of us judging you)</div>
        ${result('🛟', 'www.webhelp.example › emergencies', 'Is My Website Exploding? 7 Warning Signs', '1. The text is falling down. 2. There is a <b>small man</b> with a rocket launcher. 3. You can hear him. If you checked two or more, it is already too late.')}
        ${result('💬', 'forum.computerpeople.example › threads', 'My homepage is on fire, is this covered by hosting?', 'Posted 3 hours ago · 41 replies · Best answer: "Have you tried turning the website off and on again? Not the fire. The <b>website</b>."')}
        ${result('🚒', 'www.firedept.example › faq', 'Can firefighters put out a website? | FAQ', 'No. Please stop calling. We have asked several times. We do not have a hose for the internet.')}
        <div class="q-paa"><h3>People also ask</h3><div><span>Why is there a little guy on my website?</span><span>⌄</span></div><div><span>Can pixels feel pain?</span><span>⌄</span></div><div><span>Is 80% destroyed still a website?</span><span>⌄</span></div><div><span>How do I apologise to a web page?</span><span>⌄</span></div></div>
        ${result('⚖️', 'www.stickfigurelaw.example', 'Am I legally responsible for my stick figure?', 'Stick figures are considered <b>independent contractors</b> in most regions. If yours has acquired a flamethrower, contact a lawyer and a dentist, in that order.')}
        ${result('🧩', 'wikipedant.example › wiki › Stick_figure', 'Stick figure - Wikipedant', 'A stick figure (Homo lineolus) is a minimalist humanoid composed of one circle and between four and six lines. Habitat: margins...')}
        ${result('📰', 'news.dailyharold.example › local', 'Local Man Discovers Stairs | The Daily Harold', 'Gary Plimsoll, 41, confirmed on Monday that he had discovered a previously unknown set of stairs in his own home...')}
        ${result('🧘', 'www.calm.example › guides', 'How to Stay Calm While Everything Breaks', 'Step 1: breathe. Step 2: do not look at the website. Step 3: look at the website. Step 4: go back to step 1.')}
        <div class="q-pg"><span style="color:#4285f4">S</span><span style="color:#ea4335">e</span><span style="color:#fbbc05">a</span><span style="color:#4285f4">r</span><span style="color:#ea4335">r</span><span style="color:#fbbc05">r</span><span style="color:#34a853">r</span><span style="color:#ea4335">r</span><span style="color:#4285f4">c</span><span style="color:#34a853">h</span><span style="color:#fbbc05">l</span><span style="color:#ea4335">y</span></div>
        <div class="q-pg-n"><span style="color:#202124">1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>Next</span></div>
      </div>
      <div class="q-foot">Your location: somewhere, based on your vibes · Help · Privacy · Terms we made up</div>
      </div>`
    },
    {
      id: 'lost', emoji: '🛸', title: '404: Page Not Found', site: 'lostandfound',
      blurb: 'A missing page. Make it more missing.',
      html: `<div class="wp p-404">${chrome('www.lostandfound.example/the-page-you-wanted', '404 Not Found', '🛸')}
      <div class="e-top"><span class="e-logo">◆ lostandfound</span><span>Home</span><span>Help</span></div>
      <div class="e-hero"><div class="e-big e-b1">404</div><div class="e-big e-b2">404</div><div class="e-big e-b3">404</div></div>
      <div class="e-t">This page has wandered off.</div>
      <p class="e-s">We looked everywhere: under the couch, behind the server, inside the other server. It's not here. Honestly, it might never have existed.</p>
      <div class="e-art">${ufoSvg}</div>
      <div class="e-btns"><span class="e-btn1">Take me home</span><span class="e-btn2">Report a missing page</span></div>
      <div class="e-box"><b>Pages you might have been looking for:</b><ul><li>/the-page-you-wanted (also missing)</li><li>/that-other-thing</li><li>/home (we think)</li><li>/meaning-of-life (under construction since 1998)</li></ul></div>
      <div class="e-err">Error details: HTTP 404 · Reason: page.exe has stopped believing in itself · Request ID: 7F3-OOPS-42</div>
      <div class="e-foot">© lostandfound · System status: everything is fine 🔥</div>
      </div>`
    }
  ];

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function ownPage(text) {
    const clean = String(text || '').replace(/\r/g, '').slice(0, 6000).trim();
    const lines = clean.split('\n');
    let title = (lines[0] || '').trim();
    let rest = lines.slice(1).join('\n').trim();
    if (title.length > 90 || !rest) { title = 'My Very Important Page'; rest = clean; }
    const paras = rest.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean).slice(0, 60);
    const body = paras.map((p) => `<p>${esc(p)}</p>`).join('');
    return {
      id: 'own', emoji: '✍️', title, site: 'Your page',
      html: `<div class="wp p-own">${chrome('www.your-page.example/very-important', esc(title), '✍️')}
      <div class="o-head"><b>✍️ My Website</b><span>Home · About · Guestbook</span></div>
      <div class="o-art"><h1>${esc(title)}</h1><div class="o-meta">Posted just now · ${clean.split(/\s+/).length} words · 0 comments</div>${body}</div>
      <div class="o-foot">Hand-typed with care. About to be destroyed with less care.</div>
      </div>`
    };
  }

  Object.assign(window.WTP = window.WTP || {}, { pages, css, ownPage });
})();
