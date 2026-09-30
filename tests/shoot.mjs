import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:3000/';
const out = '/tmp/claude-0/shots/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(4000);
await page.screenshot({ path: out + 'd0-hero.png' });
const ids = ['coach', 'method', 'film', 'programs', 'court', 'fame', 'shop', 'member', 'points', 'book', 'gallery'];
for (const id of ids) {
  await page.evaluate((id) => { const el = document.getElementById(id); const y = el.getBoundingClientRect().top + scrollY + (id === 'method' ? el.offsetHeight * 0.5 - innerHeight/2 : el.offsetHeight / 2 - innerHeight / 2); window.scrollTo(0, ['book','film','fame','shop','points','gallery'].includes(id)? el.getBoundingClientRect().top + scrollY - 40 : y); }, id);
  await page.waitForTimeout(7000);
  await page.screenshot({ path: out + `d-${id}.png` });
}
await page.close();
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
m.on('pageerror', (e) => errs.push('m pageerror: ' + e.message));
await m.goto(url, { waitUntil: 'load', timeout: 90000 }); await m.waitForTimeout(5000);
await m.screenshot({ path: out + 'm0-hero.png' });
for (const id of ['coach', 'film', 'fame', 'points']) {
  await m.evaluate((id) => { const el = document.getElementById(id); window.scrollTo(0, el.getBoundingClientRect().top + scrollY + (id==='book'?-60:0)); }, id);
  await m.waitForTimeout(5000); await m.screenshot({ path: out + `m-${id}.png` });
}
await m.click('#burger'); await m.waitForTimeout(800); await m.screenshot({ path: out + 'm-menu.png' });
console.log(errs.join('\n') || 'no console errors');
await browser.close();
