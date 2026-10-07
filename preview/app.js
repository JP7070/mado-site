/* mado — preview. Vanilla JS, no dependencies. */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const pad2 = n => String(n).padStart(2, '0');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const hasIO = 'IntersectionObserver' in window;
if (!hasIO) document.documentElement.classList.add('no-io');

const inertAll = v => [$('#main'), $('.hd'), $('.ft')].forEach(x => x && (x.inert = v));
const S = {works: [], filter: 'all', view: 'grid', origin: 'card', open: null, src: null, token: 0, viaClick: false, busy: false};
const labels = {all: 'すべて', anime: 'TVアニメ', commercial: '広告・CM', spatial: '空間演出'};

const body = document.body, main = $('#main'), list = $('#wlist'), detail = $('#detail'),
      dScroll = $('#d-scroll'), dEl = $('#d'), peek = $('#peek'), cur = $('#cur');

/* ---------- clock + timecode ---------- */
const clockEl = $('#clock');
function tickClock() {
  clockEl.textContent = new Intl.DateTimeFormat('en-GB', {timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit'}).format(new Date());
}
tickClock(); setInterval(tickClock, 15000);

const tcEl = $('#tc'), pctEl = $('#tc-pct');
let tcQueued = false;
function updateTC() {
  tcQueued = false;
  const el = S.open !== null ? dScroll : document.scrollingElement;
  const max = Math.max(1, el.scrollHeight - el.clientHeight);
  const p = clamp(el.scrollTop / max, 0, 1);
  const f = Math.round(p * 24 * 3599);           // 24 fps timecode across the page
  const ff = f % 24, ss = Math.floor(f / 24) % 60, mm = Math.floor(f / 1440) % 60;
  tcEl.textContent = `00:${pad2(mm)}:${pad2(ss)}:${pad2(ff)}`;
  pctEl.textContent = String(Math.round(p * 100)).padStart(3, '0');
}
const queueTC = () => { if (!tcQueued) { tcQueued = true; requestAnimationFrame(updateTC); } };
addEventListener('scroll', queueTC, {passive: true});
dScroll.addEventListener('scroll', queueTC, {passive: true});
addEventListener('resize', queueTC);

/* ---------- hero: logo + parallax ---------- */
const stage = $('#stage'), logo = $('#logo');
function startLogo() {
  if (reduce || !logo.canPlayType || !logo.canPlayType('video/mp4')) { stage.classList.add('is-fallback'); return; }
  // Slow connection: show the still, and hand back to the film if it does start.
  setTimeout(() => { if (!stage.classList.contains('is-playing') && !stage.classList.contains('is-done')) stage.classList.add('is-fallback'); }, 6000);
  logo.addEventListener('playing', () => {
    const go = () => { stage.classList.remove('is-fallback'); stage.classList.add('is-playing'); };
    logo.requestVideoFrameCallback ? logo.requestVideoFrameCallback(go) : go();
  }, {once: true});
  logo.addEventListener('ended', () => stage.classList.add('is-done'));
  logo.addEventListener('error', () => stage.classList.add('is-fallback'));
  const p = logo.play();
  if (p && p.catch) p.catch(() => stage.classList.add('is-fallback'));
}
let heroQueued = false;
function heroScroll() {
  heroQueued = false;
  const y = scrollY, h = innerHeight;
  if (y > h * 1.2) return;
  const p = clamp(y / h, 0, 1);
  stage.style.transform = `translate3d(0,${(p * 7).toFixed(2)}vh,0) scale(${(1 - p * .07).toFixed(4)})`;
  stage.style.opacity = String(1 - p * .85);
}
if (!reduce) addEventListener('scroll', () => { if (!heroQueued) { heroQueued = true; requestAnimationFrame(heroScroll); } }, {passive: true});

/* ---------- reveal ---------- */
let io = null;
if (hasIO) io = new IntersectionObserver(entries => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}, {rootMargin: '0px 0px -8% 0px', threshold: .08});
function observe(el) { if (io) io.observe(el); else el.classList.add('in'); }
$$('.works-head .display,.about .display').forEach(el => { const m = $('.mask', el); if (m) observe(m); });

/* ---------- reel ---------- */
const reelTrack = $('#reel-track');
let reelX = 0, reelOn = false, reelLast = 0, reelY = scrollY;
function reelLoop(t) {
  if (!reelOn) return;
  const dt = Math.min(48, t - reelLast || 16); reelLast = t;
  const half = reelTrack.scrollWidth / 2;
  reelX += dt * .026 + (scrollY - reelY) * .35; reelY = scrollY;
  if (half > 0) reelX = ((reelX % half) + half) % half;
  reelTrack.style.transform = `translate3d(${-reelX.toFixed(1)}px,0,0)`;
  requestAnimationFrame(reelLoop);
}
if (hasIO && !reduce) new IntersectionObserver(es => {
  const on = es[0].isIntersecting;
  if (on && !reelOn) { reelOn = true; reelLast = performance.now(); reelY = scrollY; requestAnimationFrame(reelLoop); }
  else if (!on) reelOn = false;
}).observe($('#reel'));

/* ---------- works ---------- */
function render() {
  list.innerHTML = S.works.map((w, i) => `
<li class="work" data-i="${i}" data-cat="${esc(w.category)}"><a class="wlink" href="#${esc(w.href)}" data-cur="view" data-i="${i}">
<span class="wthumb"><img src="${esc(w.imageSmall || w.image)}" alt="" width="480" height="360" loading="lazy" decoding="async"></span>
<span class="wtext"><span class="wnum">${pad2(i + 1)}</span><span class="wcat">${esc(w.label)}${w.year ? ` · ${w.year}` : ''}</span><span class="warrow" aria-hidden="true">↗</span>
<span class="wtitle">${esc(w.title)}</span><span class="wscope">${esc(w.scope || '')}</span></span></a></li>`).join('');
  $('#hero-count').textContent = S.works.length;
  const reelItems = S.works.map((w, i) => `<a class="reel-item" href="#${esc(w.href)}" data-i="${i}" data-cur="view" aria-label="${esc(w.title)}"><img src="${esc(w.imageSmall || w.image)}" alt="" loading="lazy" decoding="async"><i>${pad2(i + 1)}</i></a>`).join('');
  reelTrack.innerHTML = reelItems + reelItems.replace(/ href=/g, ' aria-hidden="true" tabindex="-1" href=');
  applyFilter('all', false);
}
function applyFilter(cat, animate = true) {
  S.filter = cat;
  let n = 0;
  $$('.work', list).forEach((li, idx) => {
    const show = cat === 'all' || li.dataset.cat === cat;
    li.hidden = !show;
    if (show) { li.dataset.col = String(n % 3); n++; if (animate) { li.classList.remove('in'); li.style.transitionDelay = ''; } }
  });
  $$('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === cat)));
  $('#count').innerHTML = `<span>${esc(labels[cat])}</span><span>${pad2(n)} works</span>`;
  $$('.work:not([hidden])', list).forEach((li, k) => {
    li.style.transitionDelay = S.view === 'grid' ? `${(k % 4) * 80}ms` : `${Math.min(k, 6) * 30}ms`;
    observe(li);
  });
}
function setView(v) {
  S.view = v; list.dataset.view = v;
  $$('[data-view]').forEach(b => b.hasAttribute('aria-pressed') && b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  peekHide();
  applyFilter(S.filter, true);
}
$$('[data-filter]').forEach(b => b.addEventListener('click', () => applyFilter(b.dataset.filter)));
$$('.views [data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
matchMedia('(max-width:900px)').addEventListener('change', e => { if (e.matches && S.view === 'list') setView('grid'); });

[list, reelTrack].forEach(host => host.addEventListener('click', e => {
  const a = e.target.closest('.wlink, .reel-item');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault();
  S.src = a; S.viaClick = true;
  location.hash = '#' + S.works[+a.dataset.i].href;
}));

/* ---------- grid: prism flicker on hover ---------- */
if (fine && !reduce) list.addEventListener('pointerenter', e => {
  const t = e.target.closest && e.target.closest('.wthumb');
  if (!t || S.view !== 'grid' || S.open !== null || t.classList.contains('flick')) return;
  t.classList.add('flick'); split(360);
  setTimeout(() => t.classList.remove('flick'), 380);
}, true);

/* ---------- floating peek (index view) ---------- */
const pimgs = $$('img', peek);
let pcur = 0, pact = false, px = 0, py = 0, tx = 0, ty = 0, pvx = 0, praf = 0, lastW = null;
function peekShow(w) {
  if (!fine || S.view !== 'list' || S.open !== null) return;
  if (lastW !== w) {
    const nxt = pimgs[1 - pcur];
    nxt.src = w.image; nxt.classList.add('is-cur');
    pimgs[pcur].classList.remove('is-cur');
    pcur = 1 - pcur; lastW = w;
  }
  if (!pact) { pact = true; px = tx; py = ty; peek.classList.add('is-on'); }
  peekLoop();
}
function peekHide() { pact = false; lastW = null; peek.classList.remove('is-on'); }
function peekLoop() {
  if (praf) return;
  const step = () => {
    praf = 0;
    const w = peek.offsetWidth || 320, h = peek.offsetHeight || 240;
    const right = tx + 56 + w < innerWidth - 20;
    const gx = right ? tx + 56 : tx - 56 - w;
    const gy = clamp(ty - h / 2, 20, innerHeight - h - 20);
    const nx = px + (gx - px) * .14, ny = py + (gy - py) * .14;
    pvx += ((nx - px) - pvx) * .2;
    px = nx; py = ny;
    peek.style.transform = `translate3d(${px.toFixed(1)}px,${py.toFixed(1)}px,0) rotate(${clamp(pvx * .35, -6, 6).toFixed(2)}deg)`;
    if (pact || Math.abs(gx - px) > .3 || Math.abs(gy - py) > .3) praf = requestAnimationFrame(step);
  };
  praf = requestAnimationFrame(step);
}
list.addEventListener('pointerover', e => {
  const a = e.target.closest('.wlink'); if (a) peekShow(S.works[+a.dataset.i]);
});
list.addEventListener('pointerleave', peekHide);
list.addEventListener('focusin', e => { const a = e.target.closest('.wlink'); if (a && !fine) return; if (a) { const r = a.getBoundingClientRect(); tx = r.left + r.width * .6; ty = r.top + r.height / 2; peekShow(S.works[+a.dataset.i]); } });
list.addEventListener('focusout', peekHide);
addEventListener('scroll', () => { if (pact) peekHide(); }, {passive: true});

/* ---------- cursor: a small frame ---------- */
let cursorReset = () => {};
if (fine) {
  let cx = 0, cy = 0, gx = 0, gy = 0, craf = 0, state = '';
  cursorReset = () => setState('');
  const setState = s => { if (s !== state) { state = s; cur.dataset.state = s; $('.cur-l', cur).textContent = s === 'view' ? 'View' : s === 'close' ? 'Close' : ''; } };
  const loop = () => {
    craf = 0;
    cx += (gx - cx) * .22; cy += (gy - cy) * .22;
    cur.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
    if (Math.abs(gx - cx) > .2 || Math.abs(gy - cy) > .2) craf = requestAnimationFrame(loop);
  };
  addEventListener('pointermove', e => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    tx = gx = e.clientX; ty = gy = e.clientY;
    if (!cur.classList.contains('is-on')) { cx = gx; cy = gy; cur.classList.add('is-on'); }
    const t = e.target.closest ? e.target.closest('[data-cur],a,button') : null;
    let s = '';
    if (t) { const k = t.dataset.cur; s = k === 'view' ? (S.view === 'grid' ? 'view' : 'link') : (k || 'link'); }
    setState(s);
    if (!craf) craf = requestAnimationFrame(loop);
  }, {passive: true});
  document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
  document.addEventListener('pointerdown', () => { cur.dataset.down = '1'; cur.classList.add('is-press'); });
  document.addEventListener('pointerup', () => cur.classList.remove('is-press'));
}

/* ---------- window transition ---------- */
const rEl = $('#split-r'), bEl = $('#split-b');
function split(dur) {
  const t0 = performance.now();
  const loop = t => {
    const p = clamp((t - t0) / dur, 0, 1), amp = Math.sin(p * Math.PI) * 16;
    rEl.setAttribute('dx', amp.toFixed(2)); bEl.setAttribute('dx', (-amp).toFixed(2));
    if (p < 1) requestAnimationFrame(loop); else { rEl.setAttribute('dx', 0); bEl.setAttribute('dx', 0); }
  };
  requestAnimationFrame(loop);
}
function morph(src, from, to, dur = 900) {
  return new Promise(res => {
    const m = document.createElement('div');
    m.className = 'morph split';
    const im = new Image(); im.alt = ''; im.src = src; m.appendChild(im);
    const put = r => `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    m.style.cssText = put(from);
    document.body.appendChild(m);
    split(dur);
    const a = m.animate([
      {left: from.left + 'px', top: from.top + 'px', width: from.width + 'px', height: from.height + 'px'},
      {left: to.left + 'px', top: to.top + 'px', width: to.width + 'px', height: to.height + 'px'}
    ], {duration: dur, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards'});
    a.onfinish = () => { m.style.cssText = put(to); m.classList.remove('split'); res(m); };
    a.oncancel = () => res(m);
  });
}
function cardOf(i) { return $(`.work[data-i="${i}"]`, list); }
function sourceRect(i, el) {
  if (S.origin === 'reel') {
    const cands = el ? [el] : $$(`.reel-item[data-i="${i}"]`, reelTrack);
    for (const c of cands) {
      const r = c.getBoundingClientRect();
      if (r.width && r.right > 0 && r.left < innerWidth && r.bottom > 0 && r.top < innerHeight) return {left: r.left, top: r.top, width: r.width, height: r.height};
    }
    return null;
  }
  const li = cardOf(i);
  if (!li || li.hidden) return null;
  let r;
  if (S.view === 'grid') r = $('.wthumb', li).getBoundingClientRect();
  else if (peek.classList.contains('is-on') && lastW === S.works[i]) r = peek.getBoundingClientRect();
  else r = $('.wlink', li).getBoundingClientRect();
  if (!r.width || r.bottom < 0 || r.top > innerHeight) return null;
  return {left: r.left, top: r.top, width: r.width, height: r.height};
}

/* ---------- detail ---------- */
function buildDetail(i) {
  const w = S.works[i], n = S.works.length;
  dEl.classList.remove('is-in');
  const pv = S.works[(i - 1 + n) % n], nx = S.works[(i + 1) % n];
  dEl.innerHTML = `
<figure class="d-hero"><img src="${esc(w.image)}" alt="${esc(w.title)}" decoding="async"></figure>
<div class="d-head">
  <div class="d-side"><dl>
    <div><dt>Category</dt><dd>${esc(w.label)}</dd></div>
    ${w.year ? `<div><dt>Year</dt><dd>${w.year}</dd></div>` : ''}
    <div><dt>担当範囲</dt><dd>${esc(w.scope || '—')}</dd></div>
    <div><dt>No.</dt><dd>${pad2(i + 1)} / ${pad2(n)}</dd></div>
  </dl></div>
  <div><h1 class="d-title"><span class="mask"><span>${esc(w.title)}</span></span></h1><div class="d-links"></div></div>
</div>
<div class="d-frames" aria-label="場面写真"></div>
<div class="d-credit" hidden></div>
<nav class="d-next" aria-label="前後の作品">
  <a href="#${esc(pv.href)}" data-cur="link"><small>← Prev</small><strong>${esc(pv.title)}</strong></a>
  <a href="#${esc(nx.href)}" data-cur="link"><small>Next →</small><strong>${esc(nx.title)}</strong></a>
</nav>
<div class="d-end"></div>`;
  $('#d-index').textContent = `${pad2(i + 1)} / ${pad2(n)}`;
  document.title = `${w.title} — mado Preview`;
}
async function fetchPage(href) {
  for (const u of [href + '.html', href]) {
    try { const r = await fetch(u); if (r.ok) return await r.text(); } catch (e) {}
  }
  return '';
}
async function loadContent(i, token) {
  const w = S.works[i];
  const html = await fetchPage(w.href);
  if (token !== S.token || !html) return;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const m = doc.querySelector('main'); if (!m) return;
  const base = new URL(w.href, location.origin);
  const seen = new Set(), imgs = [];
  m.querySelectorAll('img').forEach(im => {
    const raw = im.getAttribute('src') || im.getAttribute('data-src') || ''; if (!raw || raw.startsWith('data:')) return;
    const u = new URL(raw, base).href; if (seen.has(u)) return; seen.add(u);
    imgs.push({src: u, alt: im.getAttribute('alt') || ''});
  });
  const heroFig = $('.d-hero', dEl), heroImg = $('img', heroFig);
  if (imgs[0]) {
    const big = new Image();
    big.onload = () => {
      if (token !== S.token) return;
      heroImg.src = big.src;
      if (big.naturalWidth / big.naturalHeight < 1.4) heroFig.classList.add('is-contain');
    };
    big.src = imgs[0].src;
  }
  const frames = $('.d-frames', dEl);
  imgs.slice(1).forEach(f => {
    const fig = document.createElement('figure'); fig.className = 'd-fig';
    const im = new Image(); im.alt = f.alt; im.loading = 'lazy'; im.decoding = 'async'; im.src = f.src;
    im.onerror = () => fig.remove();
    fig.appendChild(im); frames.appendChild(fig);
    if (io) { const o = new IntersectionObserver(es => { if (es[0].isIntersecting) { fig.classList.add('in'); o.disconnect(); } }, {root: dScroll, rootMargin: '0px 0px -8% 0px', threshold: .05}); o.observe(fig); }
    else fig.classList.add('in');
  });
  // YouTube link, if the original page had one
  const yt = m.querySelector('iframe[src*="youtu"],a[href*="youtu"]');
  if (yt) {
    let u = yt.getAttribute('src') || yt.getAttribute('href') || '';
    const id = (u.match(/embed\/([\w-]{6,})/) || u.match(/[?&]v=([\w-]{6,})/) || u.match(/youtu\.be\/([\w-]{6,})/) || [])[1];
    if (id) {
      const a = document.createElement('a'); a.className = 'd-watch'; a.target = '_blank'; a.rel = 'noopener';
      a.href = `https://www.youtube.com/watch?v=${id}`; a.setAttribute('data-cur', 'link'); a.innerHTML = 'Watch the film <span aria-hidden="true">↗</span>';
      $('.d-links', dEl).appendChild(a);
    }
  }
  // credit line (text + safe links only)
  const c = m.querySelector('.image-credit,.frame-credit');
  if (c) {
    const box = $('.d-credit', dEl);
    c.childNodes.forEach(nd => {
      if (nd.nodeType === 3) box.appendChild(document.createTextNode(nd.textContent));
      else if (nd.nodeName === 'A' && /^https?:/.test(nd.getAttribute('href') || '')) {
        const a = document.createElement('a'); a.href = nd.getAttribute('href'); a.target = '_blank'; a.rel = 'noopener'; a.textContent = nd.textContent; a.setAttribute('data-cur', 'link'); box.appendChild(a);
      } else box.appendChild(document.createTextNode(nd.textContent || ''));
    });
    box.hidden = !box.textContent.trim();
  }
}

async function openWork(i) {
  const w = S.works[i];
  if (!w) return;
  const token = ++S.token;
  if (S.open !== null) {                       // swap while open (prev / next)
    S.open = i;
    dEl.classList.add('is-swapping'); await sleep(reduce ? 0 : 320);
    if (token !== S.token) return;
    buildDetail(i); dScroll.scrollTop = 0; queueTC();
    dEl.classList.remove('is-swapping');
    requestAnimationFrame(() => requestAnimationFrame(() => dEl.classList.add('is-in')));
    loadContent(i, token);
    return;
  }
  S.open = i; S.busy = true; cursorReset();
  const returnTo = S.src; S.src = null;
  S.origin = returnTo && returnTo.classList.contains('reel-item') ? 'reel' : 'card';
  buildDetail(i);
  detail.hidden = false; detail.classList.add('is-measuring'); dScroll.scrollTop = 0;
  body.classList.add('is-locked', 'is-detail'); inertAll(true);
  const from = returnTo ? sourceRect(i, S.origin === 'reel' ? returnTo : null) : null;
  const to = $('.d-hero', dEl).getBoundingClientRect();
  loadContent(i, token);
  if (from && !reduce) {
    const m = await morph(w.image, from, {left: to.left, top: to.top, width: to.width, height: to.height});
    if (token !== S.token) { m.remove(); return; }
    detail.classList.remove('is-measuring'); detail.classList.add('is-open');
    requestAnimationFrame(() => requestAnimationFrame(() => m.remove()));
  } else {
    detail.classList.remove('is-measuring'); detail.classList.add('is-open');
    if (!reduce) detail.animate([{opacity: 0}, {opacity: 1}], {duration: 500, easing: 'ease-out'});
  }
  S.busy = false; queueTC();
  requestAnimationFrame(() => dEl.classList.add('is-in'));
  $('#d-close').focus({preventScroll: true});
}

async function closeWork() {
  if (S.open === null) return;
  const i = S.open; S.open = null; S.token++; cursorReset();
  const hero = $('.d-hero', dEl), hr = hero.getBoundingClientRect();
  const visible = hr.bottom > 80 && hr.top < innerHeight * .8 && hr.width > 0;
  // Bring the card into view so the frame can land on it.
  const li = cardOf(i);
  if (S.origin !== 'reel' && li && !li.hidden) {
    const r = li.getBoundingClientRect();
    if (r.top < 60 || r.bottom > innerHeight - 20) li.scrollIntoView({block: 'center', behavior: 'instant'});
  }
  const to = (!reduce && visible) ? sourceRect(i) : null;
  const finish = () => {
    detail.classList.remove('is-open', 'is-measuring'); detail.hidden = true;
    body.classList.remove('is-locked', 'is-detail'); inertAll(false);
    dEl.innerHTML = ''; document.title = 'mado — Preview'; queueTC();
    const a = li && $('.wlink', li); if (a && !li.hidden) a.focus({preventScroll: true});
  };
  if (to) {
    // The frame flies back over the list while the detail page dissolves beneath it.
    hero.style.visibility = 'hidden';
    detail.style.pointerEvents = 'none';
    detail.animate([{opacity: 1}, {opacity: 0}], {duration: 380, easing: 'ease-out', fill: 'forwards'});
    const m = await morph(S.works[i].image, {left: hr.left, top: hr.top, width: hr.width, height: hr.height}, to, 800);
    detail.style.pointerEvents = ''; detail.getAnimations().forEach(a => a.cancel());
    detail.classList.remove('is-open'); detail.hidden = true;
    body.classList.remove('is-locked', 'is-detail'); inertAll(false);
    m.animate([{opacity: 1}, {opacity: 0}], {duration: 350, easing: 'ease-out', fill: 'forwards'}).onfinish = () => m.remove();
    dEl.innerHTML = ''; document.title = 'mado — Preview'; queueTC();
    const a = li && $('.wlink', li); if (a) a.focus({preventScroll: true});
  } else if (!reduce) {
    detail.animate([{opacity: 1}, {opacity: 0}], {duration: 350, easing: 'ease-in'}).onfinish = finish;
  } else finish();
}

function closeRequest() {
  if (S.open === null) return;
  if (S.viaClick && history.length > 1) history.back();
  else { history.replaceState(null, '', location.pathname + location.search); closeWork(); }
  S.viaClick = false;
}
$('#d-close').addEventListener('click', closeRequest);
$('#d-x').addEventListener('click', closeRequest);

function route() {
  const h = decodeURIComponent(location.hash);
  const idx = h.startsWith('#/') ? S.works.findIndex(w => w.href === h.slice(1)) : -1;
  if (idx >= 0) { if (S.open !== idx) openWork(idx); }
  else if (S.open !== null) closeWork();
}
addEventListener('hashchange', route);
function navigate(href, replace) {
  if (replace) { history.replaceState(null, '', '#' + href); route(); } else location.hash = '#' + href;
}
dEl.addEventListener('click', e => {
  const a = e.target.closest('.d-next a');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
  e.preventDefault(); navigate(decodeURIComponent(a.getAttribute('href').slice(1)), true);
});

addEventListener('keydown', e => {
  if (S.open === null) return;
  if (e.key === 'Escape') closeRequest();
  else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const n = S.works.length, j = (S.open + (e.key === 'ArrowRight' ? 1 : n - 1)) % n;
    navigate(S.works[j].href, true);
  }
});
// keep focus inside the dialog
detail.addEventListener('keydown', e => {
  if (e.key !== 'Tab') return;
  const f = $$('button,a[href]', detail).filter(x => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
});

/* ---------- intro ---------- */
function runIntro() {
  const intro = $('#intro'), win = $('.intro-win', intro), num = $('#intro-n');
  const done = () => { intro.remove(); body.classList.remove('is-loading'); };
  if (reduce || location.hash.startsWith('#/') || !win.animate) { done(); startLogo(); return Promise.resolve(); }
  return new Promise(res => {
    const dur = 1250;
    const a = win.animate([
      {width: '132px', height: '84px'},
      {width: '132px', height: '84px', offset: .18},
      {width: '100vw', height: '100vh'}
    ], {duration: dur, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards'});
    const t0 = performance.now();
    (function tick(t) {
      const p = clamp((t - t0) / dur, 0, 1);
      num.textContent = String(Math.round(p * 100)).padStart(3, '0');
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
    setTimeout(() => { body.classList.remove('is-loading'); startLogo(); }, dur * .82);
    a.onfinish = () => { intro.remove(); res(); };
    a.oncancel = () => { intro.remove(); res(); };
  });
}

/* ---------- boot ---------- */
async function boot() {
  try {
    const r = await fetch('/works.json'); S.works = await r.json();
  } catch (e) { list.innerHTML = '<li class="work in"><p>作品データを読み込めませんでした。</p></li>'; $('#intro') && $('#intro').remove(); body.classList.remove('is-loading'); return; }
  S.view = 'grid';
  list.dataset.view = S.view;
  $$('.views [data-view]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
  render();
  updateTC(); heroScroll();
  if (document.fonts && document.fonts.ready) await Promise.race([document.fonts.ready, sleep(1500)]);
  route();
  runIntro();
}
boot();
})();
