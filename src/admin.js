// Coach dashboard (#admin): bookings, day schedule, members
import { CLUB, PROGRAMS, PLANS, LEVELS, REWARDS, TIERS } from './content.js';
import { dateKey, pad } from './store.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Number(n || 0).toLocaleString('en-US');
const ST = { pending: 'รอยืนยัน', confirmed: 'ยืนยันแล้ว', cancelled: 'ยกเลิก', active: 'ใช้งาน' };
const courtName = (id) => CLUB.courts.find((c) => c.id === id)?.th || id;
const progName = (id) => PROGRAMS.find((p) => p.id === id)?.th.name || '';
const planName = (id) => PLANS.find((p) => p.id === id)?.th.name || id;
const levelName = (id) => LEVELS.find((l) => l.id === id)?.th || '';
const endT = (h, d) => `${pad(Math.floor(h + d))}:${(h + d) % 1 ? '30' : '00'}`;

export function createAdmin(root, store, onClose) {
  const st = { view: 'bookings', status: 'all', date: '', schedDate: dateKey(new Date()), bookings: [], members: [], points: [], authed: false, err: '', ok: '' };
  let unsub = null;

  let lastSig = '';
  async function load(fromPoll = false) {
    try {
      [st.bookings, st.members, st.points] = await Promise.all([store.listBookings(), store.listMembers(), store.listPoints ? store.listPoints() : []]);
      st.points.sort((a, b) => b.balance - a.balance);
      st.bookings.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      st.members.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      const sig = JSON.stringify([st.bookings, st.members, st.points]);
      if (fromPoll && sig === lastSig) return; // nothing changed: keep what the coach is typing
      lastSig = sig;
      if (st.err.startsWith('โหลด')) st.err = '';
    } catch (e) { st.err = 'โหลดข้อมูลไม่สำเร็จ: ' + (e.message || e.code || ''); }
    render();
  }

  function top() {
    return `<div class="adm-top">
      <a class="brand" href="#hero" data-close><span class="brand-ball"></span><span class="brand-word" lang="en">ON <b>COURT</b></span></a>
      <strong style="font-weight:600">แผงควบคุมโค้ช</strong>
      <div style="display:flex;gap:8px">${st.authed ? '<button class="btn btn-ghost btn-sm" data-refresh type="button">รีเฟรช</button>' : ''}<button class="btn btn-ghost btn-sm" data-close type="button">กลับหน้าเว็บ</button></div>
    </div>`;
  }

  function gate() {
    if (store.kind === 'artifact') {
      return `${top()}<div class="gate panel"><h2 class="h3">สำหรับเจ้าของเว็บเท่านั้น</h2><p class="body">หน้านี้แสดงเฉพาะเจ้าของหรือผู้แก้ไขลิงก์นี้บน claude.ai</p></div>`;
    }
    return `${top()}<form class="gate panel" data-login>
      <h2 class="h3">เข้าสู่ระบบโค้ช</h2>
      <label class="lbl" for="pin">รหัส PIN</label>
      <input class="input" id="pin" name="pin" type="password" inputmode="numeric" autocomplete="current-password" required>
      <p class="form-msg" role="alert">${esc(st.err)}</p>
      <button class="btn btn-optic" type="submit" style="width:100%;margin-top:8px">เข้าสู่ระบบ</button>
      ${store.kind === 'local' ? '<p class="store-note">โหมดทดลอง: PIN เริ่มต้นอยู่ในไฟล์ตั้งค่า (content.js)</p>' : ''}
    </form>`;
  }

  function stats() {
    const today = dateKey(new Date());
    const live = st.bookings.filter((b) => b.status !== 'cancelled');
    const todayN = live.filter((b) => b.date === today).length;
    const pend = st.bookings.filter((b) => b.status === 'pending').length;
    const memPend = st.members.filter((m) => m.status === 'pending').length;
    const upcoming = live.filter((b) => b.date >= today).reduce((a, b) => a + (b.price || 0), 0);
    return `<div class="stats">
      <div class="stat"><small>จองวันนี้</small><b>${todayN}</b></div>
      <div class="stat hot"><small>รอยืนยัน</small><b>${pend}</b></div>
      <div class="stat"><small>สมาชิกใหม่รออนุมัติ</small><b>${memPend}</b></div>
      <div class="stat"><small>ยอดที่จะเข้า (บาท)</small><b>${money(upcoming)}</b></div>
    </div>`;
  }

  function viewTabs() {
    return `<div class="tabs" role="tablist">${[['bookings', 'การจอง'], ['schedule', 'ตารางรายวัน'], ['members', 'สมาชิก'], ['points', 'แต้มสะสม']].map(([k, v]) =>
      `<button class="tab" type="button" role="tab" aria-selected="${st.view === k}" data-view="${k}">${v}</button>`).join('')}</div>`;
  }

  function bookingsView() {
    let list = st.bookings;
    if (st.status !== 'all') list = list.filter((b) => b.status === st.status);
    if (st.date) list = list.filter((b) => b.date === st.date);
    const rows = list.map((b) => `<tr>
      <td><b lang="en">${esc(b.ref)}</b><div class="sub">${new Date(b.createdAt).toLocaleString('th-TH-u-ca-gregory', { dateStyle: 'short', timeStyle: 'short' })}</div></td>
      <td>${b.type === 'lesson' ? 'เรียน · ' + esc(progName(b.program)) : 'เช่าคอร์ต'}<div class="sub">${esc(levelName(b.level))}</div></td>
      <td>${esc(b.date)}<div class="sub">${pad(b.hour)}:00–${endT(b.hour, b.duration)} · ${esc(courtName(b.court))}</div></td>
      <td>${esc(b.name)}<div class="sub"><a href="tel:${esc(b.phone)}">${esc(b.phone)}</a>${b.line ? ' · LINE ' + esc(b.line) : ''}</div>${b.note ? `<div class="sub">“${esc(b.note)}”</div>` : ''}</td>
      <td>${money(b.price)}</td>
      <td><span class="badge ${b.status}">${ST[b.status]}</span></td>
      <td><div class="act">
        ${b.status !== 'confirmed' ? `<button type="button" data-b="${b.id}" data-s="confirmed">ยืนยัน</button>` : ''}
        ${b.status !== 'cancelled' ? `<button type="button" data-b="${b.id}" data-s="cancelled">ยกเลิก</button>` : `<button type="button" data-b="${b.id}" data-s="pending">คืนสถานะ</button>`}
      </div></td></tr>`).join('');
    return `<div class="adm-tools">
        <select class="input" data-f="status" aria-label="กรองสถานะ">${[['all', 'ทุกสถานะ'], ['pending', 'รอยืนยัน'], ['confirmed', 'ยืนยันแล้ว'], ['cancelled', 'ยกเลิก']].map(([k, v]) => `<option value="${k}" ${st.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <input class="input" type="date" data-f="date" value="${esc(st.date)}" aria-label="กรองวัน">
        ${st.date ? '<button class="btn btn-ghost btn-sm" type="button" data-clear>ล้างวัน</button>' : ''}
        <span class="fine" style="margin:0">${list.length} รายการ</span>
      </div>
      ${list.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>รหัส</th><th>ประเภท</th><th>วัน-เวลา</th><th>ลูกค้า</th><th>บาท</th><th>สถานะ</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">ยังไม่มีการจองในเงื่อนไขนี้</div>'}`;
  }

  function scheduleView() {
    const cols = CLUB.courts.length + 1;
    const live = st.bookings.filter((b) => b.date === st.schedDate && b.status !== 'cancelled');
    let cells = `<div class="sched-h"></div>${CLUB.courts.map((c) => `<div class="sched-h"><b>${esc(c.th)}</b></div>`).join('')}`;
    for (let h = CLUB.openHour; h < CLUB.closeHour; h++) {
      cells += `<div class="sched-h">${pad(h)}:00</div>`;
      for (const c of CLUB.courts) {
        const b = live.find((x) => x.court === c.id && h >= x.hour && h < x.hour + Math.ceil(x.duration));
        cells += b
          ? `<div class="sched-cell busy ${b.type === 'lesson' ? 'lesson' : ''}">${h === b.hour ? `<b>${esc(b.name)}</b><div class="sub">${b.type === 'lesson' ? esc(progName(b.program)) : 'เช่าคอร์ต'} · ${ST[b.status]}</div>` : '↳'}</div>`
          : '<div class="sched-cell"></div>';
      }
    }
    return `<div class="adm-tools"><input class="input" type="date" data-f="schedDate" value="${esc(st.schedDate)}" aria-label="เลือกวัน">
      <span class="legend" style="margin:0"><span><i style="background:rgba(223,255,79,.3)"></i>เช่าคอร์ต</span><span><i style="background:rgba(255,214,160,.3)"></i>คลาสเรียน</span></span></div>
      <div class="tbl-wrap" style="padding:10px"><div class="sched" style="grid-template-columns:70px repeat(${cols - 1},minmax(140px,1fr))">${cells}</div></div>`;
  }

  function membersView() {
    const rows = st.members.map((m) => `<tr>
      <td><b lang="en">${esc(m.memberNo)}</b><div class="sub">${new Date(m.createdAt).toLocaleDateString('th-TH-u-ca-gregory')}</div></td>
      <td>${esc(m.name)}<div class="sub"><a href="tel:${esc(m.phone)}">${esc(m.phone)}</a>${m.email ? ' · ' + esc(m.email) : ''}${m.line ? ' · LINE ' + esc(m.line) : ''}</div></td>
      <td>${esc(planName(m.plan))}<div class="sub">${money(m.price)} บาท/เดือน · ${esc(levelName(m.level))}</div></td>
      <td><span class="badge ${m.status}">${ST[m.status]}</span></td>
      <td><div class="act">${m.status !== 'active' ? `<button type="button" data-m="${m.id}" data-s="active">อนุมัติ</button>` : ''}${m.status !== 'cancelled' ? `<button type="button" data-m="${m.id}" data-s="cancelled">ยกเลิก</button>` : ''}</div></td></tr>`).join('');
    return st.members.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>เลขสมาชิก</th><th>ชื่อ / ติดต่อ</th><th>แพ็กเกจ</th><th>สถานะ</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">ยังไม่มีผู้สมัครสมาชิก</div>';
  }

  function pointsView() {
    const names = {};
    [...st.bookings, ...st.members].forEach((r) => { if (r.phone && !names[r.phone]) names[r.phone] = r.name; });
    const tierName = (id) => TIERS.find((t) => t.id === id)?.name || id;
    const phones = [...new Set([...Object.keys(names), ...st.points.map((p) => p.phone)])];
    const rows = st.points.map((p) => `<tr>
      <td>${esc(names[p.phone] || '—')}<div class="sub">${esc(p.phone)}</div></td>
      <td><b class="pts-num">${money(p.balance)}</b></td><td>${money(p.lifetime)}</td>
      <td><span class="badge confirmed">${esc(tierName(p.tier))}</span></td>
      <td class="sub">${p.history[0] ? esc(new Date(p.history[0].createdAt).toLocaleDateString('th-TH-u-ca-gregory')) : ''}</td></tr>`).join('');
    return `<form class="pts-form panel" data-points>
        <div class="field"><label class="lbl" for="pp-phone">เบอร์ลูกค้า</label><input class="input" id="pp-phone" name="phone" list="pp-list" inputmode="tel" required placeholder="08xxxxxxxx"><datalist id="pp-list">${phones.map((p) => `<option value="${esc(p)}">${esc(names[p] || '')}</option>`).join('')}</datalist></div>
        <div class="field"><label class="lbl" for="pp-act">รายการ</label><select class="input" id="pp-act" name="act">
          ${REWARDS.map((r) => `<option value="redeem:${r.id}">แลก ${esc(r.th)} (−${r.pts})</option>`).join('')}
          <option value="add">เพิ่มแต้มเอง (+)</option><option value="sub">หักแต้มเอง (−)</option></select></div>
        <div class="field"><label class="lbl" for="pp-amt">จำนวน (เพิ่ม/หักเอง)</label><input class="input" id="pp-amt" name="amt" type="number" min="1" step="1" placeholder="เช่น 20"></div>
        <div class="field"><label class="lbl" for="pp-note">หมายเหตุ</label><input class="input" id="pp-note" name="note" placeholder="เช่น โปรวันเกิด"></div>
        <button class="btn btn-optic" type="submit">บันทึกแต้ม</button>
        <p class="form-msg ${st.ok ? 'ok' : ''}" role="status">${esc(st.ok || st.err)}</p>
      </form>
      ${st.points.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ลูกค้า</th><th>คงเหลือ</th><th>สะสมทั้งหมด</th><th>ระดับ</th><th>ล่าสุด</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<div class="empty">ยังไม่มีแต้มในระบบ แต้มจะเข้าอัตโนมัติเมื่อกดยืนยันการจองหรืออนุมัติสมาชิก</div>'}`;
  }

  function render() {
    const keep = {};
    root.querySelectorAll('.pts-form input, .pts-form select').forEach((el) => { keep[el.id] = el.value; });
    const focusId = document.activeElement?.id;
    renderInner();
    if (!st.ok) Object.entries(keep).forEach(([id, v]) => { const el = root.querySelector('#' + id); if (el) el.value = v; });
    if (focusId && keep[focusId] !== undefined) root.querySelector('#' + focusId)?.focus();
  }

  function renderInner() {
    if (!st.authed) { root.innerHTML = gate(); root.querySelector('#pin')?.focus(); return; }
    root.innerHTML = `${top()}<div class="adm-body">
      ${st.err && st.view !== 'points' ? `<p class="form-msg">${esc(st.err)}</p>` : ''}
      ${stats()}${viewTabs()}
      ${st.view === 'bookings' ? bookingsView() : st.view === 'schedule' ? scheduleView() : st.view === 'points' ? pointsView() : membersView()}
    </div>`;
  }

  root.addEventListener('click', async (e) => {
    const t = e.target.closest('button, a');
    if (!t) return;
    if (t.hasAttribute('data-close')) { e.preventDefault(); onClose(); return; }
    if (t.hasAttribute('data-refresh')) { load(); return; }
    if (t.hasAttribute('data-clear')) { st.date = ''; render(); return; }
    if (t.dataset.view) { st.view = t.dataset.view; st.err = ''; st.ok = ''; render(); return; }
    if (t.dataset.b || t.dataset.m) {
      t.disabled = true; st.err = '';
      try {
        if (t.dataset.b) await store.updateBooking(t.dataset.b, { status: t.dataset.s });
        else await store.updateMember(t.dataset.m, { status: t.dataset.s });
      } catch (err) { st.err = 'บันทึกไม่สำเร็จ: ' + (err.message || err.code); }
      load();
    }
  });
  root.addEventListener('change', (e) => { const f = e.target.dataset.f; if (f) { st[f] = e.target.value; render(); } });
  root.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (e.target.hasAttribute('data-points')) {
      const fd = new FormData(e.target);
      const phone = String(fd.get('phone') || '').replace(/\D/g, '');
      const act = String(fd.get('act'));
      const amt = Math.abs(parseInt(fd.get('amt'), 10) || 0);
      st.ok = ''; st.err = '';
      try {
        if (!/^0\d{8,9}$/.test(phone)) throw new Error('เบอร์โทรไม่ถูกต้อง');
        let entry;
        if (act.startsWith('redeem:')) {
          const r = REWARDS.find((x) => x.id === act.slice(7));
          const bal = (await store.getPoints(phone)).balance;
          if (bal < r.pts) throw new Error(`แต้มไม่พอ (มี ${bal} ต้องใช้ ${r.pts})`);
          entry = { phone, delta: -r.pts, reason: 'redeem', note: r.th + (fd.get('note') ? ' · ' + fd.get('note') : '') };
        } else {
          if (!amt) throw new Error('ใส่จำนวนแต้ม');
          entry = { phone, delta: act === 'sub' ? -amt : amt, reason: 'adjust', note: String(fd.get('note') || '') };
        }
        await store.addPoints(entry);
        st.ok = `บันทึกแล้ว: ${entry.delta > 0 ? '+' : ''}${entry.delta} แต้ม ให้ ${phone}`;
      } catch (err) { st.err = err.message; }
      load();
      return;
    }
    const pin = new FormData(e.target).get('pin');
    try {
      if (store.kind === 'api') await store.login(pin);
      else if (String(pin) !== CLUB.adminPin) throw new Error('PIN ไม่ถูกต้อง');
      try { sessionStorage.setItem('oncourt:admin', '1'); } catch {}
      st.authed = true; st.err = '';
      load();
    } catch (err) { st.err = err.code === 'bad_pin' || err.message === 'PIN ไม่ถูกต้อง' ? 'PIN ไม่ถูกต้อง' : (err.message || 'เข้าสู่ระบบไม่สำเร็จ'); render(); }
  });

  return {
    async open() {
      root.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      let ok = await store.isAdmin();
      if (!ok && store.kind === 'local') { try { ok = sessionStorage.getItem('oncourt:admin') === '1'; } catch {} }
      st.authed = ok;
      if (ok) await load(); else render();
      unsub = store.subscribe?.(() => { if (st.authed) load(true); });
      root.querySelector('button, input')?.focus();
    },
    close() { root.hidden = true; document.documentElement.style.overflow = ''; unsub && unsub(); unsub = null; },
  };
}
