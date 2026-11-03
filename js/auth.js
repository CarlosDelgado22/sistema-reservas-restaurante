/* ==========================================================================
   Sazón · Autenticación de demostración y permisos por rol
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon = window.Sazon || {};
  const roleKey = 'sazon-session-role';
  const userKey = 'sazon-session-user';
  const accounts = {
    admin: { password: 'admin123', destination: 'admin.html' },
    cocina: { password: 'cocina123', destination: 'cocina.html' }
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
    clearSession: function () {
      window.sessionStorage.removeItem(roleKey);
      window.sessionStorage.removeItem(userKey);
    },
    requireRole: function (requiredRole) {
      let activeRole;
      try {
        activeRole = namespace.auth.getRole();
      } catch (error) {
        window.location.replace('index.html');
        return false;
      }

      if (activeRole === requiredRole) return true;

      if (activeRole === 'admin' || activeRole === 'cocina') {
        window.location.replace(activeRole === 'cocina' ? 'cocina.html' : 'admin.html');
      } else {
        window.location.replace('index.html');
      }
      return false;
    },
    bindLogoutLinks: function () {
      document.querySelectorAll('[data-logout], .logout-link, [data-kitchen-logout]').forEach(function (link) {
        link.addEventListener('click', function () {
          namespace.auth.clearSession();
        });
      });
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
          const message = username === 'mesero' || username === 'despacho'
            ? 'El acceso para este perfil todavía no está disponible.'
            : 'Usuario o contraseña incorrectos.';
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