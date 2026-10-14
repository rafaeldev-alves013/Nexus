/* =========================================================
   Nexus Marketing Estratégico — interações
   GSAP + ScrollTrigger + Lenis + Lucide
   ========================================================= */
(() => {
  'use strict';

  // ---------- Configuração ----------
  const WA = 'https://wa.me/553191351242';
  const root = document.documentElement;
  const qs = (s, c = document) => c.querySelector(s);
  const qsa = (s, c = document) => [...c.querySelectorAll(s)];

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const motion = hasGsap && !reduce;

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  if (!motion) root.classList.add('no-motion');

  // ---------- Links do WhatsApp com mensagem pré-preenchida ----------
  qsa('[data-wa]').forEach(a => {
    a.href = `${WA}?text=${encodeURIComponent(a.dataset.wa)}`;
  });

  // ---------- Ícones Lucide ----------
  if (window.lucide) {
    lucide.createIcons({ attrs: { 'stroke-width': 1.4, 'aria-hidden': 'true', focusable: 'false' } });
  }

  // ---------- Scroll suave (Lenis) ----------
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // ---------- Header, barra de progresso ----------
  const header = qs('.header');
  const bar = qs('.progress__bar');
  let lastY = 0;
  let menuOpen = false;

  function onScroll(y) {
    header.classList.toggle('is-scrolled', y > 10);
    if (!menuOpen) {
      // some ao descer, volta ao subir
      header.classList.toggle('is-hidden', y > lastY && y > 320);
    }
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
  }
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  onScroll(scrollY);

  // header reaparece se o foco do teclado entrar nele
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  // ---------- Menu mobile ----------
  const burger = qs('.burger');
  const menu = qs('#menu-mobile');

  function openMenu() {
    menuOpen = true;
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fechar menu');
    header.classList.remove('is-hidden');
    header.classList.add('is-scrolled');
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    setTimeout(() => qs('a', menu).focus(), 60);
  }
  function closeMenu(returnFocus = false) {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menu');
    if (lenis) lenis.start();
    document.body.style.overflow = '';
    setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 400);
    if (returnFocus) burger.focus();
  }
  burger.addEventListener('click', () => (menuOpen ? closeMenu(true) : openMenu()));

  document.addEventListener('keydown', e => {
    if (!menuOpen) return;
    if (e.key === 'Escape') { closeMenu(true); return; }
    if (e.key === 'Tab') {
      // mantém o foco dentro do menu (inclui o botão de fechar)
      const focusables = [burger, ...qsa('a', menu)];
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  addEventListener('resize', () => { if (innerWidth >= 1080) closeMenu(); });

  // ---------- Links-âncora (com Lenis) ----------
  qsa('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = qs(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(id === '#inicio' ? 0 : target, { duration: 1.4 });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      // move o foco para a seção (navegação por teclado)
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  // ---------- Formulário → WhatsApp ----------
  const form = qs('#form-contato');
  const whats = qs('#f-whats');
  const fields = qsa('input, select', form);

  function validate(f) {
    if (f === whats) {
      whats.setCustomValidity(whats.validity.patternMismatch ? 'Informe o WhatsApp com DDD, apenas números.' : '');
    }
    const ok = f.checkValidity();
    f.closest('.field').classList.toggle('is-invalid', !ok);
    f.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  fields.forEach(f => {
    const ev = f.tagName === 'SELECT' ? 'change' : 'input';
    f.addEventListener(ev, () => { if (f.closest('.field').classList.contains('is-invalid')) validate(f); });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const invalid = fields.filter(f => !validate(f));
    if (invalid.length) {
      invalid[0].focus();
      invalid[0].reportValidity();
      return;
    }
    const v = name => form.elements[name].value.trim();
    const msg = [
      'Olá! Vim pelo site da Nexus e gostaria de conversar.',
      '',
      `Nome: ${v('nome')}`,
      `Especialidade: ${v('especialidade')}`,
      `Clínica/consultório: ${v('clinica')}`,
      `WhatsApp: ${v('whatsapp')}`,
      `Solução: ${v('solucao')}`
    ].join('\n');
    window.open(`${WA}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  // ---------- Botão flutuante não cobre o envio do formulário (mobile) ----------
  const waFloat = qs('.wa-float');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([entry]) => {
      waFloat.classList.toggle('is-away', entry.isIntersecting && innerWidth < 768);
    }, { rootMargin: '0px 0px -40px 0px' });
    io.observe(qs('#form-submit'));
  }

  // ---------- Rede "Nexus" interativa (rodapé) ----------
  // Um núcleo "N" conectado aos pilares da marca, cercado de partículas.
  // O ponteiro atrai as partículas e acende conexões; clique/toque solta uma onda.
  (function nexo() {
    const box = qs('#nexo');
    if (!box) return;
    const canvas = qs('canvas', box);
    const ctx = canvas.getContext('2d');
    const GOLD = '184,154,106';
    const WHITE = '255,255,255';
    const PILARES = ['ESTRATÉGIA', 'IDENTIDADE', 'RESPONSABILIDADE', 'TECNOLOGIA', 'EXPERIÊNCIA'];

    let w = 0, h = 0;
    let core = null, hubs = [], dots = [], waves = [];
    const ptr = { x: 0, y: 0, on: false };
    let running = false, visible = false, raf = 0, coreGlow = 0;

    function build() {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      core = { x: w / 2, y: h / 2 };
      const ry = Math.min(w, h) * .34;
      const rx = Math.min(ry * 1.55, w / 2 - 70);
      hubs = PILARES.map((t, i) => {
        const a = -Math.PI / 2 + i * (Math.PI * 2 / PILARES.length);
        const bx = core.x + Math.cos(a) * rx;
        const by = core.y + Math.sin(a) * ry;
        return { t, a, bx, by, x: bx, y: by, ph: Math.random() * 6.3, glow: 0, pulse: Math.random() };
      });

      const total = Math.round(Math.min(70, Math.max(26, (w * h) / 4800)));
      dots = Array.from({ length: total }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
        r: Math.random() * 1.2 + .6
      }));
    }

    function step(time) {
      // partículas: deriva lenta, atração pelo ponteiro, empurrão das ondas
      for (const d of dots) {
        if (ptr.on) {
          const dx = ptr.x - d.x, dy = ptr.y - d.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 140 && dist > 18) { d.vx += dx / dist * .02; d.vy += dy / dist * .02; }
        }
        for (const wv of waves) {
          const dx = d.x - wv.x, dy = d.y - wv.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (Math.abs(dist - wv.r) < 18) { d.vx += dx / dist * .6 * wv.life; d.vy += dy / dist * .6 * wv.life; }
        }
        d.vx *= .97; d.vy *= .97;
        // velocidade mínima para nunca parar
        if (Math.hypot(d.vx, d.vy) < .08) { d.vx += (Math.random() - .5) * .05; d.vy += (Math.random() - .5) * .05; }
        d.x += d.vx; d.y += d.vy;
        if (d.x < -10) d.x = w + 10; else if (d.x > w + 10) d.x = -10;
        if (d.y < -10) d.y = h + 10; else if (d.y > h + 10) d.y = -10;
      }
      waves = waves.filter(wv => { wv.r += 4.5; wv.life -= .018; return wv.life > 0; });

      // pilares flutuam e acendem perto do ponteiro
      for (const hb of hubs) {
        hb.x = hb.bx + Math.cos(time / 1700 + hb.ph) * 4;
        hb.y = hb.by + Math.sin(time / 1500 + hb.ph) * 4;
        const near = ptr.on && Math.hypot(ptr.x - hb.x, ptr.y - hb.y) < 64;
        hb.glow += ((near ? 1 : 0) - hb.glow) * .12;
        hb.pulse = (hb.pulse + .006 + hb.glow * .012) % 1;
      }
      const nearCore = ptr.on && Math.hypot(ptr.x - core.x, ptr.y - core.y) < 54;
      coreGlow += ((nearCore ? 1 : 0) - coreGlow) * .1;
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);

      // conexões entre partículas
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < 74) {
            ctx.strokeStyle = `rgba(${WHITE},${(1 - dist / 74) * .1})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }

      // conexões douradas até o ponteiro
      if (ptr.on) {
        for (const d of dots) {
          const dist = Math.hypot(ptr.x - d.x, ptr.y - d.y);
          if (dist < 130) {
            ctx.strokeStyle = `rgba(${GOLD},${(1 - dist / 130) * .55})`;
            ctx.beginPath(); ctx.moveTo(ptr.x, ptr.y); ctx.lineTo(d.x, d.y); ctx.stroke();
          }
        }
      }

      // anel ligando os pilares
      ctx.strokeStyle = `rgba(${WHITE},.06)`;
      ctx.beginPath();
      hubs.forEach((hb, i) => { i ? ctx.lineTo(hb.x, hb.y) : ctx.moveTo(hb.x, hb.y); });
      ctx.closePath(); ctx.stroke();

      // raios núcleo → pilares, com um pulso viajando até o centro
      for (const hb of hubs) {
        const g = Math.max(hb.glow, coreGlow);
        ctx.strokeStyle = `rgba(${GOLD},${.18 + g * .62})`;
        ctx.lineWidth = 1 + g;
        ctx.beginPath(); ctx.moveTo(hb.x, hb.y); ctx.lineTo(core.x, core.y); ctx.stroke();
        ctx.lineWidth = 1;

        const p = hb.pulse;
        const px = hb.x + (core.x - hb.x) * p, py = hb.y + (core.y - hb.y) * p;
        ctx.fillStyle = `rgba(${GOLD},${(.35 + g * .65) * Math.sin(p * Math.PI)})`;
        ctx.beginPath(); ctx.arc(px, py, 1.8 + g, 0, Math.PI * 2); ctx.fill();
      }

      // partículas
      for (const d of dots) {
        ctx.fillStyle = `rgba(${WHITE},.45)`;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
      }

      // ondas do clique
      for (const wv of waves) {
        ctx.strokeStyle = `rgba(${GOLD},${wv.life * .7})`;
        ctx.beginPath(); ctx.arc(wv.x, wv.y, wv.r, 0, Math.PI * 2); ctx.stroke();
      }

      // pilares: ponto + rótulo
      const small = w < 420;
      ctx.font = `600 ${small ? 9.5 : 11}px Manrope, system-ui, sans-serif`;
      if ('letterSpacing' in ctx) ctx.letterSpacing = small ? '1.2px' : '1.8px';
      ctx.textAlign = 'center';
      for (const hb of hubs) {
        const g = hb.glow;
        ctx.fillStyle = `rgba(${GOLD},${.75 + g * .25})`;
        ctx.beginPath(); ctx.arc(hb.x, hb.y, 3 + g * 2, 0, Math.PI * 2); ctx.fill();
        if (g > .02) {
          ctx.strokeStyle = `rgba(${GOLD},${g * .5})`;
          ctx.beginPath(); ctx.arc(hb.x, hb.y, 9 + g * 6, 0, Math.PI * 2); ctx.stroke();
        }
        const up = Math.sin(hb.a) < -.3;
        ctx.fillStyle = g > .3 ? `rgba(${GOLD},1)` : `rgba(${WHITE},${.62 + g * .38})`;
        ctx.fillText(hb.t, hb.x, hb.y + (up ? -14 : 22));
      }

      // núcleo "N"
      const breathe = Math.sin(time / 900) * .5 + .5;
      ctx.fillStyle = `rgba(${GOLD},${.08 + breathe * .06 + coreGlow * .12})`;
      ctx.beginPath(); ctx.arc(core.x, core.y, 34 + breathe * 4 + coreGlow * 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0E0E10';
      ctx.strokeStyle = `rgba(${GOLD},${.7 + coreGlow * .3})`;
      ctx.beginPath(); ctx.arc(core.x, core.y, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '600 26px "Cormorant Garamond", Georgia, serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('N', core.x, core.y + 1);
      ctx.textBaseline = 'alphabetic';
    }

    function loop(time) {
      step(time);
      draw(time);
      raf = requestAnimationFrame(loop);
    }
    function start() { if (!running && !reduce) { running = true; raf = requestAnimationFrame(loop); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    // ponteiro (mouse, caneta e toque)
    const pos = e => {
      const r = box.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true;
    };
    box.addEventListener('pointermove', pos);
    box.addEventListener('pointerdown', e => {
      pos(e);
      waves.push({ x: ptr.x, y: ptr.y, r: 4, life: 1 });
      hubs.forEach(hb => { hb.pulse = 0; });
      if (reduce) { step(0); draw(0); }
    });
    box.addEventListener('pointerleave', () => { ptr.on = false; });
    box.addEventListener('pointercancel', () => { ptr.on = false; });

    // só anima quando está visível na tela
    const render = () => { build(); if (reduce) { step(0); draw(0); } };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        visible ? start() : stop();
      }, { rootMargin: '100px' }).observe(box);
    } else {
      start();
    }
    let resizeT;
    addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(render, 150); });
    render();
    // redesenha quando as fontes carregarem (rótulos e "N")
    if (document.fonts) document.fonts.ready.then(() => { if (reduce) draw(0); });
  })();

  // ---------- Sem animações: remove o preloader e encerra ----------
  const preloader = qs('.preloader');
  if (!motion) {
    preloader.remove();
    return;
  }

  /* =======================================================
     A partir daqui, apenas com animações ativas
     ======================================================= */

  // Divide um título em palavras mascaradas (revelação linha a linha)
  function splitWords(el) {
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const mask = document.createElement('span');
            const inner = document.createElement('span');
            mask.className = 'w';
            inner.textContent = part;
            mask.appendChild(inner);
            frag.appendChild(mask);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    const masks = qsa('.w', el);
    // agrupa por linha visual
    const tops = [...new Set(masks.map(m => m.offsetTop))].sort((a, b) => a - b);
    return masks.map(m => ({ el: m.firstChild, line: tops.indexOf(m.offsetTop) }));
  }

  function revealWords(words, vars = {}) {
    return gsap.from(words.map(w => w.el), {
      yPercent: 115,
      duration: 1,
      ease: 'power4.out',
      delay: i => (vars.delay || 0) + words[i].line * 0.09,
      scrollTrigger: vars.scrollTrigger
    });
  }

  // Aguarda as fontes (máx. 1,5s) para medir as linhas corretamente
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, 1500))
  ]);

  // ---------- Preloader ----------
  const letters = qsa('.preloader__word span');
  gsap.set(letters, { yPercent: 105 });
  gsap.set('.preloader__word', { opacity: 1 });

  const heroTitle = qs('.hero__title');
  gsap.set(heroTitle, { visibility: 'hidden' });
  gsap.set(['.hero__eyebrow', '.hero__text > *', '.hero__actions'], { y: 18, opacity: 0 });

  const pre = gsap.timeline({ onComplete: () => preloader.remove() });
  pre.to(letters, { yPercent: 0, duration: .45, ease: 'power3.out', stagger: .05 })
     .to(preloader, { yPercent: -100, duration: .5, ease: 'power3.inOut' }, '+=.1');

  fontsReady.then(() => {
    // Hero entra logo após a cortina subir
    const words = splitWords(heroTitle);
    gsap.set(heroTitle, { visibility: 'visible' });
    revealWords(words, { delay: Math.max(pre.duration() - pre.time() - .25, 0) });
    gsap.to(['.hero__eyebrow', '.hero__text > *', '.hero__actions'], {
      y: 0, opacity: 1, duration: .9, ease: 'power3.out', stagger: .08,
      delay: Math.max(pre.duration() - pre.time(), 0) + .15
    });

    // Demais títulos revelados no scroll
    qsa('[data-split]').forEach(el => {
      if (el === heroTitle) return;
      revealWords(splitWords(el), { scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    });

    ScrollTrigger.refresh();
  });

  // ---------- Hero: parallax em camadas (scroll + mouse) ----------
  qsa('.hero .layer').forEach(layer => {
    gsap.to(layer, {
      y: () => parseFloat(layer.dataset.speed) * 320,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true }
    });
  });
  gsap.to('.hero__title', { y: 70, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__bottom', { y: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  if (finePointer) {
    const movers = qsa('.layer__mouse').map(el => ({
      depth: parseFloat(el.dataset.depth),
      x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }),
      y: gsap.quickTo(el, 'y', { duration: 1.2, ease: 'power3' })
    }));
    qs('.hero').addEventListener('mousemove', e => {
      const nx = e.clientX / innerWidth - .5;
      const ny = e.clientY / innerHeight - .5;
      movers.forEach(m => { m.x(nx * m.depth * 2); m.y(ny * m.depth * 2); });
    });
  }

  // ---------- Contadores 01–06 ----------
  qsa('.num[data-count]').forEach(el => {
    const end = parseInt(el.dataset.count, 10);
    const suffix = el.textContent.trim().endsWith('.') ? '.' : '';
    const fmt = n => String(Math.round(n)).padStart(2, '0') + suffix;
    const o = { v: 0 };
    el.textContent = fmt(0);
    gsap.to(o, {
      v: end, duration: .9 + end * .08, ease: 'power2.out',
      onUpdate: () => { el.textContent = fmt(o.v); },
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  // ---------- Bloco escuro: expansão + itens em sequência ----------
  const mm = gsap.matchMedia();
  mm.add({ mobile: '(max-width: 767px)', desktop: '(min-width: 768px)' }, ctx => {
    gsap.fromTo('.dark__bg',
      { scaleX: ctx.conditions.mobile ? .95 : .9, opacity: .5 },
      { scaleX: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: '.dark', start: 'top 92%', end: 'top 40%', scrub: true } });

    // Linha do tempo: horizontal no desktop, vertical no mobile
    gsap.fromTo('.timeline__line > span',
      ctx.conditions.desktop ? { scaleX: 0 } : { scaleY: 0 },
      { ...(ctx.conditions.desktop ? { scaleX: 1 } : { scaleY: 1 }), ease: 'none',
        scrollTrigger: { trigger: '.timeline', start: 'top 80%', end: ctx.conditions.desktop ? 'top 35%' : 'bottom 60%', scrub: true } });
  });

  const darkItems = qsa('.dark__grid li');
  const shapes = darkItems.map(li => qsa('svg path, svg circle, svg rect, svg line, svg polyline', li));
  shapes.flat().forEach(s => {
    const len = s.getTotalLength ? s.getTotalLength() : 60;
    gsap.set(s, { strokeDasharray: len, strokeDashoffset: len });
  });
  const darkTl = gsap.timeline({ scrollTrigger: { trigger: '.dark__grid', start: 'top 82%', once: true } });
  darkItems.forEach((li, i) => {
    darkTl.from(li, { y: 22, opacity: 0, duration: .7, ease: 'power3.out' }, i * .12)
          .to(shapes[i], { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' }, i * .12 + .1);
  });

  // ---------- Galeria: parallax interno + legendas ----------
  qsa('.tile').forEach(tile => {
    gsap.fromTo(qs('img', tile), { yPercent: -6 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true }
    });
    gsap.from(qs('figcaption', tile), {
      y: 14, opacity: 0, duration: .8, ease: 'power3.out',
      scrollTrigger: { trigger: tile, start: 'top 88%', once: true }
    });
  });

  // ---------- FlakeDesk: canais convergindo ----------
  gsap.timeline({ scrollTrigger: { trigger: '.converge', start: 'top 80%', once: true } })
    .from('.converge__node', { x: -24, opacity: 0, duration: .7, ease: 'power3.out', stagger: .1 })
    .from('.converge__lines use', { opacity: 0, duration: .8, stagger: .1 }, '-=.4')
    .from('.converge__hub', { scale: .6, opacity: 0, transformOrigin: '50% 50%', duration: .8, ease: 'back.out(1.6)' }, '-=.5');

  // ---------- IDENTIFICA: parallax horizontal ----------
  gsap.fromTo('.method__word span', { xPercent: 6 }, {
    xPercent: -28, ease: 'none',
    scrollTrigger: { trigger: '.method', start: 'top bottom', end: 'bottom top', scrub: true }
  });

  // ---------- Tilt 3D nos cards (desktop) ----------
  if (finePointer) {
    qsa('.tilt').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        gsap.to(card, { rotateY: x * 6, rotateX: -y * 6, transformPerspective: 900, duration: .5, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { rotateY: 0, rotateX: 0, duration: .8, ease: 'power3.out' });
      });
    });

    // ---------- Cursor personalizado ----------
    root.classList.add('has-cursor');
    const cursor = qs('.cursor');
    const cx = gsap.quickTo(cursor, 'x', { duration: .35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: .35, ease: 'power3' });
    addEventListener('mousemove', e => { cx(e.clientX); cy(e.clientY); cursor.classList.add('is-visible'); });
    document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
    qsa('a, button, select, input, .tile').forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });
  }

  // Recalcula posições quando tudo terminar de carregar
  addEventListener('load', () => ScrollTrigger.refresh());
})();
