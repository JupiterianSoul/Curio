(function () {
  const WTPx = window.WTP;
  const chrome = (url, tab, icon) => `
  <div class="wc">
    <div class="wc-tabs"><span class="wc-dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></span><span class="wc-tab">${icon} ${tab}</span><span class="wc-plus">+</span></div>
    <div class="wc-bar"><span class="wc-nav">&#8592; &#8594; &#8635;</span><span class="wc-url">&#128274; ${url}</span><span class="wc-menu">&#8942;</span></div>
  </div>`;

  const pigSvg = `<svg viewBox="0 0 220 150" width="220" height="150" xmlns="http://www.w3.org/2000/svg">
    <rect width="220" height="150" fill="#e8f1ff"/>
    <ellipse cx="110" cy="88" rx="70" ry="48" fill="#ff9fc0"/>
    <circle cx="160" cy="80" r="26" fill="#ff9fc0"/>
    <ellipse cx="176" cy="86" rx="12" ry="9" fill="#ff7aa8"/>
    <circle cx="172" cy="85" r="2.5" fill="#6b2140"/><circle cx="180" cy="85" r="2.5" fill="#6b2140"/>
    <circle cx="156" cy="70" r="4" fill="#3a1a2a"/>
    <path d="M140 52 l8 -14 l8 16z" fill="#ff7aa8"/>
    <rect x="70" y="124" width="14" height="18" rx="4" fill="#ff7aa8"/><rect x="130" y="124" width="14" height="18" rx="4" fill="#ff7aa8"/>
    <rect x="96" y="40" width="34" height="7" rx="3" fill="#6b2140"/>
    <circle cx="113" cy="22" r="13" fill="#ffd34d" stroke="#d9a400" stroke-width="3"/>
    <path d="M44 84 q-18 -6 -10 -20" stroke="#ff7aa8" stroke-width="5" fill="none"/>
  </svg>`;
  const sealSvg = `<svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="56" fill="#2f4d7a"/><circle cx="60" cy="60" r="46" fill="none" stroke="#e8d38a" stroke-width="4" stroke-dasharray="4 5"/>
    <rect x="34" y="40" width="52" height="40" fill="#f3ead2"/><path d="M40 50 h40 M40 58 h34 M40 66 h38 M40 74 h22" stroke="#2f4d7a" stroke-width="3"/>
    <circle cx="78" cy="76" r="10" fill="#c43b2b"/><path d="M78 70 l3 6 h-6z" fill="#f3ead2"/>
  </svg>`;
  const albumSvg = (a, b, c) => `<svg viewBox="0 0 80 80" width="80" height="80" xmlns="http://www.w3.org/2000/svg"><rect width="80" height="80" fill="${a}"/><circle cx="40" cy="40" r="24" fill="${b}"/><rect x="10" y="56" width="60" height="10" fill="${c}"/><circle cx="40" cy="40" r="6" fill="${a}"/></svg>`;
  const targetSvg = `<svg viewBox="0 0 120 120" width="120" height="120" xmlns="http://www.w3.org/2000/svg"><circle cx="60" cy="60" r="56" fill="#e8484f"/><circle cx="60" cy="60" r="42" fill="#fff8f0"/><circle cx="60" cy="60" r="28" fill="#e8484f"/><circle cx="60" cy="60" r="14" fill="#fff8f0"/><circle cx="60" cy="60" r="6" fill="#e8484f"/></svg>`;

  const css = `
  .p-bank { background: #f2f6fc; color: #10233f; font-family: Verdana, "DejaVu Sans", Arial, sans-serif; }
  .bk-top { display: flex; justify-content: space-between; align-items: center; background: #0f3d7a; color: #fff; padding: 14px 24px; }
  .bk-logo { font-weight: 800; font-size: 22px; letter-spacing: -0.5px; } .bk-logo span { color: #ffb3d1; }
  .bk-nav { display: flex; gap: 16px; font-size: 12px; opacity: .9; flex-wrap: wrap; }
  .bk-alert { background: #fff4c2; color: #6b5300; padding: 8px 24px; font-size: 12px; border-bottom: 1px solid #e8d48a; }
  .bk-hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; padding: 24px; }
  .nw .bk-hero { grid-template-columns: 1fr; padding: 14px; }
  .bk-hero h1 { font-size: 30px; line-height: 1.15; color: #0f3d7a; margin-bottom: 10px; }
  .bk-hero p { font-size: 14px; color: #3c5274; }
  .bk-login { background: #fff; border-radius: 14px; padding: 18px; box-shadow: 0 6px 20px rgba(15,61,122,.15); border: 1px solid #d5e1f2; }
  .bk-login h2 { font-size: 18px; margin-bottom: 12px; }
  .bk-field { display: block; border: 2px solid #b8c9e4; border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #7a8aa6; margin-bottom: 10px; background: #f8fbff; }
  .bk-btn { display: block; background: #e2376f; color: #fff; text-align: center; font-weight: 800; padding: 11px; border-radius: 8px; font-size: 15px; margin-top: 4px; }
  .bk-small { font-size: 11px; color: #6c7d99; margin-top: 10px; }
  .bk-art { text-align: center; padding-top: 6px; }
  .bk-rates { margin: 0 24px 20px; background: #fff; border-radius: 12px; border: 1px solid #d5e1f2; overflow: hidden; }
  .nw .bk-rates { margin: 0 12px 14px; }
  .bk-rates h3 { background: #e9f0fb; padding: 10px 14px; font-size: 15px; }
  .bk-row { display: flex; justify-content: space-between; padding: 9px 14px; border-top: 1px solid #edf2fa; font-size: 13px; }
  .bk-row b { color: #0f3d7a; }
  .bk-tips { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 0 24px 20px; }
  .nw .bk-tips { grid-template-columns: 1fr; margin: 0 12px 14px; }
  .bk-tip { background: #0f3d7a; color: #e8f1ff; border-radius: 12px; padding: 14px; font-size: 12px; }
  .bk-tip b { display: block; font-size: 15px; color: #ffb3d1; margin-bottom: 4px; }
  .bk-foot { background: #0b2b57; color: #9fb5d8; font-size: 11px; padding: 16px 24px; }

  .p-gov { background: #e9e4d6; color: #222; font-family: "Courier New", "Liberation Mono", monospace; }
  .gv-band { background: #2f4d7a; color: #f3ead2; padding: 10px 24px; display: flex; align-items: center; gap: 14px; font-family: Georgia, "Liberation Serif", serif; }
  .gv-band b { font-size: 20px; letter-spacing: 1px; } .gv-band small { display: block; font-size: 12px; opacity: .8; }
  .gv-crumb { padding: 8px 24px; font-size: 12px; color: #555; }
  .gv-paper { background: #fbf8ee; margin: 6px 24px 20px; padding: 22px 26px; border: 1px solid #c9bfa3; box-shadow: 4px 4px 0 #cfc5aa; position: relative; }
  .nw .gv-paper { margin: 6px 10px 14px; padding: 16px 14px; }
  .gv-paper h1 { font-family: Georgia, "Liberation Serif", serif; font-size: 26px; margin-bottom: 4px; }
  .gv-form-n { font-size: 12px; color: #7a6f55; margin-bottom: 14px; }
  .gv-stamp { position: absolute; right: 24px; top: 20px; border: 4px solid #c43b2b; color: #c43b2b; font-weight: 900; font-size: 20px; padding: 4px 10px; transform: rotate(-12deg); letter-spacing: 2px; font-family: Impact, "Arial Black", sans-serif; }
  .nw .gv-stamp { font-size: 14px; right: 10px; }
  .gv-sec { border-top: 2px solid #2f4d7a; margin-top: 16px; padding-top: 10px; }
  .gv-sec h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #2f4d7a; margin-bottom: 8px; }
  .gv-f { display: grid; grid-template-columns: 180px 1fr; gap: 8px; align-items: center; margin-bottom: 7px; font-size: 13px; }
  .nw .gv-f { grid-template-columns: 1fr; gap: 2px; }
  .gv-box { border: 1px solid #8a8066; background: #fff; height: 24px; padding: 3px 8px; font-size: 12px; color: #9a917a; }
  .gv-chk { font-size: 13px; margin: 5px 0; } .gv-chk span { display: inline-block; width: 13px; height: 13px; border: 1px solid #333; margin-right: 8px; vertical-align: -2px; background: #fff; }
  .gv-fine { font-size: 10px; color: #6a614c; line-height: 1.5; margin-top: 12px; }
  .gv-sig { display: flex; gap: 20px; margin-top: 14px; font-size: 12px; } .gv-sig div { flex: 1; border-bottom: 1px solid #333; padding-top: 22px; }
  .gv-btns { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
  .gv-btn { border: 2px outset #d6d0bf; background: #ece6d4; padding: 6px 14px; font-size: 13px; }
  .gv-foot { text-align: center; font-size: 11px; color: #6a614c; padding: 0 20px 20px; }

  .p-forum { background: #dfe4ea; color: #1d2733; font-family: Tahoma, Verdana, "DejaVu Sans", sans-serif; font-size: 13px; }
  .fm-head { background: linear-gradient(#4a6a8c, #2c4763); color: #fff; padding: 14px 20px; }
  .fm-head b { font-size: 22px; } .fm-head small { display: block; opacity: .8; font-size: 12px; }
  .fm-bar { background: #c9d2dc; padding: 6px 20px; font-size: 12px; display: flex; gap: 14px; flex-wrap: wrap; color: #2c4763; font-weight: bold; }
  .fm-thread { margin: 14px 20px 6px; font-size: 18px; font-weight: bold; color: #2c4763; }
  .nw .fm-thread { margin: 10px 10px 6px; }
  .fm-post { display: grid; grid-template-columns: 130px 1fr; margin: 0 20px 10px; background: #f6f8fa; border: 1px solid #b7c2ce; }
  .nw .fm-post { grid-template-columns: 1fr; margin: 0 8px 8px; }
  .fm-user { background: #e7ecf1; padding: 10px; border-right: 1px solid #b7c2ce; font-size: 11px; color: #4a5a6c; }
  .fm-user b { display: block; font-size: 13px; color: #2c4763; } .fm-av { font-size: 30px; display: block; margin: 4px 0; }
  .fm-rank { display: inline-block; background: #2c4763; color: #fff; padding: 1px 6px; border-radius: 3px; font-size: 10px; margin-top: 4px; }
  .fm-body { padding: 10px 14px; line-height: 1.55; } .fm-body p { margin-bottom: 8px; }
  .fm-date { font-size: 11px; color: #7a8796; border-bottom: 1px dotted #b7c2ce; padding-bottom: 4px; margin-bottom: 8px; }
  .fm-quote { background: #fffbe0; border: 1px solid #e3d78c; padding: 6px 10px; margin-bottom: 8px; font-size: 12px; }
  .fm-sig { border-top: 1px solid #cdd5de; margin-top: 8px; padding-top: 6px; font-size: 11px; color: #7a8796; font-style: italic; }
  .fm-reply { margin: 6px 20px 20px; display: flex; gap: 8px; } .nw .fm-reply { margin: 6px 8px 14px; }
  .fm-reply span { background: #2c4763; color: #fff; padding: 7px 14px; border-radius: 4px; font-weight: bold; }
  .fm-foot { text-align: center; font-size: 11px; color: #5a6878; padding-bottom: 18px; }

  .p-music { background: #121016; color: #eee9f5; font-family: "Trebuchet MS", "DejaVu Sans", Arial, sans-serif; }
  .mu-top { display: flex; justify-content: space-between; align-items: center; padding: 14px 22px; }
  .mu-logo { font-weight: 900; font-size: 22px; color: #6fe3a1; } .mu-me { background: #2a2433; border-radius: 999px; padding: 6px 14px; font-size: 12px; }
  .mu-hero { display: flex; gap: 20px; align-items: flex-end; padding: 22px; background: linear-gradient(#5a2a86, #121016); }
  .nw .mu-hero { flex-direction: column; align-items: flex-start; padding: 14px; }
  .mu-cover { width: 150px; height: 150px; background: #ff5fa2; display: grid; place-items: center; font-size: 66px; box-shadow: 0 10px 30px rgba(0,0,0,.5); }
  .mu-hero small { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; } .mu-hero h1 { font-size: 40px; line-height: 1; margin: 6px 0; }
  .nw .mu-hero h1 { font-size: 28px; }
  .mu-hero p { font-size: 13px; color: #c9bfd8; }
  .mu-ctrl { display: flex; gap: 14px; align-items: center; padding: 14px 22px; }
  .mu-play { width: 50px; height: 50px; border-radius: 50%; background: #6fe3a1; color: #121016; display: grid; place-items: center; font-size: 20px; font-weight: 900; }
  .mu-row { display: grid; grid-template-columns: 30px 1fr 1fr 60px; gap: 10px; padding: 8px 22px; font-size: 13px; color: #c9bfd8; border-radius: 6px; }
  .nw .mu-row { grid-template-columns: 24px 1fr 50px; } .nw .mu-row .mu-al { display: none; }
  .mu-row b { color: #fff; display: block; font-weight: normal; } .mu-row:nth-child(odd) { background: #1a1620; }
  .mu-head { color: #8a809a; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #2a2433; }
  .mu-albums { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 18px 22px; }
  .nw .mu-albums { grid-template-columns: repeat(2, 1fr); padding: 12px; }
  .mu-al2 { background: #1d1924; border-radius: 8px; padding: 10px; font-size: 12px; } .mu-al2 b { display: block; font-size: 13px; margin-top: 6px; } .mu-al2 svg { width: 100%; height: auto; display: block; border-radius: 4px; }
  .mu-player { display: flex; align-items: center; gap: 14px; background: #1d1924; border-top: 1px solid #2a2433; padding: 12px 22px; font-size: 12px; }
  .mu-prog { flex: 1; height: 6px; background: #3a3344; border-radius: 3px; position: relative; } .mu-prog i { position: absolute; left: 0; top: 0; bottom: 0; width: 37%; background: #6fe3a1; border-radius: 3px; }

  .p-curio { background: #fbf7f0; color: #1d1b19; font-family: "Trebuchet MS", "DejaVu Sans", Arial, sans-serif; }
  .cu-top { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; border-bottom: 1px solid #e8e0d2; }
  .cu-logo { font-weight: 900; font-size: 20px; } .cu-logo span { display: inline-block; width: 26px; height: 26px; border-radius: 50%; background: #ff5a36; color: #fff; text-align: center; line-height: 26px; margin-right: 6px; }
  .cu-hero { text-align: center; padding: 26px 20px 12px; } .cu-hero h1 { font-size: 40px; line-height: 1.05; } .nw .cu-hero h1 { font-size: 30px; }
  .cu-hero p { color: #6b6255; font-size: 15px; margin-top: 8px; }
  .cu-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 16px 24px 24px; }
  .nw .cu-grid { grid-template-columns: repeat(2, 1fr); padding: 12px; gap: 10px; }
  .cu-card { border-radius: 16px; overflow: hidden; background: #fff; border: 1px solid #e8e0d2; box-shadow: 0 3px 0 #e8e0d2; }
  .cu-art { height: 90px; display: grid; place-items: center; font-size: 44px; }
  .cu-card b { display: block; padding: 8px 12px 0; font-size: 15px; } .cu-card small { display: block; padding: 2px 12px 12px; color: #7a7064; font-size: 12px; }
  .cu-here { outline: 4px dashed #ff5a36; outline-offset: -4px; }
  .cu-foot { text-align: center; color: #8a8072; font-size: 12px; padding: 0 20px 22px; }

  .p-tos { background: #ffffff; color: #333; font-family: Georgia, "Liberation Serif", serif; }
  .ts-top { background: #f4f4f4; border-bottom: 1px solid #ddd; padding: 12px 26px; font-family: Arial, "Liberation Sans", sans-serif; font-size: 13px; color: #666; display: flex; justify-content: space-between; }
  .ts-body { padding: 24px 40px 10px; } .nw .ts-body { padding: 16px 16px 6px; }
  .ts-body h1 { font-size: 30px; margin-bottom: 4px; } .ts-upd { font-size: 12px; color: #888; margin-bottom: 18px; font-family: Arial, "Liberation Sans", sans-serif; }
  .ts-body h2 { font-size: 17px; margin: 18px 0 6px; } .ts-body p { font-size: 14px; line-height: 1.7; text-align: justify; }
  .ts-caps { text-transform: uppercase; font-size: 12px !important; letter-spacing: .3px; }
  .ts-agree { display: flex; gap: 12px; justify-content: center; padding: 18px 20px 26px; font-family: Arial, "Liberation Sans", sans-serif; }
  .ts-agree span { padding: 10px 22px; border-radius: 6px; font-weight: bold; } .ts-yes { background: #2f6fde; color: #fff; } .ts-no { background: #eee; color: #999; font-size: 11px; }

  .p-status { background: #f6f8f7; color: #1d2a24; font-family: "Segoe UI", "DejaVu Sans", Arial, sans-serif; }
  .st-top { display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; background: #fff; border-bottom: 1px solid #dfe6e2; font-size: 18px; }
  .st-sub { background: #2f8a4f; color: #fff; padding: 8px 14px; border-radius: 6px; font-size: 14px; font-weight: 700; }
  .st-ban { margin: 20px 22px 8px; background: #2f8a4f; color: #fff; font-size: 24px; font-weight: 800; padding: 18px 20px; border-radius: 8px; }
  .st-note { margin: 0 22px 16px; font-size: 13px; color: #5b6b63; }
  .st-list { margin: 0 22px; background: #fff; border: 1px solid #dfe6e2; border-radius: 8px; }
  .st-svc { display: grid; grid-template-columns: 110px 1fr 100px; gap: 4px 12px; align-items: center; padding: 12px 14px; border-bottom: 1px solid #edf1ef; }
  .st-svc small { grid-column: 2 / 4; color: #7a8a82; font-size: 12px; }
  .st-bars { display: flex; gap: 2px; }
  .st-bars i { flex: 1; height: 22px; background: #3fb468; border-radius: 2px; }
  .st-bars i.st-bx { background: #e8a33a; }
  .st-svc em { font-style: normal; font-weight: 700; font-size: 13px; text-align: right; }
  .st-ok { color: #2f8a4f; }
  .st-warn { color: #c77a12; }
  .st-bad { color: #d23a3a; }
  .st-h { margin: 24px 22px 10px; font-size: 22px; }
  .st-inc { margin: 0 22px 12px; background: #fff; border-left: 5px solid #e8a33a; padding: 12px 14px; border-radius: 4px; }
  .st-inc b { font-size: 16px; }
  .st-inc p { margin: 6px 0; font-size: 14px; }
  .st-inc small { color: #7a8a82; }
  .st-foot { text-align: center; color: #7a8a82; font-size: 12px; padding: 20px; }
  .nw .st-svc { grid-template-columns: 80px 1fr 80px; }
  .p-jobs { background: #eef1f4; color: #1b2430; font-family: "Segoe UI", "DejaVu Sans", Arial, sans-serif; }
  .jb-top { background: #fff; padding: 10px 22px; display: flex; align-items: center; gap: 16px; border-bottom: 1px solid #dde3ea; }
  .jb-logo { background: #0a66c2; color: #fff; font-weight: 900; padding: 2px 8px; border-radius: 4px; font-size: 18px; }
  .jb-srch { flex: 1; background: #eef3f8; border-radius: 4px; padding: 7px 10px; font-size: 12px; color: #6a7686; }
  .jb-wrap { display: grid; grid-template-columns: 220px 1fr; gap: 16px; padding: 16px 22px; } .nw .jb-wrap { grid-template-columns: 1fr; padding: 10px; }
  .jb-me { background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #dde3ea; text-align: center; font-size: 12px; padding-bottom: 12px; }
  .jb-ban { height: 54px; background: linear-gradient(90deg, #0a66c2, #6fb3ff); } .jb-av { font-size: 44px; margin-top: -26px; }
  .jb-me b { display: block; font-size: 16px; } .jb-me small { color: #6a7686; display: block; padding: 0 10px; }
  .jb-skill { display: inline-block; background: #e3f0ff; color: #0a66c2; border-radius: 999px; padding: 2px 8px; margin: 3px; font-size: 11px; }
  .jb-job { background: #fff; border: 1px solid #dde3ea; border-radius: 10px; padding: 14px; margin-bottom: 10px; display: flex; gap: 12px; }
  .jb-co { width: 48px; height: 48px; border-radius: 8px; display: grid; place-items: center; font-size: 24px; flex: none; }
  .jb-job b { font-size: 15px; color: #0a66c2; display: block; } .jb-job small { color: #6a7686; display: block; } .jb-job p { font-size: 13px; margin: 6px 0 0; }
  .jb-apply { display: inline-block; margin-top: 8px; background: #0a66c2; color: #fff; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }
  .jb-foot { text-align: center; color: #6a7686; font-size: 11px; padding-bottom: 18px; }

  .p-range { background: #2b2238; color: #fff8f0; font-family: "Courier New", "Liberation Mono", monospace; }
  .fr-head { background: #e8484f; color: #fff8f0; padding: 12px 20px; font-weight: 900; font-size: 22px; letter-spacing: 2px; display: flex; justify-content: space-between; }
  .fr-row { display: flex; gap: 14px; padding: 14px 20px; align-items: center; flex-wrap: wrap; }
  .fr-block { background: #fff8f0; color: #2b2238; padding: 10px 14px; font-weight: 900; font-size: 22px; border-radius: 4px; }
  .fr-glass { background: #8fe3ff; color: #1d2b5e; padding: 10px 18px; border-radius: 8px; font-weight: 900; }
  .fr-text { font-size: 15px; line-height: 1.6; padding: 0 20px 12px; color: #e2dcea; }
  .fr-big { font-size: 64px; font-weight: 900; padding: 4px 20px; color: #ffe066; letter-spacing: 4px; }
  .fr-wall { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; padding: 10px 20px 20px; } .nw .fr-wall { grid-template-columns: repeat(5, 1fr); }
  .fr-wall span { height: 30px; background: #a8303f; border-radius: 3px; } .fr-wall span:nth-child(3n) { background: #8a5a3a; } .fr-wall span:nth-child(5n) { background: #5c5270; }
  `;

  const post = (av, user, rank, posts, date, body, sig) => `<div class="fm-post"><div class="fm-user"><b>${user}</b><span class="fm-av">${av}</span>Posts: ${posts}<br><span class="fm-rank">${rank}</span></div><div class="fm-body"><div class="fm-date">${date}</div>${body}${sig ? `<div class="fm-sig">${sig}</div>` : ''}</div></div>`;
  const track = (n, t, a, al, len) => `<div class="mu-row"><span>${n}</span><span><b>${t}</b>${a}</span><span class="mu-al">${al}</span><span>${len}</span></div>`;
  const game = (bg, e, t, s, here) => `<div class="cu-card${here ? ' cu-here' : ''}"><div class="cu-art" style="background:${bg}">${e}</div><b>${t}</b><small>${s}</small></div>`;
  const job = (bg, e, t, co, where, p) => `<div class="jb-job"><div class="jb-co" style="background:${bg}">${e}</div><div><b>${t}</b><small>${co} · ${where}</small><p>${p}</p><span class="jb-apply" data-glass>Easy Apply</span></div></div>`;

  const extra = [
    {
      id: 'bank', emoji: '🐷', title: 'Sign in to Online Banking', site: 'Piggy National Bank', theme: '#0f3d7a',
      blurb: 'Your savings, behind one very breakable login box.',
      html: `<div class="wp p-bank">${chrome('secure.piggynational.example/login', 'Piggy National Bank: Sign in', '🐷')}
      <div class="bk-top"><span class="bk-logo">Piggy<span>National</span></span><span class="bk-nav"><span>Personal</span><span>Business</span><span>Loans</span><span>Help</span><span>Locations</span></span></div>
      <div class="bk-alert">⚠️ Security notice: we will never ask for your password by email, text, carrier pigeon or interpretive dance.</div>
      <div class="bk-hero">
        <div>
          <h1>Banking so safe, even we can't get in.</h1>
          <p>Welcome to Piggy National, proudly guarding your money since the invention of the coin slot. Our vault is protected by three locks, two guards, and one extremely suspicious pig named Gerald.</p>
          <div class="bk-art">${pigSvg}</div>
        </div>
        <div class="bk-login">
          <h2>Sign in</h2>
          <span class="bk-field" data-glass>Username</span>
          <span class="bk-field" data-glass>Password (minimum 46 characters, one emoji, no vowels)</span>
          <span class="bk-field" data-glass>Mother's maiden name's favourite colour</span>
          <span class="bk-btn" data-glass>Sign in securely</span>
          <div class="bk-small">Forgot your password? So did we. Please visit any branch with two forms of ID and a sincere apology.</div>
          <div class="bk-small">🔒 Protected by 256-bit encryption and a very tall fence.</div>
        </div>
      </div>
      <div class="bk-rates"><h3>Today's rates</h3>
        <div class="bk-row"><span>Savings account</span><b>0.01% (we rounded up)</b></div>
        <div class="bk-row"><span>Piggy Premium Savings</span><b>0.02% plus a sticker</b></div>
        <div class="bk-row"><span>Overdraft fee</span><b>Your firstborn's lunch money</b></div>
        <div class="bk-row"><span>Mortgage (30 years)</span><b>Yes</b></div>
        <div class="bk-row"><span>Coin counting</span><b>Free if you count them yourself</b></div>
      </div>
      <div class="bk-tips">
        <div class="bk-tip"><b>Tip #1</b>Never share your PIN. Not even with the pig. Especially not with the pig.</div>
        <div class="bk-tip"><b>Tip #2</b>Our website will never explode. If this website is exploding, please stay calm and keep your hands inside the browser.</div>
        <div class="bk-tip"><b>Tip #3</b>A strong password is long, random and impossible to remember. Write it on a sticky note under your keyboard like everyone else.</div>
      </div>
      <div class="bk-foot">Piggy National Bank, member FDIP (Federal Deposit Insurance for Piggies). Equal oink lender. © All rights reserved, some rights misplaced.</div>
      </div>`
    },
    {
      id: 'gov', emoji: '🏛️', title: 'Form 27-B: Application to Apply', site: 'Department of Forms', theme: '#2f4d7a',
      blurb: 'Government paperwork. Thrilling. Flammable.',
      html: `<div class="wp p-gov">${chrome('www.dept-of-forms.example/form-27b', 'Form 27-B (Revised, Revised)', '🏛️')}
      <div class="gv-band">${sealSvg.replace('width="120" height="120"', 'width="54" height="54"')}<div><b>DEPARTMENT OF FORMS</b><small>Office of Paperwork Reduction Paperwork</small></div></div>
      <div class="gv-crumb">Home › Services › Forms › Forms About Forms › Form 27-B</div>
      <div class="gv-paper">
        <div class="gv-stamp">PENDING</div>
        <h1>Application to Apply</h1>
        <div class="gv-form-n">FORM 27-B (REV. 14) · Please complete in black ink, blue ink, or a pencil you feel strongly about.</div>
        <div class="gv-sec"><h2>Section 1: Applicant</h2>
          <div class="gv-f"><span>Full legal name</span><span class="gv-box" data-glass>As it appears on Form 12-C</span></div>
          <div class="gv-f"><span>Name you actually go by</span><span class="gv-box" data-glass>Optional but appreciated</span></div>
          <div class="gv-f"><span>Date of birth</span><span class="gv-box" data-glass>DD / MM / YYYY / mood</span></div>
          <div class="gv-f"><span>Reason for applying</span><span class="gv-box" data-glass>To apply</span></div>
        </div>
        <div class="gv-sec"><h2>Section 2: Declarations</h2>
          <div class="gv-chk"><span></span>I declare that I have read the declaration.</div>
          <div class="gv-chk"><span></span>I am not currently applying to apply elsewhere.</div>
          <div class="gv-chk"><span></span>I understand that this form will be reviewed within 6 to 600 business days.</div>
          <div class="gv-chk"><span></span>I have attached a recent photograph of myself holding this form.</div>
          <div class="gv-chk"><span></span>I am not a small stick figure planning to destroy this page.</div>
        </div>
        <div class="gv-sec"><h2>Section 3: Office use only</h2>
          <div class="gv-f"><span>Received by</span><span class="gv-box">Clerk 7 (on lunch)</span></div>
          <div class="gv-f"><span>Stamped by</span><span class="gv-box">Clerk 9 (stamp is out of ink)</span></div>
          <div class="gv-f"><span>Outcome</span><span class="gv-box">Please see Form 27-C</span></div>
        </div>
        <div class="gv-sig"><div>Signature of applicant</div><div>Signature of witness</div><div>Signature of witness's witness</div></div>
        <div class="gv-btns"><span class="gv-btn" data-glass>Submit</span><span class="gv-btn" data-glass>Save draft</span><span class="gv-btn" data-glass>Print, sign, scan, fax</span><span class="gv-btn" data-glass>Start over (recommended)</span></div>
        <div class="gv-fine">Under the Paperwork Reduction Act of Paperwork, we are required to tell you that this form takes approximately 14 minutes to complete, not including the 3 hours spent finding a pen. Incomplete forms will be returned with a new form explaining why the first form was incomplete. Forms submitted on a Tuesday will be considered to have been submitted on the following Tuesday. The Department reserves the right to lose this form at any point. Form 27-B supersedes Form 27-A except where Form 27-A supersedes Form 27-B.</div>
      </div>
      <div class="gv-foot">Department of Forms · Open Monday to Friday, 10:00 to 10:15 · Accessibility statement (Form 3-A)</div>
      </div>`
    },
    {
      id: 'forum', emoji: '💬', title: 'Is it safe to delete System32? (help)', site: 'ComputerPeople Forums', theme: '#2c4763',
      blurb: 'A help thread where nobody helps.',
      html: `<div class="wp p-forum">${chrome('forum.computerpeople.example/t/is-it-safe-to-delete-system32', 'Is it safe to delete... - ComputerPeople', '💬')}
      <div class="fm-head"><b>ComputerPeople Forums</b><small>Helping people with computers since the computers helped themselves</small></div>
      <div class="fm-bar"><span>Home</span><span>Hardware</span><span>Software</span><span>Off-topic</span><span>Members</span><span>Rules (please read)</span></div>
      <div class="fm-thread">Is it safe to delete System32? (help) (urgent) (please)</div>
      ${post('🐢', 'slow_turtle_44', 'New Member', 3, 'Posted Today, 09:14', '<p>Hi all, my computer is running slow and a friend said I should delete System32 to make it faster. Is this safe? It is asking me for permission and I do not know what that means. Thank you in advance.</p>', 'sent from my computer (for now)')}
      ${post('🧙', 'TheRealSysAdmin', 'Moderator', '48,211', 'Posted Today, 09:16', '<p>Please do not do that.</p><p>Also, please use the search function, this has been asked 9,000 times.</p>', 'Have you tried turning it off and on again? Have you tried leaving it off?')}
      ${post('🦊', 'xX_FoxFire_Xx', 'Senior Member', '6,002', 'Posted Today, 09:21', '<div class="fm-quote"><b>TheRealSysAdmin wrote:</b> Please do not do that.</div><p>first</p><p>also, it worked for my cousin. his computer is now very fast at doing nothing.</p>', '')}
      ${post('🦉', 'actually_um', 'Pedant', '22,940', 'Posted Today, 09:30', '<p>Actually, technically, the folder name is capitalised, and you would also need administrator rights, and also it is 2026, why are you even asking this on a forum, and also I have ranked my favourite file systems in a 14 page document which I will now link in every reply.</p>', 'This post was edited 41 times. Last edit: fixed a comma.')}
      ${post('🐢', 'slow_turtle_44', 'New Member', 4, 'Posted Today, 10:02', '<p>Update: I deleted it. The computer is very quiet now. The screen is a nice blue colour. Is that normal? Marking as solved.</p>', 'sent from my phone (computer is resting)')}
      ${post('🧍', 'stick_dude', 'Lurker', 1, 'Posted Today, 10:03', '<p>if you think deleting a folder is a lot, watch this</p>', '')}
      <div class="fm-reply"><span data-glass>Post Reply</span><span data-glass>Quote</span><span data-glass>Report</span></div>
      <div class="fm-foot">Powered by ForumWare 2.0.0.1 beta · All times are GMT minus vibes · 1,204 users online (1,203 lurking)</div>
      </div>`
    },
    {
      id: 'music', emoji: '🎧', title: 'Songs to Destroy Websites To', site: 'Spotlite', theme: '#5a2a86',
      blurb: 'A playlist with way too many bangers.',
      html: `<div class="wp p-music">${chrome('open.spotlite.example/playlist/destroy-mix', 'Songs to Destroy Websites To', '🎧')}
      <div class="mu-top"><span class="mu-logo">● Spotlite</span><span class="mu-me">👤 stick_dude</span></div>
      <div class="mu-hero"><div class="mu-cover">💥</div><div><small>Public playlist</small><h1>Songs to Destroy Websites To</h1><p>The official soundtrack of pressing buttons you shouldn't. Made by stick_dude · 1,337 likes · 24 songs, about 1 hr 12 min</p></div></div>
      <div class="mu-ctrl"><span class="mu-play" data-glass>▶</span><span>♡</span><span>⇄</span><span>⋯</span></div>
      <div class="mu-row mu-head"><span>#</span><span>Title</span><span class="mu-al">Album</span><span>Time</span></div>
      ${track(1, 'Ctrl Alt Delete My Heart', 'The Keyboard Warriors', 'Shortcuts', '3:14')}
      ${track(2, 'Error 404 (Love Not Found)', 'Broken Links', 'Page Unavailable', '2:59')}
      ${track(3, 'Cookies (Accept All)', 'Banner Ads', 'Terms Apply', '3:41')}
      ${track(4, 'Pixel By Pixel', 'Lo-Res Lovers', '8 Bit Hearts', '4:02')}
      ${track(5, 'Scroll Forever', 'Infinite Feed', 'Doom', '9:99')}
      ${track(6, 'Buffering...', 'The Spinners', 'Loading', '0:00')}
      ${track(7, 'Have You Tried Turning It Off', 'IT Crowd Pleasers', 'Support Ticket', '2:45')}
      ${track(8, 'Clear Cache, Clear Mind', 'DJ Refresh', 'F5', '3:33')}
      ${track(9, 'Kaboom (Radio Edit)', 'Stick Dude ft. Grenade', 'Destruction', '1:58')}
      <div class="mu-albums">
        <div class="mu-al2">${albumSvg('#ff5fa2', '#ffe066', '#1a1226')}<b>Page Unavailable</b>Broken Links</div>
        <div class="mu-al2">${albumSvg('#20a39e', '#fff8f0', '#5b2a86')}<b>8 Bit Hearts</b>Lo-Res Lovers</div>
        <div class="mu-al2">${albumSvg('#ff7f3f', '#1a1226', '#ffe066')}<b>Destruction</b>Stick Dude</div>
        <div class="mu-al2">${albumSvg('#2f5bb7', '#8fe3ff', '#fff8f0')}<b>F5</b>DJ Refresh</div>
      </div>
      <div class="mu-player"><span>⏮</span><span>⏯</span><span>⏭</span><span><b>Kaboom (Radio Edit)</b></span><span class="mu-prog"><i></i></span><span>0:43</span></div>
      </div>`
    },
    {
      id: 'curio', emoji: '✦', title: 'Curiouser: small toys for big boredom', site: 'Curiouser', theme: '#ff5a36',
      blurb: 'A hub of games, suspiciously familiar.',
      html: `<div class="wp p-curio">${chrome('curiouser.example', 'Curiouser', '✦')}
      <div class="cu-top"><span class="cu-logo"><span>✦</span>Curiouser</span><span>🔊 🌙 🎲</span></div>
      <div class="cu-hero"><h1>Small toys for big boredom.</h1><p>Hand-made web games, toys and experiments. No sign-up, no ads, no reason. Pick one!</p></div>
      <div class="cu-grid">
        ${game('#ffd34d', '🧮', 'Count to a Million', 'It takes eleven days. We timed it.')}
        ${game('#9fd3ec', '🐟', 'How Deep Is the Puddle', 'Scroll down. Keep scrolling. Fish.')}
        ${game('#c3f07a', '🪴', 'Grow a Plant (Slowly)', 'Real time. Very real time.')}
        ${game('#ffb3d9', '🎈', 'Pop Every Balloon', 'There are 4,000. You have a mouse.')}
        ${game('#272727', '💥', 'Wreck This Page', 'You are here. Sorry about the mess.', true)}
        ${game('#d07bff', '🔮', 'Ask the Orb', 'It says maybe. It always says maybe.')}
        ${game('#ff7f3f', '🧱', 'Stack the Bricks', 'Physics was a mistake.')}
        ${game('#8fe3ff', '❄️', 'Snowflake Maker', 'No two alike. Mostly.')}
        ${game('#ffe066', '🐝', 'Bee Simulator', 'Buzz responsibly.')}
      </div>
      <div class="cu-foot">Made with too much coffee · Curiouser is not affiliated with any real hub of curious things · You can't break this page. (You can.)</div>
      </div>`
    },
    {
      id: 'tos', emoji: '📜', title: 'Terms of Service (Please Read)', site: 'Terms of Service', theme: '#2f6fde',
      blurb: 'Nobody has ever read it. Destroy it instead.',
      html: `<div class="wp p-tos">${chrome('legal.bigapp.example/terms', 'Terms of Service', '📜')}
      <div class="ts-top"><span>BigApp Legal Centre</span><span>Last read by a human: never</span></div>
      <div class="ts-body">
        <h1>Terms of Service</h1>
        <div class="ts-upd">Last updated: just now, and again just now</div>
        <p>Welcome to BigApp. By reading this sentence you have agreed to these Terms. By not reading this sentence you have also agreed to these Terms. There is no way to not agree to these Terms. We checked.</p>
        <h2>1. Definitions</h2>
        <p>"You" means you. "We" means us. "The Service" means the thing you clicked on. "Content" means anything you post, think about posting, or dream about at night. "Destroy" is not defined, because nobody has ever done that to a Terms of Service page, until now.</p>
        <h2>2. Your Account</h2>
        <p>You are responsible for everything that happens on your account, including things done by your cat walking across the keyboard. You agree to choose a password that is at least as long as this paragraph. You agree not to share your account with anyone, except the 340 advertising partners we share it with.</p>
        <h2>3. Acceptable Use</h2>
        <p>You agree not to use the Service to do anything illegal, rude, or mildly annoying. You agree not to reverse engineer the Service, forward engineer the Service, or engineer the Service sideways. You agree not to turn this page into pixels and shoot it with a tiny stickman. If you are currently doing that, please stop. Please. We are asking nicely.</p>
        <h2>4. Your Content</h2>
        <p>You keep ownership of your Content. However, you grant us a worldwide, royalty-free, perpetual, irrevocable, transferable, sublicensable, slightly cursed licence to use, copy, remix, print on mugs and sing aloud your Content in any medium now known or invented after the heat death of the universe.</p>
        <h2>5. Privacy</h2>
        <p>We respect your privacy. That is why we only collect your name, email, location, contacts, browsing history, shopping history, music taste, typing speed, favourite font and the exact moment you gave up reading this document. That moment was about six words ago.</p>
        <h2>6. Changes to These Terms</h2>
        <p>We may change these Terms at any time, for any reason, including boredom. We will notify you of changes by quietly updating this page at 3am. Continuing to breathe after a change counts as accepting it.</p>
        <h2>7. Limitation of Liability</h2>
        <p class="ts-caps">To the maximum extent permitted by law, in no event shall BigApp be liable for any indirect, incidental, special, consequential, emotional, or explosive damages, including loss of data, loss of profits, loss of keys, or loss of the will to read terms of service, even if BigApp has been advised of the possibility of such damages by a very small man with a very large rocket launcher.</p>
        <h2>8. Termination</h2>
        <p>We may terminate your account at any time. You may terminate your account at any time by completing Form 27-B, available from the Department of Forms. You may terminate this page at any time by pressing the fire button.</p>
        <h2>9. Contact</h2>
        <p>Questions? Please write to our legal team at the address below. They will reply in the form of a newer, longer Terms of Service.</p>
      </div>
      <div class="ts-agree"><span class="ts-yes" data-glass>I Agree</span><span class="ts-no" data-glass>I Disagree (this button does nothing)</span></div>
      </div>`
    },
    {
      id: 'jobs', emoji: '💼', title: 'Jobs for you, stick_dude', site: 'LinkedOut', theme: '#0a66c2',
      blurb: 'A job board full of synergy. Disrupt it.',
      html: `<div class="wp p-jobs">${chrome('www.linkedout.example/jobs', 'Jobs | LinkedOut', '💼')}
      <div class="jb-top"><span class="jb-logo">out</span><span class="jb-srch" data-glass>🔎 Search jobs, people, synergies</span><span>🏠 👥 💼 💬 🔔</span></div>
      <div class="jb-wrap">
        <div class="jb-me"><div class="jb-ban"></div><div class="jb-av">🧍</div><b>Stick Dude</b><small>Demolition Enthusiast · Open to work · Open to wreck</small>
          <div><span class="jb-skill">Jumping</span><span class="jb-skill">Explosives</span><span class="jb-skill">Wall jumps</span><span class="jb-skill">Microsoft Excel</span><span class="jb-skill">Teamwork (solo)</span></div>
          <small>412 people viewed your profile. 409 of them were recruiters for jobs you are not qualified for.</small>
        </div>
        <div>
          ${job('#ffe066', '🚀', 'Senior Rocket Surgeon', 'Brain Rocket Ltd', 'Remote (orbit)', 'Must have 15 years of experience with a technology invented last year. Competitive salary paid in exposure.')}
          ${job('#c3f07a', '🦄', 'Head of Synergy Alignment', 'Unicorn Startup Inc', 'Hybrid (3 days a week in the metaverse)', 'We are a family. Like a family, we will not pay you on time. Free kombucha on alternate Thursdays.')}
          ${job('#ffb3d9', '🍕', 'Pizza Quality Assurance Lead', 'Slice of Life Co', 'On site', 'You will taste pizza and say "yes" or "no". Previous experience saying "yes" is essential.')}
          ${job('#8fe3ff', '🧱', 'Junior Demolition Associate', 'Wreck & Co', 'Wherever there is a page', 'Looking for a small, energetic individual comfortable with grenades, double jumps and breaking things on purpose. Must provide own headband.')}
          ${job('#e2dcea', '📎', 'Chief Paperclip Officer', 'Office Supplies Global', 'Desk drawer', 'Lead a team of 4,000 paperclips. Reports to the stapler. Some bending required.')}
        </div>
      </div>
      <div class="jb-foot">LinkedOut © · About · Accessibility · Talent Solutions · Synergy Solutions · Solution Solutions</div>
      </div>`
    },
    {
      id: 'status', emoji: '🟢', title: 'System Status', site: 'StatusPage', theme: '#2f8a4f',
      blurb: 'Everything is fine. Please stop refreshing.',
      html: `<div class="wp p-status">${chrome('status.everything-is-fine.example', 'System Status', '🟢')}
      <div class="st-top"><b>🟢 everything-is-fine</b><span class="st-sub" data-glass>Subscribe to updates</span></div>
      <div class="st-ban">All systems operational*</div>
      <div class="st-note">*Except the ones that are not. A small pixel person has been reported on the homepage carrying what witnesses describe as "a lot of weapons".</div>
      <div class="st-list"><div class="st-svc"><b>API</b><span class="st-bars"><i class="st-bx"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i></i><i></i></span><em class="st-ok">Operational</em><small>99.99% uptime</small></div><div class="st-svc"><b>Website</b><span class="st-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><em class="st-ok">Operational</em><small>99.98% uptime</small></div><div class="st-svc"><b>Login</b><span class="st-bars"><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i></span><em class="st-warn">Degraded</em><small>97.20% uptime</small></div><div class="st-svc"><b>The Cloud</b><span class="st-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><em class="st-ok">Operational</em><small>100.00% uptime</small></div><div class="st-svc"><b>Search</b><span class="st-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i class="st-bx"></i></span><em class="st-ok">Operational</em><small>99.91% uptime</small></div><div class="st-svc"><b>Database</b><span class="st-bars"><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i></span><em class="st-bad">On fire</em><small>12.00% uptime</small></div><div class="st-svc"><b>Stairs</b><span class="st-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><em class="st-ok">Operational</em><small>99.95% uptime</small></div><div class="st-svc"><b>Vibes</b><span class="st-bars"><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i><i></i><i></i><i></i><i></i><i class="st-bx"></i></span><em class="st-warn">Degraded</em><small>88.00% uptime</small></div></div>
      <h2 class="st-h">Past incidents</h2>
      <div class="st-inc"><b>Investigating: Page is being destroyed</b><p>We are aware that large parts of this page are currently missing. Engineers have been dispatched. Engineers have also been exploded. We will provide an update shortly.</p><small>Posted 2 minutes ago</small></div>
      <div class="st-inc"><b>Resolved: Database briefly on fire</b><p>The database caught fire after someone fed it a black hole. We have replaced it with a slightly bigger database. Please do not feed it.</p><small>Posted yesterday</small></div>
      <div class="st-inc"><b>Monitoring: Stairs</b><p>A local man discovered stairs and the traffic has not stopped since. We are scaling up the stairs.</p><small>Posted last week</small></div>
      <div class="st-foot">Powered by hope · Uptime is a state of mind</div>
      </div>`
    }
  ];

  const range = {
    id: 'range', emoji: '🎯', title: 'Firing Range', site: 'Test Range', theme: '#e8484f', hidden: true,
    blurb: 'A safe place to test anything unsafe.',
    html: `<div class="wp p-range">${chrome('range.wreck.example/test', 'Firing Range', '🎯')}
    <div class="fr-head"><span>FIRING RANGE</span><span>🎯</span></div>
    <div class="fr-row"><span class="fr-block">TEST</span><span class="fr-glass" data-glass>GLASS</span><span class="fr-block">BLOCK</span><span class="fr-glass" data-glass>WINDOW</span>${targetSvg.replace('width="120" height="120"', 'width="60" height="60"')}</div>
    <div class="fr-big">WRECK ME</div>
    <div class="fr-text">The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly. Jackdaws love my big sphinx of quartz.</div>
    <div class="fr-row"><span class="fr-glass" data-glass>FRAGILE</span><span class="fr-block">SOLID</span><span class="fr-glass" data-glass>HANDLE WITH CARE</span></div>
    <div class="fr-wall">${'<span></span>'.repeat(40)}</div>
    <div class="fr-text">Letters fall off when hit. Glass shatters in one piece. Ice cracks. Fire spreads. Nothing here is real, so go wild.</div>
    <div class="fr-big">BOOM</div>
    </div>`
  };

  WTPx.pages.push(...extra);
  WTPx.rangePage = range;
  WTPx.css += css;
})();
