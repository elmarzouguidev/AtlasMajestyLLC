/* Atlas Majesty LLC — forms.js
   Validates on submit (never while typing), posts to send.php with fetch(),
   shows "sent" only after the server confirms, and puts errors under their fields. */
(function () {
  'use strict';

  var RULES = {
    required: function (v) { return v.trim() !== ''; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
    url: function (v) {
      if (!v.trim()) return true;
      try { return !!new URL(/^https?:\/\//i.test(v.trim()) ? v.trim() : 'https://' + v.trim()).hostname.includes('.'); } catch (e) { return false; }
    },
    phone: function (v) { return !v.trim() || /^[\d\s\-+().]{7,20}$/.test(v.trim()); }
  };
  var MESSAGES = {
    required: function (l) { return 'Enter ' + l + '.'; },
    email: function () { return 'Write an email address with an @, like name@company.com.'; },
    url: function () { return 'Write a web address, like https://yourbusiness.com.'; },
    phone: function () { return 'Use digits only, for example 505 555 0100.'; }
  };

  function label(field) {
    var l = field.id && field.form.querySelector('label[for="' + field.id + '"]');
    var t = l ? l.textContent.replace(/[*()]|optional/gi, '').trim().toLowerCase() : 'this field';
    return 'your ' + t.replace(/^your\s+/, '').replace(/\burl\b/, 'URL');
  }
  function errorEl(field) {
    var wrap = field.parentElement;
    return wrap.querySelector('.field__error, .form-error');
  }
  function setError(field, msg) {
    var el = errorEl(field);
    field.setAttribute('aria-invalid', 'true');
    field.classList.add('is-error');
    if (el) el.textContent = msg;
  }
  function clearError(field) {
    var el = errorEl(field);
    field.removeAttribute('aria-invalid');
    field.classList.remove('is-error');
    if (el) el.textContent = '';
  }
  function check(field) {
    var rule = field.getAttribute('data-validate');
    var v = field.value;
    if (field.required && !RULES.required(v)) return MESSAGES.required(label(field));
    if (rule && rule !== 'required' && RULES[rule] && v.trim() !== '' && !RULES[rule](v)) return MESSAGES[rule]();
    return '';
  }

  function statusEl(form) {
    var s = form.querySelector('[data-form-status]');
    if (!s) {
      s = document.createElement('p');
      s.className = 'form__status';
      s.setAttribute('role', 'status');
      s.setAttribute('data-form-status', '');
      var btn = form.querySelector('[type="submit"]');
      btn.parentNode.insertBefore(s, btn.nextSibling);
    }
    return s;
  }
  function say(form, text, state) {
    var s = statusEl(form);
    s.textContent = text;
    if (state) s.setAttribute('data-state', state); else s.removeAttribute('data-state');
  }

  function init(form) {
    form.noValidate = true;
    var busy = false;

    form.addEventListener('input', function (e) { if (e.target.getAttribute && e.target.getAttribute('aria-invalid')) clearError(e.target); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) return;

      var fields = form.querySelectorAll('input:not([type="hidden"]):not([name="company_url"]), select, textarea');
      var first = null, count = 0;
      fields.forEach(function (f) {
        var msg = check(f);
        if (msg) { setError(f, msg); count++; if (!first) first = f; } else clearError(f);
      });
      if (count) {
        say(form, count === 1 ? 'One field needs attention.' : count + ' fields need attention.', 'error');
        first.focus();
        return;
      }

      var btn = form.querySelector('[type="submit"]');
      var data = new FormData(form);
      data.append('form', form.getAttribute('data-form') || 'contact');
      busy = true;
      btn.disabled = true;
      var slow = setTimeout(function () { say(form, 'Sending…', ''); }, 300);

      fetch(form.getAttribute('action') || 'send.php', { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, body: j }; }); })
        .then(function (res) {
          clearTimeout(slow);
          if (res.status >= 200 && res.status < 300 && res.body && res.body.ok === true) {
            say(form, statusEl(form).getAttribute('data-sent') || 'Your message was sent. We will be in touch shortly.', 'sent');
            form.reset();
            return;
          }
          var errs = (res.body && res.body.errors) || {};
          var firstBad = null;
          Object.keys(errs).forEach(function (name) {
            var f = form.querySelector('[name="' + name + '"]');
            if (f) { setError(f, errs[name]); if (!firstBad) firstBad = f; }
          });
          say(form, (res.body && res.body.message) || 'We could not send your request. Please try again, or email support@atlasmajesty.com.', 'error');
          if (firstBad) firstBad.focus();
        })
        .catch(function () {
          clearTimeout(slow);
          say(form, 'We could not reach the server. Your answers are still here. Please try again, or email support@atlasmajesty.com.', 'error');
        })
        .then(function () { busy = false; btn.disabled = false; });
    });
  }

  document.querySelectorAll('form[data-form]').forEach(init);
})();
