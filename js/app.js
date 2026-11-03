/* ==========================================================================
   Sazón · Controlador principal
   Por ahora solo contiene la interacción visual del inicio de sesión.
   ========================================================================== */

(function () {
  'use strict';

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

  // Carga las credenciales de demostración en el formulario.
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

  // La autenticación se conectará más adelante.
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
    });
  }
})();
