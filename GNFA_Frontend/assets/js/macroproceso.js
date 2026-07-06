/* ==========================================================================
   Macroprocesos module — client-side screen switcher (static prototype).

   Screens: login → user-welcome / user-results → admin-list / admin-create.
   Any element carrying data-screen="a b c" is visible only on those screens;
   any control carrying data-go="screen" switches to that screen on click.
   ========================================================================== */
(function () {
  var root = document.querySelector('.macro');
  if (!root) return;

  var SCREENS = ['login', 'user-welcome', 'user-results', 'admin-list', 'admin-create'];

  function show(screen) {
    if (SCREENS.indexOf(screen) === -1) screen = 'login';
    root.querySelectorAll('[data-screen]').forEach(function (el) {
      var list = el.getAttribute('data-screen').split(/\s+/);
      el.hidden = list.indexOf(screen) === -1;
    });
  }

  root.querySelectorAll('[data-go]').forEach(function (ctrl) {
    ctrl.addEventListener('click', function (e) {
      e.preventDefault();
      show(ctrl.getAttribute('data-go'));
    });
  });

  // Demo forms never actually submit.
  root.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function (e) { e.preventDefault(); });
  });

  // Optional deep-link: ?screen=admin-list opens directly on that screen.
  var initial = 'login';
  var m = /[?&]screen=([\w-]+)/.exec(window.location.search);
  if (m && SCREENS.indexOf(m[1]) !== -1) initial = m[1];
  show(initial);
})();
