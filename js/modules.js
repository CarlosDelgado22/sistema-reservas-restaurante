/* ==========================================================================
   Sazón · Configuración y reglas compartidas de los módulos
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon = window.Sazon || {};
  const modules = namespace.modules = namespace.modules || {};

  modules.config = {
    storageKeys: {
      tables: 'sazon-admin-tables',
      reservations: 'sazon-admin-reservations',
      orders: 'sazon-admin-orders',
      dispatches: 'sazon-admin-dispatches'
    },
    initialTables: [
      { id: 1, capacity: 2, zone: 'Terraza', status: 'Disponible' },
      { id: 2, capacity: 4, zone: 'Terraza', status: 'Disponible' },
      { id: 3, capacity: 4, zone: 'Salón', status: 'Disponible' },
      { id: 4, capacity: 6, zone: 'Salón', status: 'Disponible' },
      { id: 5, capacity: 2, zone: 'Barra', status: 'Disponible' },
      { id: 6, capacity: 8, zone: 'VIP', status: 'Disponible' },
      { id: 7, capacity: 4, zone: 'Salón', status: 'Disponible' },
      { id: 8, capacity: 4, zone: 'Terraza', status: 'Disponible' }
    ],
    menuDishes: [
      { id: 'ceviche', name: 'Ceviche clásico', price: 18 },
      { id: 'chaufa', name: 'Arroz chaufa', price: 16 },
      { id: 'lomo', name: 'Lomo saltado', price: 24 },
      { id: 'aji-gallina', name: 'Ají de gallina', price: 20 },
      { id: 'causa', name: 'Causa rellena', price: 15 },
      { id: 'anticuchos', name: 'Anticuchos', price: 17 },
      { id: 'picarones', name: 'Picarones', price: 12 },
      { id: 'suspiro', name: 'Suspiro limeño', price: 14 }
    ],
    orderStatuses: {
      Pendiente: 'pending',
      Preparado: 'prepared',
      Entregado: 'delivered'
    },
    kitchenStatuses: ['Pendiente', 'En preparación', 'Listo']
  };

  modules.getLocalDateOffset = function (offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  modules.formatCurrency = function (amount) {
    return `S/ ${amount.toFixed(2)}`;
  };

  modules.getKitchenStatus = function (order, item) {
    if (modules.config.kitchenStatuses.includes(item.kitchenStatus)) {
      return item.kitchenStatus;
    }
    return order.status === 'Preparado' || order.status === 'Entregado'
      ? 'Listo'
      : 'Pendiente';
  };
})();

/* ==========================================================================
   Sazón · Panel de administración
   Interacciones visuales: fecha, menú lateral y navegación.
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon;
  namespace.modules.initAdmin = function () {
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
    const targetView = document.getElementById(`${name}-view`);
    if (!targetView || !namespace.auth.hasPermission(name)) return;

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

  const getLocalDateOffset = namespace.modules.getLocalDateOffset;

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
  const storageKey = namespace.modules.config.storageKeys.tables;
  const initialTables = namespace.modules.config.initialTables;
  let tables = [];

  function setTableFeedback(message, isError) {
    if (!tableFeedback) return;
    tableFeedback.textContent = message;
    tableFeedback.classList.toggle('is-error', isError);
    tableFeedback.hidden = !message;
  }

  function saveTables(nextTables) {
    try {
      namespace.storage.setJSON(storageKey, nextTables);
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
      const parsedTables = namespace.storage.getJSON(storageKey, undefined);
      if (parsedTables === undefined) {
        saveTables(initialTables);
        return;
      }

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

  const reservationRows = document.getElementById('reservation-rows');
  const reservationDialog = document.getElementById('reservation-dialog');
  const reservationForm = document.getElementById('reservation-form');
  const reservationDialogTitle = document.getElementById('reservation-dialog-title');
  const reservationFeedback = document.getElementById('reservation-feedback');
  const reservationTableSelect = document.getElementById('reservation-table');
  const reservationEmpty = document.getElementById('reservation-empty');
  const reservationStorageKey = namespace.modules.config.storageKeys.reservations;
  let reservations = [];

  function setReservationFeedback(message, isError) {
    if (!reservationFeedback) return;
    reservationFeedback.textContent = message;
    reservationFeedback.classList.toggle('is-error', isError);
    reservationFeedback.hidden = !message;
  }

  function formatReservationDate(dateValue) {
    const parts = dateValue.split('-').map(Number);
    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(parts[0], parts[1] - 1, parts[2]));
  }

  function renderReservations() {
    if (!reservationRows || !reservationEmpty) return;

    const sortedReservations = reservations.slice().sort(function (first, second) {
      return `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`);
    });

    reservationRows.replaceChildren();
    sortedReservations.forEach(function (reservation) {
      const row = document.createElement('tr');
      row.append(
        makeCell(String(reservation.id)),
        makeCell(reservation.customer),
        makeCell(reservation.phone)
      );

      const tableCell = document.createElement('td');
      const assignedTable = tables.find(function (table) {
        return table.id === reservation.tableId;
      });
      tableCell.textContent = assignedTable ? `Mesa ${assignedTable.id}` : 'Mesa no disponible';
      row.append(tableCell);

      row.append(
        makeCell(formatReservationDate(reservation.date)),
        makeCell(reservation.time),
        makeCell(String(reservation.guests)),
        makeCell(reservation.notes || '—')
      );

      const actions = document.createElement('td');
      actions.className = 'table-actions';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'button button--small button--secondary';
      editButton.dataset.reservationAction = 'edit';
      editButton.dataset.reservationId = String(reservation.id);
      editButton.textContent = 'Editar';
      editButton.setAttribute('aria-label', `Editar reserva ${reservation.id}`);
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'button button--small button--danger';
      deleteButton.dataset.reservationAction = 'delete';
      deleteButton.dataset.reservationId = String(reservation.id);
      deleteButton.textContent = 'Eliminar';
      deleteButton.setAttribute('aria-label', `Eliminar reserva ${reservation.id}`);
      actions.append(editButton, deleteButton);
      row.append(actions);
      reservationRows.append(row);
    });

    reservationEmpty.hidden = reservations.length !== 0;
  }

  function updateReservationTableOptions(selectedId) {
    if (!reservationTableSelect) return;
    reservationTableSelect.replaceChildren();
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = 'Selecciona una mesa';
    reservationTableSelect.append(placeholderOption);

    tables.forEach(function (table) {
      const option = document.createElement('option');
      option.value = String(table.id);
      option.textContent = `Mesa ${table.id} · ${table.capacity} personas · ${table.zone}`;
      reservationTableSelect.append(option);
    });
    reservationTableSelect.value = selectedId ? String(selectedId) : '';
  }

  function saveReservations(nextReservations) {
    try {
      namespace.storage.setJSON(reservationStorageKey, nextReservations);
      reservations = nextReservations;
      renderReservations();
      setReservationFeedback('', false);
      return true;
    } catch (error) {
      setReservationFeedback('No se pudieron guardar los cambios. Revisa el almacenamiento del navegador e inténtalo de nuevo.', true);
      return false;
    }
  }

  function openReservationDialog(reservation) {
    if (!reservationDialog || !reservationForm || !reservationDialogTitle) return;
    reservationForm.reset();
    reservationForm.elements.id.value = reservation ? String(reservation.id) : '';
    reservationForm.elements.customer.value = reservation ? reservation.customer : '';
    reservationForm.elements.phone.value = reservation ? reservation.phone : '';
    reservationForm.elements.date.value = reservation ? reservation.date : getLocalDateOffset(0);
    reservationForm.elements.date.min = getLocalDateOffset(0);
    reservationForm.elements.time.value = reservation ? reservation.time : '';
    reservationForm.elements.guests.value = reservation ? String(reservation.guests) : '2';
    reservationForm.elements.notes.value = reservation ? reservation.notes || '' : '';
    updateReservationTableOptions(reservation ? reservation.tableId : '');
    reservationDialogTitle.textContent = reservation
      ? `Editar reserva ${reservation.id}`
      : 'Nueva reserva';
    reservationDialog.showModal();
    reservationForm.elements.customer.focus();
  }

  function loadReservations() {
    try {
      const parsedReservations = namespace.storage.getJSON(reservationStorageKey, undefined);
      if (parsedReservations === undefined) {
        reservations = [];
        renderReservations();
        return;
      }

      const validReservations = Array.isArray(parsedReservations) && parsedReservations.every(function (reservation) {
        return reservation &&
          Number.isInteger(reservation.id) &&
          typeof reservation.customer === 'string' &&
          typeof reservation.phone === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(reservation.date) &&
          /^\d{2}:\d{2}$/.test(reservation.time) &&
          Number.isInteger(reservation.guests) &&
          reservation.guests > 0 &&
          (reservation.tableId === null || Number.isInteger(reservation.tableId)) &&
          (reservation.notes === undefined || typeof reservation.notes === 'string');
      });

      if (!validReservations) {
        throw new Error('El formato de las reservas guardadas no es válido.');
      }

      reservations = parsedReservations;
      renderReservations();
    } catch (error) {
      setReservationFeedback('No se pudieron cargar las reservas guardadas. No se mostrarán datos para evitar perder información.', true);
      const createReservationButton = document.getElementById('create-reservation');
      if (createReservationButton) createReservationButton.disabled = true;
    }
  }

  if (reservationRows && reservationDialog && reservationForm) {
    loadReservations();

    document.getElementById('create-reservation').addEventListener('click', function () {
      openReservationDialog(null);
    });

    reservationForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!reservationForm.reportValidity()) return;

      const formData = new FormData(reservationForm);
      const idValue = formData.get('id');
      const editedId = idValue ? Number(idValue) : null;
      const customer = String(formData.get('customer')).trim();
      const phone = String(formData.get('phone')).trim();
      if (!customer || !phone) {
        setReservationFeedback('Ingresa el nombre y teléfono del cliente.', true);
        return;
      }

      const reservationDate = String(formData.get('date'));
      if (reservationDate < getLocalDateOffset(0)) {
        setReservationFeedback('La fecha de la reserva no puede ser anterior a hoy.', true);
        return;
      }

      const selectedTableId = String(formData.get('tableId'));
      const nextReservation = {
        id: editedId || reservations.reduce(function (maxId, reservation) {
          return Math.max(maxId, reservation.id);
        }, 0) + 1,
        customer: customer,
        phone: phone,
        date: reservationDate,
        time: String(formData.get('time')),
        guests: Number(formData.get('guests')),
        tableId: selectedTableId ? Number(selectedTableId) : null,
        notes: String(formData.get('notes')).trim()
      };
      const nextReservations = editedId
        ? reservations.map(function (reservation) {
          return reservation.id === editedId ? nextReservation : reservation;
        })
        : reservations.concat(nextReservation);

      if (saveReservations(nextReservations)) reservationDialog.close();
    });

    reservationRows.addEventListener('click', function (event) {
      const button = event.target.closest('[data-reservation-action]');
      if (!button) return;

      const id = Number(button.dataset.reservationId);
      const reservation = reservations.find(function (item) {
        return item.id === id;
      });
      if (!reservation) return;

      if (button.dataset.reservationAction === 'edit') {
        openReservationDialog(reservation);
      } else if (button.dataset.reservationAction === 'delete' && window.confirm(`¿Eliminar la reserva ${id} de ${reservation.customer}?`)) {
        saveReservations(reservations.filter(function (item) {
          return item.id !== id;
        }));
      }
    });

    document.getElementById('close-reservation-dialog').addEventListener('click', function () {
      reservationDialog.close();
    });
    document.getElementById('cancel-reservation-dialog').addEventListener('click', function () {
      reservationDialog.close();
    });
  }

  const orderRows = document.getElementById('order-rows');
  const orderDialog = document.getElementById('order-dialog');
  const orderForm = document.getElementById('order-form');
  const orderDialogTitle = document.getElementById('order-dialog-title');
  const orderFeedback = document.getElementById('order-feedback');
  const orderTableSelect = document.getElementById('order-table');
  const orderItemsContainer = document.getElementById('order-items');
  const orderTotal = document.getElementById('order-total');
  const orderEmpty = document.getElementById('order-empty');
  const pendingDishesCount = document.getElementById('pending-dishes-count');
  const orderStorageKey = namespace.modules.config.storageKeys.orders;
  const menuDishes = namespace.modules.config.menuDishes;
  const orderStatuses = namespace.modules.config.orderStatuses;
  let orders = [];

  function setOrderFeedback(message, isError) {
    if (!orderFeedback) return;
    orderFeedback.textContent = message;
    orderFeedback.classList.toggle('is-error', isError);
    orderFeedback.hidden = !message;
  }

  const formatCurrency = namespace.modules.formatCurrency;

  function getOrderAmount(order) {
    return order.items.reduce(function (total, item) {
      return total + item.price * item.quantity;
    }, 0);
  }

  function makeOrderStatus(status) {
    const badge = document.createElement('span');
    badge.className = `order-status order-status--${orderStatuses[status]}`;
    badge.textContent = status;
    return badge;
  }

  function renderOrders() {
    if (!orderRows || !orderEmpty) return;

    const activeRole = namespace.auth.getRole();
    const canManageOrders = activeRole === 'admin' || activeRole === 'mesero';
    const canUpdateDishes = activeRole === 'admin' || activeRole === 'cocina';
    const createOrderButton = document.getElementById('create-order');
    if (createOrderButton) createOrderButton.hidden = !canManageOrders;

    orderRows.replaceChildren();
    orders.slice().sort(function (first, second) {
      return second.id - first.id;
    }).forEach(function (order) {
      const row = document.createElement('tr');
      const assignedTable = tables.find(function (table) {
        return table.id === order.tableId;
      });
      row.append(
        makeCell(`#${order.id}`),
        makeCell(assignedTable ? `Mesa ${assignedTable.id}` : 'Mesa no disponible')
      );

      const dishesCell = document.createElement('td');
      const dishesList = document.createElement('div');
      dishesList.className = 'order-dishes-list';
      order.items.forEach(function (item, itemIndex) {
        const line = document.createElement('div');
        line.className = 'order-dish-line';
        const description = document.createElement('span');
        description.textContent = `${item.quantity} × ${item.name}`;
        const dishStatus = namespace.modules.getKitchenStatus(order, item);
        const statusBadge = document.createElement('span');
        statusBadge.className = `dish-status dish-status--${dishStatus === 'Listo' ? 'ready' : dishStatus === 'En preparación' ? 'preparing' : 'pending'}`;
        statusBadge.textContent = dishStatus;
        line.append(description, statusBadge);
        if (canUpdateDishes && dishStatus !== 'Listo' && order.status !== 'Entregado') {
          const statusButton = document.createElement('button');
          statusButton.type = 'button';
          statusButton.className = 'button button--small button--secondary dish-status-action';
          statusButton.dataset.orderItemStatus = '';
          statusButton.dataset.orderId = String(order.id);
          statusButton.dataset.itemIndex = String(itemIndex);
          statusButton.textContent = dishStatus === 'Pendiente' ? 'Iniciar preparación' : 'Marcar listo';
          line.append(statusButton);
        }
        dishesList.append(line);
      });
      dishesCell.append(dishesList);
      row.append(dishesCell, makeCell(formatCurrency(getOrderAmount(order))));

      const statusCell = document.createElement('td');
      statusCell.append(makeOrderStatus(order.status));
      row.append(statusCell);

      const actions = document.createElement('td');
      actions.className = 'table-actions';
      if (canManageOrders) {
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'button button--small button--secondary';
        editButton.dataset.orderAction = 'edit';
        editButton.dataset.orderId = String(order.id);
        editButton.textContent = 'Editar';
        editButton.setAttribute('aria-label', `Editar pedido ${order.id}`);
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'button button--small button--danger';
        deleteButton.dataset.orderAction = 'delete';
        deleteButton.dataset.orderId = String(order.id);
        deleteButton.textContent = 'Eliminar';
        deleteButton.setAttribute('aria-label', `Eliminar pedido ${order.id}`);
        actions.append(editButton, deleteButton);
      } else {
        actions.textContent = '—';
      }
      row.append(actions);
      orderRows.append(row);
    });

    orderEmpty.hidden = orders.length !== 0;
    pendingDishesCount.textContent = String(
      orders.reduce(function (total, order) {
        if (order.status === 'Entregado') return total;
        return total + order.items.reduce(function (count, item) {
          return count + (item.kitchenStatus === 'Listo' ? 0 : item.quantity);
        }, 0);
      }, 0)
    );
  }

  function updateOrderTableOptions(selectedId) {
    if (!orderTableSelect) return;
    orderTableSelect.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona una mesa';
    orderTableSelect.append(placeholder);

    tables.forEach(function (table) {
      const option = document.createElement('option');
      option.value = String(table.id);
      option.textContent = `Mesa ${table.id} — ${table.status.toLocaleLowerCase('es')}`;
      orderTableSelect.append(option);
    });

    orderTableSelect.value = selectedId ? String(selectedId) : '';
  }

  function createOrderItemRow(item) {
    const row = document.createElement('div');
    row.className = 'order-item';

    const dishLabel = document.createElement('label');
    dishLabel.className = 'table-field';
    dishLabel.textContent = 'Plato';
    const dishSelect = document.createElement('select');
    dishSelect.name = 'dish';
    dishSelect.required = true;
    menuDishes.forEach(function (dish) {
      const option = document.createElement('option');
      option.value = dish.id;
      option.textContent = `${dish.name} — S/ ${dish.price}`;
      dishSelect.append(option);
    });
    dishSelect.value = item ? item.dishId : menuDishes[0].id;
    dishLabel.append(dishSelect);

    const quantityLabel = document.createElement('label');
    quantityLabel.className = 'table-field';
    quantityLabel.textContent = 'Cantidad';
    const quantityInput = document.createElement('input');
    quantityInput.name = 'quantity';
    quantityInput.type = 'number';
    quantityInput.min = '1';
    quantityInput.max = '99';
    quantityInput.step = '1';
    quantityInput.value = item ? String(item.quantity) : '1';
    quantityInput.required = true;
    quantityLabel.append(quantityInput);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'order-item__remove';
    removeButton.dataset.orderItemRemove = '';
    removeButton.setAttribute('aria-label', 'Quitar plato');
    removeButton.textContent = '×';
    row.append(dishLabel, quantityLabel, removeButton);
    return row;
  }

  function updateOrderTotal() {
    if (!orderItemsContainer || !orderTotal) return;
    const amount = Array.from(orderItemsContainer.querySelectorAll('.order-item')).reduce(function (total, row) {
      const dish = menuDishes.find(function (menuItem) {
        return menuItem.id === row.querySelector('[name="dish"]').value;
      });
      const quantity = Number(row.querySelector('[name="quantity"]').value);
      return total + (dish ? dish.price * (Number.isFinite(quantity) ? quantity : 0) : 0);
    }, 0);
    orderTotal.textContent = formatCurrency(amount);
    orderItemsContainer.querySelectorAll('[data-order-item-remove]').forEach(function (button) {
      button.disabled = orderItemsContainer.querySelectorAll('.order-item').length === 1;
    });
  }

  function saveOrders(nextOrders) {
    try {
      namespace.storage.setJSON(orderStorageKey, nextOrders);
      orders = nextOrders;
      renderOrders();
      setOrderFeedback('', false);
      return true;
    } catch (error) {
      setOrderFeedback('No se pudieron guardar los cambios. Revisa el almacenamiento del navegador e inténtalo de nuevo.', true);
      return false;
    }
  }

  function openOrderDialog(order) {
    if (!orderDialog || !orderForm || !orderDialogTitle || !orderItemsContainer) return;
    orderForm.reset();
    orderForm.elements.id.value = order ? String(order.id) : '';
    orderForm.elements.status.value = order ? order.status : 'Pendiente';
    updateOrderTableOptions(order ? order.tableId : '');
    orderItemsContainer.replaceChildren();
    (order ? order.items : [null]).forEach(function (item) {
      orderItemsContainer.append(createOrderItemRow(item));
    });
    orderDialogTitle.textContent = order ? `Editar pedido #${order.id}` : 'Nuevo pedido';
    updateOrderTotal();
    orderDialog.showModal();
  }

  function loadOrders() {
    try {
      const parsedOrders = namespace.storage.getJSON(orderStorageKey, undefined);
      if (parsedOrders === undefined) {
        orders = [];
        renderOrders();
        return;
      }

      const validOrders = Array.isArray(parsedOrders) && parsedOrders.every(function (order) {
        return order &&
          Number.isInteger(order.id) &&
          Number.isInteger(order.tableId) &&
          order.items instanceof Array &&
          order.items.length > 0 &&
          order.items.every(function (item) {
            return item &&
              typeof item.dishId === 'string' &&
              typeof item.name === 'string' &&
              Number.isFinite(item.price) &&
              item.price >= 0 &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0;
          }) &&
          Object.prototype.hasOwnProperty.call(orderStatuses, order.status);
      });

      if (!validOrders) {
        throw new Error('El formato de los pedidos guardados no es válido.');
      }

      orders = parsedOrders;
      renderOrders();
    } catch (error) {
      setOrderFeedback('No se pudieron cargar los pedidos guardados. No se mostrarán datos para evitar perder información.', true);
      const createOrderButton = document.getElementById('create-order');
      if (createOrderButton) createOrderButton.disabled = true;
    }
  }

  if (orderRows && orderDialog && orderForm && orderItemsContainer) {
    loadOrders();

    document.getElementById('create-order').addEventListener('click', function () {
      updateOrderTableOptions('');
      if (tables.length === 0) {
        setOrderFeedback('Primero registra una mesa para poder crear un pedido.', true);
        return;
      }
      openOrderDialog(null);
    });

    document.getElementById('add-order-item').addEventListener('click', function () {
      orderItemsContainer.append(createOrderItemRow(null));
      updateOrderTotal();
    });

    orderItemsContainer.addEventListener('click', function (event) {
      const removeButton = event.target.closest('[data-order-item-remove]');
      if (!removeButton || orderItemsContainer.querySelectorAll('.order-item').length === 1) return;
      removeButton.closest('.order-item').remove();
      updateOrderTotal();
    });
    orderItemsContainer.addEventListener('input', updateOrderTotal);
    orderItemsContainer.addEventListener('change', updateOrderTotal);

    orderForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!orderForm.reportValidity()) return;

      const formData = new FormData(orderForm);
      const idValue = String(formData.get('id'));
      const editedId = idValue ? Number(idValue) : null;
      const tableId = Number(formData.get('tableId'));
      const selectedTable = tables.find(function (table) {
        return table.id === tableId;
      });
      if (!selectedTable) {
        setOrderFeedback('Selecciona una mesa válida antes de guardar el pedido.', true);
        return;
      }

      const itemRows = Array.from(orderItemsContainer.querySelectorAll('.order-item'));
      const items = itemRows.map(function (row) {
        const dish = menuDishes.find(function (menuItem) {
          return menuItem.id === row.querySelector('[name="dish"]').value;
        });
        const existingItem = editedId && dish
          ? (orders.find(function (order) {
            return order.id === editedId;
          }) || { items: [] }).items.find(function (orderItem) {
            return orderItem.dishId === dish.id;
          })
          : null;
        return dish ? {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: Number(row.querySelector('[name="quantity"]').value),
          kitchenStatus: existingItem ? existingItem.kitchenStatus || 'Pendiente' : 'Pendiente'
        } : null;
      });
      if (items.some(function (item) { return item === null; })) {
        setOrderFeedback('Selecciona un plato válido en cada línea del pedido.', true);
        return;
      }

      const nextOrder = {
        id: editedId || orders.reduce(function (maxId, order) {
          return Math.max(maxId, order.id);
        }, 0) + 1,
        tableId: tableId,
        items: items,
        status: String(formData.get('status'))
      };
      const nextOrders = editedId
        ? orders.map(function (order) {
          return order.id === editedId ? nextOrder : order;
        })
        : orders.concat(nextOrder);

      if (saveOrders(nextOrders)) orderDialog.close();
    });

    orderRows.addEventListener('click', function (event) {
      const statusButton = event.target.closest('[data-order-item-status]');
      if (statusButton) {
        if (!namespace.auth.hasPermission('orders') ||
            !['admin', 'cocina'].includes(namespace.auth.getRole())) return;
        const orderId = Number(statusButton.dataset.orderId);
        const itemIndex = Number(statusButton.dataset.itemIndex);
        const order = orders.find(function (item) { return item.id === orderId; });
        if (!order || !order.items[itemIndex]) return;

        const currentStatus = namespace.modules.getKitchenStatus(order, order.items[itemIndex]);
        const nextStatus = currentStatus === 'Pendiente' ? 'En preparación' : 'Listo';
        const updatedOrder = {
          ...order,
          items: order.items.map(function (item, index) {
            return index === itemIndex ? { ...item, kitchenStatus: nextStatus } : item;
          })
        };
        if (updatedOrder.items.every(function (item) {
          return namespace.modules.getKitchenStatus(updatedOrder, item) === 'Listo';
        }) && updatedOrder.status !== 'Entregado') {
          updatedOrder.status = 'Preparado';
        } else if (updatedOrder.status === 'Preparado') {
          updatedOrder.status = 'Pendiente';
        }
        saveOrders(orders.map(function (item) {
          return item.id === orderId ? updatedOrder : item;
        }));
        return;
      }

      const button = event.target.closest('[data-order-action]');
      if (!button) return;

      const id = Number(button.dataset.orderId);
      const order = orders.find(function (item) {
        return item.id === id;
      });
      if (!order) return;

      if (button.dataset.orderAction === 'edit') {
        openOrderDialog(order);
      } else if (button.dataset.orderAction === 'delete' && window.confirm(`¿Eliminar el pedido ${id}?`)) {
        saveOrders(orders.filter(function (item) {
          return item.id !== id;
        }));
      }
    });

    document.getElementById('close-order-dialog').addEventListener('click', function () {
      orderDialog.close();
    });
    document.getElementById('cancel-order-dialog').addEventListener('click', function () {
      orderDialog.close();
    });
  }

  function reloadChangedData(key) {
    if (key === storageKey && tableCards && tableRows) loadTables();
    if (key === reservationStorageKey && reservationRows) loadReservations();
    if (key === orderStorageKey && orderRows) loadOrders();
  }

  window.addEventListener('sazon:data-change', function (event) {
    reloadChangedData(event.detail.key);
  });
  window.addEventListener('storage', function (event) {
    reloadChangedData(event.key);
  });

  const resetDemoButton = document.getElementById('reset-demo-data');
  if (resetDemoButton) {
    resetDemoButton.addEventListener('click', function () {
      if (!window.confirm('¿Restablecer las mesas y borrar reservas, pedidos y despachos?')) return;
      try {
        namespace.storage.setJSON(storageKey, initialTables);
        namespace.storage.remove(namespace.modules.config.storageKeys.reservations);
        namespace.storage.remove(orderStorageKey);
        namespace.storage.remove(namespace.modules.config.storageKeys.dispatches);
        window.location.reload();
      } catch (error) {
        const feedback = document.getElementById('reset-feedback');
        feedback.textContent = 'No se pudieron restablecer los datos. Revisa el almacenamiento del navegador e inténtalo de nuevo.';
        feedback.hidden = false;
      }
    });
  }
  };
})();


/* ==========================================================================
   Sazón · Seguimiento de despachos
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon;
  namespace.modules.initDispatches = function () {
    const config = namespace.modules.config;
    const orderKey = config.storageKeys.orders;
    const tableKey = config.storageKeys.tables;
    const dispatchKey = config.storageKeys.dispatches;
    const rows = document.getElementById('dispatch-rows');
    const empty = document.getElementById('dispatch-empty');
    const feedback = document.getElementById('dispatch-feedback');
    if (!rows || !empty || !feedback) return;

    let orders = [];
    let tables = [];
    let dispatches = [];

    function isReady(order) {
      return order.items.length > 0 && order.items.every(function (item) {
        return namespace.modules.getKitchenStatus(order, item) === 'Listo';
      });
    }

    function addRow(order, dispatch) {
      const row = document.createElement('tr');
      const table = tables.find(function (item) { return item.id === order.tableId; });
      const readyItems = order.items.reduce(function (total, item) {
        return total + (namespace.modules.getKitchenStatus(order, item) === 'Listo' ? item.quantity : 0);
      }, 0);
      const values = [
        `#${order.id}`,
        table ? `Mesa ${table.id}` : 'Mesa no disponible',
        String(readyItems)
      ];
      values.forEach(function (value) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });

      const statusCell = document.createElement('td');
      statusCell.textContent = dispatch ? dispatch.status : 'Listo para despachar';
      row.append(statusCell);
      const actionCell = document.createElement('td');
      actionCell.className = 'table-actions';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button button--small button--secondary';
      button.dataset.orderId = String(order.id);
      if (!dispatch) {
        button.dataset.dispatchAction = 'create';
        button.textContent = 'Crear despacho';
      } else if (dispatch.status === 'Pendiente') {
        button.dataset.dispatchAction = 'enroute';
        button.dataset.dispatchId = String(dispatch.id);
        button.textContent = 'Marcar en ruta';
      } else if (dispatch.status === 'En ruta') {
        button.dataset.dispatchAction = 'delivered';
        button.dataset.dispatchId = String(dispatch.id);
        button.textContent = 'Marcar entregado';
      } else {
        button.disabled = true;
        button.textContent = 'Entregado';
      }
      actionCell.append(button);
      row.append(actionCell);
      rows.append(row);
    }

    function render() {
      rows.replaceChildren();
      orders.slice().sort(function (a, b) { return b.id - a.id; }).forEach(function (order) {
        const dispatch = dispatches.find(function (item) { return item.orderId === order.id; });
        if (dispatch) {
          addRow(order, dispatch);
        } else if (order.status !== 'Entregado' && isReady(order)) {
          addRow(order, null);
        }
      });
      dispatches.filter(function (dispatch) {
        return dispatch.status === 'Entregado' && !orders.some(function (order) {
          return order.id === dispatch.orderId;
        });
      }).forEach(function (dispatch) {
        const row = document.createElement('tr');
        [ `#${dispatch.orderId}`, `Mesa ${dispatch.tableId}`, '—', dispatch.status ].forEach(function (text) {
          const cell = document.createElement('td');
          cell.textContent = text;
          row.append(cell);
        });
        const action = document.createElement('td');
        action.textContent = '—';
        row.append(action);
        rows.append(row);
      });
      empty.hidden = rows.children.length > 0;
    }

    function load() {
      try {
        const nextOrders = namespace.storage.getJSON(orderKey, []);
        const nextTables = namespace.storage.getJSON(tableKey, []);
        const nextDispatches = namespace.storage.getJSON(dispatchKey, []);
        const valid = Array.isArray(nextOrders) && Array.isArray(nextTables) &&
          Array.isArray(nextDispatches) && nextDispatches.every(function (item) {
            return item && Number.isInteger(item.id) && Number.isInteger(item.orderId) &&
              Number.isInteger(item.tableId) &&
              ['Pendiente', 'En ruta', 'Entregado'].includes(item.status);
          });
        if (!valid) throw new Error('El formato guardado de despachos no es válido.');
        orders = nextOrders;
        tables = nextTables;
        dispatches = nextDispatches;
        feedback.hidden = true;
        render();
      } catch (error) {
        feedback.textContent = 'No se pudieron cargar los despachos. Revisa los datos guardados e inténtalo de nuevo.';
        feedback.hidden = false;
      }
    }

    rows.addEventListener('click', function (event) {
      const button = event.target.closest('[data-dispatch-action]');
      if (!button) return;
      const action = button.dataset.dispatchAction;
      const orderId = Number(button.dataset.orderId);

      try {
        if (action === 'create') {
          const order = orders.find(function (item) { return item.id === orderId; });
          if (!order || !isReady(order) || dispatches.some(function (item) { return item.orderId === orderId; })) {
            return;
          }
          const next = dispatches.concat({
            id: dispatches.reduce(function (maxId, item) { return Math.max(maxId, item.id); }, 0) + 1,
            orderId: order.id,
            tableId: order.tableId,
            status: 'Pendiente'
          });
          namespace.storage.setJSON(dispatchKey, next);
        } else {
          const dispatchId = Number(button.dataset.dispatchId);
          const dispatch = dispatches.find(function (item) { return item.id === dispatchId; });
          if (!dispatch) return;
          const nextStatus = action === 'enroute' ? 'En ruta' : 'Entregado';
          namespace.storage.setJSON(dispatchKey, dispatches.map(function (item) {
            return item.id === dispatchId ? { ...item, status: nextStatus } : item;
          }));
          if (nextStatus === 'Entregado') {
            namespace.storage.setJSON(orderKey, orders.map(function (order) {
              return order.id === dispatch.orderId ? { ...order, status: 'Entregado' } : order;
            }));
          }
        }
        load();
      } catch (error) {
        feedback.textContent = 'No se pudo actualizar el despacho. Revisa el almacenamiento del navegador e inténtalo de nuevo.';
        feedback.hidden = false;
      }
    });

    [orderKey, tableKey, dispatchKey].forEach(function (key) {
      window.addEventListener('sazon:data-change', function (event) {
        if (event.detail.key === key) load();
      });
      window.addEventListener('storage', function (event) {
        if (event.key === key) load();
      });
    });
    load();
  };
})();


/* ==========================================================================
   Sazón · Indicadores del panel
   ========================================================================== */

