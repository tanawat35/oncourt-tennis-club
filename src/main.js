import './styles.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { CLUB, COURT_RATE, PROGRAMS, PLANS, I18N, M, FILMS, GALLERY, ACHIEVEMENTS, REWARDS, TIERS } from './content.js';
import { connectStore, pad, normPhone } from './store.js';
import { createScene } from './scene.js';
import { createBooker } from './booking.js';
import { createAdmin } from './admin.js';

gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add('js');

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = (n) => Number(n).toLocaleString('en-US');
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = window.matchMedia('(max-width: 860px), (pointer: coarse)').matches;

let lang = 'th';
try { lang = localStorage.getItem('oncourt:lang') || (navigator.language?.startsWith('th') ? 'th' : 'th'); } catch {}
const getLang = () => lang;

// ── loader progress
const pctEl = $('#loader-pct');
let pct = 0, pctTarget = 12;
const pctTimer = setInterval(() => { pct += (pctTarget - pct) * 0.18; pctEl.textContent = Math.round(pct); }, 60);
const bump = (v) => { pctTarget = Math.max(pctTarget, v); };

// ── i18n
function get(path, obj = I18N[lang]) { return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj); }

function splitLines(el) {
  const html = el.dataset.src ?? el.innerHTML;
  el.dataset.src = html;
  el.innerHTML = html.split(/<br\s*\/?>/i).map((line) => `<span class="w"><span>${line}</span></span>`).join('<br>');
}

