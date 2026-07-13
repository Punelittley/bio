/* ============================================================
   BloomFi — interactions: static stars, nav, scroll reveals,
   counters, hero parallax, newsletter
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Theme toggle (light / dark) + image swap ---------- */
  var root = document.documentElement;

  function swapThemedImages() {
    var theme = root.getAttribute('data-theme') || 'dark';
    document.querySelectorAll('[data-img-light][data-img-dark]').forEach(function (img) {
      var next = theme === 'light' ? img.getAttribute('data-img-light') : img.getAttribute('data-img-dark');
      if (next && img.getAttribute('src') !== next) img.setAttribute('src', next);
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#ecebfa' : '#0c0820');
  }

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = (root.getAttribute('data-theme') === 'light') ? 'dark' : 'light';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('bloom-theme', next); } catch (e) {}
      swapThemedImages();
      document.dispatchEvent(new CustomEvent('bloom:theme'));
    });
  }
  swapThemedImages();

  /* ---------- Static twinkling stars (no rising motion) ---------- */
  var canvas = document.getElementById('stars');
  if (canvas && !reduce) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var stars = [];
    var W = 0, H = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function makeStar() {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.5 + 0.4,
        baseAlpha: Math.random() * 0.5 + 0.3,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.02 + 0.005
      };
    }

    function init() {
      resize();
      var count = Math.round(Math.min(170, (W * H) / 10000));
      stars = [];
      for (var i = 0; i < count; i++) stars.push(makeStar());
    }

    function starRGB() {
      var v = getComputedStyle(document.documentElement).getPropertyValue('--star-rgb').trim();
      return v || '226, 220, 255';
    }
    var rgb = starRGB();

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.twinkle += s.twinkleSpeed;
        var alpha = s.baseAlpha * (0.45 + 0.55 * Math.sin(s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ', ' + alpha + ')';
        ctx.shadowColor = 'rgba(' + rgb + ', ' + alpha + ')';
        ctx.shadowBlur = s.r * 4;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      requestAnimationFrame(draw);
    }

    document.addEventListener('bloom:theme', function () { rgb = starRGB(); });

    init();
    draw();
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(init, 200);
    });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    function toggleMenu(open) {
      var isOpen = typeof open === 'boolean' ? open : !mobileMenu.classList.contains('open');
      mobileMenu.classList.toggle('open', isOpen);
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { toggleMenu(); });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { toggleMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) toggleMenu(false);
    });
  }

  /* ---------- Scroll reveal (multiple variants + stagger) ---------- */
  var revealSelector = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var el = entry.target;
        var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) {
          return c.matches(revealSelector);
        });
        var idx = sibs.indexOf(el);
        el.style.transitionDelay = reduce ? '0ms' : Math.min(idx * 100, 500) + 'ms';
        el.classList.add('visible');
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll(revealSelector).forEach(function (el) { io.observe(el); });

  /* ---------- Hero parallax on scroll ---------- */
  var parallaxEls = document.querySelectorAll('[data-parallax]');
  if (parallaxEls.length && !reduce) {
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.pageYOffset;
        parallaxEls.forEach(function (el) {
          el.style.transform = 'translateY(' + (y * 0.06) + 'px) scale(1)';
        });
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var prefix = el.getAttribute('data-prefix') || '';
    if (reduce) { el.textContent = prefix + target + suffix; return; }
    var dur = 1600, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = eased * target;
      el.textContent = prefix + (target % 1 === 0 ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var co = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) { animateCount(entry.target); co.unobserve(entry.target); }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { co.observe(el); });

  /* ---------- Newsletter / form ---------- */
  document.querySelectorAll('form[data-mock]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var note = form.querySelector('.form-note');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Отправляем...'; }
      setTimeout(function () {
        if (btn) { btn.disabled = false; btn.textContent = label; }
        if (note) note.textContent = 'Спасибо — вы в списке. Мы скоро свяжемся с вами.';
        form.reset();
        if (note) setTimeout(function () { note.textContent = ''; }, 6000);
      }, 800);
    });
  });
})();
