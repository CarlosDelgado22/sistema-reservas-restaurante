/* ==========================================================================
   Sazón · Controlador principal de la aplicación
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon;
  const form = document.getElementById('login-form');
  const loginPage = document.getElementById('loginView');
  const appShell = document.getElementById('appView');
  const supportedRoles = ['admin', 'mesero', 'cocina', 'despacho'];
  const roleNames = {
    admin: 'Administrador',
    mesero: 'Mesero',
    cocina: 'Cocina',
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

  function showLoginFeedback(message) {
    const feedback = document.getElementById('login-feedback');
    if (!feedback) return;
    feedback.textContent = message;
    feedback.hidden = !message;
  }

  function startApplication(googleUser) {
    if (!appShell) return;
    const role = namespace.auth.getRole();
    if (!supportedRoles.includes(role)) {
      namespace.auth.clearSession();
      appShell.hidden = true;
      if (loginPage) loginPage.hidden = false;
      document.body.className = 'auth-body';
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
      namespace.modules.initAdmin();
      namespace.modules.initDispatches();
      namespace.modules.initDashboard();
      initialized = true;
    }

    const roleLabel = document.querySelector('.role-label');
    if (roleLabel) roleLabel.textContent = roleNames[role];
    const userName = document.getElementById('userNameDisplay');
    if (userName) {
      userName.textContent = googleUser
        ? `${googleUser.name} (${roleNames[role]})`
        : namespace.auth.getUser() || roleNames[role];
    }
    const userButton = document.querySelector('.user-button');
    if (userButton) userButton.setAttribute('aria-label', `Cuenta de ${roleNames[role]}`);
  }

  function startGoogleApplication(googleUser) {
    const userWithRole = asignarRolUsuario(googleUser);
    if (!supportedRoles.includes(userWithRole.rol)) {
      window.GoogleAuth.logout();
      showLoginFeedback('Esta cuenta de Google no tiene un rol autorizado para el sistema.');
      return;
    }

    try {
      namespace.auth.setSession(userWithRole.rol, userWithRole.email, 'google');
      if (userWithRole.idToken) {
        window.GoogleAuth.saveSession(userWithRole.idToken);
      }
    } catch (error) {
      namespace.auth.clearSession();
      window.GoogleAuth.logout();
      showLoginFeedback('No se pudo guardar la sesión en este navegador.');
      return;
    }

    showLoginFeedback('');
    startApplication(userWithRole);
  }

  async function initializeGoogleLogin() {
    if (!window.GoogleAuth) {
      showLoginFeedback('No se pudo inicializar el inicio de sesión con Google.');
      return;
    }

    try {
      const previousUser = await window.GoogleAuth.restoreSession();
      if (previousUser) {
        startGoogleApplication(previousUser);
        return;
      }

      await window.GoogleAuth.init({
        buttonContainerId: 'googleSignInDiv',
        onSuccess: startGoogleApplication,
        onError: showLoginFeedback
      });
    } catch (error) {
      showLoginFeedback(error instanceof Error
        ? error.message
        : 'No se pudo restaurar la sesión de Google.');
    }
  }

  function initialize() {
    document.addEventListener('sazon:login', function () {
      showLoginFeedback('');
      startApplication();
    });

    if (form) namespace.auth.initLogin();

    const logoutButton = document.getElementById('logoutBtn');
    if (logoutButton) {
      logoutButton.addEventListener('click', function () {
        namespace.auth.clearSession();
        window.GoogleAuth.logout();
        window.location.reload();
      });
    }

    initializeSession();
  }

  async function initializeSession() {
    if (window.GoogleAuth.hasSession()) {
      try {
        const previousUser = await window.GoogleAuth.restoreSession();
        if (previousUser) {
          startGoogleApplication(previousUser);
          return;
        }
      } catch (error) {
        showLoginFeedback(error instanceof Error
          ? error.message
          : 'No se pudo restaurar la sesión de Google.');
      }

      namespace.auth.clearSession();
      await initializeGoogleLogin();
      return;
    }

    const role = namespace.auth.getRole();
    if (namespace.auth.isSessionTrusted() && supportedRoles.includes(role)) {
      startApplication();
      return;
    }

    if (role) namespace.auth.clearSession();
    await initializeGoogleLogin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