(function () {
  'use strict';

  const namespace = window.Sazon;
  namespace.modules.initDashboard = function () {
    const config = namespace.modules.config;
    const feedback = document.getElementById('dashboard-feedback');
    const statistics = {
      reservations: document.querySelector('[data-dashboard-stat="reservations"]'),
      pendingDishes: document.querySelector('[data-dashboard-stat="pendingDishes"]'),
      activeDispatches: document.querySelector('[data-dashboard-stat="activeDispatches"]'),
      occupiedTables: document.querySelector('[data-dashboard-stat="occupiedTables"]'),
      reservedTables: document.querySelector('[data-dashboard-stat="reservedTables"]'),
      openOrders: document.querySelector('[data-dashboard-stat="openOrders"]')
    };

    function update() {
      try {
        const tables = namespace.storage.getJSON(config.storageKeys.tables, config.initialTables);
        const reservations = namespace.storage.getJSON(config.storageKeys.reservations, []);
        const orders = namespace.storage.getJSON(config.storageKeys.orders, []);
        const dispatches = namespace.storage.getJSON(config.storageKeys.dispatches, []);
        if (![tables, reservations, orders, dispatches].every(Array.isArray)) {
          throw new Error('El formato de las estadísticas guardadas no es válido.');
        }

        const today = namespace.modules.getLocalDateOffset(0);
        const counts = {
          reservations: reservations.filter(function (item) { return item.date === today; }).length,
          pendingDishes: orders.reduce(function (total, order) {
            if (order.status === 'Entregado') return total;
            return total + order.items.reduce(function (sum, item) {
              return sum + (namespace.modules.getKitchenStatus(order, item) === 'Listo' ? 0 : item.quantity);
            }, 0);
          }, 0),
          activeDispatches: dispatches.filter(function (item) {
            return item.status !== 'Entregado' && item.status !== 'Cancelado';
          }).length,
          occupiedTables: tables.filter(function (item) { return item.status === 'Ocupada'; }).length,
          reservedTables: tables.filter(function (item) { return item.status === 'Reservada'; }).length,
          openOrders: orders.filter(function (item) { return item.status !== 'Entregado'; }).length
        };
        Object.keys(statistics).forEach(function (key) {
          if (statistics[key]) statistics[key].textContent = String(counts[key]);
        });
        if (feedback) feedback.hidden = true;
      } catch (error) {
        if (feedback) {
          feedback.textContent = 'No se pudieron cargar las estadísticas del panel. Revisa los datos guardados e inténtalo de nuevo.';
          feedback.hidden = false;
        }
      }
    }

    window.addEventListener('sazon:data-change', update);
    window.addEventListener('storage', update);
    update();
  };
})();
