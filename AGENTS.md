# Head First French: chapter guide

An unofficial parody of O'Reilly's Head First series. The joke: programmers learn a new language from Head First, so here's one for French. It takes the reader from zero to NCLC 7 (TEF Canada / TCF Canada). Personal study, shared free with friends, non-commercial. Plain static HTML, no build step, hosted on GitHub Pages.

**Reader:** English at CLB 7–9, native Cantonese and/or Mandarin, aiming at Canadian immigration French points.

## Settled decisions
- Teach **standard French**. Québec French only goes in `aside.quebec` boxes, as "understand it, don't copy it on the exam".
- Chinese notes are **Traditional Chinese, written Cantonese** (嘅、咗、唔、畀), with Jyutping and pinyin: `書 syu1 / 魚 yú`. If only one of the two languages has a good match, say which.
- Title is **Head First French** (a.k.a. *Tête la première*), as a parody. The index "What is this, really?" box and the footer that book.js adds to every page say it's unofficial, non-commercial, for personal study, and not affiliated with O'Reilly. Keep both. Never use O'Reilly's logo or cover art, never copy text from their books, and never sell it. Copy the *format* (box types, tone, exercises), not their sentences.
- A light programming joke now and then fits the premise (silent letters = commented-out code, gender = a type system, liaison = a linker). Use at most one or two per chapter.
- Audio is the browser's Web Speech API. Every French word or sentence the reader should hear goes in `<span class="fr">`. Use `data-say` when the spoken text differs from the shown text (e.g. a ▶ button).

## Files
- `book.js`: the `CHAPTERS` list (`[file, title, part, ready]`). Set `ready` to 1 when a chapter ships. It also handles speech, the answer checker, nav and done ticks.
- `assets/cover.jpg`: Don's Gemini-generated parody cover, cropped to remove a fake author byline and scaled to 800px. The original is in Don's Downloads.
- `style.css`: all the box styles. Don't add per-chapter CSS.
- `ch/NN-slug.html`: one chapter per file. Copy the head/foot from `ch/01-sounds.html`.
- `zh/index.html`, `zh/ch/*.html`: the Traditional Chinese edition (書面語), one copy per English page with the same file name. It has `<html lang="zh-Hant">` and paths one level deeper (`../../style.css`). book.js detects the language from `<html lang>`, takes the 中文 titles from the 5th CHAPTERS field, and adds the EN ⇄ 中文 switch. Only the teaching prose is translated. French, audio, data-say and French data-answers stay identical.
  - **Workflow:** finish and review the English page first, then translate it with Gemini. Run `pwsh tools/translate.ps1 ch/NN-slug.html ...` (one Gemini job per page, run in parallel). How it works: copy the page to `C:\Users\chong\agy-handoff`, then run `agy -p` and tell it to read the page with its file tool only. Headless mode denies shell commands. Set `[Console]::OutputEncoding = UTF8` before capturing agy's stdout, or the Chinese comes back as CP437 mojibake. Keep the HTML between `<!doctype` and `</html>`.
  - **Later English fixes:** an English fix made after translation must be repeated by hand in the zh copy.
- `tools/check.mjs`: must pass. It also fails if a ready chapter has no zh copy, because the 中文 switch would 404. `tools/shot.mjs <outdir> <pages...>` screenshots light/dark × desktop/phone.

## Chapter shape (see ch/01-sounds.html)
1. `p.chapter-no`, `h1`, `p.lede` (one-line hook)
2. A `div.scene` comic dialogue that sets up the problem, usually in a Canadian setting (Montréal café, Service Canada, renting in Vancouver, a job interview)
3. `h2` sections, each teaching ONE rule, using an `p.annot` sentence with `<ruby>word<rt>note</rt></ruby>` labels
4. 2–4 of the boxes below, spread through the chapter, not piled at the end
5. At least 3 exercises (`aside.sharpen` / `aside.exam`), each with `button.check` and a `details.answer`
6. Alternate chapters get a game, such as "Who does what?" matching with selects
7. `aside.bullet-points` last
8. Target length: 2,500–4,000 words of English. Each French example ≤ the level taught so far.

## Boxes
| class | title (h4) | use for |
|---|---|---|
| `sharpen` | Sharpen your pencil | fill-in or choose exercises |
| `brain-power` | Brain Power | a question to think about, no answer |
| `no-dumb` | There are no Dumb Questions | `<dl>` with `dt` = question, `dd` = answer |
| `watch-it` | Watch it! | traps, false friends, exceptions |
| `zh-note` (`lang="zh-Hant"`) | 中文腦：… | a Cantonese/Mandarin bridge (咗 ≈ passé composé, 緊 ≈ en train de, 過 ≈ experience) |
| `en-note` | You already know this | English cognates and borrowings |
| `quebec` | Au Québec | Québec usage. `.fr` inside it uses a fr-CA voice |
| `fireside` | Fireside Chat: X vs Y | `<dl>` with `dt` = speaker, `dd` = line |
| `exam` | Exam warm-up: … | tasks in TEF/TCF format |
| `bullet-points` | BULLET POINTS | chapter summary |

## Exercises
- `<input data-answer="le|l'">`: `|` separates accepted answers. Matching ignores case and extra spaces and accepts curly apostrophes. An answer that is right apart from accents is flagged "accent slip", not counted as right.
- `<select data-answer="x">`: x must be one of the `<option>`s (check.mjs enforces this). Start with an empty `<option></option>`.
- Every input/select needs an `aria-label`.

## Voice
- Second person, informal, short sentences, a little humour. It should sound like a person, with no AI tells (run /humanizer on chapter openers).
- English is the teaching language. Don't translate the whole chapter into Chinese. Chinese only appears in `zh-note` boxes and hint columns.
- Check facts that can go stale (IRCC score bands, test formats) against official sources, and attribute them.

## Gotchas
- A single huge Write can trip the content filter. Write a chapter in two parts (a `<!-- PART2 -->` marker, then an Edit).
- Don't nest `aside` inside `aside`, because check.mjs pairs them with a non-greedy match.
- `table.wide` inside `.table-wrap` for tables with 4+ columns, so phones scroll them sideways instead of squashing them.
