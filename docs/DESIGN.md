# Zoble 98 design system

Zoble looks and behaves like a late-90s desktop OS called **Zoble 98**. The hub (`site/index.html`) is a desktop with icons, windows, a taskbar and a Start menu. Every game page wears the same skin: a title bar and a menubar on top, grey bevelled controls, pixel type.

Everything is original: our own pixel font, our own pixel icons (drawn in code at runtime), our own sounds (WebAudio), our own Zoble logo (Zob's head). Never use another company's logo, fonts, sound files or icon files, and never name an operating system or its maker in the UI.

## Files

| File | What it is |
| --- | --- |
| `site/shared.css` | Tokens, colour schemes, base styles, the kit (`.c-*`), the shared components (menus, chrome bar, dialog, balloon, Control Panel, Secrets). Loaded by every page. |
| `site/shared.js` | `window.Curio`: store, sounds, schemes, pixel icons, menus, chrome bar, dialogs, balloons, Control Panel, secrets, drag. Loaded by every page. |
| `site/vendor/98css/` | 98.css (MIT, with its LICENSE). `98.css` is the untouched upstream file, `zoble98.css` is the build we load. |
| `tools/build-98.mjs` | Rebuilds `zoble98.css` from `98.css`: drops its font faces and scrollbar rules, scopes every selector under `.z98`, renames its variables to `--w-*` and swaps its fixed colours for our tokens. Run it after updating 98.css. |
| `site/zoble-98.woff2`, `site/zoble-98-bold.woff2` | The Zoble 98 pixel font (243 glyphs: ASCII, Latin-1 accents, arrows, card suits, stars, checks, fractions). |
| `tools/zoble98-font/` | Font source (`glyphs.py` bitmaps, `build.py` builder, needs `pip install fonttools brotli`) and `cursors.mjs` (cursor and glyph data URIs pasted into `shared.css`). |
| `site/index.html`, `site/hub.css`, `site/hub.js` | The desktop and its window manager. |
| `site/backroom.html`, `site/lost.html` | Secret pages, restyled as Zoble 98 windows. |

98.css ships "Pixelated MS Sans Serif" font files under CC BY-SA. They are not covered by the MIT licence and imitate a system font, so they are not vendored. Our own pixel font replaces them.

## Tokens

All tokens live on `:root` inside `:where()` so a game can still override any of them with a plain `:root { }` rule.

### Scheme tokens (`--z-*`)

| Token | Standard | Meaning |
| --- | --- | --- |
| `--z-face` | `#c0c0c0` | Button and window face |
| `--z-hilite` | `#ffffff` | Bevel highlight (top and left, outer) |
| `--z-light` | `#dfdfdf` | Bevel light (inner) |
| `--z-shadow` | `#808080` | Bevel shadow (inner, bottom and right) |
| `--z-dark` | `#0a0a0a` | Bevel dark shadow (outer) |
| `--z-desk` | `#008080` | Desktop |
| `--z-t1`, `--z-t2` | `#000080`, `#1084d0` | Active title bar gradient |
| `--z-it1`, `--z-it2` | `#808080`, `#b5b5b5` | Inactive title bar gradient |
| `--z-ttext`, `--z-ittext` | `#fff`, `#c0c0c0` | Title text, active and inactive |
| `--z-win`, `--z-text` | `#fff`, `#000` | Content area (fields, lists) and its text |
| `--z-sel`, `--z-seltext` | `#000080`, `#fff` | Selection |
| `--z-info`, `--z-infotext` | `#ffffe1`, `#000` | Tooltips and balloons |
| `--z-gray` | `#808080` | Disabled text |
| `--z-link` | `#0000ee` | Links |

Derived shadows: `--z-raised` (button), `--z-raised-win` (window frame), `--z-sunken` (pressed button), `--z-field` (text field, list), `--z-thin-up` / `--z-thin-down` (1px hover and status fields), `--z-default` / `--z-default-down` (default button with black outline), `--z-dither` (checkered pressed toggle).

Pixel glyph images: `--zi-min --zi-max --zi-restore --zi-close --zi-help --zi-up --zi-down --zi-left --zi-right --zi-check --zi-sub --zi-dot` (they switch to white glyphs in dark schemes). Cursors: `--z-cur-arrow`, `--z-cur-hand`, `--z-cur-wait`.

### Game tokens (kept from the old kit, every scheme defines them)

`--bg --surface --surface-2 --ink --ink-2 --ink-3 --line --accent --accent-ink --good --bad --warn --radius --radius-sm --shadow --font --mono --bar-h` plus `--c-hand --c-type --c-pop --c-sun --c-edge --c-shade --c-focus --c-tape --c-dot --c-wob --c-wob-sm --c-grain --c-lines`.

- `--bg` is the window face, `--surface` the white content area, `--surface-2` the light face.
- `--accent` is the selection colour (navy in Standard), `--accent-ink` its text.
- `--radius`, `--radius-sm`, `--c-wob`, `--c-wob-sm` are `0px`: everything is square now.
- `--shadow` is the raised bevel (inset box-shadows), so any card that used it becomes a 3D panel.
- `--font` is `"Zoble 98"` then `"MS Sans Serif", Tahoma, Geneva, Verdana, sans-serif` (local fallbacks only). `--c-hand` is the bold display cut `"Zoble 98 Display"`. `--mono` and `--c-type` are `"Courier New", Courier, monospace`.
- `--bar-h` is `52px` on direct game pages and `0px` inside a desktop window.

The pixel font is drawn on a 12px grid (cap height 8, x-height 6). It is sharpest at 12, 24, 36 and 48px.

### Colour schemes

`html[data-look]` holds the scheme, `html[data-theme]` is `light` or `dark`. `Curio.isDark()` is true for the dark ones.

| id | Name | Desktop | Title bar |
| --- | --- | --- | --- |
| `standard` | Zoble Standard (default) | teal | navy to blue |
| `rainy` | Rainy Day | slate blue | slate |
| `desert` | Desert | sand | teal |
| `marine` | Marine | deep sea | petrol |
| `lilac` | Lilac | purple | violet |
| `brick` | Brick | brick red | maroon |
| `pumpkin` | Pumpkin | burnt orange | orange |
| `eggplant` | Eggplant | aubergine, sage windows | plum |
| `contrast` | High Contrast Black (dark) | black | purple, inactive green |
| `midnight` | Midnight (dark) | ink blue | violet |
| `auto` | Match my device | `standard` or `midnight` | |

Old theme names migrate once (`prefs.v98`): `midnight` stays, everything else becomes `standard`.

Wallpapers (desktop only, `prefs.wallpaper`): none, Zig Zag, Bricks, Checkers, Weave, Polka, Zob Tiles, Starry Night, Waves, Puffy Clouds. They are drawn on a canvas in the current desktop colour, so they follow the scheme.

## Components

Most components come from 98.css and only work inside an element with the class `z98` (the hub `body`, the game chrome, dialogs and menus already have it). The kit classes (`.c-*`) work anywhere.

### Window

```html
<div class="window z98">
  <div class="title-bar">
    <div class="title-bar-text"><img class="curio-bar__icon" src="..." alt=""><span>Title</span></div>
    <div class="title-bar-controls">
      <button class="minimize" aria-label="Minimize"></button>
      <button class="maximize" aria-label="Maximize"></button>
      <button class="close" aria-label="Close"></button>
    </div>
  </div>
  <div class="window-body">...</div>
  <div class="status-bar"><p class="status-bar-field">Ready</p></div>
</div>
```

`.title-bar.inactive` greys the bar. `button.restore` and `button.help` exist too. Desktop windows (`.zw`) add `.zw-menu` (menubar row), `.zw-body`, resize handles `.zw-h--n/s/e/w/ne/nw/se/sw` and the status bar grip `.zw-grip`.

### Menubar and menus

Built in JS, never by hand:

```js
const bar = Curio.menubar(container, [
  { label: '&File', items: () => [
    { label: '&Restart', accel: 'F5', action: restart },
    { sep: true },
    { label: '&Sound', checked: true, action: toggle },
    { label: '&Simple', radio: true, checked: true, action: () => {} },
    { label: '&Colour scheme', sub: Curio.schemeItems },
    { label: 'Dimmed', disabled: true }
  ] }
]);
Curio.menu.open(items, { x, y });
Curio.menu.open(items, { anchor: rect, side: 'down' | 'right' | 'up', big: true, banner: 'Zoble<b>98</b>' });
```

`&` marks the keyboard accelerator (`&&` for a literal ampersand). Items take `icon` (16px url, or 32px with `big`), `iconAsync` (a promise of a url), `title`, `accel`. Keyboard: arrows, Home, End, Enter, Space, Esc, letter accelerators, Alt+letter and F10 for the menubar. Classes: `.z-menubar`, `.z-menubar__item`, `.z-menu`, `.z-menu__item`, `.z-menu__sep`, `.z-menu__banner`.

### Buttons

```html
<button>Cancel</button>            <!-- inside .z98: raised push button -->
<button class="default">OK</button> <!-- default button, black outline -->
<button class="c-btn">Play</button>                <!-- anywhere: default button -->
<button class="c-btn c-btn--ghost">Menu</button>   <!-- anywhere: plain push button -->
```

Pressed buttons sink, focus shows a dotted rectangle inside the button, disabled text is grey with a white emboss. `aria-pressed="true"` on a `.c-btn` makes a latched toggle (sunken and checkered).

### Fields, checkboxes, radios, selects, sliders

```html
<input type="text" class="c-input">
<input type="checkbox" id="a"><label for="a">Label</label>
<input type="radio" id="b" name="g"><label for="b">Label</label>
<span class="z-select"><select>...</select></span>
<input type="range">
```

Checkbox, radio and range styling comes from 98.css and needs the input followed by its `label`. Wrap a `select` in `.z-select` to get the grey arrow button.

### Group box, tabs, tree, list, table, progress, tooltips

```html
<fieldset><legend>Sound</legend>...</fieldset>

<menu role="tablist"><li role="tab" aria-selected="true"><a href="#a">Appearance</a></li></menu>
<div class="window" role="tabpanel">...</div>

<ul class="tree-view">...</ul>
<div class="sunken-panel"><table>...</table></div>

<div class="progress-indicator segmented"><span class="progress-indicator-bar" style="width:40%"></span></div>
```

`Curio.tooltip(el, text)` adds a yellow tooltip after a short hover. The Explorer list view (`.zx-list.is-large`, `.is-list`, `.is-details`, items `.zi`) and the desktop icons (`.di`) live in `hub.css`.

### Scrollbars

Grey 16px scrollbars with arrow buttons and a checkered track, drawn with `::-webkit-scrollbar` and tokens. Browsers without it get `scrollbar-color`.

### Dialog (`Curio.modal`)

```js
const v = await Curio.modal({ emoji: '🏆', title: 'You win!', body: 'Score 1200', buttons: [{ label: 'Play again', value: 'again' }, { label: 'Menu', value: 'menu' }] });
```

Same API as before. It renders a draggable `.window` inside `.curio-modal` with the game name as caption, a 32px icon and the buttons centred (the first is the default button). The icon is picked from `icon: 'info' | 'warn' | 'question' | 'error'` or guessed from the emoji and title (skulls and explosions are errors, warning signs are exclamations, a question with two buttons is a question); any other emoji is shown as is. `caption` overrides the title bar text, `wide: true` makes it wider, `body` can be a DOM node. Enter picks the default button, Esc and the close box pick the last button. Each kind plays its own sound.

### Balloon (`Curio.toast`)

`Curio.toast(text, ms)` shows a yellow balloon with a tail, from the tray on the desktop or the bottom right on a game page. It never takes clicks and goes away after `ms` (at most 6 s). `Curio.balloon(text, { title, icon, ms })` adds a bold title with a 16px icon.

### Taskbar and Start menu (desktop only)

`.taskbar` holds the Start button (`.start`, Zob's head plus bold "Start"), quick launch (`.quick`: Show Desktop, My Games, Surprise me), task buttons (`.zt`, pressed and bold for the active window) and the tray (`.tray`: Zob, touchpad mode, volume, clock). The Start menu is a big `Curio.menu` with the vertical "Zoble 98" banner: Zoble Update, Programs (one submenu per folder, plus Accessories), Favourites, Documents, Settings, Find, Help, Run, Shut Down.

### Kit classes for games

`.c-wrap`, `.c-center`, `.c-row`, `.c-title` (bold pixel, 36px, 24px on phones), `.c-sub`, `.c-muted`, `.c-card` (raised grey panel), `.c-stat` (`<div class="c-stat"><b>12</b><span>Score</span></div>`, transparent so it sits on any art), `.c-btn`, `.c-btn--ghost`, `.c-input` (sunken field), `.c-kbd` (raised key cap). Confetti is chunky 16-colour pixels.

## JavaScript API

`window.Curio` keeps everything it had:

`store`, `beep`, `toast`, `modal`, `confetti`, `best`, `getBest`, `isDark`, `muted`, `touchpad`, `setTouchpad`, `setMuted`, `drag`, `audioContext`, `rand`, `randInt`, `pick`, `shuffle`, `fmt`, `slug`, `game`, `mode`, `simple`, `advanced`, `setMode`, `look`, `looks`, `setLook`, `prefs`, `calm`, `sfx`, `icon`, `pim`, `unlock`, `found`, `secrets`, `settings`, `closeSettings`, `stickerBook`, `trail`.

New:

| API | What it does |
| --- | --- |
| `Curio.px(name, size, opts)` | Data URL of a system pixel icon (16 or 32): `folder computer bin doc notepad app control display sound mouse touchpad find run shutdown help trophy lock star clock die info warn question error door box globe zob start programs documents settings favs recent nothing prompt gamepad back fwd upf views coin dumbbell shortcut saver wallpaper keyboard`. |
| `Curio.gameIcon(slug, size)` | Promise of a game icon: the game's `thumb.svg` cropped square around the centre, shrunk, quantised to a 256-colour palette with 4x4 ordered dithering, framed. Cached in memory, four at a time. |
| `Curio.folderIcon(tag, size)` | Folder with the category emblem (32px) or tint (16px). |
| `Curio.menu`, `Curio.menubar`, `Curio.tooltip`, `Curio.schemeItems` | See Components. |
| `Curio.windowFrame({ title, iconUrl, controls })`, `Curio.draggable(box, handle)` | A bare window frame and Curio.drag based moving, for custom dialogs. |
| `Curio.balloon(text, { title, icon, ms })` | Balloon with a title. |
| `Curio.secretsWindow()` | The Secrets window (33 secrets, progress bar, hints). |
| `Curio.howTo(fn or text)` | Tells the chrome what Help, How to play should do. Without it the chrome clicks the game's own "How to play" or "Rules" button, or shows the blurb. |
| `Curio.help()`, `Curio.about()` | Run How to play, show the About box. |
| `Curio.setPref(key, value)`, `Curio.settingsTabs` | Change a pref (fires `curio:prefs`), add a Control Panel tab (`{ id, label, before, render(), mount(panel) }`). |
| `Curio.framed` | True inside a desktop window. |

Sounds (`Curio.sfx(name)`, all synthesised, muted by `Curio.muted` or the System sounds setting, scaled by the volume): the old names (`tap hover on off open close success error stamp pop unpop roll squeak paper whoosh note snore coin blip lift flip`) plus `click menu max min restore ding chord question critical notify startup shutdown crumple`.

Events: `curio:theme`, `curio:touchpad`, `curio:mode`, `curio:sound` as before, plus `curio:prefs`, `curio:secret`, `curio:settings`, `curio:reset`. Changes made in one tab or window reach the others through the `storage` event, so a game in a desktop window repaints when the scheme changes on the desktop.

Store keys are unchanged (`theme`, `prefs`, `muted`, `touchpad`, `played`, `hub:favs`, `hub:secrets`, `mode:<slug>`, `modeDefault`, `best:*`). New: `hub:session` (open windows), `hub:folderview`, `hub:bin`, `hub:welcomed`, `hub:lastrun`.

### Window manager (`hub.js`)

`openWindow({ key, kind, title, icon, w, h, minW, minH, menus, status, build, help, resizable, max, minimized, from, rect, onClose })` creates a window and its task button and returns `w` with `setTitle`, `setIcon`, `setStatus(...fields)`, `close`. Windows drag by the title bar and resize from every edge and the grip through `Curio.drag`, so Touchpad mode works (click to grab, click to drop, Esc lets go); iframes stop catching the pointer while a drag is on. Double-click the title bar to maximize, click the title bar icon for the window menu. Minimize and restore animate an outline to and from the task button. Built on it: `openFolder(path)`, `openGame(slug)`, `openNotepad`, `openFind`, `openRun`, `openPrompt`, `openHelp`, `openClock`, `openPage('backroom' | 'lost')`.

Keyboard on the desktop: Ctrl+Esc or the Zob key (Meta, alone) opens Start, Alt+X or Alt+F4 closes the active window, Alt+letter and F10 open its menus, arrows and Enter move between and open icons, Backspace goes up a folder, `/` opens Find, `?` opens the shortcuts help.

## Games and the desktop

**Direct game page** (`games/<slug>/index.html` opened in a tab): `shared.js` adds `header.curio-bar.z98`, exactly `var(--bar-h)` = 52px tall, and `body.curio-has-bar` gets `padding-top: 52px`.

- Title bar: the game's 16px pixel icon, "Game Title - Zoble 98", minimize (back to the desktop), maximize (browser full screen), close (back to the desktop). Double-click toggles full screen.
- Menubar: File (Restart, Random game, Back to desktop), View (Simple and Advanced as radio items when the game has `data-modes`, Colour scheme, Touchpad mode, Sound, Full screen, Control Panel), Help (How to play, Secrets, About).
- On the right: the `.curio-mode` Simple / Advanced toggle buttons (only with `data-modes`) and two tray buttons (touchpad, sound).
- `data-nobar` on `body` still removes the whole thing.
- No Zob or any other overlay is ever added to a game page.

**Inside a desktop window** (an iframe whose parent is the Zoble desktop, same origin): no bar is added, `--bar-h` is `0px` and `html.curio-framed` is set. The page talks to the desktop with `postMessage`:

| Direction | Message |
| --- | --- |
| game to desktop | `{ zoble: 'hello', slug, title, modes, live, mode, help }`, `{ zoble: 'mode', mode }`, `{ zoble: 'activate' }` on any click, `{ zoble: 'activity' }` (keeps the screen saver away), `{ zoble: 'key', key: 'start' or 'close' }`, `{ zoble: 'balloon', title, text, icon }` (secrets show from the desktop tray) |
| desktop to game | `{ zoble: 'setMode', mode }`, `{ zoble: 'restart' }`, `{ zoble: 'help' }`, `{ zoble: 'about' }`, `{ zoble: 'ping' }` |

The game window shows the title and icon, View has Simple and Advanced, and the menubar row carries the same two toggle buttons. The mode API is unchanged: `Curio.mode`, `Curio.simple`, `Curio.advanced`, `Curio.setMode`, the `curio:mode` event, `html[data-mode]`, store key `mode:<slug>` plus `modeDefault`, and a reload unless `data-modes="live"`.

Games that check `document.querySelector('.curio-modal')`, `.curio-sheet.is-open` or `.closest('.curio-bar')` keep working: the dialog wrapper is still `.curio-modal`, the Control Panel is `.curio-sheet.is-open[open]` and the chrome is `.curio-bar`.

## Responsive rules

- Phones (640px and narrower): every desktop window opens maximized above the taskbar, keeps its title bar (no maximize box), cannot be dragged or resized. Desktop icons form a 4-column grid. The taskbar is 40px with Start, task buttons (icon only when crowded) and a short tray. Menus and submenus are clamped to the screen and cascade over each other. Zob shrinks.
- Coarse pointers get taller menu items (32px), bigger title bar buttons and taller list rows.
- Game chrome on phones: menubar, compact mode toggles, tray hidden under 360px. It never scrolls sideways at 360 or 390px.
- Reduced motion (the system setting or Control Panel, Display, Reduce motion): no window zooms, no boot splash, a still screen saver, no confetti.

## Desktop contents and easter eggs

Desktop icons: My Games (every game plus folders, Not Played Yet and New Arrivals), Favourites, Recently Played, Recycle Bin, Readme.txt (Notepad), Control Panel (Display, Desktop, Sounds, Mouse, Games, Secrets, Date/Time, Data), Secrets, Surprise Me, Zob, Zoble Prompt, Nothing.exe, and one folder per category (Arcade Classics, Noggin Gym, Puzzles, Brain Teasers, Toys, Make Things, Drawing, Explore, Money & Life, Absurd, Skill Tests, Arcade).

Folders open as Explorer windows: menubar, toolbar (Back, Forward, Up, Views, Favourite, Surprise me, plus Insert Coin in Arcade Classics and Lift in Noggin Gym), address bar (type a path or a game name), folder tree on wide windows, Large icons, List or Details (sortable columns), status bar with the object count.

Easter eggs: Konami code (party mode), `zob()` in the console, Zob the helper (poke him, poke him fast, hover until he giggles, leave him alone until he naps, drag him around, tips and quips), Zob peeking from behind an icon, the playable Start banner (Z, O, B, L, E), triple-click the clock, Find "42", "lost", "secrets", "konami", Run "format c:", Nothing.exe, the Recycle Bin (funny files, a fake delete that Zob rescues, shortcuts to the back room and the lost and found), Zoble Prompt commands, Zoble Update, the screen savers (Flying Zobs, Pixel Pipes, Marquee, Starfield), Shut Down with the orange "It is now safe" screen (click to boot again), date surprises (New Year, Zob's birthday on 14 March, Halloween hats and bats all October, December snow and scarf, a black cat on the taskbar on Friday the 13th, Stop instead of Start on 1 April) and 33 secrets in the Secrets window.
