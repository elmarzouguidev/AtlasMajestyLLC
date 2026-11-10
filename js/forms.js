/* ============================================================
   Atlas Majesty LLC — Forms JavaScript
   Validation, Submission Handling, Error/Success States
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

  /* ============================================================
     Utility: Show field error
     ============================================================ */
  function showError(field, message) {
    field.classList.add('is-error');
    field.classList.remove('is-success');
    const errorEl = field.parentElement.querySelector('.form-error');
    if (errorEl) errorEl.textContent = message;
  }

  function showSuccess(field) {
    field.classList.remove('is-error');
    field.classList.add('is-success');
    const errorEl = field.parentElement.querySelector('.form-error');
    if (errorEl) errorEl.textContent = '';
  }

  function clearField(field) {
    field.classList.remove('is-error', 'is-success');
    const errorEl = field.parentElement.querySelector('.form-error');
    if (errorEl) errorEl.textContent = '';
  }

  /* ============================================================
     Validation Rules
     ============================================================ */
  function validateRequired(value) {
    return value.trim().length > 0;
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function validateURL(value) {
    if (!value.trim()) return true; // Optional
    try {
      const url = new URL(value.startsWith('http') ? value : 'https://' + value);
      return !!url.hostname;
    } catch {
      return false;
    }
  }

  function validatePhone(value) {
    if (!value.trim()) return true; // Optional
    return /^[\d\s\-\+\(\)\.]{7,20}$/.test(value.trim());
  }

  /* ============================================================
     Validate a single field
     ============================================================ */
  function validateField(field) {
    const value = field.value;
    const type = field.dataset.validate;
    const required = field.hasAttribute('required');

    if (required && !validateRequired(value)) {
      showError(field, 'This field is required.');
      return false;
    }

    if (type === 'email' && value.trim() && !validateEmail(value)) {
      showError(field, 'Please enter a valid email address.');
      return false;
    }

    if (type === 'url' && value.trim() && !validateURL(value)) {
      showError(field, 'Please enter a valid website URL.');
      return false;
    }

    if (type === 'phone' && value.trim() && !validatePhone(value)) {
      showError(field, 'Please enter a valid phone number.');
      return false;
    }

    if (value.trim()) showSuccess(field);
    else clearField(field);
    return true;
  }

  /* ============================================================
     Attach real-time validation to all form fields
     ============================================================ */
  document.querySelectorAll('[data-validate]').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('is-error')) validateField(field);
    });
  });

  /* ============================================================
     Handle form submissions
     ============================================================ */
  document.querySelectorAll('form[data-form]').forEach(form => {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Validate all fields
      const fields = form.querySelectorAll('[data-validate]');
      let isValid = true;
      fields.forEach(field => {
        if (!validateField(field)) isValid = false;
      });

      if (!isValid) {
        // Focus first error field
        const firstError = form.querySelector('.is-error');
        if (firstError) firstError.focus();
        return;
      }

      // Disable submit button
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn?.textContent;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      /* --------------------------------------------------------
         NOTE: Replace this section with your actual form handler.
         Options:
           - Formspree:  action="https://formspree.io/f/YOUR_FORM_ID"
           - Netlify:    data-netlify="true"
           - EmailJS:    use emailjs.send()
           - Custom API: fetch('/api/contact', { method: 'POST', body: formData })
         -------------------------------------------------------- */
      try {
        // Simulate async submission (REPLACE with real handler)
        await new Promise(resolve => setTimeout(resolve, 1200));

        // Show success state
        showFormSuccess(form);
      } catch (err) {
        showFormError(form, 'Something went wrong. Please try again or contact us directly.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      }
    });
  });

  function showFormSuccess(form) {
    const successEl = form.querySelector('.form-success-message');
    if (successEl) {
      form.style.display = 'none';
      successEl.classList.add('is-visible');
    } else {
      // Inject a success message
      const msg = document.createElement('div');
      msg.className = 'form-success-inline';
      msg.innerHTML = `
        <div style="text-align:center;padding:2rem;">
          <div style="font-size:3rem;margin-bottom:1rem;">✅</div>
          <h3 style="color:var(--brand-darkest);margin-bottom:0.5rem;">Message Received!</h3>
          <p style="color:var(--color-text-muted);">Thank you for reaching out. We'll be in touch shortly.</p>
        </div>
      `;
      form.parentElement.insertBefore(msg, form.nextSibling);
      form.style.display = 'none';
    }
  }

  function showFormError(form, message) {
    let errorEl = form.querySelector('.form-global-error');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'form-global-error';
      form.insertBefore(errorEl, form.firstChild);
    }
    errorEl.textContent = message;
    errorEl.style.cssText = 'background:#FEF2F2;color:#B91C1C;padding:1rem;border-radius:0.5rem;margin-bottom:1rem;border:1px solid #FECACA;';
  }

});