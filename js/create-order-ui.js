// UI de crear pedido

(function() {
  'use strict';

  // Iconos de Minecraft para platillos
  const iconMap = {
    'Ensalada de Zanahoria Dorada': 'carrot.png',
    'Estofado de Champiñones': 'mushroom_stew.png',
    'Pan del Aldeano': 'bread.png',
    'Pastel de Bayas Dulces': 'pumpkin_pie.png',
    'Sopa del Bosque Encantado': 'beetroot_soup.png',
    'Jugo de Melón Pixelado': 'melon_slice.png',
    'Tarta de Manzana': 'apple.png',
    'Galletas de Trigo': 'cookie.png',
    'Papas Horneadas': 'baked_potato.png',
    'Batido de Manzana Dorada': 'golden_apple.png',
    'Ensalada del Bosque Oscuro': 'chorus_fruit.png',
    'Miel de Abeja': 'honey_bottle.png',
    'Pan de Semillas': 'wheat.png',
    'Brownie de Cacao': 'cocoa_beans.png',
    'Sopa de Remolacha': 'beetroot_soup.png',
    'Ensalada de Frutas del Bosque': 'sweet_berries.png',
    'Panqueques de Trigo': 'bread.png',
    'Ensalada de Bambú': 'bamboo.png',
    'Hamburguesa de Res': 'beef.png',
    'Chuleta de Cerdo': 'porkchop.png',
    'Pollo Asado': 'cooked_chicken.png',
    'Pescado Frito': 'cooked_cod.png',
    'Estofado de Conejo': 'cooked_rabbit.png',
    'Carne de Carnero Asada': 'cooked_mutton.png',
    'Huevos con Pan': 'egg.png',
    'Leche Fresca': 'milk_bucket.png',
    'Carne de Res Asada': 'cooked_beef.png',
    'Salchicha de Cerdo': 'porkchop.png',
    'Filete de Pescado': 'cooked_cod.png',
    'Carne de Conejo Frita': 'cooked_rabbit.png'
  };

  function getIcon(name) {
    const icon = iconMap[name];
    return icon ? `assets/1.21.11/items/${icon}` : 'assets/1.21.11/items/cake.png';
  }

  let cart = {};

  function renderDishesGrid() {
    const grid = document.querySelector('.mc-inventory-grid');
    if (!grid) return;

    const dishes = Dishes.getAll();
    
    if (dishes.length === 0) {
      grid.innerHTML = '<div class="mc-empty-state">No hay platillos disponibles. Crea platillos antes de registrar pedidos.</div>';
      return;
    }

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
    const existingItems = summaryItems.querySelectorAll('.mc-order-item, .mc-empty-state');
    existingItems.forEach(item => item.remove());

    const totalElement = summaryItems.querySelector('.mc-order-summary__total');
    if (totalElement) {
      totalElement.insertAdjacentHTML('beforebegin', itemsHtml || '<div class="mc-empty-state">Aún no has seleccionado platillos.</div>');
      totalElement.textContent = `Total: $${total.toFixed(2)}`;
    }

    const confirmButton = summaryItems.querySelector('.mc-button');
    if (confirmButton) {
      confirmButton.disabled = Object.keys(cart).length === 0;
    }
  }

  // Crear pedido
  function createOrder() {
    const tableInput = document.querySelector('.mc-order-summary input[type="number"]');
    const customerInput = document.querySelector('.mc-order-summary input[type="text"]');
    const paymentMethodInput = document.getElementById('payment-method');
    const table = tableInput ? tableInput.value : '1';
    const customer = customerInput ? customerInput.value.trim() : '';
    const paymentMethod = paymentMethodInput ? paymentMethodInput.value : 'cash';

    // Validar que haya items en el carrito
    if (Object.keys(cart).length === 0) {
      MineFoodFeedback.showToast('Selecciona al menos un platillo con el botón +.', 'warning');
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
        customer: customer || 'Cliente de mesa',
        phone: '',
        status: 'pending',
        paymentMethod: paymentMethod,
        items: items
      });

      MineFoodFeedback.showToast(`Pedido ${orderId} creado exitosamente.`);
      cart = {};
      window.setTimeout(() => {
        window.location.href = 'app.html#orders';
      }, 700);
      
    } catch (error) {
      MineFoodFeedback.showToast(error.message, 'error');
    }
  }

  // Inicializar
  document.addEventListener('DOMContentLoaded', function() {
    renderDishesGrid();
    updateOrderSummary();

    // Conectar botón confirmar pedido
    const confirmButton = document.querySelector('.mc-order-summary .mc-button');
    if (confirmButton) {
      confirmButton.addEventListener('click', createOrder);
    }
  });
})();
