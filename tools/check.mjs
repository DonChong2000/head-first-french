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
  if (!/<script src="(\.\.\/)*book\.js"><\/script>/.test(html)) errs.push('missing book.js');
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
const chapters = [...src.matchAll(/\['([\w-]+)', '[^']*', \d, ([01]), '[^']+'\]/g)].map(m => ({ file: m[1], ready: m[2] === '1' }));
assert(chapters.length > 20, 'could not read CHAPTERS from book.js');
const list = dir => existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.html')).map(f => f.slice(0, -5)) : [];
const en = list(join(root, 'ch')), zh = list(join(root, 'zh', 'ch'));
for (const c of chapters) if (c.ready && !en.includes(c.file)) report('book.js', [`${c.file} is marked ready but ch/${c.file}.html is missing`]);
for (const c of chapters) if (c.ready && !zh.includes(c.file)) report('book.js', [`${c.file} is marked ready but zh/ch/${c.file}.html is missing (the 中文 switch would 404)`]);
for (const f of en) if (!chapters.some(c => c.ready && c.file === f)) report('book.js', [`ch/${f}.html exists but isn't a ready chapter in CHAPTERS`]);
for (const f of zh) if (!en.includes(f)) report(`zh/ch/${f}.html`, ['has no English original in ch/']);

const page = (rel, dir, lang) => {
  if (!existsSync(join(root, rel))) return report(rel, ['missing']);
  const html = readFileSync(join(root, rel), 'utf8');
  const errs = checkPage(html, dir);
  if (!html.includes(`<html lang="${lang}">`)) errs.push(`<html lang> should be "${lang}"`);
  report(rel, errs);
};
page('index.html', root, 'en');
page('zh/index.html', join(root, 'zh'), 'zh-Hant');
for (const f of en) page(`ch/${f}.html`, join(root, 'ch'), 'en');
for (const f of zh) page(`zh/ch/${f}.html`, join(root, 'zh', 'ch'), 'zh-Hant');

// parity: a translation must keep every French audio clip and every exercise field of its original
const shape = html => ({
  fr: (html.match(/class="fr"/g) || []).length,
  answers: (html.match(/data-answer=/g) || []).length,
  say: [...html.matchAll(/data-say="([^"]*)"/g)].map(m => m[1]).sort().join('|'),
});
for (const f of zh.filter(f => en.includes(f))) {
  const a = shape(readFileSync(join(root, 'ch', f + '.html'), 'utf8')), b = shape(readFileSync(join(root, 'zh', 'ch', f + '.html'), 'utf8'));
  const errs = [];
  if (a.fr !== b.fr) errs.push(`${b.fr} French spans, English has ${a.fr}`);
  if (a.answers !== b.answers) errs.push(`${b.answers} answer fields, English has ${a.answers}`);
  if (a.say !== b.say) errs.push('data-say audio differs from English');
  report(`zh/ch/${f}.html`, errs);
}

console.log(failed ? `${failed} problem(s)` : `ok: ${en.length} chapters + ${zh.length} 中文, self-test passed`);
process.exit(failed ? 1 : 0);
