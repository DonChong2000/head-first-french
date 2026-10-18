# usage: pwsh tools/translate.ps1 <relative page path> ...   e.g. index.html ch/01-sounds.html
# Translates each English page into zh/<same path> with Gemini, in parallel. Output is HTML only.
param([Parameter(ValueFromRemainingArguments)] [string[]] $Pages)
$proj = Split-Path $PSScriptRoot
$hand = 'C:\Users\chong\agy-handoff'
$rules = @'
You translate one page of "Head First French", a French course web page, from English into Traditional Chinese.
Read the input file named below with your file-reading tool (view_file / read_file) ONLY. Never run shell commands, never use a terminal, never write files: you are not allowed to, and any attempt fails the job. Then print the translated page as your reply.

WRITING STYLE
- Standard written Chinese (書面語) in Traditional characters, natural for Hong Kong and Taiwan readers. Use 「」 for quotes.
- Keep the playful Head First tone: short sentences, direct "你", light jokes. It must read like a person wrote it, not a machine translation.
- Boxes with class "zh-note" are already Chinese but in spoken Cantonese. Rewrite them into 書面語 too, keeping every Jyutping/pinyin example and every Chinese example word exactly (e.g. 「書」(syu1) stays).
- Keep English example words where the point is about English (e.g. "café" vs "ca-fay", cognates like hospital/forest, "defenestrate"); you may add a Chinese gloss in brackets.
- Box titles: Sharpen your pencil → 削尖你的鉛筆; Brain Power → 動動腦; There are no Dumb Questions → 沒有蠢問題; Watch it! → 小心！; BULLET POINTS → 重點整理; Exam warm-up: X → 考試熱身：X; Who does what? → 配對遊戲; Fireside Chat → 爐邊對談; You already know this → 你早就懂了; Au Québec stays "Au Québec"; "Answers" → 答案; Check button → 檢查; "What is this, really?" → 這到底是甚麼？
- Q/A labels come from CSS, do not add "Q:"/"A:".

DO NOT CHANGE
- Any HTML tag, class, id, data-say, data-rate, width/height, or the document structure. Same number of elements, same order.
- Anything inside <span class="fr">...</span> or <button class="fr" ...>...</button> (that is French audio), any French text, any IPA in [brackets], numbers and score ranges.
- data-answer values that are French. If a <select> has English option words (like "said"/"silent", "link"/"no link", "nasal"/"real n/m", "same"/"different"), translate the options AND the matching data-answer identically, so data-answer still exactly equals one <option>.
- Translate aria-label text and alt text.

PATHS (the Chinese page lives one folder deeper, under zh/)
- <html lang="en"> becomes <html lang="zh-Hant">.
- For a page in ch/: ../style.css → ../../style.css and ../book.js → ../../book.js. Links to other chapters like 01-sounds.html stay unchanged.
- For index.html: style.css → ../style.css, book.js → ../book.js, assets/cover.jpg → ../assets/cover.jpg. Links like ch/00-intro.html stay unchanged.
- <title>: translate the part before " · " and end with " · Head First French 法語". For index.html the title is "Head First French 法語".

OUTPUT: only the complete HTML document, starting with <!doctype html> and ending with </html>. No markdown fences, no commentary.
'@
$jobs = foreach ($p in $Pages) {
  $name = ($p -replace '[\\/]', '_')
  Copy-Item (Join-Path $proj $p) (Join-Path $hand $name)
  $out = Join-Path $proj ('zh\' + $p)
  New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
  Start-Job -ArgumentList $rules, (Join-Path $hand $name), $out, $hand, $p -ScriptBlock {
    param($rules, $in, $out, $hand, $p)
    [Console]::OutputEncoding = [Text.Encoding]::UTF8   # agy prints UTF-8; without this the job decodes it as CP437
    $raw = agy -p "$rules`n`nINPUT FILE: $in (this page is $p)" --add-dir $hand --model gemini-3.8-flash-high --print-timeout 15m 2>&1 | Out-String
    $s = $raw.IndexOf('<!doctype'); if ($s -lt 0) { $s = $raw.IndexOf('<!DOCTYPE') }
    $e = $raw.LastIndexOf('</html>')
    if ($s -lt 0 -or $e -lt 0) { "FAIL $p :: " + $raw.Substring(0, [Math]::Min(400, $raw.Length)); return }
    [IO.File]::WriteAllText($out, $raw.Substring($s, $e - $s + 7) + "`n", (New-Object Text.UTF8Encoding $false))
    Remove-Item $in
    "OK $p -> $out ($((Get-Item $out).Length) bytes)"
  }
}
$jobs | Wait-Job | Receive-Job
