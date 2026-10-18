// Full-page screenshots over CDP, light + dark, desktop + phone width. Prints page errors.
// usage: node tools/shot.mjs <outdir> <page.html> [page.html ...]
// Adapted from Desktop\public\QuickProject\wallpaper\_tools\shot.mjs
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, basename } from 'node:path';
const [out, ...pages] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--remote-debugging-port=9334', '--hide-scrollbars',
  `--user-data-dir=${mkdtempSync(join(tmpdir(), 'cdp'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws;
for (let i = 0; i < 50 && !ws; i++) { try { const j = await (await fetch('http://127.0.0.1:9334/json/list')).json(); ws = j.find(t => t.type === 'page').webSocketDebuggerUrl; } catch { await sleep(200); } }
const sock = new WebSocket(ws); await new Promise(r => sock.onopen = r);
let id = 0; const pending = {};
sock.onmessage = e => { const m = JSON.parse(e.data); if (m.id) pending[m.id]?.(m.result ?? m.error); if (m.method === 'Runtime.exceptionThrown') console.log('EXCEPTION', JSON.stringify(m.params.exceptionDetails).slice(0, 400)); if (m.method === 'Runtime.consoleAPICalled') console.log('console', m.params.args.map(a => a.value).join(' ')); };
const send = (method, params = {}) => new Promise(r => { pending[++id] = r; sock.send(JSON.stringify({ id, method, params })); });
await send('Runtime.enable');
for (const page of pages) for (const [w, scheme] of [[1280, 'light'], [390, 'light'], [390, 'dark'], [1280, 'dark']]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 600 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
  await send('Page.navigate', { url: 'file:///' + resolve(page).replace(/\\/g, '/') });
  await sleep(2500);
  const { result } = await send('Runtime.evaluate', { expression: 'JSON.stringify([document.documentElement.scrollWidth, document.documentElement.scrollHeight])' });
  const [sw, sh] = JSON.parse(result.value);
  if (sw > w) console.log(`${basename(page)} @${w}: horizontal overflow, scrollWidth ${sw}`);
  const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: Math.min(sh, 16000), scale: 1 } });
  const name = `${basename(page, '.html')}_${w}_${scheme}.jpg`;
  writeFileSync(join(out, name), Buffer.from(data, 'base64'));
  console.log(name, sh + 'px tall');
}
sock.close(); chrome.kill();
process.exit(0);
