import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { chromium } from 'playwright';

const ROOT = fileURLToPath(new URL('../site/', import.meta.url));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };

const registry = await readFile(join(ROOT, 'games.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(registry, sandbox);
const games = sandbox.window.CURIO_GAMES;

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '');
  let file = join(ROOT, path);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end('not found');
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/`;

const wanted = process.argv.slice(2);
const pages = [
  ...(wanted.length === 0 || wanted.includes('hub') ? [{ slug: 'hub', url: `${base}index.html` }] : []),
  ...games.filter((g) => (wanted.length ? wanted.includes(g.slug) : !g.soon)).map((g) => ({ slug: g.slug, url: `${base}games/${g.slug}/index.html` }))
];
const shots = process.env.SHOTS;
if (shots) await mkdir(shots, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined })
  .catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));
const failures = [];
for (const view of [{ name: 'desktop', width: 1280, height: 800 }, { name: 'phone', width: 390, height: 780, isMobile: true, hasTouch: true }]) {
  const context = await browser.newContext({ viewport: { width: view.width, height: view.height }, isMobile: !!view.isMobile, hasTouch: !!view.hasTouch });
  for (const p of pages) {
    const page = await context.newPage();
    const problems = [];
    page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
    page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(base)) problems.push(`${r.status()} ${r.url().slice(base.length)}`); });
    try {
      await page.goto(p.url, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(1200);
      const info = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        bar: !!document.querySelector('.curio-bar'),
        text: document.body.innerText.trim().length,
        canvas: document.querySelectorAll('canvas').length
      }));
      if (info.overflow > 1) problems.push(`sideways scroll of ${info.overflow}px`);
      if (p.slug !== 'hub' && !info.bar) problems.push('no top bar (shared.js not loaded or body[data-game] missing)');
      if (info.text < 5 && info.canvas === 0) problems.push('page looks empty');
      if (shots) await page.screenshot({ path: join(shots, `${p.slug}-${view.name}.png`) });
    } catch (e) {
      problems.push(`load: ${e.message.split('\n')[0]}`);
    }
    if (problems.length) failures.push({ slug: p.slug, view: view.name, problems });
    console.log(`${problems.length ? 'FAIL' : ' ok '} ${view.name.padEnd(7)} ${p.slug}${problems.length ? `\n       ${problems.join('\n       ')}` : ''}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
server.close();
if (failures.length) { console.log(`\n${failures.length} failing page views`); process.exit(1); }
console.log(`\nAll ${pages.length} pages clean at both widths`);
