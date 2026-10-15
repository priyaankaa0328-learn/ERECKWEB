// ===== Edit events here. date: YYYY-MM-DD, time: 24h HH:MM ('' if unknown) =====
const EVENTS = [
  { id: 'electrica', title: 'Electrica', letter: 'E', cat: 'Technical', date: '2025-10-26', time: '15:00', venue: 'EE Department', prize: 2000, img: 'images/electrica.jpg', desc: 'Where sparks turn into innovation. Put your electrical knowledge to work.' },
  { id: 'upsc', title: 'UPSC Challenge', letter: 'U', cat: 'Academic', date: '2025-10-28', time: '11:00', venue: 'Room E-201', prize: 5000, img: 'images/upsc.jpg', desc: 'A showdown of wits, powered by Dr Amit Academy.' },
  { id: 'digispark', title: 'Digi Spark', letter: 'D', cat: 'Technical', date: '2025-10-28', time: '15:00', venue: 'EE Department', prize: 2000, img: 'images/digispark.jpg', desc: 'Interested in designing electronic circuits? Show it here.' },
  { id: 'advanza', title: 'Advanza', letter: 'A', cat: 'Creative', date: '2025-10-29', time: '', venue: 'Venue to be announced', prize: 2000, img: 'images/advanza.jpg', desc: 'Can your reel sell a deal? Showcase your marketing skills.' }
];
const $ = s => document.querySelector(s);
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const rupee = n => '\u20B9' + n.toLocaleString('en-IN');
const when = e => new Date(e.date + 'T00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + fmtTime(e.time);
function fmtTime(t) { if (!t) return 'time to be announced'; let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; }
let regs = load('er3_regs', []);
const done = () => regs.map(r => r.event);

// ----- Theme switch -----
const themeBtn = $('#theme');
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  themeBtn.setAttribute('aria-checked', t === 'dark');
  try { localStorage.setItem('er3_theme', t); } catch {}
}
themeBtn.setAttribute('aria-checked', document.documentElement.dataset.theme === 'dark');
themeBtn.addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));

// ----- Count-up stats -----
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-count]').forEach(el => {
  const to = +el.dataset.count, pre = el.dataset.pre || '';
  const show = v => el.textContent = pre + Math.round(v).toLocaleString('en-IN');
  if (still) return show(to);
  const t0 = performance.now();
  (function step(now) { const p = Math.min((now - t0) / 1200, 1); show(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
});

// ----- Events: search + filter + sort -----
let filter = 'all';
function render() {
  const q = $('#search').value.trim().toLowerCase(), s = $('#sort').value;
  let list = EVENTS.filter(e => (filter === 'all' || e.cat === filter) && (e.title + ' ' + e.desc + ' ' + e.venue + ' ' + e.cat).toLowerCase().includes(q));
  list.sort(s === 'prize' ? (a, b) => b.prize - a.prize : s === 'name' ? (a, b) => a.title.localeCompare(b.title) : (a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  $('#result-count').textContent = `Showing ${list.length} of ${EVENTS.length} events`;
  $('#empty').hidden = list.length > 0;
  $('#grid').innerHTML = list.map(e => { const i = EVENTS.indexOf(e) + 1, reg = done().includes(e.id); return `
    <article class="card" id="card-${e.id}">
      <span class="letter" aria-hidden="true">${e.letter}</span>
      <div class="thumb"><img src="${e.img}" alt="${e.title} poster" loading="lazy"><span class="num">0${i}</span></div>
      <div class="body">
        <span class="badge">${e.cat} #0${i}</span>
        <h3>${e.title}</h3>
        <p class="desc">${e.desc}</p>
        <p class="meta">${when(e)}</p>
        <p class="venue">${e.venue} &bull; Prize worth ${rupee(e.prize)}</p>
        <div class="actions">
          <button class="btn" data-act="reg" data-id="${e.id}" ${reg ? 'disabled' : ''}>${reg ? 'Registered' : 'Register'}</button>
          <button class="btn btn-ghost" data-act="share" data-id="${e.id}">Share</button>
        </div>
      </div>
    </article>`; }).join('');
}
$('#search').addEventListener('input', render);
$('#sort').addEventListener('change', render);
document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
  filter = c.dataset.filter;
  document.querySelectorAll('.chip').forEach(x => { x.classList.toggle('active', x === c); x.setAttribute('aria-pressed', x === c); });
  render();
}));
$('#reset').addEventListener('click', () => { $('#search').value = ''; $('#sort').value = 'date'; document.querySelector('[data-filter="all"]').click(); });
$('#grid').addEventListener('click', e => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const ev = EVENTS.find(x => x.id === b.dataset.id);
  if (b.dataset.act === 'reg') openModal(ev);
  else window.open('https://wa.me/?text=' + encodeURIComponent(`${ev.title} by ElectroReck, NIT Kurukshetra. ${when(ev)}, ${ev.venue}. Prize worth ${rupee(ev.prize)}. ${location.href}`), '_blank', 'noopener');
});

// ----- Toast -----
let tt; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(() => t.hidden = true, 3500); }

// ----- Find-your-event quiz -----
$('#quiz-form').addEventListener('submit', e => {
  e.preventDefault();
  const f = e.target, out = $('#quiz-out');
  if (!['q1', 'q2', 'q3'].every(n => f.elements[n].value)) { out.textContent = 'Answer all three questions first.'; return; }
  const score = {};
  ['q1', 'q2', 'q3'].forEach(n => f.elements[n].value.split(',').forEach((id, i) => score[id] = (score[id] || 0) + (i === 0 ? 2 : 1)));
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0], ev = EVENTS.find(x => x.id === best);
  out.innerHTML = `Your match: ${ev.title}. <a href="#card-${ev.id}">See the event</a>`;
  document.querySelector('[data-filter="all"]').click();
  $('#search').value = '';
  render();
});

