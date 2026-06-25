// Gestión de pedidos con LocalStorage

const Orders = {
  ORDERS_KEY: 'minefood_orders',

  init() {
    const existingOrders = localStorage.getItem(this.ORDERS_KEY);
    if (!existingOrders) {
      const demoOrders = window.mcData?.orders || [];
      localStorage.setItem(this.ORDERS_KEY, JSON.stringify(demoOrders));
      console.log('Pedidos inicializados con datos de demo');
      return;
    }

    const normalizedOrders = this.normalizeOrders(JSON.parse(existingOrders));
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(normalizedOrders));
  },

  // Convertir pedidos antiguos al formato actual
  normalizeOrders(orders) {
    const dishes = window.mcData?.dishes || [];
    return orders.map(order => ({
      ...order,
      items: (order.items || []).map(item => {
        if (item.code && item.quantity !== undefined) return item;

        const dish = dishes.find(demoDish => demoDish.name === item.name);
        return {
          code: dish ? dish.code : item.code,
          quantity: item.quantity || item.qty || 1
        };
      }).filter(item => item.code)
    }));
  },

  getAll() {
    const orders = JSON.parse(localStorage.getItem(this.ORDERS_KEY)) || [];
    return this.normalizeOrders(orders);
  },

  getById(id) {
    const orders = this.getAll();
    return orders.find(order => order.id === id);
  },

  generateId() {
    const orders = this.getAll();
    const maxId = orders.reduce((max, order) => {
      const num = parseInt(order.id.replace('PED-', ''));
      return num > max ? num : max;
    }, 0);
    return `PED-${String(maxId + 1).padStart(3, '0')}`;
  },

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

  validateInventory(items) {
    for (const item of items) {
      if (!Dishes.canPrepare(item.code, item.quantity)) {
        return false;
      }
    }
    return true;
  },

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

  add(orderData) {
    const orders = this.getAll();
    
    if (orders.find(order => order.id === orderData.id)) {
      throw new Error('Ya existe un pedido con ese ID');
    }

    const total = this.calculateTotal(orderData.items);

    const newOrder = {
      id: orderData.id,
      customer: orderData.customer,
      phone: orderData.phone,
      table: orderData.table,
      status: orderData.status || 'pending',
      paymentMethod: orderData.paymentMethod || 'cash',
      items: orderData.items,
      total: parseFloat(total),
      createdAt: new Date().toISOString()
    };

    // NO descontar inventario al crear (se descuenta al pasar a preparing)
    orders.push(newOrder);
    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(orders));
    return newOrder;
  },

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

  updateStatus(id, status) {
    return this.update(id, { status });
  },

  delete(id) {
    const orders = this.getAll();
    const filtered = orders.filter(order => order.id !== id);
    
    if (filtered.length === orders.length) {
      throw new Error('Pedido no encontrado');
    }

    localStorage.setItem(this.ORDERS_KEY, JSON.stringify(filtered));
  },

  getByStatus(status) {
    const orders = this.getAll();
    return orders.filter(order => order.status === status);
  },

  getStats() {
    const orders = this.getAll();
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const statusCounts = {
      pending: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      paid: 0
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

Orders.init();
