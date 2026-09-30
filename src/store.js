// Data layer with three interchangeable back-ends:
//  1. ArtifactStore — claude.ai published page (shared database, owner = admin)
//  2. ApiStore      — our own Node server (server/server.js) for real hosting
//  3. LocalStore    — this browser only (demo / file preview)
// All expose the same async API so the UI never cares which one is live.
import { CLUB, COURT_RATE, PROGRAMS, PLANS, POINTS, TIERS } from './content.js';

export const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const rand = (n) => Array.from({ length: n }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

// ── pricing + slot rules (shared by every store and the server) ─────────
export function courtPrice(hour, duration) {
  let t = 0;
  for (let h = hour; h < hour + duration; h++) t += h >= CLUB.nightFrom ? COURT_RATE.night : COURT_RATE.day;
  return t;
}
export function lessonPrice(programId, duration) {
  const p = PROGRAMS.find((x) => x.id === programId);
  if (!p) return 0;
  return p.unit === 'month' ? p.price : Math.round(p.price * (duration / p.hours));
}
export function planPrice(planId) { return PLANS.find((p) => p.id === planId)?.price ?? 0; }

/** Occupied cells for one date: { 'c1:9': true, 'coach:10': true } */
export function occupancyFrom(bookings, date) {
  const occ = {};
  for (const b of bookings) {
    if (b.date !== date || b.status === 'cancelled') continue;
    for (let h = b.hour; h < b.hour + b.duration; h++) {
      occ[`${b.court}:${h}`] = true;
      if (b.type === 'lesson') occ[`coach:${h}`] = true;
    }
  }
  return occ;
}

export function validateBooking(b) {
  const errs = [];
  if (!['court', 'lesson'].includes(b.type)) errs.push('type');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date || '')) errs.push('date');
  if (!Number.isInteger(b.hour) || b.hour < CLUB.openHour || b.hour + b.duration > CLUB.closeHour) errs.push('hour');
  if (![1, 1.5, 2].includes(b.duration)) errs.push('duration');
  if (!CLUB.courts.some((c) => c.id === b.court)) errs.push('court');
  if (!b.name || b.name.trim().length < 2) errs.push('name');
  if (!/^0\d{8,9}$/.test((b.phone || '').replace(/\D/g, ''))) errs.push('phone');
  return errs;
}

/** Cells a booking needs; half hours round up so 1.5 h blocks 2 slots */
export function cellsFor(b) {
  const cells = [];
  for (let h = b.hour; h < b.hour + Math.ceil(b.duration); h++) {
    cells.push(`${b.court}:${h}`);
    if (b.type === 'lesson') cells.push(`coach:${h}`);
  }
  return cells;
}

