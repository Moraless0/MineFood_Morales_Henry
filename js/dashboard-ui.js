// UI del dashboard

(function() {
  'use strict';

  // Iconos de Minecraft
  const iconMap = {
    'Zanahoria': 'carrot.png',
    'Trigo': 'wheat.png',
    'Remolacha': 'beetroot.png',
    'Bayas Dulces': 'sweet_berries.png',
    'Melón': 'melon_slice.png',
    'Champiñones': 'mushroom_stew.png',
    'Algas': 'kelp.png',
    'Bambú': 'bamboo.png',
    'Manzana': 'apple.png',
    'Papa': 'baked_potato.png',
    'Azúcar': 'sugar.png',
    'Glow Berries': 'glow_berries.png',
    'Chorus Fruit': 'chorus_fruit.png',
    'Miel': 'honey_bottle.png',
    'Semillas de Trigo': 'wheat_seeds.png',
    'Semillas de Remolacha': 'beetroot_seeds.png',
    'Semillas de Melón': 'melon_seeds.png',
    'Cacao': 'cocoa_beans.png',
    'Levadura': 'slime_ball.png',
    'Aceite': 'glass_bottle.png',
    'Carne de Res': 'beef.png',
    'Carne de Cerdo': 'porkchop.png',
    'Pollo': 'chicken.png',
    'Pescado': 'cod.png',
    'Carne de Conejo': 'rabbit.png',
    'Carne de Carnero': 'mutton.png',
    'Huevos': 'egg.png',
    'Leche': 'milk_bucket.png',
    'Sal': 'sugar.png',
    'Pimienta': 'blaze_powder.png',
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
    return icon ? `assets/1.21.11/items/${icon}` : 'assets/1.21.11/items/apple.png';
  }

  // Actualizar estadísticas principales
  function updateStats() {
    const ingredients = Inventory.getAll();
    const dishes = Dishes.getAll();
    const orders = Orders.getAll();
    const stats = Orders.getStats();

    const labels = Array.from(document.querySelectorAll('.mc-stat-card__label'));
    const findLabel = (text) => labels.find(label => label.textContent.trim() === text);

    const stockValue = findLabel('Insumos en stock');
    if (stockValue) {
      stockValue.previousElementSibling.textContent = ingredients.length;
    }

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const pendingValue = findLabel('Pedidos pendientes');
    if (pendingValue) {
      pendingValue.previousElementSibling.textContent = pendingOrders;
    }

    const dishesValue = findLabel('Platillos activos');
    if (dishesValue) {
      dishesValue.previousElementSibling.textContent = dishes.length;
    }

    const salesValue = findLabel('Ventas hoy');
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

    const title = Array.from(document.querySelectorAll('.mc-card__title'))
      .find(element => element.textContent.includes('Platillos más vendidos'));
    const list = title?.nextElementSibling;
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
    const title = Array.from(document.querySelectorAll('.mc-card__title'))
      .find(element => element.textContent.includes('Insumos bajos'));
    const list = title?.nextElementSibling;

    // Mostrar/ocultar alerta
    if (alertBox) {
      if (lowStock.length > 0) {
        alertBox.style.display = 'block';
        const names = lowStock.map(i => i.name).join(', ');
        alertBox.innerHTML = `<strong><img src="assets/1.21.11/items/redstone.png" alt="" class="mc-list__icon"> Alerta:</strong> ${names} están por debajo del stock mínimo.`;
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

  // Actualizar cuando la vista de dashboard se active
  window.addEventListener('viewChange', function(e) {
    if (e.detail.viewId === 'view-dashboard') {
      updateStats();
      updateTopDishes();
      updateLowStock();
    }
  });
})();
