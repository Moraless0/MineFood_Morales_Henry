// UI para reportes dinámicos basados en datos reales

document.addEventListener('DOMContentLoaded', function() {
  updateReportStats();
  updateTopDishes();
  updateIngredientUsage();
});

// Actualizar cuando la vista de reportes se active
window.addEventListener('viewChange', function(e) {
  if (e.detail.viewId === 'view-reports') {
    updateReportStats();
    updateTopDishes();
    updateIngredientUsage();
  }
});

function updateReportStats() {
  const stats = Orders.getStats();
  const orders = Orders.getAll();

  // Ventas totales
  const salesValue = document.querySelector('.mc-stat-card__value');
  if (salesValue && salesValue.parentElement.querySelector('.mc-stat-card__label')?.textContent.includes('Ventas totales')) {
    salesValue.textContent = `$${parseFloat(stats.totalSales).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  }

  // Pedidos
  const ordersValue = document.querySelectorAll('.mc-stat-card__value')[1];
  if (ordersValue && ordersValue.parentElement.querySelector('.mc-stat-card__label')?.textContent.includes('Pedidos')) {
    ordersValue.textContent = stats.totalOrders;
  }

  // Items vendidos
  const itemsSold = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);
  const itemsValue = document.querySelectorAll('.mc-stat-card__value')[2];
  if (itemsValue && itemsValue.parentElement.querySelector('.mc-stat-card__label')?.textContent.includes('Items vendidos')) {
    itemsValue.textContent = itemsSold;
  }

  // Promedio por pedido
  const avgValue = document.querySelectorAll('.mc-stat-card__value')[3];
  if (avgValue && avgValue.parentElement.querySelector('.mc-stat-card__label')?.textContent.includes('Promedio')) {
    const avg = stats.totalOrders > 0 ? (parseFloat(stats.totalSales) / stats.totalOrders).toFixed(2) : '0.00';
    avgValue.textContent = `$${parseFloat(avg).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  }
}

function updateTopDishes() {
  const orders = Orders.getAll();
  const dishCounts = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const dish = Dishes.getByCode(item.code);
      if (dish) {
        dishCounts[dish.name] = (dishCounts[dish.name] || 0) + item.quantity;
      }
    });
  });

  const sorted = Object.entries(dishCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const chartContainer = document.querySelector('.mc-chart-bar');
  if (!chartContainer) return;

  const max = sorted.length > 0 ? sorted[0][1] : 1;

  chartContainer.innerHTML = sorted.map(([name, count]) => {
    const height = (count / max) * 100;
    const shortName = name.split(' ').slice(0, 2).join(' ');
    return `
      <div class="mc-chart-bar__item">
        <div class="mc-chart-bar__bar" data-value="${count}" style="height: ${height}%;"></div>
        <div class="mc-chart-bar__label">${shortName}</div>
      </div>
    `;
  }).join('');
}

function updateIngredientUsage() {
  const orders = Orders.getAll();
  const ingredientUsage = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const dish = Dishes.getByCode(item.code);
      if (dish && dish.ingredients) {
        Object.entries(dish.ingredients).forEach(([code, amount]) => {
          const totalAmount = amount * item.quantity;
          ingredientUsage[code] = (ingredientUsage[code] || 0) + totalAmount;
        });
      }
    });
  });

  const sorted = Object.entries(ingredientUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const tbody = document.querySelector('.mc-table tbody');
  if (!tbody) return;

  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="mc-empty-state">Sin datos de consumo aún.</td></tr>';
    return;
  }

  const max = sorted.length > 0 ? sorted[0][1] : 1;

  tbody.innerHTML = sorted.map(([code, amount]) => {
    const ingredient = Inventory.getByCode(code);
    const name = ingredient ? ingredient.name : code;
    const unit = ingredient ? ingredient.unit : '';
    const percent = ((amount / max) * 100).toFixed(0);
    return `
      <tr>
        <td data-label="Insumo">${name}</td>
        <td data-label="Usado">${amount.toFixed(2)} ${unit}</td>
        <td data-label="%">${percent}%</td>
      </tr>
    `;
  }).join('');
}
