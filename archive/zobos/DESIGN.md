# Zoble design system: Zob's computer

Zoble is set inside a world. The home page is **Zob's desk**, drawn from the front in a warm, hand-made style: striped wallpaper, a window, a pin board, a wooden desk with a lamp, a plant called Gerald, a mug, a keyboard and a mouse. On the desk sits Zob's chunky cream CRT monitor with stickers, sticky notes, a power LED and a pink **ZOBLE** brand plate. Zob himself, the pink one-eyed owner, peeks around the side of the monitor. The operating system running inside the screen is **ZobOS**: rounded, outlined, toy-like windows, Zob's own colours and pixel icons. Every game is an app on Zob's computer.

The style has two layers and they never mix:

| Layer | Where | Look |
| --- | --- | --- |
| The room | Wall, desk, monitor shell, Zob, sticky notes | Hand-drawn ink outlines (`#2b2347`, 3 to 5px, round joins), flat warm fills, halftone dot shading, paper grain, the hand-lettered font. Lit by the time of day. |
| ZobOS | Everything inside the screen, and every game page | Pixel font for chrome, chunky 2px ink outlines, rounded corners, hard drop shadows, scheme tokens. Crisp, never blurred. |

Everything is original: our own pixel font, our own hand-lettered font, pixel icons drawn in code, sounds synthesised with WebAudio, Zob drawn by hand in SVG. Never use another company's logo, font, sound file or icon, and never name an operating system or its maker in the UI.

## Files

| File | What it is |
| --- | --- |
| `site/index.html` | The room: `#room` holds `.crt` (the monitor, with `#screen` inside), `#wall`, `#front` (the desk) and `#zobhome`. |
| `site/desk.css`, `site/desk.js` | The room: layout, illustrations, lighting, desk easter eggs, the phone handheld header. `window.ZobleArt.zob()` returns the drawn Zob SVG; `window.ZobleDesk(api)` builds the scene. |
| `site/explorer.js` | Zoble Explorer, the game showcase (`window.ZobleExplorer(api)`): a window on desktop, the home screen on phones. |
| `site/hub.js`, `site/hub.css` | ZobOS: window manager, taskbar, Zob menu, folders, Find, Run, Prompt, Help, screen savers, the Zob assistant, the phone launcher and dock. |
| `site/shared.css`, `site/shared.js` | Tokens, colour schemes, both skins (toy and classic), the shared components, the game title strip and the **ZobOS app kit** (`.zapp-*`). Loaded by every page. |
| `site/vendor/98css/` | 98.css (MIT, with its LICENSE). `98.css` is upstream, `zoble98.css` is the scoped build we load (all selectors under `.z98`). Rebuilt by `tools/build-98.mjs`. |
| `site/zoble-98.woff2`, `site/zoble-98-bold.woff2`, `site/zoble-hand.woff2` | The ZobOS pixel font (regular and bold) and Zob's hand-lettered font. Sources in `tools/zoble98-font/`. |
| `site/backroom.html`, `site/lost.html` | Secret pages, drawn as ZobOS windows. |

## The room

### Layout

The scene is sized with CSS custom properties on `.room` (no JS layout): `--top` (wall above the monitor), `--bez` (bezel), `--chin` (monitor chin), `--deskh` (visible desk), `--side` (room left beside the monitor), then `--scr-h` and `--scr-w` (screen size, at most 1.72:1), `--crt-w`, `--crt-l`, `--crt-r`. The screen fills as much of the window as the desk allows: about 910x600 at 1280x800, 1020x690 at 1440x900 and 1350x880 at 1920x1080. Everything on the wall and desk is placed from those variables, so objects slide in and out as the window changes.

Layers (`z-index`): wall objects 1, desk surface and lamp light 2, monitor 3, desk objects 5, Zob 6. The `.z98` class sits on `#screen` only, so the OS styles never leak onto the room.

### The monitor