function applyLang() {
  const t = I18N[lang];
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach((el) => {
    const v = get(el.dataset.i18n);
    if (typeof v !== 'string') return;
    if (el.classList.contains('split')) { el.dataset.src = v; splitLines(el); } else el.innerHTML = v;
  });
  $$('#lang span').forEach((s) => s.classList.toggle('on', s.dataset.l === lang));
  $('#burger').setAttribute('aria-label', lang === 'th' ? 'เปิดเมนู' : 'Open menu');

  $('#coach-points').innerHTML = t.coach.points.map((p) => `<li>${esc(p)}</li>`).join('');
  $('#steps').innerHTML = t.method.steps.map((s, i) => `<li class="step ${i === 0 ? 'on' : ''}"><span class="step-k" lang="en">${s.k}</span><div><div class="step-t" lang="en">${esc(s.t)}</div><p class="step-d">${esc(s.d)}</p></div></li>`).join('');
  $('#program-cards').innerHTML = PROGRAMS.map((p) => `<article class="card reveal">
      <div class="card-img"><img src="${M(p.img)}" alt="${esc(p[lang].name)} — On Court" loading="lazy" width="600" height="450"></div>
      <span class="card-seats" lang="en">${esc(p.seats)} · ${p.hours} ${esc(t.programs.hours)}</span>
      <h3 class="card-name" lang="en">${esc(p[lang].name)}</h3>
      <p class="card-tag">${esc(p[lang].tag)}</p>
      <p class="card-desc">${esc(p[lang].desc)}</p>
      <div class="card-price"><b>${money(p.price)}</b><small>${esc(t.programs.unit[p.unit])}</small></div>
      <a class="btn btn-ghost" href="#book" data-book="lesson" data-program="${p.id}">${esc(t.programs.book)}</a>
    </article>`).join('');
  $('#plans').innerHTML = PLANS.map((p) => `<article class="plan reveal ${p.featured ? 'featured' : ''}">
      ${p.featured ? `<span class="plan-badge">${esc(t.member.popular)}</span>` : ''}
      <h3 class="plan-name" lang="en">${esc(p[lang].name)}</h3>
      <div class="plan-price"><b>${p.price ? money(p.price) : (lang === 'th' ? 'ฟรี' : 'FREE')}</b><small>${p.price ? esc(p[lang].note) + ' ฿' : ''}</small></div>
      <ul>${p[lang].perks.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>
      <a class="btn ${p.featured ? 'btn-optic' : 'btn-ghost'}" href="#book" data-book="member" data-plan="${p.id}">${esc(t.member.join)} ${esc(p[lang].name)}</a>
    </article>`).join('');
  $('#faq-list').innerHTML = t.faq.items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('');
  $('#films').innerHTML = FILMS.map((f) => `<figure class="film ${f.wide ? 'wide' : ''}">
      <video muted loop playsinline preload="none" poster="${M(f.src + '.webp')}" aria-label="${esc(f[lang])}"><source src="${M(f.src + '.mp4')}" type="video/mp4"></video>
      <figcaption>${esc(f[lang])}</figcaption></figure>`).join('');
  $('#fame-athlete').textContent = ACHIEVEMENTS.athlete[lang];
  $('#fame-results').innerHTML = ACHIEVEMENTS.results.map((r) => `<li><span class="medal m${r.place[0]}" lang="en">${r.place}</span><div><b>${esc(r[lang].t)}</b><small>${esc(r[lang].e)}</small></div></li>`).join('');
  $('#fame-photos').innerHTML = ACHIEVEMENTS.photos.map((f, i) => `<button type="button" class="fp fp${i}" data-lightbox="${M(f)}" data-cap="${esc(ACHIEVEMENTS.athlete[lang])}"><img src="${M(f)}" alt="${esc(ACHIEVEMENTS.athlete[lang])} — ${esc(t.fame.title)}" loading="lazy"></button>`).join('');
  $('#shop-rules').innerHTML = t.shop.rules.map(([a, b]) => `<li><b>${esc(a)}</b><small>${esc(b)}</small></li>`).join('');
  $('#pts-how').innerHTML = t.points.how.map(([a, b]) => `<li><b>${esc(a)}</b><span>${esc(b)}</span></li>`).join('');
  $('#rewards').innerHTML = REWARDS.map((r) => `<li><span class="rw-pts" lang="en">${r.pts}<small>${esc(t.points.pts)}</small></span><span>${esc(r[lang])}</span></li>`).join('');
  $('#gallery-grid').innerHTML = GALLERY.map((g) => `<button type="button" class="gi" data-lightbox="${M(g.f)}" data-cap="${esc(g[lang])}"><img src="${M(g.f)}" alt="${esc(g[lang])}" loading="lazy"><span>${esc(g[lang])}</span></button>`).join('');
  $('#pts-result').innerHTML = '';
  const contacts = [
    [CLUB.links.maps, t.contact.map, 'Google Maps'],
    [CLUB.links.instagram, t.contact.ig, CLUB.handle],
    [CLUB.links.facebook, t.contact.fb, 'OnCourt Tennis Club'],
  ];
  if (CLUB.links.line) contacts.push([CLUB.links.line, 'LINE', 'LINE']);
  if (CLUB.phone) contacts.unshift(['tel:' + CLUB.phone.replace(/\D/g, ''), t.contact.call, CLUB.phone]);
  $('#contact-row').innerHTML = contacts.map(([href, k, v]) => `<a class="contact-card" href="${esc(href)}" target="_blank" rel="noopener"><small>${esc(k)}</small><b lang="en">${esc(v)} ↗</b></a>`).join('');

  $('#rate-day').textContent = money(COURT_RATE.day);
  $('#rate-night').textContent = money(COURT_RATE.night);
  $('#rate-day-t').textContent = `${pad(CLUB.openHour)}:00–${pad(CLUB.nightFrom)}:00`;
  $('#rate-night-t').textContent = `${pad(CLUB.nightFrom)}:00–${pad(CLUB.closeHour)}:00`;
  $('#open-hours').textContent = `${pad(CLUB.openHour)}:00–${pad(CLUB.closeHour)}:00`;
  $('#year').textContent = new Date().getFullYear();
  document.title = lang === 'th' ? 'On Court Tennis Club อุตรดิตถ์ | สนามเทนนิสในร่ม · เรียนกับโค้ชมาร์ค' : 'On Court Tennis Club Uttaradit | Indoor courts · Coach Mark';

  observeReveals();
}

// ── reveals (IntersectionObserver, cheap)
let io;
function observeReveals() {
  if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal:not(.in)').forEach((el, i) => {
    if (!reduced) el.style.transitionDelay = (el.closest('.cards, .plans') ? (i % 4) * 90 : 0) + 'ms';
    io.observe(el);
  });
}

