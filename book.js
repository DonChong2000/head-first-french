// Tête la première: shared page behaviour. No dependencies.
// [file, title, part, ready, 中文 title]. Part 0 = front matter. Only ready chapters get links.
// English pages live at the root, the Traditional Chinese copies under zh/ with the same file names.
const CHAPTERS = [
  ['00-intro', 'How to use this book', 0, 1, '本書使用說明'],
  ['01-sounds', 'Sounds first: the French mouth', 1, 1, '先學發音：法語的口型'],
  ['02-etre-avoir', 'Être, avoir and you', 1, 1, 'Être、avoir 與自我介紹'],
  ['03-gender', 'Every noun has a gender', 1, 1, '每個名詞都有陰陽性'],
  ['04-er-verbs', '-ER verbs and saying no', 1, 1, '-ER 動詞與否定句'],
  ['05-questions', 'Asking questions', 1, 1, '怎樣發問'],
  ['06-numbers', 'Numbers, time, dates, prices', 1, 1, '數字、時間、日期、價錢'],
  ['07-aller-faire-venir', 'Aller, faire, venir: near future, near past', 1, 1, 'Aller、faire、venir：最近將來時與最近過去時'],
  ['p1-check', 'Part 1 exam check', 1, 1, '第一部分 考試自測'],
  ['08-pc-avoir', 'Passé composé with avoir', 2, 0, '複合過去時（avoir）'],
  ['09-pc-etre', 'Passé composé with être', 2, 0, '複合過去時（être）'],
  ['10-pronouns', 'Le, lui, y, en', 2, 0, '代詞 le、lui、y、en'],
  ['11-imparfait', 'Imparfait vs passé composé', 2, 0, '未完成過去時 vs 複合過去時'],
  ['12-reflexive', 'Reflexive verbs and your day', 2, 0, '反身動詞與日常作息'],
  ['13-comparisons', 'Comparing and describing', 2, 0, '比較與描述'],
  ['14-futur', 'Futur simple: work and housing', 2, 0, '簡單將來時：工作與住屋'],
  ['p2-check', 'Part 2 exam check', 2, 0, '第二部分 考試自測'],
  ['15-relatives', 'Qui, que, où, dont', 3, 0, '關係代詞 qui、que、où、dont'],
  ['16-conditionnel', 'Conditionnel: polite and hypothetical', 3, 0, '條件式：禮貌與假設'],
  ['17-subjonctif', 'Subjonctif présent', 3, 0, '虛擬式現在時'],
  ['18-pqp-reported', 'Plus-que-parfait and reported speech', 3, 0, '愈過去時與間接引語'],
  ['19-connectors', 'Connectors and paragraphs', 3, 0, '連接詞與段落'],
  ['20-opinions', 'Giving and defending opinions', 3, 0, '表達與捍衛觀點'],
  ['p3-check', 'Part 3 exam check', 3, 0, '第三部分 考試自測'],
  ['21-si-clauses', 'All three si-clauses', 4, 0, '三種 si 條件句'],
  ['22-passive', 'Passive and gérondif', 4, 0, '被動語態與副動詞'],
  ['23-formal-writing', 'Formal emails and letters', 4, 0, '正式電郵與書信'],
  ['24-listening', 'Listening at real speed', 4, 0, '聽懂正常語速'],
  ['25-speaking', 'The speaking exam', 4, 0, '口語考試'],
  ['26-mock-exam', 'Full mock exam', 4, 0, '完整模擬考試'],
];
const zh = document.documentElement.lang.startsWith('zh');
const T = zh
  ? { parts: ['前言', '第一部分 · A1 · NCLC 1–3', '第二部分 · A2 · NCLC 4–5', '第三部分 · B1 · NCLC 5–6', '第四部分 · B2 · NCLC 7'],
      book: 'Head First French 法語', other: 'English', soon: '（即將推出）', more: '更多章節即將推出', done: '完成本章', undo: '✓ 已完成（按此取消）',
      noVoice: '找不到法語語音。Windows：設定 > 時間與語言 > 語音 > 新增語音 > Français。Edge 的語音最自然。',
      slip: n => `（另有 ${n} 個只錯重音符號）`,
      rec: ['🎙 錄音', '■ 停止'], noMic: '用不到麥克風。請在瀏覽器設定中允許這個網站使用麥克風。',
      foot: '非官方戲仿作品，僅供個人學習。免費、非商業用途，與 O\'Reilly Media 無關。' }
  : { parts: ['Front matter', 'Part 1 · A1 · NCLC 1–3', 'Part 2 · A2 · NCLC 4–5', 'Part 3 · B1 · NCLC 5–6', 'Part 4 · B2 · NCLC 7'],
      book: 'Head First French', other: '中文', soon: ' (coming)', more: 'More chapters coming', done: 'I finished this chapter', undo: '✓ Finished (click to undo)',
      noVoice: 'No French voice found. Windows: Settings > Time & language > Speech > Add voices > Français. Edge has the most natural ones.',
      slip: n => ` (+${n} with an accent slip)`,
      rec: ['🎙 Record', '■ Stop'], noMic: "Can't use the microphone. Allow this site to use it in your browser settings.",
      foot: 'Unofficial parody for personal study. Free, non-commercial, not affiliated with O\'Reilly Media.' };
