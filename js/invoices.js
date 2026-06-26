// Gestión de facturas

const Invoices = {
  INVOICES_KEY: 'minefood_invoices',

  init() {
    const existingInvoices = localStorage.getItem(this.INVOICES_KEY);
    if (!existingInvoices) {
      localStorage.setItem(this.INVOICES_KEY, JSON.stringify([]));
      console.log('Facturas inicializadas');
    }
  },

  getAll() {
    const invoices = localStorage.getItem(this.INVOICES_KEY);
    return invoices ? JSON.parse(invoices) : [];
  },

  add(invoice) {
    const invoices = this.getAll();
    invoices.push(invoice);
    localStorage.setItem(this.INVOICES_KEY, JSON.stringify(invoices));
    return invoice;
  },

  getById(invoiceNumber) {
    const invoices = this.getAll();
    return invoices.find(inv => inv.number === invoiceNumber);
  },

  reset() {
    localStorage.setItem(this.INVOICES_KEY, JSON.stringify([]));
    return [];
  }
};

Invoices.init();
