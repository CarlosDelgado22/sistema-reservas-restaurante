/* ==========================================================================
   Sazón · Controlador principal de la aplicación
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon;
  const form = document.getElementById('login-form');
  const loginPage = document.querySelector('.login-page');
  const appShell = document.getElementById('app-shell');
  const supportedRoles = ['admin', 'mesero', 'cocina', 'despacho'];
  const roleNames = {
    admin: 'Administrador',
    mesero: 'Mesero',
    cocina: 'Pedidos / Platos',
    despacho: 'Despacho'
  };
  let initialized = false;

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
      const usernameInput = document.getElementById('username');
      if (!usernameInput || !passwordInput) return;
      usernameInput.value = button.dataset.demoUser;
      passwordInput.value = button.dataset.demoPass;
      const details = button.closest('details');
      if (details) details.open = false;
      passwordInput.focus();
    });
  });

  function startApplication() {
    if (!appShell) return;
    const role = namespace.auth.getRole();
    if (!supportedRoles.includes(role)) {
      namespace.auth.clearSession();
      return;
    }

    if (loginPage) loginPage.hidden = true;
    appShell.hidden = false;
    document.body.className = `admin-body role-${role}`;

    document.querySelectorAll('[data-roles]').forEach(function (element) {
      const moduleName = element.hasAttribute('data-admin-view')
        ? element.id.replace(/-view$/, '')
        : element.dataset.adminViewLink;
      if (moduleName && !namespace.auth.hasPermission(moduleName)) {
        element.hidden = true;
      } else if (!element.hasAttribute('data-admin-view')) {
        element.hidden = false;
      }
    });

    document.querySelectorAll('[data-admin-view]').forEach(function (view) {
      view.hidden = view.id !== 'panel-view';
    });
    document.querySelectorAll('[data-admin-view-link]').forEach(function (link) {
      const active = link.dataset.adminViewLink === 'panel';
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (!initialized) {
      const logoutLinks = document.querySelectorAll('.logout-link');
      logoutLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
          event.preventDefault();
          namespace.auth.clearSession();
          appShell.hidden = true;
          if (loginPage) loginPage.hidden = false;
          document.body.className = 'auth-body';
        });
      });

      namespace.modules.initAdmin();
      namespace.modules.initDispatches();
      namespace.modules.initDashboard();
      initialized = true;
    }

    const roleLabel = document.querySelector('.role-label');
    if (roleLabel) roleLabel.textContent = roleNames[role];
    const userName = document.querySelector('.user-name');
    if (userName) userName.textContent = namespace.auth.getUser() || roleNames[role];
    const userButton = document.querySelector('.user-button');
    if (userButton) userButton.setAttribute('aria-label', `Cuenta de ${roleNames[role]}`);
  }

  document.addEventListener('sazon:login', startApplication);
  if (form) namespace.auth.initLogin();
  if (namespace.auth.getRole()) startApplication();
})();
