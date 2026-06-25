// UI de platillos - Conexión con el módulo Dishes

(function() {
  'use strict';

  // Mapeo de nombres de platillos a iconos de Minecraft
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

  // Obtener icono para un platillo
  function getIcon(name) {
    const icon = iconMap[name];
    return icon ? `assets/1.21.11/items/${icon}` : 'assets/1.21.11/items/cake.png';
  }

  // Renderizar grid de platillos
  function renderDishesGrid() {
    const grid = document.querySelector('.mc-inventory-grid');
    if (!grid) return;

    const dishes = Dishes.getAll();
    
    grid.innerHTML = dishes.map(dish => `
      <div class="mc-inventory-item">
        <div class="mc-slot">
          <img src="${getIcon(dish.name)}" alt="" class="mc-slot__img">
        </div>
        <div class="mc-inventory-item__name">${dish.name}</div>
        <div class="mc-inventory-item__meta">$${dish.price.toFixed(2)}</div>
        <button class="mc-button mc-button--secondary" onclick="editDish('${dish.code}')">Editar</button>
        <button class="mc-button mc-button--danger" onclick="deleteDish('${dish.code}')" style="margin-top: 8px;">Eliminar</button>
      </div>
    `).join('');
  }

  // Guardar platillo (crear o actualizar)
  function saveDish(e) {
    e.preventDefault();
    
    const modal = document.getElementById('modal-dish');
    const inputs = modal.querySelectorAll('input');
    
    const name = inputs[0].value.trim();
    const description = inputs[1].value.trim();
    const price = parseFloat(inputs[2].value);
    const icon = inputs[3].value.trim();

    // Validaciones
    if (!name || !description || isNaN(price)) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    // Generar código si es nuevo
    const code = modal.dataset.editingCode || `PLT-${String(Date.now()).slice(-3)}`;

    const dishData = {
      code,
      name,
      description,
      price,
      icon: icon || '🍽️',
      ingredients: {} // Por defecto sin ingredientes
    };

    try {
      const existing = Dishes.getByCode(code);
      if (existing) {
        Dishes.update(code, dishData);
      } else {
        Dishes.add(dishData);
      }
      
      closeModal('modal-dish');
      renderDishesGrid();
      
      // Limpiar formulario y editar código
      delete modal.dataset.editingCode;
      inputs.forEach(input => input.value = '');
      
    } catch (error) {
      alert(error.message);
    }
  }

  // Editar platillo
  window.editDish = function(code) {
    const dish = Dishes.getByCode(code);
    if (!dish) return;

    const modal = document.getElementById('modal-dish');
    const inputs = modal.querySelectorAll('input');
    
    modal.dataset.editingCode = code;
    inputs[0].value = dish.name;
    inputs[1].value = dish.description;
    inputs[2].value = dish.price;
    inputs[3].value = dish.icon || '';

    openModal('modal-dish');
  };

  // Eliminar platillo
  window.deleteDish = function(code) {
    if (confirm('¿Está seguro de eliminar este platillo?')) {
      try {
        Dishes.delete(code);
        renderDishesGrid();
      } catch (error) {
        alert(error.message);
      }
    }
  };

  // Inicializar
  document.addEventListener('DOMContentLoaded', function() {
    renderDishesGrid();

    // Conectar botón guardar del modal
    const saveButton = document.querySelector('#modal-dish .mc-button:not(.mc-button--secondary)');
    if (saveButton) {
      saveButton.addEventListener('click', saveDish);
    }

    // Limpiar datos de edición al cerrar modal
    const cancelButton = document.querySelector('#modal-dish [data-modal-close="modal-dish"]');
    if (cancelButton) {
      cancelButton.addEventListener('click', function() {
        const modal = document.getElementById('modal-dish');
        delete modal.dataset.editingCode;
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => input.value = '');
      });
    }
  });
})();
