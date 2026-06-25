// Gestión de inventario con LocalStorage

const Inventory = {
  INVENTORY_KEY: 'minefood_inventory',

  // Cargar datos de demo si es la primera vez
  init() {
    const existingInventory = localStorage.getItem(this.INVENTORY_KEY);
    if (!existingInventory) {
      const demoIngredients = window.mcData?.ingredients || [];
      localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(demoIngredients));
      console.log('Inventario inicializado con datos de demo');
    }
  },

  getAll() {
    return JSON.parse(localStorage.getItem(this.INVENTORY_KEY)) || [];
  },

  getByCode(code) {
    const ingredients = this.getAll();
    return ingredients.find(item => item.code === code);
  },

  add(ingredient) {
    const ingredients = this.getAll();
    
    if (ingredients.find(item => item.code === ingredient.code)) {
      throw new Error('Ya existe un insumo con ese código');
    }

    ingredients.push(ingredient);
    localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(ingredients));
    return ingredient;
  },

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

  delete(code) {
    const ingredients = this.getAll();
    const filtered = ingredients.filter(item => item.code !== code);
    
    if (filtered.length === ingredients.length) {
      throw new Error('Insumo no encontrado');
    }

    localStorage.setItem(this.INVENTORY_KEY, JSON.stringify(filtered));
  },

  updateQuantity(code, quantity) {
    return this.update(code, { quantity });
  },

  getLowStock() {
    const ingredients = this.getAll();
    return ingredients.filter(item => item.quantity <= item.min);
  },

  hasEnough(code, needed) {
    const ingredient = this.getByCode(code);
    return ingredient && ingredient.quantity >= needed;
  }
};

Inventory.init();
