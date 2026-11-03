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
      { id: 'causa', name: 'Causa rellena', price: 15 }
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