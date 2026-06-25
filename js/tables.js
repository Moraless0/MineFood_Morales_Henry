// Gestión de mesas con LocalStorage

const Tables = {
  TABLES_KEY: 'minefood_tables',
  TABLE_COUNT: 12,

  init() {
    const existingTables = localStorage.getItem(this.TABLES_KEY);
    if (!existingTables) {
      const tables = this.createDefaultTables();
      localStorage.setItem(this.TABLES_KEY, JSON.stringify(tables));
      console.log('Mesas inicializadas');
    }
  },

  createDefaultTables() {
    const tables = [];
    for (let i = 1; i <= this.TABLE_COUNT; i++) {
      tables.push({
        number: i,
        status: 'free',
        currentOrder: null,
        occupiedSince: null,
        total: 0
      });
    }
    return tables;
  },

  getAll() {
    const tables = localStorage.getItem(this.TABLES_KEY);
    return tables ? JSON.parse(tables) : this.createDefaultTables();
  },

  getByNumber(number) {
    const tables = this.getAll();
    return tables.find(table => table.number === number);
  },

  updateStatus(number, status, orderId = null) {
    const tables = this.getAll();
    const index = tables.findIndex(table => table.number === number);
    
    if (index === -1) {
      throw new Error('Mesa no encontrada');
    }

    if (status === 'occupied' && !orderId) {
      throw new Error('Se requiere un ID de pedido para ocupar la mesa');
    }

    tables[index].status = status;
    
    if (status === 'occupied') {
      const isSameActiveOrder = tables[index].currentOrder === orderId && tables[index].occupiedSince;
      tables[index].currentOrder = orderId;
      tables[index].occupiedSince = isSameActiveOrder ? tables[index].occupiedSince : new Date().toISOString();
    } else if (status === 'free') {
      tables[index].currentOrder = null;
      tables[index].occupiedSince = null;
      tables[index].total = 0;
    }

    localStorage.setItem(this.TABLES_KEY, JSON.stringify(tables));
    return tables[index];
  },

  updateTotal(number, total) {
    const tables = this.getAll();
    const index = tables.findIndex(table => table.number === number);
    
    if (index === -1) {
      throw new Error('Mesa no encontrada');
    }

    tables[index].total = total;
    localStorage.setItem(this.TABLES_KEY, JSON.stringify(tables));
    return tables[index];
  },

  getOccupiedTime(number) {
    const table = this.getByNumber(number);
    if (!table || !table.occupiedSince) return null;
    
    const occupied = new Date(table.occupiedSince);
    const now = new Date();
    const diff = now - occupied;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  },

  getStats() {
    const tables = this.getAll();
    const stats = {
      total: tables.length,
      free: 0,
      occupied: 0,
      paying: 0
    };

    tables.forEach(table => {
      stats[table.status]++;
    });

    return stats;
  },

  reset() {
    const tables = this.createDefaultTables();
    localStorage.setItem(this.TABLES_KEY, JSON.stringify(tables));
    return tables;
  }
};

Tables.init();
