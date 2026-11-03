/* ==========================================================================
   Sazón · Panel de administración
   Interacciones visuales: fecha, menú lateral y navegación.
   ========================================================================== */

(function () {
  'use strict';

  const body = document.body;
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('admin-sidebar');
  const scrim = document.getElementById('sidebar-scrim');
  const mobileQuery = window.matchMedia('(max-width: 1024px)');

  /* Fecha del día en formato dd/mm/aaaa */
  const today = document.querySelector('[data-today]');
  if (today) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    today.textContent = `${day}/${month}/${now.getFullYear()}`;
    today.setAttribute('datetime', now.toISOString().slice(0, 10));
  }

  /* Menú lateral móvil */
  function isMobile() {
    return mobileQuery.matches;
  }

  function setMenu(open, restoreFocus) {
    body.classList.toggle('nav-open', open);

    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    }

    if (sidebar && isMobile()) {
      sidebar.inert = !open;
    }

    if (!open && restoreFocus && menuToggle && isMobile()) {
      menuToggle.focus();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', function () {
      setMenu(!body.classList.contains('nav-open'), false);
    });
  }

  if (scrim) {
    scrim.addEventListener('click', function () {
      setMenu(false, true);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && body.classList.contains('nav-open')) {
      setMenu(false, true);
    }
  });

  mobileQuery.addEventListener('change', function (event) {
    setMenu(false, false);
    if (sidebar) {
      sidebar.inert = event.matches;
    }
  });

  if (sidebar) {
    sidebar.inert = isMobile();

    sidebar.querySelectorAll('.nav-item').forEach(function (item) {
      item.addEventListener('click', function (event) {
        // Esta entrega solo incluye la vista del panel.
        event.preventDefault();

        sidebar.querySelectorAll('.nav-item').forEach(function (navItem) {
          navItem.classList.remove('is-active');
          navItem.removeAttribute('aria-current');
        });

        item.classList.add('is-active');
        item.setAttribute('aria-current', 'page');

        if (isMobile()) {
          setMenu(false, false);
        }
      });
    });
  }
})();
