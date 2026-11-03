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

  const viewLinks = document.querySelectorAll('[data-admin-view-link]');
  const views = document.querySelectorAll('[data-admin-view]');

  function showView(name) {
    views.forEach(function (view) {
      view.hidden = view.id !== `${name}-view`;
    });

    viewLinks.forEach(function (link) {
      const active = link.dataset.adminViewLink === name;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  if (sidebar) {
    sidebar.inert = isMobile();

    sidebar.querySelectorAll('.nav-item').forEach(function (item) {
      item.addEventListener('click', function (event) {
        event.preventDefault();

        if (item.dataset.adminViewLink) {
          showView(item.dataset.adminViewLink);
        } else {
          sidebar.querySelectorAll('.nav-item').forEach(function (navItem) {
            navItem.classList.remove('is-active');
            navItem.removeAttribute('aria-current');
          });
          item.classList.add('is-active');
          item.setAttribute('aria-current', 'page');
        }

        if (isMobile()) {
          setMenu(false, false);
        }
      });
    });
  }

  const tableCards = document.getElementById('table-cards');
  const tableRows = document.getElementById('table-rows');
  const tableFeedback = document.getElementById('table-feedback');
  const tableDialog = document.getElementById('table-dialog');
  const tableForm = document.getElementById('table-form');
  const dialogTitle = document.getElementById('table-dialog-title');
  const createTableButton = document.getElementById('create-table');
  const storageKey = 'sazon-admin-tables';
  const initialTables = [
    { id: 1, capacity: 2, zone: 'Terraza', status: 'Disponible' },
    { id: 2, capacity: 4, zone: 'Terraza', status: 'Disponible' },
    { id: 3, capacity: 4, zone: 'Salón', status: 'Disponible' },
    { id: 4, capacity: 6, zone: 'Salón', status: 'Disponible' },
    { id: 5, capacity: 2, zone: 'Barra', status: 'Disponible' },
    { id: 6, capacity: 8, zone: 'VIP', status: 'Disponible' },
    { id: 7, capacity: 4, zone: 'Salón', status: 'Disponible' },
    { id: 8, capacity: 4, zone: 'Terraza', status: 'Disponible' }
  ];
  let tables = [];

  function setTableFeedback(message, isError) {
    if (!tableFeedback) return;
    tableFeedback.textContent = message;
    tableFeedback.classList.toggle('is-error', isError);
    tableFeedback.hidden = !message;
  }

  function saveTables(nextTables) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextTables));
      tables = nextTables;
      renderTables();
      setTableFeedback('', false);
      return true;
    } catch (error) {
      setTableFeedback('No se pudieron guardar los cambios. Revisa el almacenamiento del navegador e inténtalo de nuevo.', true);
      return false;
    }
  }

  function makeCell(text) {
    const cell = document.createElement('td');
    cell.textContent = text;
    return cell;
  }

  function makeStatus(status) {
    const badge = document.createElement('span');
    const statusClass = {
      Disponible: 'available',
      Ocupada: 'occupied',
      Reservada: 'reserved'
    }[status] || 'reserved';
    badge.className = `table-status table-status--${statusClass}`;
    badge.textContent = status;
    return badge;
  }

  function renderTables() {
    if (!tableCards || !tableRows) return;

    tableCards.replaceChildren();
    tableRows.replaceChildren();

    if (tables.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'table-empty';
      empty.textContent = 'Aún no hay mesas registradas. Crea una mesa para comenzar.';
      tableCards.append(empty);
    }

    tables.forEach(function (table) {
      const card = document.createElement('article');
      const cardStatusClass = {
        Disponible: 'available',
        Ocupada: 'occupied',
        Reservada: 'reserved'
      }[table.status] || 'reserved';
      card.className = `table-card table-card--${cardStatusClass}`;

      const title = document.createElement('h3');
      title.textContent = `Mesa ${table.id}`;
      const details = document.createElement('p');
      details.textContent = `${table.capacity} ${table.capacity === 1 ? 'persona' : 'personas'} · ${table.zone}`;
      const status = document.createElement('span');
      status.className = 'table-card__status';
      status.textContent = table.status;

      card.append(title, details, status);
      tableCards.append(card);

      const row = document.createElement('tr');
      row.append(
        makeCell(String(table.id)),
        makeCell(String(table.capacity)),
        makeCell(table.zone)
      );
      const statusCell = document.createElement('td');
      statusCell.append(makeStatus(table.status));
      row.append(statusCell);

      const actions = document.createElement('td');
      actions.className = 'table-actions';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'button button--small button--secondary';
      editButton.dataset.tableAction = 'edit';
      editButton.dataset.tableId = String(table.id);
      editButton.textContent = 'Editar';
      editButton.setAttribute('aria-label', `Editar mesa ${table.id}`);
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'button button--small button--danger';
      deleteButton.dataset.tableAction = 'delete';
      deleteButton.dataset.tableId = String(table.id);
      deleteButton.textContent = 'Eliminar';
      deleteButton.setAttribute('aria-label', `Eliminar mesa ${table.id}`);
      actions.append(editButton, deleteButton);
      row.append(actions);
      tableRows.append(row);
    });
  }

  function openTableDialog(table) {
    if (!tableDialog || !tableForm || !dialogTitle) return;
    tableForm.reset();
    tableForm.elements.id.value = table ? String(table.id) : '';
    tableForm.elements.capacity.value = table ? String(table.capacity) : '';
    tableForm.elements.zone.value = table ? table.zone : '';
    tableForm.elements.status.value = table ? table.status : 'Disponible';
    dialogTitle.textContent = table ? `Editar mesa ${table.id}` : 'Crear mesa';
    tableDialog.showModal();
    tableForm.elements.capacity.focus();
  }

  function loadTables() {
    try {
      const savedTables = window.localStorage.getItem(storageKey);
      if (savedTables === null) {
        saveTables(initialTables);
        return;
      }

      const parsedTables = JSON.parse(savedTables);
      const validTables = Array.isArray(parsedTables) && parsedTables.every(function (table) {
        return table &&
          Number.isInteger(table.id) &&
          Number.isInteger(table.capacity) &&
          table.capacity > 0 &&
          typeof table.zone === 'string' &&
          ['Disponible', 'Ocupada', 'Reservada'].includes(table.status);
      });

      if (!validTables) {
        throw new Error('El formato de las mesas guardadas no es válido.');
      }

      tables = parsedTables;
      renderTables();
    } catch (error) {
      setTableFeedback('No se pudieron cargar las mesas guardadas. No se mostrarán datos para evitar perder información.', true);
      if (createTableButton) createTableButton.disabled = true;
    }
  }

  if (tableCards && tableRows && tableDialog && tableForm) {
    loadTables();

    if (createTableButton) {
      createTableButton.addEventListener('click', function () {
        openTableDialog(null);
      });
    }

    tableForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!tableForm.reportValidity()) return;

      const formData = new FormData(tableForm);
      const idValue = formData.get('id');
      const editedId = idValue ? Number(idValue) : null;
      const nextTable = {
        id: editedId || tables.reduce(function (maxId, table) {
          return Math.max(maxId, table.id);
        }, 0) + 1,
        capacity: Number(formData.get('capacity')),
        zone: String(formData.get('zone')).trim(),
        status: String(formData.get('status'))
      };
      const nextTables = editedId
        ? tables.map(function (table) {
          return table.id === editedId ? nextTable : table;
        })
        : tables.concat(nextTable);

      if (saveTables(nextTables)) tableDialog.close();
    });

    tableRows.addEventListener('click', function (event) {
      const button = event.target.closest('[data-table-action]');
      if (!button) return;

      const id = Number(button.dataset.tableId);
      const table = tables.find(function (item) {
        return item.id === id;
      });
      if (!table) return;

      if (button.dataset.tableAction === 'edit') {
        openTableDialog(table);
      } else if (button.dataset.tableAction === 'delete' && window.confirm(`¿Eliminar la mesa ${id}?`)) {
        saveTables(tables.filter(function (item) {
          return item.id !== id;
        }));
      }
    });

    document.getElementById('close-table-dialog').addEventListener('click', function () {
      tableDialog.close();
    });
    document.getElementById('cancel-table-dialog').addEventListener('click', function () {
      tableDialog.close();
    });
  }
})();
