import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DIR = fileURLToPath(new URL('../site/vendor/98css/', import.meta.url));
const src = await readFile(`${DIR}98.css`, 'utf8');

const head = (src.match(/^\/\*![^*]*\*\//) || [''])[0];
const body = src.slice(head.length);

function blocks(text) {
  const out = [];
  let i = 0;
  while (i < text.length) {
    let j = i, depth = 0, quote = '';
    let open = -1;
    for (; j < text.length; j++) {
      const c = text[j];
      if (quote) { if (c === quote && text[j - 1] !== '\\') quote = ''; continue; }
      if (c === '"' || c === "'") { quote = c; continue; }
      if (c === '{') { if (depth === 0) open = j; depth++; }
      else if (c === '}') { depth--; if (depth === 0) break; }
    }
    if (open < 0) break;
    out.push({ prelude: text.slice(i, open).trim(), inner: text.slice(open + 1, j) });
    i = j + 1;
  }
  return out;
}

function splitSelectors(s) {
  const parts = [];
  let depth = 0, cur = '';
  for (const c of s) {
    if (c === '(' || c === '[') depth++;
    if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; } else cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

const DROP = new Set(['h1', 'h2', 'h3', 'h4', 'u']);
function scope(sel) {
  if (sel.startsWith('::-webkit-scrollbar')) return sel;
  if (sel === ':root') return ':root';
  if (sel === 'body') return '.z98';
  return `.z98 ${sel}`;
}

const COLORS = [
  [/linear-gradient\(90deg,grey,#b5b5b5\)/g, 'linear-gradient(90deg,var(--w-ititle1),var(--w-ititle2))'],
  [/linear-gradient\(90deg,navy,#1084d0\)/g, 'linear-gradient(90deg,var(--w-title1),var(--w-title2))'],
  [/(^|[^-\w])color:#fff\b/g, '$1color:var(--w-title-text)'],
  [/(^|[^-\w])color:#222\b/g, '$1color:var(--w-text-color)'],
  [/(^|[^-\w])color:#000\b/g, '$1color:var(--w-text-color)'],
  [/background-color:#fff\b/g, 'background-color:var(--w-window)'],
  [/dotted #000\b/g, 'dotted var(--w-focus)'],
  [/dotted #222\b/g, 'dotted var(--w-focus)'],
  [/text-shadow:0 0 #222\b/g, 'text-shadow:0 0 var(--w-text-color)'],
  [/1px 1px #222\b/g, '1px 1px var(--w-text-color)'],
  [/#0a0a0a\b/g, 'var(--w-frame)'],
  [/#dfdfdf\b/g, 'var(--w-face)'],
  [/#a9a9a9\b/g, 'var(--w-shadow)'],
  [/#fff\b/g, 'var(--w-hilite)'],
  [/\bwhite\b/g, 'var(--w-hilite)'],
  [/\bgrey\b/g, 'var(--w-shadow)'],
  [/\bsilver\b/g, 'var(--w-surface)'],
  [/\bnavy\b/g, 'var(--w-sel)'],
  [/#00f\b/g, 'var(--w-link)'],
  [/#222\b/g, 'var(--w-text-color)'],
  [/#000\b/g, 'var(--w-text-color)']
];

function tokens(text) {
  let out = text;
  for (const [re, to] of COLORS) out = out.replace(re, to);
  return out;
}

function decls(text) {
  const parts = text.split(/(url\("[^"]*"\))/g);
  return parts.map((p, i) => (i % 2 ? p : tokens(p
    .replace(/font-family:"Pixelated MS Sans Serif",Arial/g, 'font-family:var(--font)')
    .replace(/font-family:"Pixelated MS Sans Serif"/g, 'font-family:var(--font)')
    .replace(/font-family:Arial/g, 'font-family:var(--font)')
    .replace(/font-family:monospace/g, 'font-family:var(--mono)')
    .replace(/font-size:11px/g, 'font-size:var(--z-fs,12px)')
    .replace(/border-bottom:\.5px solid/g, 'border-bottom:1px solid')))).join('');
}

function rules(list) {
  const out = [];
  for (const b of list) {
    if (b.prelude.startsWith('@font-face')) continue;
    if (b.prelude.startsWith('@media')) { out.push(`${b.prelude}{${rules(blocks(b.inner))}}`); continue; }
    const sels = splitSelectors(b.prelude).filter((s) => !DROP.has(s) && !s.startsWith('::-webkit-scrollbar'));
    if (!sels.length) continue;
    out.push(`${sels.map(scope).join(',')}{${decls(b.inner)}}`);
  }
  return out.join('\n');
}

const css = `${head}\n${rules(blocks(body))}\n`;
await writeFile(`${DIR}zoble98.css`, css);
console.log(`zoble98.css: ${css.length} bytes`);
