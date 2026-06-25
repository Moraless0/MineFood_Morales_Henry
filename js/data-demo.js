window.mcData = {
  ingredients: [
    { code: 'ZAN-001', name: 'Zanahoria', description: 'Zanahoria fresca, ideal para ensaladas doradas.', quantity: 18, unit: 'kg', min: 5 },
    { code: 'TRI-002', name: 'Trigo', description: 'Trigo molido para pan y pasteles.', quantity: 12, unit: 'kg', min: 10 },
    { code: 'REM-003', name: 'Remolacha', description: 'Remolacha roja para sopas y ensaladas.', quantity: 6, unit: 'kg', min: 8 },
    { code: 'BAY-004', name: 'Bayas Dulces', description: 'Bayas dulces para postres y jugos.', quantity: 20, unit: 'kg', min: 6 },
    { code: 'MEL-005', name: 'Melón', description: 'Melón jugoso para jugos pixelados.', quantity: 14, unit: 'kg', min: 4 },
    { code: 'CHA-006', name: 'Champiñones', description: 'Champiñones del bosque para estofados.', quantity: 5, unit: 'kg', min: 6 },
    { code: 'ALG-007', name: 'Algas', description: 'Algas marinas para sopas del bosque.', quantity: 22, unit: 'kg', min: 3 },
    { code: 'BAM-008', name: 'Bambú', description: 'Bambú fresco para rolls y ensaladas.', quantity: 9, unit: 'kg', min: 5 }
  ],
  dishes: [
    { code: 'PLT-001', name: 'Ensalada de Zanahoria Dorada', description: 'Ensalada crujiente con zanahoria, algas y aderezo.', price: 12.50, icon: '🥕', ingredients: { 'ZAN-001': 0.3, 'ALG-007': 0.1 } },
    { code: 'PLT-002', name: 'Estofado de Champiñones', description: 'Estofado cremoso de champiñones y bambú.', price: 15.00, icon: '🍄', ingredients: { 'CHA-006': 0.4, 'BAM-008': 0.2 } },
    { code: 'PLT-003', name: 'Pan del Aldeano', description: 'Pan artesanal de trigo con un toque de remolacha.', price: 8.00, icon: '🍞', ingredients: { 'TRI-002': 0.5, 'REM-003': 0.1 } },
    { code: 'PLT-004', name: 'Pastel de Bayas Dulces', description: 'Pastel esponjoso relleno de bayas dulces.', price: 18.00, icon: '🍰', ingredients: { 'BAY-004': 0.3, 'TRI-002': 0.2 } },
    { code: 'PLT-005', name: 'Sopa del Bosque Encantado', description: 'Sopa caliente de champiñones, bambú y algas.', price: 13.50, icon: '🍲', ingredients: { 'CHA-006': 0.2, 'BAM-008': 0.1, 'ALG-007': 0.1 } },
    { code: 'PLT-006', name: 'Jugo de Melón Pixelado', description: 'Jugo refrescante de melón con bayas dulces.', price: 7.00, icon: '🍹', ingredients: { 'MEL-005': 0.4, 'BAY-004': 0.1 } }
  ],
  orders: [
    { id: 'PED-001', table: 'Mesa 3', customer: 'Steve', phone: '3001112233', status: 'preparing', total: 37.00, createdAt: '2026-06-25T08:00:00.000Z', items: [{ code: 'PLT-002', quantity: 2 }, { code: 'PLT-006', quantity: 1 }] },
    { id: 'PED-002', table: 'Mesa 7', customer: 'Alex', phone: '3002223344', status: 'pending', total: 20.50, createdAt: '2026-06-25T08:20:00.000Z', items: [{ code: 'PLT-001', quantity: 1 }, { code: 'PLT-003', quantity: 1 }] },
    { id: 'PED-003', table: 'Mesa 2', customer: 'Aldeano', phone: '3003334455', status: 'delivered', total: 56.50, createdAt: '2026-06-25T08:40:00.000Z', items: [{ code: 'PLT-004', quantity: 2 }, { code: 'PLT-005', quantity: 1 }, { code: 'PLT-006', quantity: 1 }] },
    { id: 'PED-004', table: 'Mesa 5', customer: 'Minero', phone: '3004445566', status: 'pending', total: 36.50, createdAt: '2026-06-25T09:00:00.000Z', items: [{ code: 'PLT-005', quantity: 1 }, { code: 'PLT-003', quantity: 2 }, { code: 'PLT-006', quantity: 1 }] }
  ],
  stats: {
    totalSales: 138.50,
    totalOrders: 4,
    topDishes: [
      { name: 'Jugo de Melón Pixelado', count: 3 },
      { name: 'Estofado de Champiñones', count: 2 },
      { name: 'Pastel de Bayas Dulces', count: 2 },
      { name: 'Sopa del Bosque Encantado', count: 2 },
      { name: 'Pan del Aldeano', count: 2 }
    ],
    ingredientUsage: [
      { name: 'Melón', amount: 1.6 },
      { name: 'Champiñones', amount: 1.2 },
      { name: 'Trigo', amount: 1.0 },
      { name: 'Bayas Dulces', amount: 0.9 },
      { name: 'Bambú', amount: 0.7 }
    ]
  }
};
