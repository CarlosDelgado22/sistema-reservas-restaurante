/* ==========================================================================
   Sazón · Panel de cocina
   ========================================================================== */

(function () {
  'use strict';

  const sessionRoleKey = 'sazon-session-role';
  const sessionUserKey = 'sazon-session-user';
  let currentFilter = 'pending';
  let tables = [];
  let reservations = [];
  let orders = [];

  try {
    if (window.sessionStorage.getItem(sessionRoleKey) !== 'cocina') {
      window.location.replace('index.html');
      return;
    }
  } catch (error) {
    window.location.replace('index.html');
    return;
  }

  const username = window.sessionStorage.getItem(sessionUserKey) || 'cocina';
  document.getElementById('kitchen-sidebar-user').textContent = username;
  document.getElementById('kitchen-welcome-user').textContent = username;

  document.querySelectorAll('[data-kitchen-logout]').forEach(function (link) {
    link.addEventListener('click', function () {
      window.sessionStorage.removeItem(sessionRoleKey);
      window.sessionStorage.removeItem(sessionUserKey);
    });
  });

  const orderContainer = document.getElementById('kitchen-orders');
  const emptyState = document.getElementById('kitchen-empty');
  const feedback = document.getElementById('kitchen-feedback');
  const orderStorageKey = 'sazon-admin-orders';
  const tableStorageKey = 'sazon-admin-tables';
  const reservationStorageKey = 'sazon-admin-reservations';
  const dispatchStorageKey = 'sazon-admin-dispatches';

  function getKitchenStatus(order, item) {
    if (['Pendiente', 'En preparación', 'Listo'].includes(item.kitchenStatus)) {
      return item.kitchenStatus;
    }
    return order.status === 'Preparado' || order.status === 'Entregado'
      ? 'Listo'
      : 'Pendiente';
  }

  function getPendingDishCount() {
    return orders.reduce(function (total, order) {
      if (order.status === 'Entregado') return total;
      return total + order.items.reduce(function (count, item) {
        return count + (getKitchenStatus(order, item) === 'Listo' ? 0 : item.quantity);
      }, 0);
    }, 0);
  }

  function setFeedback(message) {
    feedback.textContent = message;
    feedback.hidden = !message;
  }

  function updateSummary() {
    const today = document.querySelector('[data-today]').getAttribute('datetime');
    document.getElementById('kitchen-stat-reservations').textContent = String(
      reservations.filter(function (reservation) {
        return reservation.date === today;
      }).length
    );
    document.getElementById('kitchen-stat-pending').textContent = String(getPendingDishCount());
    document.getElementById('kitchen-stat-occupied').textContent = String(
      tables.filter(function (table) {
        return table.status === 'Ocupada';
      }).length
    );
    document.getElementById('kitchen-stat-dispatches').textContent = String(
      Array.isArray(readStorage(dispatchStorageKey, []))
        ? readStorage(dispatchStorageKey, []).filter(function (dispatch) {
          return dispatch && dispatch.status !== 'Entregado' && dispatch.status !== 'Cancelado';
        }).length
        : 0
    );

    document.getElementById('kitchen-pending-count').textContent = String(getPendingDishCount());
    document.getElementById('kitchen-nav-count').textContent = String(getPendingDishCount());
  }

  function readStorage(key, defaultValue) {
    const value = window.localStorage.getItem(key);
    return value === null ? defaultValue : JSON.parse(value);
  }

  function createDishCard(order, item, itemIndex, tableLabel) {
    const dish = document.createElement('article');
    dish.className = 'kitchen-dish';

    const info = document.createElement('div');
    info.className = 'kitchen-dish__info';
    const name = document.createElement('span');
    name.className = 'kitchen-dish__name';
    name.textContent = item.name;
    const quantity = document.createElement('span');
    quantity.className = 'kitchen-dish__quantity';
    quantity.textContent = `Cantidad: ${item.quantity}`;
    info.append(name, quantity);

    const status = getKitchenStatus(order, item);
    const state = document.createElement('div');
    state.className = 'kitchen-dish__state';
    const badge = document.createElement('span');
    badge.className = 'kitchen-dish__badge';
    if (status === 'En preparación') {
      badge.classList.add('kitchen-dish__badge--preparing');
    } else if (status === 'Listo') {
      badge.classList.add('kitchen-dish__badge--ready');
    }
    badge.textContent = status;
    state.append(badge);

    if (status !== 'Listo' && order.status !== 'Entregado') {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'kitchen-dish__action';
      action.dataset.kitchenAction = 'advance';
      action.dataset.orderId = String(order.id);
      action.dataset.itemIndex = String(itemIndex);
      action.textContent = status === 'Pendiente' ? 'Iniciar preparación' : 'Marcar listo';
      action.setAttribute('aria-label', `${action.textContent}: ${item.name}, ${tableLabel}`);
      state.append(action);
    }

    dish.append(info, state);
    return dish;
  }

  function renderOrders() {
    orderContainer.replaceChildren();
    const orderedOrders = orders.slice().sort(function (first, second) {
      return second.id - first.id;
    });
    const visibleOrders = orderedOrders.filter(function (order) {
      if (currentFilter === 'all') return true;
      return order.status !== 'Entregado' && order.items.some(function (item) {
        return getKitchenStatus(order, item) !== 'Listo';
      });
    });

    visibleOrders.forEach(function (order) {
      const table = tables.find(function (item) {
        return item.id === order.tableId;
      });
      const tableLabel = table ? `Mesa ${table.id}` : 'Mesa no disponible';
      const card = document.createElement('article');
      card.className = 'kitchen-order-card';

      const header = document.createElement('header');
      header.className = 'kitchen-order-card__head';
      const title = document.createElement('h3');
      title.textContent = `Pedido #${order.id}`;
      const tableName = document.createElement('span');
      tableName.textContent = tableLabel;
      header.append(title, tableName);

      const dishes = document.createElement('div');
      dishes.className = 'kitchen-order-dishes';
      order.items.forEach(function (item, index) {
        dishes.append(createDishCard(order, item, index, tableLabel));
      });

      const footer = document.createElement('footer');
      footer.className = 'kitchen-order-card__foot';
      footer.textContent = `${order.items.length} ${order.items.length === 1 ? 'plato' : 'platos'} · ${order.status}`;
      card.append(header, dishes, footer);
      orderContainer.append(card);
    });

    emptyState.hidden = visibleOrders.length !== 0;
    emptyState.textContent = orders.length === 0
      ? 'Aún no hay pedidos. Los nuevos pedidos aparecerán aquí.'
      : currentFilter === 'pending'
        ? 'No hay platos pendientes. ¡Buen trabajo!'
        : 'No hay pedidos registrados.';
    updateSummary();
  }

  function loadData() {
    try {
      const savedTables = readStorage(tableStorageKey, []);
      const savedReservations = readStorage(reservationStorageKey, []);
      const savedOrders = readStorage(orderStorageKey, []);

      if (!Array.isArray(savedTables) || !Array.isArray(savedReservations) || !Array.isArray(savedOrders)) {
        throw new Error('Los datos guardados no tienen el formato esperado.');
      }

      const validOrders = savedOrders.every(function (order) {
        return order &&
          Number.isInteger(order.id) &&
          Number.isInteger(order.tableId) &&
          Array.isArray(order.items) &&
          order.items.length > 0 &&
          order.items.every(function (item) {
            return item &&
              typeof item.name === 'string' &&
              Number.isInteger(item.quantity) &&
              item.quantity > 0 &&
              (item.kitchenStatus === undefined ||
                ['Pendiente', 'En preparación', 'Listo'].includes(item.kitchenStatus));
          });
      });
      if (!validOrders) {
        throw new Error('Los pedidos guardados no tienen el formato esperado.');
      }

      tables = savedTables;
      reservations = savedReservations;
      orders = savedOrders.map(function (order) {
        return {
          ...order,
          items: order.items.map(function (item) {
            return {
              ...item,
              kitchenStatus: getKitchenStatus(order, item)
            };
          })
        };
      });
      setFeedback('');
      renderOrders();
    } catch (error) {
      setFeedback('No se pudieron cargar los datos del restaurante. Revisa el almacenamiento del navegador e inténtalo de nuevo.');
    }
  }

  function saveOrders(nextOrders) {
    try {
      window.localStorage.setItem(orderStorageKey, JSON.stringify(nextOrders));
      orders = nextOrders;
      setFeedback('');
      renderOrders();
    } catch (error) {
      setFeedback('No se pudo actualizar el pedido. Revisa el almacenamiento del navegador e inténtalo de nuevo.');
    }
  }

  orderContainer.addEventListener('click', function (event) {
    const button = event.target.closest('[data-kitchen-action="advance"]');
    if (!button) return;

    const orderId = Number(button.dataset.orderId);
    const itemIndex = Number(button.dataset.itemIndex);
    const order = orders.find(function (item) {
      return item.id === orderId;
    });
    if (!order || !order.items[itemIndex]) return;

    const nextStatus = getKitchenStatus(order, order.items[itemIndex]) === 'Pendiente'
      ? 'En preparación'
      : 'Listo';
    const updatedOrder = {
      ...order,
      items: order.items.map(function (item, index) {
        return index === itemIndex ? { ...item, kitchenStatus: nextStatus } : item;
      })
    };
    if (updatedOrder.items.every(function (item) {
      return getKitchenStatus(updatedOrder, item) === 'Listo';
    }) && updatedOrder.status !== 'Entregado') {
      updatedOrder.status = 'Preparado';
    } else if (updatedOrder.status === 'Preparado') {
      updatedOrder.status = 'Pendiente';
    }

    saveOrders(orders.map(function (item) {
      return item.id === orderId ? updatedOrder : item;
    }));
  });

  document.querySelectorAll('[data-kitchen-filter]').forEach(function (button) {
    button.addEventListener('click', function () {
      currentFilter = button.dataset.kitchenFilter;
      document.querySelectorAll('[data-kitchen-filter]').forEach(function (filter) {
        const selected = filter === button;
        filter.classList.toggle('is-active', selected);
        filter.setAttribute('aria-pressed', String(selected));
      });
      renderOrders();
    });
  });

  document.querySelector('[data-kitchen-open]').addEventListener('click', function () {
    document.querySelector('[data-admin-view-link="kitchen"]').click();
  });

  window.addEventListener('storage', function (event) {
    if ([orderStorageKey, tableStorageKey, reservationStorageKey, dispatchStorageKey].includes(event.key)) {
      loadData();
    }
  });

  loadData();
})();
