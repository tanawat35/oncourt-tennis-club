// Booking widget: court rental, coach lessons, membership sign-up
import { CLUB, PROGRAMS, PLANS, LEVELS, I18N } from './content.js';
import { dateKey, pad, courtPrice, lessonPrice, planPrice, earnFor } from './store.js';
import { POINTS } from './content.js';
import { promptpayQR } from './promptpay.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Number(n).toLocaleString('en-US');

export function durationsFor(programId) {
  if (programId === 'group') return [1.5];
  if (programId === 'junior') return [1];
  return [1, 1.5, 2];
}

export function createBooker(root, store, getLang, modal) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: CLUB.bookAheadDays }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i); return d; });
  const st = {
    tab: 'court', date: dateKey(days[0]), court: CLUB.courts[0].id, duration: 1, hour: null,
    program: 'private', level: 'beginner', plan: 'baseline',
    form: { name: '', phone: '', line: '', email: '', note: '' },
    occ: {}, errors: {}, msg: '', busy: false,
  };
  const T = () => I18N[getLang()].book;
  const L = () => getLang();

  async function loadOcc() {
    try { st.occ = await store.occupancy(st.date); } catch { st.occ = {}; }
    // drop a selection that is no longer available
    if (st.hour != null && !slotState(st.hour).ok) st.hour = null;
    renderTimes(); renderSummary();
  }

  function slotState(h) {
    const need = Math.ceil(st.duration);
    const now = new Date();
    if (h + need > CLUB.closeHour) return { ok: false, why: 'taken' };
    if (st.date === dateKey(now) && h <= now.getHours()) return { ok: false, why: 'past' };
    if (st.tab === 'court') {
      for (let k = h; k < h + need; k++) if (st.occ[`${st.court}:${k}`]) return { ok: false, why: 'taken' };
      return { ok: true, court: st.court };
    }
    for (let k = h; k < h + need; k++) if (st.occ[`coach:${k}`]) return { ok: false, why: 'coach' };
    const court = CLUB.courts.find((c) => { for (let k = h; k < h + need; k++) if (st.occ[`${c.id}:${k}`]) return false; return true; });
    return court ? { ok: true, court: court.id } : { ok: false, why: 'taken' };
  }

  function price() {
    if (st.tab === 'court') return st.hour == null ? 0 : courtPrice(st.hour, Math.ceil(st.duration));
    if (st.tab === 'lesson') return lessonPrice(st.program, st.duration);
    return planPrice(st.plan);
  }

  function fmtDate(key) {
    const [y, m, d] = key.split('-').map(Number);
    const dt = new Date(y, m - 1, d); const t = I18N[L()];
    return `${t.weekdays[dt.getDay()]} ${d} ${t.months[m - 1]}`;
  }
  const endTime = (h, d) => `${pad(Math.floor(h + d))}:${(h + d) % 1 ? '30' : '00'}`;

  // ── templates
  function tplTabs() {
    const t = T();
    return `<div class="tabs" role="tablist" aria-label="${esc(t.title)}">
      ${[['court', t.tabCourt], ['lesson', t.tabLesson], ['member', t.tabMember]].map(([k, v]) =>
        `<button class="tab" role="tab" type="button" data-tab="${k}" aria-selected="${st.tab === k}" aria-controls="bk-panel" id="tab-${k}">${esc(v)}</button>`).join('')}
    </div>`;
  }
  function tplDates() {
    const t = I18N[L()];
    return `<fieldset class="field"><legend>${esc(T().date)}</legend><div class="chips scroll">
      ${days.map((d) => { const k = dateKey(d); return `<label class="chip date"><input type="radio" name="date" value="${k}" ${st.date === k ? 'checked' : ''}><span><small>${t.weekdays[d.getDay()]}</small><b>${d.getDate()}</b><small>${t.months[d.getMonth()]}</small></span></label>`; }).join('')}
    </div></fieldset>`;
  }
  function tplDuration(list) {
    return `<fieldset class="field"><legend>${esc(T().duration)}</legend><div class="chips">
      ${list.map((d) => `<label class="chip"><input type="radio" name="duration" value="${d}" ${st.duration === d ? 'checked' : ''}><span>${d} ${esc(T().hr)}</span></label>`).join('')}
    </div></fieldset>`;
  }
  function tplContact(withEmail) {
    const t = T(), e = st.errors, f = st.form;
    const inp = (k, type, label, extra = '') => `<div class="field"><label for="f-${k}">${esc(label)}</label>
      <input class="input" id="f-${k}" name="${k}" type="${type}" value="${esc(f[k])}" ${extra} aria-invalid="${!!e[k]}" aria-describedby="e-${k}"><span class="err" id="e-${k}">${e[k] ? esc(e[k]) : ''}</span></div>`;
    return `${inp('name', 'text', t.name, 'autocomplete="name" required')}
      <div class="row-2">${inp('phone', 'tel', t.phone, 'autocomplete="tel" inputmode="tel" required placeholder="08x-xxx-xxxx"')}${inp('line', 'text', t.line)}</div>
      ${withEmail ? inp('email', 'email', t.email, 'autocomplete="email"') : ''}`;
  }
  function tplLevel() {
    return `<div class="field"><label for="f-level">${esc(T().level)}</label><select class="input" id="f-level" name="level">
      ${LEVELS.map((l) => `<option value="${l.id}" ${st.level === l.id ? 'selected' : ''}>${esc(l[L()])}</option>`).join('')}</select></div>`;
  }

  function tplCourt() {
    const t = T();
    return `${tplDates()}
      <fieldset class="field"><legend>${esc(t.court)}</legend><div class="chips">
        ${CLUB.courts.map((c) => `<label class="chip"><input type="radio" name="court" value="${c.id}" ${st.court === c.id ? 'checked' : ''}><span>${esc(c[L()])}</span></label>`).join('')}
      </div></fieldset>
      ${tplDuration([1, 2])}
      <fieldset class="field"><legend>${esc(t.time)}</legend><div class="times" id="bk-times"></div>${tplLegend()}</fieldset>
      ${tplContact(false)}
      <div class="field"><label for="f-note">${esc(t.note)}</label><textarea class="input" id="f-note" name="note">${esc(st.form.note)}</textarea></div>`;
  }
  function tplLesson() {
    const t = T();
    return `<fieldset class="field"><legend>${esc(t.program)}</legend><div class="prog-pick">
        ${PROGRAMS.map((p) => `<label class="chip"><input type="radio" name="program" value="${p.id}" ${st.program === p.id ? 'checked' : ''}><span><b>${esc(p[L()].name)}</b><small>${esc(p[L()].tag)}</small></span></label>`).join('')}
      </div></fieldset>
      ${tplDates()}
      ${tplDuration(durationsFor(st.program))}
      <fieldset class="field"><legend>${esc(t.time)}</legend><div class="times" id="bk-times"></div>${tplLegend()}</fieldset>
      ${tplLevel()}
      ${tplContact(false)}
      <div class="field"><label for="f-note">${esc(t.note)}</label><textarea class="input" id="f-note" name="note">${esc(st.form.note)}</textarea></div>`;
  }
  function tplMember() {
    const t = T();
    return `<fieldset class="field"><legend>${esc(t.plan)}</legend><div class="prog-pick">
        ${PLANS.map((p) => `<label class="chip"><input type="radio" name="plan" value="${p.id}" ${st.plan === p.id ? 'checked' : ''}><span><b>${esc(p[L()].name)}</b><small>${p.price ? money(p.price) + ' ' + esc(p[L()].note) : esc(p[L()].note)}</small></span></label>`).join('')}
      </div></fieldset>
      ${tplContact(true)}
      ${tplLevel()}`;
  }
  function tplLegend() {
    const t = T();
    return `<div class="legend"><span><i></i>${esc(t.free)}</span><span class="n"><i></i>${esc(I18N[L()].court.night)}</span><span class="t"><i></i>${esc(t.taken)}</span></div>`;
  }

  function renderTimes() {
    const box = root.querySelector('#bk-times');
    if (!box) return;
    const t = T();
    let html = '';
    for (let h = CLUB.openHour; h < CLUB.closeHour; h++) {
      const s = slotState(h);
      const label = s.ok ? t.free : s.why === 'past' ? t.past : s.why === 'coach' ? t.coachBusy : t.taken;
      html += `<label class="chip ${h >= CLUB.nightFrom ? 'night' : ''}"><input type="radio" name="hour" value="${h}" ${st.hour === h ? 'checked' : ''} ${s.ok ? '' : 'disabled'} aria-label="${pad(h)}:00 ${esc(label)}"><span>${pad(h)}:00<small>${esc(label)}</small></span></label>`;
    }
    box.innerHTML = html;
  }

  function renderSummary() {
    const box = root.querySelector('#bk-summary');
    if (!box) return;
    const t = T(), lang = L();
    const lines = [];
    if (st.tab === 'member') {
      const p = PLANS.find((x) => x.id === st.plan);
      lines.push([t.sum.plan, p[lang].name]);
    } else {
      if (st.tab === 'lesson') lines.push([t.sum.program, PROGRAMS.find((p) => p.id === st.program)[lang].name]);
      lines.push([t.sum.date, fmtDate(st.date)]);
      lines.push([t.sum.time, st.hour == null ? '—' : `${pad(st.hour)}:00–${endTime(st.hour, st.duration)}`]);
      const s = st.hour == null ? null : slotState(st.hour);
      const courtId = st.tab === 'court' ? st.court : s?.court;
      lines.push([t.sum.court, courtId ? CLUB.courts.find((c) => c.id === courtId)[lang] : '—']);
    }
    const total = price();
    box.innerHTML = `${lines.map(([k, v]) => `<div class="sum-line"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}
      <div class="sum-total"><span>${esc(t.total)}</span><span><b>${money(total)}</b> ฿</span></div>
      <div class="sum-earn"><span>${esc(t.earn)}</span><span class="pts-chip">+${st.tab === 'member' ? POINTS.signupBonus : earnFor(total)}</span></div>
      <button class="btn btn-optic" type="submit" ${st.busy ? 'disabled' : ''}>${esc(st.busy ? t.saving : st.tab === 'member' ? t.submitMember : t.submit)}</button>
      <p class="form-msg" role="alert">${esc(st.msg)}</p>
      ${store.kind === 'local' ? `<p class="store-note">${esc(t.demoNote)}</p>` : ''}`;
  }

  function render() {
    const body = st.tab === 'court' ? tplCourt() : st.tab === 'lesson' ? tplLesson() : tplMember();
    root.innerHTML = `${tplTabs()}
      <form id="bk-panel" role="tabpanel" aria-labelledby="tab-${st.tab}" novalidate>
        <div class="bk-grid"><div>${body}</div><aside class="summary" id="bk-summary" aria-live="polite"></aside></div>
      </form>`;
    renderTimes(); renderSummary();
  }

  function validate() {
    const t = T(), e = {};
    if (st.form.name.trim().length < 2) e.name = t.required;
    const ph = st.form.phone.replace(/\D/g, '');
    if (!ph) e.phone = t.required; else if (!/^0\d{8,9}$/.test(ph)) e.phone = t.phoneBad;
    if (st.tab === 'member' && st.form.email && !/^\S+@\S+\.\S+$/.test(st.form.email)) e.email = t.required;
    st.errors = e;
    return !Object.keys(e).length;
  }

  async function submit() {
    const t = T();
    st.msg = '';
    if (st.tab !== 'member' && st.hour == null) { st.msg = t.pickSlot; renderSummary(); root.querySelector('#bk-times')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    if (!validate()) {
      render();
      root.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    st.busy = true; renderSummary();
    try {
      if (st.tab === 'member') {
        const m = await store.createMember({ ...st.form, level: st.level, plan: st.plan });
        await showSuccess({ kind: 'member', rec: m });
      } else {
        const s = slotState(st.hour);
        const b = await store.createBooking({
          type: st.tab, date: st.date, hour: st.hour, duration: st.duration,
          court: st.tab === 'court' ? st.court : s.court, program: st.program, level: st.level, ...st.form,
        });
        await showSuccess({ kind: 'booking', rec: b });
        st.hour = null;
        st.form.note = '';
      }
      st.errors = {};
    } catch (err) {
      st.msg = err.code === 'conflict' ? t.conflict : (err.message || 'Error');
      if (err.code === 'conflict') st.hour = null;
    } finally {
      st.busy = false;
      render();
      if (st.tab !== 'member') loadOcc();
    }
  }

  async function showSuccess({ kind, rec }) {
    const t = T(), lang = L();
    const lines = kind === 'member'
      ? [[t.sum.plan, PLANS.find((p) => p.id === rec.plan)[lang].name], [t.sum.name, rec.name]]
      : [
        ...(rec.type === 'lesson' ? [[t.sum.program, PROGRAMS.find((p) => p.id === rec.program)[lang].name]] : []),
        [t.sum.date, fmtDate(rec.date)], [t.sum.time, `${pad(rec.hour)}:00–${endTime(rec.hour, rec.duration)}`],
        [t.sum.court, CLUB.courts.find((c) => c.id === rec.court)[lang]], [t.sum.name, rec.name],
      ];
    let pay = '';
    if (rec.price > 0) {
      if (CLUB.promptpay) {
        try { const src = await promptpayQR(CLUB.promptpay, rec.price); pay = `<p class="lbl" style="margin-top:18px">${esc(t.payTitle)} · ${money(rec.price)} ฿</p><img class="qr" src="${src}" alt="PromptPay QR ${money(rec.price)} THB">`; } catch {}
      } else pay = `<p class="fine">${esc(t.payAtClub)}</p>`;
    }
    modal.innerHTML = `<div class="modal-in">
      <div class="modal-ball" aria-hidden="true">✓</div>
      <h3 id="modal-title">${esc(kind === 'member' ? t.successMember : t.successTitle)}</h3>
      <p class="fine">${esc(kind === 'member' ? t.memberNo : t.ref)}</p>
      <div class="ref" lang="en">${esc(kind === 'member' ? rec.memberNo : rec.ref)}</div>
      ${lines.map(([k, v]) => `<div class="sum-line"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join('')}
      <div class="sum-line"><span>${esc(t.total)}</span><span>${money(rec.price)} ฿</span></div>
      <p class="pts-chip big">${esc(t.earnNote.replace('{n}', kind === 'member' ? POINTS.signupBonus : earnFor(rec.price)))}</p>
      <p class="body" style="margin:12px auto 0;font-size:15px">${esc(t.successBody)}</p>
      ${pay}
      <button class="btn btn-optic" type="button" data-close>${esc(t.close)}</button>
    </div>`;
    modal.querySelector('[data-close]').addEventListener('click', () => modal.close());
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  }

  // ── events (delegated once)
  root.addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) { setTab(tab.dataset.tab); root.querySelector(`#tab-${tab.dataset.tab}`)?.focus(); }
  });
  root.addEventListener('keydown', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (!tab || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const order = ['court', 'lesson', 'member'];
    const next = order[(order.indexOf(st.tab) + (e.key === 'ArrowRight' ? 1 : 2)) % 3];
    setTab(next); root.querySelector(`#tab-${next}`)?.focus();
  });
  root.addEventListener('change', (e) => {
    const { name, value } = e.target;
    if (name === 'date') { st.date = value; st.hour = null; loadOcc(); return; }
    if (name === 'court') { st.court = value; st.hour = null; renderTimes(); renderSummary(); return; }
    if (name === 'duration') { st.duration = Number(value); if (st.hour != null && !slotState(st.hour).ok) st.hour = null; renderTimes(); renderSummary(); return; }
    if (name === 'hour') { st.hour = Number(value); st.msg = ''; renderSummary(); return; }
    if (name === 'program') { st.program = value; const ds = durationsFor(value); if (!ds.includes(st.duration)) st.duration = ds[0]; st.hour = null; render(); return; }
    if (name === 'plan') { st.plan = value; renderSummary(); return; }
    if (name === 'level') { st.level = value; }
  });
  root.addEventListener('input', (e) => {
    const { name, value } = e.target;
    if (name in st.form) {
      st.form[name] = value;
      if (st.errors[name]) { delete st.errors[name]; e.target.setAttribute('aria-invalid', 'false'); const er = root.querySelector('#e-' + name); if (er) er.textContent = ''; }
    }
  });
  root.addEventListener('submit', (e) => { e.preventDefault(); submit(); });

  function setTab(tab, opts = {}) {
    st.tab = tab; st.msg = ''; st.errors = {}; st.hour = null;
    if (opts.program) st.program = opts.program;
    if (opts.plan) st.plan = opts.plan;
    if (tab === 'lesson') { const ds = durationsFor(st.program); if (!ds.includes(st.duration)) st.duration = ds[0]; }
    if (tab === 'court' && ![1, 2].includes(st.duration)) st.duration = 1;
    render();
    if (tab !== 'member') loadOcc();
  }

  render();
  loadOcc();
  const unsub = store.subscribe?.(() => { if (st.tab !== 'member') loadOcc(); });

  return { render: () => { render(); }, setTab, destroy: () => unsub && unsub() };
}
