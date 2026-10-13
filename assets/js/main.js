(() => {
  'use strict';

  /* =======================================================
     НАСТРОЙКИ — замените на свои данные
     ======================================================= */
  const CONFIG = {
    telegram: 'totktoect', // ← ник в Telegram без @ (куда приходят заказы)
    instagram: '',         // ← ник в Instagram; пока пусто — ссылки скрыты
    product: 'лонгслив-хенли skryăba, цвет серый меланж',
  };

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger && window.SplitText);

  // Библиотеки не загрузились — показываем страницу без анимаций
  if (!hasGSAP) root.classList.replace('js', 'no-js');

  let lenis = null;

  /* =======================================================
     LINKS
     ======================================================= */
  const tgBase = `https://t.me/${CONFIG.telegram}`;
  const tgLink = (text) => `${tgBase}?text=${encodeURIComponent(text)}`;

  $$('[data-tg-link]').forEach((a) => {
    a.href = tgBase;
    a.target = '_blank';
    a.rel = 'noopener';
  });
  $$('[data-ig-link]').forEach((a) => {
    if (CONFIG.instagram) a.href = `https://instagram.com/${CONFIG.instagram}`;
    else a.remove();
  });
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* =======================================================
     SIZE PICKER + ORDER
     ======================================================= */
  const sizes = $('[data-sizes]');
  const order = $('[data-order]');
  const orderLabel = $('[data-order-label]');
  const hint = $('[data-size-hint]');
  const radios = $$('input[name="size"]', sizes);
  const defaultHint = hint.textContent;
  let size = null;

  const updateOrderLink = () => {
    order.href = size
      ? tgLink(`Здравствуйте! Хочу заказать ${CONFIG.product}, размер ${size}.`)
      : tgLink(`Здравствуйте! Хочу заказать ${CONFIG.product}. Помогите подобрать размер.`);
  };
  updateOrderLink();

  radios.forEach((radio, i) => {
    radio.addEventListener('change', () => {
      size = radio.value;
      sizes.style.setProperty('--i', i);
      sizes.classList.add('has-value');
      sizes.classList.remove('is-attention');
      hint.textContent = defaultHint;
      orderLabel.textContent = `Заказать ${size} в Telegram`;
      updateOrderLink();
    });
  });

  order.addEventListener('click', (e) => {
    if (size) return;
    e.preventDefault();
    sizes.classList.remove('is-attention');
    void sizes.offsetWidth; // перезапуск анимации подсветки
    sizes.classList.add('is-attention');
    hint.textContent = 'Выберите размер — он сразу попадёт в сообщение.';
    radios[0].focus({ preventScroll: true });
  });

  /* =======================================================
     PRODUCT GALLERY
     ======================================================= */
  const gallery = $('[data-gallery]');
  const slides = $$('img', gallery);
  const thumbs = $$('.buy__thumbs button');
  let slide = 0;

  const showSlide = (i) => {
    slide = (i + slides.length) % slides.length;
    slides.forEach((s, j) => s.classList.toggle('is-active', j === slide));
    thumbs.forEach((t, j) => {
      t.classList.toggle('is-active', j === slide);
      t.setAttribute('aria-pressed', String(j === slide));
    });
  };
  thumbs.forEach((t, i) => t.addEventListener('click', () => showSlide(i)));

  // свайп по фото на тач-устройствах
  let swipeX = null;
  gallery.style.touchAction = 'pan-y';
  gallery.addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
  gallery.addEventListener('pointerup', (e) => {
    if (swipeX === null) return;
    const dx = e.clientX - swipeX;
    swipeX = null;
    if (Math.abs(dx) > 40) showSlide(slide + (dx < 0 ? 1 : -1));
  });
  gallery.addEventListener('pointercancel', () => { swipeX = null; });

  /* =======================================================
     SIZE GUIDE DIALOG
     ======================================================= */
  const dialog = $('#sizesDialog');
  $$('[data-open-sizes]').forEach((btn) => btn.addEventListener('click', () => {
    dialog.showModal();
    lenis?.stop();
  }));
  $('[data-close-sizes]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => lenis?.start());

  /* =======================================================
     FAQ ACCORDION
     ======================================================= */
  $$('.faq__q').forEach((btn) => {
    const item = btn.closest('.faq__item');
    const panel = $('#' + btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      panel.inert = !open;
    });
  });

  /* =======================================================
     NAV: mobile menu, hide on scroll
     ======================================================= */
  const nav = $('[data-nav]');
  const menu = $('#menu');
  const burger = $('[data-menu-toggle]');

  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    nav.classList.remove('is-hidden');
    open ? lenis?.stop() : lenis?.start();
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false);
  });

  let lastY = 0;
  const onScroll = (y) => {
    if (menu.classList.contains('is-open')) return;
    if (y > 160 && y > lastY + 4) nav.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 160) nav.classList.remove('is-hidden');
    lastY = y;
  };

  /* =======================================================
     ANCHORS
     ======================================================= */
  const scrollToTarget = (hash) => {
    const target = hash === '#top' ? 0 : $(hash);
    if (target === null) return;
    if (target !== 0) {
      // переносим фокус, чтобы клавиатурная навигация продолжалась с нужного раздела
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
    if (lenis) lenis.scrollTo(target, { offset: hash === '#buy' ? -72 : 0, duration: 1.6 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href');
      if (hash.length < 2) return;
      e.preventDefault();
      if (menu.classList.contains('is-open')) setMenu(false);
      scrollToTarget(hash);
    });
  });

  /* =======================================================
     NO GSAP / REDUCED MOTION — простой режим
     ======================================================= */
  if (!hasGSAP || reduceMotion) {
    window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });
    initFeaturesStatic();
    return;
  }

  /* =======================================================
     MOTION
     ======================================================= */
  gsap.registerPlugin(ScrollTrigger, SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  const playIntro = !root.classList.contains('no-intro');
  if (playIntro) lenis.stop();

  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  fontsReady.then(() => {
    initHeroStage();
    initSplitReveals();
    initFadeReveals();
    initManifesto();
    initName();
    initAbsent();
    initFeatures();
    initMarquee();
    initFooter();
    initNavTheme();
    initMagnetic();

    playIntro ? runIntro() : heroIn();
    window.addEventListener('load', () => ScrollTrigger.refresh());
  });

  /* ---------- intro ---------- */
  function runIntro() {
    const pre = $('.preloader');
    const letters = $$('.wm--intro .wm__l', pre);
    const breve = $('.wm--intro .breve path', pre);

    gsap.timeline({
      defaults: { ease: 'expo.out' },
      onComplete() {
        pre.remove();
        lenis.start();
        try { sessionStorage.setItem('skr-intro', '1'); } catch (e) { /* приватный режим */ }
      },
    })
      .fromTo(letters, { y: 0, yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.05 }, 0.1)
      .to(breve, { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 0.7)
      .to('.wm--intro', { yPercent: -18, opacity: 0, duration: 0.8, ease: 'power3.in' }, 1.55)
      .fromTo(pre, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 1.7)
      .add(heroIn, 2.2);
  }

  /* ---------- hero text ---------- */
  let heroPlayed = false;
  function heroIn() {
    const title = $('[data-hero-title]');
    SplitText.create(title, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit(self) {
        gsap.set(title, { visibility: 'visible' });
        if (heroPlayed) return;
        heroPlayed = true;
        return gsap.from(self.lines, { yPercent: 108, duration: 1.4, stagger: 0.1, ease: 'expo.out' });
      },
    });
    gsap.to('[data-hero-fade]', { opacity: 1, y: 0, duration: 1.3, stagger: 0.09, ease: 'expo.out', delay: 0.25 });
  }

  /* ---------- hero image: card → full-bleed ---------- */
  function initHeroStage() {
    const stage = $('[data-hero-stage]');
    const frame = $('[data-hero-frame]');
    const img = $('[data-hero-img]');
    const caption = $('[data-hero-caption]');
    const startInset = () => (window.innerWidth <= 640 ? '4% 5% 4% 5%' : '7% 22% 7% 22%');
    const radius = () => (window.innerWidth <= 640 ? 22 : 28);

    gsap.timeline({
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: '+=110%',
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    })
      .fromTo(frame,
        { clipPath: () => `inset(${startInset()} round ${radius()}px)` },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', duration: 1 })
      .fromTo(img, { scale: 1.2 }, { scale: 1, ease: 'none', duration: 1 }, 0)
      .fromTo(caption, { opacity: 0, y: 32 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.3 }, 0.72);
  }

  /* ---------- headings: line-by-line mask reveal ---------- */
  function initSplitReveals() {
    $$('[data-split]').forEach((el) => {
      let played = false;
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit(self) {
          gsap.set(el, { visibility: 'visible' });
          if (played) return;
          return gsap.from(self.lines, {
            yPercent: 108,
            duration: 1.25,
            stagger: 0.09,
            ease: 'expo.out',
            scrollTrigger: { trigger: el, start: 'top 86%', once: true, onEnter: () => { played = true; } },
          });
        },
      });
    });
  }

  /* ---------- paragraphs & blocks: soft fade-up ---------- */
  function initFadeReveals() {
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, ease: 'expo.out', overwrite: true }),
    });
  }

  /* ---------- manifesto: words light up with scroll ---------- */
  function initManifesto() {
    const el = $('[data-scrub-words]');
    SplitText.create(el, {
      type: 'words',
      autoSplit: true,
      onSplit(self) {
        return gsap.fromTo(self.words, { opacity: 0.14 }, {
          opacity: 1,
          stagger: 0.08,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
        });
      },
    });
  }

  /* ---------- name: letters rise, breve draws itself ---------- */
  function initName() {
    const letters = $$('.wm--giant .wm__l');
    const note = $('[data-name-note]');

    gsap.from(letters, {
      yPercent: 35,
      opacity: 0,
      duration: 1.4,
      stagger: 0.06,
      ease: 'expo.out',
      scrollTrigger: { trigger: '.name__mark', start: 'top 82%', once: true },
    });

    gsap.timeline({
      scrollTrigger: { trigger: '.name__mark', start: 'top 70%', end: 'top 30%', scrub: 0.6 },
    })
      .to('[data-breve-draw] path', { strokeDashoffset: 0, ease: 'none', duration: 1 })
      .from($('i', note), { scaleY: 0, ease: 'none', duration: 0.5 }, 0.7)
      .from(note, { opacity: 0, y: 8, ease: 'none', duration: 0.5 }, 0.8);
  }

  /* ---------- absent: strike-through + counters ---------- */
  function initAbsent() {
    $$('[data-strike]').forEach((li) => {
      gsap.timeline({
        scrollTrigger: { trigger: li, start: 'top 74%', end: 'top 46%', scrub: 0.6 },
      })
        .to($('i', li), { scaleX: 1, ease: 'none', duration: 1 })
        .to($('span', li), { opacity: 0.36, ease: 'none', duration: 0.6 }, 0.4);
    });

    $$('[data-count-to]').forEach((el) => {
      const from = +el.dataset.countFrom;
      const to = +el.dataset.countTo;
      const state = { v: from };
      el.textContent = from;
      gsap.to(state, {
        v: to,
        duration: Math.min(2, 0.9 + Math.abs(to - from) / 200),
        ease: 'power3.out',
        onUpdate: () => { el.textContent = Math.round(state.v); },
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      });
    });
  }

  /* ---------- features: sticky image swaps with text ---------- */
  function initFeatures() {
    const feats = $$('.feature');
    const imgs = $$('.features__media img');
    const count = $('[data-feature-count]');
    let current = -1;

    const setActive = (i) => {
      if (i === current) return;
      current = i;
      feats.forEach((f, j) => f.classList.toggle('is-active', j === i));
      imgs.forEach((im, j) => im.classList.toggle('is-active', j === i));
      count.textContent = String(i + 1).padStart(2, '0');
    };
    setActive(0);

    const mm = gsap.matchMedia();
    mm.add('(min-width: 961px)', () => {
      feats.forEach((f, i) => ScrollTrigger.create({
        trigger: f,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => self.isActive && setActive(i),
      }));
      gsap.fromTo('[data-feature-bar]', { scaleX: 1 / feats.length }, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: '[data-features]', start: 'top 55%', end: 'bottom 55%', scrub: true },
      });
    });

    // мобильные: фото внутри каждого пункта мягко проявляются
    mm.add('(max-width: 960px)', () => {
      $$('.feature__media img').forEach((img) => {
        gsap.fromTo(img, { scale: 1.12 }, {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom 40%', scrub: true },
        });
      });
    });
  }

  // без GSAP: текст виден целиком, фото меняется мягкой сменой прозрачности
  function initFeaturesStatic() {
    const feats = $$('.feature');
    const imgs = $$('.features__media img');
    const count = $('[data-feature-count]');
    feats.forEach((f) => f.classList.add('is-active'));
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const i = feats.indexOf(entry.target);
        imgs.forEach((im, j) => im.classList.toggle('is-active', j === i));
        count.textContent = String(i + 1).padStart(2, '0');
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    feats.forEach((f) => io.observe(f));
  }

  /* ---------- marquee: reacts to scroll velocity ---------- */
  function initMarquee() {
    const track = $('[data-marquee]');
    const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1, paused: true });
    loop.totalTime(loop.duration() * 50); // запас для обратного хода

    ScrollTrigger.create({
      trigger: '.marquee',
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
      onUpdate(self) {
        const dir = self.direction;
        const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 350);
        gsap.to(loop, {
          timeScale: dir * boost,
          duration: 0.2,
          overwrite: true,
          onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.2, ease: 'power2.out' }),
        });
      },
    });
  }

  /* ---------- footer: giant wordmark rises ---------- */
  function initFooter() {
    gsap.fromTo('.wm--footer .wm__l', { yPercent: 105 }, {
      yPercent: 0,
      stagger: 0.07,
      ease: 'none',
      scrollTrigger: { trigger: '[data-footer-mark]', start: 'top 98%', end: 'bottom bottom', scrub: 0.8 },
    });
  }

  /* ---------- nav adapts over dark sections ---------- */
  function initNavTheme() {
    const navLine = () => 14 + nav.offsetHeight / 2;
    const triggers = [];
    const update = () => nav.classList.toggle('is-dark', triggers.some((t) => t.isActive));

    // героический кадр: темнеет, когда фото раскрылось
    triggers.push(ScrollTrigger.create({
      trigger: '[data-hero-stage]',
      start: () => `top+=${window.innerHeight * 0.25} top`,
      endTrigger: '.manifesto',
      end: () => `top ${navLine()}px`,
      onToggle: update,
    }));

    $$('.absent, .footer').forEach((sec) => {
      triggers.push(ScrollTrigger.create({
        trigger: sec,
        start: () => `top ${navLine()}px`,
        end: () => `bottom ${navLine()}px`,
        onToggle: update,
      }));
    });
  }

  /* ---------- magnetic buttons (desktop) ---------- */
  function initMagnetic() {
    if (!finePointer) return;
    $$('[data-magnetic]').forEach((btn) => {
      const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3.out' });
      const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3.out' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.12);
        yTo((e.clientY - r.top - r.height / 2) * 0.25);
      });
      btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }
})();
