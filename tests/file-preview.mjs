import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); const errs = []; const failed = [];
p.on('pageerror', (e) => errs.push(e.message)); p.on('requestfailed', (r) => failed.push(r.url().slice(-40)));
await p.goto('file://' + process.cwd() + '/OnCourt-preview.html'); await p.waitForTimeout(4000);
const r = await p.evaluate(() => ({ imgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src.slice(-30)), cards: document.querySelectorAll('.card img').length, store: document.querySelector('.store-note')?.textContent }));
console.log(JSON.stringify(r), errs, failed.slice(0, 5));
await b.close();
