/* ==========================================================================
   Partial loader + tiny template engine.

   Static-prototype analogue of TYPO3 Fluid partials:
     <div data-include="/partials/header.html"></div>
        → <f:render partial="Header" />
     <div data-include="/partials/page-banner.html"
          data-title="…" data-icon="bi-…"></div>
        → <f:render partial="PageBanner" arguments="{title:'…', icon:'…'}" />

   URLs inside partials (and the data-include path itself) are written
   root-relative ("/assets/…", "/pages/…") and are rewritten here to a
   path relative to the CURRENT page, so the site works when served from
   ANY root (project root, a parent folder, a sub-path, …).

   NOTE: partials load via fetch(), so the site must be served over http(s)
   (any dev server, or TYPO3). Opening a file via file:// blocks fetch.
   ========================================================================== */
(function () {
  // Prefix that turns a root-relative URL into one relative to this page.
  // Pages live in /pages/*.html (one level deep) → "../"; root pages → "".
  var parts = window.location.pathname.split('/');
  var parentDir = parts[parts.length - 2] || '';
  var BASE = (parentDir === 'pages') ? '../' : '';

  function rebase(url) {
    if (!url) return url;
    return url.charAt(0) === '/' ? BASE + url.slice(1) : url;
  }

  function rebaseHtml(html) {
    // rewrite href="/…" and src="/…"
    return html.replace(/\b(href|src)="\/([^"]*)"/g, function (_, attr, rest) {
      return attr + '="' + BASE + rest + '"';
    });
  }

  function fill(html, data) {
    return html.replace(/{{\s*([\w]+)\s*}}/g, function (_, key) {
      return data[key] != null ? data[key] : '';
    });
  }

  // Build the data object from data-* attributes (data-items parsed as JSON).
  function readData(node) {
    var data = {};
    Array.prototype.forEach.call(node.attributes, function (attr) {
      if (attr.name.indexOf('data-') !== 0 || attr.name === 'data-include') return;
      var key = attr.name.slice(5).replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
      if (key === 'items') {
        try { data.items = JSON.parse(attr.value); } catch (e) { data.items = []; }
      } else {
        data[key] = attr.value;
      }
    });
    return data;
  }

  // Expand a fetched partial (string) into a DOM fragment, applying data.
  function render(html, data) {
    html = rebaseHtml(html);
    var tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    var root = tpl.content;

    // Repeating rows: <li data-repeat> … {{label}} … </li>
    root.querySelectorAll('[data-repeat]').forEach(function (proto) {
      var parent = proto.parentNode;
      proto.removeAttribute('data-repeat');
      var itemHtml = proto.outerHTML;
      proto.remove();
      (data.items || []).forEach(function (item) {
        // derived helpers for breadcrumb / sidebar rows
        var ctx = Object.assign({}, item);
        if (item.href) ctx.href = rebase(item.href);
        if (item.current) {
          ctx.activeCls = 'active';            // breadcrumb current
        } else if (item.active) {
          ctx.activeCls = 'is-active';         // sidebar current
        } else {
          ctx.activeCls = '';
        }
        ctx.aria = item.current ? ' aria-current="page"' : '';
        if (item.current || item.href == null) {
          ctx.content = item.label;
        } else {
          ctx.content = '<a href="' + ctx.href + '">' + item.label + '</a>';
        }
        parent.insertAdjacentHTML('beforeend', fill(itemHtml, ctx));
      });
    });

    // Scalar placeholders on the rest of the partial, then a final rebase pass
    // so URLs injected via {{…}} (e.g. the banner image) are made relative too.
    var wrap = document.createElement('div');
    wrap.appendChild(root);
    wrap.innerHTML = rebaseHtml(fill(wrap.innerHTML, data));

    // Optional media block: drop it when no image supplied.
    if (!data.image) {
      wrap.querySelectorAll('[data-media]').forEach(function (m) { m.remove(); });
    }

    var frag = document.createDocumentFragment();
    while (wrap.firstChild) frag.appendChild(wrap.firstChild);
    return frag;
  }

  function loadIncludes() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-include]'));
    if (nodes.length === 0) { finish(); return; }
    var remaining = nodes.length;

    nodes.forEach(function (node) {
      var url = rebase(node.getAttribute('data-include'));
      var data = readData(node);
      fetch(url)
        .then(function (res) {
          if (!res.ok) throw new Error(res.status + ' ' + res.statusText);
          return res.text();
        })
        .then(function (html) {
          node.replaceWith(render(html, data));
        })
        .catch(function (err) {
          console.error('[include] Failed to load ' + url + ':', err);
        })
        .then(function () {
          remaining -= 1;
          if (remaining === 0) finish();
        });
    });
  }

  function finish() {
    markActiveNav();
    document.dispatchEvent(new CustomEvent('includes:loaded'));
  }

  // Highlight the nav entry matching the current file (basename compare).
  function markActiveNav() {
    var here = (window.location.pathname.split('/').pop() || 'index.html');
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadIncludes);
  } else {
    loadIncludes();
  }
})();
