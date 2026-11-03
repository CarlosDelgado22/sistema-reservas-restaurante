/* ==========================================================================
   Sazón · Controlador principal
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon;
  const form = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('password-toggle');

  if (passwordInput && passwordToggle) {
    passwordToggle.addEventListener('click', function () {
      const isVisible = passwordInput.type === 'text';

      passwordInput.type = isVisible ? 'password' : 'text';
      passwordToggle.classList.toggle('is-visible', !isVisible);
      passwordToggle.setAttribute('aria-pressed', String(!isVisible));
      passwordToggle.setAttribute(
        'aria-label',
        isVisible ? 'Mostrar contraseña' : 'Ocultar contraseña'
      );
      passwordInput.focus();
    });
  }

  document.querySelectorAll('[data-demo-user]').forEach(function (button) {
    button.addEventListener('click', function () {
      if (!usernameInput || !passwordInput) return;

      usernameInput.value = button.dataset.demoUser;
      passwordInput.value = button.dataset.demoPass;

      const details = button.closest('details');
      if (details) details.open = false;
      passwordInput.focus();
    });
  });

  if (form) {
    namespace.auth.initLogin();
    return;
  }

  if (document.body.classList.contains('kitchen-body')) {
    if (!namespace.auth.requireRole('cocina')) return;
    namespace.auth.bindLogoutLinks();
    namespace.modules.initAdmin();
    namespace.modules.initKitchen();
    return;
  }

  if (document.body.classList.contains('admin-body')) {
    if (!namespace.auth.requireRole('admin')) return;
    namespace.auth.bindLogoutLinks();
    namespace.modules.initAdmin();
  }
})();
