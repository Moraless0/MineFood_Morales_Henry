// UI del dashboard - Conexión con módulos para estadísticas dinámicas

(function() {
  'use strict';

  // Mapeo de nombres a iconos
  const iconMap = {
    'Zanahoria': 'carrot.png',
    'Trigo': 'wheat.png',
    'Remolacha': 'beetroot.png',
    'Bayas Dulces': 'sweet_berries.png',
    'Melón': 'melon_slice.png',
    'Champiñones': 'mushroom_stew.png',
    'Algas': 'kelp.png',
    'Bambú': 'bamboo.png',
    'Ensalada de Zanahoria Dorada': 'carrot.png',
    'Estofado de Champiñones': 'mushroom_stew.png',
    'Pan del Aldeano': 'bread.png',
    'Pastel de Bayas Dulces': 'pumpkin_pie.png',
    'Sopa del Bosque Encantado': 'beetroot_soup.png',
    'Jugo de Melón Pixelado': 'melon_slice.png'
  };

  function getIcon(name) {
    const icon = iconMap[name];
    return icon ? `assets/1.21.11/items/${icon}` : 'assets/1.21.11/items/apple.png';
  }

  // Actualizar estadísticas principales
  function updateStats() {
    const ingredients = Inventory.getAll();
    const dishes = Dishes.getAll();
    const orders = Orders.getAll();
    const stats = Orders.getStats();

    // Insumos en stock
    const stockValue = document.querySelector('.mc-stat-card__label:contains("Insumos en stock")');
    if (stockValue) {
      stockValue.previousElementSibling.textContent = ingredients.length;
    }

    // Pedidos pendientes
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const pendingValue = document.querySelector('.mc-stat-card__label:contains("Pedidos pendientes")');
    if (pendingValue) {
      pendingValue.previousElementSibling.textContent = pendingOrders;
    }

    // Platillos activos
    const dishesValue = document.querySelector('.mc-stat-card__label:contains("Platillos activos")');
    if (dishesValue) {
      dishesValue.previousElementSibling.textContent = dishes.length;
    }

    // Ventas hoy
    const salesValue = document.querySelector('.mc-stat-card__label:contains("Ventas hoy")');
    if (salesValue) {
      salesValue.previousElementSibling.textContent = `$${stats.totalSales}`;
    }
  }

  // Actualizar lista de platillos más vendidos
  function updateTopDishes() {
    const orders = Orders.getAll();
    const dishCounts = {};

    // Contar platillos vendidos
    orders.forEach(order => {
      order.items.forEach(item => {
        const dish = Dishes.getByCode(item.code);
        if (dish) {
          dishCounts[dish.name] = (dishCounts[dish.name] || 0) + item.quantity;
        }
      });
    });

    // Ordenar por cantidad
    const sorted = Object.entries(dishCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const list = document.querySelector('.mc-card__title:contains("Platillos más vendidos")')?.nextElementSibling;
    if (!list) return;

    list.innerHTML = sorted.map(([name, count]) => `
      <li class="mc-list__item">
        <span style="display: flex; align-items: center; gap: 8px;">
          <img src="${getIcon(name)}" alt="" class="mc-list__icon">
          ${name}
        </span>
        <span class="mc-badge">${count}</span>
      </li>
    `).join('');
  }

  // Actualizar lista de insumos bajos
  function updateLowStock() {
    const lowStock = Inventory.getLowStock();
    const alertBox = document.querySelector('.mc-alert--warning');
    const list = document.querySelector('.mc-card__title:contains("Insumos bajos")')?.nextElementSibling;

    // Mostrar/ocultar alerta
    if (alertBox) {
      if (lowStock.length > 0) {
        alertBox.style.display = 'block';
        const names = lowStock.map(i => i.name).join(', ');
        alertBox.innerHTML = `<strong>⚠ Alerta:</strong> ${names} están por debajo del stock mínimo.`;
      } else {
        alertBox.style.display = 'none';
      }
    }

    // Actualizar lista
    if (list) {
      list.innerHTML = lowStock.map(ingredient => `
        <li class="mc-list__item">
          <span style="display: flex; align-items: center; gap: 8px;">
            <img src="${getIcon(ingredient.name)}" alt="" class="mc-list__icon">
            ${ingredient.name} — ${ingredient.quantity} ${ingredient.unit}
          </span>
          <span class="mc-badge mc-badge--alert">Bajo</span>
        </li>
      `).join('');
    }
  }

  // Inicializar
  document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    updateTopDishes();
    updateLowStock();
  });
})();
