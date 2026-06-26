// UI de pedidos

(function() {
  'use strict';

  // Estados y sus badges
  const statusMap = {
    'pending': { text: 'Pendiente', class: 'mc-badge--pending' },
    'preparing': { text: 'Preparando', class: 'mc-badge--preparing' },
    'ready': { text: 'Listo', class: 'mc-badge--ready' },
    'served': { text: 'Servido', class: 'mc-badge--served' },
    'paid': { text: 'Pagado', class: 'mc-badge--paid' }
  };

  function renderOrdersTable(filter = '') {
    const grid = document.getElementById('orders-grid');
    if (!grid) return;

    let orders = Orders.getAll();

    if (filter) {
      orders = orders.filter(order => order.status === filter);
    }

    if (orders.length === 0) {
      grid.innerHTML = '<div class="mc-empty-state">No hay pedidos con este filtro. Crea un pedido nuevo para empezar.</div>';
      return;
    }

    grid.innerHTML = orders.map(order => {
      const statusInfo = statusMap[order.status] || { text: order.status, class: '' };
      const statusBadge = `<span class="mc-badge ${statusInfo.class}">${statusInfo.text}</span>`;
      
      const itemsDetail = order.items.map(item => {
        const dish = Dishes.getByCode(item.code);
        const dishName = dish ? dish.name : item.code;
        return `${dishName} (${item.quantity})`;
      }).join(', ');

      return `
        <div class="mc-inventory-item">
          <div class="mc-inventory-item__name">${order.id}</div>
          <div class="mc-inventory-item__meta">${order.table || order.customer || 'N/A'}</div>
          <div style="display: flex; align-items: center; gap: 6px; margin: 4px 0;">
            ${statusBadge}
          </div>
          <div class="mc-inventory-item__meta">$${order.total.toFixed(2)}</div>
          <div class="mc-inventory-item__meta" style="font-size: 10px;">${itemsDetail}</div>
          <button class="mc-button mc-button--secondary" onclick="updateOrderStatus('${order.id}')">Actualizar</button>
          <button class="mc-button mc-button--danger" onclick="deleteOrder('${order.id}')" style="margin-top: 8px;">Eliminar</button>
        </div>
      `;
    }).join('');
  }

  // Actualizar estado de pedido
  window.updateOrderStatus = function(id) {
    const order = Orders.getById(id);
    if (!order) return;

    const statusOptions = ['pending', 'preparing', 'ready', 'served'];
    const currentIndex = statusOptions.indexOf(order.status);
    const nextStatus = statusOptions[currentIndex + 1];

    if (!nextStatus) {
      MineFoodFeedback.showToast('El pedido ya está servido. Para cambiarlo a pagado usa el proceso de pago desde Mesas.', 'warning');
      return;
    }

    try {
      if (nextStatus === 'preparing' && order.status === 'pending') {
        if (!Orders.validateInventory(order.items)) {
          MineFoodFeedback.showToast('Inventario insuficiente para preparar los platillos.', 'error');
          return;
        }
        Orders.deductInventory(order.items);
      }

      Orders.updateStatus(id, nextStatus);
      renderOrdersTable();
      window.dispatchEvent(new CustomEvent('tablesChanged'));
      MineFoodFeedback.showToast(`Pedido ${id} actualizado a ${statusMap[nextStatus].text}.`);
    } catch (error) {
      MineFoodFeedback.showToast(error.message, 'error');
    }
  };

  // Variable para almacenar el ID del pedido a cancelar
  let orderToCancel = null;

  // Eliminar pedido (ahora abre modal de cancelación)
  window.deleteOrder = function(id) {
    orderToCancel = id;
    openModal('modal-cancel-order');
    
    // Mostrar campo de "Otro" cuando se selecciona esa opción
    const reasonSelect = document.getElementById('cancel-reason');
    const otherGroup = document.getElementById('cancel-reason-other-group');
    
    reasonSelect.onchange = function() {
      if (this.value === 'otro') {
        otherGroup.style.display = 'block';
      } else {
        otherGroup.style.display = 'none';
      }
    };
  };

  // Confirmar cancelación de pedido
  window.confirmCancelOrder = function() {
    const reasonSelect = document.getElementById('cancel-reason');
    const reason = reasonSelect.value;
    const otherReason = document.getElementById('cancel-reason-other').value;
    
    if (!reason) {
      MineFoodFeedback.showToast('Seleccione una razón de cancelación', 'error');
      return;
    }
    
    if (reason === 'otro' && !otherReason.trim()) {
      MineFoodFeedback.showToast('Especifique la razón de cancelación', 'error');
      return;
    }
    
    const finalReason = reason === 'otro' ? otherReason : reason;
    
    try {
      const order = Orders.getById(orderToCancel);
      Orders.cancel(orderToCancel, finalReason);

      if (order?.table?.startsWith('Mesa ')) {
        const tableNumber = parseInt(order.table.replace('Mesa ', ''));
        Tables.updateStatus(tableNumber, 'free');
      }

      closeModal('modal-cancel-order');
      renderOrdersTable();
      window.dispatchEvent(new CustomEvent('tablesChanged'));
      MineFoodFeedback.showToast('Pedido cancelado correctamente.');
      
      // Limpiar formulario
      reasonSelect.value = '';
      document.getElementById('cancel-reason-other').value = '';
      document.getElementById('cancel-reason-other-group').style.display = 'none';
      orderToCancel = null;
    } catch (error) {
      MineFoodFeedback.showToast(error.message, 'error');
    }
  };

  // Filtrar por estado
  function setupFilters() {
    const statusSelect = document.getElementById('orders-filter');
    if (!statusSelect) return;

    statusSelect.addEventListener('change', function() {
      renderOrdersTable(this.value);
    });
  }

  // Buscar pedido
  function setupSearch() {
    const searchInput = document.getElementById('orders-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const activeFilter = document.getElementById('orders-filter')?.value || '';
      let orders = Orders.getAll();

      if (activeFilter) {
        orders = orders.filter(order => order.status === activeFilter);
      }
      const filtered = orders.filter(order => 
        order.id.toLowerCase().includes(searchTerm) ||
        (order.table && order.table.toLowerCase().includes(searchTerm)) ||
        (order.customer && order.customer.toLowerCase().includes(searchTerm))
      );

      const tbody = document.getElementById('orders-table-body');
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
