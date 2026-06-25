// UI de mesas - Conexión con el módulo Tables

(function() {
  'use strict';

  // Renderizar grid de mesas
  function renderTablesGrid() {
    const grid = document.getElementById('tables-grid');
    if (!grid) return;

    const tables = Tables.getAll();
    const orders = Orders.getAll();

    grid.innerHTML = tables.map(table => {
      const order = table.currentOrder ? orders.find(o => o.id === table.currentOrder) : null;
      const statusClass = `mc-table-card--${table.status}`;
      const statusText = getStatusText(table.status);
      const time = table.status !== 'free' ? Tables.getOccupiedTime(table.number) : '';
      const total = order ? `$${order.total.toFixed(2)}` : '';

      return `
        <div class="mc-table-card ${statusClass}" onclick="handleTableClick(${table.number})">
          <div class="mc-table-card__number">${table.number}</div>
          <div class="mc-table-card__status">${statusText}</div>
          ${total ? `<div class="mc-table-card__info">${total}</div>` : ''}
          ${time ? `<div class="mc-table-card__time">${time}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  // Obtener texto de estado
  function getStatusText(status) {
    const texts = {
      'free': 'Libre',
      'occupied': 'Ocupada',
      'paying': 'Pagando'
    };
    return texts[status] || status;
  }

  // Manejar clic en mesa
  window.handleTableClick = function(number) {
    const table = Tables.getByNumber(number);
    if (!table) return;

    if (table.status === 'free') {
      openCreateOrderModal(number);
    } else {
      openTableDetailModal(number);
    }
  };

  // Abrir modal para crear pedido en mesa libre
  function openCreateOrderModal(tableNumber) {
    const modal = document.getElementById('modal-table');
    const modalNumber = document.getElementById('modal-table-number');
    const modalContent = document.getElementById('modal-table-content');

    modalNumber.textContent = tableNumber;
    modalContent.innerHTML = `
      <div class="mc-form-group">
        <label class="mc-label">Cliente</label>
        <input type="text" class="mc-input" id="table-customer" placeholder="Nombre opcional">
      </div>
      <div class="mc-form-group">
        <label class="mc-label">Seleccionar platillos</label>
        <div class="mc-inventory-grid" id="table-dishes-grid" style="max-height: 300px; overflow-y: auto;">
          <!-- Se llena dinámicamente -->
        </div>
      </div>
      <div class="mc-order-summary">
        <div class="mc-order-summary__total">Total: $0.00</div>
        <button class="mc-button" style="width: 100%; margin-top: 12px;" id="btn-create-table-order">Crear pedido</button>
      </div>
    `;

    // Llenar grid de platillos
    const dishesGrid = document.getElementById('table-dishes-grid');
    const dishes = Dishes.getAll();
    const cart = {};

    dishesGrid.innerHTML = dishes.map(dish => `
      <div class="mc-inventory-item">
        <div class="mc-slot">
          <img src="assets/1.21.11/items/${dish.icon}" alt="" class="mc-slot__img">
        </div>
        <div class="mc-inventory-item__name">${dish.name}</div>
        <div class="mc-inventory-item__meta">$${dish.price.toFixed(2)}</div>
        <div class="mc-quantity">
          <button onclick="updateTableCart('${dish.code}', -1)">-</button>
          <input type="text" value="0" readonly id="qty-${dish.code}">
          <button onclick="updateTableCart('${dish.code}', 1)">+</button>
        </div>
      </div>
    `).join('');

    // Manejar carrito
    window.updateTableCart = function(code, delta) {
      const current = cart[code] || 0;
      const newQty = Math.max(0, current + delta);
      
      if (newQty === 0) {
        delete cart[code];
      } else {
        cart[code] = newQty;
      }

      document.getElementById(`qty-${code}`).value = cart[code] || 0;
      updateTableOrderTotal(cart);
    };

    function updateTableOrderTotal(cart) {
      let total = 0;
      Object.entries(cart).forEach(([code, qty]) => {
        const dish = Dishes.getByCode(code);
        if (dish) {
          total += dish.price * qty;
        }
      });
      document.querySelector('.mc-order-summary__total').textContent = `Total: $${total.toFixed(2)}`;
    }

    // Crear pedido
    document.getElementById('btn-create-table-order').addEventListener('click', () => {
      const customer = document.getElementById('table-customer').value.trim();
      const items = Object.entries(cart).map(([code, quantity]) => ({ code, quantity }));

      if (items.length === 0) {
        MineFoodFeedback.showToast('Selecciona al menos un platillo.', 'warning');
        return;
      }

      try {
        const orderId = Orders.generateId();
        Orders.add({
          id: orderId,
          table: `Mesa ${tableNumber}`,
          customer: customer || 'Cliente de mesa',
          phone: '',
          status: 'pending',
          paymentMethod: 'cash',
          items: items
        });

        Tables.updateStatus(tableNumber, 'occupied', orderId);
        
        const order = Orders.getById(orderId);
        Tables.updateTotal(tableNumber, order.total);

        MineFoodFeedback.showToast(`Pedido ${orderId} creado para Mesa ${tableNumber}.`);
        renderTablesGrid();
        document.querySelector('[data-modal-close="modal-table"]').click();
      } catch (error) {
        MineFoodFeedback.showToast(error.message, 'error');
      }
    });

    modal.classList.add('is-open');
  }

  // Abrir modal de detalle de mesa ocupada
  function openTableDetailModal(tableNumber) {
    const table = Tables.getByNumber(tableNumber);
    const order = table.currentOrder ? Orders.getById(table.currentOrder) : null;
    
    if (!order) {
      MineFoodFeedback.showToast('No se encontró el pedido de esta mesa.', 'error');
      return;
    }

    const modal = document.getElementById('modal-table');
    const modalNumber = document.getElementById('modal-table-number');
    const modalContent = document.getElementById('modal-table-content');

    modalNumber.textContent = tableNumber;
    
    const statusMap = {
      'pending': { text: 'Pendiente', class: 'mc-badge--pending' },
      'preparing': { text: 'Preparando', class: 'mc-badge--preparing' },
      'ready': { text: 'Listo', class: 'mc-badge--ready' },
      'served': { text: 'Servido', class: 'mc-badge--served' },
      'paid': { text: 'Pagado', class: 'mc-badge--paid' }
    };

    const statusInfo = statusMap[order.status] || { text: order.status, class: '' };
    const statusBadge = `<span class="mc-badge ${statusInfo.class}">${statusInfo.text}</span>`;

    const itemsDetail = order.items.map(item => {
      const dish = Dishes.getByCode(item.code);
      const dishName = dish ? dish.name : item.code;
      return `${dishName} (${item.quantity})`;
    }).join(', ');

    modalContent.innerHTML = `
      <div class="mc-form-group">
        <label class="mc-label">Cliente</label>
        <div>${order.customer}</div>
      </div>
      <div class="mc-form-group">
        <label class="mc-label">Estado</label>
        <div>${statusBadge}</div>
      </div>
      <div class="mc-form-group">
        <label class="mc-label">Items</label>
        <div>${itemsDetail}</div>
      </div>
      <div class="mc-form-group">
        <label class="mc-label">Total</label>
        <div style="font-size: 18px; font-weight: bold;">$${order.total.toFixed(2)}</div>
      </div>
      <div class="mc-form-group">
        <label class="mc-label">Tiempo ocupado</label>
        <div>${Tables.getOccupiedTime(tableNumber)}</div>
      </div>
      <div style="display: flex; gap: 10px; margin-top: 16px;">
        <button class="mc-button mc-button--secondary" onclick="advanceTableOrderStatus('${order.id}')">Avanzar estado</button>
        <button class="mc-button" onclick="openPaymentModal('${order.id}', ${tableNumber})">Procesar pago</button>
      </div>
    `;

    modal.classList.add('is-open');
  }

  // Avanzar estado de pedido de mesa
  window.advanceTableOrderStatus = function(orderId) {
    const order = Orders.getById(orderId);
    if (!order) return;

    const statusOptions = ['pending', 'preparing', 'ready', 'served', 'paid'];
    const currentIndex = statusOptions.indexOf(order.status);
    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];

    try {
      // Si pasa a preparing, descontar inventario
      if (nextStatus === 'preparing' && order.status === 'pending') {
        if (!Orders.validateInventory(order.items)) {
          MineFoodFeedback.showToast('Inventario insuficiente para preparar los platillos.', 'error');
          return;
        }
        Orders.deductInventory(order.items);
      }

      Orders.updateStatus(orderId, nextStatus);
      
      // Si pasa a paid, liberar mesa
      if (nextStatus === 'paid') {
        const tableNumber = parseInt(order.table.replace('Mesa ', ''));
        Tables.updateStatus(tableNumber, 'free');
      }

      renderTablesGrid();
      document.querySelector('[data-modal-close="modal-table"]').click();
      MineFoodFeedback.showToast(`Pedido ${orderId} actualizado a ${nextStatus}.`);
    } catch (error) {
      MineFoodFeedback.showToast(error.message, 'error');
    }
  };

  // Abrir modal de pago
  window.openPaymentModal = function(orderId, tableNumber) {
    const order = Orders.getById(orderId);
    if (!order) return;

    const tableModal = document.getElementById('modal-table');
    tableModal.classList.remove('is-open');

    const paymentModal = document.getElementById('modal-payment');
    const paymentContent = document.getElementById('modal-payment-content');

    const itemsDetail = order.items.map(item => {
      const dish = Dishes.getByCode(item.code);
      const dishName = dish ? dish.name : item.code;
      return `${dishName} x${item.quantity}`;
    }).join(', ');

    paymentContent.innerHTML = `
      <div class="mc-payment-summary">
        <div class="mc-payment-summary__total">$${order.total.toFixed(2)}</div>
        <div class="mc-payment-summary__items">${itemsDetail}</div>
      </div>
      <div class="mc-payment-method">
        <label>Método de pago</label>
        <select class="mc-input mc-select" id="payment-method-select">
          <option value="cash">Efectivo</option>
          <option value="card">Tarjeta</option>
          <option value="transfer">Transferencia</option>
        </select>
      </div>
      <div class="mc-payment-method" id="cash-input-group">
        <label>Monto recibido</label>
        <input type="number" class="mc-input" id="payment-amount" placeholder="0.00" step="0.01">
      </div>
      <div class="mc-payment-change" id="payment-change"></div>
    `;

    // Manejar cambio de método de pago
    document.getElementById('payment-method-select').addEventListener('change', function() {
      const cashGroup = document.getElementById('cash-input-group');
      cashGroup.style.display = this.value === 'cash' ? 'block' : 'none';
      document.getElementById('payment-change').classList.remove('show');
    });

    // Calcular vuelto para efectivo
    document.getElementById('payment-amount').addEventListener('input', function() {
      const received = parseFloat(this.value) || 0;
      const change = received - order.total;
      const changeEl = document.getElementById('payment-change');
      
      if (received >= order.total) {
        changeEl.textContent = `Vuelto: $${change.toFixed(2)}`;
        changeEl.classList.add('show');
      } else {
        changeEl.classList.remove('show');
      }
    });

    // Confirmar pago
    document.getElementById('btn-confirm-payment').onclick = function() {
      const method = document.getElementById('payment-method-select').value;
      
      if (method === 'cash') {
        const received = parseFloat(document.getElementById('payment-amount').value) || 0;
        if (received < order.total) {
          MineFoodFeedback.showToast('El monto recibido es insuficiente.', 'error');
          return;
        }
      }

      try {
        Orders.updateStatus(orderId, 'paid');
        Tables.updateStatus(tableNumber, 'free');
        
        renderTablesGrid();
        paymentModal.classList.remove('is-open');
        MineFoodFeedback.showToast(`Pago completado para pedido ${orderId}.`);
      } catch (error) {
        MineFoodFeedback.showToast(error.message, 'error');
      }
    };

    paymentModal.classList.add('is-open');
  };

  // Actualizar título de página según vista
  function updatePageTitle(viewId) {
    const titles = {
      'view-dashboard': 'Dashboard Principal',
      'view-tables': 'Control de Mesas',
      'view-inventory': 'Gestión de Inventario',
      'view-dishes': 'Gestión de Platillos',
      'view-orders': 'Control de Pedidos',
      'view-reports': 'Reportes'
    };
    
    const titleEl = document.getElementById('page-title');
    if (titleEl && titles[viewId]) {
      titleEl.textContent = titles[viewId];
    }
  }

  // Inicializar
  document.addEventListener('DOMContentLoaded', function() {
    renderTablesGrid();
    
    // Actualizar al cambiar de vista
    window.addEventListener('viewChange', function(e) {
      if (e.detail.viewId === 'view-tables') {
        renderTablesGrid();
      }
      updatePageTitle(e.detail.viewId);
    });

    // Actualizar periódicamente el tiempo de mesas ocupadas
    setInterval(() => {
      if (document.getElementById('view-tables').classList.contains('active')) {
        renderTablesGrid();
      }
    }, 60000); // Cada minuto
  });
})();
