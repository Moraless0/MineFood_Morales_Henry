// Módulo de gestión de pedidos con LocalStorage

const Orders = {
  // Clave para guardar pedidos en localStorage
  ORDERS_KEY: 'minefood_orders',

  // Inicializar pedidos con datos de demo si no existe
  init() {
    const existingOrders = localStorage.getItem(this.ORDERS_KEY);
    if (!existingOrders) {
      // Usar datos de demo
      const demoOrders = window.mcData?.orders || [];
      localStorage.setItem(this.ORDERS_KEY, JSON.stringify(demoOrders));
      console.log('Pedidos inicializados con datos de demo');
    }
  },

  // Obtener todos los pedidos
  getAll() {
    return JSON.parse(localStorage.getItem(this.ORDERS_KEY)) || [];
  },

  // Obtener pedido por ID
  getById(id) {
    const orders = this.getAll();
    return orders.find(order => order.id === id);
  },

  // Generar nuevo ID de pedido
  generateId() {
    const orders = this.getAll();
    const maxId = orders.reduce((max, order) => {
      const num = parseInt(order.id.replace('PED-', ''));
      return num > max ? num : max;
    }, 0);
    return `PED-${String(maxId + 1).padStart(3, '0')}`;
  },

  // Calcular total de un pedido
  calculateTotal(items) {
    let total = 0;
    for (const item of items) {
      const dish = Dishes.getByCode(item.code);
      if (dish) {
        total += dish.price * item.quantity;
      }
    }
    return total.toFixed(2);
  },

  // Verificar si hay suficiente inventario para los items del pedido
  validateInventory(items) {
    for (const item of items) {
      if (!Dishes.canPrepare(item.code, item.quantity)) {
        return false;
      }
    }
    return true;
  },

  // Descontar inventario al crear pedido
  deductInventory(items) {
    for (const item of items) {
      const dish = Dishes.getByCode(item.code);
      if (dish) {
        const requiredIngredients = Dishes.calculateIngredients(item.code, item.quantity);
        for (const [ingredientCode, amount] of Object.entries(requiredIngredients)) {
          const ingredient = Inventory.getByCode(ingredientCode);
          if (ingredient) {
            Inventory.updateQuantity(ingredientCode, ingredient.quantity - amount);
          }
        }
      }
    }
  },

  // Crear nuevo pedido
  add(orderData) {
    const orders = this.getAll();
    
    // Validar que el ID no exista
    if (orders.find(order => order.id === orderData.id)) {
      throw new Error('Ya existe un pedido con ese ID');
    }

    // Validar inventario
    if (!this.validateInventory(orderData.items)) {
      throw new Error('Inventario insuficiente para preparar los platillos');
    }

    // Calcular total
    const total = this.calculateTotal(orderData.items);

    const newOrder = {
      id: orderData.id,
      customer: orderData.customer,
      phone: orderData.phone,
      table: orderData.table,
      status: orderData.status || 'pending',
      items: orderData.items,
      total: parseFloat(total),
      createdAt: new Date().toISOString()
    };

    // Descontar inventario
    this.deductInventory(orderData.items);

    orders.push(newOrder);
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
    return newOrder;
  },

  // Actualizar pedido
  update(id, updatedData) {
    const orders = this.getAll();
    const index = orders.findIndex(order => order.id === id);
    
    if (index === -1) {
      throw new Error('Pedido no encontrado');
    }

    orders[index] = { ...orders[index], ...updatedData };
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
    return orders[index];
  },

  // Actualizar estado de pedido
  updateStatus(id, status) {
    return this.update(id, { status });
  },

  // Eliminar pedido
  delete(id) {
    const orders = this.getAll();
    const filtered = orders.filter(order => order.id !== id);
    
    if (filtered.length === orders.length) {
      throw new Error('Pedido no encontrado');
    }

    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(filtered));
  },

  // Obtener pedidos por estado
  getByStatus(status) {
    const orders = this.getAll();
    return orders.filter(order => order.status === status);
  },

  // Obtener estadísticas de pedidos
  getStats() {
    const orders = this.getAll();
    const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
    const statusCounts = {
      pending: 0,
      preparing: 0,
      delivered: 0
    };

    orders.forEach(order => {
      if (statusCounts[order.status] !== undefined) {
        statusCounts[order.status]++;
      }
    });

    return {
      totalOrders: orders.length,
      totalSales: totalSales.toFixed(2),
      statusCounts
    };
  }
};

// Inicializar al cargar
Orders.init();
