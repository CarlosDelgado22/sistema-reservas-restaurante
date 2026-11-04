/* ==========================================================================
   Sazón · Autenticación de demostración y permisos por rol
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon = window.Sazon || {};
  const roleKey = 'sazon-session-role';
  const userKey = 'sazon-session-user';
  const sessionSourceKey = 'sazon-session-source';
  const permissions = {
    admin: ['panel', 'tables', 'reservations', 'orders', 'dispatches', 'users'],
    mesero: ['panel', 'tables', 'reservations', 'orders'],
    cocina: ['panel', 'orders'],
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
    isSessionTrusted: function () {
      const source = window.sessionStorage.getItem(sessionSourceKey);
      return source === 'demo' || source === 'google';
    },
    hasPermission: function (moduleName) {
      const activePermissions = permissions[namespace.auth.getRole()] || [];
      return activePermissions.includes(moduleName);
    },
    setSession: function (role, user, source) {
      if (!Object.prototype.hasOwnProperty.call(permissions, role)) {
        throw new Error('El rol de usuario no es válido.');
      }
      if (source !== 'demo' && source !== 'google') {
        throw new Error('El origen de la sesión no es válido.');
      }
      window.sessionStorage.setItem(roleKey, role);
      window.sessionStorage.setItem(userKey, user);
      window.sessionStorage.setItem(sessionSourceKey, source);
    },
    clearSession: function () {
      window.sessionStorage.removeItem(roleKey);
      window.sessionStorage.removeItem(userKey);
      window.sessionStorage.removeItem(sessionSourceKey);
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
          namespace.auth.setSession(username, username, 'demo');
        } catch (error) {
          showFeedback('No se pudo iniciar la sesión en este navegador.');
          return;
        }

        document.dispatchEvent(new CustomEvent('sazon:login'));
      });
    }
  };
})();

window.GoogleAuth = (function () {
  'use strict';

  const config = {
    clientId: 'TU_CLIENT_ID.apps.googleusercontent.com',
    scriptUrl: 'https://accounts.google.com/gsi/client',
    sessionKey: 'sazon-google-session'
  };
  let onSuccess;
  let onError;
  let gisScriptPromise;

  function decodeJwt(token) {
    try {
      const encodedPayload = token.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const paddedPayload = encodedPayload.padEnd(
        encodedPayload.length + ((4 - encodedPayload.length % 4) % 4),
        '='
      );
      const binaryPayload = window.atob(paddedPayload);
      const bytes = Uint8Array.from(binaryPayload, function (character) {
        return character.charCodeAt(0);
      });
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (error) {
      return null;
    }
  }

  function isTokenValid(payload) {
    const now = Math.floor(Date.now() / 1000);
    return Boolean(
      payload &&
      payload.aud === config.clientId &&
      (payload.iss === 'https://accounts.google.com' || payload.iss === 'accounts.google.com') &&
      Number.isFinite(payload.exp) &&
      payload.exp > now &&
      typeof payload.email === 'string' &&
      (payload.email_verified === true || payload.email_verified === 'true')
    );
  }

  async function verifyIdToken(token, payload) {
    let response;
    try {
      response = await window.fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`
      );
    } catch (error) {
      throw new Error('No se pudo verificar la cuenta de Google por un problema de red.');
    }
    if (!response.ok) return false;
    const tokenInfo = await response.json();
    return tokenInfo.aud === config.clientId &&
      tokenInfo.iss === 'https://accounts.google.com' &&
      tokenInfo.email === payload.email &&
      tokenInfo.sub === payload.sub &&
      Number(tokenInfo.exp) > Math.floor(Date.now() / 1000) &&
      (tokenInfo.email_verified === true || tokenInfo.email_verified === 'true');
  }

  function loadGisScript() {
    if (window.google && window.google.accounts && window.google.accounts.id) {
      return Promise.resolve();
    }
    if (gisScriptPromise) return gisScriptPromise;

    gisScriptPromise = new Promise(function (resolve, reject) {
      const script = document.createElement('script');
      script.src = config.scriptUrl;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = function () {
        gisScriptPromise = null;
        reject(new Error('No se pudo cargar Google Identity Services.'));
      };
      document.head.append(script);
    });
    return gisScriptPromise;
  }

  async function handleCredentialResponse(response) {
    try {
      const token = response && response.credential;
      const payload = typeof token === 'string' ? decodeJwt(token) : null;
      if (!isTokenValid(payload)) {
        onError('La credencial de Google no es válida o ha expirado.');
        return;
      }

      if (!await verifyIdToken(token, payload)) {
        onError('Google no pudo verificar la cuenta.');
        return;
      }

      onSuccess({
        email: payload.email,
        email_verified: payload.email_verified,
        name: payload.name || payload.email,
        picture: payload.picture || '',
        sub: payload.sub,
        idToken: token
      });
    } catch (error) {
      onError(error instanceof Error ? error.message : 'No se pudo completar el inicio de sesión con Google.');
    }
  }

  return {
    hasSession: function () {
      return window.sessionStorage.getItem(config.sessionKey) !== null;
    },
    saveSession: function (token) {
      window.sessionStorage.setItem(config.sessionKey, token);
    },
    init: async function (options) {
      onSuccess = options.onSuccess;
      onError = options.onError;
      if (!config.clientId || config.clientId === 'TU_CLIENT_ID.apps.googleusercontent.com') {
        onError('Configura el OAuth Client ID de Google en js/auth.js para habilitar este acceso.');
        return;
      }

      try {
        await loadGisScript();
        const container = document.getElementById(options.buttonContainerId);
        if (!container) throw new Error('No se encontró el contenedor del botón de Google.');
        window.google.accounts.id.initialize({
          client_id: config.clientId,
          callback: handleCredentialResponse
        });
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: Math.min(container.clientWidth || 320, 320)
        });
      } catch (error) {
        onError(error instanceof Error ? error.message : 'No se pudo inicializar el acceso con Google.');
      }
    },
    restoreSession: async function () {
      const token = window.sessionStorage.getItem(config.sessionKey);
      if (!token) return null;

      const payload = decodeJwt(token);
      if (!isTokenValid(payload)) {
        this.logout();
        return null;
      }
      try {
        if (!await verifyIdToken(token, payload)) {
          this.logout();
          return null;
        }
      } catch (error) {
        throw error;
      }

      return {
        email: payload.email,
        email_verified: payload.email_verified,
        name: payload.name || payload.email,
        picture: payload.picture || '',
        sub: payload.sub
      };
    },
    logout: function () {
      window.sessionStorage.removeItem(config.sessionKey);
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    }
  };
})();

const ROLES_POR_CORREO = {
  'admin@tuempresa.com': 'admin',
  'mesero@tuempresa.com': 'mesero',
  'cocina@tuempresa.com': 'cocina',
  'despacho@tuempresa.com': 'despacho'
};

function asignarRolUsuario(googleUser) {
  const email = googleUser.email.trim().toLocaleLowerCase('es');
  return {
    ...googleUser,
    rol: ROLES_POR_CORREO[email] || null
  };
}