`.crt-shell` is the cream plastic case (halftone texture, ink outline, chunky drop shadow). `.crt-recess` is the dark frame around the glass. `#screen` (`.crt-screen`) is the OS: it is the window manager's whole world. `.crt-glass` lays a vignette, a soft glare and scanlines over the screen, masked so they only show near the edges; it never blurs or covers the middle, and takes no clicks. The chin holds vents, the **ZOBLE / ZobOS inside** plate, a colour knob, a dummy knob, the power LED and the power button. Stickers (star, heart, Zob, bolt) sit on the bezel; three sticky notes (`.r-note`) hang off its left edge and the chin.

First visit in a session: the screen switches on with a quick CRT line animation (`.crt.is-boot`), no splash. Shut Down and Restart still show the ZobOS splash inside the screen.

### Time of day

`.room[data-time]` is `dawn` (5 to 8), `day` (8 to 17), `dusk` (17 to 20) or `night`, from the visitor's clock (or `?time=night` in the URL). It changes the wallpaper colour, the sky, sun or moon and stars in the window, the sun beam on the wall, and dims the room objects through `--obj-f`. At night the screen glows onto the wall (`.crt::before`). `.room.lamp-on` follows the colour scheme: a light scheme means the lamp is on.

### Zob

Zob is drawn in SVG (`ZobleArt.zob()`, class `.zobv`): pink body with halftone shading, one big eye whose pupil follows the pointer, a yellow antenna bulb, cheeks, a waving arm and four hats (`hat-party`, `hat-witch`, `hat-night`, `hat-scarf`). States: `.zobv.is-sleep` (eye closed, zzz), and on the wrapper `.zob.is-squish`, `.is-dizzy`, `.is-wave`, `.is-giggle`. On desktop he peeks around the right edge of the monitor (his left side is clipped as if behind it); his speech bubble is a hand-lettered paper bubble. On phones his head sits in the handheld header and the bubble drops under it.

He speaks through `zobSay(text, ms, buttons)` in `hub.js`. He gives one welcome tip on the first visit (no popup), quips when a game opens, reacts to the desk, naps after a minute alone and wakes when you move.

## ZobOS (inside the screen)

### Skins and colour schemes

`html[data-look]` holds the scheme, `html[data-theme]` is `light` or `dark`, and `html[data-skin]` is `toy` or `classic`. `Curio.isDark()` is true for dark schemes.

| id | Name | Skin | Desktop | Title bars |
| --- | --- | --- | --- | --- |
| `zob` | ZobOS (default) | toy | blueberry, Sprinkles wallpaper | bubblegum pink |
| `mint` | Mint Choc | toy | chocolate | mint |
| `sherbet` | Sherbet | toy | orange | grape |
| `zobnight` | Zob After Dark (dark) | toy | ink | pink |
| `standard` | Zoble Classic | classic | teal | navy |
| `rainy`, `desert`, `marine`, `lilac`, `brick`, `pumpkin`, `eggplant` | the classic set | classic | | |
| `contrast` | High Contrast Black (dark) | classic | | |
| `midnight` | Midnight (dark) | classic | | |
| `auto` | Match my device | | `zob` or `zobnight` | |

The default `:root` values are the ZobOS scheme, so a page looks right before scripts run. The toy skin is applied with `:where(:root:not([data-skin="classic"]))`, so it has no specificity and a game can still override anything with a plain `:root { }` rule. One-time migration (`prefs.vzob`): the old default `standard` becomes `zob`.

### Tokens

Scheme tokens: `--z-face --z-hilite --z-light --z-shadow --z-dark --z-desk --z-t1 --z-t2 --z-it1 --z-it2 --z-ttext --z-ittext --z-win --z-text --z-sel --z-seltext --z-info --z-infotext --z-gray --z-link`, plus `--z-ink` (the outline colour, equal to `--z-dark`), `--z-pop` (sticker yellow), `--z-mint`, `--z-coral`.

Derived: `--z-raised` (button), `--z-raised-win` (window and panel), `--z-sunken` (pressed), `--z-field` (text field and list), `--z-thin-up` / `--z-thin-down`, `--z-default` / `--z-default-down` (primary button), `--z-dither` (latched toggle), `--z-drop` (hard drop shadow). In the toy skin they are 2px ink rings with a 3px darker band at the bottom and a highlight at the top; in the classic skin they are the old four-colour bevels.

