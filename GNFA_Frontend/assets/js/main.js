/* ==========================================================================
   Site behaviour.
   - Page-body components initialise on DOMContentLoaded (carousel, counters…).
   - Header/nav initialises on `includes:loaded` (fired by include.js once the
     header partial has been injected).
   ========================================================================== */

/* -------------------------------------------------------------------------
   Initialise all components once the DOM is ready. The header/footer are
   inlined in each page (so the site works when opened directly, without a
   server), so everything can initialise on DOMContentLoaded.
   ------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {
  initHeroCarousel();
  initCharCounters();
  initAlphabetNav();
  initMegaMenu();
  initServiceMenu();
  markActiveNav();
});

/* ---- Servicios menu (utility bar): full-width panel toggle ---- */
function initServiceMenu() {
  var svc = document.querySelector('.svc');
  if (!svc) return;
  var toggle = svc.querySelector('.svc__toggle');
  if (!toggle) return;

  function close() {
    svc.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function open() {
    svc.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    if (svc.classList.contains('is-open')) close();
    else open();
  });

  // Close when clicking outside the menu, choosing a link, or pressing Escape.
  document.addEventListener('click', function (e) {
    if (!svc.contains(e.target)) close();
  });
  svc.querySelectorAll('.svc__link').forEach(function (a) {
    a.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
}

/* Highlight the nav entry matching the current file. */
function markActiveNav() {
  var here = (window.location.pathname.split('/').pop() || 'index.html') || 'index.html';
  document.querySelectorAll('.mega__item a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (!href || href === '#') return;
    if (href.split('/').pop() === here) {
      a.classList.add('is-current');
      var item = a.closest('.mega__item');
      if (item) item.classList.add('is-current');
    }
  });
}

/* ---- Hero carousel: play/pause + custom indicator dots ---- */
function initHeroCarousel() {
  var heroEl = document.getElementById('heroCarousel');
  var slideCount = heroEl ? heroEl.querySelectorAll('.carousel-item').length : 0;
  if (!heroEl || !window.bootstrap || slideCount <= 1) return;

  var carousel = bootstrap.Carousel.getOrCreateInstance(heroEl, { interval: 6000 });
  var playPauseBtn = heroEl.querySelector('.js-play-pause');
  var isPlaying = true;

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', function () {
      if (isPlaying) {
        carousel.pause();
        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
      } else {
        carousel.cycle();
        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
      }
      isPlaying = !isPlaying;
    });
  }

  var dots = heroEl.querySelectorAll('.js-indicator');
  dots.forEach(function (dot) {
    dot.addEventListener('click', function () {
      carousel.to(parseInt(dot.dataset.slideTo, 10));
    });
  });

  heroEl.addEventListener('slide.bs.carousel', function (e) {
    dots.forEach(function (dot) { dot.classList.remove('active'); });
    var activeDot = heroEl.querySelector('.js-indicator[data-slide-to="' + e.to + '"]');
    if (activeDot) activeDot.classList.add('active');
  });
}

/* ---- Character counter for textareas ([data-char-count] + [maxlength]) ---- */
function initCharCounters() {
  document.querySelectorAll('[data-char-count]').forEach(function (field) {
    var target = document.querySelector(field.getAttribute('data-char-count'));
    var max = field.getAttribute('maxlength');
    function update() {
      if (!target) return;
      target.textContent = field.value.length + (max ? '/' + max : '');
    }
    field.addEventListener('input', update);
    update();
  });
}

/* ---- Alphabet navigation (glosario) ---- */
function initAlphabetNav() {
  document.querySelectorAll('.alpha-nav').forEach(function (nav) {
    var letters = Array.prototype.slice.call(nav.querySelectorAll('.alpha-nav__letter'));
    var groups = document.querySelectorAll('[data-letter-group]');

    function activate(letter) {
      letters.forEach(function (l) { l.classList.toggle('is-active', l === letter); });
      var value = letter.textContent.trim();
      var heading = document.querySelector('[data-letter-heading]');
      if (heading) heading.textContent = value;
      groups.forEach(function (g) {
        g.hidden = g.getAttribute('data-letter-group') !== value;
      });
    }

    letters.forEach(function (letter) {
      letter.addEventListener('click', function () { activate(letter); });
    });

    function step(dir) {
      var current = letters.findIndex(function (l) { return l.classList.contains('is-active'); });
      var next = Math.min(Math.max(current + dir, 0), letters.length - 1);
      if (letters[next]) activate(letters[next]);
    }

    var prev = nav.querySelector('.alpha-nav__arrow--prev');
    var nextBtn = nav.querySelector('.alpha-nav__arrow--next');
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); });
  });
}

/* ---- Mega-menu: full-width panels (desktop) + off-canvas drawer (mobile) ---- */
function initMegaMenu() {
  var nav = document.querySelector('.mega');
  if (!nav) return;

  var body = document.body;
  var toggle = nav.querySelector('.mega__toggle');
  var backdrop = document.querySelector('.mega-backdrop');

  function openDrawer() {
    body.classList.add('mega-open');
    if (backdrop) backdrop.hidden = false;
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer() {
    body.classList.remove('mega-open');
    if (backdrop) backdrop.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    closeAllPanels();
  }
  function closeAllPanels() {
    nav.querySelectorAll('.mega__item.is-open').forEach(function (item) {
      item.classList.remove('is-open');
      var link = item.querySelector('.mega__link');
      if (link) link.setAttribute('aria-expanded', 'false');
    });
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      if (body.classList.contains('mega-open')) closeDrawer();
      else openDrawer();
    });
  }
  if (backdrop) backdrop.addEventListener('click', closeDrawer);

  // Panel toggles — only act as accordions inside the mobile drawer.
  nav.querySelectorAll('.mega__item.has-panel > .mega__link').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (window.innerWidth >= 992) return;       // desktop uses hover / focus
      var item = btn.closest('.mega__item');
      var willOpen = !item.classList.contains('is-open');
      closeAllPanels();
      item.classList.toggle('is-open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    });
  });

  // Close the drawer after choosing a destination link.
  nav.querySelectorAll('.mega__panel-links a, a.mega__link').forEach(function (a) {
    a.addEventListener('click', closeDrawer);
  });

  // Escape closes everything.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  // Returning to desktop width resets the mobile state.
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 992) closeDrawer();
  });
}
