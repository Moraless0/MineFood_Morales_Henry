// UI de pedidos - Conexión con el módulo Orders

(function() {
  'use strict';

  // Mapeo de estados a badges
  const statusMap = {
    'pending': { text: 'Pendiente', class: 'mc-badge--pending' },
    'preparing': { text: 'Preparando', class: 'mc-badge--preparing' },
    'ready': { text: 'Listo', class: 'mc-badge--ready' },
    'served': { text: 'Servido', class: 'mc-badge--served' },
    'paid': { text: 'Pagado', class: 'mc-badge--paid' }
  };

  // Renderizar tabla de pedidos
  function renderOrdersTable(filter = '') {
    const tbody = document.querySelector('.mc-table tbody');
    if (!tbody) return;

    let orders = Orders.getAll();

    // Filtrar por estado si se selecciona
    if (filter) {
      orders = orders.filter(order => order.status === filter);
    }

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="mc-empty-state">No hay pedidos con este filtro. Crea un pedido nuevo para empezar.</td></tr>';
      return;
    }

    tbody.innerHTML = orders.map(order => {
      const statusInfo = statusMap[order.status] || { text: order.status, class: '' };
      const statusBadge = `<span class="mc-badge ${statusInfo.class}">${statusInfo.text}</span>`;
      
      // Generar detalle de items
      const itemsDetail = order.items.map(item => {
        const dish = Dishes.getByCode(item.code);
        const dishName = dish ? dish.name : item.code;
        return `${dishName} (${item.quantity})`;
      }).join(', ');

      return `
        <tr>
          <td data-label="ID">${order.id}</td>
          <td data-label="Mesa">${order.table || order.customer || 'N/A'}</td>
          <td data-label="Estado">${statusBadge}</td>
          <td data-label="Pago">${getPaymentMethodLabel(order.paymentMethod)}</td>
          <td data-label="Total">$${order.total.toFixed(2)}</td>
          <td data-label="Detalle">${itemsDetail}</td>
          <td data-label="Acciones">
            <button class="mc-button mc-button--small mc-button--secondary" onclick="updateOrderStatus('${order.id}')">Actualizar</button>
            <button class="mc-button mc-button--small mc-button--danger" onclick="deleteOrder('${order.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Actualizar estado de pedido
  window.updateOrderStatus = function(id) {
    const order = Orders.getById(id);
    if (!order) return;

    const statusOptions = ['pending', 'preparing', 'ready', 'served', 'paid'];
    const currentIndex = statusOptions.indexOf(order.status);
    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];

    try {
      Orders.updateStatus(id, nextStatus);
      renderOrdersTable();
      MineFoodFeedback.showToast(`Pedido ${id} actualizado a ${statusMap[nextStatus].text}.`);
    } catch (error) {
      MineFoodFeedback.showToast(error.message, 'error');
    }
  };

  // Eliminar pedido
  window.deleteOrder = function(id) {
    if (MineFoodFeedback.confirmAction('¿Eliminar este pedido?')) {
      try {
        Orders.delete(id);
        renderOrdersTable();
        MineFoodFeedback.showToast('Pedido eliminado correctamente.');
      } catch (error) {
        MineFoodFeedback.showToast(error.message, 'error');
      }
    }
  };

  // Filtrar por estado
  function setupFilters() {
    const statusSelect = document.querySelector('.page-header select');
    if (!statusSelect) return;

    statusSelect.addEventListener('change', function() {
      renderOrdersTable(this.value);
    });
  }

  // Buscar pedido
  function setupSearch() {
    const searchInput = document.querySelector('.page-header input[type="text"]');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const activeFilter = document.querySelector('.page-header select')?.value || '';
      let orders = Orders.getAll();

      if (activeFilter) {
        orders = orders.filter(order => order.status === activeFilter);
      }
      const filtered = orders.filter(order => 
        order.id.toLowerCase().includes(searchTerm) ||
        (order.table && order.table.toLowerCase().includes(searchTerm)) ||
        (order.customer && order.customer.toLowerCase().includes(searchTerm))
      );

      const tbody = document.querySelector('.mc-table tbody');
      if (!tbody) return;

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="mc-empty-state">No se encontraron pedidos con ese criterio.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(order => {
        const statusInfo = statusMap[order.status] || { text: order.status, class: '' };
        const statusBadge = `<span class="mc-badge ${statusInfo.class}">${statusInfo.text}</span>`;
        
        const itemsDetail = order.items.map(item => {
          const dish = Dishes.getByCode(item.code);
          const dishName = dish ? dish.name : item.code;
          return `${dishName} (${item.quantity})`;
        }).join(', ');

        return `
          <tr>
            <td data-label="ID">${order.id}</td>
            <td data-label="Mesa">${order.table || order.customer || 'N/A'}</td>
            <td data-label="Estado">${statusBadge}</td>
            <td data-label="Pago">${getPaymentMethodLabel(order.paymentMethod)}</td>
            <td data-label="Total">$${order.total.toFixed(2)}</td>
            <td data-label="Detalle">${itemsDetail}</td>
            <td data-label="Acciones">
              <button class="mc-button mc-button--small mc-button--secondary" onclick="updateOrderStatus('${order.id}')">Actualizar</button>
              <button class="mc-button mc-button--small mc-button--danger" onclick="deleteOrder('${order.id}')">Eliminar</button>
            </td>
          </tr>
        `;
      }).join('');
    });
  }

  // Inicializar
  document.addEventListener('DOMContentLoaded', function() {
    renderOrdersTable();
    setupFilters();
    setupSearch();
  });

  // Actualizar cuando la vista de pedidos se active
  window.addEventListener('viewChange', function(e) {
    if (e.detail.viewId === 'view-orders') {
      renderOrdersTable();
      setupFilters();
      setupSearch();
    }
  });
  // Obtener etiqueta de método de pago
  function getPaymentMethodLabel(method) {
    const labels = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia'
    };
    return labels[method] || method || 'N/A';
  }

})();
