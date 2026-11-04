/* ==========================================================================
   Sazón · Persistencia del navegador
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon = window.Sazon || {};

  namespace.storage = {
    getJSON: function (key, fallback) {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    },
    setJSON: function (key, value) {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent('sazon:data-change', { detail: { key: key } }));
    },
    remove: function (key) {
      window.localStorage.removeItem(key);
      window.dispatchEvent(new CustomEvent('sazon:data-change', { detail: { key: key } }));
    }
  };
})();