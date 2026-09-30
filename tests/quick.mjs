import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:4000/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } }); const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url); await p.waitForTimeout(5000);
await p.screenshot({ path: '/tmp/claude-0/shots/q-hero.png' });
await p.evaluate(() => { const el = document.getElementById('court'); scrollTo(0, el.getBoundingClientRect().top + scrollY + el.offsetHeight / 2 - innerHeight / 2); }); await p.waitForTimeout(8000);
await p.screenshot({ path: '/tmp/claude-0/shots/q-court.png' });
await p.close();
const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await m.goto(url, { timeout: 90000 }); await m.waitForTimeout(4000);
for (const id of ['film', 'fame', 'points']) { await m.evaluate((id) => scrollTo(0, document.getElementById(id).getBoundingClientRect().top + scrollY - 20), id); await m.waitForTimeout(3000); await m.screenshot({ path: `/tmp/claude-0/shots/q-m-${id}.png` }); }
const ow = await m.evaluate(() => document.documentElement.scrollWidth - innerWidth);
console.log('mobile horizontal overflow px:', ow, errs);
await b.close();
