/* ============================================================
   Main interactions
   loader · cursor · mobile menu · reveals · counters · faq · form
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Loader ---------- */
  var loader = document.getElementById('loader');
  function revealPage() {
    if (!loader) return;
    loader.classList.add('hidden');
    document.body.classList.add('loaded');
  }
  window.addEventListener('load', function () {
    setTimeout(revealPage, reduce ? 0 : 850);
  });
  setTimeout(revealPage, 3000); // safety fallback

  /* ---------- Custom cursor ---------- */
  var cursor = document.getElementById('cursor');
  var follower = document.getElementById('cursorFollower');

  if (finePointer && cursor && follower && !reduce) {
    var cx = 0, cy = 0, fx = 0, fy = 0;

    document.addEventListener('pointermove', function (e) {
      cx = e.clientX;
      cy = e.clientY;
      cursor.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
    });

    (function loop() {
      fx += (cx - fx) * 0.14;
      fy += (cy - fy) * 0.14;
      follower.style.transform = 'translate(' + fx + 'px,' + fy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('a, button, input, textarea, .work-card, .svc, .price-card, .quote-card').forEach(function (el) {
      el.addEventListener('pointerenter', function () { follower.classList.add('hovering'); });
      el.addEventListener('pointerleave', function () { follower.classList.remove('hovering'); });
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
      burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
      mobileMenu.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    burger.addEventListener('click', function () { toggleMenu(); });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { toggleMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) toggleMenu(false);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
        return c.classList.contains('fade-up');
      });
      var index = siblings.indexOf(el);
      el.style.transitionDelay = reduce ? '0ms' : Math.min(index * 70, 350) + 'ms';
      el.classList.add('visible');
      revealObserver.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-up').forEach(function (el) { revealObserver.observe(el); });

  /* ---------- Animated counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }

    var duration = 1500, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var countObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.stat-value').forEach(function (el) { countObserver.observe(el); });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    var ans = item.querySelector('.faq-a');
    if (!btn || !ans) return;

    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var isOpen = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
      ans.style.maxHeight = isOpen ? ans.scrollHeight + 'px' : '0px';
    });
  });

  /* ---------- Portfolio filter ---------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var workCards = document.querySelectorAll('#workGrid .work-card');

  if (filterBtns.length && workCards.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');

        workCards.forEach(function (card) {
          var match = filter === 'all' || card.getAttribute('data-cat') === filter;
          card.classList.toggle('is-hidden', !match);
        });
      });
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var submitBtn = document.getElementById('submitBtn');
    var formSuccess = document.getElementById('formSuccess');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';

      setTimeout(function () {
        submitBtn.textContent = 'Отправить заявку';
        submitBtn.disabled = false;
        formSuccess.textContent = 'Спасибо! Заявка получена — свяжусь с вами в ближайшее время.';
        form.reset();
        setTimeout(function () { formSuccess.textContent = ''; }, 6000);
      }, 900);
    });
  }
})();
