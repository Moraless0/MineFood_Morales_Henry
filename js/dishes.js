// Gestión de platillos con LocalStorage

const Dishes = {
  DISHES_KEY: 'minefood_dishes',

  // Cargar datos de demo si es la primera vez
  init() {
    const existingDishes = localStorage.getItem(this.DISHES_KEY);
    if (!existingDishes) {
      const demoDishes = window.mcData?.dishes || [];
      localStorage.setItem(this.DISHES_KEY, JSON.stringify(demoDishes));
      console.log('Platillos inicializados con datos de demo');
    }
  },

  getAll() {
    return JSON.parse(localStorage.getItem(this.DISHES_KEY)) || [];
  },

  getByCode(code) {
    const dishes = this.getAll();
    return dishes.find(item => item.code === code);
  },

  add(dish) {
    const dishes = this.getAll();
    
    if (dishes.find(item => item.code === dish.code)) {
      throw new Error('Ya existe un platillo con ese código');
    }

    dishes.push(dish);
    localStorage.setItem(this.DISHES_KEY, JSON.stringify(dishes));
    return dish;
  },

  update(code, updatedData) {
    const dishes = this.getAll();
    const index = dishes.findIndex(item => item.code === code);
    
    if (index === -1) {
      throw new Error('Platillo no encontrado');
    }

    dishes[index] = { ...dishes[index], ...updatedData };
    localStorage.setItem(this.DISHES_KEY, JSON.stringify(dishes));
    return dishes[index];
  },

  delete(code) {
    const dishes = this.getAll();
    const filtered = dishes.filter(item => item.code !== code);
    
    if (filtered.length === dishes.length) {
      throw new Error('Platillo no encontrado');
    }

    localStorage.setItem(this.DISHES_KEY, JSON.stringify(filtered));
  },

  // Calcular ingredientes necesarios para X cantidad de un platillo
  calculateIngredients(dishCode, quantity) {
    const dish = this.getByCode(dishCode);
    if (!dish) return {};

    const ingredients = {};
    for (const [ingredientCode, amount] of Object.entries(dish.ingredients)) {
      ingredients[ingredientCode] = amount * quantity;
    }
    return ingredients;
  },

  // Verificar si hay inventario suficiente para preparar un platillo
  canPrepare(dishCode, quantity) {
    const dish = this.getByCode(dishCode);
    if (!dish) return false;

    const requiredIngredients = this.calculateIngredients(dishCode, quantity);
    
    for (const [ingredientCode, needed] of Object.entries(requiredIngredients)) {
      if (!Inventory.hasEnough(ingredientCode, needed)) {
        return false;
      }
    }
    return true;
  }
};

Dishes.init();