function animateHeadings(first) {
  if (reduced) return;
  $$('.split').forEach((el) => {
    const inner = $$('.w > span', el);
    if (el.closest('#hero')) {
      if (first) gsap.from(inner, { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.12, delay: 0.25 });
      return;
    }
    gsap.from(inner, { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
  });
}

// ── nav
function initNav(lenis) {
  const nav = $('#nav'), links = $('#nav-links'), burger = $('#burger');
  const toggle = (open) => { links.classList.toggle('open', open); burger.setAttribute('aria-expanded', String(open)); };
  burger.addEventListener('click', () => toggle(!links.classList.contains('open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
  $$('a[href^="#"]').forEach(() => {});
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#admin') return; // handled by hashchange
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    toggle(false);
    if (a.dataset.book) booker?.setTab(a.dataset.book, { program: a.dataset.program, plan: a.dataset.plan });
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', id === '#hero' ? location.pathname + location.search : id);
    if (id === '#book') setTimeout(() => $('#booker .tab[aria-selected="true"]')?.focus({ preventScroll: true }), lenis ? 1700 : 600);
  });
  const secs = ['coach', 'film', 'programs', 'court', 'fame', 'points'];
  return (y) => {
    nav.classList.toggle('scrolled', y > 40);
    let cur = '';
    for (const id of secs) { const el = document.getElementById(id); if (el.offsetTop - innerHeight * 0.45 <= y) cur = id; }
    $$('a', links).forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
  };
}

// ── story position → scene + scoreboard
function initStory(scene) {
  const sections = $$('[data-stop]');
  // each section holds the camera over a scroll range [a, b]; between ranges the camera travels
  let ranges = [];
  const measure = () => {
    ranges = sections.map((s) => {
      const top = s.getBoundingClientRect().top + window.scrollY;
      if (s.id === 'hero') return [0, 0];
      if (s.id === 'method') return [top, top + s.offsetHeight - innerHeight]; // sticky: hold through
      const c = top + s.offsetHeight / 2 - innerHeight / 2;
      return [c, c];
    });
  };
  measure();
  window.addEventListener('resize', measure);
  ScrollTrigger.addEventListener('refresh', measure);
  const score = $('#sb-score'), fill = $('#sb-fill'), board = $('.scoreboard'), solids = $$('.solid, .faq, .contact, .footer, .book');
  let lastScore = '';
  return (y) => {
    let s = 0;
    const n = ranges.length;
    if (y >= ranges[n - 1][0]) s = n - 1;
    else for (let i = 0; i < n - 1; i++) {
      const [a, b] = ranges[i], next = ranges[i + 1][0];
      if (y >= a && y <= b) { s = i; break; }
      if (y > b && y < next) { s = i + (y - b) / Math.max(1, next - b); break; }
    }
    scene?.setStory(reduced ? Math.round(s) : s);
    const idx = Math.min(sections.length - 1, Math.round(s));
    const sc = sections[idx].dataset.score;
    if (sc !== lastScore) {
      lastScore = sc; score.textContent = sc;
      if (!reduced) gsap.fromTo(score, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
    }
    fill.style.width = (s / (sections.length - 1)) * 100 + '%';
    const vh = innerHeight;
    const overSolid = solids.some((el) => { const r = el.getBoundingClientRect(); return r.top < vh - 20 && r.bottom > vh - 120; });
    board.classList.toggle('off', s > 5.5 || overSolid);
  };
}

function initMethod() {
  ScrollTrigger.create({
    trigger: '#method', start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => {
      const i = Math.min(3, Math.floor(self.progress * 4.2));
      $$('#steps .step').forEach((el, k) => el.classList.toggle('on', k <= i));
    },
  });
}

// ── lightbox
function initLightbox() {
  const lb = $('#lightbox'), img = $('img', lb), cap = $('.lb-cap', lb);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lightbox]');
    if (!b) return;
    img.src = b.dataset.lightbox; img.alt = b.dataset.cap || ''; cap.textContent = b.dataset.cap || '';
    lb.showModal?.();
  });
  $('.lb-close', lb).addEventListener('click', () => lb.close());
  lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
}

// ── videos play only while visible
function initVideos() {
  const vio = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && !reduced) { if (v.preload === 'none') v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
  }), { threshold: 0.35 });
  const watch = () => $$('#films video').forEach((v) => vio.observe(v));
  watch();
  return watch;
}