export function makeBooking(input) {
  const duration = Number(input.duration) || 1;
  const b = {
    id: 'b_' + Date.now().toString(36) + rand(4),
    ref: 'OC-' + rand(5),
    type: input.type,
    date: input.date,
    hour: Number(input.hour),
    duration,
    court: input.court,
    program: input.type === 'lesson' ? input.program : null,
    level: input.level || null,
    name: (input.name || '').trim().slice(0, 80),
    phone: (input.phone || '').replace(/\D/g, '').slice(0, 10),
    line: (input.line || '').trim().slice(0, 40),
    note: (input.note || '').trim().slice(0, 400),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  b.price = b.type === 'court' ? courtPrice(b.hour, Math.ceil(duration)) : lessonPrice(b.program, duration);
  return b;
}

export function makeMember(input) {
  return {
    id: 'm_' + Date.now().toString(36) + rand(4),
    memberNo: 'OCM-' + rand(4),
    name: (input.name || '').trim().slice(0, 80),
    phone: (input.phone || '').replace(/\D/g, '').slice(0, 10),
    email: (input.email || '').trim().slice(0, 120),
    line: (input.line || '').trim().slice(0, 40),
    level: input.level || null,
    plan: input.plan || 'rally',
    price: planPrice(input.plan),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}


// ── points (shared by every store and the server) ──────────────────────
export const normPhone = (p) => String(p || '').replace(/\D/g, '').slice(0, 10);
export function tierFor(lifetime) { let t = TIERS[0]; for (const x of TIERS) if (lifetime >= x.min) t = x; return t; }
export function nextTier(lifetime) { return TIERS.find((x) => x.min > lifetime) || null; }
export function earnFor(price, lifetime = 0) { return Math.floor((price / POINTS.bahtPerPoint) * (1 + tierFor(lifetime).bonus)); }
export function makeEntry(phone, delta, reason, ref = '', note = '') {
  return { id: 'p_' + Date.now().toString(36) + rand(4), phone: normPhone(phone), delta: Math.round(Number(delta) || 0), reason, ref, note: String(note || '').slice(0, 120), createdAt: new Date().toISOString() };
}
export function summarize(entries) {
  let balance = 0, lifetime = 0;
  for (const e of entries) {
    balance += e.delta;
    if (e.reason !== 'redeem' && !(e.reason === 'adjust' && e.delta < 0)) lifetime += e.delta;
  }
  lifetime = Math.max(0, lifetime);
  const history = [...entries].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(({ phone, ...r }) => r);
  return { balance, lifetime, tier: tierFor(lifetime).id, next: nextTier(lifetime), history };
}
/** Points side-effects of a booking status change → { entries, patch } */
export function pointsOnBooking(b, status, lifetime) {
  if (status === 'confirmed' && !b.pointsAwarded) {
    const pts = earnFor(b.price, lifetime);
    return { entries: pts ? [makeEntry(b.phone, pts, 'booking', b.ref)] : [], patch: { pointsAwarded: pts } };
  }
  if (status !== 'confirmed' && b.pointsAwarded) return { entries: [makeEntry(b.phone, -b.pointsAwarded, 'reverse', b.ref)], patch: { pointsAwarded: 0 } };
  return { entries: [], patch: {} };
}
export function pointsOnMember(m, status) {
  if (status === 'active' && !m.bonusAwarded) return { entries: [makeEntry(m.phone, POINTS.signupBonus, 'signup', m.memberNo)], patch: { bonusAwarded: true } };
  return { entries: [], patch: {} };
}
export async function phoneKey(phone) {
  const data = new TextEncoder().encode('oncourt:' + normPhone(phone));
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].slice(0, 16).map((x) => x.toString(16).padStart(2, '0')).join('');
}
const maskPhone = (p) => { const n = normPhone(p); return n.slice(0, 3) + 'xxx' + n.slice(-4); };

class ConflictError extends Error { constructor() { super('conflict'); this.code = 'conflict'; } }

// ── 3. Local (browser only) ─────────────────────────────────────────────
class LocalStore {
  constructor() { this.kind = 'local'; this.subs = new Set(); window.addEventListener('storage', () => this.emit()); }
  read(k) { try { return JSON.parse(localStorage.getItem('oncourt:' + k) || '[]'); } catch { return this['mem_' + k] || []; } }
  write(k, v) { try { localStorage.setItem('oncourt:' + k, JSON.stringify(v)); } catch { this['mem_' + k] = v; } this.emit(); }
  emit() { this.subs.forEach((f) => f()); }
  subscribe(f) { this.subs.add(f); return () => this.subs.delete(f); }
  async occupancy(date) { return occupancyFrom(this.read('bookings'), date); }
  async createBooking(input) {
    const b = makeBooking(input);
    const occ = occupancyFrom(this.read('bookings'), b.date);
    if (cellsFor(b).some((c) => occ[c])) throw new ConflictError();
    this.write('bookings', [...this.read('bookings'), b]);
    return b;
  }
  async createMember(input) { const m = makeMember(input); this.write('members', [...this.read('members'), m]); return m; }
  async isAdmin() { return false; }
  async listBookings() { return this.read('bookings'); }
  async listMembers() { return this.read('members'); }
  async updateBooking(id, patch) {
    const b = this.read('bookings').find((x) => x.id === id);
    if (!b) return;
    if (patch.status) {
      const occ = occupancyFrom(this.read('bookings').filter((x) => x.id !== id), b.date);
      if (b.status === 'cancelled' && patch.status !== 'cancelled' && cellsFor(b).some((c) => occ[c])) throw new ConflictError();
      const r = pointsOnBooking(b, patch.status, (await this.getPoints(b.phone)).lifetime);
      if (r.entries.length) this.write('points', [...this.read('points'), ...r.entries]);
      patch = { ...patch, ...r.patch };
    }
    this.write('bookings', this.read('bookings').map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  async updateMember(id, patch) {
    const m = this.read('members').find((x) => x.id === id);
    if (!m) return;
    if (patch.status) { const r = pointsOnMember(m, patch.status); if (r.entries.length) this.write('points', [...this.read('points'), ...r.entries]); patch = { ...patch, ...r.patch }; }
    this.write('members', this.read('members').map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }
  async getPoints(phone) { const n = normPhone(phone); return summarize(this.read('points').filter((e) => e.phone === n)); }
  async addPoints({ phone, delta, reason = 'adjust', note = '' }) { const e = makeEntry(phone, delta, reason, '', note); this.write('points', [...this.read('points'), e]); return e; }
  async listPoints() {
    const by = {};
    for (const e of this.read('points')) (by[e.phone] ||= []).push(e);
    return Object.entries(by).map(([phone, es]) => ({ phone, ...summarize(es) }));
  }
}

// ── 2. Own server (/api) ────────────────────────────────────────────────
class ApiStore {
  constructor(base) { this.kind = 'api'; this.base = base; this.token = ''; try { this.token = sessionStorage.getItem('oncourt:token') || ''; } catch {} }
  async req(path, opts = {}) {
    const r = await fetch(this.base + path, { ...opts, headers: { 'content-type': 'application/json', ...(this.token ? { authorization: 'Bearer ' + this.token } : {}) } });
    const j = await r.json().catch(() => ({}));
    if (r.status === 409) throw new ConflictError();
    if (!r.ok) throw Object.assign(new Error(j.error || 'request failed'), { code: j.error || 'http_' + r.status });
    return j;
  }
  subscribe(f) { const t = setInterval(f, 15000); return () => clearInterval(t); }
  async occupancy(date) { return (await this.req('/occupancy?date=' + date)).occ; }
  async createBooking(input) { return (await this.req('/bookings', { method: 'POST', body: JSON.stringify(input) })).booking; }
  async createMember(input) { return (await this.req('/members', { method: 'POST', body: JSON.stringify(input) })).member; }
  async login(pin) { const j = await this.req('/login', { method: 'POST', body: JSON.stringify({ pin }) }); this.token = j.token; try { sessionStorage.setItem('oncourt:token', j.token); } catch {} return true; }
  async isAdmin() { if (!this.token) return false; try { await this.req('/bookings'); return true; } catch { return false; } }
  async listBookings() { return (await this.req('/bookings')).bookings; }
  async listMembers() { return (await this.req('/members')).members; }
  async updateBooking(id, patch) { await this.req('/bookings/' + id, { method: 'PATCH', body: JSON.stringify(patch) }); }
  async updateMember(id, patch) { await this.req('/members/' + id, { method: 'PATCH', body: JSON.stringify(patch) }); }
  async getPoints(phone) { return (await this.req('/points?phone=' + normPhone(phone))).points; }
  async addPoints(e) { return (await this.req('/points', { method: 'POST', body: JSON.stringify(e) })).entry; }
  async listPoints() { return (await this.req('/points/all')).list; }
}

// ── 1. claude.ai Artifact database ──────────────────────────────────────
// Paths: slots/<date>_<cell>        public occupancy (no personal data)
//        bookings/<viewerId>        { items: { <bookingId>: booking } }  — owner/editors + that viewer only
//        members/<viewerId>         { items: { <memberId>: member } }
// Rules (declared at publish): bookings & members read/write admin, <prefix>/{self} write interact.
class ArtifactStore {
  constructor(db, user, uid) { this.kind = 'artifact'; this.db = db; this.user = user; this.uid = uid; }
  subscribe(f) {
    const u = this.db.collection('slots').onSnapshot(() => f(), () => {});
    return () => u();
  }
  async occupancy(date) {
    const snap = await this.db.collection('slots').where('date', '==', date).get();
    const occ = {};
    snap.docs.forEach((d) => { const v = d.data(); if (v && v.taken) occ[v.cell] = true; });
    return occ;
  }
  slotRef(date, cell) { return this.db.doc(`slots/${date}_${cell.replace(':', '-')}`); }
  async addItem(col, rec) {
    const ref = this.db.doc(`${col}/${this.uid}`);
    const cur = await ref.get();
    const items = { ...((cur.exists && cur.data().items) || {}) };
    items[rec.id] = rec;
    await ref.set({ items, updatedAt: rec.createdAt });
  }
  async createBooking(input) {
    const b = makeBooking(input);
    b.owner = this.uid;
    const cells = cellsFor(b);
    const snaps = await Promise.all(cells.map((c) => this.slotRef(b.date, c).get()));
    if (snaps.some((s) => s.exists && s.data().taken)) throw new ConflictError();
    for (const c of cells) await this.slotRef(b.date, c).set({ date: b.date, cell: c, taken: true, booking: b.id });
    await this.addItem('bookings', b);
    return b;
  }
  async createMember(input) { const m = makeMember(input); m.owner = this.uid; await this.addItem('members', m); return m; }
  async isAdmin() { try { return !!(await this.user?.canEdit()); } catch { return false; } }
  async listAll(col) {
    const snap = await this.db.collection(col).get();
    return snap.docs.flatMap((d) => Object.values((d.data() && d.data().items) || {}).map((r) => ({ ...r, owner: d.id })));
  }
  listBookings() { return this.listAll('bookings'); }
  listMembers() { return this.listAll('members'); }
  async patchItem(col, id, patch) {
    const all = await this.listAll(col);
    const rec = all.find((r) => r.id === id);
    if (!rec) throw new Error('not found');
    const ref = this.db.doc(`${col}/${rec.owner}`);
    const cur = (await ref.get()).data() || { items: {} };
    const items = { ...cur.items, [id]: { ...cur.items[id], ...patch } };
    await ref.set({ ...cur, items });
    return items[id];
  }
  async pointsDoc(phone) { const ref = this.db.doc('points/' + (await phoneKey(phone))); const snap = await ref.get(); return { ref, entries: (snap.exists && snap.data().entries) || [] }; }
  async pushEntries(phone, entries) {
    if (!entries.length) return;
    const { ref, entries: cur } = await this.pointsDoc(phone);
    await ref.set({ masked: maskPhone(phone), entries: [...cur, ...entries].slice(-400) });
  }
  async getPoints(phone) { return summarize((await this.pointsDoc(phone)).entries); }
  async addPoints({ phone, delta, reason = 'adjust', note = '' }) { const e = makeEntry(phone, delta, reason, '', note); await this.pushEntries(phone, [e]); return e; }
  async listPoints() {
    const snap = await this.db.collection('points').get();
    const phones = new Set([...(await this.listBookings()), ...(await this.listMembers())].map((r) => normPhone(r.phone)));
    const keyToPhone = {};
    for (const p of phones) keyToPhone[await phoneKey(p)] = p;
    return snap.docs.map((d) => ({ phone: keyToPhone[d.id] || d.data().masked, ...summarize(d.data().entries || []) }));
  }
  async updateBooking(id, patch) {
    if (patch.status) {
      const cur = (await this.listAll('bookings')).find((r) => r.id === id);
      if (cur) { const r = pointsOnBooking(cur, patch.status, (await this.getPoints(cur.phone)).lifetime); await this.pushEntries(cur.phone, r.entries); patch = { ...patch, ...r.patch }; }
    }
    const b = await this.patchItem('bookings', id, patch);
    if (patch.status) {
      const taken = patch.status !== 'cancelled';
      for (const c of cellsFor(b)) await this.slotRef(b.date, c).set({ date: b.date, cell: c, taken, booking: b.id });
    }
  }
  async updateMember(id, patch) {
    if (patch.status) {
      const cur = (await this.listAll('members')).find((r) => r.id === id);
      if (cur) { const r = pointsOnMember(cur, patch.status); await this.pushEntries(cur.phone, r.entries); patch = { ...patch, ...r.patch }; }
    }
    await this.patchItem('members', id, patch);
  }
}

export async function connectStore() {
  // Own server first (same origin), when present
  // (server/server.js injects window.__ONCOURT_API__ into the page it serves)
  if (window.__ONCOURT_API__) {
    try {
      const r = await fetch(window.__ONCOURT_API__ + '/health', { cache: 'no-store' });
      if (r.ok && (await r.json()).ok) return new ApiStore(window.__ONCOURT_API__);
    } catch {}
  }
  // claude.ai artifact runtime
  if (window.claude && typeof window.claude.use === 'function') {
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      const uid = db && user ? await user.id() : null;
      if (db && uid) return new ArtifactStore(db, user, uid);
    } catch {}
  }
  return new LocalStore();
}
