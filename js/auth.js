/* ==========================================================================
   Sazón · Autenticación de demostración y permisos por rol
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon = window.Sazon || {};
  const roleKey = 'sazon-session-role';
  const userKey = 'sazon-session-user';
  const permissions = {
    admin: ['panel', 'tables', 'reservations', 'orders', 'kitchen', 'dispatches', 'users'],
    mesero: ['panel', 'tables', 'reservations', 'orders'],
    cocina: ['panel', 'kitchen'],
    despacho: ['panel', 'dispatches']
  };
  const accounts = {
    admin: { password: 'admin123', destination: 'index.html' },
    cocina: { password: 'cocina123', destination: 'index.html' },
    mesero: { password: 'mesero123', destination: 'index.html' },
    despacho: { password: 'despacho123', destination: 'index.html' }
  };

  function showFeedback(message) {
    const feedback = document.getElementById('login-feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.hidden = !message;
  }

  namespace.auth = {
    getRole: function () {
      return window.sessionStorage.getItem(roleKey);
    },
    getUser: function () {
      return window.sessionStorage.getItem(userKey);
    },
    hasPermission: function (moduleName) {
      const activePermissions = permissions[namespace.auth.getRole()] || [];
      return activePermissions.includes(moduleName);
    },
    clearSession: function () {
      window.sessionStorage.removeItem(roleKey);
      window.sessionStorage.removeItem(userKey);
    },
    initLogin: function () {
      const form = document.getElementById('login-form');
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      if (!form || !usernameInput || !passwordInput) return;

      form.addEventListener('submit', function (event) {
        event.preventDefault();

        const username = usernameInput.value.trim().toLocaleLowerCase('es');
        const account = accounts[username];
        if (!account || account.password !== passwordInput.value) {
          const message = 'Usuario o contraseña incorrectos.';
          showFeedback(message);
          passwordInput.focus();
          return;
        }

        try {
          window.sessionStorage.setItem(roleKey, username);
          window.sessionStorage.setItem(userKey, username);
        } catch (error) {
          showFeedback('No se pudo iniciar la sesión en este navegador.');
          return;
        }

        window.location.assign(account.destination);
      });
    }
  };
})();