const title = c => zh ? c[4] : c[1];

const base = new URL('.', document.currentScript.src);   // site root, where book.js lives
const root = new URL(zh ? 'zh/' : '.', base);            // root of this language's pages
const href = f => new URL('ch/' + f + '.html', root).href;
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
  if (!u.voice && !warned) { warned = true; alert(T.noVoice); }
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
    const r = ok.includes(v), a = !r && !!v && ok.map(bare).includes(bare(v));
    f.classList.remove('right', 'wrong', 'accent');
    f.classList.add(r ? 'right' : a ? 'accent' : 'wrong');
    right += r; accent += a;
  }
  let out = btn.nextElementSibling;
  if (out?.tagName !== 'OUTPUT') { out = document.createElement('output'); out.className = 'hand'; btn.after(out); }
  out.textContent = `  ${right} / ${fields.length}` + (accent ? T.slip(accent) : '') + (right === fields.length ? '  Bravo !' : '');
}

// ---- recorder: an empty p.rec gets a mic button and a player. The audio stays in this tab, nothing is uploaded.
let rec;
async function record(btn) {
  if (rec?.state === 'recording') return rec.stop();
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { return alert(T.noMic); }
  const chunks = [], r = rec = new MediaRecorder(stream);
  r.ondataavailable = e => chunks.push(e.data);
  r.onstop = () => {
    stream.getTracks().forEach(t => t.stop());
    const audio = btn.nextElementSibling;
    if (audio.src) URL.revokeObjectURL(audio.src);
    audio.src = URL.createObjectURL(new Blob(chunks, { type: r.mimeType }));
    audio.hidden = false;
    btn.textContent = T.rec[0];
  };
  r.start();
  btn.textContent = T.rec[1];
}

document.addEventListener('click', e => {
  const fr = e.target.closest('.fr');
  if (fr) return say(fr);
  const mic = e.target.closest('button.rec');
  if (mic) return record(mic);
  const btn = e.target.closest('button.check');
  if (btn) return check(btn);
  const done = e.target.closest('button.done');
  if (done) { store.set('done:' + here, store.get('done:' + here) ? '' : '1'); done.textContent = doneText(); }
});
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('span.fr')) { e.preventDefault(); say(e.target); }
});

const doneText = () => store.get('done:' + here) ? T.undo : T.done;

// ---- page chrome
document.querySelectorAll('span.fr').forEach(s => { s.tabIndex = 0; s.setAttribute('role', 'button'); s.lang = 'fr'; });
if (window.MediaRecorder) document.querySelectorAll('p.rec').forEach(p => { p.innerHTML = `<button class="rec">${T.rec[0]}</button> <audio controls hidden></audio>`; });

const i = CHAPTERS.findIndex(c => c[0] === here);
const page = i >= 0 ? 'ch/' + here + '.html' : 'index.html';
const bar = document.createElement('nav');
bar.className = 'top';
bar.innerHTML = `<a href="${new URL('index.html', root).href}">${T.book}</a>` +
  (i >= 0 ? `<span>${T.parts[CHAPTERS[i][2]]}</span>` : '') +
  `<a href="${new URL((zh ? '' : 'zh/') + page, base).href}" lang="${zh ? 'en' : 'zh-Hant'}">${T.other}</a>`;
document.body.prepend(bar);

if (i >= 0) {
  const ready = CHAPTERS.filter(c => c[3]);
  const r = ready.findIndex(c => c[0] === here);
  const pager = document.createElement('nav');
  pager.className = 'pager';
  const prev = ready[r - 1], next = ready[r + 1];
  pager.innerHTML = (prev ? `<a href="${href(prev[0])}">← ${title(prev)}</a>` : '<span></span>') +
    `<button class="done">${doneText()}</button>` +
    (next ? `<a href="${href(next[0])}">${title(next)} →</a>` : `<span>${T.more}</span>`);
  document.querySelector('main').append(pager);
}

const foot = document.createElement('footer');
foot.textContent = T.foot;
document.body.append(foot);

const toc = document.getElementById('toc');
if (toc) {
  let n = 0;
  toc.innerHTML = T.parts.map((p, pi) => `<h3>${p}</h3><ol>` + CHAPTERS.filter(c => c[2] === pi).map(c => {
    const no = c[0].startsWith('p') ? '✔' : String(n++).padStart(2, '0');
    const t = c[3] ? `<a href="${href(c[0])}">${title(c)}</a>` : `<span class="soon">${title(c)}${T.soon}</span>`;
    return `<li><span class="n">${no}</span>${t}${store.get('done:' + c[0]) ? ' <span class="tick">✓</span>' : ''}</li>`;
  }).join('') + '</ol>').join('');
}