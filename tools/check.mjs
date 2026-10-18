// Structure check for the book. Run: node tools/check.mjs
// Catches: unbalanced tags, exercises without answers, select answers that aren't an option,
// broken local links, and CHAPTERS out of sync with the files in ch/.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TAGS = ['main', 'aside', 'details', 'table', 'ol', 'ul', 'dl', 'select', 'ruby', 'div', 'span', 'button'];

export function checkPage(html, dir) {
  const errs = [];
  for (const t of TAGS) {
    const open = (html.match(new RegExp(`<${t}[\\s>]`, 'g')) || []).length;
    const close = (html.match(new RegExp(`</${t}>`, 'g')) || []).length;
    if (open !== close) errs.push(`<${t}> opened ${open}, closed ${close}`);
  }
  for (const [, kind, body] of html.matchAll(/<aside class="(sharpen|exam)">([\s\S]*?)<\/aside>/g))
    if (!body.includes('<details class="answer">')) errs.push(`${kind} box without answers: ${body.match(/<h4>(.*?)<\/h4>/)?.[1]}`);
  for (const [, ans, body] of html.matchAll(/<select data-answer="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const opts = [...body.matchAll(/<option>([^<]*)<\/option>/g)].map(m => m[1]);
    if (!ans.split('|').some(a => opts.includes(a))) errs.push(`select answer "${ans}" is not one of its options`);
  }
  for (const [, url] of html.matchAll(/(?:href|src)="([^"#]+)/g))
    if (!/^(https?:|mailto:)/.test(url) && !existsSync(join(dir, url))) errs.push(`broken link ${url}`);
  if (!/<title>[^<]+<\/title>/.test(html)) errs.push('missing <title>');
  if (!/<script src="(\.\.\/)?book\.js"><\/script>/.test(html)) errs.push('missing book.js');
  return errs;
}

// self-test: a page with every kind of mistake must fail on each one
const broken = `<title>x</title><main><aside class="sharpen"><h4>S</h4><select data-answer="oui"><option>non</option></select></aside>
<span class="fr">a <a href="nope.html">x</a></main>`;
const found = checkPage(broken, root).join('\n');
for (const want of ['<span> opened 1, closed 0', 'sharpen box without answers', 'select answer "oui"', 'broken link nope.html', 'missing book.js'])
  assert(found.includes(want), `self-test: check missed "${want}"`);

let failed = 0;
const report = (name, errs) => { for (const e of errs) { console.log(`${name}: ${e}`); failed++; } };

const src = readFileSync(join(root, 'book.js'), 'utf8');
const chapters = [...src.matchAll(/\['([\w-]+)', '[^']*', \d, ([01])\]/g)].map(m => ({ file: m[1], ready: m[2] === '1' }));
assert(chapters.length > 20, 'could not read CHAPTERS from book.js');
const onDisk = readdirSync(join(root, 'ch')).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5));
for (const c of chapters) if (c.ready && !onDisk.includes(c.file)) report('book.js', [`${c.file} is marked ready but ch/${c.file}.html is missing`]);
for (const f of onDisk) if (!chapters.some(c => c.ready && c.file === f)) report('book.js', [`ch/${f}.html exists but isn't a ready chapter in CHAPTERS`]);

report('index.html', checkPage(readFileSync(join(root, 'index.html'), 'utf8'), root));
for (const f of onDisk) report(`ch/${f}.html`, checkPage(readFileSync(join(root, 'ch', f + '.html'), 'utf8'), join(root, 'ch')));

console.log(failed ? `${failed} problem(s)` : `ok: ${onDisk.length} chapters, self-test passed`);
process.exit(failed ? 1 : 0);
