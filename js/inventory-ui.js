// UI del inventario - Conexión con el módulo Inventory

(function() {
  'use strict';

  // Mapeo de nombres de insumos a iconos de Minecraft
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
    'Pimienta': 'blaze_powder.png'
  };

  // Obtener icono para un insumo
  function getIcon(name) {
    const icon = iconMap[name];
    return icon ? `assets/1.21.11/items/${icon}` : 'assets/1.21.11/items/apple.png';
  }

  // Renderizar tabla de inventario
  function renderInventoryTable() {
    const tbody = document.querySelector('.mc-table tbody');
    if (!tbody) return;

    const ingredients = Inventory.getAll();
    
    if (ingredients.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="mc-empty-state">No hay insumos registrados. Usa “Agregar insumo” para crear el primero.</td></tr>';
      return;
    }

    tbody.innerHTML = ingredients.map(ingredient => {
      const isLowStock = ingredient.quantity <= ingredient.min;
      const statusBadge = isLowStock 
        ? '<span class="mc-badge mc-badge--alert">Bajo</span>'
        : '<span class="mc-badge mc-badge--delivered">OK</span>';

      return `
        <tr>
          <td data-label="Código">${ingredient.code}</td>
          <td data-label="Nombre">
            <span style="display: flex; align-items: center; gap: 8px;">
              <img src="${getIcon(ingredient.name)}" alt="" class="mc-list__icon">
              ${ingredient.name}
            </span>
          </td>
          <td data-label="Descripción">${ingredient.description}</td>
          <td data-label="Cantidad">${ingredient.quantity}</td>
          <td data-label="Unidad">${ingredient.unit}</td>
          <td data-label="Estado">${statusBadge}</td>
          <td data-label="Acciones">
            <button class="mc-button mc-button--small mc-button--secondary" onclick="editIngredient('${ingredient.code}')">Editar</button>
            <button class="mc-button mc-button--small mc-button--danger" onclick="deleteIngredient('${ingredient.code}')">Eliminar</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Guardar insumo (crear o actualizar)
  function saveIngredient(e) {
    e.preventDefault();
    
    const modal = document.getElementById('modal-ingredient');
    const inputs = modal.querySelectorAll('input, select');
    
    const code = inputs[0].value.trim();
    const name = inputs[1].value.trim();
    const description = inputs[2].value.trim();
    const quantity = parseFloat(inputs[3].value);
    const unit = inputs[4].value;

    // Validaciones
    if (!code || !name || !description || isNaN(quantity)) {
      MineFoodFeedback.showToast('Completa código, nombre, descripción y cantidad.', 'warning');
      return;
    }

    const ingredientData = {
      code,
      name,
      description,
      quantity,
      unit,
      min: 5 // Valor por defecto para stock mínimo
    };

    try {
      const existing = Inventory.getByCode(code);
      if (existing) {
        Inventory.update(code, ingredientData);
      } else {
        Inventory.add(ingredientData);
      }
      
      closeModal('modal-ingredient');
      renderInventoryTable();
      MineFoodFeedback.showToast(existing ? 'Insumo actualizado correctamente.' : 'Insumo agregado correctamente.');
      
      // Limpiar formulario
      inputs.forEach(input => {
        if (input.tagName === 'INPUT') input.value = '';
      });
      
    } catch (error) {
      MineFoodFeedback.showToast(error.message, 'error');
    }
  }

  // Editar insumo
  window.editIngredient = function(code) {
    const ingredient = Inventory.getByCode(code);
    if (!ingredient) return;

    const modal = document.getElementById('modal-ingredient');
    const inputs = modal.querySelectorAll('input, select');
    
    inputs[0].value = ingredient.code;
    inputs[1].value = ingredient.name;
    inputs[2].value = ingredient.description;
    inputs[3].value = ingredient.quantity;
    inputs[4].value = ingredient.unit;

    openModal('modal-ingredient');
  };

  // Eliminar insumo
  window.deleteIngredient = function(code) {
    if (MineFoodFeedback.confirmAction('¿Eliminar este insumo del inventario?')) {
      try {
        Inventory.delete(code);
        renderInventoryTable();
        MineFoodFeedback.showToast('Insumo eliminado correctamente.');
      } catch (error) {
        MineFoodFeedback.showToast(error.message, 'error');
      }
    }
  };

  // Buscar insumo
  function setupSearch() {
    const searchInput = document.querySelector('.page-header input[type="text"]');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const ingredients = Inventory.getAll();
      const filtered = ingredients.filter(ing => 
        ing.name.toLowerCase().includes(searchTerm) ||
        ing.code.toLowerCase().includes(searchTerm) ||
        ing.description.toLowerCase().includes(searchTerm)
      );

      const tbody = document.querySelector('.mc-table tbody');
      if (!tbody) return;

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="mc-empty-state">No se encontraron insumos con ese criterio.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(ingredient => {
        const isLowStock = ingredient.quantity <= ingredient.min;
        const statusBadge = isLowStock 
          ? '<span class="mc-badge mc-badge--alert">Bajo</span>'
          : '<span class="mc-badge mc-badge--delivered">OK</span>';

        return `
          <tr>
            <td data-label="Código">${ingredient.code}</td>
            <td data-label="Nombre">
              <span style="display: flex; align-items: center; gap: 8px;">
                <img src="${getIcon(ingredient.name)}" alt="" class="mc-list__icon">
                ${ingredient.name}
              </span>
            </td>
            <td data-label="Descripción">${ingredient.description}</td>
            <td data-label="Cantidad">${ingredient.quantity}</td>
            <td data-label="Unidad">${ingredient.unit}</td>
            <td data-label="Estado">${statusBadge}</td>
            <td data-label="Acciones">
              <button class="mc-button mc-button--small mc-button--secondary" onclick="editIngredient('${ingredient.code}')">Editar</button>
              <button class="mc-button mc-button--small mc-button--danger" onclick="deleteIngredient('${ingredient.code}')">Eliminar</button>
            </td>
          </tr>
        `;
      }).join('');
    });
  }

  // Inicializar
  document.addEventListener('DOMContentLoaded', function() {
    renderInventoryTable();
    setupSearch();

    // Conectar botón guardar del modal
    const saveButton = document.getElementById('btn-save-ingredient');
    if (saveButton) {
      saveButton.addEventListener('click', saveIngredient);
    }
  });

  // Actualizar cuando la vista de inventario se active
  window.addEventListener('viewChange', function(e) {
    if (e.detail.viewId === 'view-inventory') {
      renderInventoryTable();
      setupSearch();
      
      // Conectar botón guardar del modal
      const saveButton = document.getElementById('btn-save-ingredient');
      if (saveButton) {
        saveButton.removeEventListener('click', saveIngredient);
        saveButton.addEventListener('click', saveIngredient);
      }
    }
  });
})();
