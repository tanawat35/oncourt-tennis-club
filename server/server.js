// OnCourt production server — zero dependencies (Node 18+).
//   npm run build && npm start        → http://localhost:3000
// Serves dist/ and a small JSON API. Data lives in server/data.json.
// Set ADMIN_PIN in the environment before going live (default: 2026).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { makeBooking, makeMember, validateBooking, occupancyFrom, cellsFor, summarize, makeEntry, normPhone, pointsOnBooking, pointsOnMember } from '../src/store.js';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dir, '..', 'dist');
const DATA = process.env.DATA_FILE || path.join(__dir, 'data.json');
const PORT = Number(process.env.PORT) || 3000;
const PIN = process.env.ADMIN_PIN || '2026';
const tokens = new Set();

const load = () => { try { return { points: [], ...JSON.parse(fs.readFileSync(DATA, 'utf8')) }; } catch { return { bookings: [], members: [], points: [] }; } };
const pointsOf = (phone) => summarize(db.points.filter((e) => e.phone === normPhone(phone)));
let db = load();
const save = () => { fs.writeFileSync(DATA + '.tmp', JSON.stringify(db, null, 2)); fs.renameSync(DATA + '.tmp', DATA); };

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json' };
const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
const body = (req) => new Promise((ok) => { let s = ''; req.on('data', (c) => { s += c; if (s.length > 1e5) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(s || '{}')); } catch { ok({}); } }); });
const authed = (req) => tokens.has((req.headers.authorization || '').replace('Bearer ', ''));

// naive per-IP rate limit for public writes
const hits = new Map();
const limited = (req) => { const ip = req.socket.remoteAddress; const now = Date.now(); const h = (hits.get(ip) || []).filter((t) => now - t < 60000); h.push(now); hits.set(ip, h); return h.length > 10; };

async function api(req, res, url) {
  const p = url.pathname.replace(/^\/api/, '');
  if (p === '/health') return json(res, 200, { ok: true });
  if (p === '/occupancy' && req.method === 'GET') return json(res, 200, { occ: occupancyFrom(db.bookings, url.searchParams.get('date')) });
  if (p === '/points' && req.method === 'GET') return json(res, 200, { points: pointsOf(url.searchParams.get('phone')) });
  if (p === '/login' && req.method === 'POST') {
    const { pin } = await body(req);
    if (String(pin) !== PIN) return json(res, 401, { error: 'bad_pin' });
    const t = crypto.randomBytes(24).toString('hex'); tokens.add(t); return json(res, 200, { token: t });
  }
  if (p === '/bookings' && req.method === 'POST') {
    if (limited(req)) return json(res, 429, { error: 'rate_limited' });
    const b = makeBooking(await body(req));
    const errs = validateBooking(b);
    if (errs.length) return json(res, 400, { error: 'invalid:' + errs.join(',') });
    const occ = occupancyFrom(db.bookings, b.date);
    if (cellsFor(b).some((c) => occ[c])) return json(res, 409, { error: 'conflict' });
    db.bookings.push(b); save();
    return json(res, 201, { booking: b });
  }
  if (p === '/members' && req.method === 'POST') {
    if (limited(req)) return json(res, 429, { error: 'rate_limited' });
    const m = makeMember(await body(req));
    if (m.name.length < 2 || !/^0\d{8,9}$/.test(m.phone)) return json(res, 400, { error: 'invalid' });
    db.members.push(m); save();
    return json(res, 201, { member: m });
  }
  if (!authed(req)) return json(res, 401, { error: 'unauthorized' });
  if (p === '/bookings' && req.method === 'GET') return json(res, 200, { bookings: db.bookings });
  if (p === '/members' && req.method === 'GET') return json(res, 200, { members: db.members });
  if (p === '/points/all' && req.method === 'GET') {
    const by = {};
    for (const e of db.points) (by[e.phone] ||= []).push(e);
    return json(res, 200, { list: Object.entries(by).map(([phone, es]) => ({ phone, ...summarize(es) })) });
  }
  if (p === '/points' && req.method === 'POST') {
    const { phone, delta, reason, note } = await body(req);
    if (!/^0\d{8,9}$/.test(normPhone(phone)) || !Number(delta) || !['adjust', 'redeem'].includes(reason)) return json(res, 400, { error: 'invalid' });
    if (reason === 'redeem' && pointsOf(phone).balance + Number(delta) < 0) return json(res, 400, { error: 'insufficient' });
    const e = makeEntry(phone, delta, reason, '', note); db.points.push(e); save();
    return json(res, 201, { entry: e });
  }
  const m = p.match(/^\/(bookings|members)\/([\w-]+)$/);
  if (m && req.method === 'PATCH') {
    const { status } = await body(req);
    if (!['pending', 'confirmed', 'cancelled', 'active'].includes(status)) return json(res, 400, { error: 'invalid' });
    const rec = db[m[1]].find((x) => x.id === m[2]);
    if (!rec) return json(res, 404, { error: 'not_found' });
    if (m[1] === 'bookings' && rec.status === 'cancelled' && status !== 'cancelled') {
      const occ = occupancyFrom(db.bookings.filter((x) => x.id !== rec.id), rec.date);
      if (cellsFor(rec).some((c) => occ[c])) return json(res, 409, { error: 'conflict' });
    }
    const r = m[1] === 'bookings' ? pointsOnBooking(rec, status, pointsOf(rec.phone).lifetime) : pointsOnMember(rec, status);
    db.points.push(...r.entries); Object.assign(rec, r.patch);
    rec.status = status; save();
    return json(res, 200, { ok: true });
  }
  return json(res, 404, { error: 'not_found' });
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) return api(req, res, url).catch((e) => json(res, 500, { error: e.message }));
  let file = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)));
  if (!file.startsWith(DIST)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(DIST, 'index.html');
  const ext = path.extname(file);
  let data = fs.readFileSync(file);
  if (ext === '.html') data = data.toString().replace('<head>', '<head><script>window.__ONCOURT_API__="./api"</script>');
  res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable' });
  res.end(data);
}).listen(PORT, () => console.log(`OnCourt running → http://localhost:${PORT}`));