Game tokens (every scheme defines them): `--bg --surface --surface-2 --ink --ink-2 --ink-3 --line --accent --accent-ink --good --bad --warn --radius --radius-sm --shadow --font --mono --bar-h --c-hand --c-type --c-pop --c-sun --c-edge --c-shade --c-focus --c-tape --c-dot --c-wob --c-wob-sm --c-grain --c-lines`. New: `--read` (a readable rounded system font for body text) and `--zob-hand` (Zob's hand-lettered font).

- `--radius` is 12px and `--radius-sm` 8px in the toy skin, 0 in classic.
- `--shadow` is a raised outlined panel with a drop shadow.
- `--font` is the ZobOS pixel font (sharp at 12, 24, 36, 48px), `--c-hand` its bold display cut, `--mono` and `--c-type` Courier.
- `--bar-h` is 52px on a direct game page and 0px inside a ZobOS window.

### Components

Most components come from 98.css and need an ancestor with class `z98` (the screen, the game strip, dialogs and menus have it). The toy skin restyles all of them:

- **Window** (`.window`, `.title-bar`, `.title-bar-text`, `.title-bar-controls` with `.minimize .maximize .restore .help .close`, `.window-body`, `.status-bar`): 14px corners, 2px ink outline, hard drop shadow; the title bar is a rounded pill with candy stripes on its right half; control buttons are 20px rounded squares, close is coral.
- **Buttons**: `<button>` is a rounded outlined face button; `.default` and `.c-btn` are the pink primary button; `.c-btn--ghost` the plain one; `aria-pressed="true"` latches.
- **Fields**: text inputs, selects (wrap in `.z-select`), textareas: 8px corners, inset ring. Checkboxes and radios: ink outlined, checked boxes turn sticker yellow, radio dots pink. Sliders: pill track, pink knob.
- **Group box** (`fieldset` + `legend`): rounded outline, the legend is an ink pill.
- **Tabs** (`menu[role=tablist]` + `li[role=tab]`): rounded top tabs, the selected one bold.
- **Menus** (`Curio.menu`, `Curio.menubar`): rounded panel, pill highlight, dashed separators; the Zob menu has a vertical **Zoble OS** banner whose letters play notes.
- **Dialog** (`Curio.modal`, same API): a ZobOS window with a little pop. The title uses the display font.
- **Balloon** (`Curio.toast`, `Curio.balloon`): a sticky yellow note with an ink outline and tail. On the hub it comes from the tray inside the screen.
- **Taskbar**: a dotted cream bar inside the screen with the **Zob button** (Zob's face in a pink pill; it opens the Zob menu), quick launch (Show desktop, Zoble Explorer, Surprise me), task pills and a rounded tray (Zob, touchpad mode, volume, clock).
- **Desktop icons** (`.di`): 32px pixel icons with bold shadowed labels, a pink pill when selected.
- **Explorer folders** (`.zx`), **Find**, **Run**, **Prompt**, **Help**, **Date/Time**, **Notepad**: as before, restyled by the skin.

Pixel icons: `Curio.px(name, size)` for system icons, `Curio.gameIcon(slug, size)` for a game's dithered icon, `Curio.folderIcon(tag, size)`.

### Zoble Explorer

The first thing a visitor sees: on arrival a maximized **Zoble Explorer** window opens inside the screen (no welcome popup). It shows real thumbnails (`games/<slug>/thumb.svg`) as big rounded cards:

- a hello line, a search box (live, by title, blurb, kind and slug) and a **Surprise me** button,
- tabs: Home, New, Favourites, Recent and one per kind,
- Home: **Zob's pick of the day** (seeded by the date, with a sticky note from Zob), a **New on Zob's computer** row, **Pick up where you left off**, **Your favourites**, then **Everything**,
- each card: thumbnail, name, blurb, a star to favourite it, a NEW sticker and a played tick.

Closing or minimizing it reveals the desktop (icons, folders, easter eggs). It is also on the desktop, in quick launch and at the top of the Zob menu. View, Big pictures switches to smaller cards. It comes back with Remember open windows.

### Games on the desktop

Games open **maximized inside the screen** by default; Control Panel, Games, Opening games switches to windowed. The maximize button or a double-click on the title bar toggles. Several games can be open; the taskbar switches. The title bar carries the Simple and Advanced switch; the menu row has Game, View and Help. A maximized game hides its status bar to give the game more room.

### Phones (640px and narrower)

No fake desktop. The room becomes **ZobOS pocket edition**, a handheld:

- a 60px header: Zob's head, the ZobOS wordmark, the power LED and a sun or moon button (the lamp),
- the screen is a home screen (the Explorer in its phone layout): search, Surprise, kind tabs, a compact pick of the day, a New row and a grid of big rounded app tiles (square thumbnails, three per row),
- a dock: Home, Kinds (menu of kinds plus Favourites, Recent, New), Search, Surprise, Zob (the Zob menu),
- every window opens full screen with a 48px strip: back arrow, title, Simple and Advanced, and a menu button with the window's menus; the header hides while an app is open.

No sideways scroll at 360 or 390px.

## Game pages (opened directly)

`shared.js` adds the **ZobOS title strip**, `header.curio-bar.z98`, exactly `var(--bar-h)` = 52px, and `body.curio-has-bar` gets `padding-top: 52px`. One row:

- `.curio-bar__home`: Zob's face, back to Zob's desk (the game is reopened there),
- `.curio-bar__title`: the game's pixel icon and title in a pink pill (double-click for full screen),
- `.curio-bar__row`: the File, View, Help menubar (File: Restart, Random game, Back to Zob's desk; View: Simple and Advanced, Colour scheme, Touchpad mode, Sound, Full screen, Control Panel; Help: How to play, Secrets, About),
- `.curio-mode`: the Simple / Advanced switch (only with `data-modes`),
- `.curio-bar__tray`: touchpad mode, sound, Control Panel,
- `.curio-bar__win`: full screen and close.

At 640px and narrower the menubar folds into a three-dot `.curio-bar__more` menu and the window buttons hide; under 400px the Control Panel button and the title icon hide. `data-nobar` on `body` removes the strip. No Zob or other overlay is ever added to a game page.

Inside a ZobOS window (an iframe whose parent is the hub) no strip is added, `--bar-h` is `0px` and `html.curio-framed` is set. The page and the desktop talk with `postMessage`:

| Direction | Message |
| --- | --- |
| game to desktop | `{ zoble: 'hello', slug, title, modes, live, mode, help }`, `{ zoble: 'mode', mode }`, `{ zoble: 'activate' }`, `{ zoble: 'activity' }`, `{ zoble: 'key', key: 'start' or 'close' }`, `{ zoble: 'balloon', title, text, icon }` |
| desktop to game | `{ zoble: 'setMode', mode }`, `{ zoble: 'restart' }`, `{ zoble: 'help' }`, `{ zoble: 'about' }`, `{ zoble: 'ping' }` |

Games that check `document.querySelector('.curio-modal')`, `.curio-sheet.is-open` or `.closest('.curio-bar')` keep working.

## ZobOS app guidelines

Every game is an app on Zob's computer. It should feel like it belongs to ZobOS (same frame, same controls, same feel in every scheme) and still look like itself (its own art, palette, type accents, sounds and voice). The rule of thumb: **ZobOS dresses the edges, the game owns the middle.**

### App layout

```
.zapp
  .zapp-head        icon, title, one-line intro, mode tabs and actions
  .zapp-main        two columns on wide screens, one on narrow
    .zapp-play      the playing column, centred, as wide as --stage-w
      .zapp-bar       optional row of options (sizes, levels)
      .zapp-stats     score readouts
      .zapp-stage     THE GAME: board, canvas or scene, plus overlays
        .zapp-result    result screen (inside the stage)
        .zapp-howto     how-to-play card (inside the stage)
      .zapp-controls  tool buttons under the stage
    .zapp-side      panels: settings, stats, badges, notes (Advanced)
  .zapp-status      status bar: one live message and small fields
```

- The page under the title strip is the app. Do not add your own top bar, logo or mascot.
- **Fit the screen.** Size the stage so head, stats, stage and controls fit in `100dvh - var(--bar-h)` at 1280x800 and inside a maximized ZobOS window (about 900x520). Use `--stage-w: clamp(300px, calc(100dvh - var(--bar-h) - <chrome>px), 560px)`.
- Simple mode is usually one column: `.zapp-side` and most options are Advanced only.
- Canvas games that want the whole area can skip `.zapp-main` and make `.zapp-stage` `flex: 1`; keep `.zapp-status` and the Simple / Advanced behaviour.

### The kit (`shared.css`)

| Class | Use |
| --- | --- |
| `.zapp` | App root. Sets `--zapp-w` (max width, 1080px), `--stage-w` (560px), `--stage-bg`, `--stage-ink`; `--zapp-bg` paints the app background. |
| `.zapp-head`, `.zapp-id`, `.zapp-icon`, `.zapp-title`, `.zapp-sub`, `.zapp-actions` | Header strip. `.zapp-icon` holds `thumb.svg`; `.zapp-sub` is the readable one-line intro. |
| `.zapp-tabs` (+ `.zapp-tabs--small`) | Segmented control of buttons with `aria-pressed` or `aria-selected`. Modes, sizes, themes. |
| `.zapp-main` (+ `.zapp-main--solo`), `.zapp-play`, `.zapp-side`, `.zapp-bar` | Layout. |
| `.zapp-stage` | The game area: outlined, rounded, `isolation: isolate`, own background. Put the result and how-to overlays inside it. |
| `.zapp-stats`, `.zapp-stat` (+ `.is-best`, `.is-hot`, `b.bump`, `b.urgent`) | Score readouts: `<div class="zapp-stat"><b>12</b><span>Score</span></div>`. |
| `.zapp-controls`, `.zapp-tool` | Tool buttons with an icon (`<i>`) and a label; `aria-pressed="true"` for modes like Lock. |
| `.c-btn`, `.c-btn--ghost` | Primary and secondary buttons (pink and plain in the toy skin). |
| `.zapp-toggle` | Switch: `<label class="zapp-toggle"><input type="checkbox"><span class="zapp-toggle__track"></span>Sound</label>`. |
| `.zapp-slider` | `input[type=range]` in the scheme colour. |
| `.zapp-panel`, `.zapp-panel__title` | Side panels; on a `details`, put the title on the `summary` for a folding panel. |
| `.zapp-badges`, `.zapp-badge` (+ `.on`, `.new`) | Achievements. |
| `.zapp-status`, `.zapp-status__msg`, `.zapp-status__field` (+ `.is-keep`) | Sticky status bar. One message at a time (what just happened, or what to do next). Fields hide on phones unless `.is-keep`. |
| `.zapp-result`, `.zapp-result__card`, `__kicker`, `__title`, `__score`, `__best`, `__text`, `__btns` | Result screen over the stage: a sticker kicker ("water works!"), a title, the big number, a NEW BEST pill, one line of detail, then Play again (primary) and secondary buttons. |
| `.zapp-howto`, `.zapp-howto__card`, `.zapp-steps`, `.zapp-keys` | How-to-play card: a yellow note over the stage with three or four numbered steps, the keys (`.c-kbd`) and one "Got it" button. Show it on the first visit and from Help, How to play (`Curio.howTo(fn)`). |
| `.zapp-hint` | A small yellow pill for tips such as "Tip: turn on Touchpad mode". |
| `.zapp-simple`, `.zapp-adv` | Show only in Simple or only in Advanced. |

Example:

```html
<body data-game="my-game" data-modes>
  <div class="zapp">
    <header class="zapp-head">
      <div class="zapp-id"><span class="zapp-icon"><img src="thumb.svg" alt=""></span>
        <div><h1 class="zapp-title">My Game</h1><p class="zapp-sub">One line that says what to do.</p></div></div>
      <div class="zapp-actions">
        <div class="zapp-tabs zapp-adv" role="group" aria-label="Mode"><button aria-pressed="true">Classic</button><button>Daily</button></div>
        <button class="c-btn c-btn--ghost" data-howto>How to play</button>
      </div>
    </header>
    <main class="zapp-main">
      <section class="zapp-play">
        <div class="zapp-stats"><div class="zapp-stat"><b id="score">0</b><span>Score</span></div><div class="zapp-stat is-best"><b id="best">-</b><span>Best</span></div></div>
        <div class="zapp-stage"><canvas aria-label="Game board"></canvas>
          <div class="zapp-result" hidden><div class="zapp-result__card"><span class="zapp-result__kicker">nice!</span><h2 class="zapp-result__title">Round over</h2><div class="zapp-result__score">1,200</div><div class="zapp-result__btns"><button class="c-btn">Play again</button></div></div></div>
        </div>
        <div class="zapp-controls"><button class="zapp-tool"><i>&#8630;</i>Undo</button></div>
      </section>
      <aside class="zapp-side zapp-adv"><section class="zapp-panel"><h2 class="zapp-panel__title">Settings</h2>...</section></aside>
    </main>
    <footer class="zapp-status"><p class="zapp-status__msg" aria-live="polite">Your move.</p><span class="zapp-status__field is-keep">Level 3</span></footer>
  </div>
</body>
```

### Typography

- **Chrome and labels**: `var(--font)`, the pixel font, 12px (or 24, 36, 48). Buttons, tabs, stats labels, status bar, menus.
- **Display**: `var(--c-hand)` bold pixel for titles and numbers; `var(--zob-hand)` (Zob's hand-lettering, all caps) for stickers, kickers, notes and anything Zob would write.
- **Reading**: `var(--read)` at 14 to 16px for intros, how-to steps, result text and any paragraph. Never set long text in the pixel font.
- Inside the stage use any type that fits the game (a blueprint stencil, a chalk hand, a cafe serif), from local fonts or your own drawn letters.

### Colour

- Chrome (head, tabs, stats, tools, panels, status, result and how-to cards) uses scheme tokens only: `--z-face`, `--z-win`, `--z-light`, `--z-ink`, `--z-sel`, `--z-pop`, `--z-text`, `--ink-2`, `--ink-3`, `--good`, `--bad`. It then works in all 14 schemes, light and dark, toy and classic.
- The stage has a free palette: the game's own art lives there. Set `--stage-bg` and draw what you like, but give it a dark version (`:root[data-theme="dark"] .myapp { ... }`) or a palette that works on both, and repaint canvases on `curio:theme` (`Curio.isDark()`).
- Accents from Zob's world are welcome inside the stage: bubblegum `#e8457c`, sticker yellow `#ffcf3a`, mint `#7fd9b0`, coral `#ff7b6b`, ink `#2b2347`.

### Iconography

- Chrome icons are pixel icons (`Curio.px(name, 16 or 32)`) or simple text glyphs in `.zapp-tool i`. Prefer them to emoji in chrome; emoji are fine inside the stage when they suit the game.
- The app icon is the game's `thumb.svg`; keep its subject centred (it is cropped square on phones and for pixel icons).
- Illustrations in the stage follow the room's rules when they want to feel like Zob's: ink outlines, flat fills, halftone shading.

### Sounds

`Curio.sfx(name)` for interface sounds (`click`, `tap`, `pop`, `paper`, `success`, `error`, `ding`, `coin`, `whoosh`), `Curio.beep()` or `Curio.audioContext()` for the game's own sounds. Always respect `Curio.muted` and the volume; short, soft, no long loops without a mute button. A win gets a small rising arpeggio and `Curio.confetti()`; a mistake a short low blip, never a harsh buzzer.

### Motion

Pops use `cubic-bezier(.2, 1.4, .4, 1)` (a little overshoot), 150 to 350ms. Buttons sink 1px when pressed. Result and how-to cards pop in; stats bump (`b.bump`) when they change. No motion longer than a second without a reason, and everything stops under `prefers-reduced-motion` or Control Panel, Reduce motion (`Curio.calm`).

### Simple and Advanced

- Simple: one screen, the stage and two or three big tools, no side panels, a short intro line, a how-to card with three steps. Mark extras `.zapp-adv`.
- Advanced: mode tabs in the head, options in `.zapp-bar`, stats, badges and notes in `.zapp-side`, share buttons on the result card.
- Keep separate bests per mode. The switch lives in the title strip; use `data-modes="live"` and `curio:mode` if you can switch without reloading.

### Phones

- At 860px the side panels move under the stage; at 560px the head stacks, the actions centre, tools share the width and only `.is-keep` status fields stay.
- The stage comes first and fills the width. Minimum touch target 40px. No sideways scroll at 360 or 390px.
- Never rely on hover, right-click or a keyboard: every action has a visible button.

### Touchpad

Use `Curio.drag(el, { start, move, end })` for every drag so Touchpad mode works (click to grab, click to drop). Offer keyboard play and list the keys in the how-to card. Show a `.zapp-hint` the first time a drag is needed: "Tip: turn on Touchpad mode in the title strip".

### Reference implementation: Pipes

`site/games/pipes/` is the reference app:

- `index.html` uses the whole layout: a head with the thumb icon, the title, a "dwg P-60" blueprint tag, an intro line per mode, mode tabs (Advanced) and How to play; a `.zapp-bar` for grid size and edges (Free play) or the level picker (Campaign); four `.zapp-stat` readouts; the stage; five `.zapp-tool` buttons (Undo, Hint, Turn back, Lock, New; the last three Advanced only); a side column with the pipe finish tabs, a folding Stats and badges panel and shop notes; a status bar with the live message, the job or level and the board size.
- `style.css` keeps the game's identity inside the stage only: blueprint paper with a 20px and 100px grid, a riveted metal plate, the pipe art and its three finishes (Garden, Lab, Copper), each with a dark version. The app background is a faint grid drawn from scheme tokens, and the stage size follows the screen height.
- `game.js` changes were small: the how-to card (`Curio.howTo`, shown on the first visit, Esc or Got it closes it), status fields (`paintStatus`), badges and stats on the kit classes, a kicker line on the result card, and the theme switch uses `classList` instead of replacing `className`.

## JavaScript API

`window.Curio` keeps everything it had: `store`, `beep`, `toast`, `modal`, `confetti`, `best`, `getBest`, `isDark`, `muted`, `touchpad`, `setTouchpad`, `setMuted`, `drag`, `audioContext`, `rand`, `randInt`, `pick`, `shuffle`, `fmt`, `slug`, `game`, `mode`, `simple`, `advanced`, `setMode`, `look`, `looks`, `setLook`, `prefs`, `calm`, `sfx`, `icon`, `pim`, `unlock`, `found`, `secrets`, `settings`, `closeSettings`, `stickerBook`, `trail`, `px`, `gameIcon`, `folderIcon`, `menu`, `menubar`, `tooltip`, `windowFrame`, `draggable`, `balloon`, `secretsWindow`, `howTo`, `help`, `about`, `setPref`, `settingsTabs`, `framed`.

New: `Curio.setStage({ mount, bounds })` (the hub mounts dialogs, the Control Panel and balloons inside the screen and keeps menus within it), `Curio.stage` (where overlays are mounted), `Curio.looks[].toy`, the pref `gameWindow` (`'max'` or `'window'`).

Events: `curio:theme`, `curio:touchpad`, `curio:mode`, `curio:sound`, `curio:prefs`, `curio:secret`, `curio:settings`, `curio:reset`. Store keys are unchanged (`theme`, `prefs`, `muted`, `touchpad`, `played`, `hub:favs`, `hub:secrets`, `mode:<slug>`, `modeDefault`, `best:*`, `hub:*`). New: `hub:tip1` (Zob's first tip shown), `hub:water` (Gerald), `hub:lightlook` (the scheme to return to when the lamp goes back on), `hub:xsmall` (Explorer small cards).

Sounds (`Curio.sfx(name)`, all synthesised, muted by `Curio.muted` or the System sounds setting, scaled by the volume): `tap hover on off open close success error stamp pop unpop roll squeak paper whoosh note snore coin blip lift flip click menu max min restore ding chord question critical notify startup shutdown crumple`.

### Window manager (`hub.js`)

`openWindow({ key, kind, title, icon, w, h, minW, minH, menus, status, build, help, resizable, max, minimized, from, rect, onClose })` creates a window inside `#screen` and its task button. Windows drag by the title bar and resize from every edge through `Curio.drag`. On phones each window gets a back button and a menu button in its strip. Built on it: `openExplorer`, `openFolder(path)`, `openGame(slug)`, `openNotepad`, `openFind`, `openRun`, `openPrompt`, `openHelp`, `openClock`, `openPage('backroom' | 'lost')`.

`hub.js` passes an `api` object to `ZobleExplorer(api)` and `ZobleDesk(api)`: games and kinds, `openGame`, `openFolder`, `openWindow`, `rollGame`, `toggleFav`, `played()`, `favs()`, `zobSay`, `zobWave`, `powerOn`, `deskArea`, `phone`.

Keyboard on the desktop: Ctrl+Esc or the Zob key opens the Zob menu, Alt+X or Alt+F4 closes the active window, Alt+letter and F10 open its menus, arrows and Enter move between icons, Backspace goes up a folder, `/` opens Find, `?` the shortcuts help.

## Responsive and comfort

- Desktop scene at 900px and wider. Narrow desktops keep the room but the sides get tight; everything stays clickable.
- Phones (640px and narrower): the handheld described above.
- Coarse pointers get taller menu items and bigger title bar buttons.
- Reduced motion (system or Control Panel, Display, Reduce motion): no CRT switch-on, no window zooms, a still screen saver, no confetti, Zob and the room stop idling.

## Desktop contents and easter eggs

Desktop icons: Zoble Explorer, My Games, Favourites, Recently Played, Recycle Bin, Readme.txt, Control Panel (Display, Desktop, Sounds, Mouse, Games, Secrets, Date/Time, Data), Secrets, Surprise Me, Zob, Zoble Prompt, Nothing.exe, and one folder per kind. Wallpapers: Sprinkles (default), Zob Doodles, and the classic patterns.

Secrets (39, listed in the Secrets window, which the desk drawer also opens):

- **On the screen** (the original 33): the Konami code, `zob()` in the console, poking Zob, poking him fast, tickling, letting him nap, Zob peeking from behind an icon, the playable Zob menu banner, triple-clicking the clock, Find "42", "lost", "secrets", Run "format c:", Nothing.exe, the Recycle Bin, the Prompt, Zoble Update, the screen savers, Shut Down and the orange "It is now safe" screen, flinging a window, five windows at once, the Arcade coin slot, the Noggin Gym dumbbell, every colour scheme, date surprises (New Year, Zob's birthday on 14 March, Halloween hats and bats in October, December snow and scarf, a black cat on Friday the 13th, Boz instead of Zob on 1 April).
- **On the desk** (new): **Lights out** (click the lamp: it switches light and dark schemes and the room lighting), **Caffeinated** (five sips from the mug; it steams, empties and refills a minute later), **Green thumb** (water Gerald; he grows with visits and waterings and blooms at the end), **Sticky fingers** (read every line of every sticky note; they peel to the next line), **Off and on again** (the monitor power button switches the screen off and back on; it also wakes ZobOS after Shut Down), **Bird watcher** (Pip the bird visits the window sill now and then; wave at him).
- More desk play without a badge: the colour knob cycles the ZobOS schemes, the sun or moon in the window fast-forwards the time of day, the desk keyboard's keys press (type Z, O, B on them), the mouse wiggles, the pin board's polaroids open their games, the drawer opens the Secrets sticker book, Zob's eye follows the pointer.
