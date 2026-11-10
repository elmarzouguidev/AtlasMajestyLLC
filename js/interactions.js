/* ============================================================
   Atlas Majesty LLC — Interactions
   ------------------------------------------------------------
   Shared interaction layer for BOTH touch and pointer devices.
   Loaded after main.js on every page.

     1.  Device / motion capability flags
     2.  Scroll progress bar
     3.  Nav auto-hide on scroll (mobile)
     4.  Accessible dropdown menus (click + hover + keyboard)
     5.  Mobile menu: focus trap, scroll lock, swipe-to-close
     6.  Accessible FAQ accordion (keyboard + resize safe)
     7.  Reveal-on-scroll with reduced-motion support
     8.  Button press feedback / ripple
     9.  Card tilt + spotlight (pointer devices only)
    10.  Scrollspy for in-page anchor navs
    11.  Horizontal scroll affordance for wide blocks
    12.  Copy-to-clipboard for phone / email links
    13.  Lazy-load + fade-in for images
    14.  Keyboard-vs-mouse focus styling
   ============================================================ */

'use strict';

(function () {

  /* ============================================================
     1. Capability flags
     ============================================================ */
  const motionQuery  = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hoverQuery   = window.matchMedia('(hover: hover) and (pointer: fine)');
  const desktopQuery = window.matchMedia('(min-width: 1025px)');

  let reduceMotion = motionQuery.matches;
  let canHover     = hoverQuery.matches;

  const root = document.documentElement;
  root.classList.toggle('has-hover', canHover);
  root.classList.toggle('is-touch', !canHover);
  root.classList.toggle('reduce-motion', reduceMotion);
  root.classList.add('js-enabled');

  function onMQ(mq, fn) {
    if (mq.addEventListener) mq.addEventListener('change', fn);
    else if (mq.addListener) mq.addListener(fn); // Safari < 14
  }

  onMQ(motionQuery, function (e) {
    reduceMotion = e.matches;
    root.classList.toggle('reduce-motion', reduceMotion);
  });

  onMQ(hoverQuery, function (e) {
    canHover = e.matches;
    root.classList.toggle('has-hover', canHover);
    root.classList.toggle('is-touch', !canHover);
  });

  /* Batch scroll work into one rAF pass shared by every listener. */
  const scrollHandlers = [];
  let scrollTicking = false;

  function onScroll(fn) {
    scrollHandlers.push(fn);
  }

  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      const y = window.scrollY || window.pageYOffset;
      scrollHandlers.forEach(function (fn) { fn(y); });
      scrollTicking = false;
    });
  }, { passive: true });

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {

    /* ============================================================
       2. Scroll progress bar
       ============================================================ */
    (function scrollProgress() {
      const bar = document.createElement('div');
      bar.className = 'scroll-progress';
      bar.setAttribute('role', 'presentation');
      bar.innerHTML = '<span class="scroll-progress-fill"></span>';
      document.body.appendChild(bar);

      const fill = bar.firstChild;

      function update() {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        fill.style.transform = 'scaleX(' + (Math.max(0, Math.min(100, pct)) / 100) + ')';
      }

      onScroll(update);
      window.addEventListener('resize', update, { passive: true });
      update();
    })();

    /* ============================================================
       3. Nav auto-hide on scroll down (small screens only)
       Keeps the viewport usable on phones without losing the nav.
       ============================================================ */
    (function autoHideNav() {
      const nav = document.getElementById('site-nav');
      if (!nav) return;

      let lastY = window.scrollY;

      onScroll(function (y) {
        // Never hide the nav on desktop, while the menu is open, or near the top.
        const menuOpen = document.getElementById('mobile-menu');
        if (desktopQuery.matches || (menuOpen && menuOpen.classList.contains('is-open'))) {
          nav.classList.remove('nav--hidden');
          lastY = y;
          return;
        }

        if (y < 120) {
          nav.classList.remove('nav--hidden');
        } else if (y > lastY + 8) {
          nav.classList.add('nav--hidden');      // scrolling down
        } else if (y < lastY - 8) {
          nav.classList.remove('nav--hidden');   // scrolling up
        }
        lastY = y;
      });
    })();

    /* ============================================================
       4. Accessible dropdown menus
       Replaces the hover-only behaviour: works with click, hover,
       touch, and full keyboard navigation.
       ============================================================ */
    (function dropdowns() {
      const triggers = document.querySelectorAll('.nav-dropdown-trigger');

      triggers.forEach(function (trigger) {
        const wrapper  = trigger.parentElement;
        const dropdown = trigger.nextElementSibling;
        if (!wrapper || !dropdown || !dropdown.classList.contains('nav-dropdown')) return;

        const items = Array.prototype.slice.call(
          dropdown.querySelectorAll('.nav-dropdown-item')
        );
        let closeTimer;

        function open(focusFirst) {
          clearTimeout(closeTimer);
          closeAllExcept(dropdown);
          dropdown.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
          // The panel is visibility:hidden until the class lands, and
          // focus() is a no-op on a still-hidden element. Force a style
          // flush so the new visibility is computed before focusing,
          // then retry once on the next frame as a safety net.
          if (focusFirst && items.length) {
            void dropdown.offsetHeight;
            items[0].focus();
            if (document.activeElement !== items[0]) {
              requestAnimationFrame(function () { items[0].focus(); });
            }
          }
        }

        function close(returnFocus) {
          clearTimeout(closeTimer);
          dropdown.classList.remove('is-open');
          trigger.setAttribute('aria-expanded', 'false');
          if (returnFocus) trigger.focus();
        }

        function isOpen() {
          return dropdown.classList.contains('is-open');
        }

        // Pointer devices: hover to open, small delay before closing.
        wrapper.addEventListener('mouseenter', function () {
          if (canHover) open(false);
        });

        wrapper.addEventListener('mouseleave', function () {
          if (!canHover) return;
          closeTimer = setTimeout(function () { close(false); }, 180);
        });

        // Click / tap.
        // On touch this is the only way in, so it toggles.
        // On a mouse the panel is usually already open from hover, and
        // toggling there would make a click feel like it dismissed the
        // menu the user was aiming at — so a click only ever opens, and
        // mouseleave / Escape / outside-click do the closing.
        trigger.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (canHover) open(false);
          else isOpen() ? close(false) : open(false);
        });

        // Keyboard on the trigger.
        trigger.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            open(true);
          } else if (e.key === 'Escape' && isOpen()) {
            e.preventDefault();
            close(true);
          }
        });

        // Roving arrow-key navigation inside the dropdown.
        items.forEach(function (item, i) {
          item.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              items[(i + 1) % items.length].focus();
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              items[(i - 1 + items.length) % items.length].focus();
            } else if (e.key === 'Home') {
              e.preventDefault();
              items[0].focus();
            } else if (e.key === 'End') {
              e.preventDefault();
              items[items.length - 1].focus();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              close(true);
            } else if (e.key === 'Tab' && !e.shiftKey && i === items.length - 1) {
              close(false); // tabbing out of the last item closes the menu
            }
          });
        });
      });

      function closeAllExcept(keep) {
        document.querySelectorAll('.nav-dropdown.is-open').forEach(function (d) {
          if (d === keep) return;
          d.classList.remove('is-open');
          const t = d.previousElementSibling;
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      }

      document.addEventListener('click', function (e) {
        document.querySelectorAll('.nav-dropdown.is-open').forEach(function (d) {
          if (d.parentElement && d.parentElement.contains(e.target)) return;
          d.classList.remove('is-open');
          const t = d.previousElementSibling;
          if (t) t.setAttribute('aria-expanded', 'false');
        });
      });
    })();

    /* ============================================================
       5. Mobile menu — focus trap, scroll lock, swipe to close
       main.js handles the basic open/close; this hardens it.
       ============================================================ */
    (function mobileMenu() {
      const menu    = document.getElementById('mobile-menu');
      const toggle  = document.getElementById('menu-toggle');
      const overlay = document.getElementById('menu-overlay');
      if (!menu) return;

      let lastFocused = null;
      let savedScrollY = 0;

      function focusables() {
        return Array.prototype.slice.call(
          menu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
        ).filter(function (el) { return el.offsetParent !== null; });
      }

      /* Position-fixed scroll lock: prevents the background from
         scrolling on iOS, and restores the exact scroll position. */
      function lockScroll() {
        savedScrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = -savedScrollY + 'px';
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
      }

      function unlockScroll() {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, savedScrollY);
      }

      // React to the class main.js toggles, so both stay in sync.
      const observer = new MutationObserver(function () {
        const open = menu.classList.contains('is-open');

        if (open) {
          lastFocused = document.activeElement;
          lockScroll();
          menu.removeAttribute('inert');
          menu.setAttribute('aria-hidden', 'false');
          const f = focusables();
          if (f.length) setTimeout(function () { f[0].focus(); }, 60);
        } else {
          unlockScroll();
          menu.setAttribute('aria-hidden', 'true');
          if (lastFocused && document.contains(lastFocused)) {
            lastFocused.focus();
          } else if (toggle) {
            toggle.focus();
          }
          lastFocused = null;
        }
      });

      observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
      menu.setAttribute('aria-hidden', menu.classList.contains('is-open') ? 'false' : 'true');

      // Trap Tab inside the drawer while it is open.
      menu.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab' || !menu.classList.contains('is-open')) return;
        const f = focusables();
        if (!f.length) return;

        const first = f[0];
        const last  = f[f.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      });

      // Swipe right to close (the drawer slides in from the right).
      let swipeStartX = 0, swipeStartY = 0, swiping = false;

      menu.addEventListener('touchstart', function (e) {
        if (!menu.classList.contains('is-open')) return;
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
        swiping = true;
      }, { passive: true });

      menu.addEventListener('touchmove', function (e) {
        if (!swiping) return;
        const dx = e.touches[0].clientX - swipeStartX;
        const dy = e.touches[0].clientY - swipeStartY;
        if (Math.abs(dy) > Math.abs(dx)) { swiping = false; return; } // vertical scroll
        if (dx > 0) menu.style.transform = 'translateX(' + dx + 'px)';
      }, { passive: true });

      menu.addEventListener('touchend', function (e) {
        if (!swiping) return;
        swiping = false;
        const dx = (e.changedTouches[0] || {}).clientX - swipeStartX;
        menu.style.transform = '';
        if (dx > 80) {
          const close = document.getElementById('menu-close');
          if (close) close.click();
          else menu.classList.remove('is-open');
          if (overlay) overlay.classList.remove('is-visible');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
      });

      /* Mobile menu section headers collapse/expand on small screens
         so long service lists do not push the CTA off-screen. */
      document.querySelectorAll('.mobile-nav-section').forEach(function (section, i) {
        const label = section.querySelector('.mobile-nav-section-label');
        if (!label) return;

        const links = Array.prototype.slice.call(section.querySelectorAll('.mobile-nav-link'));
        if (links.length < 4) return; // short lists stay open

        const panelId = 'mobile-nav-panel-' + i;
        const panel = document.createElement('div');
        panel.className = 'mobile-nav-panel';
        panel.id = panelId;
        links.forEach(function (l) { panel.appendChild(l); });
        section.appendChild(panel);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mobile-nav-section-toggle';
        btn.setAttribute('aria-expanded', 'true');
        btn.setAttribute('aria-controls', panelId);
        btn.innerHTML = label.innerHTML +
          '<span class="mobile-nav-chevron" aria-hidden="true">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">' +
          '<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>' +
          '</svg></span>';

        label.parentNode.replaceChild(btn, label);
        panel.style.maxHeight = panel.scrollHeight + 'px';

        btn.addEventListener('click', function () {
          const expanded = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
          section.classList.toggle('is-collapsed', expanded);
          panel.style.maxHeight = expanded ? '0px' : panel.scrollHeight + 'px';
        });
      });
    })();

    /* ============================================================
       6. Accessible FAQ accordion
       The markup uses divs, so give them real button semantics and
       recompute heights when the viewport reflows.
       ============================================================ */
    (function faq() {
      const items = Array.prototype.slice.call(document.querySelectorAll('.faq-item'));
      if (!items.length) return;

      items.forEach(function (item, i) {
        const question = item.querySelector('.faq-question');
        const answer   = item.querySelector('.faq-answer');
        if (!question || !answer) return;

        const answerId = answer.id || ('faq-answer-' + i);
        answer.id = answerId;

        // Only add semantics if the markup is not already a <button>.
        if (question.tagName !== 'BUTTON') {
          question.setAttribute('role', 'button');
          question.setAttribute('tabindex', '0');
        }
        question.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');
        question.setAttribute('aria-controls', answerId);
        answer.setAttribute('role', 'region');
        answer.setAttribute('aria-labelledby', question.id || (question.id = 'faq-question-' + i));

        // Keyboard activation — main.js already binds the click handler.
        question.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            question.click();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = items[(i + 1) % items.length].querySelector('.faq-question');
            if (next) next.focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = items[(i - 1 + items.length) % items.length].querySelector('.faq-question');
            if (prev) prev.focus();
          }
        });

        // Keep aria-expanded in sync with the class main.js toggles.
        new MutationObserver(function () {
          question.setAttribute('aria-expanded', item.classList.contains('is-open') ? 'true' : 'false');
        }).observe(item, { attributes: true, attributeFilter: ['class'] });
      });

      // Text reflows at different widths, so open panels need new heights.
      let faqResizeTimer;
      window.addEventListener('resize', function () {
        clearTimeout(faqResizeTimer);
        faqResizeTimer = setTimeout(function () {
          items.forEach(function (item) {
            if (!item.classList.contains('is-open')) return;
            const answer = item.querySelector('.faq-answer');
            if (!answer) return;
            answer.style.maxHeight = 'none';
            const h = answer.scrollHeight;
            answer.style.maxHeight = h + 'px';
          });
        }, 150);
      }, { passive: true });

      // Deep-link support: #faq-3 opens that question.
      if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        const owner = target && target.closest ? target.closest('.faq-item') : null;
        if (owner && !owner.classList.contains('is-open')) {
          const q = owner.querySelector('.faq-question');
          if (q) setTimeout(function () { q.click(); }, 300);
        }
      }
    })();

    /* ============================================================
       7. Reveal-on-scroll — honour reduced motion
       main.js runs the observer; this makes sure nobody who asked
       for less motion ends up with hidden content.
       ============================================================ */
    (function reveal() {
      if (!reduceMotion) return;
      document.querySelectorAll('.animate-on-scroll').forEach(function (el) {
        el.classList.add('is-visible');
      });
    })();

    /* ============================================================
       8. Button press feedback + ripple
       Touch devices get no :hover, so they need a press state.
       ============================================================ */
    (function pressFeedback() {
      const selector = '.btn, .card--interactive, .service-card, .pricing-card';

      document.addEventListener('pointerdown', function (e) {
        const el = e.target.closest ? e.target.closest(selector) : null;
        if (!el) return;

        el.classList.add('is-pressed');

        if (!reduceMotion && el.classList.contains('btn')) {
          const rect = el.getBoundingClientRect();
          const ripple = document.createElement('span');
          const size = Math.max(rect.width, rect.height);
          ripple.className = 'btn-ripple';
          ripple.style.width = ripple.style.height = size + 'px';
          ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
          ripple.style.top  = (e.clientY - rect.top  - size / 2) + 'px';
          el.appendChild(ripple);
          setTimeout(function () { ripple.remove(); }, 620);
        }
      }, { passive: true });

      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (evt) {
        document.addEventListener(evt, function (e) {
          const el = e.target.closest ? e.target.closest(selector) : null;
          if (el) el.classList.remove('is-pressed');
          // Safety net for pointers released outside the element.
          document.querySelectorAll('.is-pressed').forEach(function (p) {
            p.classList.remove('is-pressed');
          });
        }, { passive: true });
      });
    })();

    /* ============================================================
       9. Card tilt + cursor spotlight — pointer devices only
       ============================================================ */
    (function cardTilt() {
      if (!canHover || reduceMotion) return;

      const cards = document.querySelectorAll(
        '.service-card, .testimonial-card, .blog-card, .value-card, .feature-card'
      );

      cards.forEach(function (card) {
        card.classList.add('has-tilt');
        let raf = null;

        card.addEventListener('pointermove', function (e) {
          if (raf) return;
          raf = requestAnimationFrame(function () {
            raf = null;
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;

            // Small angles only — enough to feel alive, not enough to distract.
            card.style.setProperty('--tilt-x', ((0.5 - py) * 5).toFixed(2) + 'deg');
            card.style.setProperty('--tilt-y', ((px - 0.5) * 5).toFixed(2) + 'deg');
            card.style.setProperty('--spot-x', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--spot-y', (py * 100).toFixed(1) + '%');
          });
        });

        card.addEventListener('pointerleave', function () {
          card.style.setProperty('--tilt-x', '0deg');
          card.style.setProperty('--tilt-y', '0deg');
        });
      });
    })();

    /* ============================================================
       10. Scrollspy for in-page section navs
       ============================================================ */
    (function scrollspy() {
      const links = Array.prototype.slice.call(
        document.querySelectorAll('.toc-link, .section-nav a, [data-scrollspy] a')
      ).filter(function (a) {
        const h = a.getAttribute('href') || '';
        return h.charAt(0) === '#' && h.length > 1;
      });

      if (!links.length || !('IntersectionObserver' in window)) return;

      const map = new Map();
      links.forEach(function (link) {
        const section = document.querySelector(link.getAttribute('href'));
        if (section) map.set(section, link);
      });
      if (!map.size) return;

      const spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          const link = map.get(entry.target);
          if (!link) return;
          if (entry.isIntersecting) {
            links.forEach(function (l) { l.classList.remove('is-current'); });
            link.classList.add('is-current');
          }
        });
      }, { rootMargin: '-25% 0px -60% 0px', threshold: 0 });

      map.forEach(function (link, section) { spy.observe(section); });
    })();

    /* ============================================================
       11. Horizontal scroll affordance for wide blocks
       Tables and code blocks get a fading edge + drag-to-scroll.
       ============================================================ */
    (function scrollableBlocks() {
      const blocks = document.querySelectorAll('table, .table-wrap, pre, .scroll-x');

      blocks.forEach(function (block) {
        const el = (block.tagName === 'TABLE' && !block.parentElement.classList.contains('table-wrap'))
          ? wrapTable(block)
          : block;

        el.classList.add('scroll-x');

        function update() {
          const overflow = el.scrollWidth - el.clientWidth;
          el.classList.toggle('can-scroll', overflow > 4);
          el.classList.toggle('at-start', el.scrollLeft <= 2);
          el.classList.toggle('at-end', el.scrollLeft >= overflow - 2);
        }

        el.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update, { passive: true });
        update();
      });

      function wrapTable(table) {
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap';
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('role', 'region');
        wrap.setAttribute('aria-label', 'Scrollable table');
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
        return wrap;
      }
    })();

    /* ============================================================
       12. Copy-to-clipboard for phone / email links
       Desktop users cannot "tap to call" — give them copy instead.
       ============================================================ */
    (function copyContact() {
      if (!navigator.clipboard) return;

      document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]').forEach(function (link) {
        // On touch devices the native mailto:/tel: action is the right one.
        if (!canHover) return;

        const value = link.getAttribute('href').replace(/^(mailto:|tel:)/, '');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-btn';
        btn.setAttribute('aria-label', 'Copy ' + value + ' to clipboard');
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" ' +
          'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>' +
          '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(value).then(function () {
            btn.classList.add('is-copied');
            announce(value + ' copied to clipboard');
            setTimeout(function () { btn.classList.remove('is-copied'); }, 1800);
          }).catch(function () {
            announce('Could not copy automatically. Please copy manually.');
          });
        });

        link.insertAdjacentElement('afterend', btn);
      });
    })();

    /* Shared polite live region for status messages. */
    let liveRegion;
    function announce(message) {
      if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.className = 'sr-only';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        document.body.appendChild(liveRegion);
      }
      liveRegion.textContent = '';
      setTimeout(function () { liveRegion.textContent = message; }, 40);
    }

    /* ============================================================
       13. Lazy-load + fade-in for images
       ============================================================ */
    (function images() {
      document.querySelectorAll('img').forEach(function (img) {
        // Never lazy-load above-the-fold imagery — it delays LCP.
        const aboveFold = img.getBoundingClientRect().top < window.innerHeight;

        if (!img.hasAttribute('loading')) {
          img.setAttribute('loading', aboveFold ? 'eager' : 'lazy');
        }
        if (!img.hasAttribute('decoding')) {
          img.setAttribute('decoding', 'async');
        }
        if (aboveFold) img.setAttribute('fetchpriority', 'high');

        if (reduceMotion) return;

        img.classList.add('img-fade');
        if (img.complete && img.naturalWidth > 0) {
          img.classList.add('is-loaded');
        } else {
          img.addEventListener('load', function () { img.classList.add('is-loaded'); });
          img.addEventListener('error', function () { img.classList.add('is-loaded'); });
        }
      });
    })();

    /* ============================================================
       14. Keyboard-vs-mouse focus styling
       Focus rings show for keyboard users, stay out of the way for
       mouse users. (Native :focus-visible is the fallback in CSS.)
       ============================================================ */
    (function focusMode() {
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') root.classList.add('using-keyboard');
      });
      document.addEventListener('pointerdown', function () {
        root.classList.remove('using-keyboard');
      }, { passive: true });
    })();

  });

})();