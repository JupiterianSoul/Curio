import { readdir, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import * as acorn from 'acorn';

const DASH = String.fromCharCode(0x2014);
const TEXT = new Set(['.js', '.mjs', '.css', '.html', '.svg', '.md', '.json', '.yml', '.txt']);
const SKIP = new Set(['node_modules', '.git', 'vendor']);
const VENDORED = (name) => /\.min\.(js|css|mjs)$/.test(name);
const problems = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (TEXT.has(extname(entry.name)) && !VENDORED(entry.name)) await check(path);
  }
}

function jsComments(src, path) {
  const comments = [];
  const opts = { ecmaVersion: 'latest', allowHashBang: true, onComment: comments };
  try { acorn.parse(src, { ...opts, sourceType: 'module' }); }
  catch {
    try { comments.length = 0; acorn.parse(src, { ...opts, sourceType: 'script' }); }
    catch (e) { problems.push(`${path}: does not parse (${e.message})`); return; }
  }
  if (comments.length) problems.push(`${path}: ${comments.length} comment(s)`);
}

async function check(path) {
  const src = await readFile(path, 'utf8');
  if (src.includes(DASH)) problems.push(`${path}: em dash`);
  const ext = extname(path);
  if (ext === '.js' || ext === '.mjs') jsComments(src, path);
  if (ext === '.css' && /\/\*/.test(src.replace(/"[^"]*"|'[^']*'/g, ''))) problems.push(`${path}: css comment`);
  if (ext === '.html' && src.includes('<!--')) problems.push(`${path}: html comment`);
}

let files = 0;
const count = async (dir) => { for (const e of await readdir(dir, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; if (e.isDirectory()) await count(join(dir, e.name)); else if (TEXT.has(extname(e.name))) files++; } };
await walk('.');
await count('.');
if (problems.length) { console.log(problems.join('\n')); console.log(`\nsweep: ${problems.length} problem(s)`); process.exit(1); }
console.log(`sweep: ${files} files clean`);
