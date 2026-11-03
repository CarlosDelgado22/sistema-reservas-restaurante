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

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const username = usernameInput.value.trim().toLocaleLowerCase('es');
      const password = passwordInput.value;
      const feedback = document.getElementById('login-feedback');
      const demoAccounts = {
        admin: { password: 'admin123', destination: 'admin.html' },
        cocina: { password: 'cocina123', destination: 'cocina.html' }
      };
      const account = demoAccounts[username];

      if (!account || account.password !== password) {
        if (feedback) {
          feedback.textContent = username === 'mesero' || username === 'despacho'
            ? 'El acceso para este perfil todavía no está disponible.'
            : 'Usuario o contraseña incorrectos.';
          feedback.hidden = false;
        }
        passwordInput.focus();
        return;
      }

      try {
        window.sessionStorage.setItem('sazon-session-role', username);
        window.sessionStorage.setItem('sazon-session-user', username);
      } catch (error) {
        if (feedback) {
          feedback.textContent = 'No se pudo iniciar la sesión en este navegador.';
          feedback.hidden = false;
        }
        return;
      }

      window.location.assign(account.destination);
    });
  }
})();
