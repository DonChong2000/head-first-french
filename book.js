// Tête la première: shared page behaviour. No dependencies.
// [file, title, part, ready]. Part 0 = front matter. Only ready chapters get links.
const CHAPTERS = [
  ['00-intro', 'How to use this book', 0, 1],
  ['01-sounds', 'Sounds first: the French mouth', 1, 1],
  ['02-etre-avoir', 'Être, avoir and you', 1, 0],
  ['03-gender', 'Every noun has a gender', 1, 0],
  ['04-er-verbs', '-ER verbs and saying no', 1, 0],
  ['05-questions', 'Asking questions', 1, 0],
  ['06-numbers', 'Numbers, time, dates, prices', 1, 0],
  ['07-aller-faire-venir', 'Aller, faire, venir: near future, near past', 1, 0],
  ['p1-check', 'Part 1 exam check', 1, 0],
  ['08-pc-avoir', 'Passé composé with avoir', 2, 0],
  ['09-pc-etre', 'Passé composé with être', 2, 0],
  ['10-pronouns', 'Le, lui, y, en', 2, 0],
  ['11-imparfait', 'Imparfait vs passé composé', 2, 0],
  ['12-reflexive', 'Reflexive verbs and your day', 2, 0],
  ['13-comparisons', 'Comparing and describing', 2, 0],
  ['14-futur', 'Futur simple: work and housing', 2, 0],
  ['p2-check', 'Part 2 exam check', 2, 0],
  ['15-relatives', 'Qui, que, où, dont', 3, 0],
  ['16-conditionnel', 'Conditionnel: polite and hypothetical', 3, 0],
  ['17-subjonctif', 'Subjonctif présent', 3, 0],
  ['18-pqp-reported', 'Plus-que-parfait and reported speech', 3, 0],
  ['19-connectors', 'Connectors and paragraphs', 3, 0],
  ['20-opinions', 'Giving and defending opinions', 3, 0],
  ['p3-check', 'Part 3 exam check', 3, 0],
  ['21-si-clauses', 'All three si-clauses', 4, 0],
  ['22-passive', 'Passive and gérondif', 4, 0],
  ['23-formal-writing', 'Formal emails and letters', 4, 0],
  ['24-listening', 'Listening at real speed', 4, 0],
  ['25-speaking', 'The speaking exam', 4, 0],
  ['26-mock-exam', 'Full mock exam', 4, 0],
];
const PARTS = ['Front matter', 'Part 1 · A1 · NCLC 1–3', 'Part 2 · A2 · NCLC 4–5', 'Part 3 · B1 · NCLC 5–6', 'Part 4 · B2 · NCLC 7'];

const base = new URL('.', document.currentScript.src);
const href = f => new URL('ch/' + f + '.html', base).href;
const here = location.pathname.split('/').pop().replace('.html', '');
const store = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} },
};

// ---- speech: click any .fr to hear it (inside .quebec it uses a Canadian voice when there is one)
let voices = [];
const loadVoices = () => { voices = speechSynthesis.getVoices(); };
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.addEventListener('voiceschanged', loadVoices); }
let warned = false;
function say(el) {
  if (!('speechSynthesis' in window)) return;
  const lang = el.closest('.quebec') ? 'fr-CA' : 'fr-FR';
  const u = new SpeechSynthesisUtterance(el.dataset.say || el.textContent);
  u.lang = lang;
  u.voice = voices.find(v => v.lang.replace('_', '-') === lang) || voices.find(v => v.lang.startsWith('fr')) || null;
  if (!u.voice && !warned) { warned = true; alert('No French voice found. Windows: Settings > Time & language > Speech > Add voices > Français. Edge has the most natural ones.'); }
  u.rate = +(el.dataset.rate || 0.85);
  u.onend = () => el.classList.remove('speaking');
  document.querySelectorAll('.speaking').forEach(s => s.classList.remove('speaking'));
  el.classList.add('speaking');
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

// ---- answer checker: a button.check checks every [data-answer] in its box.
// data-answer="le|l'" accepts alternatives. A right answer with wrong or missing accents is flagged, not failed.
const norm = s => s.trim().toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, ' ');
const bare = s => s.normalize('NFD').replace(/\p{M}/gu, '');
function check(btn) {
  const box = btn.closest('aside, section, form');
  let right = 0, accent = 0;
  const fields = box.querySelectorAll('[data-answer]');
  for (const f of fields) {
    const ok = f.dataset.answer.split('|').map(norm), v = norm(f.value);
    const r = ok.includes(v), a = !r && v && ok.map(bare).includes(bare(v));
    f.classList.remove('right', 'wrong', 'accent');
    f.classList.add(r ? 'right' : a ? 'accent' : 'wrong');
    right += r; accent += a;
  }
  let out = btn.nextElementSibling;
  if (out?.tagName !== 'OUTPUT') { out = document.createElement('output'); out.className = 'hand'; btn.after(out); }
  out.textContent = `  ${right} / ${fields.length}` + (accent ? ` (+${accent} with an accent slip)` : '') + (right === fields.length ? '  Bravo !' : '');
}

document.addEventListener('click', e => {
  const fr = e.target.closest('.fr');
  if (fr) return say(fr);
  const btn = e.target.closest('button.check');
  if (btn) return check(btn);
  const done = e.target.closest('button.done');
  if (done) { store.set('done:' + here, store.get('done:' + here) ? '' : '1'); done.textContent = doneText(); }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('span.fr')) { e.preventDefault(); say(e.target); }
});

const doneText = () => store.get('done:' + here) ? '✓ Finished (click to undo)' : 'I finished this chapter';

// ---- page chrome
document.querySelectorAll('span.fr').forEach(s => { s.tabIndex = 0; s.setAttribute('role', 'button'); s.lang = 'fr'; });

const i = CHAPTERS.findIndex(c => c[0] === here);
if (i >= 0) {
  const ready = CHAPTERS.filter(c => c[3]);
  const r = ready.findIndex(c => c[0] === here);
  const top = document.createElement('nav');
  top.className = 'top';
  top.innerHTML = `<a href="${new URL('index.html', base).href}">Head First French</a><span>${PARTS[CHAPTERS[i][2]]}</span>`;
  document.body.prepend(top);
  const pager = document.createElement('nav');
  pager.className = 'pager';
  const prev = ready[r - 1], next = ready[r + 1];
  pager.innerHTML = (prev ? `<a href="${href(prev[0])}">← ${prev[1]}</a>` : '<span></span>') +
    `<button class="done">${doneText()}</button>` +
    (next ? `<a href="${href(next[0])}">${next[1]} →</a>` : '<span>More chapters coming</span>');
  document.querySelector('main').append(pager);
}

const foot = document.createElement('footer');
foot.innerHTML = 'Unofficial parody for personal study. Free, non-commercial, not affiliated with O\'Reilly Media.';
document.body.append(foot);

const toc = document.getElementById('toc');
if (toc) {
  let n = 0;
  toc.innerHTML = PARTS.map((p, pi) => `<h3>${p}</h3><ol>` + CHAPTERS.filter(c => c[2] === pi).map(c => {
    const no = c[0].startsWith('p') ? '✔' : String(n++).padStart(2, '0');
    const t = c[3] ? `<a href="${href(c[0])}">${c[1]}</a>` : `<span class="soon">${c[1]} (coming)</span>`;
    return `<li><span class="n">${no}</span>${t}${store.get('done:' + c[0]) ? ' <span class="tick">✓</span>' : ''}</li>`;
  }).join('') + '</ol>').join('');
}
