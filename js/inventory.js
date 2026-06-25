// Módulo de gestión de inventario con LocalStorage

const Inventory = {
  // Clave para guardar inventario en localStorage
  INVENTORY_KEY: 'minefood_inventory',

  // Inicializar inventario con datos de demo si no existe
  init() {
    const existingInventory = localStorage.getItem(this.INVENTORY_KEY);
    if (!existingInventory) {
      // Usar datos de demo
      const demoIngredients = window.mcData?.ingredients || [];
      localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(demoIngredients));
      console.log('Inventario inicializado con datos de demo');
    }
  },

  // Obtener todos los insumos
  getAll() {
    return JSON.parse(localStorage.getItem(this.INVENTORY_KEY)) || [];
  },

  // Obtener insumo por código
  getByCode(code) {
    const ingredients = this.getAll();
    return ingredients.find(item => item.code === code);
  },

  // Agregar nuevo insumo
  add(ingredient) {
    const ingredients = this.getAll();
    
    // Validar que el código no exista
    if (ingredients.find(item => item.code === ingredient.code)) {
      throw new Error('Ya existe un insumo con ese código');
    }

    ingredients.push(ingredient);
    localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(ingredients));
    return ingredient;
  },

  // Actualizar insumo
  update(code, updatedData) {
    const ingredients = this.getAll();
    const index = ingredients.findIndex(item => item.code === code);
    
    if (index === -1) {
      throw new Error('Insumo no encontrado');
    }

    ingredients[index] = { ...ingredients[index], ...updatedData };
    localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(ingredients));
    return ingredients[index];
  },

  // Eliminar insumo
  delete(code) {
    const ingredients = this.getAll();
    const filtered = ingredients.filter(item => item.code !== code);
    
    if (filtered.length === ingredients.length) {
      throw new Error('Insumo no encontrado');
    }

    localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(filtered));
  },

  // Actualizar cantidad de insumo
  updateQuantity(code, quantity) {
    return this.update(code, { quantity });
  },

  // Obtener insumos con stock bajo
  getLowStock() {
    const ingredients = this.getAll();
    return ingredients.filter(item => item.quantity <= item.min);
  },

  // Verificar si hay suficiente cantidad de un insumo
  hasEnough(code, needed) {
    const ingredient = this.getByCode(code);
    return ingredient && ingredient.quantity >= needed;
  }
};

// Inicializar al cargar
Inventory.init();
