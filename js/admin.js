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

  function getLocalDateOffset(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  const reservationRows = document.getElementById('reservation-rows');
  const reservationDialog = document.getElementById('reservation-dialog');
  const reservationForm = document.getElementById('reservation-form');
  const reservationDialogTitle = document.getElementById('reservation-dialog-title');
  const reservationFeedback = document.getElementById('reservation-feedback');
  const reservationTableSelect = document.getElementById('reservation-table');
  const reservationEmpty = document.getElementById('reservation-empty');
  const reservationStorageKey = 'sazon-admin-reservations';
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
      window.localStorage.setItem(reservationStorageKey, JSON.stringify(nextReservations));
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
      const savedReservations = window.localStorage.getItem(reservationStorageKey);
      if (savedReservations === null) {
        reservations = [];
        renderReservations();
        return;
      }

      const parsedReservations = JSON.parse(savedReservations);
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
  const orderStorageKey = 'sazon-admin-orders';
  const menuDishes = [
    { id: 'ceviche', name: 'Ceviche clásico', price: 18 },
    { id: 'chaufa', name: 'Arroz chaufa', price: 16 },
    { id: 'lomo', name: 'Lomo saltado', price: 24 },
    { id: 'aji-gallina', name: 'Ají de gallina', price: 20 },
    { id: 'causa', name: 'Causa rellena', price: 15 }
  ];
  const orderStatuses = {
    Pendiente: 'pending',
    Preparado: 'prepared',
    Entregado: 'delivered'
  };
  let orders = [];

  function setOrderFeedback(message, isError) {
    if (!orderFeedback) return;
    orderFeedback.textContent = message;
    orderFeedback.classList.toggle('is-error', isError);
    orderFeedback.hidden = !message;
  }

  function formatCurrency(amount) {
    return `S/ ${amount.toFixed(2)}`;
  }

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
      order.items.forEach(function (item) {
        const line = document.createElement('span');
        line.className = 'order-dish-line';
        line.textContent = `${item.quantity} × ${item.name}`;
        dishesList.append(line);
      });
      dishesCell.append(dishesList);
      row.append(dishesCell, makeCell(formatCurrency(getOrderAmount(order))));

      const statusCell = document.createElement('td');
      statusCell.append(makeOrderStatus(order.status));
      row.append(statusCell);

      const actions = document.createElement('td');
      actions.className = 'table-actions';
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
      row.append(actions);
      orderRows.append(row);
    });

    orderEmpty.hidden = orders.length !== 0;
    pendingDishesCount.textContent = String(
      orders.reduce(function (total, order) {
        if (order.status !== 'Pendiente') return total;
        return total + order.items.reduce(function (count, item) {
          return count + item.quantity;
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
      window.localStorage.setItem(orderStorageKey, JSON.stringify(nextOrders));
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
      const savedOrders = window.localStorage.getItem(orderStorageKey);
      if (savedOrders === null) {
        orders = [];
        renderOrders();
        return;
      }

      const parsedOrders = JSON.parse(savedOrders);
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
        return dish ? {
          dishId: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: Number(row.querySelector('[name="quantity"]').value)
        } : null;
      });
      if (items.some(function (item) { return item === null; })) {
        setOrderFeedback('Selecciona un plato válido en cada línea del pedido.', true);
        return;
      }

      const idValue = String(formData.get('id'));
      const editedId = idValue ? Number(idValue) : null;
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

  const userRows = document.getElementById('user-rows');
  const userEmpty = document.getElementById('user-empty');
  const userFeedback = document.getElementById('user-feedback');
  const userDialog = document.getElementById('user-dialog');
  const userForm = document.getElementById('user-form');
  const userDialogTitle = document.getElementById('user-dialog-title');
  const createUserButton = document.getElementById('create-user');
  const resetDemoUsersButton = document.getElementById('reset-demo-users');
  const userStorageKey = 'sazon-admin-users';
  const demoUsers = [
    { id: 1, name: 'Administrador', username: 'admin', role: 'Administrador' },
    { id: 2, name: 'Carlos Mesero', username: 'mesero', role: 'Mesero' },
    { id: 3, name: 'Ana Cocina', username: 'cocina', role: 'Cocina' },
    { id: 4, name: 'Luis Despacho', username: 'despacho', role: 'Despacho' }
  ];
  const userRoleClasses = {
    Administrador: 'admin',
    Mesero: 'server',
    Cocina: 'kitchen',
    Despacho: 'dispatch'
  };
  let users = [];

  function setUserFeedback(message, isError) {
    if (!userFeedback) return;
    userFeedback.textContent = message;
    userFeedback.classList.toggle('is-error', isError);
    userFeedback.hidden = !message;
  }

  function saveUsers(nextUsers, successMessage) {
    try {
      window.localStorage.setItem(userStorageKey, JSON.stringify(nextUsers));
      users = nextUsers;
      renderUsers();
      setUserFeedback(successMessage || '', false);
      return true;
    } catch (error) {
      setUserFeedback('No se pudieron guardar los cambios. Revisa el almacenamiento del navegador e inténtalo de nuevo.', true);
      return false;
    }
  }

  function renderUsers() {
    if (!userRows || !userEmpty) return;

    userRows.replaceChildren();
    users.forEach(function (user) {
      const row = document.createElement('tr');
      row.append(makeCell(user.name), makeCell(user.username));

      const roleCell = document.createElement('td');
      const roleBadge = document.createElement('span');
      roleBadge.className = `user-role user-role--${userRoleClasses[user.role]}`;
      roleBadge.textContent = user.role;
      roleCell.append(roleBadge);
      row.append(roleCell);

      const actions = document.createElement('td');
      actions.className = 'table-actions';
      const deleteButton = document.createElement('button');
      deleteButton.type = 'button';
      deleteButton.className = 'button button--small button--danger';
      deleteButton.dataset.userAction = 'delete';
      deleteButton.dataset.userId = String(user.id);
      deleteButton.textContent = 'Eliminar';
      deleteButton.setAttribute('aria-label', `Eliminar usuario ${user.username}`);
      actions.append(deleteButton);
      row.append(actions);
      userRows.append(row);
    });

    userEmpty.hidden = users.length !== 0;
  }

  function loadUsers() {
    try {
      const savedUsers = window.localStorage.getItem(userStorageKey);
      if (savedUsers === null) {
        saveUsers(demoUsers);
        return;
      }

      const parsedUsers = JSON.parse(savedUsers);
      const validRoles = Object.keys(userRoleClasses);
      const validUsers = Array.isArray(parsedUsers) && parsedUsers.every(function (user) {
        return user &&
          Number.isInteger(user.id) &&
          user.id > 0 &&
          typeof user.name === 'string' &&
          user.name.trim().length > 0 &&
          typeof user.username === 'string' &&
          user.username.trim().length > 0 &&
          validRoles.includes(user.role);
      });

      if (!validUsers) {
        throw new Error('El formato de los usuarios guardados no es válido.');
      }

      users = parsedUsers;
      renderUsers();
    } catch (error) {
      setUserFeedback('No se pudieron cargar los usuarios guardados. No se mostrarán datos para evitar perder información.', true);
      if (createUserButton) createUserButton.disabled = true;
    }
  }

  function openUserDialog() {
    if (!userDialog || !userForm || !userDialogTitle) return;
    userForm.reset();
    userDialogTitle.textContent = 'Nuevo usuario';
    userDialog.showModal();
    userForm.elements.name.focus();
  }

  if (userRows && userDialog && userForm) {
    loadUsers();

    createUserButton.addEventListener('click', openUserDialog);

    resetDemoUsersButton.addEventListener('click', function () {
      if (window.confirm('¿Restaurar las cuatro cuentas demo? Esta acción reemplazará la lista actual de usuarios.')) {
        saveUsers(demoUsers, 'Se restablecieron los usuarios demo.');
      }
    });

    userForm.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!userForm.reportValidity()) return;

      const formData = new FormData(userForm);
      const name = String(formData.get('name')).trim();
      const username = String(formData.get('username')).trim().toLowerCase();
      const role = String(formData.get('role'));
      const usernameExists = users.some(function (user) {
        return user.username.toLowerCase() === username;
      });

      if (!name || !username) {
        setUserFeedback('Ingresa el nombre y el usuario.', true);
        return;
      }
      if (usernameExists) {
        setUserFeedback('Ese nombre de usuario ya está registrado. Elige otro.', true);
        return;
      }

      const nextUser = {
        id: users.reduce(function (maxId, user) {
          return Math.max(maxId, user.id);
        }, 0) + 1,
        name: name,
        username: username,
        role: role
      };

      if (saveUsers(users.concat(nextUser))) userDialog.close();
    });

    userRows.addEventListener('click', function (event) {
      const button = event.target.closest('[data-user-action="delete"]');
      if (!button) return;

      const id = Number(button.dataset.userId);
      const user = users.find(function (item) {
        return item.id === id;
      });
      if (!user) return;

      if (window.confirm(`¿Eliminar al usuario ${user.username}?`)) {
        saveUsers(users.filter(function (item) {
          return item.id !== id;
        }));
      }
    });

    document.getElementById('close-user-dialog').addEventListener('click', function () {
      userDialog.close();
    });
    document.getElementById('cancel-user-dialog').addEventListener('click', function () {
      userDialog.close();
    });
  }
})();