// ── points lookup
let store;
function tierName(id) { return TIERS.find((t) => t.id === id)?.name || id; }
function initPoints() {
  $('#pts-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const t = I18N[lang].points, box = $('#pts-result');
    const phone = normPhone($('#pts-phone').value);
    if (!/^0\d{8,9}$/.test(phone)) { box.innerHTML = `<p class="form-msg">${esc(I18N[lang].book.phoneBad)}</p>`; return; }
    box.innerHTML = `<p class="fine">…</p>`;
    let p;
    try { p = await store.getPoints(phone); } catch (err) { box.innerHTML = `<p class="form-msg">${esc(err.message)}</p>`; return; }
    if (!p.history.length) { box.innerHTML = `<p class="body" style="margin:18px 0 0">${esc(t.empty)}</p>`; return; }
    const nt = p.next, cur = TIERS.find((x) => x.id === p.tier);
    const pct = nt ? Math.round(((p.lifetime - cur.min) / (nt.min - cur.min)) * 100) : 100;
    box.innerHTML = `<div class="pts-card">
        <div><small>${esc(t.balance)}</small><b class="pts-big" lang="en">${money(p.balance)}</b></div>
        <div class="pts-tier"><small>${esc(t.tier)}</small><span class="tier-badge" lang="en">${esc(tierName(p.tier))}</span></div>
      </div>
      <div class="tier-bar"><i style="width:${pct}%"></i></div>
      <p class="fine">${esc(t.lifetime)} ${money(p.lifetime)} · ${esc(nt ? t.next.replace('{n}', money(nt.min - p.lifetime)).replace('{t}', nt.name) : t.maxTier)}</p>
      <ul class="rw-state">${REWARDS.map((r) => `<li class="${p.balance >= r.pts ? 'ok' : ''}"><span>${esc(r[lang])}</span><em>${p.balance >= r.pts ? esc(t.canRedeem) : esc(t.need.replace('{n}', money(r.pts - p.balance)))}</em></li>`).join('')}</ul>
      <p class="lbl" style="margin-top:18px">${esc(t.history)}</p>
      <ul class="pts-hist">${p.history.slice(0, 8).map((h) => `<li><span>${esc(t.reasons[h.reason] || h.reason)}${h.ref ? ' · ' + esc(h.ref) : ''}${h.note ? ' · ' + esc(h.note) : ''}<small>${new Date(h.createdAt).toLocaleDateString(lang === 'th' ? 'th-TH-u-ca-gregory' : 'en-GB')}</small></span><b class="${h.delta < 0 ? 'neg' : ''}">${h.delta > 0 ? '+' : ''}${h.delta}</b></li>`).join('')}</ul>
      <p class="fine">${esc(t.redeemNote)}</p>`;
  });
}

// ── boot
let booker, admin;
async function boot() {
  applyLang();
  bump(30);

  // 3D scene
  let scene = null;
  const canvas = $('#gl');
  try { scene = createScene(canvas, { mobile, reduced }); } catch (e) { console.warn('WebGL unavailable', e); }
  if (!scene) { canvas.style.display = 'none'; document.documentElement.classList.add('no-webgl'); }
  bump(65);

  // smooth scroll
  let lenis = null;
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, touchMultiplier: 1.2 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const navUpdate = initNav(lenis);
  const storyUpdate = initStory(scene);
  const onScroll = () => { const y = window.scrollY; navUpdate(y); storyUpdate(y); };
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  initMethod();
  initLightbox();
  const watchVideos = initVideos();

  // language toggle
  $('#lang').addEventListener('click', () => {
    lang = lang === 'th' ? 'en' : 'th';
    try { localStorage.setItem('oncourt:lang', lang); } catch {}
    applyLang();
    $$('.reveal').forEach((el) => el.classList.add('in'));
    booker?.render();
    watchVideos();
    ScrollTrigger.refresh();
  });

  // data + booking
  store = await connectStore();
  initPoints();
  bump(90);
  booker = createBooker($('#booker'), store, getLang, $('#modal'));
  admin = createAdmin($('#admin'), store, () => { history.replaceState(null, '', location.pathname + location.search); admin.close(); });
  const route = () => { if (location.hash === '#admin') admin.open(); };
  window.addEventListener('hashchange', route);
  route();

  // reveal site
  await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 2500))]);
  bump(100);
  setTimeout(() => {
    clearInterval(pctTimer); pctEl.textContent = '100';
    $('#loader').classList.add('done');
    animateHeadings(true);
    if (!reduced) gsap.from('.hero .lead, .hero .cta-row, .hero .eyebrow', { opacity: 0, y: 24, duration: 1.2, ease: 'expo.out', stagger: 0.1, delay: 0.5 });
    ScrollTrigger.refresh();
  }, reduced ? 50 : 450);
}

boot();
