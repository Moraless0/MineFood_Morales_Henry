// UI de mesas

(function() {
  'use strict';

  function renderTablesGrid() {
    const grid = document.getElementById('tables-grid');
    if (!grid) return;

    const tables = Tables.getAll();
    const orders = Orders.getAll();

    grid.innerHTML = tables.map(table => {
      const order = table.currentOrder ? orders.find(o => o.id === table.currentOrder) : null;
      const visualStatus = getTableVisualStatus(table, order);
      const statusClass = `mc-table-card--${visualStatus}`;
      const statusText = getStatusText(visualStatus);
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

  function getTableVisualStatus(table, order) {
    if (table.status === 'free') return 'free';
    if (table.status === 'paying') return 'paying';
    return order?.status || 'occupied';
  }

  // Obtener texto de estado
  function getStatusText(status) {
    const texts = {
      'free': 'Libre',
      'occupied': 'Ocupada',
      'pending': 'Pendiente',
      'preparing': 'Preparando',
      'ready': 'Listo',
      'served': 'Servido',
      'paying': 'Pagando',
      'paid': 'Pagado'
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
        <input type="text" class="mc-input" id="table-customer" placeholder="Nombre del cliente" pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+" title="Solo se permiten letras">
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

      if (!customer) {
        MineFoodFeedback.showToast('El nombre del cliente es obligatorio.', 'error');
        return;
      }

      // Validar que solo contenga letras y espacios
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(customer)) {
        MineFoodFeedback.showToast('El nombre solo debe contener letras.', 'error');
        return;
      }

      if (items.length === 0) {
        MineFoodFeedback.showToast('Selecciona al menos un platillo.', 'warning');
        return;
      }

      try {
        const orderId = Orders.generateId();
        Orders.add({
          id: orderId,
          table: `Mesa ${tableNumber}`,
          customer: customer,
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

    // Limpiar contenido anterior
    modalContent.replaceChildren();

    // Información del pedido compacta
    const orderInfo = document.createElement('div');
    orderInfo.style.display = 'flex';
    orderInfo.style.justifyContent = 'space-between';
    orderInfo.style.marginBottom = '16px';
    orderInfo.style.fontSize = '12px';
    orderInfo.style.color = '#666';

    const customerInfo = document.createElement('div');
    const customerLabel = document.createElement('strong');
    customerLabel.textContent = 'Cliente: ';
    const customerText = document.createTextNode(order.customer);
    customerInfo.appendChild(customerLabel);
    customerInfo.appendChild(customerText);

    const tableInfo = document.createElement('div');
    const tableLabel = document.createElement('strong');
    tableLabel.textContent = 'Mesa: ';
    const tableText = document.createTextNode(order.table);
    tableInfo.appendChild(tableLabel);
    tableInfo.appendChild(tableText);

    const orderIdInfo = document.createElement('div');
    const orderIdLabel = document.createElement('strong');
    orderIdLabel.textContent = 'Pedido: ';
    const orderIdText = document.createTextNode(order.id);
    orderIdInfo.appendChild(orderIdLabel);
    orderIdInfo.appendChild(orderIdText);

    orderInfo.appendChild(customerInfo);
    orderInfo.appendChild(tableInfo);
    orderInfo.appendChild(orderIdInfo);
    modalContent.appendChild(orderInfo);

    // Estado - badge grande y centrado
    const statusGroup = document.createElement('div');
    statusGroup.style.textAlign = 'center';
    statusGroup.style.marginBottom = '20px';
    const statusBadge = document.createElement('div');
    statusBadge.innerHTML = statusInfo.text;
    statusBadge.style.fontSize = '18px';
    statusBadge.style.fontWeight = 'bold';
    statusBadge.style.padding = '8px 16px';
    statusBadge.style.borderRadius = '4px';
    statusBadge.style.display = 'inline-block';
    
    // Colores según estado
    const statusColors = {
      'pending': '#f59e0b',
      'preparing': '#3b82f6',
      'ready': '#10b981',
      'served': '#8b5cf6',
      'paid': '#22c55e'
    };
    statusBadge.style.backgroundColor = statusColors[order.status] || '#666';
    statusBadge.style.color = '#fff';
    
    statusGroup.appendChild(statusBadge);
    modalContent.appendChild(statusGroup);

    // Tabla de productos
    const itemsTable = document.createElement('table');
    itemsTable.className = 'mc-table';
    itemsTable.style.width = '100%';
    itemsTable.style.borderCollapse = 'collapse';
    itemsTable.style.marginBottom = '16px';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.borderBottom = '2px solid #5c5c5c';
    const thProduct = document.createElement('th');
    thProduct.textContent = 'Producto';
    thProduct.style.textAlign = 'left';
    thProduct.style.padding = '8px';
    const thQty = document.createElement('th');
    thQty.textContent = 'Cant.';
    thQty.style.textAlign = 'center';
    thQty.style.padding = '8px';
    const thPrice = document.createElement('th');
    thPrice.textContent = 'Precio unit.';
    thPrice.style.textAlign = 'right';
    thPrice.style.padding = '8px';
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Subtotal';
    thTotal.style.textAlign = 'right';
    thTotal.style.padding = '8px';
    headerRow.appendChild(thProduct);
    headerRow.appendChild(thQty);
    headerRow.appendChild(thPrice);
    headerRow.appendChild(thTotal);
    thead.appendChild(headerRow);
    itemsTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    order.items.forEach(item => {
      const dish = Dishes.getByCode(item.code);
      const dishName = dish ? dish.name : item.code;
      const dishPrice = dish ? Utils.roundToDecimals(dish.price) : 0;
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #ddd';
      const tdProduct = document.createElement('td');
      tdProduct.textContent = dishName;
      tdProduct.style.padding = '8px';
      const tdQty = document.createElement('td');
      tdQty.textContent = item.quantity;
      tdQty.style.textAlign = 'center';
      tdQty.style.padding = '8px';
      const tdPrice = document.createElement('td');
      tdPrice.textContent = `$${Utils.formatPrice(dishPrice)}`;
      tdPrice.style.textAlign = 'right';
      tdPrice.style.padding = '8px';
      const tdTotal = document.createElement('td');
      const subtotal = Utils.calculateSubtotal(dishPrice, item.quantity);
      tdTotal.textContent = `$${Utils.formatPrice(subtotal)}`;
      tdTotal.style.textAlign = 'right';
      tdTotal.style.padding = '8px';
      row.appendChild(tdProduct);
      row.appendChild(tdQty);
      row.appendChild(tdPrice);
      row.appendChild(tdTotal);
      tbody.appendChild(row);
    });
    itemsTable.appendChild(tbody);
    modalContent.appendChild(itemsTable);

    // Total
    const totalGroup = document.createElement('div');
    totalGroup.style.display = 'flex';
    totalGroup.style.justifyContent = 'flex-end';
    totalGroup.style.marginBottom = '16px';
    const totalLabel = document.createElement('div');
    totalLabel.style.fontSize = '16px';
    totalLabel.style.marginRight = '16px';
    totalLabel.textContent = 'Total:';
    const totalValue = document.createElement('div');
    totalValue.style.fontSize = '24px';
    totalValue.style.fontWeight = 'bold';
    totalValue.textContent = `$${Utils.formatPrice(order.total)}`;
    totalGroup.appendChild(totalLabel);
    totalGroup.appendChild(totalValue);
    modalContent.appendChild(totalGroup);

    // Tiempo ocupado
    const timeGroup = document.createElement('div');
    timeGroup.style.display = 'flex';
    timeGroup.style.justifyContent = 'flex-end';
    timeGroup.style.marginBottom = '16px';
    timeGroup.style.fontSize = '12px';
    timeGroup.style.color = '#666';
    const timeLabel = document.createElement('div');
    timeLabel.style.marginRight = '16px';
    timeLabel.textContent = 'Tiempo ocupado:';
    const timeValue = document.createElement('div');
    timeValue.textContent = Tables.getOccupiedTime(tableNumber);
    timeGroup.appendChild(timeLabel);
    timeGroup.appendChild(timeValue);
    modalContent.appendChild(timeGroup);

    // Botones de acción según estado
    const buttonsGroup = document.createElement('div');
    buttonsGroup.style.display = 'flex';
    buttonsGroup.style.justifyContent = 'center';
    buttonsGroup.style.gap = '12px';
    buttonsGroup.style.marginTop = '20px';
    buttonsGroup.style.flexWrap = 'wrap';
    
    // Botón de estado de cuenta (siempre visible)
    const statementButton = document.createElement('button');
    statementButton.className = 'mc-button mc-button--secondary';
    statementButton.style.flex = '1';
    statementButton.style.minWidth = '150px';
    statementButton.style.display = 'flex';
    statementButton.style.alignItems = 'center';
    statementButton.style.justifyContent = 'center';
    statementButton.style.gap = '8px';
    
    const statementIcon = document.createElement('img');
    statementIcon.src = 'assets/1.21.11/items/paper.png';
    statementIcon.alt = 'Estado de cuenta';
    statementIcon.style.width = '16px';
    statementIcon.style.height = '16px';
    
    const statementText = document.createTextNode('Estado de cuenta');
    statementButton.appendChild(statementIcon);
    statementButton.appendChild(statementText);
    statementButton.onclick = () => showStatement(order.id, tableNumber);
    buttonsGroup.appendChild(statementButton);
    
    // Botón de avanzar estado (solo si no está pagado)
    if (order.status !== 'paid') {
      const advanceButton = document.createElement('button');
      advanceButton.className = 'mc-button mc-button--secondary';
      advanceButton.style.flex = '1';
      advanceButton.style.minWidth = '150px';
      advanceButton.style.display = 'flex';
      advanceButton.style.alignItems = 'center';
      advanceButton.style.justifyContent = 'center';
      advanceButton.style.gap = '8px';
      
      const advanceIcon = document.createElement('img');
      advanceIcon.src = 'assets/1.21.11/items/arrow.png';
      advanceIcon.alt = 'Avanzar estado';
      advanceIcon.style.width = '16px';
      advanceIcon.style.height = '16px';
      
      const advanceText = document.createTextNode('Avanzar estado');
      advanceButton.appendChild(advanceIcon);
      advanceButton.appendChild(advanceText);
      advanceButton.onclick = () => advanceTableOrderStatus(order.id);
      buttonsGroup.appendChild(advanceButton);
    }
    
    // Botón de procesar pago (solo si está servido)
    if (order.status === 'served') {
      const paymentButton = document.createElement('button');
      paymentButton.className = 'mc-button';
      paymentButton.style.flex = '1';
      paymentButton.style.minWidth = '150px';
      paymentButton.style.backgroundColor = '#22c55e';
      paymentButton.style.color = '#fff';
      paymentButton.style.display = 'flex';
      paymentButton.style.alignItems = 'center';
      paymentButton.style.justifyContent = 'center';
      paymentButton.style.gap = '8px';
      
      const paymentIcon = document.createElement('img');
      paymentIcon.src = 'assets/1.21.11/items/gold_ingot.png';
      paymentIcon.alt = 'Procesar pago';
      paymentIcon.style.width = '16px';
      paymentIcon.style.height = '16px';
      
      const paymentText = document.createTextNode('Procesar pago');
      paymentButton.appendChild(paymentIcon);
      paymentButton.appendChild(paymentText);
      paymentButton.onclick = () => openPaymentModal(order.id, tableNumber);
      buttonsGroup.appendChild(paymentButton);
    }
    
    modalContent.appendChild(buttonsGroup);

    modal.classList.add('is-open');
  }

  // Mostrar factura
  window.showInvoice = function(orderId, tableNumber, paymentMethod, receivedAmount) {
    const order = Orders.getById(orderId);
    if (!order) return;

    const modal = document.getElementById('modal-invoice');
    const modalContent = document.getElementById('modal-invoice-content');

    // Limpiar contenido anterior
    modalContent.replaceChildren();

    // Generar número de factura
    const invoiceNumber = `FAC-${Date.now().toString().slice(-8)}`;
    const invoiceDate = new Date().toLocaleString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Guardar factura en localStorage
    const invoiceData = {
      number: invoiceNumber,
      date: invoiceDate,
      orderId: orderId,
      customer: order.customer,
      table: order.table,
      items: order.items,
      total: order.total,
      paymentMethod: paymentMethod,
      receivedAmount: receivedAmount
    };
    Invoices.add(invoiceData);

    // Crear elementos de la factura
    const headerGroup = document.createElement('div');
    headerGroup.style.marginBottom = '16px';
    headerGroup.style.borderBottom = '2px solid #5c5c5c';
    headerGroup.style.paddingBottom = '12px';
    
    // Logo de la app - arriba del todo
    const logoImg = document.createElement('img');
    logoImg.src = 'assets/images/minefood.png';
    logoImg.alt = 'MineFood';
    logoImg.style.maxWidth = '100%';
    logoImg.style.display = 'block';
    logoImg.style.margin = '0 auto 16px auto';
    
    // Información del restaurante - debajo del logo
    const restaurantInfo = document.createElement('div');
    restaurantInfo.style.textAlign = 'center';
    restaurantInfo.style.marginBottom = '12px';
    restaurantInfo.style.fontSize = '12px';
    restaurantInfo.style.color = '#666';
    
    const restaurantName = document.createElement('div');
    restaurantName.textContent = 'RESTAURANTE MINEFOOD';
    restaurantName.style.fontWeight = 'bold';
    restaurantName.style.fontSize = '16px';
    restaurantName.style.marginBottom = '6px';
    restaurantName.style.color = '#333';
    
    const restaurantAddress = document.createElement('div');
    restaurantAddress.textContent = '14 Avenida 5-32 Zona 1, 01001 Ciudad de Guatemala, Guatemala';
    restaurantAddress.style.marginBottom = '4px';
    
    const restaurantPhone = document.createElement('div');
    restaurantPhone.textContent = 'Teléfono: 123-456-7890';
    
    restaurantInfo.appendChild(restaurantName);
    restaurantInfo.appendChild(restaurantAddress);
    restaurantInfo.appendChild(restaurantPhone);
    
    // Información de la factura
    const invoiceInfo = document.createElement('div');
    invoiceInfo.style.display = 'flex';
    invoiceInfo.style.justifyContent = 'space-between';
    invoiceInfo.style.fontSize = '12px';
    invoiceInfo.style.marginBottom = '8px';
    
    const invoiceDateEl = document.createElement('div');
    invoiceDateEl.textContent = invoiceDate;
    
    const invoiceNumberEl = document.createElement('div');
    invoiceNumberEl.textContent = `Factura: ${invoiceNumber}`;
    
    invoiceInfo.appendChild(invoiceDateEl);
    invoiceInfo.appendChild(invoiceNumberEl);
    
    headerGroup.appendChild(logoImg);
    headerGroup.appendChild(restaurantInfo);
    headerGroup.appendChild(invoiceInfo);
    modalContent.appendChild(headerGroup);

    // Información del pedido compacta
    const orderInfo = document.createElement('div');
    orderInfo.style.display = 'flex';
    orderInfo.style.justifyContent = 'space-between';
    orderInfo.style.marginBottom = '16px';
    orderInfo.style.fontSize = '12px';
    orderInfo.style.color = '#666';

    const customerInfo = document.createElement('div');
    const customerLabel = document.createElement('strong');
    customerLabel.textContent = 'Cliente: ';
    const customerText = document.createTextNode(order.customer);
    customerInfo.appendChild(customerLabel);
    customerInfo.appendChild(customerText);

    const tableInfo = document.createElement('div');
    const tableLabel = document.createElement('strong');
    tableLabel.textContent = 'Mesa: ';
    const tableText = document.createTextNode(order.table);
    tableInfo.appendChild(tableLabel);
    tableInfo.appendChild(tableText);

    const orderIdInfo = document.createElement('div');
    const orderIdLabel = document.createElement('strong');
    orderIdLabel.textContent = 'Pedido: ';
    const orderIdText = document.createTextNode(order.id);
    orderIdInfo.appendChild(orderIdLabel);
    orderIdInfo.appendChild(orderIdText);

    orderInfo.appendChild(customerInfo);
    orderInfo.appendChild(tableInfo);
    orderInfo.appendChild(orderIdInfo);
    modalContent.appendChild(orderInfo);

    const itemsTable = document.createElement('table');
    itemsTable.className = 'mc-table';
    itemsTable.style.width = '100%';
    itemsTable.style.borderCollapse = 'collapse';
    itemsTable.style.marginBottom = '16px';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.borderBottom = '2px solid #5c5c5c';
    const thProduct = document.createElement('th');
    thProduct.textContent = 'Producto';
    thProduct.style.textAlign = 'left';
    thProduct.style.padding = '8px';
    const thQty = document.createElement('th');
    thQty.textContent = 'Cant.';
    thQty.style.textAlign = 'center';
    thQty.style.padding = '8px';
    const thPrice = document.createElement('th');
    thPrice.textContent = 'Precio unit.';
    thPrice.style.textAlign = 'right';
    thPrice.style.padding = '8px';
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Subtotal';
    thTotal.style.textAlign = 'right';
    thTotal.style.padding = '8px';
    headerRow.appendChild(thProduct);
    headerRow.appendChild(thQty);
    headerRow.appendChild(thPrice);
    headerRow.appendChild(thTotal);
    thead.appendChild(headerRow);
    itemsTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    order.items.forEach(item => {
      const dish = Dishes.getByCode(item.code);
      const dishName = dish ? dish.name : item.code;
      const dishPrice = dish ? Utils.roundToDecimals(dish.price) : 0;
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #ddd';
      const tdProduct = document.createElement('td');
      tdProduct.textContent = dishName;
      tdProduct.style.padding = '8px';
      const tdQty = document.createElement('td');
      tdQty.textContent = item.quantity;
      tdQty.style.textAlign = 'center';
      tdQty.style.padding = '8px';
      const tdPrice = document.createElement('td');
      tdPrice.textContent = `$${Utils.formatPrice(dishPrice)}`;
      tdPrice.style.textAlign = 'right';
      tdPrice.style.padding = '8px';
      const tdTotal = document.createElement('td');
      const subtotal = Utils.calculateSubtotal(dishPrice, item.quantity);
      tdTotal.textContent = `$${Utils.formatPrice(subtotal)}`;
      tdTotal.style.textAlign = 'right';
      tdTotal.style.padding = '8px';
      row.appendChild(tdProduct);
      row.appendChild(tdQty);
      row.appendChild(tdPrice);
      row.appendChild(tdTotal);
      tbody.appendChild(row);
    });
    itemsTable.appendChild(tbody);
    modalContent.appendChild(itemsTable);

    const totalGroup = document.createElement('div');
    totalGroup.style.display = 'flex';
    totalGroup.style.justifyContent = 'flex-end';
    totalGroup.style.marginBottom = '16px';
    const totalLabel = document.createElement('div');
    totalLabel.style.fontSize = '16px';
    totalLabel.style.marginRight = '16px';
    totalLabel.textContent = 'Total:';
    const totalValue = document.createElement('div');
    totalValue.style.fontSize = '24px';
    totalValue.style.fontWeight = 'bold';
    totalValue.textContent = `$${Utils.formatPrice(order.total)}`;
    totalGroup.appendChild(totalLabel);
    totalGroup.appendChild(totalValue);
    modalContent.appendChild(totalGroup);

    const paymentGroup = document.createElement('div');
    paymentGroup.style.display = 'flex';
    paymentGroup.style.justifyContent = 'flex-end';
    paymentGroup.style.marginBottom = '16px';
    paymentGroup.style.fontSize = '12px';
    paymentGroup.style.color = '#666';
    const paymentLabel = document.createElement('div');
    paymentLabel.style.marginRight = '16px';
    paymentLabel.textContent = 'Método de pago:';
    const paymentValue = document.createElement('div');
    const paymentMethods = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia'
    };
    paymentValue.textContent = paymentMethods[paymentMethod] || paymentMethod;
    paymentGroup.appendChild(paymentLabel);
    paymentGroup.appendChild(paymentValue);
    modalContent.appendChild(paymentGroup);

    let receivedGroup = null;
    let changeGroup = null;

    if (paymentMethod === 'cash' && receivedAmount) {
      receivedGroup = document.createElement('div');
      receivedGroup.style.display = 'flex';
      receivedGroup.style.justifyContent = 'flex-end';
      receivedGroup.style.marginBottom = '8px';
      receivedGroup.style.fontSize = '12px';
      receivedGroup.style.color = '#666';
      const receivedLabel = document.createElement('div');
      receivedLabel.style.marginRight = '16px';
      receivedLabel.textContent = 'Monto recibido:';
      const receivedValue = document.createElement('div');
      receivedValue.textContent = `$${Utils.formatPrice(receivedAmount)}`;
      receivedGroup.appendChild(receivedLabel);
      receivedGroup.appendChild(receivedValue);

      changeGroup = document.createElement('div');
      changeGroup.style.display = 'flex';
      changeGroup.style.justifyContent = 'flex-end';
      changeGroup.style.marginBottom = '16px';
      changeGroup.style.fontSize = '12px';
      changeGroup.style.color = '#666';
      const changeLabel = document.createElement('div');
      changeLabel.style.marginRight = '16px';
      changeLabel.textContent = 'Vuelto:';
      const changeValue = document.createElement('div');
      changeValue.style.fontWeight = 'bold';
      const change = Utils.roundToDecimals(receivedAmount - order.total);
      changeValue.textContent = `$${Utils.formatPrice(change)}`;
      changeGroup.appendChild(changeLabel);
      changeGroup.appendChild(changeValue);
    }

    // Agregar monto recibido y vuelto al final si es efectivo
    if (receivedGroup && changeGroup) {
      modalContent.appendChild(receivedGroup);
      modalContent.appendChild(changeGroup);
    }

    // Mensaje final de agradecimiento
    const footerMessage = document.createElement('div');
    footerMessage.style.textAlign = 'center';
    footerMessage.style.marginTop = '24px';
    footerMessage.style.paddingTop = '16px';
    footerMessage.style.borderTop = '2px solid #5c5c5c';
    
    const thanksMessage = document.createElement('div');
    thanksMessage.textContent = 'GRACIAS POR SU VISITA';
    thanksMessage.style.fontSize = '14px';
    thanksMessage.style.fontWeight = 'bold';
    thanksMessage.style.marginBottom = '4px';
    
    const seeYouMessage = document.createElement('div');
    seeYouMessage.textContent = 'HASTA PRONTO';
    seeYouMessage.style.fontSize = '14px';
    seeYouMessage.style.fontWeight = 'bold';
    
    footerMessage.appendChild(thanksMessage);
    footerMessage.appendChild(seeYouMessage);
    modalContent.appendChild(footerMessage);

    modal.classList.add('is-open');
  };

  // Mostrar historial de facturas
  window.showInvoiceHistory = function() {
    const modal = document.getElementById('modal-invoice-history');
    const modalContent = document.getElementById('modal-invoice-history-content');

    // Limpiar contenido anterior
    modalContent.replaceChildren();

    const invoices = Invoices.getAll();

    if (invoices.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No hay facturas registradas.';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.padding = '20px';
      emptyMessage.style.color = '#888';
      modalContent.appendChild(emptyMessage);
      modal.classList.add('is-open');
      return;
    }

    // Crear tabla de facturas
    const table = document.createElement('table');
    table.className = 'mc-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const thNumber = document.createElement('th');
    thNumber.textContent = 'No. Factura';
    const thDate = document.createElement('th');
    thDate.textContent = 'Fecha';
    const thCustomer = document.createElement('th');
    thCustomer.textContent = 'Cliente';
    const thTable = document.createElement('th');
    thTable.textContent = 'Mesa';
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Total';
    const thAction = document.createElement('th');
    thAction.textContent = 'Acción';
    headerRow.appendChild(thNumber);
    headerRow.appendChild(thDate);
    headerRow.appendChild(thCustomer);
    headerRow.appendChild(thTable);
    headerRow.appendChild(thTotal);
    headerRow.appendChild(thAction);
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    
    // Ordenar facturas por fecha (más recientes primero)
    const sortedInvoices = [...invoices].reverse();

    sortedInvoices.forEach(invoice => {
      const row = document.createElement('tr');
      
      const tdNumber = document.createElement('td');
      tdNumber.textContent = invoice.number;
      
      const tdDate = document.createElement('td');
      tdDate.textContent = invoice.date;
      
      const tdCustomer = document.createElement('td');
      tdCustomer.textContent = invoice.customer;
      
      const tdTable = document.createElement('td');
      tdTable.textContent = invoice.table;
      
      const tdTotal = document.createElement('td');
      tdTotal.textContent = `$${invoice.total.toFixed(2)}`;
      
      const tdAction = document.createElement('td');
      const viewButton = document.createElement('button');
      viewButton.className = 'mc-button mc-button--secondary';
      viewButton.textContent = 'Ver';
      viewButton.onclick = function() {
        modal.classList.remove('is-open');
        showInvoiceFromHistory(invoice);
      };
      tdAction.appendChild(viewButton);
      
      row.appendChild(tdNumber);
      row.appendChild(tdDate);
      row.appendChild(tdCustomer);
      row.appendChild(tdTable);
      row.appendChild(tdTotal);
      row.appendChild(tdAction);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    modalContent.appendChild(table);

    modal.classList.add('is-open');
  };

  // Mostrar factura desde el historial
  function showInvoiceFromHistory(invoice) {
    const modal = document.getElementById('modal-invoice');
    const modalContent = document.getElementById('modal-invoice-content');

    // Limpiar contenido anterior
    modalContent.replaceChildren();

    // Crear elementos de la factura
    const headerGroup = document.createElement('div');
    headerGroup.style.marginBottom = '16px';
    headerGroup.style.borderBottom = '2px solid #5c5c5c';
    headerGroup.style.paddingBottom = '12px';
    
    // Logo de la app - arriba del todo
    const logoImg = document.createElement('img');
    logoImg.src = 'assets/images/minefood.png';
    logoImg.alt = 'MineFood';
    logoImg.style.maxWidth = '100%';
    logoImg.style.display = 'block';
    logoImg.style.margin = '0 auto 16px auto';
    
    // Información del restaurante - debajo del logo
    const restaurantInfo = document.createElement('div');
    restaurantInfo.style.textAlign = 'center';
    restaurantInfo.style.marginBottom = '12px';
    restaurantInfo.style.fontSize = '12px';
    restaurantInfo.style.color = '#666';
    
    const restaurantName = document.createElement('div');
    restaurantName.textContent = 'RESTAURANTE MINEFOOD';
    restaurantName.style.fontWeight = 'bold';
    restaurantName.style.fontSize = '16px';
    restaurantName.style.marginBottom = '6px';
    restaurantName.style.color = '#333';
    
    const restaurantAddress = document.createElement('div');
    restaurantAddress.textContent = '14 Avenida 5-32 Zona 1, 01001 Ciudad de Guatemala, Guatemala';
    restaurantAddress.style.marginBottom = '4px';
    
    const restaurantPhone = document.createElement('div');
    restaurantPhone.textContent = 'Teléfono: 123-456-7890';
    
    restaurantInfo.appendChild(restaurantName);
    restaurantInfo.appendChild(restaurantAddress);
    restaurantInfo.appendChild(restaurantPhone);
    
    // Información de la factura
    const invoiceInfo = document.createElement('div');
    invoiceInfo.style.display = 'flex';
    invoiceInfo.style.justifyContent = 'space-between';
    invoiceInfo.style.fontSize = '12px';
    invoiceInfo.style.marginBottom = '8px';
    
    const invoiceDateEl = document.createElement('div');
    invoiceDateEl.textContent = invoice.date;
    
    const invoiceNumberEl = document.createElement('div');
    invoiceNumberEl.textContent = `Factura: ${invoice.number}`;
    
    invoiceInfo.appendChild(invoiceDateEl);
    invoiceInfo.appendChild(invoiceNumberEl);
    
    headerGroup.appendChild(logoImg);
    headerGroup.appendChild(restaurantInfo);
    headerGroup.appendChild(invoiceInfo);
    modalContent.appendChild(headerGroup);

    // Información del pedido compacta
    const orderInfo = document.createElement('div');
    orderInfo.style.display = 'flex';
    orderInfo.style.justifyContent = 'space-between';
    orderInfo.style.marginBottom = '16px';
    orderInfo.style.fontSize = '12px';
    orderInfo.style.color = '#666';

    const customerInfo = document.createElement('div');
    const customerLabel = document.createElement('strong');
    customerLabel.textContent = 'Cliente: ';
    const customerText = document.createTextNode(invoice.customer);
    customerInfo.appendChild(customerLabel);
    customerInfo.appendChild(customerText);

    const tableInfo = document.createElement('div');
    const tableLabel = document.createElement('strong');
    tableLabel.textContent = 'Mesa: ';
    const tableText = document.createTextNode(invoice.table);
    tableInfo.appendChild(tableLabel);
    tableInfo.appendChild(tableText);

    const orderIdInfo = document.createElement('div');
    const orderIdLabel = document.createElement('strong');
    orderIdLabel.textContent = 'Pedido: ';
    const orderIdText = document.createTextNode(invoice.orderId);
    orderIdInfo.appendChild(orderIdLabel);
    orderIdInfo.appendChild(orderIdText);

    orderInfo.appendChild(customerInfo);
    orderInfo.appendChild(tableInfo);
    orderInfo.appendChild(orderIdInfo);
    modalContent.appendChild(orderInfo);

    const itemsTable = document.createElement('table');
    itemsTable.className = 'mc-table';
    itemsTable.style.width = '100%';
    itemsTable.style.borderCollapse = 'collapse';
    itemsTable.style.marginBottom = '16px';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.borderBottom = '2px solid #5c5c5c';
    const thProduct = document.createElement('th');
    thProduct.textContent = 'Producto';
    thProduct.style.textAlign = 'left';
    thProduct.style.padding = '8px';
    const thQty = document.createElement('th');
    thQty.textContent = 'Cant.';
    thQty.style.textAlign = 'center';
    thQty.style.padding = '8px';
    const thPrice = document.createElement('th');
    thPrice.textContent = 'Precio unit.';
    thPrice.style.textAlign = 'right';
    thPrice.style.padding = '8px';
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Subtotal';
    thTotal.style.textAlign = 'right';
    thTotal.style.padding = '8px';
    headerRow.appendChild(thProduct);
    headerRow.appendChild(thQty);
    headerRow.appendChild(thPrice);
    headerRow.appendChild(thTotal);
    thead.appendChild(headerRow);
    itemsTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    invoice.items.forEach(item => {
      const dish = Dishes.getByCode(item.code);
      const dishName = dish ? dish.name : item.code;
      const dishPrice = dish ? dish.price : 0;
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #ddd';
      const tdProduct = document.createElement('td');
      tdProduct.textContent = dishName;
      tdProduct.style.padding = '8px';
      const tdQty = document.createElement('td');
      tdQty.textContent = item.quantity;
      tdQty.style.textAlign = 'center';
      tdQty.style.padding = '8px';
      const tdPrice = document.createElement('td');
      tdPrice.textContent = `$${dishPrice.toFixed(2)}`;
      tdPrice.style.textAlign = 'right';
      tdPrice.style.padding = '8px';
      const tdTotal = document.createElement('td');
      tdTotal.textContent = `$${(dishPrice * item.quantity).toFixed(2)}`;
      tdTotal.style.textAlign = 'right';
      tdTotal.style.padding = '8px';
      row.appendChild(tdProduct);
      row.appendChild(tdQty);
      row.appendChild(tdPrice);
      row.appendChild(tdTotal);
      tbody.appendChild(row);
    });
    itemsTable.appendChild(tbody);
    modalContent.appendChild(itemsTable);

    const totalGroup = document.createElement('div');
    totalGroup.style.display = 'flex';
    totalGroup.style.justifyContent = 'flex-end';
    totalGroup.style.marginBottom = '16px';
    const totalLabel = document.createElement('div');
    totalLabel.style.fontSize = '16px';
    totalLabel.style.marginRight = '16px';
    totalLabel.textContent = 'Total:';
    const totalValue = document.createElement('div');
    totalValue.style.fontSize = '24px';
    totalValue.style.fontWeight = 'bold';
    totalValue.textContent = `$${invoice.total.toFixed(2)}`;
    totalGroup.appendChild(totalLabel);
    totalGroup.appendChild(totalValue);
    modalContent.appendChild(totalGroup);

    const paymentGroup = document.createElement('div');
    paymentGroup.style.display = 'flex';
    paymentGroup.style.justifyContent = 'flex-end';
    paymentGroup.style.marginBottom = '16px';
    paymentGroup.style.fontSize = '12px';
    paymentGroup.style.color = '#666';
    const paymentLabel = document.createElement('div');
    paymentLabel.style.marginRight = '16px';
    paymentLabel.textContent = 'Método de pago:';
    const paymentValue = document.createElement('div');
    const paymentMethods = {
      'cash': 'Efectivo',
      'card': 'Tarjeta',
      'transfer': 'Transferencia'
    };
    paymentValue.textContent = paymentMethods[invoice.paymentMethod] || invoice.paymentMethod;
    paymentGroup.appendChild(paymentLabel);
    paymentGroup.appendChild(paymentValue);
    modalContent.appendChild(paymentGroup);

    let receivedGroup = null;
    let changeGroup = null;

    if (invoice.paymentMethod === 'cash' && invoice.receivedAmount) {
      receivedGroup = document.createElement('div');
      receivedGroup.style.display = 'flex';
      receivedGroup.style.justifyContent = 'flex-end';
      receivedGroup.style.marginBottom = '8px';
      receivedGroup.style.fontSize = '12px';
      receivedGroup.style.color = '#666';
      const receivedLabel = document.createElement('div');
      receivedLabel.style.marginRight = '16px';
      receivedLabel.textContent = 'Monto recibido:';
      const receivedValue = document.createElement('div');
      receivedValue.textContent = `$${invoice.receivedAmount.toFixed(2)}`;
      receivedGroup.appendChild(receivedLabel);
      receivedGroup.appendChild(receivedValue);

      changeGroup = document.createElement('div');
      changeGroup.style.display = 'flex';
      changeGroup.style.justifyContent = 'flex-end';
      changeGroup.style.marginBottom = '16px';
      changeGroup.style.fontSize = '12px';
      changeGroup.style.color = '#666';
      const changeLabel = document.createElement('div');
      changeLabel.style.marginRight = '16px';
      changeLabel.textContent = 'Vuelto:';
      const changeValue = document.createElement('div');
      changeValue.style.fontWeight = 'bold';
      changeValue.textContent = `$${(invoice.receivedAmount - invoice.total).toFixed(2)}`;
      changeGroup.appendChild(changeLabel);
      changeGroup.appendChild(changeValue);
    }

    // Agregar monto recibido y vuelto al final si es efectivo
    if (receivedGroup && changeGroup) {
      modalContent.appendChild(receivedGroup);
      modalContent.appendChild(changeGroup);
    }

    // Mensaje final de agradecimiento
    const footerMessage = document.createElement('div');
    footerMessage.style.textAlign = 'center';
    footerMessage.style.marginTop = '24px';
    footerMessage.style.paddingTop = '16px';
    footerMessage.style.borderTop = '2px solid #5c5c5c';
    
    const thanksMessage = document.createElement('div');
    thanksMessage.textContent = 'GRACIAS POR SU VISITA';
    thanksMessage.style.fontSize = '14px';
    thanksMessage.style.fontWeight = 'bold';
    thanksMessage.style.marginBottom = '4px';
    
    const seeYouMessage = document.createElement('div');
    seeYouMessage.textContent = 'HASTA PRONTO';
    seeYouMessage.style.fontSize = '14px';
    seeYouMessage.style.fontWeight = 'bold';
    
    footerMessage.appendChild(thanksMessage);
    footerMessage.appendChild(seeYouMessage);
    modalContent.appendChild(footerMessage);

    modal.classList.add('is-open');
  }

  // Mostrar estado de cuenta
  window.showStatement = function(orderId, tableNumber) {
    const order = Orders.getById(orderId);
    if (!order) return;

    const table = Tables.getByNumber(tableNumber);
    const modal = document.getElementById('modal-statement');
    const modalContent = document.getElementById('modal-statement-content');

    // Limpiar contenido anterior
    modalContent.replaceChildren();

    // Crear elementos del estado de cuenta (similar a factura)
    const headerGroup = document.createElement('div');
    headerGroup.style.marginBottom = '16px';
    headerGroup.style.borderBottom = '2px solid #5c5c5c';
    headerGroup.style.paddingBottom = '12px';
    
    // Logo de la app - arriba del todo
    const logoImg = document.createElement('img');
    logoImg.src = 'assets/images/minefood.png';
    logoImg.alt = 'MineFood';
    logoImg.style.maxWidth = '100%';
    logoImg.style.display = 'block';
    logoImg.style.margin = '0 auto 16px auto';
    
    // Información del restaurante - debajo del logo
    const restaurantInfo = document.createElement('div');
    restaurantInfo.style.textAlign = 'center';
    restaurantInfo.style.marginBottom = '12px';
    restaurantInfo.style.fontSize = '12px';
    restaurantInfo.style.color = '#666';
    
    const restaurantName = document.createElement('div');
    restaurantName.textContent = 'RESTAURANTE MINEFOOD';
    restaurantName.style.fontWeight = 'bold';
    restaurantName.style.fontSize = '16px';
    restaurantName.style.marginBottom = '6px';
    restaurantName.style.color = '#333';
    
    const restaurantAddress = document.createElement('div');
    restaurantAddress.textContent = '14 Avenida 5-32 Zona 1, 01001 Ciudad de Guatemala, Guatemala';
    restaurantAddress.style.marginBottom = '4px';
    
    const restaurantPhone = document.createElement('div');
    restaurantPhone.textContent = 'Teléfono: 123-456-7890';
    
    restaurantInfo.appendChild(restaurantName);
    restaurantInfo.appendChild(restaurantAddress);
    restaurantInfo.appendChild(restaurantPhone);
    
    // Información del estado de cuenta
    const statementInfo = document.createElement('div');
    statementInfo.style.display = 'flex';
    statementInfo.style.justifyContent = 'space-between';
    statementInfo.style.fontSize = '12px';
    statementInfo.style.marginBottom = '8px';
    
    const statementDateEl = document.createElement('div');
    statementDateEl.textContent = new Date().toLocaleString('es-ES', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    const statementNumberEl = document.createElement('div');
    statementNumberEl.textContent = `Estado de Cuenta`;
    
    statementInfo.appendChild(statementDateEl);
    statementInfo.appendChild(statementNumberEl);
    
    headerGroup.appendChild(logoImg);
    headerGroup.appendChild(restaurantInfo);
    headerGroup.appendChild(statementInfo);
    modalContent.appendChild(headerGroup);

    // Información del pedido compacta
    const orderInfo = document.createElement('div');
    orderInfo.style.display = 'flex';
    orderInfo.style.justifyContent = 'space-between';
    orderInfo.style.marginBottom = '16px';
    orderInfo.style.fontSize = '12px';
    orderInfo.style.color = '#666';

    const customerInfo = document.createElement('div');
    const customerLabel = document.createElement('strong');
    customerLabel.textContent = 'Cliente: ';
    const customerText = document.createTextNode(order.customer);
    customerInfo.appendChild(customerLabel);
    customerInfo.appendChild(customerText);

    const tableInfo = document.createElement('div');
    const tableLabel = document.createElement('strong');
    tableLabel.textContent = 'Mesa: ';
    const tableText = document.createTextNode(order.table);
    tableInfo.appendChild(tableLabel);
    tableInfo.appendChild(tableText);

    const orderIdInfo = document.createElement('div');
    const orderIdLabel = document.createElement('strong');
    orderIdLabel.textContent = 'Pedido: ';
    const orderIdText = document.createTextNode(order.id);
    orderIdInfo.appendChild(orderIdLabel);
    orderIdInfo.appendChild(orderIdText);

    orderInfo.appendChild(customerInfo);
    orderInfo.appendChild(tableInfo);
    orderInfo.appendChild(orderIdInfo);
    modalContent.appendChild(orderInfo);

    // Tabla de productos
    const itemsTable = document.createElement('table');
    itemsTable.className = 'mc-table';
    itemsTable.style.width = '100%';
    itemsTable.style.borderCollapse = 'collapse';
    itemsTable.style.marginBottom = '16px';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.borderBottom = '2px solid #5c5c5c';
    const thProduct = document.createElement('th');
    thProduct.textContent = 'Producto';
    thProduct.style.textAlign = 'left';
    thProduct.style.padding = '8px';
    const thQty = document.createElement('th');
    thQty.textContent = 'Cant.';
    thQty.style.textAlign = 'center';
    thQty.style.padding = '8px';
    const thPrice = document.createElement('th');
    thPrice.textContent = 'Precio unit.';
    thPrice.style.textAlign = 'right';
    thPrice.style.padding = '8px';
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Subtotal';
    thTotal.style.textAlign = 'right';
    thTotal.style.padding = '8px';
    headerRow.appendChild(thProduct);
    headerRow.appendChild(thQty);
    headerRow.appendChild(thPrice);
    headerRow.appendChild(thTotal);
    thead.appendChild(headerRow);
    itemsTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    order.items.forEach(item => {
      const dish = Dishes.getByCode(item.code);
      const dishName = dish ? dish.name : item.code;
      const dishPrice = dish ? Utils.roundToDecimals(dish.price) : 0;
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #ddd';
      const tdProduct = document.createElement('td');
      tdProduct.textContent = dishName;
      tdProduct.style.padding = '8px';
      const tdQty = document.createElement('td');
      tdQty.textContent = item.quantity;
      tdQty.style.textAlign = 'center';
      tdQty.style.padding = '8px';
      const tdPrice = document.createElement('td');
      tdPrice.textContent = `$${Utils.formatPrice(dishPrice)}`;
      tdPrice.style.textAlign = 'right';
      tdPrice.style.padding = '8px';
      const tdTotal = document.createElement('td');
      const subtotal = Utils.calculateSubtotal(dishPrice, item.quantity);
      tdTotal.textContent = `$${Utils.formatPrice(subtotal)}`;
      tdTotal.style.textAlign = 'right';
      tdTotal.style.padding = '8px';
      row.appendChild(tdProduct);
      row.appendChild(tdQty);
      row.appendChild(tdPrice);
      row.appendChild(tdTotal);
      tbody.appendChild(row);
    });
    itemsTable.appendChild(tbody);
    modalContent.appendChild(itemsTable);

    // Total
    const totalGroup = document.createElement('div');
    totalGroup.style.display = 'flex';
    totalGroup.style.justifyContent = 'flex-end';
    totalGroup.style.marginBottom = '16px';
    const totalLabel = document.createElement('div');
    totalLabel.style.fontSize = '16px';
    totalLabel.style.marginRight = '16px';
    totalLabel.textContent = 'Total:';
    const totalValue = document.createElement('div');
    totalValue.style.fontSize = '24px';
    totalValue.style.fontWeight = 'bold';
    totalValue.textContent = `$${Utils.formatPrice(order.total)}`;
    totalGroup.appendChild(totalLabel);
    totalGroup.appendChild(totalValue);
    modalContent.appendChild(totalGroup);

    // Tiempo ocupado
    const timeGroup = document.createElement('div');
    timeGroup.style.display = 'flex';
    timeGroup.style.justifyContent = 'flex-end';
    timeGroup.style.marginBottom = '16px';
    timeGroup.style.fontSize = '12px';
    timeGroup.style.color = '#666';
    const timeLabel = document.createElement('div');
    timeLabel.style.marginRight = '16px';
    timeLabel.textContent = 'Tiempo ocupado:';
    const timeValue = document.createElement('div');
    timeValue.textContent = Tables.getOccupiedTime(tableNumber);
    timeGroup.appendChild(timeLabel);
    timeGroup.appendChild(timeValue);
    modalContent.appendChild(timeGroup);

    // Advertencia de que no es comprobante de pago
    const warningGroup = document.createElement('div');
    warningGroup.style.textAlign = 'center';
    warningGroup.style.marginTop = '24px';
    warningGroup.style.paddingTop = '16px';
    warningGroup.style.borderTop = '2px solid #5c5c5c';
    warningGroup.style.backgroundColor = '#fff3cd';
    warningGroup.style.padding = '12px';
    warningGroup.style.borderRadius = '4px';
    
    const warningIcon = document.createElement('div');
    warningIcon.textContent = '⚠️';
    warningIcon.style.fontSize = '24px';
    warningIcon.style.marginBottom = '8px';
    
    const warningTitle = document.createElement('div');
    warningTitle.textContent = 'ESTADO DE CUENTA';
    warningTitle.style.fontSize = '14px';
    warningTitle.style.fontWeight = 'bold';
    warningTitle.style.marginBottom = '4px';
    
    const warningText = document.createElement('div');
    warningText.textContent = 'Este documento NO es un comprobante de pago válido. Solo es un estado de cuenta informativo.';
    warningText.style.fontSize = '12px';
    warningText.style.color = '#856404';
    
    warningGroup.appendChild(warningIcon);
    warningGroup.appendChild(warningTitle);
    warningGroup.appendChild(warningText);
    modalContent.appendChild(warningGroup);

    modal.classList.add('is-open');
  };

  // Avanzar estado de pedido de mesa
  window.advanceTableOrderStatus = function(orderId) {
    const order = Orders.getById(orderId);
    if (!order) return;

    const statusOptions = ['pending', 'preparing', 'ready', 'served'];
    const currentIndex = statusOptions.indexOf(order.status);
    const nextStatus = statusOptions[currentIndex + 1];

    if (!nextStatus) {
      MineFoodFeedback.showToast('El pedido ya está servido. Para liberar la mesa debes procesar el pago.', 'warning');
      return;
    }

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

    if (order.status !== 'served') {
      MineFoodFeedback.showToast('Solo puedes cobrar cuando el pedido ya fue servido.', 'warning');
      return;
    }

    Tables.updateStatus(tableNumber, 'paying', orderId);
    renderTablesGrid();

    const tableModal = document.getElementById('modal-table');
    tableModal.classList.remove('is-open');

    const paymentModal = document.getElementById('modal-payment');
    paymentModal.dataset.orderId = orderId;
    paymentModal.dataset.tableNumber = tableNumber;
    const paymentContent = document.getElementById('modal-payment-content');

    // Limpiar contenido anterior
    paymentContent.replaceChildren();

    // Tabla de productos
    const itemsTable = document.createElement('table');
    itemsTable.className = 'mc-table';
    itemsTable.style.width = '100%';
    itemsTable.style.borderCollapse = 'collapse';
    itemsTable.style.marginBottom = '16px';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.borderBottom = '2px solid #5c5c5c';
    const thProduct = document.createElement('th');
    thProduct.textContent = 'Producto';
    thProduct.style.textAlign = 'left';
    thProduct.style.padding = '8px';
    const thQty = document.createElement('th');
    thQty.textContent = 'Cant.';
    thQty.style.textAlign = 'center';
    thQty.style.padding = '8px';
    const thPrice = document.createElement('th');
    thPrice.textContent = 'Precio unit.';
    thPrice.style.textAlign = 'right';
    thPrice.style.padding = '8px';
    const thTotal = document.createElement('th');
    thTotal.textContent = 'Subtotal';
    thTotal.style.textAlign = 'right';
    thTotal.style.padding = '8px';
    headerRow.appendChild(thProduct);
    headerRow.appendChild(thQty);
    headerRow.appendChild(thPrice);
    headerRow.appendChild(thTotal);
    thead.appendChild(headerRow);
    itemsTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    order.items.forEach(item => {
      const dish = Dishes.getByCode(item.code);
      const dishName = dish ? dish.name : item.code;
      const dishPrice = dish ? Utils.roundToDecimals(dish.price) : 0;
      const row = document.createElement('tr');
      row.style.borderBottom = '1px solid #ddd';
      const tdProduct = document.createElement('td');
      tdProduct.textContent = dishName;
      tdProduct.style.padding = '8px';
      const tdQty = document.createElement('td');
      tdQty.textContent = item.quantity;
      tdQty.style.textAlign = 'center';
      tdQty.style.padding = '8px';
      const tdPrice = document.createElement('td');
      tdPrice.textContent = `$${Utils.formatPrice(dishPrice)}`;
      tdPrice.style.textAlign = 'right';
      tdPrice.style.padding = '8px';
      const tdTotal = document.createElement('td');
      const subtotal = Utils.calculateSubtotal(dishPrice, item.quantity);
      tdTotal.textContent = `$${Utils.formatPrice(subtotal)}`;
      tdTotal.style.textAlign = 'right';
      tdTotal.style.padding = '8px';
      row.appendChild(tdProduct);
      row.appendChild(tdQty);
      row.appendChild(tdPrice);
      row.appendChild(tdTotal);
      tbody.appendChild(row);
    });
    itemsTable.appendChild(tbody);
    paymentContent.appendChild(itemsTable);

    // Total
    const totalGroup = document.createElement('div');
    totalGroup.style.display = 'flex';
    totalGroup.style.justifyContent = 'flex-end';
    totalGroup.style.marginBottom = '16px';
    const totalLabel = document.createElement('div');
    totalLabel.style.fontSize = '16px';
    totalLabel.style.marginRight = '16px';
    totalLabel.textContent = 'Total:';
    const totalValue = document.createElement('div');
    totalValue.style.fontSize = '24px';
    totalValue.style.fontWeight = 'bold';
    totalValue.textContent = `$${Utils.formatPrice(order.total)}`;
    totalGroup.appendChild(totalLabel);
    totalGroup.appendChild(totalValue);
    paymentContent.appendChild(totalGroup);

    // Método de pago
    const paymentMethodGroup = document.createElement('div');
    paymentMethodGroup.className = 'mc-payment-method';
    paymentMethodGroup.style.marginBottom = '16px';
    const methodLabel = document.createElement('label');
    methodLabel.textContent = 'Método de pago';
    methodLabel.style.display = 'block';
    methodLabel.style.marginBottom = '8px';
    const methodSelect = document.createElement('select');
    methodSelect.className = 'mc-input mc-select';
    methodSelect.id = 'payment-method-select';
    methodSelect.style.width = '100%';
    
    const cashOption = document.createElement('option');
    cashOption.value = 'cash';
    cashOption.textContent = 'Efectivo';
    const cardOption = document.createElement('option');
    cardOption.value = 'card';
    cardOption.textContent = 'Tarjeta';
    const transferOption = document.createElement('option');
    transferOption.value = 'transfer';
    transferOption.textContent = 'Transferencia';
    
    methodSelect.appendChild(cashOption);
    methodSelect.appendChild(cardOption);
    methodSelect.appendChild(transferOption);
    
    paymentMethodGroup.appendChild(methodLabel);
    paymentMethodGroup.appendChild(methodSelect);
    paymentContent.appendChild(paymentMethodGroup);

    // Monto recibido (solo para efectivo)
    const cashInputGroup = document.createElement('div');
    cashInputGroup.className = 'mc-payment-method';
    cashInputGroup.id = 'cash-input-group';
    cashInputGroup.style.marginBottom = '16px';
    const cashLabel = document.createElement('label');
    cashLabel.textContent = 'Monto recibido';
    cashLabel.style.display = 'block';
    cashLabel.style.marginBottom = '8px';
    const cashInput = document.createElement('input');
    cashInput.type = 'number';
    cashInput.className = 'mc-input';
    cashInput.id = 'payment-amount';
    cashInput.placeholder = '0.00';
    cashInput.step = '0.01';
    cashInput.style.width = '100%';
    
    cashInputGroup.appendChild(cashLabel);
    cashInputGroup.appendChild(cashInput);
    paymentContent.appendChild(cashInputGroup);

    // Vuelto
    const changeDiv = document.createElement('div');
    changeDiv.className = 'mc-payment-change';
    changeDiv.id = 'payment-change';
    paymentContent.appendChild(changeDiv);

    // Manejar cambio de método de pago
    document.getElementById('payment-method-select').addEventListener('change', function() {
      const cashGroup = document.getElementById('cash-input-group');
      cashGroup.style.display = this.value === 'cash' ? 'block' : 'none';
      document.getElementById('payment-change').classList.remove('show');
    });

    // Calcular vuelto para efectivo
    document.getElementById('payment-amount').addEventListener('input', function() {
      const received = parseFloat(this.value) || 0;
      const change = Utils.roundToDecimals(received - order.total);
      const changeEl = document.getElementById('payment-change');
      
      if (received >= order.total) {
        changeEl.textContent = `Vuelto: $${Utils.formatPrice(change)}`;
        changeEl.classList.add('show');
      } else {
        changeEl.classList.remove('show');
      }
    });

    // Confirmar pago
    document.getElementById('btn-confirm-payment').onclick = function() {
      const method = document.getElementById('payment-method-select').value;
      let receivedAmount = null;
      
      if (method === 'cash') {
        receivedAmount = parseFloat(document.getElementById('payment-amount').value) || 0;
        if (receivedAmount < order.total) {
          MineFoodFeedback.showToast('El monto recibido es insuficiente.', 'error');
          return;
        }
      }

      try {
        Orders.updateStatus(orderId, 'paid');
        Tables.updateStatus(tableNumber, 'free');
        
        renderTablesGrid();
        window.dispatchEvent(new CustomEvent('reportsChanged'));
        delete paymentModal.dataset.orderId;
        delete paymentModal.dataset.tableNumber;
        paymentModal.classList.remove('is-open');
        MineFoodFeedback.showToast(`Pago completado para pedido ${orderId}.`);
        
        // Generar factura
        showInvoice(orderId, tableNumber, method, receivedAmount);
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

    window.addEventListener('tablesChanged', renderTablesGrid);

    const paymentModal = document.getElementById('modal-payment');
    const restorePaymentTable = function() {
      const orderId = paymentModal?.dataset.orderId;
      const tableNumber = parseInt(paymentModal?.dataset.tableNumber || '', 10);
      const order = orderId ? Orders.getById(orderId) : null;

      if (order && order.status !== 'paid' && tableNumber) {
        Tables.updateStatus(tableNumber, 'occupied', orderId);
        renderTablesGrid();
      }

      if (paymentModal) {
        delete paymentModal.dataset.orderId;
        delete paymentModal.dataset.tableNumber;
      }
    };

    document.querySelector('[data-modal-close="modal-payment"]')?.addEventListener('click', restorePaymentTable);
    paymentModal?.addEventListener('click', function(e) {
      if (e.target === paymentModal) {
        restorePaymentTable();
      }
    });

    // Actualizar periódicamente el tiempo de mesas ocupadas
    setInterval(() => {
      if (document.getElementById('view-tables').classList.contains('active')) {
        renderTablesGrid();
      }
    }, 1000);
  });

  // Imprimir factura POS
  window.printInvoice = function() {
    const modalContent = document.getElementById('modal-invoice-content');
    if (!modalContent) return;

    // Crear ventana de impresión
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura POS</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 80mm;
            padding: 5mm;
            background: white;
          }
          .header {
            text-align: center;
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .logo {
            max-width: 40mm;
            margin: 0 auto 5px auto;
            display: block;
          }
          .restaurant-name {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 3px;
          }
          .restaurant-info {
            font-size: 10px;
            margin-bottom: 2px;
          }
          .invoice-info {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 10px;
          }
          .order-info {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 10px;
            color: #666;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          th {
            text-align: left;
            font-size: 10px;
            border-bottom: 1px dashed #000;
            padding: 3px 0;
          }
          td {
            font-size: 10px;
            padding: 3px 0;
          }
          .text-right {
            text-align: right;
          }
          .text-center {
            text-align: center;
          }
          .total {
            display: flex;
            justify-content: flex-end;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .payment-info {
            display: flex;
            justify-content: flex-end;
            font-size: 10px;
            margin-bottom: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            border-top: 1px dashed #000;
            padding-top: 10px;
          }
          .footer-text {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 3px;
          }
        </style>
      </head>
      <body>
        ${modalContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = function() {
      printWindow.print();
      printWindow.close();
    };
  };
})();
