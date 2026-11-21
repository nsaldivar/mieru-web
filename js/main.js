const WHATSAPP = '51941464390';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const root = document.documentElement;

$$('.chars').forEach(el => {
  el.innerHTML = [...el.textContent].map((c, i) => `<span style="transition-delay:${i * 90}ms">${c}</span>`).join('');
});
$$('.split').forEach(el => {
  el.innerHTML = el.textContent.trim().split(/\s+/)
    .map((w, i) => `<span class="w"><span style="transition-delay:${i * 70}ms">${w}</span></span>`).join(' ');
});
$$('.lead,.tag,.swatches,.steps li').forEach(el => el.classList.add('fade'));

(function loader() {
  const pct = $('#loaderPct');
  let p = 0, ready = false, started = false;
  const finishNow = () => { ready = true; };
  addEventListener('mieru:3d-ready', finishNow);
  addEventListener('mieru:3d-fail', finishNow);
  setTimeout(finishNow, 7000);
  const t = setInterval(() => {
    const cap = ready ? 100 : 92;
    p = Math.min(cap, p + (ready ? 6 : Math.random() * 4 + 1));
    pct.textContent = Math.floor(p);
    if (p >= 100 && !started) {
      started = true; clearInterval(t);
      setTimeout(() => {
        $('#loader').classList.add('done');
        document.body.classList.remove('is-loading');
        setTimeout(() => { document.body.classList.add('go'); dispatchEvent(new Event('mieru:start')); }, 500);
      }, 300);
    }
  }, 60);
})();

const sections = $$('[data-bg]');
const links = $$('#menu a[href^="#"]');
function updateTheme() {
  const mid = innerHeight * .5;
  let best = sections[0], bd = Infinity;
  sections.forEach(s => {
    const r = s.getBoundingClientRect();
    const d = (r.top <= mid && r.bottom >= mid) ? 0 : Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
    if (d < bd) { bd = d; best = s; }
  });
  root.style.setProperty('--bg', best.dataset.bg);
  root.style.setProperty('--ink', best.dataset.ink);
  links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + best.id));
  $('meta[name=theme-color]').setAttribute('content', best.dataset.bg);
}

const bigs = $$('.big');
function onScroll() {
  const h = root.scrollHeight - innerHeight;
  $('#progress').style.width = (scrollY / h * 100) + '%';
  $('#toTop').classList.toggle('show', scrollY > 700);
  bigs.forEach(b => {
    const sec = b.parentElement.getBoundingClientRect();
    const k = (sec.top + sec.height / 2 - innerHeight / 2) / innerHeight;
    b.style.setProperty('--tx', (k * parseFloat(b.dataset.speed || 10) * innerWidth / 100) + 'px');
  });
  updateTheme();
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();
$('#toTop').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .2 });
$$('.split,.fade').forEach(el => io.observe(el));

const burger = $('#burger'), menu = $('#menu');
burger.onclick = () => {
  const o = menu.classList.toggle('open');
  burger.classList.toggle('open', o);
  burger.setAttribute('aria-expanded', o);
};
links.forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); burger.classList.remove('open'); }));

if (matchMedia('(hover:hover)').matches) {
  const c = $('#cursor'); let x = 0, y = 0, cx = 0, cy = 0;
  addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; c.classList.add('on'); });
  (function loop() { cx += (x - cx) * .2; cy += (y - cy) * .2; c.style.left = cx + 'px'; c.style.top = cy + 'px'; requestAnimationFrame(loop); })();
  $$('a,button,.game,.sw').forEach(el => {
    el.addEventListener('mouseenter', () => c.classList.add('big'));
    el.addEventListener('mouseleave', () => c.classList.remove('big'));
  });
  $$('.mag').forEach(b => {
    b.addEventListener('mousemove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`;
    });
    b.addEventListener('mouseleave', () => b.style.transform = '');
  });
}

$$('.tilt').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    el.style.transition = 'box-shadow .3s';
    el.style.transform = `rotateY(${x * 22}deg) rotateX(${-y * 22}deg) translateZ(30px) scale(1.04)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transition = 'transform .6s, box-shadow .3s'; el.style.transform = ''; });
});
(function rail() {
  const r = $('#rail'); let down = false, sx = 0, sl = 0;
  r.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; down = true; sx = e.clientX; sl = r.scrollLeft; r.classList.add('drag'); });
  addEventListener('pointerup', () => { down = false; r.classList.remove('drag'); });
  addEventListener('pointermove', e => { if (down) r.scrollLeft = sl - (e.clientX - sx); });
})();

$$('.sw').forEach(b => b.addEventListener('click', () => {
  $$('.sw').forEach(s => s.classList.remove('on'));
  b.classList.add('on');
  dispatchEvent(new CustomEvent('mieru:color', { detail: b.dataset.color }));
}));

function openWA(text) {
  if (!WHATSAPP) { alert('Configura tu número en js/main.js (constante WHATSAPP).'); return; }
  open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}
$$('.buy').forEach(b => b.addEventListener('click', () => openWA(`Hola MIERU, quiero comprar: ${b.dataset.item}.`)));
$('#contactForm').addEventListener('submit', e => {
  e.preventDefault();
  openWA(`Hola MIERU, soy ${$('#cName').value}. Necesito: ${$('#cType').value}. ${$('#cMsg').value}`);
});
$('#year').textContent = new Date().getFullYear();

addEventListener('mieru:mode', e => { $('#hudMode').textContent = '▶ ' + e.detail; });
setInterval(() => {
  $('#hudFps').textContent = 142 + Math.floor(Math.random() * 3);
  $('#hudPing').textContent = 9 + Math.floor(Math.random() * 6);
}, 700);

(function accordion() {
  const items = $$('.acc-item');
  items.forEach(it => {
    const btn = $('.acc-head', it);
    btn.addEventListener('click', () => {
      const willOpen = !it.classList.contains('open');
      items.forEach(x => { x.classList.remove('open'); $('.acc-head', x).setAttribute('aria-expanded', 'false'); });
      if (willOpen) { it.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });
})();

(function recruit() {
  const f = $('#recruitForm');
  if (!f) return;
  f.addEventListener('submit', e => {
    e.preventDefault();
    openWA(
      'Hola MIERU, quiero postular al puesto de Técnico de microsoldadura.\n' +
      'Nombre: ' + $('#rName').value + '\n' +
      'Experiencia: ' + $('#rExp').value + '\n' +
      'Te envío mi CV (PDF) adjunto en este chat. 📎'
    );
  });
})();

(function heroVideo() {
  const v = $('#heroVid');
  if (!v) return;
  const show = () => v.classList.add('on');
  v.addEventListener('playing', show);
  v.addEventListener('error', () => v.remove(), true);
  v.querySelector('source').addEventListener('error', () => v.remove());
  const p = v.play(); if (p && p.catch) p.catch(() => {});

  new IntersectionObserver(([e]) => {
    if (!document.body.contains(v)) return;
    e.isIntersecting ? v.play().catch(() => {}) : v.pause();
  }).observe($('#inicio'));
})();