// ----- Resistor colour code -----
const DIG = [['Black', '#111', 0], ['Brown', '#6B3E1F', 1], ['Red', '#D62828', 2], ['Orange', '#F77F00', 3], ['Yellow', '#F4D35E', 4], ['Green', '#2E8B57', 5], ['Blue', '#1E5AA8', 6], ['Violet', '#7B3FA0', 7], ['Grey', '#888', 8], ['White', '#f4f4f4', 9]];
const MUL = [...DIG.slice(0, 8).map(([n, c, v]) => [n, c, 10 ** v]), ['Gold', '#D4AF37', 0.1], ['Silver', '#C0C0C0', 0.01]];
const TOL = [['Brown', '#6B3E1F', 1], ['Red', '#D62828', 2], ['Gold', '#D4AF37', 5], ['Silver', '#C0C0C0', 10]];
const fill = (id, arr, sel) => { $(id).innerHTML = arr.map((o, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${o[0]}</option>`).join(''); $(id).addEventListener('change', resistor); };
fill('#r1', DIG, 1); fill('#r2', DIG, 0); fill('#r3', MUL, 2); fill('#r4', TOL, 2);
function resistor() {
  const a = DIG[$('#r1').value], b = DIG[$('#r2').value], m = MUL[$('#r3').value], t = TOL[$('#r4').value];
  [['#b1', a], ['#b2', b], ['#b3', m], ['#b4', t]].forEach(([id, o]) => $(id).setAttribute('fill', o[1]));
  const ohms = (a[2] * 10 + b[2]) * m[2];
  const txt = ohms >= 1e6 ? ohms / 1e6 + ' M\u03A9' : ohms >= 1e3 ? ohms / 1e3 + ' k\u03A9' : parseFloat(ohms.toPrecision(4)) + ' \u03A9';
  $('#res-out').textContent = `${txt} \u00B1${t[2]}%`;
}
resistor();

// ----- Registration modal -----
const modal = $('#modal'), form = $('#reg-form'), success = $('#success');
let current = null;
function openModal(ev) {
  current = ev; form.reset(); Object.keys(rules).forEach(f => setError(f, ''));
  $('#modal-event').textContent = ev.title; form.hidden = false; success.hidden = true; modal.showModal(); $('#name').focus();
}
$('#close').addEventListener('click', () => modal.close());
$('#done').addEventListener('click', () => modal.close());
$('#another').addEventListener('click', () => { modal.close(); location.hash = '#events'; });
modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });

const rules = {
  name: v => v.trim().length >= 2 ? '' : 'Enter your full name.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email.',
  roll: v => v.trim().length >= 3 ? '' : 'Enter your roll number.',
  dept: v => v ? '' : 'Select your department.',
  year: v => v ? '' : 'Select your year.',
  phone: v => !v.trim() || /^\d{10}$/.test(v.trim()) ? '' : 'Enter 10 digits or leave empty.',
  terms: () => form.elements.terms.checked ? '' : 'Please tick the box to continue.'
};
function setError(f, msg) { form.querySelector(`[data-for="${f}"]`).textContent = msg; form.elements[f].setAttribute('aria-invalid', msg ? 'true' : 'false'); }
Object.keys(rules).forEach(f => form.elements[f].addEventListener('blur', e => setError(f, rules[f](e.target.value))));
form.addEventListener('submit', e => {
  e.preventDefault();
  let bad = null;
  Object.keys(rules).forEach(f => { const m = rules[f](form.elements[f].value); setError(f, m); if (m && !bad) bad = form.elements[f]; });
  if (bad) { bad.focus(); return; }
  regs.push({ event: current.id, name: form.elements.name.value.trim(), roll: form.elements.roll.value.trim(), email: form.elements.email.value.trim(),
    dept: form.elements.dept.value, year: form.elements.year.value, phone: form.elements.phone.value.trim(), at: new Date().toISOString() });
  save('er3_regs', regs);
  $('#success-msg').textContent = `Thank you, ${form.elements.name.value.trim().split(' ')[0]}. Your spot for ${current.title} is noted. Watch ${form.elements.email.value.trim()} for updates from the ElectroReck team.`;
  form.hidden = true; success.hidden = false; render(); toast('Registered for ' + current.title);
});

render();


// ----- Moving background: drifting circuit nodes -----
(function () {
  const cv = document.getElementById('bg'); if (!cv) return;
  const ctx = cv.getContext('2d');
  let w, h, pts = [], mouse = { x: -999, y: -999 };
  function size() {
    const dpr = window.devicePixelRatio || 1;
    w = innerWidth; h = innerHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(70, Math.round(w * h / 20000));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: 1 + Math.random() * 1.6 }));
  }
  function frame() {
    ctx.clearRect(0, 0, w, h);
    const cs = getComputedStyle(document.documentElement);
    const gold = cs.getPropertyValue('--gold').trim(), blue = cs.getPropertyValue('--accent2').trim();
    pts.forEach(p => {
      if (!still) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1; }
      ctx.globalAlpha = .55; ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
    });
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        if (d < 130) { ctx.globalAlpha = (1 - d / 130) * .22; ctx.strokeStyle = gold; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
      const dm = Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y);
      if (dm < 160) { ctx.globalAlpha = (1 - dm / 160) * .6; ctx.strokeStyle = blue; ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    if (!still) requestAnimationFrame(frame);
  }
  size(); frame();
  addEventListener('resize', () => { size(); if (still) frame(); });
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
})();

// ----- Scroll reveal -----
if (!still && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .1 });
  document.querySelectorAll('.section').forEach(sec => { sec.classList.add('reveal'); io.observe(sec); });
}
