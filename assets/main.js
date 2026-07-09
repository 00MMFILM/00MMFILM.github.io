/* 00MM FILM — interactions (GSAP + Lenis) */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }

  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on('scroll', ScrollTrigger.update);
  }

  /* ---------- Preloader ---------- */
  const pre = document.querySelector('.preloader');
  const seen = sessionStorage.getItem('pre-seen');
  function killPreloader() {
    if (!pre) return;
    pre.style.display = 'none';
    document.body.classList.add('loaded');
  }
  if (pre && !reduced && !seen && window.gsap) {
    sessionStorage.setItem('pre-seen', '1');
    document.body.classList.add('locked');
    const num = pre.querySelector('.pre-num');
    const state = { v: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        document.body.classList.remove('locked');
        document.body.classList.add('loaded');
        heroIn();
      }
    });
    tl.to(state, {
      v: 100, duration: 1.4, ease: 'power2.inOut',
      onUpdate: () => { if (num) num.textContent = String(Math.round(state.v)).padStart(2, '0'); }
    })
    .to(pre.querySelector('.pre-inner'), { yPercent: -30, opacity: 0, duration: 0.45, ease: 'power2.in' }, '-=0.1')
    .to(pre, { yPercent: -100, duration: 0.75, ease: 'power4.inOut' }, '-=0.15')
    .set(pre, { display: 'none' });
  } else {
    killPreloader();
    requestAnimationFrame(() => heroIn());
  }

  /* ---------- Split text ---------- */
  document.querySelectorAll('[data-split]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text);
    [...text].forEach(ch => {
      const w = document.createElement('span');
      w.className = 'ch-wrap';
      const c = document.createElement('span');
      c.className = 'ch';
      c.textContent = ch === ' ' ? ' ' : ch;
      w.appendChild(c);
      el.appendChild(w);
    });
  });

  /* ---------- Hero entrance ---------- */
  function heroIn() {
    if (!window.gsap || reduced) {
      document.querySelectorAll('.ch').forEach(c => (c.style.transform = 'none'));
      return;
    }
    const heroChars = document.querySelectorAll('.hero-zone .ch');
    if (heroChars.length) {
      gsap.to(heroChars, {
        y: 0, duration: 1.1, ease: 'power4.out',
        stagger: { each: 0.028, from: 'start' }, delay: 0.05
      });
    }
    gsap.to('.hero-fade', { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.5 });
    gsap.to('.hero-photo-reveal', {
      clipPath: 'inset(0% 0 0% 0)', duration: 1.3, ease: 'power4.inOut', delay: 0.25
    });
  }

  if (!window.gsap) return;

  /* ---------- Scroll reveals ---------- */
  if (!reduced) {
    document.querySelectorAll('[data-reveal]').forEach(el => {
      gsap.fromTo(el, { y: 46, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
    document.querySelectorAll('[data-reveal-group]').forEach(group => {
      gsap.fromTo(group.children, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: group, start: 'top 86%' }
      });
    });
    /* split headings on scroll */
    document.querySelectorAll('.split-scroll').forEach(el => {
      gsap.to(el.querySelectorAll('.ch'), {
        y: 0, duration: 0.9, ease: 'power4.out', stagger: 0.02,
        scrollTrigger: { trigger: el, start: 'top 86%' }
      });
    });
    /* parallax */
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const amt = parseFloat(el.dataset.parallax) || 12;
      gsap.fromTo(el, { yPercent: -amt }, {
        yPercent: amt, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
    /* big outline drift */
    document.querySelectorAll('.drift').forEach(el => {
      gsap.fromTo(el, { xPercent: 6 }, {
        xPercent: -6, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
      });
    });
  } else {
    document.querySelectorAll('.ch').forEach(c => (c.style.transform = 'none'));
    document.querySelectorAll('[data-reveal],[data-reveal-group] > *,.hero-fade').forEach(el => (el.style.opacity = 1));
  }

  /* ---------- Horizontal gallery (desktop) ---------- */
  const hwrap = document.querySelector('.hscroll');
  if (hwrap && !reduced && !isTouch) {
    const track = hwrap.querySelector('.hscroll-track');
    const getDist = () => track.scrollWidth - window.innerWidth;
    gsap.to(track, {
      x: () => -getDist(), ease: 'none',
      scrollTrigger: {
        trigger: hwrap, start: 'top top',
        end: () => '+=' + getDist(),
        pin: true, scrub: 1, invalidateOnRefresh: true
      }
    });
  }

  /* ---------- Floating preview on list hover ---------- */
  if (!isTouch) {
    const float = document.createElement('div');
    float.className = 'float-preview';
    const fimg = document.createElement('img');
    float.appendChild(fimg);
    document.body.appendChild(float);
    let fx = 0, fy = 0, cx = 0, cy = 0, active = false;
    window.addEventListener('mousemove', e => { fx = e.clientX; fy = e.clientY; });
    gsap.ticker.add(() => {
      cx += (fx - cx) * 0.12; cy += (fy - cy) * 0.12;
      float.style.transform = `translate(${cx + 24}px, ${cy - 90}px) rotate(${(fx - cx) * 0.04}deg)`;
    });
    document.querySelectorAll('[data-preview]').forEach(row => {
      row.addEventListener('mouseenter', () => {
        fimg.src = row.dataset.preview;
        float.classList.add('on'); active = true;
      });
      row.addEventListener('mouseleave', () => { float.classList.remove('on'); active = false; });
    });
  }

  /* ---------- Custom cursor ---------- */
  if (!isTouch && !reduced) {
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    document.body.append(dot, ring);
    document.body.classList.add('has-cursor');
    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px)`;
    });
    gsap.ticker.add(() => {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px)`;
    });
    document.querySelectorAll('a, button, [data-hover]').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('grow'));
      el.addEventListener('mouseleave', () => ring.classList.remove('grow'));
    });
  }

  /* ---------- Magnetic ---------- */
  if (!isTouch && !reduced) {
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        gsap.to(el, {
          x: (e.clientX - r.left - r.width / 2) * 0.3,
          y: (e.clientY - r.top - r.height / 2) * 0.3,
          duration: 0.4, ease: 'power3.out'
        });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }));
    });
  }

  /* ---------- Stat counters ---------- */
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: () => { el.textContent = Math.round(obj.v) + suffix; }
    });
  });
})();
