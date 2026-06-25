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
    'Bambú': 'bamboo.png'
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
      alert('Por favor complete todos los campos');
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
      
      // Limpiar formulario
      inputs.forEach(input => {
        if (input.tagName === 'INPUT') input.value = '';
      });
      
    } catch (error) {
      alert(error.message);
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
    if (confirm('¿Está seguro de eliminar este insumo?')) {
      try {
        Inventory.delete(code);
        renderInventoryTable();
      } catch (error) {
        alert(error.message);
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
    const saveButton = document.querySelector('#modal-ingredient .mc-button:not(.mc-button--secondary)');
    if (saveButton) {
      saveButton.addEventListener('click', saveIngredient);
    }
  });
})();
