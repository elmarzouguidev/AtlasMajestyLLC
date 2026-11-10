/* ============================================================
   Atlas Majesty LLC — Main JavaScript
   Navigation, Mobile Menu, Scroll Animations, UX

   Note: dropdown menus, focus trapping, scroll locking, touch
   gestures and press feedback live in js/interactions.js.
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  const prefersReducedMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Single rAF-batched scroll pass shared by everything below. */
  const scrollSubscribers = [];
  let scrollQueued = false;

  function onScroll(fn) {
    scrollSubscribers.push(fn);
    fn(window.scrollY);
  }

  window.addEventListener('scroll', function () {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () {
      const y = window.scrollY;
      scrollSubscribers.forEach(function (fn) { fn(y); });
      scrollQueued = false;
    });
  }, { passive: true });

  /* ============================================================
     1. Sticky Navigation
     ============================================================ */
  const nav = document.getElementById('site-nav');
  if (nav) {
    const scrollThreshold = 20;
    onScroll(function (y) {
      nav.classList.toggle('nav--scrolled', y > scrollThreshold);
    });
  }

  /* ============================================================
     2. Mobile Menu Toggle
     ============================================================ */
  const menuToggle  = document.getElementById('menu-toggle');
  const mobileMenu  = document.getElementById('mobile-menu');
  const menuOverlay = document.getElementById('menu-overlay');
  const menuClose   = document.getElementById('menu-close');
  const body = document.body;

  function menuIsOpen() {
    return !!mobileMenu && mobileMenu.classList.contains('is-open');
  }

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    if (menuOverlay) menuOverlay.classList.add('is-visible');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Close navigation menu');
    }
    // interactions.js applies the full position-fixed scroll lock;
    // this is the fallback if that script fails to load.
    body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    if (menuOverlay) menuOverlay.classList.remove('is-visible');
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation menu');
    }
    body.style.overflow = '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      menuIsOpen() ? closeMenu() : openMenu();
    });
  }

  if (menuClose)   menuClose.addEventListener('click', closeMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);

  // Close after tapping a link in the drawer.
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  // Escape closes the drawer — only when it is actually open, so it
  // does not swallow Escape from dropdowns or form fields.
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuIsOpen()) closeMenu();
  });

  // Rotating to a wide viewport should not strand an open drawer.
  (function closeMenuOnDesktop() {
    const desktop = window.matchMedia('(min-width: 1025px)');
    const handler = function (e) {
      if (e.matches && menuIsOpen()) closeMenu();
    };
    if (desktop.addEventListener) desktop.addEventListener('change', handler);
    else if (desktop.addListener) desktop.addListener(handler); // Safari < 14
  })();

  /* ============================================================
     3. Active Nav Link Highlighting
     ============================================================ */
  (function activeNav() {
    // Compare full resolved paths — matching only the last segment would
    // make "blog/index.html" light up the Home link on the home page.
    function normalise(pathname) {
      let p = pathname.replace(/\/+$/, '/');
      if (p === '' || p.endsWith('/')) p += 'index.html';
      return p.toLowerCase();
    }

    const here = normalise(window.location.pathname);
    const inBlog = here.indexOf('/blog/') !== -1;

    document.querySelectorAll('.nav-link, .mobile-nav-link, .nav-dropdown-item')
      .forEach(function (link) {
        const href = link.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;

        let linkPath;
        try {
          linkPath = normalise(new URL(href, window.location.href).pathname);
        } catch (err) {
          return;
        }

        // Exact page match, or any article under /blog/ lighting up Blog.
        const match = (linkPath === here) ||
                      (inBlog && linkPath.indexOf('/blog/') !== -1);

        if (match) {
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'page');
        } else {
          // Some pages ship a hard-coded is-active in the markup.
          link.classList.remove('is-active');
          link.removeAttribute('aria-current');
        }
      });
  })();

  /* ============================================================
     4. Scroll-triggered Animations (Intersection Observer)
     ============================================================ */
  const animatedEls = document.querySelectorAll('.animate-on-scroll');

  if (prefersReducedMotion) {
    animatedEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else if (animatedEls.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    animatedEls.forEach(function (el) { observer.observe(el); });
  } else {
    animatedEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ============================================================
     5. FAQ Accordion
     interactions.js adds the keyboard + ARIA layer on top.
     ============================================================ */
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(function (item) {
    const question = item.querySelector('.faq-question');
    const answer   = item.querySelector('.faq-answer');
    if (!question || !answer) return;

    question.addEventListener('click', function () {
      const wasOpen = item.classList.contains('is-open');

      // Single-open accordion: collapse the others first.
      faqItems.forEach(function (other) {
        if (other === item) return;
        other.classList.remove('is-open');
        const otherAnswer = other.querySelector('.faq-answer');
        if (otherAnswer) otherAnswer.style.maxHeight = '0';
      });

      if (wasOpen) {
        item.classList.remove('is-open');
        answer.style.maxHeight = '0';
      } else {
        item.classList.add('is-open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ============================================================
     6. Smooth Scroll for Anchor Links
     ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      // "#" and "#!" are not real targets — leave them alone.
      if (!href || href === '#' || href === '#!') return;

      let target = null;
      try {
        target = document.querySelector(href);
      } catch (err) {
        return; // not a valid selector
      }
      if (!target) return;

      e.preventDefault();

      const navHeight =
        parseInt(getComputedStyle(document.documentElement)
          .getPropertyValue('--nav-height'), 10) || 72;

      const offsetTop = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;

      window.scrollTo({
        top: offsetTop,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      // Move focus so keyboard and screen-reader users land there too.
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });

      if (history.replaceState) history.replaceState(null, '', href);
    });
  });

  /* ============================================================
     7. Back to Top Button
     ============================================================ */
  const backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    onScroll(function (y) {
      backToTop.classList.toggle('is-visible', y > 600);
    });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      // Send focus back to the top of the document, not just the pixels.
      const first = document.querySelector('h1, [tabindex="-1"], main');
      if (first) {
        if (!first.hasAttribute('tabindex')) first.setAttribute('tabindex', '-1');
        first.focus({ preventScroll: true });
      }
    });
  }

  /* ============================================================
     8. Counter Animation (stat numbers)
     Supports data-counter="250" plus optional
     data-counter-suffix="+" and data-counter-prefix="$".
     ============================================================ */
  const counters = document.querySelectorAll('[data-counter]');

  if (counters.length > 0) {
    const runCounter = function (el) {
      const target = parseFloat(el.dataset.counter);
      if (isNaN(target)) return;

      const prefix = el.dataset.counterPrefix || '';
      const suffix = el.dataset.counterSuffix || '';
      const decimals = (String(target).split('.')[1] || '').length;

      if (prefersReducedMotion) {
        el.textContent = prefix + target.toFixed(decimals) + suffix;
        return;
      }

      const duration = 1800;
      const start = performance.now();

      (function step(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        const value = eased * target;

        el.textContent = prefix +
          (decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US')) +
          suffix;

        if (progress < 1) requestAnimationFrame(step);
      })(start);
    };

    if ('IntersectionObserver' in window) {
      const counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          counterObserver.unobserve(entry.target);
        });
      }, { threshold: 0.5 });

      counters.forEach(function (c) { counterObserver.observe(c); });
    } else {
      counters.forEach(runCounter);
    }
  }

  /* ============================================================
     9. Year Auto-Update (footer copyright)
     ============================================================ */
  const yearEl = document.getElementById('copyright-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

});