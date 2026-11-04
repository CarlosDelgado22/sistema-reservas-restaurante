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
    cocina: 'Cocina',
    despacho: 'Despacho'
  };

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

  if (form) namespace.auth.initLogin();
  if (!appShell) return;

  let role = namespace.auth.getRole();
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

  const roleLabel = document.querySelector('.role-label');
  if (roleLabel) roleLabel.textContent = roleNames[role];
  const userName = document.querySelector('.user-name');
  if (userName) userName.textContent = namespace.auth.getUser() || roleNames[role];
  const userButton = document.querySelector('.user-button');
  if (userButton) userButton.setAttribute('aria-label', `Cuenta de ${roleNames[role]}`);

  document.querySelectorAll('.logout-link, [data-kitchen-logout]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      namespace.auth.clearSession();
      window.location.assign('index.html');
    });
  });

  namespace.modules.initAdmin();
  namespace.modules.initKitchen();
  namespace.modules.initDispatches();
  namespace.modules.initDashboard();
})();
