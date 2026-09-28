// Visual check: play a chapter to a story node and screenshot it (no visible browser needed).
//   node scripts/shoot.mjs <chapterId> <stopNode> [choices,comma,separated] [out.png] [WxH]
// Uses the headless Chrome installed by HyperFrames, or $CHROME.
import puppeteer from 'puppeteer-core';
import { globSync } from 'node:fs';
import os from 'node:os';

const [ch = 'renzhichu', stop = 'start', picks = '', out = 'shot.png', size = '1280x800'] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
const chrome = process.env.CHROME || globSync(`${os.homedir()}/.cache/hyperframes/chrome/chrome-headless-shell/*/*/chrome-headless-shell`)[0];
const browser = await puppeteer.launch({ executablePath: chrome, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
await page.goto(process.env.URL || 'http://localhost:5178/', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.__test);
if (ch !== 'cover') {
  const node = await page.evaluate((c, s, p) => window.__test.drive(c, p ? p.split(',') : [], s === 'lesson' ? null : s, 40), ch, stop, picks);
  console.log('reached', node);
}
await page.evaluate(() => { window.__test.settle(8); });
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: out });
console.log('saved', out);
await browser.close();
