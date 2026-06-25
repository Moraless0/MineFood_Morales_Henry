// UI de crear pedido - Conexión con el módulo Orders

(function() {
  'use strict';

  // Mapeo de nombres de platillos a iconos de Minecraft
  const iconMap = {
    'Ensalada de Zanahoria Dorada': 'carrot.png',
    'Estofado de Champiñones': 'mushroom_stew.png',
    'Pan del Aldeano': 'bread.png',
    'Pastel de Bayas Dulces': 'pumpkin_pie.png',
    'Sopa del Bosque Encantado': 'beetroot_soup.png',
    'Jugo de Melón Pixelado': 'melon_slice.png'
  };

  // Obtener icono para un platillo
  function getIcon(name) {
    const icon = iconMap[name];
    return icon ? `assets/1.21.11/items/${icon}` : 'assets/1.21.11/items/cake.png';
  }

  // Carrito de platillos seleccionados
  let cart = {};

  // Renderizar grid de platillos
  function renderDishesGrid() {
    const grid = document.querySelector('.mc-inventory-grid');
    if (!grid) return;

    const dishes = Dishes.getAll();
    
    grid.innerHTML = dishes.map(dish => {
      const quantity = cart[dish.code] || 0;
      
      return `
        <div class="mc-inventory-item">
          <div class="mc-slot">
            <img src="${getIcon(dish.name)}" alt="" class="mc-slot__img">
          </div>
          <div class="mc-inventory-item__name">${dish.name}</div>
          <div class="mc-inventory-item__meta">$${dish.price.toFixed(2)}</div>
          <div class="mc-quantity">
            <button onclick="updateQuantity('${dish.code}', -1)">-</button>
            <input type="text" value="${quantity}" readonly>
            <button onclick="updateQuantity('${dish.code}', 1)">+</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Actualizar cantidad de un platillo en el carrito
  window.updateQuantity = function(code, delta) {
    if (!cart[code]) cart[code] = 0;
    cart[code] += delta;
    
    if (cart[code] < 0) cart[code] = 0;
    if (cart[code] === 0) delete cart[code];
    
    renderDishesGrid();
    updateOrderSummary();
  };

  // Actualizar resumen del pedido
  function updateOrderSummary() {
    const summaryItems = document.querySelector('.mc-order-summary');
    if (!summaryItems) return;

    // Generar items del resumen
    const itemsHtml = Object.entries(cart).map(([code, quantity]) => {
      const dish = Dishes.getByCode(code);
      if (!dish) return '';
      return `
        <div class="mc-order-item">
          <div class="mc-order-item__info">${dish.name}</div>
          <div class="mc-order-item__qty">x${quantity}</div>
        </div>
      `;
    }).join('');

    // Calcular total
    let total = 0;
    Object.entries(cart).forEach(([code, quantity]) => {
      const dish = Dishes.getByCode(code);
      if (dish) {
        total += dish.price * quantity;
      }
    });

    // Actualizar el resumen
    const existingItems = summaryItems.querySelectorAll('.mc-order-item');
    existingItems.forEach(item => item.remove());

    const totalElement = summaryItems.querySelector('.mc-order-summary__total');
    if (totalElement) {
      totalElement.insertAdjacentHTML('beforebegin', itemsHtml);
      totalElement.textContent = `Total: $${total.toFixed(2)}`;
    }
  }

  // Crear pedido
  function createOrder() {
    const tableInput = document.querySelector('.mc-order-summary input[type="number"]');
    const table = tableInput ? tableInput.value : '1';

    // Validar que haya items en el carrito
    if (Object.keys(cart).length === 0) {
      alert('Por favor seleccione al menos un platillo');
      return;
    }

    // Convertir carrito a formato de items
    const items = Object.entries(cart).map(([code, quantity]) => ({
      code,
      quantity
    }));

    try {
      const orderId = Orders.generateId();
      
      Orders.add({
        id: orderId,
        table: `Mesa ${table}`,
        customer: '',
        phone: '',
        status: 'pending',
        items: items
      });

      alert(`Pedido ${orderId} creado exitosamente`);
      cart = {};
      window.location.href = 'orders.html';
      
    } catch (error) {
      alert(error.message);
    }
  }

  // Inicializar
  document.addEventListener('DOMContentLoaded', function() {
    renderDishesGrid();

    // Conectar botón confirmar pedido
    const confirmButton = document.querySelector('.mc-order-summary .mc-button');
    if (confirmButton) {
      confirmButton.addEventListener('click', createOrder);
    }
  });
})();
