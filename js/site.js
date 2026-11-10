/* Atlas Majesty LLC — site.js
   Header dropdown, full-screen menu, phone action bar, one type moment.
   Plain JS, no dependencies. Everything works without it except the menu button on phones. */
(function () {
  'use strict';
  var doc = document;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hoverOK = window.matchMedia('(hover: hover) and (pointer: fine)');

  /* ---- Services dropdown: hover (after 150ms), click, keyboard ---- */
  var dd = doc.querySelector('[data-dd]');
  if (dd) {
    var trigger = dd.querySelector('[aria-expanded]');
    var panel = dd.querySelector('.nav__panel');
    var timer;
    var set = function (open) {
      clearTimeout(timer);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) panel.setAttribute('data-open', ''); else panel.removeAttribute('data-open');
    };
    trigger.addEventListener('click', function () { set(trigger.getAttribute('aria-expanded') !== 'true'); });
    dd.addEventListener('mouseenter', function () { if (hoverOK.matches) timer = setTimeout(function () { set(true); }, 150); });
    dd.addEventListener('mouseleave', function () { if (hoverOK.matches) { clearTimeout(timer); timer = setTimeout(function () { set(false); }, 120); } });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && trigger.getAttribute('aria-expanded') === 'true') { set(false); trigger.focus(); } });
    doc.addEventListener('click', function (e) { if (!dd.contains(e.target)) set(false); });
    dd.addEventListener('focusout', function (e) { if (!dd.contains(e.relatedTarget)) set(false); });
  }

  /* ---- Full-screen menu ---- */
  var toggle = doc.querySelector('[data-menu-toggle]');
  var sheet = doc.querySelector('[data-sheet]');
  if (toggle && sheet) {
    var closeBtn = sheet.querySelector('[data-menu-close]');
    var focusable = function () { return sheet.querySelectorAll('a[href], button:not([disabled])'); };
    var openMenu = function (open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { sheet.setAttribute('data-open', ''); doc.body.classList.add('no-scroll'); closeBtn.focus(); }
      else { sheet.removeAttribute('data-open'); doc.body.classList.remove('no-scroll'); toggle.focus(); }
    };
    toggle.addEventListener('click', function () { openMenu(true); });
    closeBtn.addEventListener('click', function () { openMenu(false); });
    sheet.addEventListener('click', function (e) { if (e.target.closest('a')) { sheet.removeAttribute('data-open'); doc.body.classList.remove('no-scroll'); toggle.setAttribute('aria-expanded', 'false'); } });
    doc.addEventListener('keydown', function (e) {
      if (!sheet.hasAttribute('data-open')) return;
      if (e.key === 'Escape') { openMenu(false); return; }
      if (e.key !== 'Tab') return;
      var f = focusable(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches && sheet.hasAttribute('data-open')) openMenu(false); });
  }

  /* ---- Phone action bar: only once the hero button has left the screen, never beside the same action ---- */
  var bar = doc.querySelector('[data-actionbar]');
  if (bar && 'IntersectionObserver' in window) {
    var seen = new Map();
    var update = function () {
      var anyVisible = false;
      seen.forEach(function (v) { if (v) anyVisible = true; });
      if (anyVisible) bar.removeAttribute('data-on'); else bar.setAttribute('data-on', '');
    };
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen.set(en.target, en.isIntersecting); });
      update();
    });
    doc.querySelectorAll('[data-bar-hide]').forEach(function (el) { seen.set(el, true); io.observe(el); });
  }

  /* ---- Type moment: a statement whose words settle from soft to full as it scrolls through ----
     Opacity only, no layout change. Reduced motion or no JS: the text simply reads in full. */
  var st = doc.querySelector('[data-hl]');
  if (st && !reduce.matches) {
    var words = [];
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = doc.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
            var s = doc.createElement('span'); s.className = 'w'; s.textContent = p; frag.appendChild(s); words.push(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(st);
    st.setAttribute('data-hl-on', '');
    var ticking = false, lit = -1;
    var paint = function () {
      ticking = false;
      var r = st.getBoundingClientRect(), vh = window.innerHeight;
      var p = (vh * 0.82 - r.top) / (vh * 0.42 + r.height * 0.5);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * words.length);
      if (n === lit) return;
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('is-lit', i < n);
      lit = n;
    };
    var onScroll = function () { if (!ticking) { ticking = true; requestAnimationFrame(paint); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    paint();
    reduce.addEventListener('change', function () { if (reduce.matches) { st.removeAttribute('data-hl-on'); } else { st.setAttribute('data-hl-on', ''); paint(); } });
  }
})();
