// Utilidades del proyecto

const Utils = {
  roundToDecimals(num, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  },

  formatPrice(price) {
    return this.roundToDecimals(price).toFixed(2);
  },

  calculateSubtotal(price, quantity) {
    return this.roundToDecimals(price * quantity);
  },

  calculateTotal(items) {
    return items.reduce((sum, item) => {
      const subtotal = this.calculateSubtotal(item.price, item.quantity);
      return this.roundToDecimals(sum + subtotal);
    }, 0);
  }
};
