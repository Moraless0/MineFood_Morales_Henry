// Módulo de gestión de platillos con LocalStorage

const Dishes = {
  // Clave para guardar platillos en localStorage
  DISHES_KEY: 'minefood_dishes',

  // Inicializar platillos con datos de demo si no existe
  init() {
    const existingDishes = localStorage.getItem(this.DISHES_KEY);
    if (!existingDishes) {
      // Usar datos de demo
      const demoDishes = window.mcData?.dishes || [];
      localStorage.setItem(this.DISHES_KEY, JSON.stringify(demoDishes));
      console.log('Platillos inicializados con datos de demo');
    }
  },

  // Obtener todos los platillos
  getAll() {
    return JSON.parse(localStorage.getItem(this.DISHES_KEY)) || [];
  },

  // Obtener platillo por código
  getByCode(code) {
    const dishes = this.getAll();
    return dishes.find(item => item.code === code);
  },

  // Agregar nuevo platillo
  add(dish) {
    const dishes = this.getAll();
    
    // Validar que el código no exista
    if (dishes.find(item => item.code === dish.code)) {
      throw new Error('Ya existe un platillo con ese código');
    }

    dishes.push(dish);
    localStorage.setItem(this.DISHES_KEY, JSON.stringify(dishes));
    return dish;
  },

  // Actualizar platillo
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

  // Eliminar platillo
  delete(code) {
    const dishes = this.getAll();
    const filtered = dishes.filter(item => item.code !== code);
    
    if (filtered.length === dishes.length) {
      throw new Error('Platillo no encontrado');
    }

    localStorage.setItem(this.DISHES_KEY, JSON.stringify(filtered));
  },

  // Calcular ingredientes necesarios para un platillo con cantidad
  calculateIngredients(dishCode, quantity) {
    const dish = this.getByCode(dishCode);
    if (!dish) return {};

    const ingredients = {};
    for (const [ingredientCode, amount] of Object.entries(dish.ingredients)) {
      ingredients[ingredientCode] = amount * quantity;
    }
    return ingredients;
  },

  // Verificar si hay suficiente inventario para preparar un platillo
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

// Inicializar al cargar
Dishes.init();
